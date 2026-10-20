export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function friendlyEventName(event: string): string {
  const key = event.toLowerCase().replaceAll("-", "_");
  const names: Record<string, string> = {
    agent_started: "Agent started",
    search: "Searching products",
    search_started: "Searching products",
    found: "Products found",
    search_completed: "Search completed",
    inventory: "Checking inventory",
    inventory_check_started: "Checking inventory",
    inventory_check_completed: "Inventory checked",
    budget: "Checking budget",
    budget_check_started: "Checking budget",
    budget_check_completed: "Budget checked",
    cart_add: "Adding product to cart",
    cart_updated: "Cart updated",
    cart_verified: "Cart verified",
    product_selected: "Product selected",
    approved: "Approval received",
    done: "Agent completed",
    agent_completed: "Agent completed",
    agent_failed: "Agent failed"
  };
  return names[key] || key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function eventDescription(event: { data?: Record<string, unknown>; message?: string }): string {
  if (event.message) return event.message;
  const data = event.data || {};
  for (const key of ["message", "detail", "count", "product_name", "status"]) {
    if (data[key] !== undefined) return `${key === "count" ? "Count: " : ""}${String(data[key])}`;
  }
  return "PayAgent reported an update.";
}
