import mongoose from "mongoose";
import Group from "../models/groupModels.js";
import GroupMember from "../models/groupmembersModels.js";

export const createGroup = async (req, res) => {
    const owner = req.user.sub;
    const { name, isPublic = true } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "name richiesto" });

    const group = await Group.create({ name: name.trim(), owner, isPublic: !!isPublic });

    // owner entra automaticamente come admin
    await GroupMember.create({ groupId: group._id, userId: owner, role: "admin" });

    return res.status(201).json(group);
};

export const listPublicGroups = async (req, res) => {
    const groups = await Group.find({ isPublic: true }).sort({ createdAt: -1 }).limit(50);
    return res.json(groups);
};

export const listMyGroups = async (req, res) => {
    const me = req.user.sub;

    const memberships = await GroupMember.find({ userId: me }).lean();
    const groupIds = memberships.map((m) => m.groupId);

    const groups = await Group.find({ _id: { $in: groupIds } }).sort({ createdAt: -1 });
    return res.json(groups);
};

export const joinGroup = async (req, res) => {
    const me = req.user.sub;
    const { id: groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) return res.status(400).json({ message: "groupId non valido" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Gruppo non trovato" });
    if (!group.isPublic) return res.status(403).json({ message: "Gruppo non pubblico" });

    try {
        await GroupMember.create({ groupId, userId: me, role: "member" });
    } catch (e) {
        // doppione membership -> OK idempotente
    }

    return res.status(200).json({ message: "Joined" });
};

export const leaveGroup = async (req, res) => {
    const me = req.user.sub;
    const { id: groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) return res.status(400).json({ message: "groupId non valido" });

    await GroupMember.deleteOne({ groupId, userId: me });

    return res.status(200).json({ message: "Left" });
};
