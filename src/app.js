import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: process.env.CORS || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ROUTE
app.use("/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);
app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));
app.get('/', (req, res) => res.send('backend funzionante'));

// 404 (nessuna rotta ha risposto)
app.use((req, res) => {
    res.status(404).json({ message: "Rotta non trovata" });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Errore interno del server" });
});

export default app;