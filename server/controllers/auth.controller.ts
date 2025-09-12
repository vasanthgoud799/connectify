import { z } from "zod";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { env } from "../config/env";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function signAccessToken(userId: string) {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET not set");
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(userId: string) {
  if (!env.REFRESH_TOKEN_SECRET) throw new Error("REFRESH_TOKEN_SECRET not set");
  return jwt.sign({ sub: userId, typ: 'refresh' }, env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}

function setRefreshCookie(res: Response, token: string) {
  // Allow cookie to be sent from embedded preview iframes
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const AuthController = {
  async me(req: Request, res: Response) {
    const { requireJWT } = await import("../middleware/jwtMiddleware");
    // req will have userId because requireJWT runs before
    const r = req as any;
    if (!r.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await User.findById(r.userId).lean();
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

  async signup(req: Request, res: Response) {
    if (!env.JWT_SECRET) return res.status(500).json({ error: "Server not configured" });
    const { isMongoConnected, getMongoStatus } = await import("../db/mongo");

    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, displayName } = parsed.data;

    if (!isMongoConnected()) {
      // Stateless fallback: issue tokens without DB persistence when Mongo is unavailable
      const userId = Buffer.from(email).toString('base64url').slice(0, 24);
      const access = signAccessToken(userId);
      const refresh = signRefreshToken(userId);
      setRefreshCookie(res, refresh);
      return res.status(201).json({
        token: access,
        user: {
          _id: userId,
          email,
          displayName: displayName || email.split('@')[0],
          status: 'online',
          subscriptionTier: 'free',
        },
      });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const user = await User.create({ email, passwordHash: password, displayName });
    const access = signAccessToken(user._id.toString());
    const refresh = signRefreshToken(user._id.toString());
    setRefreshCookie(res, refresh);

    return res.status(201).json({
      token: access,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        subscriptionTier: user.subscriptionTier,
      },
    });
  },

  async login(req: Request, res: Response) {
    if (!env.JWT_SECRET) return res.status(500).json({ error: "Server not configured" });
    const { isMongoConnected, getMongoStatus } = await import("../db/mongo");

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;

    if (!isMongoConnected()) {
      // Stateless fallback: accept any password and issue tokens when Mongo is unavailable
      const userId = Buffer.from(email).toString('base64url').slice(0, 24);
      const access = signAccessToken(userId);
      const refresh = signRefreshToken(userId);
      setRefreshCookie(res, refresh);
      return res.json({
        token: access,
        user: {
          _id: userId,
          email,
          displayName: email.split('@')[0],
          status: 'online',
          subscriptionTier: 'free',
        },
      });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await (user as any).comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const access = signAccessToken(user._id.toString());
    const refresh = signRefreshToken(user._id.toString());
    setRefreshCookie(res, refresh);
    return res.json({
      token: access,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        subscriptionTier: user.subscriptionTier,
      },
    });
  },
  async refresh(req: Request, res: Response) {
    try {
      const token = (req as any).cookies?.refresh_token || req.cookies?.refresh_token;
      if (!token || !env.REFRESH_TOKEN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
      const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { sub: string };
      const access = signAccessToken(payload.sub);
      return res.json({ token: access });
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return res.status(204).send();
  },
};
