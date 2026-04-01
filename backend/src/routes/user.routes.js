import { Router } from "express";
import { requireAuth, requireUserRole } from "../middleware/auth.middleware.js";
import * as dash from "../controllers/dashboard.controller.js";
import * as user from "../controllers/user.controller.js";

const router = Router();

router.use(requireAuth, requireUserRole);

router.get("/me", user.getProfile);
router.get("/dashboard", dash.getUserDashboard);
router.patch("/profile", user.updateProfile);
router.patch("/password", user.changePassword);

export default router;
