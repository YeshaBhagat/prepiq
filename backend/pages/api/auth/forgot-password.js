import crypto from "crypto";
import { connectDB } from "../../../lib/mongodb.js";
import User from "../../../lib/models/User.js";
import { setCors } from "../../../lib/auth-middleware.js";
import { sendEmail, resetPasswordEmailHtml } from "../../../lib/email-helper.js";

export default async function handler(req, res) {
  setCors(res, "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed." }); return; }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(200).json({ message: "If that email exists, a reset link has been sent." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = "http://127.0.0.1:8124/pages/reset-password.html?token=" + token;
    console.log("[forgot-password] Reset URL:", resetUrl);

    await sendEmail({
      to: user.email,
      subject: "Reset your PrepIQ password",
      html: resetPasswordEmailHtml(user.firstName, resetUrl),
    });

    return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("[forgot-password]", err);
    return res.status(500).json({ error: "Failed to process request." });
  }
}
