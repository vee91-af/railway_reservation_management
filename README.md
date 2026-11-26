# Railway Management System (Python)

A command-line Railway Management System built with Python's standard library (`sqlite3`, `hashlib`, `secrets`, `unittest`).

## Features
- **User Authentication**: Register a new account and log in with salted PBKDF2-SHA256 password hashing.
- **Train Availability**: View all trains or filter by source and destination stations.
- **Ticket Booking**: Book seats on any available train with automatic PNR generation and seat count updates.
- **My Bookings & Cancellation**: View your booking history and cancel confirmed tickets (automatically restoring seats).

## How to Run

1. Make sure Python 3.10+ is installed and available on your `PATH`.
2. Start the application:
   ```bash
   python main.py
   ```
3. Run the unit tests:
   ```bash
   python -m unittest discover -s tests
   ```
