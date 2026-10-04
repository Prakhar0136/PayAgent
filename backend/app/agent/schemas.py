"""
Pydantic schemas for all /agent/* endpoints.
"""

from pydantic import BaseModel, Field
from typing import Literal


class AgentRunRequest(BaseModel):
    """Request body for POST /agent/run"""
    query: str = Field(min_length=3, max_length=500, examples=["Find running shoes under ₹3000"])
    user_id: int = Field(gt=0)
    cart_id: int = Field(gt=0)
    run_id: str | None = Field(default=None, description="Auto-generated if not provided")


class AgentStartResponse(BaseModel):
    """
    Response for POST /agent/run when the graph pauses at the approval step.
    HTTP 202 — the run has started but is waiting for user approval.
    """
    status: Literal["awaiting_approval", "no_action_needed"]
    thread_id: str          # Used to resume the graph (approve/reject)
    run_id: str
    query: str
    cart_summary: dict      # What was added to cart
    items_added: list[dict]
    cart_total: int
    message: str            # Human-readable prompt to the user


class AgentApproveRequest(BaseModel):
    """Request body for POST /agent/approve/{thread_id}"""
    # Nothing needed — the act of calling the endpoint IS the approval
    pass


class AgentRejectRequest(BaseModel):
    """Request body for POST /agent/reject/{thread_id}"""
    reason: str | None = Field(default=None, description="Optional rejection reason")


class AgentFinalResponse(BaseModel):
    """
    Response after the graph fully completes (approved or rejected).
    Returned by POST /agent/approve and POST /agent/reject.
    """
    status: Literal["completed", "cancelled", "failed"]
    thread_id: str
    run_id: str
    approved: bool
    order_id: int | None = None    # Set if approved and checkout succeeded
    final_message: str
    error: str

class AgentStatusResponse(BaseModel):
    """Response for GET /agent/status/{thread_id}"""
    thread_id: str
    run_id: str
    status: Literal["awaiting_approval", "completed", "cancelled", "failed", "not_found"]
    cart_summary: dict
    items_added: list[dict]
