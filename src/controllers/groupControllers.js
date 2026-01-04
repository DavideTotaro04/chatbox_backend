import mongoose from "mongoose";
import Group from "../models/groupModels.js";
import GroupMember from "../models/groupmembersModels.js";
import User from "../models/userModels.js";
import Message from "../models/messageModels.js";


export const createGroup = async (req, res) => {
    const owner = req.user.sub;
    const { name, isPublic = true } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "name richiesto" });

    const group = await Group.create({ name: name.trim(), owner, isPublic: !!isPublic });

    // owner entra automaticamente come admin
    await GroupMember.create({ groupId: group._id, userId: owner, role: "admin" });

    return res.status(201).json(group);
};

export const listPublicGroups = async (req, res) => {
    const groups = await Group.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("owner", "username")
        .lean();
    return res.json(groups);
};

export const listMyGroups = async (req, res) => {
    const me = req.user.sub;

    const memberships = await GroupMember.find({ userId: me }).lean();
    const groupIds = memberships.map((m) => m.groupId);

    const groups = await Group.find({ _id: { $in: groupIds } }).sort({ createdAt: -1 })
        .populate("owner", "username")
        .lean();
    const out = groups.map((g) => {
        const membership = memberships.find(
            (m) => String(m.groupId) === String(g._id)
        );
        return {
            ...g,
            myRole: membership?.role, // "admin" | "member"
        };
    });
    return res.json(groups);
};

export const joinGroup = async (req, res) => {
    const me = req.user.sub;
    const { id: groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) return res.status(400).json({ message: "groupId non valido" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Gruppo non trovato" });
    if (!group.isPublic) return res.status(403).json({ message: "Gruppo non pubblico" });

    try {
        await GroupMember.create({ groupId, userId: me, role: "member" });
    } catch (e) {
        // doppione membership -> OK idempotente
    }

    return res.status(200).json({ message: "Joined" });
};

export const leaveGroup = async (req, res) => {
    const me = req.user.sub;
    const { id: groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) return res.status(400).json({ message: "groupId non valido" });

    await GroupMember.deleteOne({ groupId, userId: me });

    return res.status(200).json({ message: "Left" });
};

export const addMemberByEmail = async (req, res) => {
    try {
        const me = req.user.sub;              // id utente loggato (dal JWT)
        const { groupId } = req.params;
        const { email } = req.body;

        if (!mongoose.isValidObjectId(groupId)) {
            return res.status(400).json({ message: "groupId non valido" });
        }

        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Email richiesta" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1) verifica che io sia admin del gruppo
        const admin = await GroupMember.findOne({
            groupId,
            userId: me,
            role: "admin",
        }).lean();

        if (!admin) {
            return res.status(403).json({ message: "Solo admin può aggiungere membri" });
        }

        // 2) trova utente per email
        const user = await User.findOne({ email: normalizedEmail }).lean();
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        // 3) se già membro -> errore
        const exists = await GroupMember.findOne({
            groupId,
            userId: user._id,
        }).lean();

        if (exists) {
            return res.status(409).json({ message: "Utente già nel gruppo" });
        }

        // 4) crea membership
        await GroupMember.create({
            groupId,
            userId: user._id,
            role: "member",
        });

        return res.status(201).json({
            message: "Utente aggiunto",
            user: { id: user._id, email: user.email, username: user.username },
        });
    } catch {
        return res.status(500).json({ message: "Errore server" });
    }
};

export const myGroupRole = async (req, res) => {
    const me = req.user.sub;
    const { groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) {
        return res.status(400).json({ message: "groupId non valido" });
    }

    const membership = await GroupMember.findOne({ groupId, userId: me }).lean();
    if (!membership) return res.status(403).json({ message: "Non sei membro del gruppo" });

    return res.json({ role: membership.role }); // "admin" | "member"
};

export const getGroupById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "groupId non valido" });
    }

    const group = await Group.findById(id).populate("owner", "username").lean();
    if (!group) return res.status(404).json({ message: "Gruppo non trovato" });

    return res.json(group);
};

export const deleteGroup = async (req, res) => {
    const me = req.user.sub;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "groupId non valido" });
    }

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Gruppo non trovato" });

    if (String(group.owner) !== String(me)) {
        return res.status(403).json({ message: "Solo il creatore può eliminare il gruppo" });
    }

    // pulizia minima coerente col tuo progetto
    await GroupMember.deleteMany({ groupId: id });
    await Message.deleteMany({ roomType: "group", roomId: id });
    await Group.deleteOne({ _id: id });

    return res.json({ ok: true, message: "Gruppo eliminato" });
};

