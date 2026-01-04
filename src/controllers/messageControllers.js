import mongoose from "mongoose";
import Message from "../models/messageModels.js";
import GroupMember from "../models/groupmembersModels.js";

// cursor pagination: createdAt < cursor
const buildCursorQuery = (cursor) => {
    if (!cursor) return {};
    const date = new Date(cursor);
    if (Number.isNaN(date.getTime())) return null;
    return { createdAt: { $lt: date } };
};

export const getGroupMessages = async (req, res) => {
    const me = req.user.sub;
    const { groupId } = req.params;
    const { cursor, limit = 30 } = req.query;

    if (!mongoose.isValidObjectId(groupId)) return res.status(400).json({ message: "groupId non valido" });

    const membership = await GroupMember.findOne({ groupId, userId: me });
    if (!membership) return res.status(403).json({ message: "Non sei membro del gruppo" });

    const cursorQuery = buildCursorQuery(cursor);
    if (cursor && !cursorQuery) return res.status(400).json({ message: "cursor non valido" });

    const msgs = await Message.find({
        roomType: "group",
        roomId: groupId,
        ...cursorQuery,
    })
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 30, 100))
        .populate("sender", "email username")
        .lean();

// normalizza sender (opzionale ma consigliato)
    const out = msgs.map((m) => ({
        ...m,
        sender: m.sender
            ? {
                _id: m.sender._id,
                email: m.sender.email,
                username: m.sender.username, // ✅ AGGIUNTO
            }
            : m.sender,
    }));

    return res.json(out);
};

export const deleteMessage = async (req, res) => {
    try {
        const me = req.user.sub;
        const { messageId } = req.params;

        if (!mongoose.isValidObjectId(messageId)) {
            return res.status(400).json({ message: "messageId non valido" });
        }

        const msg = await Message.findById(messageId).lean();
        if (!msg) return res.status(404).json({ message: "Messaggio non trovato" });

        // solo gruppi (coerente con “niente DM”)
        if (msg.roomType !== "group") {
            return res.status(400).json({ message: "roomType non supportato" });
        }

        const isOwner = String(msg.sender) === String(me);

        const admin = await GroupMember.findOne({
            groupId: msg.roomId,
            userId: me,
            role: "admin",
        }).lean();

        if (!isOwner && !admin) {
            return res.status(403).json({ message: "Non autorizzato" });
        }

        await Message.deleteOne({ _id: messageId });

        return res.json({ ok: true, id: messageId });
    } catch {
        return res.status(500).json({ message: "Errore server" });
    }
};

