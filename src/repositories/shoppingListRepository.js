const { Op } = require("sequelize");
const db = require("../db/models");

function parseQty(qtyText) {
  const text = String(qtyText || "").trim();
  if (!text) return null;

  let match = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (match) {
    const whole = Number(match[1]);
    const num = Number(match[2]);
    const den = Number(match[3]);
    if (den !== 0) return whole + num / den;
  }

  match = text.match(/^(\d+)\/(\d+)$/);
  if (match) {
    const num = Number(match[1]);
    const den = Number(match[2]);
    if (den !== 0) return num / den;
  }

  const n = Number(text);
  return Number.isNaN(n) ? null : n;
}

function formatQty(num) {
  if (!Number.isFinite(num)) return "";

  if (Number.isInteger(num)) return String(num);

  const whole = Math.floor(num);
  const fraction = num - whole;

  if (Math.abs(fraction - 0.25) < 0.01) {
    return whole > 0 ? `${whole} 1/4` : "1/4";
  }

  if (Math.abs(fraction - 1 / 3) < 0.02) {
    return whole > 0 ? `${whole} 1/3` : "1/3";
  }

  if (Math.abs(fraction - 0.5) < 0.01) {
    return whole > 0 ? `${whole} 1/2` : "1/2";
  }

  if (Math.abs(fraction - 2 / 3) < 0.02) {
    return whole > 0 ? `${whole} 2/3` : "2/3";
  }

  if (Math.abs(fraction - 0.75) < 0.01) {
    return whole > 0 ? `${whole} 3/4` : "3/4";
  }

  return Number(num.toFixed(2)).toString();
}

function normalizeUnit(unit) {
  const u = String(unit || "").trim().toLowerCase();

  const map = {
    g: "g",
    gram: "g",
    grams: "g",

    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",

    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",

    l: "l",
    liter: "l",
    liters: "l",

    cup: "cup",
    cups: "cup",

    tbsp: "tablespoon",
    tablespoon: "tablespoon",
    tablespoons: "tablespoon",

    tsp: "teaspoon",
    teaspoon: "teaspoon",
    teaspoons: "teaspoon",

    piece: "piece",
    pieces: "piece",

    clove: "clove",
    cloves: "clove",

    slice: "slice",
    slices: "slice",
  };

  return map[u] || u;
}

function mergeIngredients(items) {
  const map = new Map();

  for (const item of items) {
    const text = String(item.itemText || "").trim();
    if (!text) continue;

    const match = text.match(
      /^((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+(?:\.\d+)?))(?:(?:\s+)(g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|piece|pieces|clove|cloves|slice|slices))?\s+(.*)$/i
    );

    if (match) {
      const qty = parseQty(match[1]);
      const unit = normalizeUnit(match[2] || "");
      const ingredient = match[3].trim().toLowerCase();
      const key = `${ingredient}||${unit}`;

      if (!map.has(key)) {
        map.set(key, {
          shoppingListItemIds: item.shoppingListItemId ? [item.shoppingListItemId] : [],
          quantity: qty ?? 0,
          unit,
          ingredient,
          checked: !!item.checked,
        });
      } else {
        const existing = map.get(key);
        existing.quantity += qty ?? 0;

        if (item.shoppingListItemId) {
          existing.shoppingListItemIds.push(item.shoppingListItemId);
        }

        existing.checked = existing.checked && !!item.checked;
      }
    } else {
      const key = text.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          shoppingListItemIds: item.shoppingListItemId ? [item.shoppingListItemId] : [],
          quantity: null,
          ingredient: text,
          unit: "",
          checked: !!item.checked,
        });
      } else {
        const existing = map.get(key);

        if (item.shoppingListItemId) {
          existing.shoppingListItemIds.push(item.shoppingListItemId);
        }

        existing.checked = existing.checked && !!item.checked;
      }
    }
  }

  return Array.from(map.values()).map((item) => {
    const firstId = item.shoppingListItemIds[0] || null;

    let itemText = item.ingredient;
    if (item.quantity !== null) {
      itemText = item.unit
        ? `${formatQty(item.quantity)} ${item.unit} ${item.ingredient}`
        : `${formatQty(item.quantity)} ${item.ingredient}`;
    }

    return {
      shoppingListItemId: firstId,
      shoppingListItemIds: item.shoppingListItemIds,
      itemText,
      checked: item.checked,
    };
  });
}

function toDateOnly(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateKey, days) {
  const d = new Date(dateKey);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toDateOnly(d.toISOString());
}

function getTodayKey() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toDateOnly(d.toISOString());
}

function isDayCompleted(mealRowsForDay) {
  if (!mealRowsForDay || mealRowsForDay.length === 0) return false;
  return mealRowsForDay.every((r) => !!r.IsEaten);
}

async function loadMealPlanRows(userId, fromKey, toKey) {
  return db.MealPlanItems.findAll({
    where: {
      UserId: userId,
      PlanDate: { [Op.gte]: fromKey, [Op.lte]: toKey },
    },
    attributes: ["MealPlanItemId", "PlanDate", "MealType", "RecipeId", "IsEaten"],
    order: [["PlanDate", "ASC"]],
  });
}

async function loadIngredientsForRecipeIds(recipeIds) {
  if (!recipeIds.length) return [];

  return db.RecipeIngredients.findAll({
    where: { RecipeId: recipeIds },
    attributes: ["RecipeIngredientId", "RecipeId", "LineText"],
    order: [["RecipeIngredientId", "ASC"]],
  });
}

async function loadShoppingRows(userId, fromKey, toKey) {
  return db.ShoppingListItems.findAll({
    where: {
      UserId: userId,
      ForDate: { [Op.gte]: fromKey, [Op.lte]: toKey },
      IsGenerated: true,
    },
    attributes: ["ShoppingListItemId", "ForDate", "ItemText", "IsChecked", "IsHidden"],
    order: [["ForDate", "ASC"], ["ShoppingListItemId", "ASC"]],
  });
}

async function ensureShoppingGeneratedForRange(userId, fromStr, toStr) {
  const fromKey = toDateOnly(fromStr);
  const toKey = toDateOnly(toStr);
  if (!fromKey || !toKey) throw new Error("Invalid from/to");

  const mealRows = await loadMealPlanRows(userId, fromKey, toKey);

  const mealsByDate = new Map();
  for (const r of mealRows) {
    const k = r.PlanDate;
    if (!mealsByDate.has(k)) mealsByDate.set(k, []);
    mealsByDate.get(k).push(r);
  }

  const recipeIds = Array.from(
    new Set(
      mealRows
        .map((r) => r.RecipeId)
        .filter((x) => Number.isInteger(x) && x > 0)
    )
  );

  const ingredientsRows = await loadIngredientsForRecipeIds(recipeIds);

  const ingredientsByRecipeId = new Map();
  for (const ing of ingredientsRows) {
    if (!ingredientsByRecipeId.has(ing.RecipeId)) {
      ingredientsByRecipeId.set(ing.RecipeId, []);
    }
    ingredientsByRecipeId.get(ing.RecipeId).push(ing);
  }

  const existing = await db.ShoppingListItems.findAll({
    where: {
      UserId: userId,
      ForDate: { [Op.gte]: fromKey, [Op.lte]: toKey },
      IsGenerated: true,
    },
    attributes: ["ForDate", "MealPlanItemId", "RecipeIngredientId"],
  });

  const existingKey = new Set(
    existing.map((r) => `${r.ForDate}||${r.MealPlanItemId || ""}||${r.RecipeIngredientId || ""}`)
  );

  const currentMealPlanItemIds = new Set(mealRows.map((r) => r.MealPlanItemId));

  const bulk = [];

  for (const meal of mealRows) {
    if (!meal.RecipeId) continue;

    const dateKey = meal.PlanDate;
    const ings = ingredientsByRecipeId.get(meal.RecipeId) || [];

    for (const ing of ings) {
      const itemText = String(ing.LineText || "").trim();
      if (!itemText) continue;

      const k = `${dateKey}||${meal.MealPlanItemId}||${ing.RecipeIngredientId}`;
      if (existingKey.has(k)) continue;

      bulk.push({
        UserId: userId,
        ForDate: dateKey,
        ItemText: itemText,
        IsChecked: false,
        MealPlanItemId: meal.MealPlanItemId,
        IsGenerated: true,
        IsHidden: false,
        RecipeIngredientId: ing.RecipeIngredientId,
      });
    }
  }

  if (bulk.length) {
    await db.ShoppingListItems.bulkCreate(bulk);
  }

  if (currentMealPlanItemIds.size > 0) {
    await db.ShoppingListItems.destroy({
      where: {
        UserId: userId,
        ForDate: { [Op.gte]: fromKey, [Op.lte]: toKey },
        IsGenerated: true,
        MealPlanItemId: {
          [Op.ne]: null,
          [Op.notIn]: Array.from(currentMealPlanItemIds),
        },
      },
    });
  }

  for (const [dateKey, rows] of mealsByDate.entries()) {
    const completed = isDayCompleted(rows);

    await db.ShoppingListItems.update(
      { IsHidden: completed },
      {
        where: {
          UserId: userId,
          ForDate: dateKey,
          IsGenerated: true,
        },
      }
    );
  }

  return true;
}

function mergeShoppingRows(rows) {
  return mergeIngredients(
    rows.map((x) => ({
      shoppingListItemId: x.ShoppingListItemId,
      itemText: x.ItemText,
      checked: !!x.IsChecked,
    }))
  );
}

async function buildDays(userId, fromKey, toKey) {
  await ensureShoppingGeneratedForRange(userId, fromKey, toKey);

  const mealRows = await loadMealPlanRows(userId, fromKey, toKey);
  const shoppingRows = await loadShoppingRows(userId, fromKey, toKey);

  const mealsByDate = new Map();
  for (const r of mealRows) {
    const k = r.PlanDate;
    if (!mealsByDate.has(k)) mealsByDate.set(k, []);
    mealsByDate.get(k).push(r);
  }

  const itemsByDate = new Map();
  for (const it of shoppingRows) {
    const k = it.ForDate;
    if (!itemsByDate.has(k)) itemsByDate.set(k, []);
    itemsByDate.get(k).push(it);
  }

  const days = [];

  for (let i = 0; i < 7; i++) {
    const dateKey = addDays(fromKey, i);
    const dayMeals = mealsByDate.get(dateKey) || [];
    const completed = isDayCompleted(dayMeals);

    const allItems = itemsByDate.get(dateKey) || [];
    const visibleItems = completed ? [] : allItems.filter((x) => !x.IsHidden);

    const mergedItems = mergeShoppingRows(visibleItems);

    days.push({
      date: dateKey,
      completed,
      hasMeals: dayMeals.length > 0,
      items: mergedItems,
      counts: {
        total: mergedItems.length,
        checked: mergedItems.filter((i) => i.checked).length,
      },
    });
  }

  return days;
}

async function getShoppingListRolling(userId) {
  let startKey = getTodayKey();
  let endKey = addDays(startKey, 6);

  let days = await buildDays(userId, startKey, endKey);

  let shift = 0;
  while (days.length && days[0].completed === true) {
    days.shift();
    shift++;
  }

  if (shift > 0) {
    let lastKey = endKey;

    for (let i = 0; i < shift; i++) {
      const newKey = addDays(lastKey, 1);
      lastKey = newKey;

      await ensureShoppingGeneratedForRange(userId, newKey, newKey);

      const mealRows = await loadMealPlanRows(userId, newKey, newKey);
      const completed = isDayCompleted(mealRows);

      const shoppingRows = await loadShoppingRows(userId, newKey, newKey);
      const visibleItems = completed ? [] : shoppingRows.filter((x) => !x.IsHidden);
      const mergedItems = mergeShoppingRows(visibleItems);

      days.push({
        date: newKey,
        completed,
        hasMeals: mealRows.length > 0,
        items: mergedItems,
        counts: {
          total: mergedItems.length,
          checked: mergedItems.filter((i) => i.checked).length,
        },
      });
    }

    while (days.length > 7) days.shift();

    startKey = days[0]?.date || getTodayKey();
    endKey = days[days.length - 1]?.date || addDays(startKey, 6);
  }

  const totalItems = days.reduce((sum, d) => sum + d.counts.total, 0);
  const checkedItems = days.reduce((sum, d) => sum + d.counts.checked, 0);

  return {
    from: startKey,
    to: endKey,
    days,
    summary: { totalItems, checkedItems },
  };
}

async function setItemChecked(userId, shoppingListItemId, checked) {
  const row = await db.ShoppingListItems.findOne({
    where: { ShoppingListItemId: shoppingListItemId, UserId: userId },
  });

  if (!row) return null;

  row.IsChecked = !!checked;
  await row.save();
  return true;
}

async function setDayAllChecked(userId, dateStr, checked) {
  const dateKey = toDateOnly(dateStr);
  if (!dateKey) throw new Error("Invalid date");

  await db.ShoppingListItems.update(
    { IsChecked: !!checked },
    {
      where: {
        UserId: userId,
        ForDate: dateKey,
        IsGenerated: true,
        IsHidden: false,
      },
    }
  );

  return true;
}

module.exports = {
  getShoppingListRolling,
  setItemChecked,
  setDayAllChecked,
  ensureShoppingGeneratedForRange,
  toDateOnly,
};