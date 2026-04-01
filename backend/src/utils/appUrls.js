export function getFrontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

export function createVerifyEmailLink(token) {
  return `${getFrontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export function createResetPasswordLink(token) {
  return `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export function createGuestRsvpLink(token, decision, options = {}) {
  const params = new URLSearchParams();
  params.set("token", String(token || ""));
  params.set("decision", String(decision || ""));
  if (options.hostName) params.set("hostName", String(options.hostName));
  if (options.hostEmail) params.set("hostEmail", String(options.hostEmail));
  return `${getFrontendUrl()}/guest-rsvp?${params.toString()}`;
}
