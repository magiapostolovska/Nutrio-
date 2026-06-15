const db = require("../db/models");
const mealPlanRepo = require("../repositories/mealPlanRepository");
const { buildNutritionForUser } = require("../utils/calculations.backend");
const { ensureUserProfile } = require("../utils/profileEnsure");

function toInt(val) {
  const n = Number(val);
  return Number.isInteger(n) ? n : null;
}

function getAuthUserId(req) {
  return req.user?.userId;
}

const allowedMealTypes = new Set(["breakfast", "lunch", "dinner", "snack"]);

async function getUserOrFail(userId) {
  const user = await db.Users.findByPk(userId);
  if (!user) throw new Error("User not found");
  return user;
}

function requireNutritionOrThrow(nutrition) {
  if (!nutrition.maxCalories) {
    throw new Error(
      "Please complete your profile (age, sex, height, weight, activity level, goal) to calculate calories."
    );
  }
}
async function checkIfUserHasMealPlan(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hasMealPlan = await mealPlanRepo.userHasMealPlan(userId);

    if (hasMealPlan) {
      return res.json({
        message: "You have meal plan",
        hasMealPlan: true,
      });
    }

    return res.json({
      message: "You dont have meal plan",
      hasMealPlan: false,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to check meal plan",
      error: err.message,
    });
  }
}
async function getMealPlan(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required (YYYY-MM-DD)" });
    }

    const user = await getUserOrFail(userId);
    const nutrition = buildNutritionForUser(user);

    const data = await mealPlanRepo.getRangeGrouped(userId, from, to);

    return res.json({
      mealPlan: data,
      nutrition,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load meal plan", error: err.message });
  }
}

async function getMealsByDay(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const date = req.params.date;

    const user = await getUserOrFail(userId);
    const nutrition = buildNutritionForUser(user);

    const day = await mealPlanRepo.getDayGrouped(userId, date);

    const dateKey = mealPlanRepo.toDateOnly(date) || date;
    const dayTotalCalories = await mealPlanRepo.getDayTotalCalories(userId, dateKey);

    const remainingCalories =
      nutrition.maxCalories != null ? Math.max(0, nutrition.maxCalories - dayTotalCalories) : null;

    return res.json({
      day, 
      nutrition: {
        ...nutrition,
        dayTotalCalories,
        remainingCalories,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load day meals", error: err.message });
  }
}

async function createMealPlanManually(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await getUserOrFail(userId);

    const dobRaw = user.DateOfBirth || user.dateOfBirth || user.DOB;
    if (!dobRaw) {
      return res.status(400).json({
        message: "DateOfBirth is required in your user profile before creating a meal plan.",
      });
    }

    const dob = new Date(dobRaw);
    if (Number.isNaN(dob.getTime())) {
      return res.status(400).json({
        message: "Invalid DateOfBirth value in database.",
        DateOfBirth: dobRaw,
      });
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

    if (!Number.isFinite(age) || age <= 0) {
      return res.status(400).json({
        message: "Could not calculate a valid age from DateOfBirth.",
        DateOfBirth: dobRaw,
        ageCalculated: age,
      });
    }

    const ensured = await ensureUserProfile(user, req.body);

    if (!ensured || ensured.ok !== true) {
      return res.status(ensured?.status || 500).json(
        ensured?.response || { message: "Profile ensure failed (no response)" }
      );
    }

    const { planDate, mealType, recipeId } = req.body;

    if (!planDate) return res.status(400).json({ message: "planDate is required (YYYY-MM-DD)" });

    const mt = String(mealType || "").toLowerCase();
    if (!allowedMealTypes.has(mt)) return res.status(400).json({ message: "Invalid mealType" });

    const rid = recipeId == null ? null : Number(recipeId);
    if (rid !== null && (!Number.isInteger(rid) || rid <= 0)) {
      return res.status(400).json({ message: "Invalid recipeId" });
    }

    const userPlain =
      typeof user.get === "function" ? user.get({ plain: true }) : { ...user };

    const nutrition = buildNutritionForUser({
      ...userPlain,
      Age: age, 
    });

    if (!nutrition.maxCalories) {
      return res.status(400).json({
        message:
          "Cannot calculate calories (check DateOfBirth/Sex/Height/CurrentWeight/Goal/ActivityLevel).",
        debug: {
          Age: age,
          Sex: userPlain.Sex,
          HeightCm: userPlain.HeightCm,
          CurrentWeightKg: userPlain.CurrentWeightKg,
          Goal: userPlain.Goal,
          ActivityLevel: userPlain.ActivityLevel,
        },
      });
    }

    if (user.DailyTargetCal !== nutrition.maxCalories) {
      await user.update({ DailyTargetCal: nutrition.maxCalories });
    }

    let newMealCalories = 0;
    if (rid != null) {
      const recipe = await db.Recipes.findByPk(rid);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
      newMealCalories = recipe.Calories ?? recipe.calories ?? 0;
    }

    const dateKey = mealPlanRepo.toDateOnly(planDate) || planDate;

    const totalWithoutThisMeal = await mealPlanRepo.getDayTotalExcludingMealType(
      userId,
      dateKey,
      mt
    );
    const wouldBeTotal = totalWithoutThisMeal + newMealCalories;

    if (wouldBeTotal > nutrition.maxCalories) {
      return res.status(400).json({
        message: "This recipe would exceed your daily calorie limit for that day.",
        maxCalories: nutrition.maxCalories,
        currentWithoutMeal: totalWithoutThisMeal,
        recipeCalories: newMealCalories,
        wouldBeTotal,
      });
    }

    const day = await mealPlanRepo.createOrReplaceByUnique(userId, planDate, mt, rid);

    const dayTotalCalories = await mealPlanRepo.getDayTotalCalories(userId, dateKey);

    return res.status(201).json({
      day,
      nutrition: {
        ...nutrition,
        maxCalories: nutrition.maxCalories,
        dayTotalCalories,
        remainingCalories: Math.max(0, nutrition.maxCalories - dayTotalCalories),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create meal plan item", error: err.message });
  }
}

async function createMealPlanGenerate(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { startDate } = req.body;
    if (!startDate) {
      return res.status(400).json({
        message: "startDate is required (YYYY-MM-DD)",
      });
    }

    const user = await getUserOrFail(userId);

    const dobRaw = user.DateOfBirth || user.dateOfBirth || user.DOB;
    if (!dobRaw) {
      return res.status(400).json({
        message: "DateOfBirth is required in your user profile before generating a meal plan.",
      });
    }

    const dob = new Date(dobRaw);
    if (Number.isNaN(dob.getTime())) {
      return res.status(400).json({
        message: "Invalid DateOfBirth value in database.",
        DateOfBirth: dobRaw,
      });
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

    if (!Number.isFinite(age) || age <= 0) {
      return res.status(400).json({
        message: "Could not calculate a valid age from DateOfBirth.",
        DateOfBirth: dobRaw,
        ageCalculated: age,
      });
    }

    const ensured = await ensureUserProfile(user, req.body);
    if (!ensured || ensured.ok !== true) {
      return res.status(ensured?.status || 500).json(
        ensured?.response || { message: "Profile ensure failed (no response)" }
      );
    }

    const userPlain =
      typeof user.get === "function" ? user.get({ plain: true }) : { ...user };

    const nutrition = buildNutritionForUser({
      ...userPlain,
      Age: age,
    });

    if (!nutrition.maxCalories) {
      return res.status(400).json({
        message:
          "Cannot calculate calories (check DateOfBirth/Sex/Height/CurrentWeight/Goal/ActivityLevel).",
        debug: {
          Age: age,
          Sex: userPlain.Sex,
          HeightCm: userPlain.HeightCm,
          CurrentWeightKg: userPlain.CurrentWeightKg,
          Goal: userPlain.Goal,
          ActivityLevel: userPlain.ActivityLevel,
        },
      });
    }

    const startKey = mealPlanRepo.toDateOnly(startDate);
    if (!startKey) {
      return res.status(400).json({ message: "Invalid startDate (YYYY-MM-DD)" });
    }

    const [year, month, day] = startKey.split("-").map(Number);

const endDayOfMonth = new Date(year, month, 0).getDate();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startUtc = Date.UTC(year, month - 1, day);
const endUtc = Date.UTC(year, month - 1, endDayOfMonth);

const daysToGenerate = Math.floor((endUtc - startUtc) / MS_PER_DAY) + 1;

const endDateKey = `${year}-${String(month).padStart(2, "0")}-${String(endDayOfMonth).padStart(2, "0")}`;

    const patch = {};

    if (user.DailyTargetCal !== nutrition.maxCalories) {
      patch.DailyTargetCal = nutrition.maxCalories;
    }

    if (!user.PlanStartDate && startKey) {
      patch.PlanStartDate = startKey;
    }

    if (Object.keys(patch).length) {
      await user.update(patch);
    }
console.log("Controller sending startKey:", startKey, "daysToGenerate:", daysToGenerate);
    const result = await mealPlanRepo.generateWithMax(
      userId,
      {
        ...req.body,
        startDate: startKey,
        days: daysToGenerate,
      },
      nutrition.maxCalories
    );

    return res.status(201).json({
      ...result,
      nutrition,
      meta: {
        startDate: startKey,
        endDate: endDateKey,
        daysGenerated: daysToGenerate,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to generate meal plan",
      error: err.message,
    });
  }
}

async function updateMealPlan(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const mealPlanItemId = toInt(req.params.mealPlanItemId);
    if (!mealPlanItemId) return res.status(400).json({ message: "Invalid mealPlanItemId" });

    const { planDate, mealType, recipeId, calories, isEaten } = req.body;

    if (mealType) {
      const mt = String(mealType).toLowerCase();
      if (!allowedMealTypes.has(mt)) return res.status(400).json({ message: "Invalid mealType" });
    }

    const existing = await db.MealPlanItems.findOne({
      where: { MealPlanItemId: mealPlanItemId, UserId: userId },
    });
    if (!existing) return res.status(404).json({ message: "Meal plan item not found" });

    const user = await getUserOrFail(userId);
    const nutrition = buildNutritionForUser(user);

    const changingSlot = planDate || mealType || recipeId !== undefined || calories !== undefined;

    if (changingSlot) {
      try {
        requireNutritionOrThrow(nutrition);
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }

      const targetDateKey = mealPlanRepo.toDateOnly(planDate || existing.PlanDate);
      const targetMealType = String(mealType || existing.MealType).toLowerCase();

      let newMealCalories = existing.Calories || 0;

      if (recipeId !== undefined) {
        const rid = recipeId === null ? null : Number(recipeId);
        if (rid !== null && (!Number.isInteger(rid) || rid <= 0)) {
          return res.status(400).json({ message: "Invalid recipeId" });
        }

        if (rid === null) {
          newMealCalories = calories != null ? Number(calories) : 0;
        } else {
          const recipe = await db.Recipes.findByPk(rid);
          if (!recipe) return res.status(404).json({ message: "Recipe not found" });
          newMealCalories = recipe.Calories ?? recipe.calories ?? 0;
        }
      } else if (calories !== undefined) {
        newMealCalories = Number(calories) || 0;
      }

      const totalWithoutSlot = await mealPlanRepo.getDayTotalExcludingMealType(
        userId,
        targetDateKey,
        targetMealType
      );

      const wouldBeTotal = totalWithoutSlot + newMealCalories;

      if (wouldBeTotal > nutrition.maxCalories) {
        return res.status(400).json({
          message: "This change would exceed your daily calorie limit for that day.",
          maxCalories: nutrition.maxCalories,
          currentWithoutMeal: totalWithoutSlot,
          recipeCalories: newMealCalories,
          wouldBeTotal,
        });
      }
    }

    const updated = await mealPlanRepo.updateById(userId, mealPlanItemId, {
      planDate,
      mealType: mealType ? String(mealType).toLowerCase() : undefined,
      recipeId,
      calories,
      isEaten,
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    if (String(err.message).toLowerCase().includes("recipe")) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: "Failed to update meal plan item", error: err.message });
  }
}

async function updateMealStatus(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const mealPlanItemId = toInt(req.params.mealPlanItemId);
    if (!mealPlanItemId) return res.status(400).json({ message: "Invalid mealPlanItemId" });

    const { isEaten } = req.body;
    if (typeof isEaten !== "boolean") {
      return res.status(400).json({ message: "Body must include isEaten: true/false" });
    }

    const updated = await mealPlanRepo.setEatenById(userId, mealPlanItemId, isEaten);
    if (!updated) return res.status(404).json({ message: "Meal plan item not found" });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update meal status", error: err.message });
  }
}

async function deleteMealPlan(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const mealPlanItemId = toInt(req.params.mealPlanItemId);
    if (!mealPlanItemId) return res.status(400).json({ message: "Invalid mealPlanItemId" });

    const ok = await mealPlanRepo.deleteById(userId, mealPlanItemId);
    if (!ok) return res.status(404).json({ message: "Meal plan item not found" });

    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete meal plan item", error: err.message });
  }
}

module.exports = {
  getMealPlan,
  getMealsByDay,
  createMealPlanManually,
  createMealPlanGenerate,
  updateMealPlan,
  updateMealStatus,
  deleteMealPlan,
  checkIfUserHasMealPlan
};