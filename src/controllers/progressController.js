const progressRepo = require("../repositories/progressRepository");

function getAuthUserId(req) {
  return req.user?.userId;
}

function clampPct(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function calcProgressPct({ goal, start, current, goalWeight }) {
  const g = String(goal || "").toLowerCase();

  if (!start || !current || !goalWeight) return null;
  if (start === goalWeight) return 100;

  if (g === "lose") {
    const total = start - goalWeight;
    const done = start - current;
    if (total <= 0) return null;
    return clampPct((done / total) * 100);
  }

  if (g === "gain") {
    const total = goalWeight - start;
    const done = current - start;
    if (total <= 0) return null;
    return clampPct((done / total) * 100);
  }
  if (g === "maintain") return null;

  return null;
}

async function getProgress(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await progressRepo.getUserProgressData(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const start = user.StartWeightKg != null ? Number(user.StartWeightKg) : null;
    const current = user.CurrentWeightKg != null ? Number(user.CurrentWeightKg) : null;
    const goalWeight = user.GoalWeightKg != null ? Number(user.GoalWeightKg) : null;

    const progressPct = calcProgressPct({
      goal: user.Goal,
      start,
      current,
      goalWeight,
    });

    const kgToGo =
      current != null && goalWeight != null ? Math.abs(current - goalWeight) : null;

    return res.json({
      goal: user.Goal,
      startWeightKg: start,
      currentWeightKg: current,
      goalWeightKg: goalWeight,
      progressPct, 
      kgToGo,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load progress", error: err.message });
  }
}

module.exports = {
  getProgress,
};