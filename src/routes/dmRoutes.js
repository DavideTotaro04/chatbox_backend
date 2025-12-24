import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createOrGetDM } from "../controllers/dmControllers.js";

const router = Router();

router.use(authMiddleware);

// crea o ritorna una conversazione DM
router.post("/", createOrGetDM);

export default router;
