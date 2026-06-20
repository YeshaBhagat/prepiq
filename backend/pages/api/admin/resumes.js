import { requireAdmin, setCors } from "../../../lib/auth-middleware.js";
import { connectDB } from "../../../lib/mongodb.js";
import Resume from "../../../lib/models/Resume.js";

export default async function handler(req, res) {
  setCors(res, "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed." }); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    await connectDB();
    const { page = 1, limit = 20 } = req.query;

    const [resumes, total] = await Promise.all([
      Resume.find({})
        .populate("user", "firstName lastName email")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Resume.countDocuments({}),
    ]);

    return res.status(200).json({ resumes, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin/resumes]", err);
    return res.status(500).json({ error: "Failed to load resumes." });
  }
}
