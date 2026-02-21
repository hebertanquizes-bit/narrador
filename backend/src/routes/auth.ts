import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// Auth routes (public)
router.post("/register", authController.registerController);
router.post("/login", authController.loginController);
router.post("/google", authController.googleLoginController);

export default router;
