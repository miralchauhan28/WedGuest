import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, getJwtSecret());
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }
}

export function requireUserRole(req, res, next) {
  if (req.userRole !== "user") {
    return res.status(403).json({ message: "This area is for wedding hosts only." });
  }
  next();
}

export function requireAdminRole(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "This area is for administrators only." });
  }
  next();
}
