export type UserRole = "admin" | "staff" | "member";

export interface CreateMemberInput {
  name: string;
  email: string;
  phoneNumber?: string | null;
}

export interface ValidatedMemberData {
  name: string;
  email: string;
  phoneNumber: string | null;
}

export interface ValidationResult<T = ValidatedMemberData> {
  valid: boolean;
  error?: string;
  data?: T;
}

export interface MemberRecord {
  id: string;
  name: string;
  email: string;
  memberCode: string | null;
  phoneNumber: string | null;
  role: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  activeSubscription?: {
    id: string;
    planName: string;
    startDate: Date | string;
    endDate: Date | string;
    status: string;
  } | null;
}

export function validateMemberInput(
  input: Partial<CreateMemberInput>
): ValidationResult<ValidatedMemberData> {
  if (!input.name || typeof input.name !== "string" || input.name.trim() === "") {
    return { valid: false, error: "Name is required and must not be empty" };
  }

  if (!input.email || typeof input.email !== "string" || input.email.trim() === "") {
    return { valid: false, error: "Email is required and must not be empty" };
  }

  const emailTrimmed = input.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    return { valid: false, error: "Invalid email address format" };
  }

  const phoneNumber =
    typeof input.phoneNumber === "string" && input.phoneNumber.trim() !== ""
      ? input.phoneNumber.trim()
      : null;

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      email: emailTrimmed.toLowerCase(),
      phoneNumber,
    },
  };
}

export function generateMemberCode(existingCodes: string[]): string {
  let maxNumber = 1000;

  for (const code of existingCodes) {
    if (!code) continue;
    const match = code.trim().match(/^GYM-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNumber = maxNumber + 1;
  return `GYM-${nextNumber}`;
}

export function isAuthorizedForMemberManagement(role?: string | null): boolean {
  return role === "admin" || role === "staff";
}

export function filterMembers(
  members: MemberRecord[],
  searchQuery: string
): MemberRecord[] {
  if (!searchQuery || searchQuery.trim() === "") {
    return members;
  }

  const query = searchQuery.trim().toLowerCase();

  return members.filter((member) => {
    const nameMatch = member.name.toLowerCase().includes(query);
    const emailMatch = member.email.toLowerCase().includes(query);
    const codeMatch = member.memberCode
      ? member.memberCode.toLowerCase().includes(query)
      : false;

    return nameMatch || emailMatch || codeMatch;
  });
}
