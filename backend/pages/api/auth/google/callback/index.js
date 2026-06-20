import jwt from "jsonwebtoken";
import { connectDB } from "../../../../../lib/mongodb.js";
import User from "../../../../../lib/models/User.js";
import { updateStreak } from "../../../../../lib/streak-helper.js";
import Streak from "../../../../../lib/models/Streak.js";

const JWT_SECRET = process.env.JWT_SECRET || "prepiq-dev-secret-change-in-production";
const FRONTEND_BASE = process.env.OAUTH_REDIRECT_BASE || "http://127.0.0.1:8124";

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    res.writeHead(302, { Location: FRONTEND_BASE + "/auth.html?error=oauth_failed" });
    return res.end();
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:3000/api/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token from Google");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });
    const profile = await profileRes.json();

    await connectDB();
    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        firstName: profile.given_name || (profile.name ? profile.name.split(" ")[0] : "User"),
        lastName: profile.family_name || (profile.name ? profile.name.split(" ").slice(1).join(" ") : ""),
        email: profile.email.toLowerCase(),
        avatar: profile.picture || "",
        oauthProvider: "google",
      });
    }

    await updateStreak(user, Streak);
    user.lastActive = new Date();
    user.xp = (user.xp || 0) + 5;
    await user.save();

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.writeHead(302, { Location: FRONTEND_BASE + "/oauth-success.html?token=" + token });
    res.end();
  } catch (err) {
    console.error("[google oauth callback]", err);
    res.writeHead(302, { Location: FRONTEND_BASE + "/auth.html?error=oauth_failed" });
    res.end();
  }
}

