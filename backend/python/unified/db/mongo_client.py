"""
db/mongo_client.py

Motor-based async MongoDB client singleton.
Handles the connection lifecycle and exposes the telemetry collection handle.
All writes here are fire-and-forget (asyncio.create_task) so they never
block a critical path in the LangGraph workflow.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import motor.motor_asyncio
from pymongo.errors import PyMongoError

import config

logger = logging.getLogger(__name__)

# ─── Singleton motor client ────────────────────────────────────────────────────

_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
_db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


def get_mongo_client() -> motor.motor_asyncio.AsyncIOMotorClient:
    """Return the singleton Motor client, creating it if necessary."""
    global _client
    if _client is None:
        _client = motor.motor_asyncio.AsyncIOMotorClient(
            config.MONGO_URI,
            serverSelectionTimeoutMS=5000,
        )
        logger.info("[MongoDB] Motor client initialised → %s", config.MONGO_URI)
    return _client


def get_db() -> motor.motor_asyncio.AsyncIOMotorDatabase:
    """Return the singleton database handle."""
    global _db
    if _db is None:
        _db = get_mongo_client()[config.MONGO_DB_NAME]
    return _db


def get_telemetry_collection() -> motor.motor_asyncio.AsyncIOMotorCollection:
    """Return the ai_telemetry collection handle."""
    return get_db()[config.MONGO_TELEMETRY_COLLECTION]


def get_patients_collection() -> motor.motor_asyncio.AsyncIOMotorCollection:
    """Return the patients registry collection handle."""
    return get_db()["patients"]


# ─── Fire-and-forget telemetry helpers ────────────────────────────────────────

async def _insert_telemetry_safe(document: Dict[str, Any]) -> None:
    """
    Perform the actual MongoDB insert. Catches ALL exceptions so that a
    Mongo outage never crashes the clinical workflow.
    """
    try:
        collection = get_telemetry_collection()
        result = await collection.insert_one(document)
        logger.info(
            "[MongoDB] Telemetry logged → _id=%s  event_type=%s",
            result.inserted_id,
            document.get("event_type"),
        )
    except PyMongoError as exc:
        logger.error("[MongoDB] Write error (non-fatal): %s", exc)
    except Exception as exc:  # noqa: BLE001
        logger.error("[MongoDB] Unexpected error (non-fatal): %s", exc)


def fire_telemetry(event_type: str, payload: Dict[str, Any]) -> None:
    """
    Schedule a MongoDB insert as a background asyncio task.
    Safe to call from any async context — completely non-blocking.

    Args:
        event_type: e.g. "AMBIENT_SCRIBE_DISPATCH" | "REPORT_DISPATCH"
        payload:    Arbitrary JSON-serialisable dictionary with clinical data.
    """
    document = {
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **payload,
    }
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(_insert_telemetry_safe(document))
        else:
            # Fallback for non-async call sites (shouldn't happen in FastAPI context)
            loop.run_until_complete(_insert_telemetry_safe(document))
    except RuntimeError:
        logger.warning("[MongoDB] No running event loop — telemetry skipped.")


async def close_mongo_client() -> None:
    """Close the Motor client gracefully on app shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("[MongoDB] Motor client closed.")
