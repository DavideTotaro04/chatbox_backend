import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getGroupMessages} from "../controllers/messageControllers.js";
import { deleteMessage } from "../controllers/messageControllers.js";

const router = Router();

router.use(authMiddleware);

router.get("/group/:groupId", getGroupMessages);
router.delete("/:messageId", deleteMessage);


export default router;
