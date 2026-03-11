const recipeRepository = require("../repositories/recipesRepository");

function toInt(val) {
  const n = Number(val);
  return Number.isInteger(n) ? n : null;
}

async function getAllRecipes(req, res) {
  try {
    const recipes = await recipeRepository.getAllRecipes();
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load recipes", error: err.message });
  }
}

async function getRecipeById(req, res) {
  try {
    const recipeId = toInt(req.params.recipeId);
    if (!recipeId) return res.status(400).json({ message: "Invalid recipeId" });

    const recipe = await recipeRepository.getRecipeById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load recipe", error: err.message });
  }
}

async function createRecipe(req, res) {
  try {
    const body = req.body;

    if (!body?.Title || !body?.Category) {
      return res.status(400).json({ message: "Title and Category are required" });
    }

    const newId = await recipeRepository.createRecipe(body);
    const created = await recipeRepository.getRecipeById(newId);

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create recipe", error: err.message });
  }
}

async function updateRecipe(req, res) {
  try {
    const recipeId = toInt(req.params.recipeId);
    if (!recipeId) return res.status(400).json({ message: "Invalid recipeId" });

    const ok = await recipeRepository.updateRecipe(recipeId, req.body);
    if (ok === null) return res.status(404).json({ message: "Recipe not found" });

    const updated = await recipeRepository.getRecipeById(recipeId);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update recipe", error: err.message });
  }
}

async function deleteRecipe(req, res) {
  try {
    const recipeId = toInt(req.params.recipeId);
    if (!recipeId) return res.status(400).json({ message: "Invalid recipeId" });

    const ok = await recipeRepository.deleteRecipe(recipeId);
    if (ok === null) return res.status(404).json({ message: "Recipe not found" });

    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete recipe", error: err.message });
  }
}

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};