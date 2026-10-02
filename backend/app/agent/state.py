"""
AgentState
==========
The shared mutable state that flows through every node in the LangGraph.
Every node READS from state and RETURNS a dict of keys it wants to update.
LangGraph merges those dicts automatically via reducer logic.
"""

from typing import TypedDict, Annotated
import operator


class AgentState(TypedDict):
    # ── Input ──────────────────────────────────────────────────────────────
    query: str              # Raw user query, e.g. "Find running shoes under ₹3000"
    user_id: int            # Which user is running this session
    cart_id: int            # Which cart to add items into
    budget: int             # Max price in rupees, extracted from query by the LLM
    run_id: str             # Unique ID for this agent run (used for event publishing)

    # ── Intermediate state ─────────────────────────────────────────────────
    # Annotated[list, operator.add] means lists are APPENDED (not replaced)
    # when multiple nodes update the same key
    products: Annotated[list[dict], operator.add]        # results from search_products
    in_stock_products: Annotated[list[dict], operator.add]  # filtered by inventory
    chosen_products: Annotated[list[dict], operator.add]    # LLM-chosen candidates

    # ── Output ─────────────────────────────────────────────────────────────
    cart_items_added: Annotated[list[dict], operator.add]   # items successfully added
    cart_summary: dict      # final GET /carts/{cart_id} response
    final_message: str      # human-readable LLM summary for the user
    error: str              # any error message; empty string means no error
