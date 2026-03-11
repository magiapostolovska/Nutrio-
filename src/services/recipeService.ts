const API_BASE = "http://localhost:5000";

function splitTags(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function mapRecipe(r: any) {
  return {
    id: r.RecipeId?.toString() || "",
    title: r.Title || "",
    description: r.Description || "",
    image: r.ImageUrl || "",
    category: r.Category || "",

    dietaryTags: splitTags(r.Tags), 

    prepTime: Number(r.PrepMinutes ?? 0),
cookTime: Number(r.CookMinutes ?? 0),

    servings: Number(r.Servings ?? 0),
    difficulty: r.Difficulty || "—",
    calories: Number(r.Calories ?? 0),

    protein: Number(r.ProteinG ?? 0),
    carbs: Number(r.CarbsG ?? 0),
    fat: Number(r.FatG ?? 0),

    ingredients: Array.isArray(r.RecipeIngredients)
      ? r.RecipeIngredients.map((x: any) => x.LineText).filter(Boolean)
      : [],

    instructions: Array.isArray(r.RecipeInstructions)
      ? r.RecipeInstructions
          .sort((a: any, b: any) => Number(a.StepNumber ?? 0) - Number(b.StepNumber ?? 0))
          .map((x: any) => x.StepText)
          .filter(Boolean)
      : [],
  };
}

export async function fetchAllRecipes() {
  const res = await fetch(`${API_BASE}/recipes`);

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to fetch recipes");
  }

  const recipes = await res.json();
console.log("RAW /recipes:", recipes);
  return (recipes || []).map(mapRecipe);
}

export async function fetchRecipeById(recipeId: string) {
  const res = await fetch(`${API_BASE}/recipes/${recipeId}`);

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to fetch recipe");
  }

  const r = await res.json();
  return mapRecipe(r);
}

export async function createRecipe(data: {
  Title: string;
  Category: string;
  Description?: string;
  ImageUrl?: string;
  Tags?: string;
  PrepMinutes?: number;
  CookMinutes?: number;
  Servings?: number;
  Difficulty?: string;
  Calories?: number;
  ProteinG?: number;
  CarbsG?: number;
  FatG?: number;

  ingredients?: string[];
  instructions?: { stepText: string }[];
}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data), 
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create recipe");
  }

  const r = await res.json();
  return mapRecipe(r);
}

export async function updateRecipe(
  recipeId: string,
  data: Partial<{
    Title: string;
    Category: string;
    Description: string;
    ImageUrl: string;
    Tags: string;
    PrepMinutes: number;
    CookMinutes: number;
    Servings: number;
    Difficulty: string;
    Calories: number;
    ProteinG: number;
    CarbsG: number;
    FatG: number;

    ingredients: string[];
    instructions: { stepText: string }[];
  }>
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/recipes/${recipeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update recipe");
  }

  const r = await res.json();
  return mapRecipe(r);
}

export async function deleteRecipe(recipeId: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/recipes/${recipeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete recipe");
  }

  return await res.json();
}


export async function fetchFavorites() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to fetch favorites");
  }

  const favs = await res.json();

  if (Array.isArray(favs) && typeof favs[0] === "number") {
    return favs.map((x: number) => String(x));
  }

  return (favs || [])
    .map((f: any) => (f.RecipeId ?? f.recipeId ?? f.id)?.toString?.() || "")
    .filter(Boolean);
}

export async function addFavorite(recipeId: number) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/favorites/${recipeId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to add favorite");
  }

  return await res.json();
}

export async function removeFavorite(recipeId: number) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/favorites/${recipeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to remove favorite");
  }

  return await res.json();
}