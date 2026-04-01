import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { validateEmail, validatePassword } from "../utils/authValidation.js";

export async function seedAdminUser() {
  const adminEmailRaw = process.env.ADMIN_EMAIL || "admin@wedguest.local";
  const adminPasswordRaw = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminName = process.env.ADMIN_NAME || "System Admin";

  const emailCheck = validateEmail(adminEmailRaw);
  if (!emailCheck.ok) {
    throw new Error("ADMIN_EMAIL is invalid.");
  }

  const passCheck = validatePassword(adminPasswordRaw);
  if (!passCheck.ok) {
    throw new Error(`ADMIN_PASSWORD invalid: ${passCheck.message}`);
  }

  const existing = await User.findOne({ email: emailCheck.value });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      existing.isVerified = true;
      await existing.save();
    }
    return;
  }

  const passwordHash = await bcrypt.hash(adminPasswordRaw, 12);
  await User.create({
    name: adminName,
    email: emailCheck.value,
    passwordHash,
    role: "admin",
    isVerified: true,
  });

  console.log(`Seeded admin user: ${emailCheck.value}`);
}
