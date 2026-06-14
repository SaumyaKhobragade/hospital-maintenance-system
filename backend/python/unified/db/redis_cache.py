"""Small fail-open Redis cache used by the unified API."""

import json
import logging
from typing import Any, Optional

from redis.asyncio import Redis

import config

logger = logging.getLogger(__name__)
_client: Optional[Redis] = None


def get_redis_client() -> Redis:
    global _client
    if _client is None:
        _client = Redis.from_url(config.REDIS_URL, decode_responses=True)
    return _client


async def cache_get(key: str) -> Optional[Any]:
    try:
        value = await get_redis_client().get(key)
        return json.loads(value) if value is not None else None
    except Exception as exc:
        logger.warning("Redis read skipped: %s", exc)
        return None


async def cache_set(key: str, value: Any) -> None:
    try:
        await get_redis_client().set(key, json.dumps(value, default=str), ex=config.REDIS_TTL_SECONDS)
    except Exception as exc:
        logger.warning("Redis write skipped: %s", exc)


async def cache_delete_pattern(pattern: str) -> None:
    try:
        client = get_redis_client()
        keys = [key async for key in client.scan_iter(match=pattern)]
        if keys:
            await client.delete(*keys)
    except Exception as exc:
        logger.warning("Redis invalidation skipped: %s", exc)


async def close_redis_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
