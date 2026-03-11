const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/userRepository");

function canEdit(reqUser, targetUserId) {
  if (!reqUser) return false;
  if (reqUser.isAdmin) return true;
  return Number(reqUser.userId) === Number(targetUserId);
}

async function getMe(req, res) {
  try {
    const userId = req.user.userId;
    const user = await userRepository.getById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user", error: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.params.userId;

    if (!canEdit(req.user, userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const allowed = [
      "FullName",
      "Sex",
      "DateOfBirth",
      "HeightCm",
      "CurrentWeightKg",
      "GoalWeightKg",
      "Goal",
      "ActivityLevel",
      "DailyTargetCal",
      "DietType",
      "PlanStartDate",
      "HasPaid",
    ];

    const body = req.body || {};
    const patch = {};
console.log("req.body:", body);
    for (const key of allowed) {
      if (body[key] !== undefined) {
        patch[key] = body[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const updated = await userRepository.updateUser(userId, patch);
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
}

async function updatePassword(req, res) {
  try {
    const userId = req.params.userId;

    if (!canEdit(req.user, userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword required" });
    }

    const row = await userRepository.getPassword(userId);
if (!row) return res.status(404).json({ message: "User not found" });

const ok = await bcrypt.compare(currentPassword, row.Password);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePasswordHash(userId, hashed);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update password", error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.userId;

    if (!canEdit(req.user, userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const deletedCount = await userRepository.deleteUser(userId);
    if (!deletedCount) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
}

module.exports = { getMe, updateUser, updatePassword, deleteUser };