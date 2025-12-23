import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token mancante" });
    }

    const token = header.slice(7);
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET); // { sub, role }
        return next();
    } catch {
        return res.status(401).json({ message: "Token non valido" });
    }
}
