# Gym Management System

A full-stack web application for fitness facilities, managing member subscriptions, counter payments, real-time entry check-in terminals, and class scheduling & booking.

Built with **Next.js (App Router)**, **React 19**, **Drizzle ORM**, **Better Auth**, and **Tailwind CSS**.

---

## Features

### Admin & Staff Management
- **Membership Plans (`/admin/plans`)**: Define membership tiers with flexible durations, pricing, and availability states.
- **Member Directory (`/admin/members`)**: Register members with auto-generated codes (`GYM-1001`), view profile histories, and inspect attendance logs.
- **Counter Payments (`/admin/payments`)**: Log manual payments (Cash, Card, Bank Transfer, Stripe), issue auto-numbered receipts (`REC-YYYYMMDD-XXXX`), and trigger automatic subscription activation within database transactions.
- **Check-in Terminal (`/admin/terminal`)**: Kiosk-optimized entry verification scanning QR tokens or member codes. Evaluates subscription status in real-time with visual indicators (`ACCESS GRANTED`, `DENIED_EXPIRED`, `DENIED_NO_PLAN`), live audit streams, and staff manual override controls.
- **Class Scheduling (`/admin/classes`)**: Create gym class templates and schedule sessions with assigned trainers, set capacities, and start/end times.

### Member Portal
- **Dashboard (`/portal`)**: View active subscription status, remaining days countdown, and personal check-in attendance log.
- **Classes & Booking (`/portal/classes`)**: Browse upcoming class sessions, view real-time slot availability (`X Slots Left`, `FULL`, `BOOKED`), book available slots, and cancel bookings.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Database & ORM**: Drizzle ORM with MySQL (`mysql2`)
- **Authentication & RBAC**: Better Auth & Next.js Proxy Middleware
- **Styling**: Tailwind CSS 4
- **Runtime & Testing**: Bun runtime (`bun test`) & TypeScript 5

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.0 or higher) or Node.js (v20 or higher)
- MySQL Database instance

### Environment Setup
Create a `.env` file in the project root based on `.env.example`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/gym_db"
BETTER_AUTH_SECRET="your-super-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

### Installation

1. Install project dependencies:
   ```bash
   bun install
   ```

2. Run database migrations / schema sync:
   ```bash
   npx drizzle-kit push
   ```

3. Start the local development server:
   ```bash
   bun run dev
   ```

> [!NOTE]
> Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

---

## Scripts & Verification

| Command | Description |
| :--- | :--- |
| `bun run dev` | Starts Next.js development server |
| `bun run build` | Builds production bundle |
| `bun test` | Runs the full unit test suite via Bun test runner |
| `npx tsc --noEmit` | Runs TypeScript typechecker |
| `bun run lint` | Runs ESLint analysis |

---

## Application Routes

| Path | Access Role | Description |
| :--- | :--- | :--- |
| `/login` | Public | User authentication login page |
| `/register` | Public | Self-registration portal |
| `/admin/terminal` | Admin / Staff | Real-time entry verification terminal & override kiosk |
| `/admin/members` | Admin / Staff | Member directory, registration, & attendance logs |
| `/admin/payments` | Admin / Staff | Counter payment logging & subscription auto-activation |
| `/admin/plans` | Admin / Staff | Membership plan tier management |
| `/admin/classes` | Admin / Staff | Gym class templates & session scheduling |
| `/portal` | Member | Member portal dashboard & attendance history |
| `/portal/classes` | Member | Class schedule browsing & slot booking |

---

## API Endpoints

- `POST /api/check-in` — Evaluates member eligibility on code scan or handles staff override.
- `GET /api/check-in` — Fetches recent entry verification audit logs.
- `POST /api/admin/payments` — Logs counter payment and auto-activates subscription.
- `GET / POST /api/admin/classes` — Gym class templates management.
- `GET / POST /api/admin/classes/schedules` — Class session scheduling.
- `GET /api/portal/classes` — Fetches class schedule and remaining slot capacities.
- `POST /api/portal/classes/bookings` — Atomic class slot reservation.
- `POST /api/portal/classes/bookings/cancel` — Cancels booking and restores slot capacity.

> [!IMPORTANT]
> All `/api/admin/*` and `/api/check-in` endpoints enforce strict Role-Based Access Control (RBAC). Only users with `admin` or `staff` roles are permitted to perform administrative operations.
