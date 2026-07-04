import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendMail from "../utils/sendMail.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a 6-digit numeric OTP */
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/** Hash a value with sha256 — we never store raw OTPs */
const hashValue = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

/** Cookie options — SameSite=None in production for cross-origin (Vercel → Render) */
const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
};

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Called after Firebase handles the Google popup on the frontend.
// Frontend sends: { username, email, profilePicture }
// We find or create the user, then issue our own JWT.

export const googleAuth = async (req, res) => {
  try {
    const { username, email, profilePicture } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find existing user or create a new one
    let user = await User.findOne({ email });

    if (!user) {
      // New Google user — no password needed
      user = await User.create({
        username: username || email.split("@")[0],
        email,
        profilePicture: profilePicture || "",
        googleId: email, // use email as a simple googleId marker
      });
    } else {
      // Existing user — update photo if they didn't have one
      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
        await user.save();
      }
    }

    // Issue access and refresh tokens (same as normal login)
    const accessToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await User.updateOne({ _id: user._id }, { refreshToken: hashedRefreshToken });

    // Build safe user object (no password)
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: user.posts,
    };

    return res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .cookie("token", accessToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 15 * 60 * 1000,
      })
      .json({ success: true, message: `Welcome ${user.username}`, user: safeUser, token: accessToken, accessToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Forgot Password — Step 1: Send OTP ───────────────────────────────────────
// User enters their email → we generate a 6-digit OTP, hash it, store it,
// and email the plain OTP to the user.

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account with that email" });
    }

    const otp = generateOtp();

    // Store hashed OTP + expiry (5 minutes)
    user.resetOtp = hashValue(otp);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.isOtpVerified = false;
    await user.save();

    // Send plain OTP to user's email
    await sendMail(user.email, otp, user.username);

    return res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Forgot Password — Step 2: Verify OTP ─────────────────────────────────────
// User enters the 6-digit OTP → we hash it and compare with stored hash.
// If valid, we issue a short-lived resetToken for the final step.

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account with that email" });
    }

    // Check expiry
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
    }

    // Compare hashed OTP
    if (user.resetOtp !== hashValue(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid — clear it and issue a resetToken (valid 10 min)
    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashValue(resetToken);
    user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return res.status(200).json({ success: true, message: "OTP verified", resetToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Forgot Password — Step 3: Reset Password ─────────────────────────────────
// User sends the resetToken + new password → we verify the token and update.

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ success: false, message: "Reset token and new password are required" });
    }

    const user = await User.findOne({
      resetPasswordToken: hashValue(resetToken),
      resetPasswordExpiry: { $gt: Date.now() },
      isOtpVerified: true,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Session expired or OTP not verified. Please start over.",
      });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.isOtpVerified = false;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
export const refreshTokenController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    const decode = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    if (!decode) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const user = await User.findById(decode.userId);
    if (!user || !user.refreshToken) {
      return res.status(401).json({ success: false, message: "User or refresh token not found" });
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Refresh token mismatch" });
    }

    const newAccessToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "15m",
    });

    return res
      .cookie("token", newAccessToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 15 * 60 * 1000,
      })
      .json({ success: true, token: newAccessToken, accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(401).json({ success: false, message: "Session expired, please login again" });
  }
};
