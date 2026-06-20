import { requireAdmin, setCors } from "../../../lib/auth-middleware.js";
import { connectDB } from "../../../lib/mongodb.js";
import User from "../../../lib/models/User.js";
import Question from "../../../lib/models/Question.js";
import AIInterview from "../../../lib/models/AIInterview.js";
import PracticeHistory from "../../../lib/models/PracticeHistory.js";
import Resume from "../../../lib/models/Resume.js";

export default async function handler(req, res) {
  setCors(res, "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed." }); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    await connectDB();

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalInterviews,
      completedInterviews,
      totalQuestions,
      totalPracticeSessions,
      totalResumes,
      avgInterviewScoreAgg,
      signupsLast30,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      AIInterview.countDocuments({}),
      AIInterview.countDocuments({ status: "completed" }),
      Question.countDocuments({}),
      PracticeHistory.countDocuments({}),
      Resume.countDocuments({}),
      AIInterview.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, avg: { $avg: "$overallScore" } } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const avgInterviewScore = avgInterviewScoreAgg[0] && avgInterviewScoreAgg[0].avg
      ? Math.round(avgInterviewScoreAgg[0].avg)
      : 0;

    return res.status(200).json({
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalInterviews,
      completedInterviews,
      totalQuestions,
      totalPracticeSessions,
      totalResumes,
      avgInterviewScore,
      signupsLast30,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return res.status(500).json({ error: "Failed to load stats." });
  }
}
