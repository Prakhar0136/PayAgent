import { apiFetch } from "@/lib/api/client";
import type { Order } from "@/types";

export function getOrder(orderId: number): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}`);
}

export function getUserOrders(userId: number): Promise<Order[]> {
  return apiFetch<Order[]>(`/users/${userId}/orders`);
}
