# PayAgent Frontend

Next.js + TypeScript + Tailwind frontend for the existing PayAgent FastAPI backend.

## 1. Install

```powershell
npm install
Copy-Item .env.local.example .env.local
```

Edit `.env.local` to match the running API and development user/cart IDs.

## 2. Start

```powershell
npm run dev
```

Open http://localhost:3000.

## Backend contract used

This frontend targets the existing routes described in the project:

- `GET /health`
- `GET /products`
- `GET /products/{product_id}`
- `GET /categories`
- `POST /carts`
- `GET /carts/{cart_id}`
- `POST /carts/{cart_id}/items`
- `PATCH /carts/{cart_id}/items/{item_id}`
- `DELETE /carts/{cart_id}/items/{item_id}`
- `POST /carts/{cart_id}/checkout` with `{ "idempotency_key": "..." }`
- `GET /orders/{order_id}`
- `GET /users/{user_id}/orders`
- `POST /agent/run`
- `GET /agents/{run_id}/events`

The agent run request follows the known backend contract:
`{ query, user_id, cart_id, run_id? }`.

## Important limitations

- The agent endpoint is synchronous according to the current backend design. The UI opens the event stream after receiving the `run_id`; event history may already contain events, depending on backend implementation.
- SSE parsing accepts either standard SSE `data:` messages or newline-delimited JSON payloads, but your backend must actually emit a compatible stream.
- This backend contract does not establish a separate approval endpoint or a real payment API. The frontend therefore does not fake approval or payment. Checkout invokes the existing cart checkout endpoint and shows the resulting order.
- Product response fields are kept minimal (`id`, `name`, `price`, `category_id`) because those are the known schema fields. Missing description/images/ratings are not fabricated.
- If your actual endpoint/schema differs, adjust `lib/api/*` to match it.

## Before committing

```powershell
npm run build
```
