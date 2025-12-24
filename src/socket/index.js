import mongoose from "mongoose";
import Message from "../models/messageModels.js";
import GroupMember from "../models/groupmembersModels.js";
import Conversation from "../models/conversationModels.js";

export default function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        // join room
        socket.on("room:join", async ({ roomType, roomId }, ack) => {
            try {
                if (!["group", "dm"].includes(roomType)) throw new Error("roomType non valido");
                if (!mongoose.isValidObjectId(roomId)) throw new Error("roomId non valido");

                const me = socket.user.sub;

                if (roomType === "group") {
                    const ok = await GroupMember.findOne({ groupId: roomId, userId: me });
                    if (!ok) return ack?.({ ok: false, error: "Non sei membro del gruppo" });
                } else {
                    const conv = await Conversation.findById(roomId).lean();
                    if (!conv) return ack?.({ ok: false, error: "Conversazione non trovata" });
                    const allowed = conv.participants.map(String).includes(String(me));
                    if (!allowed) return ack?.({ ok: false, error: "Non autorizzato" });
                }

                socket.join(`${roomType}:${roomId}`);
                return ack?.({ ok: true });
            } catch (e) {
                return ack?.({ ok: false, error: e.message });
            }
        });

        // send message
        socket.on("message:send", async ({ roomType, roomId, text, tempId }, ack) => {
            try {
                const me = socket.user.sub;

                if (!["group", "dm"].includes(roomType)) throw new Error("roomType non valido");
                if (!mongoose.isValidObjectId(roomId)) throw new Error("roomId non valido");

                const cleanText = (text ?? "").trim();
                if (!cleanText) throw new Error("text richiesto");

                // autorizzazione (ripetuta: non fidarti del client)
                if (roomType === "group") {
                    const ok = await GroupMember.findOne({ groupId: roomId, userId: me });
                    if (!ok) throw new Error("Non sei membro del gruppo");
                } else {
                    const conv = await Conversation.findById(roomId).lean();
                    if (!conv) throw new Error("Conversazione non trovata");
                    const allowed = conv.participants.map(String).includes(String(me));
                    if (!allowed) throw new Error("Non autorizzato");
                }

                const msg = await Message.create({
                    type: "text",
                    text: cleanText,
                    sender: me,
                    roomType,
                    roomId,
                    createdAt: new Date(),
                });

                // broadcast a tutti nella stanza (incluso mittente)
                io.to(`${roomType}:${roomId}`).emit("message:new", msg);

                // ack al mittente (utile per mappare tempId -> msg._id)
                return ack?.({ ok: true, id: msg._id, tempId });
            } catch (e) {
                return ack?.({ ok: false, error: e.message, tempId });
            }
        });
    });
}
