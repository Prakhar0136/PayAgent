# PayAgent

PayAgent is an autonomous AI shopping agent.

The user expresses a shopping goal in natural language, and the system can:

- Understand the request
- Search products
- Apply constraints
- Rank products
- Check inventory
- Check spending policies
- Modify the cart
- Verify the final cart
- Create a checkout/payment intent
- Request human approval when required
- Execute a mock payment through an MCP boundary

## Architecture

The project will eventually contain:

- Next.js frontend
- FastAPI backend
- PostgreSQL database
- Redis
- LangGraph agent
- Ollama local LLM
- TypeScript MCP payment server
- pgvector-based hybrid search

## Development

This project is being built incrementally in multiple phases.