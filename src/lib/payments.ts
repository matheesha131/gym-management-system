import { PAYMENT_METHODS, PaymentMethod } from "@/db/schema/domain";

export interface CreatePaymentInput {
  memberId: string;
  planId: string;
  paymentMethod: string;
  amount?: number | string | null;
  notes?: string | null;
}

export interface ValidatedPaymentData {
  memberId: string;
  planId: string;
  paymentMethod: PaymentMethod;
  amount: string | null;
  notes: string | null;
}

export interface ValidationResult<T = ValidatedPaymentData> {
  valid: boolean;
  error?: string;
  data?: T;
}

export interface PaymentRecord {
  id: string;
  receiptRef: string;
  amount: string;
  paymentMethod: string;
  status: string;
  notes?: string | null;
  paidAt: Date | string;
  member: {
    id: string;
    name: string;
    email: string;
    memberCode: string | null;
  };
  plan?: {
    id: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

export function validatePaymentInput(
  input: Partial<CreatePaymentInput>
): ValidationResult<ValidatedPaymentData> {
  if (!input.memberId || typeof input.memberId !== "string" || input.memberId.trim() === "") {
    return { valid: false, error: "Member selection is required" };
  }

  if (!input.planId || typeof input.planId !== "string" || input.planId.trim() === "") {
    return { valid: false, error: "Plan selection is required" };
  }

  if (!input.paymentMethod || typeof input.paymentMethod !== "string") {
    return { valid: false, error: "Payment method is required" };
  }

  const method = input.paymentMethod.trim() as PaymentMethod;
  const validMethods = [...PAYMENT_METHODS, "card_counter", "card"];
  if (!validMethods.includes(method as any)) {
    return { valid: false, error: "Invalid payment method" };
  }

  let amountStr: string | null = null;
  if (input.amount !== undefined && input.amount !== null && input.amount !== "") {
    const num = Number(input.amount);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: "Amount must be a non-negative number" };
    }
    amountStr = num.toFixed(2);
  }

  const notes =
    typeof input.notes === "string" && input.notes.trim() !== ""
      ? input.notes.trim()
      : null;

  return {
    valid: true,
    data: {
      memberId: input.memberId.trim(),
      planId: input.planId.trim(),
      paymentMethod: method,
      amount: amountStr,
      notes,
    },
  };
}

export function generateReceiptRef(date = new Date(), existingRefs: string[] = []): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  const prefix = `REC-${dateStr}-`;
  let maxSeq = 1000;

  for (const ref of existingRefs) {
    if (!ref) continue;
    const trimmed = ref.trim();
    if (trimmed.startsWith(prefix)) {
      const seqStr = trimmed.slice(prefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${nextSeq}`;
}

export function calculateSubscriptionDates(
  durationDays: number,
  startDate = new Date()
): { startDate: Date; endDate: Date } {
  const start = new Date(startDate.getTime());
  const end = new Date(start.getTime() + durationDays * 86400000);
  return { startDate: start, endDate: end };
}

export function isAuthorizedForPaymentManagement(role?: string | null): boolean {
  return role === "admin" || role === "staff";
}

export function filterPayments(
  payments: PaymentRecord[],
  searchQuery: string
): PaymentRecord[] {
  if (!searchQuery || searchQuery.trim() === "") {
    return payments;
  }

  const query = searchQuery.trim().toLowerCase();

  return payments.filter((payment) => {
    const refMatch = payment.receiptRef.toLowerCase().includes(query);
    const memberNameMatch = payment.member?.name?.toLowerCase().includes(query) ?? false;
    const memberCodeMatch = payment.member?.memberCode?.toLowerCase().includes(query) ?? false;
    const planMatch = payment.plan?.name?.toLowerCase().includes(query) ?? false;

    return refMatch || memberNameMatch || memberCodeMatch || planMatch;
  });
}
