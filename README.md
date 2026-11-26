# RailEase — Railway Management System (Python)

A full-stack **Railway Management System** built purely with Python's standard library (`sqlite3`, `http.server`, `hashlib`, `secrets`, `unittest`) and a responsive HTML/CSS/JavaScript frontend — **zero external dependencies required**.

Includes both a **multi-page Web Application** and an **interactive CLI**.

---

## Features

- **User Authentication**
  - Dedicated **Login** (`/login`) and **Register** (`/register`) pages.
  - Secure password storage using salted **PBKDF2-HMAC-SHA256** hashing and `HttpOnly` session cookies.
- **Train Availability Search**
  - Browse all seeded trains or filter by **Source** and **Destination** stations.
  - Quick route filter chips and live seat availability progress bars.
- **Ticket Booking**
  - Book one or more seats via an interactive modal with live total-fare calculation.
  - Automatic unique **PNR** generation and atomic seat count updates in SQLite.
- **My Bookings & Cancellation**
  - Dedicated **My Bookings** (`/bookings`) page displaying PNR, route, passenger name, fare, and status (`CONFIRMED` / `CANCELLED`).
  - One-click ticket cancellation that automatically restores available seats.

---

## Project Structure

```text
.
├── main.py                     # Interactive CLI entry point
├── web_app.py                  # Built-in HTTP server & JSON API
├── railway_system/
│   ├── __init__.py
│   ├── db.py                   # SQLite schema & sample train seed data
│   ├── auth.py                 # User registration & login verification
│   └── booking.py              # Train search, booking & cancellation logic
├── static/
│   ├── styles.css              # Shared modern UI stylesheet
│   ├── login.html              # Login page (/login)
│   ├── register.html           # Registration page (/register)
│   ├── index.html              # Home page — search & book trains (/)
│   └── bookings.html           # My Bookings page (/bookings)
├── tests/
│   └── test_railway.py         # Unit tests for auth, search, booking & cancel
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Python 3.10+**

---

## How to Run

### 1. Run the Website (Recommended)
```bash
python web_app.py
```
Then open your browser and visit:
**http://127.0.0.1:8000**

- New users are directed to `/login` (with a link to `/register`).
- After logging in, you are taken to `/` (Home) to search and book trains, and `/bookings` to view or cancel your tickets.

### 2. Run the Command-Line Interface (CLI)
```bash
python main.py
```

### 3. Run Unit Tests
```bash
python -m unittest discover -s tests
```

---

## API Endpoints (`web_app.py`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/register` | Create a new user account |
| `POST` | `/api/login` | Authenticate user and set session cookie |
| `POST` | `/api/logout` | Clear active session |
| `GET` | `/api/me` | Get currently logged-in user |
| `GET` | `/api/trains` | List trains (optional `source` & `destination` query params) |
| `POST` | `/api/book` | Book seats on a train (requires login) |
| `GET` | `/api/bookings` | Fetch bookings for logged-in user |
| `POST` | `/api/cancel` | Cancel a confirmed booking by PNR |
