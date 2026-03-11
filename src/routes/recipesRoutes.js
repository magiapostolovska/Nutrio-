const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require("../controllers/recipesController");


router.get("/", getAllRecipes);
router.get("/:recipeId", getRecipeById);
router.post("/", authenticateToken, createRecipe);
router.put("/:recipeId", authenticateToken, updateRecipe);
router.delete("/:recipeId", authenticateToken, deleteRecipe);

module.exports = router;