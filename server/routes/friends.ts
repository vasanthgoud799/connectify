import { Router } from "express";
import { FriendsController } from "../controllers/friends.controller";
import { requireJWT } from "../middleware/jwtMiddleware";

const router = Router();

router.get("/requests", requireJWT, FriendsController.listIncomingRequests);
router.post("/requests", requireJWT, FriendsController.createRequest);
router.put("/requests/:requestId", requireJWT, FriendsController.updateRequest);
router.delete("/requests/:userId", requireJWT, FriendsController.blockUser);
router.get("/", requireJWT, FriendsController.listFriends);

export default router;
