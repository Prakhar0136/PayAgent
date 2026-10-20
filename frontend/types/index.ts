export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  // Product information may be absent from the current CartItemResponse.
  product?: Product;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total?: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: string;
  items: OrderItem[];
}

export type AgentStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "approved"
  | "checkout"
  | "completed"
  | "failed"
  | "cancelled"
  | "no_action_needed"
  | "unknown";

export interface AgentRunRequest {
  query: string;
  user_id: number;
  cart_id: number;
  run_id?: string;
}

export interface AgentRunResponse {
  run_id: string;
  query: string;
  thread_id?: string;
  status?: AgentStatus | string;
  cart_total?: number;
  message?: string;
  budget?: number;
  products_found?: number;
  in_stock_count?: number;
  chosen_count?: number;
  items_added?: unknown[];
  cart_summary?: Record<string, unknown>;
  final_message?: string;
  error?: string | null;
  order_id?: number | null;
  approved?: boolean;
}

export interface AgentFinalResponse {
  status: string;
  thread_id: string;
  run_id: string;
  approved: boolean;
  order_id?: number | null;
  final_message?: string;
  error?: string;
}

export interface AgentStatusResponse {
  thread_id: string;
  run_id: string;
  status: string;
  cart_summary?: Record<string, unknown>;
  items_added?: unknown[];
}

export interface AgentEventsResponse {
  run_id: string;
  count: number;
  events: AgentEvent[];
}

export interface AgentEvent {
  run_id?: string;
  event_type?: string;
  type?: string;
  timestamp?: string | number;
  data?: Record<string, unknown>;
  message?: string;
  [key: string]: unknown;
}
