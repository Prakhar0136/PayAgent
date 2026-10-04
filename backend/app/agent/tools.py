"""
Agent Tools
===========
These are PURE FUNCTIONS that make HTTP calls to your own FastAPI backend.
They are NOT LangChain tool objects — they are plain Python functions called
directly by the graph nodes. This keeps the code simple and testable.

Why call our own FastAPI instead of touching DB directly?
  → Reuse existing validation, caching, and business logic.
  → The agent is a client just like a frontend would be.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# Base URL of your running FastAPI server
# Change this if your server runs on a different port
BASE_URL = os.getenv("FASTAPI_BASE_URL", "http://localhost:8000")


def search_products(max_price: int, category_name: str | None = None) -> list[dict]:
    """
    Calls GET /products?max_price={max_price}
    Optionally filters by category name using GET /products/category/{name}

    Returns a list of product dicts: [{id, name, price, category_id}, ...]
    """
    if category_name:
        url = f"{BASE_URL}/products/category/{category_name}"
        resp = httpx.get(url, timeout=10)
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        products = resp.json()
        # Apply budget filter manually since category endpoint doesn't have max_price
        return [p for p in products if p["price"] <= max_price]
    else:
        url = f"{BASE_URL}/products"
        resp = httpx.get(url, params={"max_price": max_price}, timeout=10)
        resp.raise_for_status()
        return resp.json()


def check_inventory(product_id: int) -> dict:
    """
    Calls GET /inventory/{product_id}
    Returns inventory dict: {id, product_id, quantity}
    Returns {"product_id": product_id, "quantity": 0} if not found.
    """
    url = f"{BASE_URL}/inventory/{product_id}"
    resp = httpx.get(url, timeout=10)
    if resp.status_code == 404:
        return {"product_id": product_id, "quantity": 0}
    resp.raise_for_status()
    return resp.json()


def add_to_cart(cart_id: int, product_id: int, quantity: int = 1) -> dict:
    """
    Calls POST /carts/{cart_id}/items
    Returns the CartItemResponse dict.
    """
    url = f"{BASE_URL}/carts/{cart_id}/items"
    payload = {"product_id": product_id, "quantity": quantity}
    resp = httpx.post(url, json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_cart(cart_id: int) -> dict:
    """
    Calls GET /carts/{cart_id}
    Returns the full CartResponse dict with items and total.
    """
    url = f"{BASE_URL}/carts/{cart_id}"
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json()


def checkout_cart(cart_id: int, idempotency_key: str | None = None) -> dict:
    """
    Calls POST /carts/{cart_id}/checkout
    Optionally passes an Idempotency-Key header to prevent double charges.
    Returns the OrderResponse dict.
    """
    url = f"{BASE_URL}/carts/{cart_id}/checkout"
    headers = {}
    if idempotency_key:
        headers["Idempotency-Key"] = idempotency_key

    resp = httpx.post(url, headers=headers, timeout=15)

    # Surface the actual error detail from the response body instead of the
    # generic httpx status message (e.g. "500 Internal Server Error").
    if resp.is_error:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        raise RuntimeError(
            f"Checkout endpoint returned {resp.status_code}: {detail}"
        )

    return resp.json()
