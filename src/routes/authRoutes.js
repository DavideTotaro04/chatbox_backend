import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/authControllers.js";

const router = Router();

// rotte di autenticazione
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
