const favoritesRepository = require("../repositories/favoritesRepository");

function toInt(val) {
  const n = Number(val);
  return Number.isInteger(n) ? n : null;
}

async function getFavorites(req, res) {
  try {
    const userId = req.user?.userId; 
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const favorites = await favoritesRepository.getFavoritesByUserId(userId);
    res.json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load favorites", error: err.message });
  }
}

async function createFavorites(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const recipeId = toInt(req.params.recipeId);
    if (!recipeId) return res.status(400).json({ message: "Invalid recipeId" });

    const result = await favoritesRepository.createFavorite(userId, recipeId);
    if (result === null) return res.status(404).json({ message: "Recipe not found" });

    return res.status(201).json({ message: result.created ? "Added to favorites" : "Already in favorites" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create favorite", error: err.message });
  }
}

async function deleteFavorites(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const recipeId = toInt(req.params.recipeId);
    if (!recipeId) return res.status(400).json({ message: "Invalid recipeId" });

    const ok = await favoritesRepository.deleteFavorite(userId, recipeId);
    if (!ok) return res.status(404).json({ message: "Favorite not found" });

    res.json({ message: "Removed from favorites" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete favorite", error: err.message });
  }
}

module.exports = {
  getFavorites,
  createFavorites,
  deleteFavorites,
};