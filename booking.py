"""Train availability search, ticket booking, and cancellation logic."""

import secrets
from pathlib import Path

from .db import DEFAULT_DB_PATH, get_connection


def list_trains(
    source: str | None = None,
    destination: str | None = None,
    db_path: Path | str = DEFAULT_DB_PATH,
) -> list[dict]:
    """Return available trains, optionally filtered by source and/or destination."""
    query = "SELECT * FROM trains WHERE 1=1"
    params: list[str] = []

    if source and source.strip():
        query += " AND LOWER(source) LIKE LOWER(?)"
        params.append(f"%{source.strip()}%")
    if destination and destination.strip():
        query += " AND LOWER(destination) LIKE LOWER(?)"
        params.append(f"%{destination.strip()}%")

    query += " ORDER BY train_number"

    with get_connection(db_path) as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(row) for row in rows]


def book_ticket(
    user_id: int,
    train_number: str,
    passenger_name: str,
    seats: int,
    db_path: Path | str = DEFAULT_DB_PATH,
) -> tuple[bool, str, dict | None]:
    """Book `seats` on `train_number` for `user_id`. Returns (success, message, booking_dict)."""
    passenger_name = passenger_name.strip()
    train_number = train_number.strip()

    if not passenger_name:
        return False, "Passenger name is required.", None
    if seats <= 0:
        return False, "Number of seats must be at least 1.", None

    with get_connection(db_path) as conn:
        train = conn.execute(
            "SELECT * FROM trains WHERE train_number = ?",
            (train_number,),
        ).fetchone()

        if train is None:
            return False, f"Train '{train_number}' not found.", None

        if train["available_seats"] < seats:
            return (
                False,
                f"Only {train['available_seats']} seat(s) available on {train['name']}.",
                None,
            )

        pnr = f"PNR{secrets.randbelow(9000000) + 1000000}"
        total_fare = round(train["fare"] * seats, 2)

        conn.execute(
            "UPDATE trains SET available_seats = available_seats - ? WHERE id = ?",
            (seats, train["id"]),
        )
        cursor = conn.execute(
            """
            INSERT INTO bookings (pnr, user_id, train_id, passenger_name, seats_booked, total_fare, status)
            VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
            """,
            (pnr, user_id, train["id"], passenger_name, seats, total_fare),
        )
        booking = conn.execute(
            """
            SELECT b.*, t.train_number, t.name AS train_name, t.source, t.destination,
                   t.departure_time, t.arrival_time
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            WHERE b.id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return True, f"Ticket booked successfully! PNR: {pnr}", dict(booking)


def get_user_bookings(user_id: int, db_path: Path | str = DEFAULT_DB_PATH) -> list[dict]:
    """Return all bookings for a given user, newest first."""
    with get_connection(db_path) as conn:
        rows = conn.execute(
            """
            SELECT b.*, t.train_number, t.name AS train_name, t.source, t.destination,
                   t.departure_time, t.arrival_time
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            WHERE b.user_id = ?
            ORDER BY b.id DESC
            """,
            (user_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def cancel_booking(
    user_id: int,
    pnr: str,
    db_path: Path | str = DEFAULT_DB_PATH,
) -> tuple[bool, str]:
    """Cancel a confirmed booking by PNR and restore seats."""
    pnr = pnr.strip().upper()
    with get_connection(db_path) as conn:
        booking = conn.execute(
            "SELECT * FROM bookings WHERE pnr = ? AND user_id = ?",
            (pnr, user_id),
        ).fetchone()

        if booking is None:
            return False, f"No booking found with PNR '{pnr}'."
        if booking["status"] == "CANCELLED":
            return False, f"Booking '{pnr}' is already cancelled."

        conn.execute(
            "UPDATE bookings SET status = 'CANCELLED' WHERE id = ?",
            (booking["id"],),
        )
        conn.execute(
            "UPDATE trains SET available_seats = available_seats + ? WHERE id = ?",
            (booking["seats_booked"], booking["train_id"]),
        )
    return True, f"Booking '{pnr}' cancelled and {booking['seats_booked']} seat(s) restored."
