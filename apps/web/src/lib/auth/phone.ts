export function normalizePhoneNumber(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!compact) return undefined;
  if (!/^\+?\d{8,15}$/.test(compact)) return undefined;
  if (compact.startsWith("+")) return compact;
  if (/^[456789]\d{7}$/.test(compact)) return `+852${compact}`;
  return compact;
}

export function formatPhoneNumberForDisplay(phoneNumber?: string | null) {
  if (!phoneNumber) return undefined;
  const normalized = normalizePhoneNumber(phoneNumber) ?? phoneNumber.trim();
  const hkMatch = normalized.match(/^\+852(\d{4})(\d{4})$/);
  if (hkMatch) return `+852 ${hkMatch[1]} ${hkMatch[2]}`;
  return normalized;
}

type PrintWatermarkIdentity = {
  email: string;
  phoneNumber?: string | null;
  date: string;
  authorization: string;
};

export function buildPrintWatermarkText({ email, phoneNumber, date, authorization }: PrintWatermarkIdentity) {
  const phoneText = formatPhoneNumberForDisplay(phoneNumber);
  return [email, phoneText ? `電話 ${phoneText}` : "電話未提供", date, authorization].join(" · ");
}
