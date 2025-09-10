import { Router } from "express";
import { ChannelsController } from "../controllers/channels.controller";
import { requireJWT } from "../middleware/jwtMiddleware";

const router = Router();

router.post("/", requireJWT, ChannelsController.create);
router.get("/", requireJWT, ChannelsController.list);
router.get("/:channelId/messages", requireJWT, ChannelsController.listMessages);
router.post("/:channelId/messages", requireJWT, ChannelsController.postMessage);

export default router;
