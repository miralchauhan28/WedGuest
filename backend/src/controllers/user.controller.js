import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { validateName, validatePasswordPair } from "../utils/authValidation.js";
import { createAdminNotification } from "../services/adminNotificationService.js";

export async function getProfile(req, res) {
  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
}

export async function updateProfile(req, res) {
  const { name } = req.body || {};
  const check = validateName(name);
  if (!check.ok) return res.status(400).json({ message: check.message });

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { name: check.value } },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found." });
  await createAdminNotification(
    "Profile updated",
    `${user.name} updated their profile details.`
  );

  res.json({
    message: "Profile updated.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
}

export async function changePassword(req, res) {
  const { oldPassword, newPassword, confirmPassword } = req.body || {};
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const ok = await bcrypt.compare(String(oldPassword || ""), user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Current password is incorrect." });

  const passCheck = validatePasswordPair(newPassword, confirmPassword);
  if (!passCheck.ok) return res.status(400).json({ message: passCheck.message });

  user.passwordHash = await bcrypt.hash(passCheck.value, 12);
  await user.save();
  await createAdminNotification(
    "Password changed",
    `${user.name} changed their account password.`
  );
  res.json({ message: "Password updated successfully." });
}
