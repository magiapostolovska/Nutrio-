import { useEffect, useState } from "react";
import { Recipe } from "../types/recipe";
import { RecipeCard } from "../components/RecipeCard";
import { RecipeFormModal } from "../components/RecipeFormModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
AlertDialogCancel,
AlertDialogAction} from "../components/ui/alert-dialog";

import {
  fetchAllRecipes,
  createRecipe as createRecipeAPI,
  updateRecipe as updateRecipeAPI,
  deleteRecipe as deleteRecipeAPI,
} from "../services/recipeService";

interface AdminRecipesPageProps {
  onRecipeClick: (recipe: Recipe) => void;
}

function toCreateUpdatePayload(ui: Recipe) {
  const ingredients = Array.isArray(ui.ingredients) ? ui.ingredients.filter((x) => x.trim()) : [];

  const instructionsArray = Array.isArray(ui.instructions)
    ? ui.instructions.filter((x) => x.trim())
    : [];

  return {
    Title: ui.title,
    Category: ui.category,
    Description: ui.description,
    ImageUrl: ui.image,
    Tags: Array.isArray(ui.dietaryTags) ? ui.dietaryTags.join(",") : "",

    PrepMinutes: Number(ui.prepTime ?? 0),
    CookMinutes: Number(ui.cookTime ?? 0),
    Servings: Number(ui.servings ?? 1),
    Difficulty: ui.difficulty,

    Calories: Number(ui.calories ?? 0),
    ProteinG: Number((ui as any).protein ?? 0),
    CarbsG: Number((ui as any).carbs ?? 0),
    FatG: Number((ui as any).fat ?? 0),

    ingredients,
    instructions: instructionsArray.map((stepText) => ({ stepText })),
  };
}

export function AdminRecipesPage({ onRecipeClick }: AdminRecipesPageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteRecipe, setDeleteRecipe] = useState<Recipe | null>(null);

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snack"];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const list = await fetchAllRecipes();
        if (mounted) setRecipes(list as any);
      } catch (err: any) {
        toast.error(err.message || "Failed to load recipes");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || recipe.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSaveRecipe = async (uiRecipe: Recipe) => {
    try {
      const payload = toCreateUpdatePayload(uiRecipe);

      if (editingRecipe?.id) {
const updated = await updateRecipeAPI(String(editingRecipe.id), payload as any);
        setRecipes((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
        toast.success("Recipe updated successfully");
      } else {
        const created = await createRecipeAPI(payload as any);
        setRecipes((prev) => [created, ...prev]);
        toast.success("Recipe created successfully");
      }

      setEditingRecipe(null);
      setIsFormModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save recipe");
    }
  };

  const handleEditRecipe = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRecipe(recipe);
    setIsFormModalOpen(true);
  };

  const handleDeleteRecipe = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteRecipe(recipe);
  };

  const confirmDelete = async () => {
    if (!deleteRecipe) return;

    try {
      await deleteRecipeAPI(String(deleteRecipe.id));
      setRecipes((prev) => prev.filter((r) => r.id !== deleteRecipe.id));
      toast.success("Recipe deleted successfully");
      setDeleteRecipe(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete recipe");
    }
  };

  const handleCreateNew = () => {
    setEditingRecipe(null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl text-gray-900 mb-2">Recipe Management</h1>
            <p className="text-xl text-gray-600">
              Create, edit, and manage all recipes
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Recipe
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

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
        </div>

        {loading && <p className="text-gray-600 mb-6">Loading recipes...</p>}

        {!loading && (
          <p className="text-gray-600 mb-6">
            Showing {filteredRecipes.length} recipe
            {filteredRecipes.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Recipe Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="relative group">
              <RecipeCard recipe={recipe} onClick={onRecipeClick} />
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  className="bg-white hover:bg-gray-100 text-gray-700 shadow-lg"
                  onClick={(e) => handleEditRecipe(recipe, e)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  className="bg-white hover:bg-red-50 text-red-600 shadow-lg"
                  onClick={(e) => handleDeleteRecipe(recipe, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No recipes found matching your filters.
            </p>
            <Button
              className="mt-4 bg-green-600 hover:bg-green-700"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Recipe Form Modal */}
      <RecipeFormModal
        recipe={editingRecipe}
        open={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRecipe(null);
        }}
        onSave={handleSaveRecipe}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteRecipe}
        onOpenChange={(open: boolean) => !open && setDeleteRecipe(null)}
      >
        <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteRecipe?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>

  <AlertDialogCancel
    onClick={() => setDeleteRecipe(null)}
  >
    Cancel
  </AlertDialogCancel>

  <AlertDialogAction
    className="bg-green-600 hover:bg-green-700 text-white"
    onClick={confirmDelete}
  >
    Delete
  </AlertDialogAction>

</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}