"""
Agent FastAPI Router — with Human-in-the-Loop approval
=======================================================
Endpoints:
  POST /agent/run                 → Start agent, runs until approval pause
  GET  /agent/status/{thread_id}  → Check if paused or complete
  POST /agent/approve/{thread_id} → User approves payment → checkout
  POST /agent/reject/{thread_id}  → User rejects → cancel, preserve cart

Two-phase flow:
  Phase 1: POST /agent/run
    - Validates user + cart
    - Starts the LangGraph
    - Graph runs until interrupt() at request_payment_approval node
    - Returns HTTP 202 with cart summary and thread_id

  Phase 2: POST /agent/approve/{thread_id} OR POST /agent/reject/{thread_id}
    - Resumes the graph with Command(resume={"approved": True/False})
    - Graph completes: checkout or cancel
    - Returns HTTP 200 with final order details
"""

import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from langgraph.types import Command
from sqlalchemy.orm import Session

from app.agent.graph import shopping_agent
from app.agent.schemas import (
    AgentApproveRequest,
    AgentFinalResponse,
    AgentRejectRequest,
    AgentRunRequest,
    AgentStartResponse,
    AgentStatusResponse,
)
from app.database import get_db
from app.models import Cart as CartModel, User as UserModel
from app.redis import get_redis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["Agent"])

# Redis key prefix for storing pending run metadata
_PENDING_KEY = "agent:pending:{thread_id}"
_PENDING_TTL = 1800  # 30 minutes to approve


def _save_pending(thread_id: str, run_id: str, interrupt_payload: dict) -> None:
    """Store the interrupt payload in Redis so GET /status can read it."""
    try:
        redis = get_redis()
        data = json.dumps({
            "run_id": run_id,
            "interrupt_payload": interrupt_payload,
            "status": "awaiting_approval",
        })
        redis.setex(_PENDING_KEY.format(thread_id=thread_id), _PENDING_TTL, data)
    except Exception as e:
        logger.warning(f"[agent] Could not save pending run {thread_id} to Redis: {e}")


def _get_pending(thread_id: str) -> dict | None:
    """Retrieve the pending run metadata from Redis, falling back to checkpointer."""
    try:
        redis = get_redis()
        raw = redis.get(_PENDING_KEY.format(thread_id=thread_id))
        if raw:
            return json.loads(raw)
    except Exception as e:
        logger.warning(f"[agent] Could not read pending run {thread_id} from Redis: {e}")

    # Fallback: check LangGraph checkpointer for this thread
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = shopping_agent.get_state(config)
        if state and state.values:
            tasks = state.tasks or ()
            interrupts = [i for t in tasks for i in getattr(t, "interrupts", ())]
            payload = getattr(interrupts[0], "value", {}) if interrupts else {}
            has_error = bool(state.values.get("error"))
            user_approved = state.values.get("user_approved")
            has_order = bool(state.values.get("checkout_result"))

            if interrupts:
                status = "awaiting_approval"
            elif has_error:
                status = "failed"
            elif user_approved and has_order:
                status = "completed"
            elif user_approved is False:
                status = "cancelled"
            else:
                status = "completed"

            return {
                "run_id": state.values.get("run_id", ""),
                "interrupt_payload": payload,
                "status": status,
            }
    except Exception as e:
        logger.warning(f"[agent] Checkpointer fallback check failed for {thread_id}: {e}")

    return None


def _clear_pending(thread_id: str) -> None:
    """Remove the pending run metadata from Redis after resume."""
    try:
        redis = get_redis()
        redis.delete(_PENDING_KEY.format(thread_id=thread_id))
    except Exception as e:
        logger.warning(f"[agent] Could not delete pending run {thread_id} from Redis: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /agent/run
# Phase 1: Start the agent, runs until approval interrupt
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/run",
    response_model=AgentStartResponse,
    status_code=202,
    summary="Start the shopping agent (pauses for payment approval)",
)
def run_agent(body: AgentRunRequest, db: Session = Depends(get_db)):
    # ── Validate user + cart ──────────────────────────────────────────────────
    user = db.query(UserModel).filter(UserModel.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cart = db.query(CartModel).filter(CartModel.id == body.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    if cart.user_id != body.user_id:
        raise HTTPException(status_code=403, detail="Cart does not belong to this user")

    # ── Generate IDs ──────────────────────────────────────────────────────────
    run_id = body.run_id or str(uuid.uuid4())
    thread_id = str(uuid.uuid4())          # Links pause → resume
    idempotency_key = str(uuid.uuid4())    # Prevents double checkout on retry

    # ── Build initial state ───────────────────────────────────────────────────
    initial_state = {
        "query": body.query,
        "user_id": body.user_id,
        "cart_id": body.cart_id,
        "budget": 0,
        "category": None,
        "run_id": run_id,
        "products": [],
        "in_stock_products": [],
        "chosen_products": [],
        "cart_items_added": [],
        "cart_summary": {},
        "final_message": "",
        "error": "",
        "approval_status": "pending",
        "checkout_result": {},
        "user_approved": False,
        "idempotency_key": idempotency_key,
    }

    # ── Thread config — LangGraph identifies saved state via thread_id ────────
    config = {"configurable": {"thread_id": thread_id}}

    try:
        logger.info(f"[agent] Starting run {run_id}, thread {thread_id}")

        result = shopping_agent.invoke(
            initial_state,
            config=config,
        )

        # ── Check if graph paused at interrupt() ──────────────────────────────
        interrupts = result.get("__interrupt__", [])

        if interrupts:
            interrupt_obj = interrupts[0]
            payload = getattr(interrupt_obj, "value", {}) or {}

            logger.info(f"[agent] Graph paused for approval. thread_id={thread_id}")

            _save_pending(
                thread_id=thread_id,
                run_id=run_id,
                interrupt_payload=payload,
            )

            return AgentStartResponse(
                status="awaiting_approval",
                thread_id=thread_id,
                run_id=run_id,
                query=body.query,
                cart_summary=payload.get("cart_summary", {}),
                items_added=payload.get("items_added", []),
                cart_total=payload.get("cart_total", 0),
                message=payload.get(
                    "message",
                    "Please review your cart and approve payment.",
                ),
            )

        # ── Graph completed without needing approval (e.g. no products found) ─
        cart_sum = result.get("cart_summary", {})
        return AgentStartResponse(
            status="no_action_needed",
            thread_id=thread_id,
            run_id=run_id,
            query=body.query,
            cart_summary=cart_sum,
            items_added=result.get("cart_items_added", []),
            cart_total=cart_sum.get("total", 0),
            message=result.get("final_message") or "Agent completed: no items were added to the cart.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[agent] Run {run_id} failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Agent run failed: {str(e)}",
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /agent/status/{thread_id}
# Check if a paused run is still waiting for approval
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/status/{thread_id}",
    response_model=AgentStatusResponse,
    summary="Check the status of a paused agent run",
)
def get_agent_status(thread_id: str):
    pending = _get_pending(thread_id)

    if not pending:
        return AgentStatusResponse(
            thread_id=thread_id,
            run_id="",
            status="not_found",
            cart_summary={},
            items_added=[],
        )

    payload = pending.get("interrupt_payload", {})

    return AgentStatusResponse(
        thread_id=thread_id,
        run_id=pending.get("run_id", ""),
        status=pending.get("status", "awaiting_approval"),
        cart_summary=payload.get("cart_summary", {}),
        items_added=payload.get("items_added", []),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /agent/approve/{thread_id}
# Phase 2a: User approves — resume graph → process checkout
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/approve/{thread_id}",
    response_model=AgentFinalResponse,
    status_code=200,
    summary="Approve payment — resumes graph and calls checkout",
)
def approve_payment(thread_id: str, body: AgentApproveRequest = AgentApproveRequest()):
    pending = _get_pending(thread_id)
    if not pending:
        raise HTTPException(
            status_code=404,
            detail=f"No pending approval found for thread_id={thread_id}. "
                   f"It may have expired or already been resolved."
        )

    run_id = pending["run_id"]
    config = {"configurable": {"thread_id": thread_id}}

    try:
        logger.info(f"[agent] User APPROVED payment for thread {thread_id}")

        final_state = shopping_agent.invoke(
            Command(resume={"approved": True}),
            config=config,
        )

        _clear_pending(thread_id)

        order = final_state.get("checkout_result", {})
        error_msg = final_state.get("error", "")
        status = "failed" if (error_msg or not order.get("id")) else "completed"

        return AgentFinalResponse(
            status=status,
            thread_id=thread_id,
            run_id=run_id,
            approved=True,
            order_id=order.get("id"),
            final_message=final_state.get("final_message", ""),
            error=error_msg,
        )

    except Exception as e:
        logger.exception(f"[agent] Checkout failed for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /agent/reject/{thread_id}
# Phase 2b: User rejects — resume graph → cancel, preserve cart
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/reject/{thread_id}",
    response_model=AgentFinalResponse,
    status_code=200,
    summary="Reject payment — cancels checkout, cart is preserved",
)
def reject_payment(thread_id: str, body: AgentRejectRequest = AgentRejectRequest()):
    pending = _get_pending(thread_id)
    if not pending:
        raise HTTPException(
            status_code=404,
            detail=f"No pending approval found for thread_id={thread_id}."
        )

    run_id = pending["run_id"]
    config = {"configurable": {"thread_id": thread_id}}

    try:
        logger.info(f"[agent] User REJECTED payment for thread {thread_id}")

        final_state = shopping_agent.invoke(
            Command(resume={"approved": False, "reason": body.reason or ""}),
            config=config,
        )

        _clear_pending(thread_id)

        return AgentFinalResponse(
            status="cancelled",
            thread_id=thread_id,
            run_id=run_id,
            approved=False,
            order_id=None,
            final_message=final_state.get("final_message", "Payment cancelled."),
            error="",
        )

    except Exception as e:
        logger.exception(f"[agent] Reject flow failed for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Rejection failed: {str(e)}")
