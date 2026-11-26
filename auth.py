"""User authentication (registration and login) for the Railway Management System."""

import hashlib
import secrets
import sqlite3
from pathlib import Path

from .db import DEFAULT_DB_PATH, get_connection


def _hash_password(password: str, salt: str) -> str:
    """Hash a password with PBKDF2-HMAC-SHA256."""
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return dk.hex()


def register_user(
    username: str,
    full_name: str,
    password: str,
    db_path: Path | str = DEFAULT_DB_PATH,
) -> tuple[bool, str]:
    """Register a new user. Returns (success, message)."""
    username = username.strip()
    full_name = full_name.strip()

    if not username or not full_name or not password:
        return False, "Username, full name, and password are required."
    if len(password) < 4:
        return False, "Password must be at least 4 characters long."

    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)

    try:
        with get_connection(db_path) as conn:
            conn.execute(
                "INSERT INTO users (username, full_name, password_hash, salt) VALUES (?, ?, ?, ?)",
                (username, full_name, password_hash, salt),
            )
        return True, f"Account created for '{username}'. You can now log in."
    except sqlite3.IntegrityError:
        return False, f"Username '{username}' is already taken."


def login_user(
    username: str,
    password: str,
    db_path: Path | str = DEFAULT_DB_PATH,
) -> dict | None:
    """Verify credentials and return user dict on success, or None on failure."""
    username = username.strip()
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT id, username, full_name, password_hash, salt FROM users WHERE username = ?",
            (username,),
        ).fetchone()

    if row is None:
        return None

    expected_hash = _hash_password(password, row["salt"])
    if secrets.compare_digest(expected_hash, row["password_hash"]):
        return {
            "id": row["id"],
            "username": row["username"],
            "full_name": row["full_name"],
        }
    return None
