import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Recipe } from "../types/recipe";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Heart } from "lucide-react";
import { RecipeCard } from "../components/RecipeCard";
import { toast } from "sonner";
import {
  fetchAllRecipes,
  fetchFavorites,
  addFavorite,
  removeFavorite,
} from "../services/recipeService";

interface RecipesPageProps {
  onRecipeClick: (recipe: Recipe) => void;
selectingFor?: { mealType: string; date: string } | null;
  onNavigate?: (page: string) => void;
  onRecipeSelect?: (recipe: Recipe) => void;
}

export function RecipesPage({
  onRecipeClick,
  selectingFor,
  onNavigate,
  onRecipeSelect,
}: RecipesPageProps) {
  const { isAuthenticated } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recipesError, setRecipesError] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDiet, setSelectedDiet] = useState<string>("All");
  const [showFavorites, setShowFavorites] = useState(false);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRecipes() {
      try {
        setLoadingRecipes(true);
        setRecipesError("");
        const list = await fetchAllRecipes();
        if (mounted) setRecipes(list as any);
      } catch (err: any) {
        if (mounted) setRecipesError(err.message || "Failed to load recipes");
      } finally {
        if (mounted) setLoadingRecipes(false);
      }
    }

    loadRecipes();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadFavs() {
      if (!isAuthenticated) {
        setFavorites([]);
        return;
      }
      try {
        setLoadingFavorites(true);
        const favIds = await fetchFavorites();
        if (mounted) setFavorites(favIds);
      } catch {
      } finally {
        if (mounted) setLoadingFavorites(false);
      }
    }

    loadFavs();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const toggleFavorite = async (recipe: Recipe) => {
    if (!isAuthenticated) return;

    const isFav = favorites.includes(recipe.id);

    const next = isFav
      ? favorites.filter((id) => id !== recipe.id)
      : [...favorites, recipe.id];

    setFavorites(next);

    try {
      if (isFav) await removeFavorite(recipe.id);
      else await addFavorite(recipe.id);
    } catch (err) {
      setFavorites(favorites);
      console.error(err);
    }
  };

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snack"];
  const diets = [
  "All",
  "Omnivore",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
];

  const filteredRecipes = recipes.filter((recipe: any) => {
  const title = recipe.title || recipe.Title || "";
  const description = recipe.description || recipe.Description || "";
  const category = recipe.category || recipe.Category || "";
  const recipeId = recipe.id || recipe.RecipeId;

  const matchesSearch =
    title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    description.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesCategory =
    selectedCategory === "All" || category === selectedCategory;

  const rawTags =
    recipe.Tags ||
    recipe.tags ||
    (Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags.join(",") : "");

  const tags = String(rawTags)
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const selectedDietLower = selectedDiet.toLowerCase();

  const matchesDiet =
    selectedDietLower === "all"
      ? true
      : selectedDietLower === "omnivore"
      ? !tags.includes("vegan") &&
        !tags.includes("vegetarian") &&
        !tags.includes("pescatarian")
      : tags.includes(selectedDietLower);

  const matchesFavorites =
    !showFavorites || favorites.includes(recipeId);

  return matchesSearch && matchesCategory && matchesDiet && matchesFavorites;
});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        {selectingFor ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">
              <strong>Selecting {selectingFor.mealType}</strong> for{" "}
              {new Date(selectingFor.date).toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
})}
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-4xl text-gray-900 mb-2">Discover Recipes</h1>
            <p className="text-xl text-gray-600">
              Browse our collection of healthy and delicious recipes
            </p>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {isAuthenticated && (
            <Button
              variant={showFavorites ? "default" : "outline"}
              onClick={() => setShowFavorites(!showFavorites)}
              className={
                showFavorites
                  ? "bg-green-600 hover:bg-green-700"
                  : "hover:border-green-600 hover:text-green-600"
              }
              disabled={loadingFavorites}
            >
              <Heart
                className={`w-5 h-5 mr-2 ${showFavorites ? "fill-white" : ""}`}
              />
              Favorites
            </Button>
          )}
        </div>

        <div className="mb-8 space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-green-600 hover:bg-green-700"
                      : "hover:border-green-600 hover:text-green-600"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">Dietary Preferences</p>
            <div className="flex flex-wrap gap-2">
              {diets.map((diet) => (
                <Button
                  key={diet}
                  variant={selectedDiet === diet ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDiet(diet)}
                  className={
                    selectedDiet === diet
                      ? "bg-green-600 hover:bg-green-700"
                      : "hover:border-green-600 hover:text-green-600"
                  }
                >
                  {diet}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {loadingRecipes && <p className="text-gray-600 mb-6">Loading recipes...</p>}

        {!loadingRecipes && recipesError && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {recipesError}
          </div>
        )}

        {!loadingRecipes && !recipesError && (
          <p className="text-gray-600 mb-6">
            Showing {filteredRecipes.length} recipe
            {filteredRecipes.length !== 1 ? "s" : ""}
            {showFavorites && " in favorites"}
          </p>
        )}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={selectingFor ? async (r) => {
  try { await onRecipeSelect?.(r); }
  catch (e:any) { toast.error(e?.message || "Failed"); }
} : undefined}
              selectMode={!!selectingFor}
              isFavorite={favorites.includes(recipe.id)}
              onToggleFavorite={isAuthenticated ? toggleFavorite : undefined}
              onClick={onRecipeClick}
            />
          ))}
        </div>

        {!loadingRecipes && !recipesError && filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {showFavorites
                ? "No favorite recipes yet. Heart recipes to add them to your favorites!"
                : "No recipes found matching your filters."}
            </p>
            <Button
              className="mt-4 bg-green-600 hover:bg-green-700"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedDiet("All");
                setShowFavorites(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}