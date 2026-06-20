import { requireAuth, setCors } from "../../../lib/auth-middleware.js";
import { connectDB } from "../../../lib/mongodb.js";
import User from "../../../lib/models/User.js";

export default async function handler(req, res) {
  setCors(res, "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed." }); return; }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    await connectDB();
    const { limit = 50 } = req.query;

    const topUsers = await User.find({ isActive: true, isAdmin: { $ne: true } })
      .select("firstName lastName email avatar xp level streak practiceCount college")
      .sort({ xp: -1 })
      .limit(Number(limit))
      .lean();

    const leaderboard = topUsers.map((u, i) => ({
      rank: i + 1,
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      xp: u.xp || 0,
      level: u.level || 1,
      streak: u.streak || 0,
      practiceCount: u.practiceCount || 0,
      college: u.college || "",
      isCurrentUser: u._id.toString() === user._id.toString(),
    }));

    // Find current user rank even if not in top list
    let myRank = leaderboard.find(u => u.isCurrentUser);
    if (!myRank) {
      const allRanked = await User.find({ isActive: true, isAdmin: { $ne: true } }).select("_id xp").sort({ xp: -1 }).lean();
      const idx = allRanked.findIndex(u => u._id.toString() === user._id.toString());
      myRank = {
        rank: idx + 1,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        xp: user.xp || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        practiceCount: user.practiceCount || 0,
        college: user.college || "",
        isCurrentUser: true,
      };
    }

    return res.status(200).json({ leaderboard, myRank });
  } catch (err) {
    console.error("[leaderboard]", err);
    return res.status(500).json({ error: "Failed to load leaderboard." });
  }
}

