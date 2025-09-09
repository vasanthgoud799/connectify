import mongoose from "mongoose";
import type { Document, Types } from "mongoose";

export interface IFriendRequest extends Document {
  requester: Types.ObjectId;
  addressee: Types.ObjectId;
  status: "pending" | "accepted" | "declined" | "blocked";
}

const FriendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    addressee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "blocked"], default: "pending" },
  },
  { timestamps: true }
);

FriendRequestSchema.index({ requester: 1, addressee: 1 }, { unique: true });

export const FriendRequest =
  mongoose.models.FriendRequest || mongoose.model<IFriendRequest>("FriendRequest", FriendRequestSchema);
