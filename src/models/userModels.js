// src/models/userModels.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false, // non torna per default
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        role: { type: String, default: "user" },

        // refresh token: salviamo HASH, non il token in chiaro
        refreshTokenHash: { type: String, default: null },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);

