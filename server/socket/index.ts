import { Server as IOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { getRedis } from "../db/redis";
import { Channel } from "../models/chat.models";
import { User } from "../models/user.model";
import { Types } from "mongoose";

let ioInstance: IOServer | null = null;
export function getIO() {
  return ioInstance;
}

function authenticateSocket(socket: Socket): string | null {
  try {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.query?.token as string);
    if (!token || !env.JWT_SECRET) return null;
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

export function setupSocket(httpServer: HTTPServer) {
  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });
  ioInstance = io;

  const redis = getRedis();

  io.on("connection", async (socket) => {
    const userId = authenticateSocket(socket);
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    try {
      await (redis as any).set(`user:${userId}:status`, "online");
      await (redis as any).expire(`user:${userId}:status`, 60 * 5);
      await (redis as any).set(`socket:${userId}`, socket.id);
    } catch (e) {
      console.warn(
        "[socket] failed to write presence/socket map to redis, continuing",
      );
    }

    socket.join(`user:${userId}`);

    const channels = await Channel.find(
      { "members.user": new Types.ObjectId(userId) },
      { _id: 1 },
    ).lean();
    for (const c of channels) {
      const id = (c as any)._id.toString();
      socket.join(`channel:${id}`);
      socket.join(`room-channel-${id}`);
    }

    try {
      const me = await User.findById(userId).select("friends").lean();
      const friendIds: string[] = ((me?.friends as any[]) || []).map((f: any) =>
        f.toString(),
      );
      for (const fid of friendIds) {
        io.to(`user:${fid}`).emit("presence:update", {
          userId,
          status: "online",
        });
      }
    } catch {}

    socket.on("disconnect", async () => {
      try {
        await (redis as any).set(`user:${userId}:status`, "offline");
        await (redis as any).expire(`user:${userId}:status`, 60 * 5);
        await (redis as any).del(`socket:${userId}`);
      } catch (e) {
        console.warn("[socket] failed to write disconnect presence to redis");
      }
      try {
        const me = await User.findById(userId).select("friends").lean();
        const friendIds: string[] = ((me?.friends as any[]) || []).map(
          (f: any) => f.toString(),
        );
        for (const fid of friendIds) {
          io.to(`user:${fid}`).emit("presence:update", {
            userId,
            status: "offline",
          });
        }
      } catch {}
    });

    socket.on(
      "message:send",
      async (payload: { channelId: string; content: string }) => {
        if (!payload?.channelId || !payload?.content) return;
        const channel = await Channel.findById(payload.channelId);
        if (!channel) return;
        const isMember = channel.members.some(
          (m) => m.user.toString() === userId,
        );
        if (!isMember) return;

        const { Message } = await import("../models/message.model");
        const doc = await Message.create({
          channel: channel._id,
          sender: new Types.ObjectId(userId),
          content: payload.content,
        });
        const { User } = await import("../models/user.model");
        const me = await User.findById(userId).select("displayName").lean();
        io.to(`channel:${channel.id}`).emit("message:receive", {
          channelId: channel.id,
          message: {
            _id: doc._id,
            sender: doc.sender,
            content: doc.content,
            createdAt: doc.createdAt,
          },
        });
        io.to(`room-channel-${channel.id}`).emit("SERVER:message:new", {
          channelId: channel.id,
          sender: userId,
          senderDisplayName: me?.displayName,
          content: doc.content,
          createdAt: doc.createdAt,
        });
      },
    );

    socket.on(
      "CLIENT:message:send",
      async (payload: { channelId: string; content: string }) => {
        if (!payload?.channelId || !payload?.content) return;
        const channel = await Channel.findById(payload.channelId);
        if (!channel) return;
        const isMember = channel.members.some(
          (m) => m.user.toString() === userId,
        );
        if (!isMember) return;

        const { Message } = await import("../models/message.model");
        const doc = await Message.create({
          channel: channel._id,
          sender: new Types.ObjectId(userId),
          content: payload.content,
        });
        const { User } = await import("../models/user.model");
        const me = await User.findById(userId).select("displayName").lean();
        io.to(`room-channel-${channel.id}`).emit("SERVER:message:new", {
          channelId: channel.id,
          sender: userId,
          senderDisplayName: me?.displayName,
          content: doc.content,
          createdAt: doc.createdAt,
        });
        io.to(`channel:${channel.id}`).emit("message:receive", {
          channelId: channel.id,
          message: {
            _id: doc._id,
            sender: doc.sender,
            content: doc.content,
            createdAt: doc.createdAt,
          },
        });
      },
    );

    socket.on("call:offer", (data: { toUserId: string; sdp: any }) => {
      io.to(`user:${data.toUserId}`).emit("call:offer", {
        fromUserId: userId,
        sdp: data.sdp,
      });
      io.to(`user:${data.toUserId}`).emit("SERVER:call:incoming", {
        fromUserId: userId,
        sdp: data.sdp,
      });
    });
    socket.on("call:answer", (data: { toUserId: string; sdp: any }) => {
      io.to(`user:${data.toUserId}`).emit("call:answer", {
        fromUserId: userId,
        sdp: data.sdp,
      });
      io.to(`user:${data.toUserId}`).emit("SERVER:call:accepted", {
        fromUserId: userId,
        sdp: data.sdp,
      });
    });
    socket.on(
      "call:ice-candidate",
      (data: { toUserId: string; candidate: any }) => {
        io.to(`user:${data.toUserId}`).emit("call:ice-candidate", {
          fromUserId: userId,
          candidate: data.candidate,
        });
        io.to(`user:${data.toUserId}`).emit("SERVER:call:ice-candidate:new", {
          fromUserId: userId,
          candidate: data.candidate,
        });
      },
    );
    socket.on("call:end", (data: { toUserId: string }) => {
      io.to(`user:${data.toUserId}`).emit("call:end", { fromUserId: userId });
      io.to(`user:${data.toUserId}`).emit("SERVER:call:terminated", {
        fromUserId: userId,
      });
    });

    // WEBRTC signaling (WhatsApp-style spec)
    socket.on(
      "WEBRTC:initiate_call",
      async (payload: {
        targetUserId: string;
        callType: "video" | "audio";
        offerSdp: any;
      }) => {
        const targetSocketId = await (redis as any).get(
          `socket:${payload.targetUserId}`,
        );
        const msg = {
          fromUserId: userId,
          callType: payload.callType,
          offerSdp: payload.offerSdp,
        };
        if (targetSocketId) {
          io.to(targetSocketId).emit("WEBRTC:incoming_call", msg);
        }
        io.to(`user:${payload.targetUserId}`).emit("WEBRTC:incoming_call", msg);
        // Legacy interop
        io.to(`user:${payload.targetUserId}`).emit("call:offer", {
          fromUserId: userId,
          sdp: payload.offerSdp,
        });
        io.to(`user:${payload.targetUserId}`).emit("SERVER:call:incoming", {
          fromUserId: userId,
          sdp: payload.offerSdp,
        });
      },
    );
    socket.on(
      "WEBRTC:accept_call",
      async (payload: { callerUserId: string; answerSdp: any }) => {
        const targetSocketId = await (redis as any).get(
          `socket:${payload.callerUserId}`,
        );
        const msg = { fromUserId: userId, answerSdp: payload.answerSdp };
        if (targetSocketId) {
          io.to(targetSocketId).emit("WEBRTC:call_accepted", msg);
        }
        io.to(`user:${payload.callerUserId}`).emit("WEBRTC:call_accepted", msg);
        // Legacy interop
        io.to(`user:${payload.callerUserId}`).emit("call:answer", {
          fromUserId: userId,
          sdp: payload.answerSdp,
        });
        io.to(`user:${payload.callerUserId}`).emit("SERVER:call:accepted", {
          fromUserId: userId,
          sdp: payload.answerSdp,
        });
      },
    );
    socket.on(
      "WEBRTC:ice_candidate",
      async (payload: { targetUserId: string; candidate: any }) => {
        const targetSocketId = await (redis as any).get(
          `socket:${payload.targetUserId}`,
        );
        const msg = { fromUserId: userId, candidate: payload.candidate };
        if (targetSocketId) {
          io.to(targetSocketId).emit("WEBRTC:new_ice_candidate", msg);
        }
        io.to(`user:${payload.targetUserId}`).emit(
          "WEBRTC:new_ice_candidate",
          msg,
        );
        // Legacy interop
        io.to(`user:${payload.targetUserId}`).emit("call:ice-candidate", msg);
        io.to(`user:${payload.targetUserId}`).emit(
          "SERVER:call:ice-candidate:new",
          msg,
        );
      },
    );
    socket.on(
      "WEBRTC:decline_or_end_call",
      async (payload: { targetUserId: string }) => {
        const targetSocketId = await (redis as any).get(
          `socket:${payload.targetUserId}`,
        );
        const msg = { fromUserId: userId };
        if (targetSocketId) {
          io.to(targetSocketId).emit("WEBRTC:call_terminated", msg);
        }
        io.to(`user:${payload.targetUserId}`).emit(
          "WEBRTC:call_terminated",
          msg,
        );
        // Legacy interop
        io.to(`user:${payload.targetUserId}`).emit("call:end", msg);
        io.to(`user:${payload.targetUserId}`).emit(
          "SERVER:call:terminated",
          msg,
        );
      },
    );

    // In-call chat
    socket.on(
      "CALL:chat:send",
      async (payload: { toUserId: string; message: string; at?: number }) => {
        const msg = {
          fromUserId: userId,
          message: payload.message,
          at: payload.at || Date.now(),
        };
        io.to(`user:${payload.toUserId}`).emit("CALL:chat:new", msg);
      },
    );

    // Reactions
    socket.on(
      "CALL:reaction",
      async (payload: { toUserId: string; emoji: string }) => {
        const evt = {
          fromUserId: userId,
          emoji: payload.emoji,
          at: Date.now(),
        };
        io.to(`user:${payload.toUserId}`).emit("CALL:reaction", evt);
      },
    );
  });

  return io;
}
