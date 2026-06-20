"""
Authentication module — password hashing, token management.
Uses in-memory session tokens (simple dict) — suitable for single-machine demo.
"""
import hashlib
import secrets
from datetime import datetime, timedelta

# In-memory token store: token -> {owner_id, expires_at}
_TOKEN_STORE: dict = {}
TOKEN_TTL_HOURS = 24


def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed


def create_token(owner_id: int) -> str:
    token = secrets.token_hex(32)
    _TOKEN_STORE[token] = {
        "owner_id": owner_id,
        "expires_at": datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return token


def validate_token(token: str):
    """Returns owner_id or None."""
    entry = _TOKEN_STORE.get(token)
    if not entry:
        return None
    if datetime.utcnow() > entry["expires_at"]:
        del _TOKEN_STORE[token]
        return None
    return entry["owner_id"]


def revoke_token(token: str):
    _TOKEN_STORE.pop(token, None)
