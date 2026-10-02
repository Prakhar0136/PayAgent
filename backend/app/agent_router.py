"""
Agent FastAPI Router
====================
Exposes POST /agent/run — the single entry point for the LangGraph shopping agent.

The endpoint:
1. Validates the request (user + cart must exist)
2. Initialises the LangGraph state
3. Invokes the compiled graph synchronously
4. Returns a structured result
5. All intermediate steps publish events to Redis (via publish_event in nodes.py)
   which you can poll via GET /agents/{run_id}/events
"""

import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User as UserModel, Cart as CartModel
from app.agent.graph import shopping_agent
from app.agent.schemas import AgentRunRequest, AgentRunResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["Agent"])


@router.post(
    "/run",
    response_model=AgentRunResponse,
    status_code=200,
    summary="Run the LangGraph shopping agent",
    description="""
Accepts a natural language query and runs the full LangGraph pipeline:
parse_query → search_products → check_inventory → check_budget → add_to_cart → verify_cart.

While running, events are published to Redis and can be streamed via GET /agents/{run_id}/events.
""",
)
def run_agent(
    body: AgentRunRequest,
    db: Session = Depends(get_db),
):
    # ── Validate user ─────────────────────────────────────────────────────────
    user = db.query(UserModel).filter(UserModel.id == body.user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # ── Validate cart ─────────────────────────────────────────────────────────
    cart = db.query(CartModel).filter(CartModel.id == body.cart_id).first()
    if cart is None:
        raise HTTPException(status_code=404, detail="Cart not found")

    if cart.user_id != body.user_id:
        raise HTTPException(status_code=403, detail="Cart does not belong to this user")

    # ── Generate run_id ───────────────────────────────────────────────────────
    run_id = body.run_id or str(uuid.uuid4())

    # ── Build initial state ───────────────────────────────────────────────────
    initial_state: dict = {
        "query": body.query,
        "user_id": body.user_id,
        "cart_id": body.cart_id,
        "budget": 0,           # will be set by parse_query node
        "run_id": run_id,
        "products": [],
        "in_stock_products": [],
        "chosen_products": [],
        "cart_items_added": [],
        "cart_summary": {},
        "final_message": "",
        "error": "",
    }

    # ── Run the graph ─────────────────────────────────────────────────────────
    try:
        logger.info(f"[agent] Starting run {run_id} for query: '{body.query}'")
        final_state = shopping_agent.invoke(initial_state)
        logger.info(f"[agent] Completed run {run_id}")
    except Exception as e:
        logger.exception(f"[agent] Run {run_id} failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Agent run failed: {str(e)}"
        )

    # ── Build response ────────────────────────────────────────────────────────
    return AgentRunResponse(
        run_id=run_id,
        query=body.query,
        budget=final_state.get("budget", 0),
        products_found=len(final_state.get("products", [])),
        in_stock_count=len(final_state.get("in_stock_products", [])),
        chosen_count=len(final_state.get("chosen_products", [])),
        items_added=final_state.get("cart_items_added", []),
        cart_summary=final_state.get("cart_summary", {}),
        final_message=final_state.get("final_message", ""),
        error=final_state.get("error", ""),
    )
