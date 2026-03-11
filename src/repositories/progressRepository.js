const db = require("../db/models");

async function getUserProgressData(userId) {
  return db.Users.findByPk(userId, {
    attributes: ["UserId", "Goal", "StartWeightKg", "CurrentWeightKg", "GoalWeightKg"],
  });
}

module.exports = {
  getUserProgressData,
};