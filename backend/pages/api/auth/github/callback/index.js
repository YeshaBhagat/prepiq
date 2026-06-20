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
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: "http://localhost:3000/api/auth/github/callback",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token from GitHub");

    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });
    const profile = await profileRes.json();

    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: "Bearer " + tokenData.access_token },
      });
      const emails = await emailsRes.json();
      const primary = Array.isArray(emails) ? emails.find(e => e.primary) || emails[0] : null;
      email = primary?.email;
    }
    if (!email) throw new Error("No email available from GitHub account");

    await connectDB();
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const nameParts = (profile.name || profile.login || "User").split(" ");
      user = await User.create({
        firstName: nameParts[0] || "User",
        lastName: nameParts.slice(1).join(" ") || "",
        email: email.toLowerCase(),
        avatar: profile.avatar_url || "",
        oauthProvider: "github",
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
    console.error("[github oauth callback]", err);
    res.writeHead(302, { Location: FRONTEND_BASE + "/auth.html?error=oauth_failed" });
    res.end();
  }
}

