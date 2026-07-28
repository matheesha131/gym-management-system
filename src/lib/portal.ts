export function calculateRemainingDays(
  endDate: Date | string,
  now = new Date()
): number {
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function determineSubscriptionStatus(
  subscription?: { status: string; endDate: Date | string } | null,
  now = new Date()
): { isActive: boolean; daysRemaining: number; statusText: string } {
  if (!subscription) {
    return {
      isActive: false,
      daysRemaining: 0,
      statusText: "No Subscription",
    };
  }

  const end = new Date(subscription.endDate);
  const isNotExpired = end > now;
  const isActiveStatus = subscription.status === "active";

  if (isActiveStatus && isNotExpired) {
    const daysRemaining = calculateRemainingDays(end, now);
    return {
      isActive: true,
      daysRemaining,
      statusText: "Active",
    };
  }

  return {
    isActive: false,
    daysRemaining: 0,
    statusText: "Expired",
  };
}

export function formatCheckInStatus(status: string): string {
  switch (status) {
    case "granted":
      return "Access Granted";
    case "denied_expired":
      return "Access Denied (Expired)";
    case "denied_no_plan":
      return "Access Denied (No Active Plan)";
    default:
      return status;
  }
}
