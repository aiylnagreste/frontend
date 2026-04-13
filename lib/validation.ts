// lib/validation.ts — shared field validators

/** SQL injection patterns to block in any text field */
const SQL_INJECTION_RE =
  /('|"|;|--|\*|\/\*|\*\/|xp_|0x[0-9a-f]+|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|EXECUTE|ALTER|CREATE|TRUNCATE|CAST|CONVERT|DECLARE|SCRIPT)\b)/i;

/**
 * Name: letters, spaces, hyphens, apostrophes, periods.
 * No digits, no SQL injection characters.
 */
export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "This field is required";
  if (/\d/.test(trimmed)) return "Name must not contain numbers";
  if (SQL_INJECTION_RE.test(trimmed)) return "Name contains invalid characters";
  if (!/^[A-Za-z\u00C0-\u024F\s'\-\.]+$/.test(trimmed))
    return "Name may only contain letters, spaces, hyphens, and apostrophes";
  return null;
}

/**
 * Phone: digits and "+" only (spaces and dashes allowed for formatting).
 */
export function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null; // phone is often optional
  if (/[A-Za-z]/.test(trimmed)) return "Phone must not contain letters";
  if (!/^\+?[\d\s\-()]+$/.test(trimmed))
    return "Phone may only contain digits and '+'";
  if (SQL_INJECTION_RE.test(trimmed)) return "Phone contains invalid characters";
  return null;
}

/**
 * Phone (required variant).
 */
export function validatePhoneRequired(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Phone number is required";
  return validatePhone(trimmed);
}

/**
 * Email: standard format.
 */
export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required";
  if (SQL_INJECTION_RE.test(trimmed)) return "Email contains invalid characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return "Enter a valid email address";
  return null;
}

/**
 * URL: must be a valid http/https URL.
 */
export function validateUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null; // URL fields are usually optional
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return "URL must start with http:// or https://";
    return null;
  } catch {
    return "Enter a valid URL (e.g. https://maps.google.com/...)";
  }
}

/**
 * Free text (description, notes, address): block SQL injection only.
 */
export function validateFreeText(value: string): string | null {
  if (SQL_INJECTION_RE.test(value)) return "Input contains invalid characters";
  return null;
}

/**
 * Generic title / label field (allows numbers, but no SQL injection).
 */
export function validateTitle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "This field is required";
  if (SQL_INJECTION_RE.test(trimmed)) return "Input contains invalid characters";
  return null;
}
