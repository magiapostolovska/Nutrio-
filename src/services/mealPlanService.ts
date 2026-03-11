const API_BASE = "http://localhost:5000";

function getTokenOrThrow() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");
  return token;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export async function fetchMealPlanRange(from: string, to: string) {
  const token = getTokenOrThrow();
  const params = new URLSearchParams({ from, to });

  const res = await fetch(`${API_BASE}/mealplan?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.message || "Failed to fetch meal plan");
  return data;
}

export async function fetchMealsByDay(date: string) {
  const token = getTokenOrThrow();

  const res = await fetch(`${API_BASE}/mealplan/day/${encodeURIComponent(date)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.message || "Failed to fetch day meals");
  return data; 
}

export async function createMealPlanItem(payload: {
  planDate: string;
  mealType: MealType;
  recipeId: number | null;
  profile?: {
    Age?: number;
    Sex?: string;
    HeightCm?: number;
    CurrentWeightKg?: number;
    GoalWeightKg?: number;
    Goal?: string;
    ActivityLevel?: string;
    DietType?: string;
  };
  [key: string]: any;
}) {
  const token = getTokenOrThrow();

  const { profile, ...rest } = payload;

  const body = {
    ...(profile || {}),
    ...rest,
  };

  const res = await fetch(`${API_BASE}/mealplan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.message || "Failed to create meal plan item");
  return data;
}

export async function generateMealPlan(payload: {
  startDate: string;
  days?: number;
  profile?: {
    Age?: number;
    Sex?: string;
    HeightCm?: number;
    CurrentWeightKg?: number;
    GoalWeightKg?: number;
    Goal?: string;
    ActivityLevel?: string;
    DietType?: string;
  };
  [key: string]: any;
}) {
  const token = getTokenOrThrow();

  const { profile, ...rest } = payload;

  const body = {
    ...(profile || {}),
    ...rest,
  };

  const res = await fetch(`${API_BASE}/mealplan/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.message || "Failed to generate meal plan");
  return data;
}

export async function updateMealEatenStatus(mealPlanItemId: number, isEaten: boolean) {
  const token = getTokenOrThrow();

  const res = await fetch(`${API_BASE}/mealplan/${mealPlanItemId}/eaten`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ isEaten }),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.message || "Failed to update meal status");
  return data;
}

export async function deleteMealPlanItem(mealPlanItemId: number) {
  const token = getTokenOrThrow();

  const res = await fetch(`${API_BASE}/mealplan/${mealPlanItemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.message || "Failed to delete meal plan item");
  return data;
}

export async function fetchHasMealPlan(): Promise<{ hasMealPlan: boolean }> {
  const token = getTokenOrThrow();

  const res = await fetch(`${API_BASE}/mealplan/has-meal-plan`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.message || "Failed to check meal plan");
  return { hasMealPlan: !!data.hasMealPlan };
}