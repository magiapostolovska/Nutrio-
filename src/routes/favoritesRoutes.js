const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getFavorites,
  createFavorites,
  deleteFavorites,
} = require("../controllers/favoritesController");

router.get("/", authenticateToken, getFavorites);
router.post("/:recipeId", authenticateToken, createFavorites);
router.delete("/:recipeId", authenticateToken, deleteFavorites);

module.exports = router;