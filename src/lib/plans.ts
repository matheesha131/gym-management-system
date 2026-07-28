export interface CreatePlanInput {
  name: string;
  description?: string | null;
  durationDays: number;
  price: number | string;
  isActive?: boolean;
}

export interface ValidatedPlanData {
  name: string;
  description?: string | null;
  durationDays: number;
  price: string;
  isActive: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: ValidatedPlanData;
}

export function validatePlanInput(input: Partial<CreatePlanInput>): ValidationResult {
  if (!input.name || typeof input.name !== "string" || input.name.trim() === "") {
    return { valid: false, error: "Name is required and must not be empty" };
  }

  const durationDays = Number(input.durationDays);
  if (isNaN(durationDays) || !Number.isInteger(durationDays) || durationDays <= 0) {
    return { valid: false, error: "Duration (days) must be a positive integer" };
  }

  const priceNum = Number(input.price);
  if (isNaN(priceNum) || priceNum < 0) {
    return { valid: false, error: "Price must be a non-negative number" };
  }

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      durationDays,
      price: priceNum.toFixed(2),
      isActive: input.isActive ?? true,
    },
  };
}

export function isAuthorizedForPlanMutation(role?: string | null): boolean {
  return role === "admin" || role === "staff";
}
