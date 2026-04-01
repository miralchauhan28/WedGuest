export function validatePassword(password) {
  const value = String(password || "");
  const errors = [];
  if (value.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(value)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(value)) errors.push("one lowercase letter");
  if (!/\d/.test(value)) errors.push("one number");
  if (!/[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/.test(value)) errors.push("one special character");
  return errors;
}
