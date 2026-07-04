import { describe, expect, it } from "vitest";
import { buildPrintWatermarkText, formatPhoneNumberForDisplay, normalizePhoneNumber } from "./phone";

describe("phone helpers", () => {
  it("normalizes Hong Kong phone numbers for registration", () => {
    expect(normalizePhoneNumber("9123 4567")).toBe("+85291234567");
    expect(normalizePhoneNumber("+852 9123 4567")).toBe("+85291234567");
  });

  it("rejects invalid phone numbers", () => {
    expect(normalizePhoneNumber("123")).toBeUndefined();
    expect(normalizePhoneNumber("abc91234567")).toBeUndefined();
  });

  it("adds the phone number to print watermark text", () => {
    expect(buildPrintWatermarkText({
      email: "parent@example.com",
      phoneNumber: "+85291234567",
      date: "2026-07-04",
      authorization: "PRINT-ABC12345",
    })).toBe("parent@example.com · 電話 +852 9123 4567 · 2026-07-04 · PRINT-ABC12345");
  });

  it("formats stored phone numbers for display", () => {
    expect(formatPhoneNumberForDisplay("+85291234567")).toBe("+852 9123 4567");
  });
});
