import mongoose from "mongoose";
import type { Document, Types } from "mongoose";

export interface IMessageDoc extends Document {
  channel: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessageDoc>(
  {
    channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel", index: true, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

MessageSchema.index({ channel: 1, createdAt: -1 });

export const Message = mongoose.models.Message || mongoose.model<IMessageDoc>("Message", MessageSchema);
