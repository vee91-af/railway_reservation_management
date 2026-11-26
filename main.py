"""Interactive CLI entry point for the Railway Management System."""

from getpass import getpass

from railway_system.auth import login_user, register_user
from railway_system.booking import (
    book_ticket,
    cancel_booking,
    get_user_bookings,
    list_trains,
)
from railway_system.db import init_db


def print_trains(trains: list[dict]) -> None:
    """Print a formatted table of trains."""
    if not trains:
        print("\nNo trains found matching your criteria.")
        return

    print("\n" + "-" * 92)
    print(
        f"{'No.':<7} {'Train Name':<20} {'From':<12} {'To':<12} "
        f"{'Dep':<6} {'Arr':<6} {'Fare':>8} {'Seats':>8}"
    )
    print("-" * 92)
    for t in trains:
        seats_str = f"{t['available_seats']}/{t['total_seats']}"
        print(
            f"{t['train_number']:<7} {t['name']:<20} {t['source']:<12} {t['destination']:<12} "
            f"{t['departure_time']:<6} {t['arrival_time']:<6} {t['fare']:>8.2f} {seats_str:>8}"
        )
    print("-" * 92)


def print_bookings(bookings: list[dict]) -> None:
    """Print a formatted list of user bookings."""
    if not bookings:
        print("\nYou have no bookings yet.")
        return

    print("\n" + "-" * 96)
    print(
        f"{'PNR':<12} {'Train':<22} {'Route':<24} {'Passenger':<16} "
        f"{'Seats':>5} {'Fare':>8} {'Status':<10}"
    )
    print("-" * 96)
    for b in bookings:
        train_label = f"{b['train_number']} {b['train_name']}"[:21]
        route = f"{b['source']} -> {b['destination']}"[:23]
        print(
            f"{b['pnr']:<12} {train_label:<22} {route:<24} {b['passenger_name']:<16} "
            f"{b['seats_booked']:>5} {b['total_fare']:>8.2f} {b['status']:<10}"
        )
    print("-" * 96)


def handle_availability() -> None:
    """Prompt for optional filters and display train availability."""
    print("\n--- Check Train Availability (press Enter to skip filters) ---")
    source = input("Source station: ")
    destination = input("Destination station: ")
    trains = list_trains(source=source, destination=destination)
    print_trains(trains)


def handle_booking(user: dict) -> None:
    """Prompt user for booking details and book a ticket."""
    print("\n--- Book a Ticket ---")
    print_trains(list_trains())
    train_number = input("Enter Train Number: ").strip()
    passenger_name = input("Passenger Name: ").strip()
    seats_raw = input("Number of Seats: ").strip()

    try:
        seats = int(seats_raw)
    except ValueError:
        print("Invalid seat count. Please enter a whole number.")
        return

    success, message, booking = book_ticket(
        user_id=user["id"],
        train_number=train_number,
        passenger_name=passenger_name,
        seats=seats,
    )
    print(f"\n{message}")
    if success and booking:
        print(
            f"Summary: {booking['train_number']} {booking['train_name']} | "
            f"{booking['source']} -> {booking['destination']} | "
            f"Seats: {booking['seats_booked']} | Total Fare: {booking['total_fare']:.2f}"
        )


def handle_cancel(user: dict) -> None:
    """Prompt for PNR and cancel a booking."""
    print("\n--- Cancel a Ticket ---")
    pnr = input("Enter PNR to cancel: ").strip()
    _, message = cancel_booking(user_id=user["id"], pnr=pnr)
    print(f"\n{message}")


def user_menu(user: dict) -> None:
    """Logged-in user menu loop."""
    while True:
        print(f"\n=== Welcome, {user['full_name']} (@{user['username']}) ===")
        print("1. View Train Availability")
        print("2. Book Ticket")
        print("3. My Bookings")
        print("4. Cancel Ticket")
        print("5. Logout")

        choice = input("Select an option (1-5): ").strip()
        if choice == "1":
            handle_availability()
        elif choice == "2":
            handle_booking(user)
        elif choice == "3":
            print_bookings(get_user_bookings(user["id"]))
        elif choice == "4":
            handle_cancel(user)
        elif choice == "5":
            print("Logged out.")
            break
        else:
            print("Invalid choice. Please enter 1-5.")


def main() -> None:
    """Main application loop."""
    init_db()
    print("=== Railway Management System ===")

    while True:
        print("\n1. Login")
        print("2. Register")
        print("3. View Train Availability (Guest)")
        print("4. Exit")

        choice = input("Select an option (1-4): ").strip()
        if choice == "1":
            username = input("Username: ")
            password = getpass("Password: ")
            user = login_user(username, password)
            if user:
                user_menu(user)
            else:
                print("\nInvalid username or password.")
        elif choice == "2":
            username = input("Choose a username: ")
            full_name = input("Full name: ")
            password = getpass("Choose a password (min 4 chars): ")
            _, message = register_user(username, full_name, password)
            print(f"\n{message}")
        elif choice == "3":
            handle_availability()
        elif choice == "4":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please enter 1-4.")


if __name__ == "__main__":
    main()
