import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import type { Product } from "@/types";
import { formatINR } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group border-2 border-ink bg-card shadow-brutal transition-all hover:shadow-brutal-accent hover:-translate-y-0.5">
      {/* Product image placeholder */}
      <div className="flex h-36 items-center justify-center border-b-2 border-ink bg-canvas text-muted">
        <Package size={40} strokeWidth={1.25} />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-snug">{product.name}</h3>
            <p className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted">
              Cat. #{product.category_id}
            </p>
          </div>
          <p className="font-mono shrink-0 text-base font-bold">{formatINR(product.price)}</p>
        </div>

        <Link
          href={`/products/${product.id}`}
          className="mt-4 inline-flex items-center gap-1.5 border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-brutal-sm transition-all hover:bg-ink hover:text-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          View Details <ArrowUpRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    </article>
  );
}
