/**
 * Field checks shared by the sign-up form.
 *
 * These mirror the server's rules so the browser never accepts something the
 * API will reject. The server still validates everything — this is guidance,
 * not enforcement.
 */

export function emailProblem(value: string): string | null {
  const email = value.trim();
  if (email === "") return null; // nothing typed yet — say nothing
  // One @, something before it, and a dotted domain after it.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "That does not look like a complete email address.";
  }
  return null;
}

export function phoneProblem(value: string): string | null {
  const phone = value.trim();
  if (phone === "") return null;
  if (/[a-zA-Z]/.test(phone)) {
    return "A mobile number should not contain letters.";
  }
  const digits = phone.replace(/\D+/g, "");
  if (digits.length < 8) return "That number looks too short.";
  if (digits.length > 15) return "That number looks too long.";
  return null;
}

export function passwordProblem(value: string): string | null {
  if (value === "") return null;
  if (value.length < 10) {
    return `A little longer, please — ${10 - value.length} more character${
      10 - value.length === 1 ? "" : "s"
    }.`;
  }
  return null;
}
