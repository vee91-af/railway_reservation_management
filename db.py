"""SQLite database setup and seed data for the Railway Management System."""

import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "railway.db"


def get_connection(db_path: Path | str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Return a SQLite connection with row_factory and foreign keys enabled."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Path | str = DEFAULT_DB_PATH) -> None:
    """Create tables if they do not exist and seed sample trains if empty."""
    with get_connection(db_path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS trains (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                train_number TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                source TEXT NOT NULL,
                destination TEXT NOT NULL,
                departure_time TEXT NOT NULL,
                arrival_time TEXT NOT NULL,
                fare REAL NOT NULL,
                total_seats INTEGER NOT NULL,
                available_seats INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pnr TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                train_id INTEGER NOT NULL,
                passenger_name TEXT NOT NULL,
                seats_booked INTEGER NOT NULL,
                total_fare REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'CONFIRMED',
                booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (train_id) REFERENCES trains(id)
            );
            """
        )

        count = conn.execute("SELECT COUNT(*) FROM trains").fetchone()[0]
        if count == 0:
            sample_trains = [
                ("12951", "Rajdhani Express", "Mumbai", "New Delhi", "17:00", "08:32", 2450.0, 120, 120),
                ("12002", "Shatabdi Express", "New Delhi", "Bhopal", "06:00", "14:25", 1350.0, 90, 90),
                ("12627", "Karnataka Express", "Bengaluru", "New Delhi", "19:20", "09:00", 2100.0, 150, 150),
                ("12840", "Howrah Mail", "Chennai", "Kolkata", "19:15", "22:50", 1650.0, 110, 110),
                ("22691", "Vande Bharat", "New Delhi", "Varanasi", "06:00", "14:00", 1800.0, 80, 80),
            ]
            conn.executemany(
                """
                INSERT INTO trains (
                    train_number, name, source, destination,
                    departure_time, arrival_time, fare, total_seats, available_seats
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                sample_trains,
            )
