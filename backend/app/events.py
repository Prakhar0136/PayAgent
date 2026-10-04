"""
Agent Event Bus
===============
Provides two complementary mechanisms for agent/backend events:

1. **Pub/Sub publish** — fire-and-forget real-time fanout via Redis channels.
   Consumers that are already subscribed receive the message immediately.
   Messages are NOT stored; late subscribers miss them.

2. **List-based storage** — every event is also appended to a Redis list
   keyed by run_id.  This lets any caller retrieve the full history for a
   given agent run at any point, even after it finishes.

Typical event_type values
--------------------------
  "search"       → "Searching products..."
  "found"        → "Found 8 products"
  "inventory"    → "Checking inventory..."
  "cart_add"     → "Added Running Shoes"
  "budget"       → "Checking budget..."
  "approved"     → "Approved"
  "done"         → "Agent run finished"
"""

import json
import time

from app.redis import get_redis, PRODUCT_TTL

# How long to keep the event list for a given run_id (seconds).
# Defaults to the same TTL used for product caching.
EVENT_TTL = PRODUCT_TTL


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _channel(run_id: str) -> str:
    return f"agent:{run_id}"


def _list_key(run_id: str) -> str:
    return f"agent:events:{run_id}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

import logging

logger = logging.getLogger(__name__)


def publish_event(run_id: str, event_type: str, data: dict) -> None:
    """
    Publish an agent event to Redis.

    • Publishes to the Pub/Sub channel  ``agent:<run_id>``   (real-time fanout)
    • Appends the event to the Redis list ``agent:events:<run_id>``
      so it can be retrieved later via :func:`get_agent_events`.

    Parameters
    ----------
    run_id:
        Unique identifier for the current agent run (e.g. a UUID).
    event_type:
        Short label for the event (e.g. ``"search"``, ``"found"``).
    data:
        Arbitrary JSON-serialisable payload (e.g. ``{"message": "Searching..."}``)
    """
    try:
        redis_client = get_redis()

        event = {
            "run_id": run_id,
            "type": event_type,
            "timestamp": time.time(),
            "data": data,
        }
        serialised = json.dumps(event)

        # 1. Real-time Pub/Sub fanout
        redis_client.publish(_channel(run_id), serialised)

        # 2. Persistent list — append + refresh TTL
        list_key = _list_key(run_id)
        redis_client.rpush(list_key, serialised)
        redis_client.expire(list_key, EVENT_TTL)
    except Exception as e:
        logger.warning(f"[events] Could not publish event {event_type} for run {run_id}: {e}")


def get_agent_events(run_id: str) -> list[dict]:
    """
    Return all stored events for *run_id* in chronological order.

    Events are read from the Redis list ``agent:events:<run_id>``.
    Returns an empty list if no events exist or the key has expired.

    Parameters
    ----------
    run_id:
        The agent run identifier passed to :func:`publish_event`.
    """
    try:
        redis_client = get_redis()
        raw_events = redis_client.lrange(_list_key(run_id), 0, -1)
        return [json.loads(e) for e in raw_events]
    except Exception as e:
        logger.warning(f"[events] Could not retrieve events for run {run_id}: {e}")
        return []


def clear_agent_events(run_id: str) -> int:
    """
    Delete all stored events for *run_id*.

    Returns the number of keys deleted (0 or 1).
    """
    try:
        redis_client = get_redis()
        return redis_client.delete(_list_key(run_id))
    except Exception as e:
        logger.warning(f"[events] Could not clear events for run {run_id}: {e}")
        return 0