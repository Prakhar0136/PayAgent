"""
Graph Nodes
===========
Each function here is a LangGraph NODE.
A node receives the full AgentState and returns a PARTIAL dict
with only the keys it modifies. LangGraph merges this back into the state.

Node execution order:
  parse_query → search_products → check_inventory →
  check_budget → add_to_cart → verify_cart
"""

import os
import re
import json
import logging

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from app.agent.state import AgentState
from app.agent import tools as agent_tools
from app.events import publish_event
from langgraph.types import interrupt


logger = logging.getLogger(__name__)

# ── LLM setup (lazy singleton) ───────────────────────────────────────────────
# The LLM is NOT created at import time — only on first use.
# This lets the server start without GROQ_API_KEY being set yet.

_llm_instance = None

def _get_llm() -> ChatGroq:
    """Return the shared ChatGroq instance, creating it on first call."""
    global _llm_instance
    if _llm_instance is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. "
                "Add it to your .env file: GROQ_API_KEY=gsk_..."
            )
        _llm_instance = ChatGroq(
            model="qwen/qwen3.8-27b",
            api_key=api_key,
            temperature=0.0,
            max_tokens=1024,
        )
    return _llm_instance


# ─────────────────────────────────────────────────────────────────────────────
# NODE 0: parse_query
# Extracts budget and optional category from the raw user query using the LLM
# ─────────────────────────────────────────────────────────────────────────────

def parse_query(state: AgentState) -> dict:
    """
    Uses Groq LLM to extract:
      - budget (integer, in rupees)
      - category (string or null)
    from the user's natural language query.
    """
    publish_event(
        run_id=state["run_id"],
        event_type="parse",
        data={"message": f"Parsing query: {state['query']}"}
    )

    system = SystemMessage(content="""
You are a shopping assistant parser. Extract the budget and product category from the user's query.
Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{"budget": <integer in rupees>, "category": "<category name or null>"}

Rules:
- budget must be a plain integer (no currency symbols)
- If no budget is mentioned, use 999999
- category should be a broad category like "Shoes", "Electronics", etc., or null if unclear
""")
    human = HumanMessage(content=state["query"])

    response = _get_llm().invoke([system, human])
    raw = response.content.strip()

    # Strip markdown code fences if LLM wraps in ```json ... ```
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    try:
        parsed = json.loads(raw)
        budget = int(parsed.get("budget", 999999))
        category = parsed.get("category") or None
    except (json.JSONDecodeError, ValueError):
        # Fallback: try to extract number from query
        numbers = re.findall(r"\d+", state["query"])
        budget = int(numbers[-1]) if numbers else 999999
        category = None

    logger.info(f"[parse_query] budget={budget}, category={category}")

    publish_event(
        run_id=state["run_id"],
        event_type="parsed",
        data={"budget": budget, "category": category}
    )

    return {"budget": budget, "category": category}


# ─────────────────────────────────────────────────────────────────────────────
# NODE 1: node_search_products
# Fetches products from FastAPI matching the budget
# ─────────────────────────────────────────────────────────────────────────────

def node_search_products(state: AgentState) -> dict:
    """
    Searches your PostgreSQL-backed FastAPI for products within budget.
    Publishes a 'search' event, then a 'found' event.
    """
    publish_event(
        run_id=state["run_id"],
        event_type="search",
        data={"message": f"Searching products under ₹{state['budget']}..."}
    )

    category = state.get("category")
    products = []
    if category:
        try:
            products = agent_tools.search_products(
                max_price=state["budget"],
                category_name=category
            )
        except Exception as e:
            logger.warning(f"[search_products] Search with category '{category}' failed: {e}")

    # Fallback to general search if category search produced no results
    if not products:
        products = agent_tools.search_products(max_price=state["budget"])

    logger.info(f"[search_products] Found {len(products)} products")

    publish_event(
        run_id=state["run_id"],
        event_type="found",
        data={
            "message": f"Found {len(products)} products under ₹{state['budget']}",
            "count": len(products),
            "products": products,
        }
    )

    return {"products": products}


# ─────────────────────────────────────────────────────────────────────────────
# NODE 2: node_check_inventory
# Checks each product's stock level via GET /inventory/{product_id}
# ─────────────────────────────────────────────────────────────────────────────

def node_check_inventory(state: AgentState) -> dict:
    """
    For every product returned by search, calls the inventory endpoint.
    Keeps only products with quantity > 0.
    """
    publish_event(
        run_id=state["run_id"],
        event_type="inventory",
        data={"message": "Checking inventory for each product..."}
    )

    in_stock = []
    for product in state["products"]:
        inv = agent_tools.check_inventory(product["id"])
        if inv["quantity"] > 0:
            # Enrich the product dict with stock info
            in_stock.append({**product, "stock": inv["quantity"]})

    logger.info(f"[check_inventory] {len(in_stock)} products in stock")

    publish_event(
        run_id=state["run_id"],
        event_type="inventory_done",
        data={
            "message": f"{len(in_stock)} products in stock",
            "in_stock": in_stock,
        }
    )

    return {"in_stock_products": in_stock}


# ─────────────────────────────────────────────────────────────────────────────
# NODE 3: node_check_budget
# LLM picks the BEST product(s) from in-stock list that fit the budget
# ─────────────────────────────────────────────────────────────────────────────

def node_check_budget(state: AgentState) -> dict:
    """
    Selects products that are already confirmed to be
    within budget and in stock.
    """

    publish_event(
        run_id=state["run_id"],
        event_type="budget",
        data={
            "message": f"Selecting products under ₹{state['budget']}...",
            "candidates": len(state["in_stock_products"]),
        },
    )

    products = state["in_stock_products"]

    if not products:
        publish_event(
            run_id=state["run_id"],
            event_type="budget_done",
            data={"message": "No in-stock products found within budget."},
        )

        return {
            "chosen_products": [],
            "final_message": "No products found within your budget.",
        }

    # Select the best matching in-stock product that fits the query
    if len(products) == 1:
        chosen_products = products
    else:
        query_words = set(re.findall(r"\w+", state["query"].lower()))
        stop_words = {"find", "get", "buy", "under", "me", "the", "a", "an", "for", "in", "with", "show"}
        keywords = {w for w in query_words if w not in stop_words and len(w) > 2}

        ranked = sorted(
            products,
            key=lambda p: (
                sum(1 for kw in keywords if kw in p["name"].lower()),
                -p["price"],
            ),
            reverse=True,
        )
        chosen_products = [ranked[0]]

    logger.info(
        f"[check_budget] Selected {len(chosen_products)} products"
    )

    publish_event(
        run_id=state["run_id"],
        event_type="budget_done",
        data={
            "message": f"Selected {len(chosen_products)} products",
            "chosen": chosen_products,
        },
    )

    return {
        "chosen_products": chosen_products
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 4: node_add_to_cart
# Adds each chosen product to the user's cart via POST /carts/{cart_id}/items
# ─────────────────────────────────────────────────────────────────────────────

def node_add_to_cart(state: AgentState) -> dict:
    """
    Iterates over chosen_products and calls POST /carts/{cart_id}/items
    for each one. Publishes a 'cart_add' event per item.
    """
    cart_items_added = []

    for product in state["chosen_products"]:
        try:
            publish_event(
                run_id=state["run_id"],
                event_type="cart_add",
                data={"message": f"Adding '{product['name']}' to cart..."}
            )
            item = agent_tools.add_to_cart(
                cart_id=state["cart_id"],
                product_id=product["id"],
                quantity=1,
            )
            cart_items_added.append({
                "product_id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "cart_item_id": item["id"],
            })
            publish_event(
                run_id=state["run_id"],
                event_type="cart_added",
                data={"message": f"✓ Added '{product['name']}' (₹{product['price']})"}
            )
        except Exception as e:
            logger.warning(f"[add_to_cart] Failed to add product {product['id']}: {e}")
            publish_event(
                run_id=state["run_id"],
                event_type="cart_error",
                data={"message": f"✗ Could not add '{product['name']}': {str(e)}"}
            )

    return {"cart_items_added": cart_items_added}


# ─────────────────────────────────────────────────────────────────────────────
# NODE 5: node_verify_cart
# Fetches the cart and generates a final human-readable summary via LLM
# ─────────────────────────────────────────────────────────────────────────────

def node_verify_cart(state: AgentState) -> dict:
    """
    Calls GET /carts/{cart_id} to get the final cart state.
    Then uses LLM to generate a friendly summary for the user.
    """
    publish_event(
        run_id=state["run_id"],
        event_type="verify",
        data={"message": "Verifying your cart..."}
    )

    cart = agent_tools.get_cart(cart_id=state["cart_id"])

    # Build a summary prompt
    items_added = state.get("cart_items_added", [])
    items_text = "\n".join(
        [f"- {item['name']}: ₹{item['price']}" for item in items_added]
    ) or "No items were added."

    system = SystemMessage(content="""
You are a helpful shopping assistant. Write a SHORT, friendly summary
(2-3 sentences) of what was added to the cart. Be conversational and positive.
""")
    human = HumanMessage(content=f"""
User query: "{state['query']}"
Budget: ₹{state['budget']}
Items added to cart:
{items_text}
Total cart value: ₹{cart.get('total', 0)}
""")

    response = _get_llm().invoke([system, human])
    final_message = response.content.strip()

    publish_event(
        run_id=state["run_id"],
        event_type="done",
        data={
            "message": final_message,
            "cart_total": cart.get("total", 0),
            "items_count": len(items_added),
        }
    )

    return {
        "cart_summary": cart,
        "final_message": final_message,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 6: node_request_payment_approval
# PAUSES the graph here and waits for human input via interrupt()
# ─────────────────────────────────────────────────────────────────────────────

def node_request_payment_approval(state: AgentState) -> dict:
    """
    This is the Human-in-the-Loop checkpoint.

    interrupt(payload) does three things:
      1. Serialises the entire AgentState into the checkpointer
      2. Raises an internal exception that LangGraph catches
      3. Returns the payload to the caller of .invoke()

    The graph is now FROZEN. Nothing else runs until the user resumes it.

    The caller (agent_router.py) will:
      - Detect that the graph was interrupted (GraphInterrupt exception)
      - Return HTTP 202 to the frontend with the cart summary
      - Wait for the user to hit POST /agent/approve/{thread_id}
    """
    cart_summary = state.get("cart_summary", {})
    items_added = state.get("cart_items_added", [])

    # If nothing was added and cart total is 0 or cart has no items, do not interrupt for approval
    if not items_added and not cart_summary.get("items"):
        return {
            "user_approved": False,
            "approval_status": "no_action_needed",
            "final_message": state.get("final_message") or "No products found within your budget.",
        }

    publish_event(
        run_id=state["run_id"],
        event_type="awaiting_approval",
        data={
            "message": "Waiting for your payment approval...",
            "cart_total": cart_summary.get("total", 0),
            "items_count": len(items_added),
            "items": items_added,
        }
    )

    # Build the approval payload — this is what the frontend will show the user
    approval_payload = {
        "message": "Please review your cart and approve payment.",
        "cart_summary": cart_summary,
        "items_added": items_added,
        "cart_total": cart_summary.get("total", 0),
        "budget": state.get("budget", 0),
    }

    # ── THIS IS THE KEY LINE ──────────────────────────────────────────────────
    # interrupt() pauses the graph and sends approval_payload back to the caller.
    # The VALUE returned by interrupt() is whatever the human sends back on resume.
    # We store it in user_decision, then use it in the next node.
    user_decision = interrupt(approval_payload)
    # ── GRAPH RESUMES HERE WHEN USER CALLS /agent/approve or /agent/reject ──

    if isinstance(user_decision, dict):
        approved = bool(user_decision.get("approved", False))
    else:
        approved = bool(user_decision)
    approval_status = "approved" if approved else "rejected"

    publish_event(
        run_id=state["run_id"],
        event_type="approval_received",
        data={
            "message": f"Payment {'approved ✓' if approved else 'rejected ✗'} by user",
            "approved": approved,
        }
    )

    return {
        "user_approved": approved,
        "approval_status": approval_status,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 7: node_process_checkout
# Calls POST /carts/{cart_id}/checkout if user approved, otherwise cancels
# ─────────────────────────────────────────────────────────────────────────────

def node_process_checkout(state: AgentState) -> dict:
    """
    Conditional checkout node — runs AFTER the user approves or rejects.

    If approved: calls POST /carts/{cart_id}/checkout and creates the order.
    If rejected: publishes a cancellation event and returns cleanly.

    This node uses conditional_edge routing in graph.py — it only runs
    when approval_status == "approved".
    """
    if not state.get("user_approved", False):
        if state.get("approval_status") == "no_action_needed":
            return {
                "checkout_result": {},
                "final_message": state.get("final_message") or "No products were added to cart.",
                "error": "",
            }

        # User rejected — do nothing, just publish event and finish cleanly
        publish_event(
            run_id=state["run_id"],
            event_type="payment_cancelled",
            data={"message": "Payment cancelled by user. Your cart has been preserved."}
        )
        return {
            "checkout_result": {},
            "final_message": "Payment was cancelled. Your cart items are still saved — you can approve later.",
            "error": "",
        }

    # ── User approved — call checkout ─────────────────────────────────────────
    publish_event(
        run_id=state["run_id"],
        event_type="checkout",
        data={"message": "Processing your payment..."}
    )

    try:
        idempotency_key = state.get("idempotency_key", "")
        checkout_result = agent_tools.checkout_cart(
            cart_id=state["cart_id"],
            idempotency_key=idempotency_key if idempotency_key else None,
        )

        publish_event(
            run_id=state["run_id"],
            event_type="payment_success",
            data={
                "message": f"✓ Payment successful! Order #{checkout_result.get('id')} created.",
                "order": checkout_result,
            }
        )

        return {
            "checkout_result": checkout_result,
            "final_message": (
                f"Payment successful! Your order #{checkout_result.get('id')} "
                f"has been placed. Thank you for shopping!"
            ),
            "error": "",
        }

    except Exception as e:
        error_msg = f"Checkout failed: {str(e)}"
        logger.error(f"[process_checkout] {error_msg}")
        publish_event(
            run_id=state["run_id"],
            event_type="payment_failed",
            data={"message": f"✗ {error_msg}"}
        )
        return {
            "checkout_result": {},
            "final_message": error_msg,
            "error": error_msg,
        }
