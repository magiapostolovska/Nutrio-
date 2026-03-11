import { useState, useEffect } from "react";
import { Recipe } from "../types/recipe";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Clock, Users, Flame, Apple, ChefHat, Heart, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export function RecipeDetailModal({
  recipe,
  open,
  onClose,
  onNavigate,
}: RecipeDetailModalProps) {
  const { isAuthenticated, user, updateUserProfile } = useAuth();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  useEffect(() => {
    if (user?.favoriteRecipes) setFavorites(user.favoriteRecipes);
  }, [user]);

  const canShowRecipe = !!recipe;
  const isFavorite = recipe ? favorites.includes(recipe.id) : false;

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      onClose(); 
      setTimeout(() => setShowLoginAlert(true), 0); 
      return;
    }

    if (!recipe) return;

    const newFavorites = isFavorite
      ? favorites.filter((id) => id !== recipe.id)
      : [...favorites, recipe.id];

    setFavorites(newFavorites);

    if (user) {
      updateUserProfile({ favoriteRecipes: newFavorites });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      {canShowRecipe && (
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setShowLoginAlert(false); 
              onClose();
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <style>
              {`
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #059669; }
              `}
            </style>

            <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Hero Image */}
              <div className="relative h-80 overflow-hidden">
                <ImageWithFallback
                  src={recipe!.image}
                  alt={recipe!.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <button
                  onClick={() => {
                    setShowLoginAlert(false);
                    onClose();
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg transition-all hover:bg-white group"
                >
                  <X className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
                </button>

                <div className="absolute bottom-6 left-6 right-6">
                  <DialogHeader>
                    <DialogTitle className="text-3xl text-white mb-2">
                      {recipe!.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="flex items-center justify-between">
                    <p className="text-white/90 text-lg">{recipe!.description}</p>

                    <button
                      onClick={toggleFavorite}
                      className="ml-4 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0"
                      aria-label="Toggle favorite"
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          isFavorite
                            ? "fill-green-600 text-green-600"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Prep Time</p>
                      <p className="font-semibold text-gray-900">
                        {recipe!.prepTime} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Cook Time</p>
                      <p className="font-semibold text-gray-900">
                        {recipe!.cookTime} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Servings</p>
                      <p className="font-semibold text-gray-900">
                        {recipe!.servings}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                      <Badge className={getDifficultyColor(recipe!.difficulty)}>
                        {recipe!.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Nutrition Info */}
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-green-600" />
                    Nutrition Information
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Calories</p>
                      <p className="text-2xl text-gray-900">{recipe!.calories}</p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Protein</p>
                      <p className="text-2xl text-gray-900">{recipe!.protein}g</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Carbs</p>
                      <p className="text-2xl text-gray-900">{recipe!.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fat</p>
                      <p className="text-2xl text-gray-900">{recipe!.fat}g</p>
                    </div>
                  </div>
                </div>

                {/* Dietary Tags */}
                <div>
                  <h3 className="text-lg text-gray-900 mb-3">Dietary Information</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe!.dietaryTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ingredients & Instructions Tabs */}
                <Tabs defaultValue="ingredients" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="ingredients"
                      className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                      <Apple className="w-4 h-4 mr-2" />
                      Ingredients
                    </TabsTrigger>

                    <TabsTrigger
                      value="instructions"
                      className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Instructions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ingredients" className="mt-6">
                    <ul className="space-y-3">
                      {recipe!.ingredients.map((ingredient, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-gray-700 p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-green-600 mt-1">•</span>
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="instructions" className="mt-6">
                    <ol className="space-y-4">
                      {recipe!.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                          <p className="text-gray-700 pt-1">{instruction}</p>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to save favorite recipes. Would you like to login now?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border">Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowLoginAlert(false);
                // ✅ navigate AFTER Radix cleanup
                setTimeout(() => onNavigate?.("login"), 0);
              }}
            >
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}