import jwt from "jsonwebtoken";

// middleware di autenticazione JWT
export default function authMiddleware(req, res, next) {
    const header = req.headers.authorization;

    // controlla che ci sia e sia Bearer
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token mancante" });
    }

    const token = header.slice(7);

    // verifica token
    try {
        // decodifica e verifica firma
        const payload = jwt.verify(token, process.env.JWT_SECRET); // { sub, role, iat, exp }

        // allega dati utente alla request
        req.user = payload;
        req.userId = payload.sub; // standard
        req.userRole = payload.role; // opzionale, utile

        return next();
    } catch {
        return res.status(401).json({ message: "Token non valido" });
    }
}
