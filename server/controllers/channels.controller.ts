import { z } from "zod";
import { Response } from "express";
import { Types } from "mongoose";
import { Channel } from "../models/chat.models";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { AuthRequest } from "../middleware/jwtMiddleware";

const createChannelSchema = z.object({
  type: z.enum(["dm", "group"]).optional(),
  name: z.string().min(1).max(100).optional(),
  members: z.array(z.object({ user: z.string().refine((v) => Types.ObjectId.isValid(v)), role: z.enum(["admin", "member"]).optional() })).optional(),
  peerId: z.string().refine((v) => Types.ObjectId.isValid(v)).optional(),
  memberId: z.string().refine((v) => Types.ObjectId.isValid(v)).optional(),
});

const postMessageSchema = z.object({
  content: z.string().min(1),
});

const listMessagesQuery = z.object({
  limit: z.string().optional(),
  before: z.string().optional(), // messageId cursor
});

export const ChannelsController = {
  async create(req: AuthRequest, res: Response) {
    const parsed = createChannelSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { type, name, members, peerId, memberId } = parsed.data;

    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const resolvedType = type || (memberId || peerId ? "dm" : "group");

    if (resolvedType === "dm") {
      const otherId = memberId || peerId || members?.[0]?.user;
      if (!otherId) return res.status(400).json({ error: "peerId/memberId required for dm" });
      const existing = await Channel.findOne({
        type: "dm",
        "members.user": { $all: [new Types.ObjectId(req.userId), new Types.ObjectId(otherId)] },
      });
      if (existing) return res.json(existing);

      const channel = await Channel.create({
        type: "dm",
        members: [
          { user: new Types.ObjectId(req.userId), role: "member" },
          { user: new Types.ObjectId(otherId), role: "member" },
        ],
      });
      return res.status(201).json(channel);
    }

    const uniqueMembers = new Map<string, { user: Types.ObjectId; role: "admin" | "member" }>();
    uniqueMembers.set(req.userId, { user: new Types.ObjectId(req.userId), role: "admin" });
    for (const m of members || []) {
      uniqueMembers.set(m.user, { user: new Types.ObjectId(m.user), role: m.role || "member" });
    }

    const channel = await Channel.create({ type: "group", name, members: Array.from(uniqueMembers.values()) });
    return res.status(201).json(channel);
  },

  async list(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const channels = await Channel.find({ "members.user": req.userId })
      .populate("members.user", "displayName email profilePictureUrl")
      .lean();

    const results = await Promise.all(
      channels.map(async (ch: any) => {
        const last = await Message.findOne({ channel: ch._id }).sort({ createdAt: -1 }).lean();
        return {
          _id: ch._id,
          type: ch.type,
          name: ch.name,
          members: (ch.members || []).map((m: any) => ({ user: m.user?._id?.toString?.() || m.user, displayName: m.user?.displayName || undefined })),
          lastMessage: last ? { content: last.content, createdAt: last.createdAt } : undefined,
          createdAt: ch.createdAt,
          updatedAt: ch.updatedAt,
        };
      })
    );

    return res.json(results);
  },

  async listMessages(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const { channelId } = req.params;
    if (!Types.ObjectId.isValid(channelId)) return res.status(400).json({ error: "Invalid channelId" });
    const parsed = listMessagesQuery.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const limit = Math.min(100, Math.max(1, parsed.data.limit ? parseInt(parsed.data.limit, 10) : 50));
    const beforeId = parsed.data.before;

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });
    const isMember = channel.members.some((m) => m.user.toString() === req.userId);
    if (!isMember) return res.status(403).json({ error: "Not a member" });

    const filter: any = { channel: channel._id };
    if (beforeId && Types.ObjectId.isValid(beforeId)) {
      const beforeMsg = await Message.findById(beforeId).lean();
      if (beforeMsg) filter.createdAt = { $lt: beforeMsg.createdAt };
    }
    const list = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "displayName email profilePictureUrl")
      .lean();

    const out = list.reverse().map((m: any) => ({
      _id: m._id,
      sender: m.sender?._id || m.sender,
      senderDisplayName: m.sender?.displayName,
      content: m.content,
      createdAt: m.createdAt,
    }));

    return res.json(out);
  },

  async postMessage(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const { channelId } = req.params;
    if (!Types.ObjectId.isValid(channelId)) return res.status(400).json({ error: "Invalid channelId" });

    const parsed = postMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const isMember = channel.members.some((m) => m.user.toString() === req.userId);
    if (!isMember) return res.status(403).json({ error: "Not a member" });

    const doc = await Message.create({ channel: channel._id, sender: new Types.ObjectId(req.userId), content: parsed.data.content });

    try {
      const { getIO } = await import("../socket");
      const io = getIO();
      const me = await User.findById(req.userId).select("displayName").lean();
      if (io) {
        io.to(`room-channel-${channel.id}`).emit("SERVER:message:new", { channelId: channel.id, sender: req.userId, senderDisplayName: me?.displayName, content: doc.content, createdAt: doc.createdAt });
        io.to(`channel:${channel.id}`).emit("message:receive", { channelId: channel.id, message: { _id: doc._id, sender: doc.sender, content: doc.content, createdAt: doc.createdAt } });
      }
    } catch {}

    return res.status(201).json({ _id: doc._id, sender: doc.sender, content: doc.content, createdAt: doc.createdAt });
  },
};
