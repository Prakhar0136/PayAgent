"""
Pydantic schemas for the /agent/run endpoint.
Separate from the main app schemas to keep things modular.
"""

from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    """Request body for POST /agent/run"""
    query: str = Field(
        min_length=3,
        max_length=500,
        description="Natural language shopping query",
        examples=["Find running shoes under ₹3000"]
    )
    user_id: int = Field(gt=0, description="The user running the agent")
    cart_id: int = Field(gt=0, description="Cart to add items into")
    run_id: str | None = Field(
        default=None,
        description="Optional custom run ID for event tracking. Auto-generated if not provided."
    )


class AgentRunResponse(BaseModel):
    """Response body for POST /agent/run"""
    run_id: str
    query: str
    budget: int
    products_found: int
    in_stock_count: int
    chosen_count: int
    items_added: list[dict]
    cart_summary: dict
    final_message: str
    error: str
