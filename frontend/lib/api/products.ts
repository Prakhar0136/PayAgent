import { apiFetch } from "@/lib/api/client";
import type { Category, Product } from "@/types";

export function getProducts(maxPrice?: number): Promise<Product[]> {
  const query = maxPrice === undefined ? "" : `?max_price=${encodeURIComponent(maxPrice)}`;
  return apiFetch<Product[]>(`/products${query}`);
}

export function getProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}
