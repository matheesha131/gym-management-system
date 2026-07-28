export type UserRole = "admin" | "staff" | "member";

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

export interface ValidationResult<T = ValidatedPlanData> {
  valid: boolean;
  error?: string;
  data?: T;
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
      description: typeof input.description === "string" ? input.description.trim() : null,
      durationDays,
      price: priceNum.toFixed(2),
      isActive: input.isActive ?? true,
    },
  };
}

export function validatePlanUpdate(body: Record<string, any>): ValidationResult<Record<string, any>> {
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return { valid: false, error: "Name must be a non-empty string" };
    }
    updateData.name = body.name.trim();
  }

  if (body.description !== undefined) {
    updateData.description = typeof body.description === "string" ? body.description.trim() : null;
  }

  if (body.durationDays !== undefined) {
    const durationDays = Number(body.durationDays);
    if (isNaN(durationDays) || !Number.isInteger(durationDays) || durationDays <= 0) {
      return { valid: false, error: "Duration (days) must be a positive integer" };
    }
    updateData.durationDays = durationDays;
  }

  if (body.price !== undefined) {
    const priceNum = Number(body.price);
    if (isNaN(priceNum) || priceNum < 0) {
      return { valid: false, error: "Price must be a non-negative number" };
    }
    updateData.price = priceNum.toFixed(2);
  }

  if (body.isActive !== undefined) {
    updateData.isActive = Boolean(body.isActive);
  }

  return { valid: true, data: updateData };
}

export function isAuthorizedForPlanMutation(role?: string | null): boolean {
  return role === "admin" || role === "staff";
}
