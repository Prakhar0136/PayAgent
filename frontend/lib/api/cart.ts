import { apiFetch } from "@/lib/api/client";
import type { Cart, CartItem, Order } from "@/types";

export function getCart(cartId: number): Promise<Cart> {
  return apiFetch<Cart>(`/carts/${cartId}`);
}

export function addCartItem(
  cartId: number,
  productId: number,
  quantity: number
): Promise<CartItem> {
  return apiFetch<CartItem>(`/carts/${cartId}/items`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity })
  });
}

export function updateCartItem(
  cartId: number,
  itemId: number,
  quantity: number
): Promise<CartItem> {
  return apiFetch<CartItem>(`/carts/${cartId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity })
  });
}

export function removeCartItem(cartId: number, itemId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/carts/${cartId}/items/${itemId}`, {
    method: "DELETE"
  });
}

export function checkoutCart(cartId: number, idempotencyKey: string): Promise<Order> {
  return apiFetch<Order>(`/carts/${cartId}/checkout`, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey
    }
  });
}
