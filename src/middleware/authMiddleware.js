// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token mancante" });
    }

    const token = header.slice(7);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET); // { sub, role, iat, exp }

        req.user = payload;
        req.userId = payload.sub; // standard
        req.userRole = payload.role; // opzionale, utile

        return next();
    } catch {
        return res.status(401).json({ message: "Token non valido" });
    }
}
