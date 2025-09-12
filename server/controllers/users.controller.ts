import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/user.model";
import { AuthRequest } from "../middleware/jwtMiddleware";

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  profilePictureUrl: z.string().url().optional(),
  status: z.enum(["online", "offline", "away", "dnd"]).optional(),
});

export const UsersController = {
  async search(req: AuthRequest, res: Response) {
    const q = (req.query.q as string) || "";
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({ $or: [{ email: regex }, { displayName: regex }] }, "email displayName status subscriptionTier").limit(20).lean();
    return res.json(users);
  },

  async me(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      subscriptionTier: user.subscriptionTier,
      profilePictureUrl: user.profilePictureUrl,
      bio: user.bio,
    });
  },

  async updateMe(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updates = parsed.data;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      subscriptionTier: user.subscriptionTier,
      profilePictureUrl: user.profilePictureUrl,
      bio: user.bio,
    });
  },

  async presence(req: AuthRequest, res: Response) {
    try {
      const idsParam = (req.query.ids as string) || '';
      const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (!ids.length) return res.json({});
      const { getRedis } = await import('../db/redis');
      const redis = getRedis();
      const result: Record<string, string> = {};
      for (const id of ids) {
        try {
          const val = await (redis as any).get(`user:${id}:status`);
          result[id] = (val as string) || 'offline';
        } catch {
          result[id] = 'offline';
        }
      }
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch presence' });
    }
  },

  async heartbeat(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
      const { getRedis } = await import('../db/redis');
      const redis = getRedis();
      await (redis as any).set(`user:${req.userId}:status`, 'online');
      await (redis as any).expire(`user:${req.userId}:status`, 60 * 5);
      return res.status(204).send();
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update presence' });
    }
  },
};
