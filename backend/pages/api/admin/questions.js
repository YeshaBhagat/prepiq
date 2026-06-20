import { requireAdmin, setCors } from "../../../lib/auth-middleware.js";
import { connectDB } from "../../../lib/mongodb.js";
import Question from "../../../lib/models/Question.js";

export default async function handler(req, res) {
  setCors(res, "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const admin = await requireAdmin(req, res);
  if (!admin) return;
  await connectDB();

  if (req.method === "GET") {
    const { page = 1, limit = 20, search, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      Question.countDocuments(filter),
    ]);
    return res.status(200).json({ questions, total, pages: Math.ceil(total / limit) });
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!body.title || !body.description || !body.category) {
      return res.status(400).json({ error: "title, description, and category are required." });
    }
    const question = await Question.create(Object.assign({}, body, { createdBy: admin._id }));
    return res.status(201).json({ question });
  }

  if (req.method === "PUT") {
    const { id, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ error: "Question id required." });
    const question = await Question.findByIdAndUpdate(id, updates, { new: true });
    if (!question) return res.status(404).json({ error: "Question not found." });
    return res.status(200).json({ question });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Question id required." });
    await Question.findByIdAndDelete(id);
    return res.status(200).json({ message: "Question deleted." });
  }

  res.status(405).json({ error: "Method not allowed." });
}
