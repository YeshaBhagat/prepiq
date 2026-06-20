import { requireAdmin, setCors } from "../../../lib/auth-middleware.js";
import { connectDB } from "../../../lib/mongodb.js";
import AIInterview from "../../../lib/models/AIInterview.js";

export default async function handler(req, res) {
  setCors(res, "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed." }); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    await connectDB();
    const { page = 1, limit = 20, status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [interviews, total] = await Promise.all([
      AIInterview.find(filter)
        .populate("user", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      AIInterview.countDocuments(filter),
    ]);

    return res.status(200).json({ interviews, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin/interviews]", err);
    return res.status(500).json({ error: "Failed to load interviews." });
  }
}
