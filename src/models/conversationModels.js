import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ], // sempre 2 per DM
        pairKey: { type: String, required: true, unique: true }, // "minId:maxId"
    },
    { timestamps: true }
);

// Indice per recupero veloce
conversationSchema.index({ participants: 1 });

// Utility: genera pairKey dato due userId
conversationSchema.statics.makePairKey = function (userIdA, userIdB) {
    const a = userIdA.toString();
    const b = userIdB.toString();
    return a < b ? `${a}:${b}` : `${b}:${a}`;
};

export default mongoose.model("Conversation", conversationSchema);
