"""
Checkpointer
============
The checkpointer is what allows LangGraph to PAUSE and RESUME graphs.
It serialises the entire AgentState and stores it so that when the user
approves payment, we can continue from exactly where we left off.

We use MemorySaver here (RAM-based) which is perfect for development.

To switch to PostgreSQL for production (persists across restarts):
  1. pip install langgraph-checkpoint-postgres
  2. Replace the body of get_checkpointer() with:
        from langgraph.checkpoint.postgres import PostgresSaver
        DB_URL = os.getenv("DATABASE_URL", "postgresql://payagent:payagent_password@localhost:5432/payagent_db")
        return PostgresSaver.from_conn_string(DB_URL)
"""

from langgraph.checkpoint.memory import MemorySaver

# Global singleton — one checkpointer shared across all requests
# This is important: all threads must use the SAME checkpointer instance
_checkpointer_instance = None


def get_checkpointer() -> MemorySaver:
    """Return the shared MemorySaver checkpointer, creating it on first call."""
    global _checkpointer_instance
    if _checkpointer_instance is None:
        _checkpointer_instance = MemorySaver()
    return _checkpointer_instance
