export function validateEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalized || !emailRegex.test(normalized)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  return { ok: true, value: normalized };
}

export function validateName(name) {
  const value = String(name || "").trim();
  if (value.length < 2) {
    return { ok: false, message: "Name must be at least 2 characters." };
  }
  if (value.length > 80) {
    return { ok: false, message: "Name must be 80 characters or less." };
  }
  return { ok: true, value };
}

export function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(value)) {
    return { ok: false, message: "Password must include an uppercase letter." };
  }
  if (!/[a-z]/.test(value)) {
    return { ok: false, message: "Password must include a lowercase letter." };
  }
  if (!/\d/.test(value)) {
    return { ok: false, message: "Password must include a number." };
  }
  if (!/[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/.test(value)) {
    return { ok: false, message: "Password must include a special character." };
  }
  return { ok: true, value };
}

export function validatePasswordPair(password, confirmPassword) {
  const passCheck = validatePassword(password);
  if (!passCheck.ok) {
    return passCheck;
  }
  if (String(password) !== String(confirmPassword || "")) {
    return { ok: false, message: "Password and confirm password do not match." };
  }
  return { ok: true, value: String(password) };
}
