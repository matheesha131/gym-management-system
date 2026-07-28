# [SPEC] Gym Management System Complete System Specification

## Problem Statement

Gym operators lack an integrated, streamlined system to manage member accounts, handle plan subscriptions and counter payments, validate member entry at check-in terminals, and schedule gym classes. Existing solutions are either overly complex multi-tenant SaaS platforms or disjointed manual spreadsheets that lead to unauthorized gym entry, expired membership oversights, and lack of real-time audit logs.

## Solution

The Gym Management System is a clean, single-tenant management platform built with Next.js App Router, shadcn/ui, Better Auth, and MariaDB (via Drizzle ORM). It features role-based access control separating Member self-service (`/portal/*`) from Admin/Staff operations (`/admin/*`), manual counter payment logging with automatic receipt and subscription lifecycle management, an instant entry check-in validation terminal, and class scheduling.

## User Stories

1. As an admin or staff member, I want to authenticate into the system using my email and password, so that I can access management features securely.
2. As a member, I want to log in using my credentials, so that I can view my active membership status and check-in history.
3. As a staff member, I want to create a new member record with contact details, so that they can be registered in the gym system.
4. As a staff member, I want to view a searchable list of all registered members, so that I can quickly find member profiles.
5. As a staff member, I want to select a membership plan (e.g. Monthly, Annual, Day Pass) and log a counter payment (cash, card terminal, or bank transfer), so that the member's subscription is activated immediately.
6. As a staff member, I want a unique receipt reference number auto-generated for every payment, so that financial logs remain traceable.
7. As a staff member, I want to view all logged payments and financial receipts, so that I can perform daily register reconciliation.
8. As a member, I want to view my active subscription details including plan name, start date, and expiration date on my portal dashboard, so that I know when my renewal is due.
9. As a staff member operating the check-in terminal, I want to scan a member's ID badge or QR code, so that entry eligibility is validated instantly.
10. As a staff member operating the check-in terminal, I want to see a clear visual status screen (Green `GRANTED`, Red `DENIED_EXPIRED`, Amber `DENIED_NO_PLAN`), so that entry decisions can be made without delay.
11. As a staff member, I want the ability to perform a manual check-in override for a member with an expired or missing plan, so that exceptions can be granted with an audit note.
12. As a member, I want to view my historical check-in timestamps and entry statuses, so that I can track my gym attendance.
13. As an admin, I want to create and update membership plans with pricing and duration in days, so that pricing offerings stay current.
14. As an admin or staff member, I want to schedule gym classes specifying title, trainer, capacity, start time, and end time, so that members can book attendance.
15. As a member, I want to browse upcoming gym classes and book a slot if capacity is available, so that I can reserve my spot in advance.
16. As a member, I want to cancel my class booking prior to class start, so that my slot is freed for other members.
17. As an admin, I want unauthorized role access attempts automatically blocked and redirected via middleware, so that security boundaries between portal and admin routes are enforced.

## Implementation Decisions

- **Framework & ORM**: Next.js App Router (TypeScript) with Drizzle ORM over MariaDB using `mysql2` driver.
- **Authentication & RBAC**: Better Auth integration using `@better-auth/drizzle-adapter` with user roles (`admin`, `staff`, `member`) enforced via Next.js Middleware router guards.
- **Domain Data Schema**:
  - `user`: Extended with role and `memberCode` fields.
  - `membership_plan`: `id`, `name`, `description`, `price`, `durationDays`, `isActive`.
  - `subscription`: `id`, `userId`, `planId`, `startDate`, `endDate`, `status` (`active`, `expired`, `cancelled`).
  - `payment`: `id`, `subscriptionId`, `userId`, `amount`, `paymentMethod` (`cash`, `card_counter`, `bank_transfer`, `stripe`), `receiptRef` (`REC-YYYYMMDD-XXXX`), `notes`, `createdById`, `createdAt`.
  - `check_in`: `id`, `userId`, `scannedCode`, `status` (`granted`, `denied_expired`, `denied_no_plan`), `isOverride`, `overrideNotes`, `createdById`, `createdAt`.
  - `gym_class`: `id`, `name`, `description`, `capacity`.
  - `class_schedule`: `id`, `classId`, `trainerId`, `startTime`, `endTime`, `currentBookings`.
  - `class_booking`: `id`, `scheduleId`, `userId`, `status` (`booked`, `cancelled`), `createdAt`.
- **Payment & Subscription Lifecycle**: Logging payment auto-generates receipt reference, sets `subscription.status = 'active'`, `startDate = now()`, and `endDate = now() + plan.durationDays`. Schema includes provider abstraction to accommodate Phase 2 Stripe webhooks.
- **Check-in Terminal Logic**: Real-time evaluation of member QR/ID code against active subscription. Terminal prototype pattern preserved from `prototype/check-in-flow` branch:
```ts
// Inlined decision logic from prototype (prototype/check-in-flow)
type CheckInStatus = 'granted' | 'denied_expired' | 'denied_no_plan' | 'invalid_code';
```
- **Design System & UI Aesthetics**: Minimal, clean dark/light UI tokens adhering to `docs/design-system.md` and `frontend-design` guidance.

## Testing Decisions

- **Testing Principles**: Tests strictly evaluate observable external system behavior, API contracts, and HTTP status codes, never internal module private state or mock implementations.
- **Tested Modules**:
  - Auth & Middleware guards (`/api/auth/*`, `/admin/*`, `/portal/*`).
  - Member & Subscription management service API handlers.
  - Payment logging & subscription auto-activation integration.
  - Check-in terminal verification route handler.
- **Prior Art**: Vitest / Playwright integration suites executing against a local test database instance.

## Out of Scope

- Native mobile applications (iOS / Android).
- Multi-gym multi-tenant franchise SaaS model.
- Automated online Stripe recurring subscriptions (Phase 2 roadmap).
- Automated SMS/email notification queue service.

## Further Notes

- All decisions synthesized directly from Wayfinder Map #1 (Issues #2 - #8).
- Domain vocabulary aligns with `CONTEXT.md`.
