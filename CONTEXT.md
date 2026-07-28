# Gym Management System Context & Glossary

Ubiquitous language and domain model boundaries for the Gym Management System.

## Entities & Glossary

### User & Roles
- **Member**: A customer who purchases a gym membership plan and attends the facility.
- **Staff / Trainer**: An employee who records check-ins, creates subscriptions, or instructs gym classes.
- **Admin**: Gym manager with full system access.

### Subscriptions & Plans
- **MembershipPlan**: A template defining membership duration (e.g., Monthly, Annual, Day Pass) and price.
- **Subscription**: A member's active or historic purchase of a `MembershipPlan`, with explicit `startDate` and `endDate`. A member has at most one active subscription at a given time.

### Facility Access
- **CheckIn**: A timestamped log entry recording a member's entry attempt, marked as `granted` or `denied`.

### Classes & Attendance
- **GymClass**: A fitness session template (e.g. Yoga, HIIT) assigned to a trainer.
- **ClassSchedule**: A scheduled instance of a `GymClass` with `startTime`, `endTime`, and seat `capacity`.
- **ClassBooking**: A reservation made by a member for a `ClassSchedule`.

### Financials
- **Payment**: A recorded financial transaction linked to a member and subscription, capturing payment method (`cash`, `card`, `bank_transfer`) and completion timestamp.
