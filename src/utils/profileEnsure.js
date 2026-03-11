
const allowedGoals = new Set(["lose", "gain", "maintain"]);
const allowedActivityLevels = new Set([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very-active",
]);
const allowedSex = new Set(["male", "female"]);
const allowedDietTypes = new Set([
  "omnivore",
  "vegetarian",
  "vegan",
  "pescatarian",
]);

function normalizeActivity(level) {
  const v = String(level || "").toLowerCase();
  if (v === "very_active") return "very-active";
  return v;
}

function normalizeSex(sex) {
  const v = String(sex || "").toLowerCase();
  if (v === "m") return "male";
  if (v === "f") return "female";
  return v;
}

function normalizeGoal(goal) {
  const v = String(goal || "").toLowerCase();
  if (v === "maintenance") return "maintain";
  return v;
}

function normalizeDietType(dietType) {
  return String(dietType || "").toLowerCase();
}

function getMissingFields(user) {
  const missing = [];

  if (user.Sex == null) missing.push("Sex");
  if (user.HeightCm == null) missing.push("HeightCm");
  if (user.CurrentWeightKg == null) missing.push("CurrentWeightKg");
  if (user.Goal == null) missing.push("Goal");
  if (user.ActivityLevel == null) missing.push("ActivityLevel");
  if (user.GoalWeightKg == null) missing.push("GoalWeightKg");
  if (user.DietType == null) missing.push("DietType");

  return missing;
}

function validateProfile(profile) {
  const errors = [];

  if (profile.HeightCm !== undefined) {
    const n = Number(profile.HeightCm);
    if (!Number.isFinite(n) || n <= 0) {
      errors.push("HeightCm must be > 0");
    }
  }

  if (profile.CurrentWeightKg !== undefined) {
    const n = Number(profile.CurrentWeightKg);
    if (!Number.isFinite(n) || n <= 0) {
      errors.push("CurrentWeightKg must be > 0");
    }
  }

  if (profile.GoalWeightKg !== undefined) {
    const n = Number(profile.GoalWeightKg);
    if (!Number.isFinite(n) || n <= 0) {
      errors.push("GoalWeightKg must be > 0");
    }
  }

  if (profile.Sex !== undefined) {
    const s = normalizeSex(profile.Sex);
    if (!allowedSex.has(s)) {
      errors.push("Sex must be male or female");
    }
  }

  if (profile.Goal !== undefined) {
    const g = normalizeGoal(profile.Goal);
    if (!allowedGoals.has(g)) {
      errors.push("Goal must be lose, gain, or maintain");
    }
  }

  if (profile.ActivityLevel !== undefined) {
    const a = normalizeActivity(profile.ActivityLevel);
    if (!allowedActivityLevels.has(a)) {
      errors.push("ActivityLevel invalid");
    }
  }

  if (profile.DietType !== undefined) {
    const d = normalizeDietType(profile.DietType);
    if (!allowedDietTypes.has(d)) {
      errors.push("DietType invalid");
    }
  }

  return errors;
}

async function ensureUserProfile(user, reqBody) {
  const profile = reqBody?.profile || {};

  const errors = validateProfile(profile);
  if (errors.length) {
    return {
      ok: false,
      status: 400,
      response: { message: "Invalid profile data", errors },
    };
  }

  const newCurrentWeight =
    profile.CurrentWeightKg !== undefined
      ? Number(profile.CurrentWeightKg)
      : user.CurrentWeightKg;

  const patch = {
    Sex:
      profile.Sex !== undefined
        ? normalizeSex(profile.Sex)
        : user.Sex,

    HeightCm:
      profile.HeightCm !== undefined
        ? Number(profile.HeightCm)
        : user.HeightCm,

    CurrentWeightKg: newCurrentWeight,

    GoalWeightKg:
      profile.GoalWeightKg !== undefined
        ? Number(profile.GoalWeightKg)
        : user.GoalWeightKg,

    Goal:
      profile.Goal !== undefined
        ? normalizeGoal(profile.Goal)
        : user.Goal,

    ActivityLevel:
      profile.ActivityLevel !== undefined
        ? normalizeActivity(profile.ActivityLevel)
        : user.ActivityLevel,

    DietType:
      profile.DietType !== undefined
        ? normalizeDietType(profile.DietType)
        : user.DietType,
  };

  if (!user.StartWeightKg && newCurrentWeight) {
    patch.StartWeightKg = newCurrentWeight;
  }

  await user.update(patch);

  return { ok: true, user };
}

module.exports = { ensureUserProfile };

