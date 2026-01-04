import mongoose from "mongoose";
import Message from "../models/messageModels.js";
import GroupMember from "../models/groupmembersModels.js";
import Conversation from "../models/conversationModels.js";

export default function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        // join room
        socket.on("room:join", async ({ roomType, roomId }, ack) => {
            try {
                if (roomType !== "group") throw new Error("roomType non valido");
                if (!mongoose.isValidObjectId(roomId)) throw new Error("roomId non valido");

                const me = socket.data.userId;

                if (roomType === "group") {
                    const ok = await GroupMember.findOne({ groupId: roomId, userId: me });
                    if (!ok) return ack?.({ ok: false, error: "Non sei membro del gruppo" });
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
                const me = socket.data.userId;

                if (roomType !== "group") throw new Error("roomType non valido");
                if (!mongoose.isValidObjectId(roomId)) throw new Error("roomId non valido");

                const cleanText = (text ?? "").trim();
                if (!cleanText) throw new Error("text richiesto");

                // autorizzazione (ripetuta: non fidarti del client)
                if (roomType === "group") {
                    const ok = await GroupMember.findOne({ groupId: roomId, userId: me });
                    if (!ok) throw new Error("Non sei membro del gruppo");
                }
                const msg = await Message.create({
                    type: "text",
                    text: cleanText,
                    sender: me,
                    roomType,
                    roomId,
                    createdAt: new Date(),
                });

// POPULATE del sender (email)
                await msg.populate("sender", "email username");

                const payload = {
                    ...msg.toObject(),
                    sender: {
                        _id: msg.sender._id,
                        email: msg.sender.email,
                        username: msg.sender.username
                    },
                };

                io.to(`${roomType}:${roomId}`).emit("message:new", payload);


                // ack al mittente (utile per mappare tempId -> msg._id)
                return ack?.({ ok: true, id: msg._id, tempId });
            } catch (e) {
                return ack?.({ ok: false, error: e.message, tempId });
            }
        });
    });
}
