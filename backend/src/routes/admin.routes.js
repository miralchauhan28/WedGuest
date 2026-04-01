import { Router } from "express";
import { requireAdminRole, requireAuth } from "../middleware/auth.middleware.js";
import * as admin from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth, requireAdminRole);

router.get("/dashboard", admin.getAdminDashboard);
router.get("/weddings", admin.listAdminWeddings);
router.get("/weddings/:weddingId/guests", admin.listAdminWeddingGuests);
router.get("/users", admin.listAdminUsers);
router.post("/users", admin.createAdminUser);
router.put("/users/:id", admin.updateAdminUser);
router.delete("/users/:id", admin.deleteAdminUser);
router.get("/notifications", admin.listAdminNotifications);
router.patch("/notifications/:id/read", admin.markAdminNotificationRead);
router.delete("/notifications", admin.clearAdminNotifications);

export default router;
