import { Router } from "express";
import { respondGuestInvitation } from "../controllers/guest.controller.js";

const router = Router();

router.post("/respond", respondGuestInvitation);

export default router;
