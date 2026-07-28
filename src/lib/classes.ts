export function isAuthorizedForClassManagement(role?: string | null): boolean {
  return role === "admin" || role === "staff";
}

export interface ClassInput {
  name: string;
  description?: string | null;
  trainerId?: string | null;
  capacity?: number;
}

export function validateClassInput(data: any): {
  valid: boolean;
  error?: string;
  data?: ClassInput;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    return { valid: false, error: "Class name is required" };
  }

  const capacity = data.capacity !== undefined ? Number(data.capacity) : 20;

  if (isNaN(capacity) || capacity < 1) {
    return { valid: false, error: "Capacity must be a positive integer" };
  }

  return {
    valid: true,
    data: {
      name: data.name.trim(),
      description: data.description ? String(data.description).trim() : null,
      trainerId: data.trainerId ? String(data.trainerId).trim() : null,
      capacity,
    },
  };
}

export interface ScheduleInput {
  classId: string;
  trainerId?: string | null;
  startTime: string;
  endTime: string;
}

export function validateScheduleInput(data: any): {
  valid: boolean;
  error?: string;
  data?: ScheduleInput;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  if (!data.classId || typeof data.classId !== "string" || !data.classId.trim()) {
    return { valid: false, error: "Class ID is required" };
  }

  if (!data.startTime || isNaN(Date.parse(data.startTime))) {
    return { valid: false, error: "Valid start time is required" };
  }

  if (!data.endTime || isNaN(Date.parse(data.endTime))) {
    return { valid: false, error: "Valid end time is required" };
  }

  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (end <= start) {
    return { valid: false, error: "End time must be after start time" };
  }

  return {
    valid: true,
    data: {
      classId: data.classId.trim(),
      trainerId: data.trainerId ? String(data.trainerId).trim() : null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  };
}

export interface ScheduleRecord {
  currentBookings: number;
  capacity: number;
  startTime: Date | string;
}

export interface BookingRecord {
  id: string;
  status: string;
}

export function canBookClass(
  schedule: ScheduleRecord,
  existingBooking?: BookingRecord | null,
  now = new Date()
): { canBook: boolean; reason?: string } {
  if (
    existingBooking &&
    (existingBooking.status === "booked" || existingBooking.status === "confirmed")
  ) {
    return { canBook: false, reason: "You are already booked for this class" };
  }

  const start = new Date(schedule.startTime);
  if (start <= now) {
    return { canBook: false, reason: "Cannot book a past class session" };
  }

  if (schedule.currentBookings >= schedule.capacity) {
    return { canBook: false, reason: "Class session is fully booked" };
  }

  return { canBook: true };
}

export function canCancelBooking(
  booking: BookingRecord,
  schedule: ScheduleRecord,
  now = new Date()
): { canCancel: boolean; reason?: string } {
  if (booking.status === "cancelled") {
    return { canCancel: false, reason: "Booking is already cancelled" };
  }

  return { canCancel: true };
}
