const { Op } = require("sequelize");
const db = require("../db/models");
const recipeRepository = require("../repositories/recipesRepository");

const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
function parseDateOnly(dateKey) {
  const m = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  return new Date(year, month - 1, day);
}

function formatDateOnlyLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toDateOnly(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function loadRecipesMap(rows) {
  const ids = Array.from(new Set(rows.map((r) => r.RecipeId).filter(Boolean)));
  if (!ids.length) return new Map();

  const map = new Map();

  for (const id of ids) {
    const recipe = await recipeRepository.getRecipeById(id);

    if (!recipe) continue;

    const r = recipe.get({ plain: true });

    map.set(id, {
      id: r.RecipeId,
      title: r.Title,
      description: r.Description,
      image: r.ImageUrl,
      category: r.Category,
      dietaryTags: r.Tags ? r.Tags.split(",") : [],
      prepTime: r.PrepMinutes,
      cookTime: r.CookMinutes,
      servings: r.Servings,
      difficulty: r.Difficulty,
      calories: r.Calories,
      protein: r.ProteinG,
      carbs: r.CarbsG,
      fat: r.FatG,

      ingredients: (r.RecipeIngredients || []).map(i => i.LineText),

      instructions: (r.RecipeInstructions || [])
        .sort((a,b) => a.StepNumber - b.StepNumber)
        .map(i => i.StepText)
    });
  }

  return map;
}

async function rowsToDayShape(rows) {
  if (!rows || rows.length === 0) return null;

  const recipeMap = await loadRecipesMap(rows);

  const day = {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
    eaten: { breakfast: false, lunch: false, dinner: false, snack: false },
    itemIds: { breakfast: null, lunch: null, dinner: null, snack: null },
  };

  for (const r of rows) {
    const mt = String(r.MealType || "").toLowerCase();
    if (!mealTypes.includes(mt)) continue;

    day[mt] = r.RecipeId ? recipeMap.get(r.RecipeId) || null : null;
    day.eaten[mt] = !!r.IsEaten;
    day.itemIds[mt] = r.MealPlanItemId;
  }

  return day;
}

async function getDayRows(userId, planDateKey) {
  return db.MealPlanItems.findAll({
    where: { UserId: userId, PlanDate: planDateKey },
    order: [["MealPlanItemId", "ASC"]],
  });
}

async function getDayTotalCalories(userId, planDateKey) {
  const rows = await db.MealPlanItems.findAll({
    where: { UserId: userId, PlanDate: planDateKey },
    attributes: ["Calories"],
  });
  return rows.reduce((sum, r) => sum + (r.Calories || 0), 0);
}

async function getDayTotalExcludingMealType(userId, planDateKey, mealType) {
  const mt = String(mealType || "").toLowerCase();
  const rows = await db.MealPlanItems.findAll({
    where: { UserId: userId, PlanDate: planDateKey },
    attributes: ["MealType", "Calories"],
  });

  return rows
    .filter((r) => String(r.MealType || "").toLowerCase() !== mt)
    .reduce((sum, r) => sum + (r.Calories || 0), 0);
}

async function getDayTotalExcludingItemId(userId, planDateKey, excludeItemId) {
  const rows = await db.MealPlanItems.findAll({
    where: { UserId: userId, PlanDate: planDateKey },
    attributes: ["MealPlanItemId", "Calories"],
  });

  return rows
    .filter((r) => r.MealPlanItemId !== excludeItemId)
    .reduce((sum, r) => sum + (r.Calories || 0), 0);
}

async function getDayGrouped(userId, dateStr) {
  const dateKey = toDateOnly(dateStr);
  if (!dateKey) throw new Error("Invalid date");

  const rows = await getDayRows(userId, dateKey);
  const day = await rowsToDayShape(rows);
  return day;
}

async function getRangeGrouped(userId, fromStr, toStr) {
  const from = toDateOnly(fromStr);
  const to = toDateOnly(toStr);
  if (!from || !to) throw new Error("Invalid from/to");

  const rows = await db.MealPlanItems.findAll({
    where: {
      UserId: userId,
      PlanDate: { [Op.gte]: from, [Op.lte]: to },
    },
    order: [["PlanDate", "ASC"]],
  });

  const byDate = new Map();
  for (const r of rows) {
    const k = r.PlanDate;
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k).push(r);
  }

  const out = {};
  for (const [dateKey, dateRows] of byDate.entries()) {
    out[dateKey] = await rowsToDayShape(dateRows);
  }

  return out;
}
async function userHasMealPlan(userId) {
  const exists = await db.MealPlanItems.findOne({
    where: { UserId: userId },
    attributes: ["MealPlanItemId"],
  });

  return !!exists;
}
async function createOrReplaceByUnique(userId, planDateStr, mealType, recipeIdOrNull) {
  const planDate = toDateOnly(planDateStr);
  if (!planDate) throw new Error("Invalid planDate");

  const mt = String(mealType || "").toLowerCase();
  if (!mealTypes.includes(mt)) throw new Error("Invalid mealType");

  let calories = null;

  if (recipeIdOrNull != null) {
    const recipe = await db.Recipes.findByPk(recipeIdOrNull);
    if (!recipe) throw new Error("Recipe not found");
    calories = recipe.Calories ?? recipe.calories ?? null;
  }

  const [row, created] = await db.MealPlanItems.findOrCreate({
    where: { UserId: userId, PlanDate: planDate, MealType: mt },
    defaults: {
      UserId: userId,
      PlanDate: planDate,
      MealType: mt,
      RecipeId: recipeIdOrNull,
      Calories: calories,
      IsEaten: false,
      EatenAt: null,
    },
  });

  if (!created) {
    row.RecipeId = recipeIdOrNull;
    row.Calories = calories;
    row.IsEaten = false;
    row.EatenAt = null;
    await row.save();
  }

  return getDayGrouped(userId, planDate);
}

async function updateById(userId, mealPlanItemId, payload) {
  const row = await db.MealPlanItems.findOne({
    where: { MealPlanItemId: mealPlanItemId, UserId: userId },
  });

  if (!row) return null;

  const patch = { ...payload };

  if (patch.planDate) {
    const dk = toDateOnly(patch.planDate);
    if (!dk) throw new Error("Invalid planDate");
    row.PlanDate = dk;
  }

  if (patch.mealType) {
    const mt = String(patch.mealType).toLowerCase();
    if (!mealTypes.includes(mt)) throw new Error("Invalid mealType");
    row.MealType = mt;
  }

  if (patch.recipeId !== undefined) {
    const rid = patch.recipeId === null ? null : Number(patch.recipeId);
    if (rid !== null && (!Number.isInteger(rid) || rid <= 0)) throw new Error("Invalid recipeId");

    if (rid !== null) {
      const recipe = await db.Recipes.findByPk(rid);
      if (!recipe) throw new Error("Recipe not found");

      row.RecipeId = rid;
      if (patch.calories === undefined) {
        row.Calories = recipe.Calories ?? recipe.calories ?? row.Calories;
      }
    } else {
      row.RecipeId = null;
      if (patch.calories !== undefined) row.Calories = patch.calories;
    }

    row.IsEaten = false;
    row.EatenAt = null;
  }

  if (patch.calories !== undefined) {
    row.Calories = patch.calories;
  }

  if (patch.isEaten !== undefined) {
    const isEaten = !!patch.isEaten;
    row.IsEaten = isEaten;
    row.EatenAt = isEaten ? new Date() : null;
  }

  await row.save();
  return row;
}

async function setEatenById(userId, mealPlanItemId, isEaten) {
  const row = await db.MealPlanItems.findOne({
    where: { MealPlanItemId: mealPlanItemId, UserId: userId },
  });

  if (!row) return null;

  row.IsEaten = isEaten;
  row.EatenAt = isEaten ? new Date() : null;

  await row.save();
  return row;
}

async function deleteById(userId, mealPlanItemId) {
  const row = await db.MealPlanItems.findOne({
    where: { MealPlanItemId: mealPlanItemId, UserId: userId },
  });

  if (!row) return null;

  await row.destroy();
  return true;
}

async function generateWithMax(userId, payload, dailyMax) {
  const startDateKey = toDateOnly(payload.startDate);
  if (!startDateKey) throw new Error("Invalid startDate");

  if (!dailyMax || dailyMax <= 0) throw new Error("Invalid dailyMax");

  const start = parseDateOnly(startDateKey);
  if (!start) throw new Error("Invalid startDate");

  let days = Number(payload.days);

  if (!Number.isInteger(days) || days <= 0) {
    const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endMidnight = new Date(
      endOfMonth.getFullYear(),
      endOfMonth.getMonth(),
      endOfMonth.getDate()
    );

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    days =
      Math.floor((endMidnight.getTime() - startMidnight.getTime()) / MS_PER_DAY) + 1;
  }

  console.log("Repo received startDateKey:", startDateKey, "days:", days);

  const allRecipesRaw = await db.Recipes.findAll({
    attributes: ["RecipeId", "Calories", "Category", "Title"],
    limit: 5000,
    raw: true,
  });

  const allRecipes = allRecipesRaw
    .map((r) => ({
      RecipeId: r.RecipeId,
      Calories: Number(r.Calories ?? 0),
      Category: String(r.Category || "").toLowerCase(),
      Title: r.Title,
    }))
    .filter((r) => r.RecipeId && r.Calories > 0 && mealTypes.includes(r.Category));

  if (!allRecipes.length) {
    return {
      createdDays: 0,
      createdItems: 0,
      message: "No recipes available",
    };
  }

  const MIN_DAILY_CALORIES = 1200;
  const MAX_ATTEMPTS_PER_DAY = 200;

  const targets = {
    breakfast: Math.round(dailyMax * 0.25),
    lunch: Math.round(dailyMax * 0.35),
    dinner: Math.round(dailyMax * 0.30),
    snack: Math.round(dailyMax * 0.10),
  };

  function scoreRecipe(recipe, targetCalories, recentIds) {
  const calorieDifference = Math.abs(recipe.Calories - targetCalories);
  let usagePenalty = 0;

  const recentIndex = recentIds.lastIndexOf(recipe.RecipeId);

  if (recentIndex !== -1) {
    const howRecentlyUsed = recentIds.length - recentIndex;

    if (howRecentlyUsed <= 4) {
      usagePenalty = 1000;
    } else if (howRecentlyUsed <= 8) {
      usagePenalty = 500;
    } else if (howRecentlyUsed <= 12) {
      usagePenalty = 200;
    }
  }

  return calorieDifference + usagePenalty;
}

  function pickBestRecipe(mealType, targetCalories, remainingCalories, recentIds, usedTodayIds) {
    const candidates = allRecipes.filter((r) => {
      if (r.Category !== mealType) return false;
      if (usedTodayIds.includes(r.RecipeId)) return false;
      if (r.Calories > remainingCalories) return false;
      return true;
    });

    if (!candidates.length) return null;

    const scored = candidates
      .map((r) => ({
        recipe: r,
        score: scoreRecipe(r, targetCalories, recentIds),
      }))
      .sort((a, b) => a.score - b.score);

    const topFew = scored.slice(0, Math.min(5, scored.length));
    const randomized = shuffle(topFew);

    return randomized[0]?.recipe || null;
  }

  function tryBuildSingleDay(recentRecipeIds) {
    const usedTodayIds = [];
    const selectedMeals = {};
    let dayTotalCalories = 0;

    for (const mt of mealTypes) {
      const remainingCalories = dailyMax - dayTotalCalories;

      if (remainingCalories <= 0) {
        return null;
      }

      const targetForThisMeal = Math.min(targets[mt], remainingCalories);

      const chosen = pickBestRecipe(
        mt,
        targetForThisMeal,
        remainingCalories,
        recentRecipeIds,
        usedTodayIds
      );

      if (!chosen) {
        return null;
      }

      selectedMeals[mt] = {
        recipeId: chosen.RecipeId,
        calories: chosen.Calories,
      };

      usedTodayIds.push(chosen.RecipeId);
      dayTotalCalories += chosen.Calories;
    }

    if (dayTotalCalories < MIN_DAILY_CALORIES) {
      return null;
    }

    if (dayTotalCalories > dailyMax) {
      return null;
    }

    return {
      selectedMeals,
      usedTodayIds,
      dayTotalCalories,
    };
  }

  let createdItems = 0;
  const recentRecipeIds = [];

  for (let i = 0; i < days; i++) {
    const currentDate = addDays(start, i);
    const planDateKey = formatDateOnlyLocal(currentDate);
    console.log("Generating:", planDateKey, "day", i + 1, "of", days);

    let builtDay = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_DAY; attempt++) {
      builtDay = tryBuildSingleDay(recentRecipeIds);

      if (builtDay) {
        console.log(
          "Generated valid day:",
          planDateKey,
          "attempt:",
          attempt,
          "calories:",
          builtDay.dayTotalCalories
        );
        break;
      }
    }

    if (!builtDay) {
      throw new Error(
        `Could not generate a valid meal plan for ${planDateKey} within ${MAX_ATTEMPTS_PER_DAY} attempts. Check recipe calorie ranges.`
      );
    }

    for (const mt of mealTypes) {
      const meal = builtDay.selectedMeals[mt];

      const [row, created] = await db.MealPlanItems.findOrCreate({
        where: { UserId: userId, PlanDate: planDateKey, MealType: mt },
        defaults: {
          UserId: userId,
          PlanDate: planDateKey,
          MealType: mt,
          RecipeId: meal.recipeId,
          Calories: meal.calories,
          IsEaten: false,
          EatenAt: null,
        },
      });

      if (!created) {
        row.RecipeId = meal.recipeId;
        row.Calories = meal.calories;
        row.IsEaten = false;
        row.EatenAt = null;
        await row.save();
      }

      createdItems += 1;
    }

    recentRecipeIds.push(...builtDay.usedTodayIds);

    while (recentRecipeIds.length > 12) {
      recentRecipeIds.shift();
    }
  }

  return {
    createdDays: days,
    createdItems,
    startDate: startDateKey,
    dailyMax,
  };
}

module.exports = {
  toDateOnly,
  getDayRows,
  getDayTotalCalories,
  getDayTotalExcludingMealType,
  getDayTotalExcludingItemId,
  getRangeGrouped,
  getDayGrouped,
  createOrReplaceByUnique,
  updateById,
  setEatenById,
  deleteById,
  generateWithMax,
  userHasMealPlan
};