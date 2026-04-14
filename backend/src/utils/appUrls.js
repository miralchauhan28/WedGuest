function stripTrailingSlash(url) {
  return String(url || "").replace(/\/+$/, "");
}

function isTrustedLocalOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  try {
    const u = new URL(origin);
    const h = u.hostname.toLowerCase();
    return (h === "localhost" || h === "127.0.0.1") && (u.protocol === "http:" || u.protocol === "https:");
  } catch {
    return false;
  }
}

/**
 * Base URL for links in emails (RSVP, reset password, etc.).
 *
 * Priority:
 * 1) LINK_BASE_URL — use when you want email links to differ from FRONTEND_URL (e.g. local UI, public RSVP domain).
 * 2) In non-production, if the incoming request has Origin localhost/127.0.0.1, use that (so local dev matches the tab you’re using).
 * 3) FRONTEND_URL
 * 4) http://localhost:5173
 *
 * @param {import("express").Request} [req]
 */
export function getFrontendUrl(req) {
  const linkBase = process.env.LINK_BASE_URL?.trim();
  if (linkBase) return stripTrailingSlash(linkBase);

  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv !== "production" && req) {
    const origin = typeof req.get === "function" ? req.get("origin") : req.headers?.origin;
    if (isTrustedLocalOrigin(origin)) return stripTrailingSlash(origin);
  }

  const configured = process.env.FRONTEND_URL?.trim();
  if (configured) return stripTrailingSlash(configured);
  return "http://localhost:5173";
}

export function createVerifyEmailLink(token, req) {
  return `${getFrontendUrl(req)}/verify-email?token=${encodeURIComponent(token)}`;
}

export function createResetPasswordLink(token, req) {
  return `${getFrontendUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;
}

export function createGuestRsvpLink(token, decision, options = {}) {
  const { req, hostName, hostEmail } = options;
  const params = new URLSearchParams();
  params.set("token", String(token || ""));
  params.set("decision", String(decision || ""));
  if (hostName) params.set("hostName", String(hostName));
  if (hostEmail) params.set("hostEmail", String(hostEmail));
  return `${getFrontendUrl(req)}/guest-rsvp?${params.toString()}`;
}
