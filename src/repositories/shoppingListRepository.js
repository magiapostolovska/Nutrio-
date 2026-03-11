const { Op } = require("sequelize");
const db = require("../db/models");

function mergeIngredients(items) {
  const map = new Map();

  items.forEach((item) => {
    const text = item.itemText.trim();

    const match = text.match(/^(\d+)(g|ml|kg)?\s+(.*)$/i);

    if (match) {
      const qty = Number(match[1]);
      const unit = match[2] || "";
      const ingredient = match[3].toLowerCase();

      const key = ingredient + unit;

      if (!map.has(key)) {
        map.set(key, {
          itemText: `${qty}${unit} ${ingredient}`,
          quantity: qty,
          unit,
          ingredient,
          checked: item.checked,
        });
      } else {
        const existing = map.get(key);
        existing.quantity += qty;
      }
    } else {
      const key = text.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          itemText: text,
          quantity: 1,
          ingredient: text,
          unit: "",
          checked: item.checked,
        });
      } else {
        const existing = map.get(key);
        existing.quantity += 1;
      }
    }
  });

  return Array.from(map.values()).map((item) => {
    if (item.unit) {
      return {
        itemText: `${item.quantity}${item.unit} ${item.ingredient}`,
        checked: false,
      };
    }

    if (item.quantity > 1) {
      return {
        itemText: `${item.quantity}x ${item.ingredient}`,
        checked: false,
      };
    }

    return {
      itemText: item.ingredient,
      checked: false,
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
    new Set(mealRows.map((r) => r.RecipeId).filter((x) => Number.isInteger(x) && x > 0))
  );

  const ingredientsRows = await loadIngredientsForRecipeIds(recipeIds);

  const ingredientsByRecipeId = new Map();
  for (const ing of ingredientsRows) {
    if (!ingredientsByRecipeId.has(ing.RecipeId)) ingredientsByRecipeId.set(ing.RecipeId, []);
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

  await db.ShoppingListItems.destroy({
    where: {
      UserId: userId,
      ForDate: { [Op.gte]: fromKey, [Op.lte]: toKey },
      IsGenerated: true,
      MealPlanItemId: { [Op.ne]: null, [Op.notIn]: Array.from(currentMealPlanItemIds) },
    },
  });

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

    const checkedCount = visibleItems.filter((x) => !!x.IsChecked).length;

    

const mergedItems = mergeIngredients(
  visibleItems.map((x) => ({
    itemText: x.ItemText,
    checked: !!x.IsChecked,
  }))
);

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
      const checkedCount = visibleItems.filter((x) => !!x.IsChecked).length;

      days.push({
        date: newKey,
        completed,
        hasMeals: mealRows.length > 0,
        items: visibleItems.map((x) => ({
          shoppingListItemId: x.ShoppingListItemId,
          itemText: x.ItemText,
          checked: !!x.IsChecked,
        })),
        counts: { total: visibleItems.length, checked: checkedCount },
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