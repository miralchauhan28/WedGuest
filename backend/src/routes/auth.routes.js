import { Router } from "express";
import {
  forgotPassword,
  login,
  resetPassword,
  signup,
  verifyEmail,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
