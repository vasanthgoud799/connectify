import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireJWT } from "../middleware/jwtMiddleware";

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.get("/me", requireJWT, AuthController.me);

export default router;
