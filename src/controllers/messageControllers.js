import mongoose from "mongoose";
import Message from "../models/messageModels.js";
import GroupMember from "../models/groupmembersModels.js";
import Conversation from "../models/conversationModels.js";

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
        .populate("sender", "email")
        .lean();

// normalizza sender (opzionale ma consigliato)
    const out = msgs.map((m) => ({
        ...m,
        sender: m.sender
            ? { _id: m.sender._id, email: m.sender.email }
            : m.sender,
    }));

    return res.json(out);
};

export const getDMMessages = async (req, res) => {
    const me = req.user.sub;
    const { conversationId } = req.params;
    const { cursor, limit = 30 } = req.query;

    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ message: "conversationId non valido" });

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) return res.status(404).json({ message: "Conversazione non trovata" });

    const allowed = conv.participants.map(String).includes(String(me));
    if (!allowed) return res.status(403).json({ message: "Non autorizzato" });

    const cursorQuery = buildCursorQuery(cursor);
    if (cursor && !cursorQuery) return res.status(400).json({ message: "cursor non valido" });

    const msgs = await Message.find({
        roomType: "group",
        roomId: groupId,
        ...cursorQuery,
    })
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 30, 100))
        .populate("sender", "email")
        .lean();

// normalizza sender (opzionale ma consigliato)
    const out = msgs.map((m) => ({
        ...m,
        sender: m.sender
            ? { _id: m.sender._id, email: m.sender.email }
            : m.sender,
    }));

    return res.json(out);

};
