// Simple validation helpers to avoid adding heavy dependencies

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function assertNonEmptyString(
  value: unknown,
  field: string,
  maxLength = 500
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
  if (value.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`);
  }
  return value.trim();
}

export function assertOptionalString(
  value: unknown,
  field: string,
  maxLength = 500
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`);
  }
  return value.trim() || null;
}

export function assertOptionalDate(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`${field} must be a valid date`);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return value;
}
