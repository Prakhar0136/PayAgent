# PayAgent

Autonomous AI shopping agent built with FastAPI,
PostgreSQL, Redis, LangGraph, Ollama and Next.js.

## Features

- Natural language shopping requests
- Product search
- Inventory checking
- Cart management
- Spending policies
- Autonomous agent workflow
- User approval before payment
- Mock payment processing
- MCP payment server
- RAG-based product search

## Architecture

User
 ↓
Next.js
 ↓
FastAPI
 ↓
LangGraph Agent
 ↓
PostgreSQL / Redis
 ↓
MCP Payment Server