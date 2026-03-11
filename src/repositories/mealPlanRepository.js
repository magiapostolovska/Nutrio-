const { Op } = require("sequelize");
const db = require("../db/models");
const recipeRepository = require("../repositories/recipesRepository");

const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

function toDateOnly(dateStr) {
  const d = new Date(dateStr);
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

  const days = payload.days || 30;
  if (!dailyMax || dailyMax <= 0) throw new Error("Invalid dailyMax");

  const allRecipes = await db.Recipes.findAll({
    attributes: ["RecipeId", "Calories"],
    limit: 1000,
  });

  const recipes = allRecipes.map((r) => ({
    RecipeId: r.RecipeId,
    Calories: r.Calories ?? r.calories ?? 0,
  }));

  if (!recipes.length) return { createdDays: 0, createdItems: 0, message: "No recipes available" };

  const pickThatFits = (remaining) => {
    const fits = recipes.filter((r) => (r.Calories || 0) <= remaining);
    if (!fits.length) return null;
    return fits[Math.floor(Math.random() * fits.length)];
  };

  const start = new Date(startDateKey);
  let createdItems = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const planDateKey = toDateOnly(d.toISOString());

    let remaining = dailyMax;

    for (const mt of mealTypes) {
      const chosen = pickThatFits(remaining);

      const recipeId = chosen ? chosen.RecipeId : null;
      const calories = chosen ? (chosen.Calories || 0) : 0;

      if (calories > remaining) {
        continue;
      }

      const [row, created] = await db.MealPlanItems.findOrCreate({
        where: { UserId: userId, PlanDate: planDateKey, MealType: mt },
        defaults: {
          UserId: userId,
          PlanDate: planDateKey,
          MealType: mt,
          RecipeId: recipeId,
          Calories: calories,
          IsEaten: false,
          EatenAt: null,
        },
      });

      if (!created) {
        row.RecipeId = recipeId;
        row.Calories = calories;
        row.IsEaten = false;
        row.EatenAt = null;
        await row.save();
      }

      remaining -= calories;
      createdItems += 1;
    }
  }

  return { createdDays: days, createdItems, startDate: startDateKey, dailyMax };
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