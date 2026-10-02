"""
LangGraph Graph Definition
===========================
Builds a simple LINEAR StateGraph:

  parse_query
       ↓
  search_products
       ↓
  check_inventory
       ↓
  check_budget    ← LLM picks best products
       ↓
  add_to_cart
       ↓
  verify_cart     ← LLM writes final summary

This is a synchronous graph — no branches, no loops, no conditional edges.
You can add conditional edges later (e.g., retry if cart empty).
"""

from langgraph.graph import StateGraph, END

from app.agent.state import AgentState
from app.agent.nodes import (
    parse_query,
    node_search_products,
    node_check_inventory,
    node_check_budget,
    node_add_to_cart,
    node_verify_cart,
)


def build_graph():
    """
    Constructs and compiles the LangGraph StateGraph.
    Returns a CompiledGraph that can be invoked with .invoke(state).
    """
    graph = StateGraph(AgentState)

    # ── Register nodes ────────────────────────────────────────────────────────
    graph.add_node("parse_query", parse_query)
    graph.add_node("search_products", node_search_products)
    graph.add_node("check_inventory", node_check_inventory)
    graph.add_node("check_budget", node_check_budget)
    graph.add_node("add_to_cart", node_add_to_cart)
    graph.add_node("verify_cart", node_verify_cart)

    # ── Set entry point ───────────────────────────────────────────────────────
    graph.set_entry_point("parse_query")

    # ── Define edges (linear flow) ────────────────────────────────────────────
    graph.add_edge("parse_query", "search_products")
    graph.add_edge("search_products", "check_inventory")
    graph.add_edge("check_inventory", "check_budget")
    graph.add_edge("check_budget", "add_to_cart")
    graph.add_edge("add_to_cart", "verify_cart")
    graph.add_edge("verify_cart", END)

    # ── Compile ───────────────────────────────────────────────────────────────
    compiled = graph.compile()
    return compiled


# Singleton — compiled once at import time, reused for every request
shopping_agent = build_graph()
