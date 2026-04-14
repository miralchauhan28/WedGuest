import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { validateEmail, validateName, validatePasswordPair } from "../utils/authValidation.js";
import { createResetToken, hashToken } from "../utils/tokens.js";
import { createResetPasswordLink } from "../utils/appUrls.js";
import { sendResetPasswordEmail } from "../services/mailService.js";
import { signUserToken } from "../utils/jwt.js";

export async function signup(req, res) {
  const { name, email, password, confirmPassword } = req.body || {};

  const nameCheck = validateName(name);
  if (!nameCheck.ok) return res.status(400).json({ message: nameCheck.message });

  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });

  const passCheck = validatePasswordPair(password, confirmPassword);
  if (!passCheck.ok) return res.status(400).json({ message: passCheck.message });

  const existing = await User.findOne({ email: emailCheck.value });
  if (existing) {
    return res.status(409).json({ message: "Email already exists. Please log in instead." });
  }

  const passwordHash = await bcrypt.hash(passCheck.value, 12);

  const user = await User.create({
    name: nameCheck.value,
    email: emailCheck.value,
    passwordHash,
    role: "user",
    isVerified: true,
  });

  const token = signUserToken(user);

  return res.status(201).json({
    message: "Account created. Welcome!",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
}

export async function verifyEmail(req, res) {
  const token = String(req.query.token || req.body?.token || "");
  if (!token) return res.status(400).json({ message: "Verification token is required." });

  const successMsg = "Verification successful. Now login successfully in your account.";
  const hashed = hashToken(token);

  const user = await User.findOne({ verificationTokenHash: hashed });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification link." });
  }

  if (user.isVerified) {
    return res.json({ message: successMsg });
  }

  if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired verification link." });
  }

  user.isVerified = true;
  await user.save();
  return res.json({ message: successMsg });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });
  if (!password) return res.status(400).json({ message: "Password is required." });

  const user = await User.findOne({ email: emailCheck.value });
  if (!user) return res.status(401).json({ message: "Invalid email or password." });
  if (user.isActive === false) {
    return res.status(403).json({ message: "Your account is inactive. Contact admin." });
  }

  const passwordOk = await bcrypt.compare(String(password), user.passwordHash);
  if (!passwordOk) return res.status(401).json({ message: "Invalid email or password." });

  if (user.role === "user" && !user.isVerified) {
    return res.status(403).json({ message: "Please verify your email before logging in." });
  }

  if (user.isVerified && (user.verificationTokenHash || user.verificationTokenExpiresAt)) {
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();
  }

  const token = signUserToken(user);

  return res.json({
    message: "Login successful.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.body || {};
  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message });

  const user = await User.findOne({ email: emailCheck.value });
  if (!user) {
    return res.json({ message: "Check your inbox for a link to reset your password." });
  }

  const resetToken = createResetToken();
  const resetLink = createResetPasswordLink(resetToken, req);
  user.resetTokenHash = hashToken(resetToken);
  user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  try {
    await sendResetPasswordEmail(emailCheck.value, resetLink);
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
    return res.status(503).json({
      message:
        "We could not send the email right now. Check your SMTP settings in backend/.env and try again.",
    });
  }

  return res.json({
    message: "Check your inbox for a link to reset your password.",
  });
}

export async function resetPassword(req, res) {
  const { token, password, confirmPassword } = req.body || {};
  if (!token) return res.status(400).json({ message: "Reset token is required." });

  const passCheck = validatePasswordPair(password, confirmPassword);
  if (!passCheck.ok) return res.status(400).json({ message: passCheck.message });

  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

  user.passwordHash = await bcrypt.hash(passCheck.value, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  return res.json({ message: "Password reset successful. Please log in." });
}
