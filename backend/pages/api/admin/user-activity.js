import { requireAdmin, setCors } from "../../../lib/auth-middleware.js";
import { connectDB } from "../../../lib/mongodb.js";
import User from "../../../lib/models/User.js";
import PracticeHistory from "../../../lib/models/PracticeHistory.js";
import AIInterview from "../../../lib/models/AIInterview.js";
import Achievement from "../../../lib/models/Achievement.js";
import Resume from "../../../lib/models/Resume.js";

export default async function handler(req, res) {
  setCors(res, "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed." }); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "User id required." });

  try {
    await connectDB();

    const [user, practiceHistory, interviews, achievements, resume] = await Promise.all([
      User.findById(id).select("-password").lean(),
      PracticeHistory.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
      AIInterview.find({ user: id }).sort({ createdAt: -1 }).limit(10).lean(),
      Achievement.find({ user: id }).sort({ earnedAt: -1 }).lean(),
      Resume.findOne({ user: id }).sort({ updatedAt: -1 }).lean(),
    ]);

    if (!user) return res.status(404).json({ error: "User not found." });

    return res.status(200).json({ user, practiceHistory, interviews, achievements, resume });
  } catch (err) {
    console.error("[admin/user-activity]", err);
    return res.status(500).json({ error: "Failed to load user activity." });
  }
}
