import mongoose from "mongoose";
import type { Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  status: "sent" | "delivered" | "read";
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  },
  { timestamps: true, _id: false }
);

export interface IChannelMember {
  user: Types.ObjectId;
  role: "admin" | "member";
}

export interface IChannel extends Document {
  type: "dm" | "group";
  name?: string;
  members: IChannelMember[];
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new mongoose.Schema<IChannel>(
  {
    type: { type: String, enum: ["dm", "group"], required: true },
    name: { type: String, trim: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["admin", "member"], default: "member" },
      },
    ],
    messages: [MessageSchema],
  },
  { timestamps: true }
);

ChannelSchema.index({ "members.user": 1 });
ChannelSchema.pre("validate", function (next) {
  const doc = this as any;
  if (doc.type === "group" && !doc.name) return next(new Error("Group channels require a name"));
  next();
});

export const Channel = mongoose.models.Channel || mongoose.model<IChannel>("Channel", ChannelSchema);
