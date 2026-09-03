# Railway Reservation System

A lightweight, full-stack Railway Reservation Management System prototype built with Node.js, Express, and a responsive frontend styled with Tailwind CSS. This application allows users to search available trains across routes, view seat quotas, select travel classes, and confirm bookings with instant PNR generation.

---

## Features

- **Train Search Engine:** Query routes between origin and destination stations.
- **Seat & Class Availability:** Interactive quota selection across multiple classes (1A, 2A, 3A, Sleeper, Chair Car) with live pricing.
- **Instant Reservation & PNR:** Generates unique PNRs, automatically allocates coach/seat numbers, and renders an instant booking confirmation.
- **Responsive Interface:** Modern, clean UI built using Tailwind CSS.
- **RESTful Endpoints:** Modular API layer built on Express for querying inventory and managing bookings.

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
- **Data Handling:** In-memory state and mock data

---

## Project Structure

```text
railway-reservation/
├── public/
│   ├── index.html       # Application UI & layout
│   └── app.js           # Client-side API handling & DOM manipulation
├── .gitignore           # Git ignore rules (excludes node_modules)
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Dependency lockfile
├── README.md            # Project documentation
└── server.js            # Express server & mock API endpoints
