import { Router } from "express";
import { requireJWT } from "../middleware/jwtMiddleware";
import { UsersController } from "../controllers/users.controller";

const router = Router();

router.get("/search", requireJWT, UsersController.search);
router.get("/me", requireJWT, UsersController.me);
router.put("/me", requireJWT, UsersController.updateMe);
router.get("/presence", requireJWT, UsersController.presence);
router.post("/presence/heartbeat", requireJWT, UsersController.heartbeat);

export default router;
