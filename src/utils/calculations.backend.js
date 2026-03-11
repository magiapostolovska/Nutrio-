function normalizeActivity(level) {
  const v = String(level || "").toLowerCase();
  if (v === "very_active") return "very-active";
  return v;
}

function calculateBMRFromDbUser(u) {

  const weight = Number(u.CurrentWeightKg);
  const height = Number(u.HeightCm);
  const gender = String(u.Sex || "").toLowerCase();

  const dob = u.DateOfBirth ? new Date(u.DateOfBirth) : null;
  let age = null;

  if (dob) {
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();

    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
  }

  if (!weight || !height || !age) return null;
  if (gender !== "male" && gender !== "female") return null;

  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }

  return 10 * weight + 6.25 * height - 5 * age - 161;
}

function calculateTDEEFromDbUser(u) {
  const bmr = calculateBMRFromDbUser(u);
  if (!bmr) return null;

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very-active": 1.9,
  };

  const key = normalizeActivity(u.ActivityLevel);
  const mult = activityMultipliers[key];
  if (!mult) return null;

  return Math.round(bmr * mult);
}

function calculateTargetCaloriesFromDbUser(u) {
  const tdee = calculateTDEEFromDbUser(u);
  if (!tdee) return null;

  const goal = String(u.Goal || "maintain").toLowerCase();

  let target;
  if (goal === "lose") target = tdee - 500;
  else if (goal === "gain") target = tdee + 300;
  else target = tdee;

  target = Math.round(target);

  if (target < 1200) target = 1200;

  return target;
}

function estimateDaysToGoalFromDbUser(u) {
  const cur = Number(u.CurrentWeightKg);
  const goalW = Number(u.GoalWeightKg);
  const goal = String(u.Goal || "maintain").toLowerCase();

  if (goal === "maintain") return null;
  if (!cur || !goalW) return null;

  const diff = Math.abs(cur - goalW);
  if (diff === 0) return 0;

  
  if (goal === "lose") return Math.ceil((diff / 0.5) * 7);    
  if (goal === "gain") return Math.ceil((diff / 0.25) * 7);   

  return null;
}

function buildNutritionForUser(u) {
  const bmr = calculateBMRFromDbUser(u);
  const tdee = calculateTDEEFromDbUser(u);
  const maxCalories = calculateTargetCaloriesFromDbUser(u);
  const daysToGoal = estimateDaysToGoalFromDbUser(u);

  return { bmr, tdee, maxCalories, daysToGoal };
}

module.exports = {
  calculateBMRFromDbUser,
  calculateTDEEFromDbUser,
  calculateTargetCaloriesFromDbUser,
  estimateDaysToGoalFromDbUser,
  buildNutritionForUser,
};