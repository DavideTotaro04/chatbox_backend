import mongoose from "mongoose";

const groupMemberSchema = new mongoose.Schema(
    {
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["member", "admin"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

// Un utente può comparire una sola volta in un gruppo
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

// Query tipiche
groupMemberSchema.index({ userId: 1 });
groupMemberSchema.index({ groupId: 1 });

export default mongoose.model("GroupMember", groupMemberSchema);
