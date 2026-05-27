import { timingSafeEqual } from "crypto";

export function isRegistrationRequired(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.REGISTRATION_CODE);
}

export function isRegistrationCodeValid(provided: unknown): boolean {
  const expected = process.env.REGISTRATION_CODE;
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }
  if (typeof provided !== "string") return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
