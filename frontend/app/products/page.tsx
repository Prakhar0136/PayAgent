"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getProducts } from "@/lib/api/products";
import { ProductCard } from "@/components/products/ProductCard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import type { Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-ink pb-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
          // Catalog
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-muted">
          Discover quality products with guaranteed availability and fast delivery.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-0 border-2 border-ink bg-card shadow-brutal-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border-r-2 border-ink bg-ink text-white">
          <Search size={16} strokeWidth={2.5} />
        </div>
        <input
          id="product-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name..."
          className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted"
        />
        {search && (
          <span className="font-mono pr-4 text-xs text-muted">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && <Loading label="Loading catalog..." />}
      {error && <Alert message={error} />}

      {!loading && !error && filtered.length === 0 && (
        <div className="border-2 border-dashed border-ink bg-card p-12 text-center">
          <p className="font-mono text-2xl font-bold text-muted">[ 0 ]</p>
          <p className="mt-3 text-sm font-bold uppercase tracking-wide">No products match this search.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
