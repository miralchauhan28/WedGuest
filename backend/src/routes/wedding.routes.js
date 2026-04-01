import { Router } from "express";
import multer from "multer";
import { requireAuth, requireUserRole } from "../middleware/auth.middleware.js";
import * as wedding from "../controllers/wedding.controller.js";
import * as guest from "../controllers/guest.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(requireAuth, requireUserRole);

router.get("/", wedding.listWeddings);
router.post("/", wedding.createWedding);

router.get("/:weddingId/guests/template", guest.downloadTemplate);
router.post("/:weddingId/guests/bulk", upload.single("file"), guest.bulkUploadGuests);
router.get("/:weddingId/guests", guest.listGuests);
router.post("/:weddingId/guests", guest.createGuest);
router.put("/:weddingId/guests/:guestId", guest.updateGuest);
router.delete("/:weddingId/guests/:guestId", guest.deleteGuest);

router.get("/:id", wedding.getWedding);
router.put("/:id", wedding.updateWedding);
router.delete("/:id", wedding.deleteWedding);

export default router;
