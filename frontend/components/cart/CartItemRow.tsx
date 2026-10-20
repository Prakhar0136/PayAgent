"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem, Product } from "@/types";
import { formatINR } from "@/lib/utils";

export function CartItemRow({
  item,
  product,
  busy,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  product: Product | undefined;
  busy: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-4 border-2 border-ink bg-card p-4 shadow-brutal-sm sm:flex-row sm:items-center transition-opacity ${
        busy ? "opacity-50" : ""
      }`}
    >
      {/* Product ID tag */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-ink bg-canvas font-mono text-xs font-bold text-muted">
        #{item.product_id}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{product?.name || `Product #${item.product_id}`}</p>
        <p className="font-mono mt-0.5 text-xs text-muted">
          {product ? formatINR(product.price) + " each" : "Price unavailable"}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-0 border-2 border-ink">
        <button
          disabled={busy || item.quantity <= 1}
          onClick={() => onQuantity(item.quantity - 1)}
          className="flex h-8 w-8 items-center justify-center border-r-2 border-ink bg-canvas text-ink transition hover:bg-ink hover:text-white disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>
        <span className="font-mono w-10 text-center text-sm font-bold">{item.quantity}</span>
        <button
          disabled={busy}
          onClick={() => onQuantity(item.quantity + 1)}
          className="flex h-8 w-8 items-center justify-center border-l-2 border-ink bg-canvas text-ink transition hover:bg-ink hover:text-white disabled:opacity-30"
          aria-label="Increase quantity"
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Price */}
      <div className="font-mono w-24 text-right text-base font-bold">
        {product ? formatINR(product.price * item.quantity) : "—"}
      </div>

      {/* Remove */}
      <button
        disabled={busy}
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center border-2 border-error text-error transition hover:bg-error hover:text-white disabled:opacity-30"
        aria-label="Remove item"
      >
        <Trash2 size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
