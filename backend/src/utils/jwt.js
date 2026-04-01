import jwt from "jsonwebtoken";

export function getJwtSecret() {
  return process.env.JWT_SECRET || "wedguest-dev-secret-change-in-production";
}

export function signUserToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}
