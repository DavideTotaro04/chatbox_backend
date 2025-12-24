import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    createGroup,
    listPublicGroups,
    listMyGroups,
    joinGroup,
    leaveGroup,
} from "../controllers/groupControllers.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createGroup);
router.get("/", listPublicGroups);
router.get("/me", listMyGroups);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);

export default router;

