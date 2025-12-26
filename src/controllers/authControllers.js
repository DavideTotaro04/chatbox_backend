import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModels.js";

function normalizeEmail(email) {
    if (typeof email !== "string") return "";
    return email.trim().toLowerCase();
}

function normalizeUsername(username) {
    if (typeof username !== "string") return "";
    return username.trim();
}

function isLikelyEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
    // 3-20, lettere/numeri/underscore, niente spazi
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function signAccessToken(user) {
    const payload = { sub: user._id.toString(), role: user.role };
    const expiresIn = process.env.JWT_ACCESS_EXPIRES || "15m";
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function signRefreshToken(user) {
    const payload = { sub: user._id.toString(), type: "refresh" };
    const expiresIn = process.env.JWT_REFRESH_EXPIRES || "30d";
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const username = normalizeUsername(req.body.username);
        const password = req.body.password;

        if (!email || !username || !password) {
            return res.status(400).json({ message: "Email, username e password richieste" });
        }
        if (!isLikelyEmail(email)) {
            return res.status(400).json({ message: "Email non valida" });
        }
        if (!isValidUsername(username)) {
            return res.status(400).json({
                message: "Username non valido (3-20, solo lettere/numeri/underscore)",
            });
        }
        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ message: "Password troppo corta (min 8)" });
        }

        const emailExists = await User.findOne({ email }).lean();
        if (emailExists) {
            return res.status(409).json({ message: "Email già registrata" });
        }

        const usernameExists = await User.findOne({ username }).lean();
        if (usernameExists) {
            return res.status(409).json({ message: "Username già in uso" });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, username, password: hash });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        user.refreshTokenHash = hashToken(refreshToken);
        await user.save();

        return res.status(201).json({
            message: "Registrazione avvenuta",
            user: { id: user._id, email: user.email, username: user.username, role: user.role },
            accessToken,
            refreshToken,
        });
    } catch {
        return res.status(500).json({ message: "Errore server" });
    }
}

export async function login(req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ message: "Email e password richieste" });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        user.refreshTokenHash = hashToken(refreshToken);
        await user.save();

        return res.json({
            message: "Login OK",
            user: { id: user._id, email: user.email, username: user.username, role: user.role },
            accessToken,
            refreshToken,
        });
    } catch {
        return res.status(500).json({ message: "Errore server" });
    }
}

export async function refresh(req, res) {
    try {
        const refreshToken = req.body.refreshToken;
        if (!refreshToken || typeof refreshToken !== "string") {
            return res.status(400).json({ message: "refreshToken mancante" });
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: "refreshToken non valido" });
        }

        if (payload?.type !== "refresh" || !payload?.sub) {
            return res.status(401).json({ message: "refreshToken non valido" });
        }

        const user = await User.findById(payload.sub);
        if (!user || !user.refreshTokenHash) {
            return res.status(401).json({ message: "refreshToken non valido" });
        }

        const incomingHash = hashToken(refreshToken);
        if (incomingHash !== user.refreshTokenHash) {
            return res.status(401).json({ message: "refreshToken non valido" });
        }

        const newAccessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);

        user.refreshTokenHash = hashToken(newRefreshToken);
        await user.save();

        return res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch {
        return res.status(500).json({ message: "Errore server" });
    }
}

export async function logout(req, res) {
    try {
        const refreshToken = req.body.refreshToken;
        if (!refreshToken || typeof refreshToken !== "string") {
            return res.status(400).json({ message: "refreshToken mancante" });
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch {
            return res.status(200).json({ message: "Logout OK" });
        }

        if (payload?.sub) {
            await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: null });
        }

        return res.status(200).json({ message: "Logout OK" });
    } catch {
        return res.status(500).json({ message: "Errore server" });
    }
}
