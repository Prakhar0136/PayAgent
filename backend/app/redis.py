import os
import redis
from dotenv import load_dotenv

load_dotenv()

# When running inside Docker Compose the Redis container is reachable at
# the service name "redis". When running locally (outside Docker) use
# "localhost". Override via the REDIS_HOST environment variable if needed.
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Time-to-live for cached product entries (seconds).
PRODUCT_TTL = 300  # 5 minutes

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)


def get_redis() -> redis.Redis:
    return redis_client


def ping_redis() -> bool:
    """Return True if Redis is reachable, False otherwise."""
    try:
        return redis_client.ping()
    except redis.RedisError:
        return False