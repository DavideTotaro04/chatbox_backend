import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getGroupMessages, deleteMessage} from "../controllers/messageControllers.js";

const router = Router();

router.use(authMiddleware);

router.get("/group/:groupId", getGroupMessages);
router.delete("/:messageId", deleteMessage);


export default router;
