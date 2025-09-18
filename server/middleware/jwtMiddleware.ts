import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/user.model";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token || !env.JWT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function featureGate(requiredTier: "free" | "pro" | "business") {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const tiers = ["free", "pro", "business"] as const;
    const hasAccess = tiers.indexOf(user.subscriptionTier) >= tiers.indexOf(requiredTier);
    if (!hasAccess) return res.status(403).json({ error: "Upgrade required" });
    return next();
  };
}
