import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";

import app from "./app.js";
import connectDB from "./config/db.js";
import registerSocketHandlers from "./socket/index.js"; // o ./sockets/index.js se la cartella è "sockets"

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

registerSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
