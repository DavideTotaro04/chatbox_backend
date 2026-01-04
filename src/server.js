// src/server.js
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import app from "./app.js";
import connectDB from "./config/db.js";
import registerSocketHandlers from "./socket/index.js";

dotenv.config();
await connectDB();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
    // opzionali ma utili
    pingInterval: 25000,
    pingTimeout: 20000,
});

// --- helpers ---
function extractBearerToken(value) {
    if (!value || typeof value !== "string") return null;
    if (value.startsWith("Bearer ")) return value.slice(7);
    return value;
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

function scheduleExpiryDisconnect(socket, payload) {
    // exp è in secondi unix
    if (!payload?.exp) return;
    const ms = payload.exp * 1000 - Date.now();
    if (ms <= 0) {
        // già scaduto
        socket.disconnect(true);
        return;
    }

    // pulisci timer precedente
    if (socket.data.expTimer) clearTimeout(socket.data.expTimer);

    // disconnessione quando scade
    socket.data.expTimer = setTimeout(() => {
        socket.disconnect(true);
    }, ms);
}

// Middleware di auth: accetta token da handshake.auth.token o header Authorization
io.use((socket, next) => {
    try {
        const token =
            extractBearerToken(socket.handshake?.auth?.token) ||
            extractBearerToken(socket.handshake?.headers?.authorization);

        if (!token) return next(new Error("Auth token missing"));

        const payload = verifyAccessToken(token);

        socket.data.user = payload; // { sub, role, iat, exp }
        socket.data.userId = payload.sub;

        scheduleExpiryDisconnect(socket, payload);

        return next();
    } catch (err) {
        return next(new Error("Auth token invalid"));
    }
});

io.on("connection", (socket) => {
    // ✅ "chiave di sessione" Socket.IO
    console.log("[socket] connected", {
        socketId: socket.id,
        userId: socket.data.userId,
    });

    socket.on("auth:refresh", (data, ack) => {
        try {
            const token = extractBearerToken(data?.token);
            if (!token) return ack?.({ ok: false, error: "Token mancante" });

            const payload = verifyAccessToken(token);

            socket.data.user = payload;
            socket.data.userId = payload.sub;

            scheduleExpiryDisconnect(socket, payload);

            // ✅ log anche dopo refresh
            console.log("[socket] refreshed", {
                socketId: socket.id,
                userId: socket.data.userId,
            });

            return ack?.({ ok: true });
        } catch {
            return ack?.({ ok: false, error: "Token non valido" });
        }
    });

    socket.on("disconnect", (reason) => {
        if (socket.data.expTimer) clearTimeout(socket.data.expTimer);
        console.log("[socket] disconnected", {
            socketId: socket.id,
            userId: socket.data.userId,
            reason,
        });
    });
});

registerSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Errore: la porta ${PORT} è già in uso.`);
    } else {
        console.error("Errore del server:", err);
    }
    process.exit(1);
});
