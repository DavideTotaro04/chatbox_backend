import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    createGroup,
    listPublicGroups,
    listMyGroups,
    joinGroup,
    leaveGroup,
    addMemberByEmail,
    myGroupRole,
    getGroupById,
    deleteGroup
} from "../controllers/groupControllers.js";

const router = Router();

// rotta di autenticazione per tutte le rotte
router.use(authMiddleware);

// rotte per la gestione dei gruppi
router.post("/", createGroup);
router.get("/", listPublicGroups);
router.get("/me", listMyGroups);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);
router.post("/:groupId/members", addMemberByEmail);
router.get("/:groupId/me", myGroupRole);
router.get("/:id", getGroupById);
router.delete("/:id", deleteGroup);

export default router;

