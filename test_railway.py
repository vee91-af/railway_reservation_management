"""Unit tests for the Railway Management System."""

import tempfile
import unittest
from pathlib import Path

from railway_system.auth import login_user, register_user
from railway_system.booking import (
    book_ticket,
    cancel_booking,
    get_user_bookings,
    list_trains,
)
from railway_system.db import init_db


class TestRailwaySystem(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_railway.db"
        init_db(self.db_path)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_register_and_login(self) -> None:
        ok, _ = register_user("alice", "Alice Smith", "secret123", self.db_path)
        self.assertTrue(ok)

        # Duplicate username should fail
        ok_dup, _ = register_user("alice", "Alice 2", "secret123", self.db_path)
        self.assertFalse(ok_dup)

        user = login_user("alice", "secret123", self.db_path)
        self.assertIsNotNone(user)
        self.assertEqual(user["username"], "alice")

        bad_user = login_user("alice", "wrongpass", self.db_path)
        self.assertIsNone(bad_user)

    def test_list_trains_and_filter(self) -> None:
        all_trains = list_trains(db_path=self.db_path)
        self.assertGreaterEqual(len(all_trains), 5)

        filtered = list_trains(source="Mumbai", destination="New Delhi", db_path=self.db_path)
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered[0]["train_number"], "12951")

    def test_book_and_cancel_ticket(self) -> None:
        register_user("bob", "Bob Jones", "pass1234", self.db_path)
        user = login_user("bob", "pass1234", self.db_path)
        assert user is not None

        before = list_trains(source="Mumbai", destination="New Delhi", db_path=self.db_path)[0]
        initial_seats = before["available_seats"]

        ok, msg, booking = book_ticket(user["id"], "12951", "Bob Jones", 3, self.db_path)
        self.assertTrue(ok, msg)
        self.assertIsNotNone(booking)
        self.assertEqual(booking["seats_booked"], 3)
        self.assertEqual(booking["status"], "CONFIRMED")

        after_book = list_trains(source="Mumbai", destination="New Delhi", db_path=self.db_path)[0]
        self.assertEqual(after_book["available_seats"], initial_seats - 3)

        bookings = get_user_bookings(user["id"], self.db_path)
        self.assertEqual(len(bookings), 1)

        ok_cancel, _ = cancel_booking(user["id"], booking["pnr"], self.db_path)
        self.assertTrue(ok_cancel)

        after_cancel = list_trains(source="Mumbai", destination="New Delhi", db_path=self.db_path)[0]
        self.assertEqual(after_cancel["available_seats"], initial_seats)

    def test_insufficient_seats(self) -> None:
        register_user("carol", "Carol Lee", "pass1234", self.db_path)
        user = login_user("carol", "pass1234", self.db_path)
        assert user is not None

        ok, msg, booking = book_ticket(user["id"], "12951", "Carol Lee", 9999, self.db_path)
        self.assertFalse(ok)
        self.assertIsNone(booking)
        self.assertIn("Only", msg)


if __name__ == "__main__":
    unittest.main()
