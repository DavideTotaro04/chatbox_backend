import mongoose from "mongoose";

// Modello per i gruppi di chat
const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 60 },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        isPublic: { type: Boolean, default: true }, // join libero
    },
    { timestamps: true }
);

groupSchema.index({ name: 1 });

export default mongoose.model("Group", groupSchema);
