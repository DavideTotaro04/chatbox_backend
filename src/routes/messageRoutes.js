import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getGroupMessages, deleteMessage} from "../controllers/messageControllers.js";

const router = Router();

// rotta di autenticazione per tutte le rotte
router.use(authMiddleware);

// rotte per la gestione dei messaggi
router.get("/group/:groupId", getGroupMessages);
router.delete("/:messageId", deleteMessage);

export default router;
