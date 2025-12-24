import mongoose from "mongoose";
import Conversation from "../models/conversationModels.js";

export const createOrGetDM = async (req, res) => {
    const me = req.user.sub;
    const { otherUserId } = req.body;

    if (!otherUserId) return res.status(400).json({ message: "otherUserId richiesto" });
    if (!mongoose.isValidObjectId(otherUserId)) return res.status(400).json({ message: "otherUserId non valido" });
    if (otherUserId === me) return res.status(400).json({ message: "Non puoi creare una DM con te stesso" });

    const pairKey = Conversation.makePairKey(me, otherUserId);

    let conv = await Conversation.findOne({ pairKey });
    if (!conv) {
        conv = await Conversation.create({
            participants: [me, otherUserId],
            pairKey,
        });
    }

    return res.status(200).json({ conversationId: conv._id });
};
