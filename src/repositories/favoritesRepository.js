const db = require("../db/models");

async function getFavoritesByUserId(userId) {
  return db.Favorites.findAll({
    where: { UserId: userId },
    include: [
      {
        model: db.Recipes,
        as: "Recipe",
        include: [
          { model: db.RecipeIngredients, as: "RecipeIngredients", attributes: ["RecipeIngredientId", "LineText"] },
          { model: db.RecipeInstructions, as: "RecipeInstructions", attributes: ["RecipeInstructionId", "StepNumber", "StepText"] },
        ],
      },
    ],
    order: [[{ model: db.Recipes, as: "Recipe" }, "RecipeId", "DESC"]],
  });
}

async function createFavorite(userId, recipeId) {
  const recipe = await db.Recipes.findByPk(recipeId);
  if (!recipe) return null; 

  const existing = await db.Favorites.findOne({ where: { UserId: userId, RecipeId: recipeId } });
  if (existing) return { created: false };

  await db.Favorites.create({ UserId: userId, RecipeId: recipeId });
  return { created: true };
}

async function deleteFavorite(userId, recipeId) {
  const rows = await db.Favorites.destroy({ where: { UserId: userId, RecipeId: recipeId } });
  return rows > 0; 
}

module.exports = {
  getFavoritesByUserId,
  createFavorite,
  deleteFavorite,
};