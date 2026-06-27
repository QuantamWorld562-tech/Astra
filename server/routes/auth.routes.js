import express from "express";
import {
  googleAuth,
  forgotPassword,
  verifyOtp,
  resetPassword,
  refreshTokenController,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

// Refresh access token
authRouter.get("/refresh", refreshTokenController);

// Google OAuth — frontend sends user info from Firebase popup
authRouter.post("/google", googleAuth);

// OTP-based password reset — 3-step flow
authRouter.post("/forgot-password", forgotPassword);  // Step 1: send OTP
authRouter.post("/verify-otp", verifyOtp);            // Step 2: verify OTP → get resetToken
authRouter.post("/reset-password", resetPassword);    // Step 3: set new password

export default authRouter;
