import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Recipe } from "../types/recipe";
import { X, Plus } from "lucide-react";

interface RecipeFormModalProps {
  recipe?: Recipe | null;
  open: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

export function RecipeFormModal({
  recipe,
  open,
  onClose,
  onSave,
}: RecipeFormModalProps) {
  const [formData, setFormData] = useState<Partial<Recipe>>({
    title: "",
    description: "",
    image: "",
    prepTime: 0,
    cookTime: 0,
    servings: 0,
    difficulty: "Easy",
    category: "Lunch",
    dietaryTags: [],
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: [""],
    instructions: [""],
  });

  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (recipe) {
      setFormData(recipe);
    } else {
      setFormData({
        title: "",
        description: "",
        image: "",
        prepTime: 0,
        cookTime: 0,
        servings: 0,
        difficulty: "Easy",
        category: "Lunch",
        dietaryTags: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        ingredients: [""],
        instructions: [""],
      });
    }
  }, [recipe, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedIngredients =
      formData.ingredients?.filter((i) => i.trim()) || [];
    const cleanedInstructions =
      formData.instructions?.filter((i) => i.trim()) || [];

    const recipeData: Recipe = {
      id: recipe?.id || Date.now().toString(),
      title: formData.title || "",
      description: formData.description || "",
      image:
        formData.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
      prepTime: formData.prepTime || 0,
      cookTime: formData.cookTime || 0,
      servings: formData.servings || 1,
      difficulty: formData.difficulty || "Easy",
      category: formData.category || "Lunch",
      dietaryTags: formData.dietaryTags || [],
      calories: formData.calories || 0,
      protein: formData.protein || 0,
      carbs: formData.carbs || 0,
      fat: formData.fat || 0,
      ingredients: cleanedIngredients,
      instructions: cleanedInstructions,
    };

    onSave(recipeData);
    onClose();
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...(formData.ingredients || []), ""],
    });
  };

  const removeIngredient = (index: number) => {
    const newIngredients =
      formData.ingredients?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...(formData.ingredients || [])];
    newIngredients[index] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...(formData.instructions || []), ""],
    });
  };

  const removeInstruction = (index: number) => {
    const newInstructions =
      formData.instructions?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, instructions: newInstructions });
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...(formData.instructions || [])];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const addDietaryTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.dietaryTags?.includes(tag)) {
      setFormData({
        ...formData,
        dietaryTags: [...(formData.dietaryTags || []), tag],
      });
      setNewTag("");
    }
  };

  const removeDietaryTag = (tag: string) => {
    setFormData({
      ...formData,
      dietaryTags: formData.dietaryTags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recipe ? "Edit Recipe" : "Create New Recipe"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* BASIC INFO */}
          <div className="space-y-6">

            <div className="space-y-2">
              <Label>Recipe Title *</Label>
              <Input
                className="h-11"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Mediterranean Quinoa Bowl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                className="min-h-[90px]"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the recipe"
              />
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                className="h-11"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          {/* DETAILS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="space-y-2">
              <Label>Prep Time (min)</Label>
              <Input
                className="h-11"
                type="number"
                value={formData.prepTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prepTime: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Cook Time (min)</Label>
              <Input
                className="h-11"
                type="number"
                value={formData.cookTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cookTime: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Servings</Label>
              <Input
                className="h-11"
                type="number"
                value={formData.servings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    servings: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: string) =>
                  setFormData({
                    ...formData,
                    difficulty: value as Recipe["difficulty"],
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: string) =>
                setFormData({ ...formData, category: value as Recipe["category"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
                <SelectItem value="Snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nutrition */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    calories: parseInt(e.target.value),
                  })
                }
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={(formData as any).protein}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    protein: parseFloat(e.target.value),
                  } as any)
                }
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                value={(formData as any).carbs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carbs: parseFloat(e.target.value),
                  } as any)
                }
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                value={(formData as any).fat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fat: parseFloat(e.target.value),
                  } as any)
                }
                min="0"
              />
            </div>
          </div>

          {/* Dietary Tags */}
          <div className="space-y-3">
            <Label>Dietary Tags</Label>

            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag (e.g., Vegetarian, Keto)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDietaryTag();
                  }
                }}
              />
              <Button type="button" onClick={addDietaryTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.dietaryTags?.map((tag) => (
                <span
                  key={tag}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button type="button" onClick={() => removeDietaryTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Ingredients</Label>
              <Button type="button" onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Add Ingredient
              </Button>
            </div>

            <div className="space-y-3">
              {formData.ingredients?.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    placeholder={`Ingredient ${index + 1}`}
                  />
                  <Button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    size="icon"
                    variant="ghost"
                    className="mt-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Instructions</Label>
              <Button type="button" onClick={addInstruction} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </Button>
            </div>

            <div className="space-y-3">
              {formData.instructions?.map((instruction, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-8 h-10 bg-green-100 rounded flex items-center justify-center text-sm text-green-700 mt-1">
                    {index + 1}
                  </div>
                  <Textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    size="icon"
                    variant="ghost"
                    className="mt-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {recipe ? "Update Recipe" : "Create Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}