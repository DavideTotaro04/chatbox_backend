// src/server.js
import http from "http";
import dotenv from "dotenv";
import {Server} from "socket.io";
import jwt from "jsonwebtoken";

import app from "./app.js";
import connectDB from "./config/db.js";
import registerSocketHandlers from "./socket/index.js"; // assicurati che esista e faccia export default

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
});

/**
 * Socket auth (JWT)
 * Il client deve connettersi con:
 * io("http://localhost:3000", { auth: { token: "<accessToken>" } })
 */
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token mancante"));

    try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET); // { sub, role }
        return next();
    } catch {
        return next(new Error("Token non valido"));
    }
});

registerSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});

// opzionale: log errori listen (porta occupata)
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Porta già in uso: ${PORT}`);
        process.exit(1);
    }
});

