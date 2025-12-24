import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["text", "image"], default: "text" },

        // testo (per ora usi solo questo)
        text: {
            type: String,
            trim: true,
            maxlength: 4000,
            required: function () {
                return this.type === "text";
            },
        },

        // per futuro invio foto
        imageUrl: {
            type: String,
            required: function () {
                return this.type === "image";
            },
        },

        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        roomType: { type: String, enum: ["dm", "group"], required: true },
        roomId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Conversation._id o Group._id

        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

// Storico: fetch ultimi messaggi per stanza, ordinati per tempo
messageSchema.index({ roomType: 1, roomId: 1, createdAt: -1 });

// Per query utente (opzionale)
messageSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
