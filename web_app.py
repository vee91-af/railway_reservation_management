"""Web server for the Railway Management System using Python's built-in http.server."""

import json
import mimetypes
import secrets
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from railway_system.auth import login_user, register_user
from railway_system.booking import (
    book_ticket,
    cancel_booking,
    get_user_bookings,
    list_trains,
)
from railway_system.db import init_db

STATIC_DIR = Path(__file__).resolve().parent / "static"
SESSIONS: dict[str, dict] = {}

PAGE_ROUTES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/login": "login.html",
    "/login.html": "login.html",
    "/register": "register.html",
    "/register.html": "register.html",
    "/bookings": "bookings.html",
    "/bookings.html": "bookings.html",
}


MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
}


class RailwayHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the Railway Management System web app."""

    def _send_json(
        self,
        status: int,
        payload: dict | list,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, file_path: Path) -> None:
        if not file_path.is_file():
            self.send_error(404, "File not found")
            return
        content = file_path.read_bytes()
        mime_type = MIME_TYPES.get(file_path.suffix.lower()) or mimetypes.guess_type(str(file_path))[0]
        self.send_response(200)
        self.send_header("Content-Type", f"{mime_type or 'application/octet-stream'}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _redirect(self, location: str) -> None:
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw)

    def _get_session_token(self) -> str | None:
        cookie_header = self.headers.get("Cookie")
        if not cookie_header:
            return None
        c = cookies.SimpleCookie()
        c.load(cookie_header)
        morsel = c.get("session_id")
        return morsel.value if morsel else None

    def _get_current_user(self) -> dict | None:
        token = self._get_session_token()
        if not token:
            return None
        return SESSIONS.get(token)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        # Static assets (CSS, JS, images)
        if path.startswith("/static/"):
            rel_path = path.removeprefix("/static/").lstrip("/")
            target = (STATIC_DIR / rel_path).resolve()
            if STATIC_DIR.resolve() in target.parents and target.is_file():
                self._send_file(target)
            else:
                self.send_error(404, "Not found")
            return

        # HTML page routes with server-side auth redirects
        if path in PAGE_ROUTES:
            user = self._get_current_user()
            if path in ("/login", "/login.html", "/register", "/register.html"):
                if user:
                    self._redirect("/")
                    return
            else:
                if not user:
                    self._redirect("/login")
                    return
            self._send_file(STATIC_DIR / PAGE_ROUTES[path])
            return

        if path == "/api/me":
            user = self._get_current_user()
            self._send_json(200, {"user": user})
            return

        if path == "/api/trains":
            qs = parse_qs(parsed.query)
            source = qs.get("source", [""])[0]
            destination = qs.get("destination", [""])[0]
            trains = list_trains(source=source, destination=destination)
            self._send_json(200, {"trains": trains})
            return

        if path == "/api/bookings":
            user = self._get_current_user()
            if not user:
                self._send_json(401, {"error": "Please log in first."})
                return
            bookings = get_user_bookings(user["id"])
            self._send_json(200, {"bookings": bookings})
            return

        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            data = self._read_json()
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        if path == "/api/register":
            ok, msg = register_user(
                data.get("username", ""),
                data.get("full_name", ""),
                data.get("password", ""),
            )
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg})
            return

        if path == "/api/login":
            user = login_user(data.get("username", ""), data.get("password", ""))
            if not user:
                self._send_json(401, {"ok": False, "message": "Invalid username or password."})
                return
            token = secrets.token_hex(24)
            SESSIONS[token] = user
            self._send_json(
                200,
                {"ok": True, "user": user},
                extra_headers={"Set-Cookie": f"session_id={token}; Path=/; HttpOnly; SameSite=Lax"},
            )
            return

        if path == "/api/logout":
            token = self._get_session_token()
            if token:
                SESSIONS.pop(token, None)
            self._send_json(
                200,
                {"ok": True},
                extra_headers={"Set-Cookie": "session_id=; Path=/; Max-Age=0; HttpOnly"},
            )
            return

        if path == "/api/book":
            user = self._get_current_user()
            if not user:
                self._send_json(401, {"ok": False, "message": "Please log in to book tickets."})
                return
            try:
                seats = int(data.get("seats", 0))
            except (TypeError, ValueError):
                self._send_json(400, {"ok": False, "message": "Invalid seat count."})
                return

            ok, msg, booking = book_ticket(
                user_id=user["id"],
                train_number=str(data.get("train_number", "")),
                passenger_name=str(data.get("passenger_name", "")),
                seats=seats,
            )
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg, "booking": booking})
            return

        if path == "/api/cancel":
            user = self._get_current_user()
            if not user:
                self._send_json(401, {"ok": False, "message": "Please log in first."})
                return
            ok, msg = cancel_booking(user["id"], str(data.get("pnr", "")))
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg})
            return

        self._send_json(404, {"error": "Not found"})


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    init_db()
    server = ThreadingHTTPServer((host, port), RailwayHandler)
    print(f"Railway Management System running at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()


if __name__ == "__main__":
    run_server()
