import mongoose from "mongoose";
import type { Document, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  profilePictureUrl?: string;
  bio?: string;
  subscriptionTier: "free" | "pro" | "enterprise";
  friends: Types.ObjectId[];
  lastSeen: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, minlength: 3, maxlength: 30, default: function(this: any) {
      const email: string = this.email || '';
      const name = email.includes('@') ? email.split('@')[0] : email;
      return (name || 'user').slice(0, 30);
    } },
    profilePictureUrl: { type: String, default: '/default-avatar.png' },
    bio: { type: String, maxlength: 150 },
    subscriptionTier: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  const doc = this as any;
  if (!doc.isModified("passwordHash")) return next();
  const bcrypt = await import("bcryptjs");
  doc.passwordHash = await bcrypt.hash(doc.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
