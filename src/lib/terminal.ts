import { CheckInStatus } from "@/db/schema/domain";

export interface SubscriptionRecord {
  id: string;
  planName: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
}

export interface EligibilityResult {
  status: CheckInStatus;
  subscription: SubscriptionRecord | null;
}

export function isAuthorizedForCheckIn(role?: string | null): boolean {
  return role === "admin" || role === "staff";
}

export function evaluateEntryEligibility(
  subscriptions: SubscriptionRecord[],
  now = new Date()
): EligibilityResult {
  if (!subscriptions || subscriptions.length === 0) {
    return {
      status: "denied_no_plan",
      subscription: null,
    };
  }

  // Find active non-expired subscription
  const activeSub = subscriptions.find((sub) => {
    const end = new Date(sub.endDate);
    return sub.status === "active" && end > now;
  });

  if (activeSub) {
    return {
      status: "granted",
      subscription: activeSub,
    };
  }

  // If no active valid subscription, get the most relevant/recent subscription
  const sorted = [...subscriptions].sort((a, b) => {
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
  });

  const latestSub = sorted[0];

  return {
    status: "denied_expired",
    subscription: latestSub || null,
  };
}

export interface CheckInInput {
  code: string;
}

export function validateCheckInInput(data: any): {
  valid: boolean;
  error?: string;
  data?: CheckInInput;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  const rawCode = data.code || data.scannedCode || data.memberCode;
  if (!rawCode || typeof rawCode !== "string" || !rawCode.trim()) {
    return { valid: false, error: "Member code or QR token is required" };
  }

  return {
    valid: true,
    data: {
      code: rawCode.trim(),
    },
  };
}

export interface OverrideInput {
  memberId: string;
  overrideNotes: string;
  scannedCode?: string;
}

export function validateOverrideInput(data: any): {
  valid: boolean;
  error?: string;
  data?: OverrideInput;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  if (!data.memberId || typeof data.memberId !== "string" || !data.memberId.trim()) {
    return { valid: false, error: "Member ID is required for staff override" };
  }

  if (!data.overrideNotes || typeof data.overrideNotes !== "string" || !data.overrideNotes.trim()) {
    return { valid: false, error: "Audit notes are required for staff override" };
  }

  return {
    valid: true,
    data: {
      memberId: data.memberId.trim(),
      overrideNotes: data.overrideNotes.trim(),
      scannedCode: data.scannedCode ? String(data.scannedCode).trim() : undefined,
    },
  };
}
