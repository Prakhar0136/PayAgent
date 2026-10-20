"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Boxes, ShoppingCart, ShoppingBag, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const links = [
  { href: "/", label: "AI Assistant", icon: Sparkles },
  { href: "/products", label: "Catalog", icon: Boxes },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "My Orders", icon: ShoppingBag },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <span className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-accent text-white shadow-brutal-sm">
              <Bot size={18} strokeWidth={2.5} />
            </span>
            <div>
              <span className="block text-base font-bold leading-none tracking-tight text-ink">
                PayAgent
              </span>
              <span className="font-mono block text-[9px] font-semibold uppercase tracking-widest text-muted mt-0.5">
                Autonomous Commerce
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 border border-ink bg-canvas px-3 py-1 text-xs font-medium">
              <span className="h-2 w-2 bg-success" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Secure</span>
            </div>
            <Link
              href="/cart"
              className="flex items-center gap-2 border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-ink hover:text-white shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <ShoppingCart size={14} />
              <span>Cart</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <p className="font-mono px-3 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-ink mb-2">
              Navigation
            </p>
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 border-2 px-3.5 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all ${
                    active
                      ? "border-ink bg-ink text-white shadow-brutal-sm"
                      : "border-transparent bg-transparent text-muted hover:border-ink hover:bg-card hover:text-ink"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}

            <div className="mt-8 border-2 border-ink bg-card p-4 shadow-brutal">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
                // AI Powered
              </p>
              <p className="mt-2 text-sm font-bold text-ink">Natural Language Shopping</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Real-time inventory checks, smart cart preparation, and human-authorized payments.
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0">{children}</main>
      </div>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-2 border-ink bg-card lg:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
                active ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
