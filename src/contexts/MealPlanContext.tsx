// src/contexts/MealPlanContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Recipe } from "../types/recipe";
import { useAuth } from "./AuthContext";
import {
  createMealPlanItem,
  deleteMealPlanItem,
  fetchHasMealPlan,
  fetchMealPlanRange,
  fetchMealsByDay,
  generateMealPlan,
  updateMealEatenStatus,
  MealType,
} from "../services/mealPlanService";

interface DayMeals {
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
  snack: Recipe | null;
  eaten?: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
    snack?: boolean;
  };
  itemIds?: {
    breakfast?: number;
    lunch?: number;
    dinner?: number;
    snack?: number;
  };
}

interface MealPlanState {
  mealPlan: Record<string, DayMeals>;
  hasPlan: boolean;

  addMealToPlan: (date: string, mealType: string, recipe: Recipe) => Promise<void>;
  deleteMealFromPlan: (date: string, mealType: string) => Promise<void>;
  markMealAsEaten: (date: string, mealType: "breakfast" | "lunch" | "dinner" | "snack") => Promise<void>;
  generateMonthlyPlan: (preferences: any, startDate: Date) => Promise<void>;
  clearPlan: () => void;

  loadMonth: (forDate: Date) => Promise<void>;

  nutritionByDay: Record<string, any>;
}

const MealPlanContext = createContext<MealPlanState | undefined>(undefined);

const allowedMealTypes = new Set<MealType>(["breakfast", "lunch", "dinner", "snack"]);

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function parseISODateLocal(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function monthRange(forDate: Date) {
  const y = forDate.getFullYear();
  const m = forDate.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { from: toISO(from), to: toISO(to) };
}

function mapBackendRecipe(x: any): Recipe | null {
  if (!x) return null;

  return {
    id: Number(x.id ?? x.RecipeId),
    title: x.title ?? x.Title ?? "",
    description: x.description ?? x.Description ?? "",
    image: x.image ?? x.ImageUrl ?? "",
    prepTime: Number(x.prepTime ?? x.PrepMinutes ?? 0),
    cookTime: Number(x.cookTime ?? x.CookMinutes ?? 0),
    servings: Number(x.servings ?? x.Servings ?? 1),
    difficulty: x.difficulty ?? x.Difficulty ?? "Easy",
    category: (x.category ?? x.Category ?? "Lunch") as any,
    dietaryTags: x.dietaryTags ?? (x.Tags ? x.Tags.split(",") : []),

    calories: Number(x.calories ?? x.Calories ?? 0),
    protein: Number(x.protein ?? x.ProteinG ?? 0),
    carbs: Number(x.carbs ?? x.CarbsG ?? 0),
    fat: Number(x.fat ?? x.FatG ?? 0),

    ingredients: x.ingredients ?? [],
    instructions: x.instructions ?? [],
  };
}

function buildDayMeals(dayGrouped: any): DayMeals {
  const out: DayMeals = {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
    eaten: {},
    itemIds: {},
  };

  if (!dayGrouped) return out;

  if (Array.isArray(dayGrouped)) {
    for (const it of dayGrouped) {
      const mt = String(it.MealType ?? it.mealType ?? "").toLowerCase() as MealType;
      if (!allowedMealTypes.has(mt)) continue;

      (out as any)[mt] = mapBackendRecipe(it);

      const eaten = it.IsEaten ?? it.isEaten;
      if (typeof eaten === "boolean") (out.eaten as any)[mt] = eaten;

      const id = it.MealPlanItemId ?? it.mealPlanItemId ?? it.id;
      if (id != null) (out.itemIds as any)[mt] = Number(id);
    }
    return out;
  }

  for (const mt of ["breakfast", "lunch", "dinner", "snack"] as MealType[]) {
    const it = dayGrouped[mt] ?? dayGrouped?.meals?.[mt];
    if (it) (out as any)[mt] = mapBackendRecipe(it);

    const id = it?.MealPlanItemId ?? it?.mealPlanItemId ?? it?.id;
    if (id != null) (out.itemIds as any)[mt] = Number(id);

    const eaten = it?.IsEaten ?? it?.isEaten;
    if (typeof eaten === "boolean") (out.eaten as any)[mt] = eaten;
  }

  if (dayGrouped.eaten) out.eaten = { ...out.eaten, ...dayGrouped.eaten };
if (dayGrouped.itemIds) out.itemIds = { ...out.itemIds, ...dayGrouped.itemIds };
  return out;
}

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mealPlan, setMealPlan] = useState<Record<string, DayMeals>>({});
  const [hasPlan, setHasPlan] = useState(false);
  const [nutritionByDay, setNutritionByDay] = useState<Record<string, any>>({});

  const loadDay = async (dateStr: string): Promise<DayMeals> => {
    const res = await fetchMealsByDay(dateStr);
    const dayMeals = buildDayMeals(res.day);

    setMealPlan((prev) => {
      const merged = { ...prev, [dateStr]: dayMeals };
      setHasPlan(Object.keys(merged).length > 0);
      return merged;
    });

    if (res.nutrition) setNutritionByDay((prev) => ({ ...prev, [dateStr]: res.nutrition }));

    return dayMeals;
  };

  const loadMonth = async (forDate: Date) => {
    if (!user) return;

    const { from, to } = monthRange(forDate);

    const res = await fetchMealPlanRange(from, to);
    const mp = res.mealPlan ?? {};

    const next: Record<string, DayMeals> = {};
    for (const key of Object.keys(mp)) {
      next[key] = buildDayMeals(mp[key]);
    }

    setMealPlan((prev) => {
      const keep: Record<string, DayMeals> = {};
      const fromD = parseISODateLocal(from);
      const toD = parseISODateLocal(to);

      for (const k of Object.keys(prev)) {
        const d = parseISODateLocal(k);
        if (d < fromD || d > toD) keep[k] = prev[k];
      }

      const merged = { ...keep, ...next };
      setHasPlan(Object.keys(merged).length > 0);
      return merged;
    });
  };

  useEffect(() => {
    if (!user) {
      setMealPlan({});
      setHasPlan(false);
      setNutritionByDay({});
      return;
    }

    (async () => {
      try {
        const r = await fetchHasMealPlan();
        setHasPlan(r.hasMealPlan);
      } catch {
        setHasPlan(false);
      }
    })();

    loadMonth(new Date());
  }, [user?.id]);

  const addMealToPlan = async (dateStr: string, mealType: string, recipe: Recipe) => {
  if (!user) return;

  const mt = String(mealType).toLowerCase() as MealType;
  if (!allowedMealTypes.has(mt)) throw new Error("Invalid mealType");

  const recipeId = Number(
    (recipe as any).recipeId ??
    (recipe as any).RecipeId ??
    (recipe as any).id
  );

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    throw new Error("Invalid recipe id");
  }

  await createMealPlanItem({
    planDate: dateStr,
    mealType: mt,
    recipeId,

    profile: {
      Sex: user.gender,
      HeightCm: Number(user.height),
      CurrentWeightKg: Number(user.currentWeight ?? user.weight),
      GoalWeightKg: Number(user.goalWeight),
      Goal: user.goal,
      ActivityLevel: user.activityLevel,
      DietType: user.dietType
    }
  });

  await loadDay(dateStr);
};

  const deleteMealFromPlan = async (dateStr: string, mealType: string) => {
    if (!user) return;

    const mt = String(mealType).toLowerCase() as MealType;
    if (!allowedMealTypes.has(mt)) throw new Error("Invalid mealType");

    let id = mealPlan?.[dateStr]?.itemIds?.[mt];

    if (!id) {
      const fresh = await loadDay(dateStr);
      id = fresh?.itemIds?.[mt];
    }

    if (!id) {
      setMealPlan((prev) => ({
        ...prev,
        [dateStr]: { ...(prev[dateStr] || ({} as any)), [mt]: null },
      }));
      return;
    }

    await deleteMealPlanItem(id);
    await loadDay(dateStr);
  };

  const markMealAsEaten = async (dateStr: string, mealType: MealType) => {
    if (!user) return;

    let id = mealPlan?.[dateStr]?.itemIds?.[mealType];
    let current = !!mealPlan?.[dateStr]?.eaten?.[mealType];

    if (!id) {
      const fresh = await loadDay(dateStr);
      id = fresh?.itemIds?.[mealType];
      current = !!fresh?.eaten?.[mealType];
    }

    if (!id) throw new Error("MealPlanItemId not found for that slot");

    await updateMealEatenStatus(id, !current);
    await loadDay(dateStr);
  };

  const generateMonthlyPlan = async (preferences: any, startDate: Date) => {
    if (!user) return;

    await generateMealPlan({
      startDate: toISO(startDate),
      days: 30,
      ...preferences,
    });

    await loadMonth(startDate);
    await loadDay(toISO(startDate));
  };

  const clearPlan = () => {
    setMealPlan({});
    setHasPlan(false);
    setNutritionByDay({});
  };

  return (
    <MealPlanContext.Provider
      value={{
        mealPlan,
        hasPlan,
        addMealToPlan,
        deleteMealFromPlan,
        markMealAsEaten,
        generateMonthlyPlan,
        clearPlan,
        loadMonth, 
        nutritionByDay,
      }}
    >
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error("useMealPlan must be used inside MealPlanProvider");
  return ctx;
}