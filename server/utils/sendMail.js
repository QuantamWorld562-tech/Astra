import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create a reusable transporter using Gmail SMTP
// App password is used instead of real password for security
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * sendMail — sends a 6-digit OTP to the user's email
 * @param {string} to      - recipient email address
 * @param {string} otp     - the 6-digit OTP to send
 * @param {string} username - user's display name for personalisation
 */
const sendMail = async (to, otp, username = "") => {
  await transporter.sendMail({
    from: `"Astra" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your Astra Password – OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#6750a2;margin-bottom:4px;">Astra</h2>
        <p style="color:#374151;">Hi ${username || "there"},</p>
        <p style="color:#374151;">Use the OTP below to reset your password. It expires in <strong>5 minutes</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#111827;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export default sendMail;
