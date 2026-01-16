import mongoose from "mongoose";

// Modello per i messaggi
const messageSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["text", "image"], default: "text" },

        // testo
        text: {
            type: String,
            trim: true,
            maxlength: 4000,
            required: function () {
                return this.type === "text";
            },
        },

        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        roomType: { type: String, enum: ["group"], required: true },
        roomId: { type: mongoose.Schema.Types.ObjectId, required: true },

        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

// Storico: fetch ultimi messaggi per stanza, ordinati per tempo
messageSchema.index({ roomType: 1, roomId: 1, createdAt: -1 });

// Per query utente
messageSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
