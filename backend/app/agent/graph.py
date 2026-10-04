"""
LangGraph Graph Definition — with Human-in-the-Loop
======================================================
Updated flow:

  parse_query
       ↓
  search_products
       ↓
  check_inventory
       ↓
  check_budget          ← LLM picks best products
       ↓
  add_to_cart
       ↓
  verify_cart           ← LLM writes cart summary
       ↓
  request_payment_approval  ← PAUSES HERE (interrupt)
       ↓ (user approves via POST /agent/approve/{thread_id})
  process_checkout      ← POST /carts/{cart_id}/checkout
       ↓
  END

KEY CHANGE: graph.compile(checkpointer=..., interrupt_before=["request_payment_approval"])
  - checkpointer: saves state so we can resume after interrupt
  - interrupt_before: optional alternative to calling interrupt() inside the node
    (we use interrupt() inside the node directly for more control)
"""

from langgraph.graph import StateGraph, END

from app.agent.state import AgentState
from app.agent.checkpointer import get_checkpointer
from app.agent.nodes import (
    parse_query,
    node_search_products,
    node_check_inventory,
    node_check_budget,
    node_add_to_cart,
    node_verify_cart,
    node_request_payment_approval,
    node_process_checkout,
)


def build_graph():
    """
    Constructs and compiles the LangGraph StateGraph with HITL support.

    The checkpointer is passed to graph.compile() — this is what enables
    interrupt() to save state and resume later.
    """
    graph = StateGraph(AgentState)

    # ── Register all nodes ────────────────────────────────────────────────────
    graph.add_node("parse_query", parse_query)
    graph.add_node("search_products", node_search_products)
    graph.add_node("check_inventory", node_check_inventory)
    graph.add_node("check_budget", node_check_budget)
    graph.add_node("add_to_cart", node_add_to_cart)
    graph.add_node("verify_cart", node_verify_cart)
    graph.add_node("request_payment_approval", node_request_payment_approval)
    graph.add_node("process_checkout", node_process_checkout)

    # ── Set entry point ───────────────────────────────────────────────────────
    graph.set_entry_point("parse_query")

    # ── Define edges ──────────────────────────────────────────────────────────
    graph.add_edge("parse_query", "search_products")
    graph.add_edge("search_products", "check_inventory")
    graph.add_edge("check_inventory", "check_budget")
    graph.add_edge("check_budget", "add_to_cart")
    graph.add_edge("add_to_cart", "verify_cart")
    graph.add_edge("verify_cart", "request_payment_approval")
    graph.add_edge("request_payment_approval", "process_checkout")
    graph.add_edge("process_checkout", END)

    # ── Compile WITH checkpointer ─────────────────────────────────────────────
    # This is the critical change — passing the checkpointer enables
    # state persistence across the interrupt boundary
    compiled = graph.compile(checkpointer=get_checkpointer())
    return compiled


# Singleton — compiled once at import time
shopping_agent = build_graph()
