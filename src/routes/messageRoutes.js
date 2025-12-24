import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getGroupMessages, getDMMessages } from "../controllers/messageControllers.js";

const router = Router();

router.use(authMiddleware);

router.get("/group/:groupId", getGroupMessages);
router.get("/dm/:conversationId", getDMMessages);

export default router;
