import { z } from "zod";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { FriendRequest } from "../models/friendRequest.model";
import { User } from "../models/user.model";
import { AuthRequest } from "../middleware/jwtMiddleware";

const createRequestSchema = z.object({
  addresseeId: z.string().optional(),
  addresseeEmail: z.string().email().optional(),
}).refine((data) => !!data.addresseeId || !!data.addresseeEmail, {
  message: 'addresseeId or addresseeEmail is required',
  path: ['addresseeId']
});

const updateRequestSchema = z.object({
  action: z.enum(["accept", "decline"]),
});


export const FriendsController = {
  async listIncomingRequests(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const list = await FriendRequest.find({ addressee: req.userId, status: "pending" }).populate("requester", "displayName email profilePictureUrl").lean();
    return res.json(list);
  },

  async blockUser(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid userId" });
    await FriendRequest.updateMany({ $or: [ { requester: req.userId, addressee: userId }, { requester: userId, addressee: req.userId } ] }, { status: "blocked" });
    return res.status(204).send();
  },

  async createRequest(req: AuthRequest, res: Response) {
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    let { addresseeId, addresseeEmail } = parsed.data as any;

    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    if (!addresseeId && addresseeEmail) {
      const found = await User.findOne({ email: addresseeEmail }).select('_id').lean();
      if (!found) return res.status(404).json({ error: 'User not found' });
      addresseeId = found._id.toString();
    }

    if (!addresseeId || !Types.ObjectId.isValid(addresseeId)) {
      return res.status(400).json({ error: { fieldErrors: { addresseeId: ['Invalid ObjectId'] } } });
    }

    if (req.userId === addresseeId) return res.status(400).json({ error: "Cannot friend yourself" });

    const existing = await FriendRequest.findOne({ requester: req.userId, addressee: addresseeId, status: { $in: ['pending','accepted'] } });
    if (existing) return res.status(409).json({ error: "Request already exists" });

    const fr = await FriendRequest.create({ requester: req.userId, addressee: addresseeId });
    return res.status(201).json(fr);
  },

  async updateRequest(req: AuthRequest, res: Response) {
    const parsed = updateRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { requestId } = req.params;
    const { action } = parsed.data;

    if (!Types.ObjectId.isValid(requestId)) return res.status(400).json({ error: "Invalid requestId" });

    const fr = await FriendRequest.findById(requestId);
    if (!fr) return res.status(404).json({ error: "Request not found" });

    if (!req.userId || (req.userId !== fr.addressee.toString() && req.userId !== fr.requester.toString())) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (action === "accept") {
      fr.status = "accepted";
      await fr.save();
      await User.updateOne({ _id: fr.requester }, { $addToSet: { friends: fr.addressee } });
      await User.updateOne({ _id: fr.addressee }, { $addToSet: { friends: fr.requester } });
    } else if (action === "decline") {
      fr.status = "declined";
      await fr.save();
    }

    return res.json(fr);
  },

  async listFriends(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await User.findById(req.userId).populate("friends", "email displayName status subscriptionTier");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user.friends);
  },
};
