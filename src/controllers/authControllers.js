import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModels.js";

const signAccessToken = (user) =>
    jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

export const register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "email e password richiesti" });
    if (password.length < 8) return res.status(400).json({ message: "password troppo corta (min 8)" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email già registrata" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });

    return res.status(201).json({ id: user._id, email: user.email });
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "email e password richiesti" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Credenziali errate" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Credenziali errate" });

    const accessToken = signAccessToken(user);

    return res.status(200).json({
        accessToken,
        user: { id: user._id, email: user.email, role: user.role },
    });
};
