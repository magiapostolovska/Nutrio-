const db = require("../db/models");

async function getAllRecipes() {
  return db.Recipes.findAll({
    order: [["RecipeId", "DESC"]],
    include: [
      {
        model: db.RecipeIngredients,
        as: "RecipeIngredients",
        attributes: ["RecipeIngredientId", "LineText"],
      },
      {
        model: db.RecipeInstructions,
        as: "RecipeInstructions",
        attributes: ["RecipeInstructionId", "StepNumber", "StepText"],
      },
    ],
  });
}

async function getRecipeById(recipeId) {
  return db.Recipes.findByPk(recipeId, {
    include: [
      {
        model: db.RecipeIngredients,
        as: "RecipeIngredients",
        attributes: ["RecipeIngredientId", "LineText"],
      },
      {
        model: db.RecipeInstructions,
        as: "RecipeInstructions",
        attributes: ["RecipeInstructionId", "StepNumber", "StepText"],
      },
    ],
    order: [[{ model: db.RecipeInstructions, as: "RecipeInstructions" }, "StepNumber", "ASC"]],
  });
}

async function createRecipe(payload) {
  const { ingredients = [], instructions = [], ...recipeData } = payload;

  return db.sequelize.transaction(async (t) => {
    const recipe = await db.Recipes.create(recipeData, { transaction: t });

    if (ingredients.length) {
      await db.RecipeIngredients.bulkCreate(
        ingredients.map((line) => ({
          RecipeId: recipe.RecipeId,
          LineText: line,
        })),
        { transaction: t }
      );
    }

    if (instructions.length) {
      await db.RecipeInstructions.bulkCreate(
        instructions.map((s, index) => ({
          RecipeId: recipe.RecipeId,
          StepNumber: s.stepNumber ?? index + 1,
          StepText: s.stepText,
        })),
        { transaction: t }
      );
    }

    return recipe.RecipeId;
  });
}

async function updateRecipe(recipeId, payload) {
  const { ingredients, instructions, ...recipeData } = payload;

  return db.sequelize.transaction(async (t) => {
    const recipe = await db.Recipes.findByPk(recipeId, { transaction: t });
    if (!recipe) return null;

    await recipe.update(recipeData, { transaction: t });

    if (Array.isArray(ingredients)) {
      await db.RecipeIngredients.destroy({ where: { RecipeId: recipeId }, transaction: t });

      if (ingredients.length) {
        await db.RecipeIngredients.bulkCreate(
          ingredients.map((line) => ({
            RecipeId: recipeId,
            LineText: line,
          })),
          { transaction: t }
        );
      }
    }

    if (Array.isArray(instructions)) {
      await db.RecipeInstructions.destroy({ where: { RecipeId: recipeId }, transaction: t });

      if (instructions.length) {
        await db.RecipeInstructions.bulkCreate(
          instructions.map((s, index) => ({
            RecipeId: recipeId,
            StepNumber: s.stepNumber ?? index + 1,
            StepText: s.stepText,
          })),
          { transaction: t }
        );
      }
    }

    return true;
  });
}

async function deleteRecipe(recipeId) {
  return db.sequelize.transaction(async (t) => {
    const recipe = await db.Recipes.findByPk(recipeId, { transaction: t });
    if (!recipe) return null;

    await db.RecipeInstructions.destroy({ where: { RecipeId: recipeId }, transaction: t });
    await db.RecipeIngredients.destroy({ where: { RecipeId: recipeId }, transaction: t });
    await db.Recipes.destroy({ where: { RecipeId: recipeId }, transaction: t });

    return true;
  });
}

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};