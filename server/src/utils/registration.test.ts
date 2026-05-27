import { afterEach, describe, expect, it } from "vitest";
import { isRegistrationCodeValid } from "./registration.js";

describe("registration", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.REGISTRATION_CODE;
  });

  it("allows any code in dev when REGISTRATION_CODE is unset", () => {
    expect(isRegistrationCodeValid("anything")).toBe(true);
  });

  it("validates code with timing-safe compare when set", () => {
    process.env.REGISTRATION_CODE = "abc123";
    expect(isRegistrationCodeValid("abc123")).toBe(true);
    expect(isRegistrationCodeValid("wrong")).toBe(false);
    expect(isRegistrationCodeValid(undefined)).toBe(false);
  });
});
