export const SUBSCRIPTION_STATUSES = ["active", "expired", "cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const CHECKIN_STATUSES = ["granted", "denied_expired", "denied_no_plan"] as const;
export type CheckInStatus = (typeof CHECKIN_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "stripe"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["completed", "pending", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUSES = ["booked", "confirmed", "cancelled", "attended"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
