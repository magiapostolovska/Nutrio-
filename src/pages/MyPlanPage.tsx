import { useState, useEffect } from 'react';
import { useMealPlan } from '../contexts/MealPlanContext';
import { fetchUserProfile, updateUserProfile } from '../services/profileService';
import { fetchMealsByDay } from '../services/mealPlanService';

import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel
} from '../components/ui/alert-dialog';

import { ImageWithFallback } from '../components/figma/ImageWithFallback';

import {
  CalendarIcon,
  Flame,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Edit,
  Info,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Trash2,
} from 'lucide-react';

import { Recipe } from '../types/recipe';
import { toast } from 'sonner';
function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
interface MyPlanPageProps {
  onNavigate: (page: string, params?: any) => void;
  onRecipeClick: (recipe: Recipe) => void;
}

export function MyPlanPage({ onNavigate, onRecipeClick }: MyPlanPageProps) {

  const { mealPlan, markMealAsEaten, loadMonth, deleteMealFromPlan, hasPlan } = useMealPlan();

  const [nutrition, setNutrition] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newWeight, setNewWeight] = useState('');
  const [showWeightDialog, setShowWeightDialog] = useState(false);

  const [deletingMeal, setDeletingMeal] =
    useState<{ date: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchUserProfile();
        setUser(data);
      } catch (err) {
        console.error("Failed to load user", err);
      }
    }
    loadUser();
  }, []);


  useEffect(() => {
  async function loadDayData() {
    try {
      const date = formatLocalDate(selectedDate);

      const data = await fetchMealsByDay(date);
      setNutrition(data.nutrition);

    } catch (err) {
      console.error("Failed to load day data", err);
    }
  }

  loadDayData();
}, [selectedDate]);

const dateKey = (date: Date) => formatLocalDate(date);
  const getMealsForDate = (date: Date) =>
    mealPlan[dateKey(date)] || null;

  const selectedDayMeals = getMealsForDate(selectedDate);
const hasMealsForSelectedDay =
  selectedDayMeals &&
  (selectedDayMeals.breakfast ||
   selectedDayMeals.lunch ||
   selectedDayMeals.dinner ||
   selectedDayMeals.snack);
  const shouldShowWeighInForDate = (clicked: Date) =>
    clicked.getDay() === 0;

  const handleWeightUpdate = async () => {
    try {
      if (!user?.id) {
        toast.error("User not loaded.");
        return;
      }

      const updated = await updateUserProfile(user.id, {
        CurrentWeightKg: Number(newWeight),
      });

      const nextUser = {
        ...user,
        ...updated,
        weight: updated.CurrentWeightKg ?? user.weight,
      };

      setUser(nextUser);

      setNewWeight("");
      setShowWeightDialog(false);

      toast.success("Weight updated!");

    } catch (err: any) {
      toast.error(err.message || "Failed to update weight");
    }
  };

  const calculateDailyCalories = () => {
    if (!selectedDayMeals) return 0;

    return (
      (selectedDayMeals.breakfast?.calories || 0) +
      (selectedDayMeals.lunch?.calories || 0) +
      (selectedDayMeals.dinner?.calories || 0) +
      (selectedDayMeals.snack?.calories || 0)
    );
  };

  const calculateProgress = () => {
    if (!user) return 0;

    const startWeight = Number(user.currentWeight);
    const currentWeight = Number(user.weight);
    const goalWeight = Number(user.goalWeight);

    const totalChange = startWeight - goalWeight;
    if (totalChange === 0) return 0;

    const changeSoFar = startWeight - currentWeight;

    const progress = (changeSoFar / totalChange) * 100;

    return Math.max(0, Math.min(100, progress));
  };

  const toggleMealEaten = async (
    meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => {
    try {
      const date = dateKey(selectedDate);
      await markMealAsEaten(date, meal);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update meal status");
    }
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: Sunrise },
    { key: 'lunch', label: 'Lunch', icon: Sun },
    { key: 'dinner', label: 'Dinner', icon: Moon },
    { key: 'snack', label: 'Snack', icon: Apple },
  ] as const;

  if (!user) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <p className="text-blue-900">
            Click a day to view your plan. Generate plans per month if missing.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <Card>
              <CardContent className="p-6">

                <h2 className="text-2xl flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-6 h-6 text-green-600" />
                  Meal Plan Calendar
                </h2>

                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
  if (!d) return;
  setSelectedDate(d);

  if (shouldShowWeighInForDate(d))
    setShowWeightDialog(true);
}}
                    weekStartsOn={1}
                  />
                </div>

              </CardContent>
            </Card>

            {hasMealsForSelectedDay ? (
              <Card>
                <CardContent className="p-6">

                  <div className="flex justify-between mb-6">

                    <h3 className="text-2xl">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>

                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold">
                        {calculateDailyCalories()} cal
                      </span>
                    </div>

                  </div>

                  <div className="space-y-4">

                    {mealTypes.map(({ key, label, icon: Icon }) => {

                      const meal = selectedDayMeals[key];
                      const eaten = selectedDayMeals.eaten?.[key];

                      if (!meal) {
                        return (
                          <div
                            key={key}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
                          >
                            <p className="text-gray-500">
                              No {label.toLowerCase()} planned
                            </p>

                            <Button
                              size="sm"
                              className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() =>
                                onNavigate('recipes', {
                                  selectingFor: {
                                    mealType: key,
                                    date: formatLocalDate(selectedDate),
                                    mode: 'edit',
                                  },
                                  editMode: true,
                                })
                              }
                            >
                              Add {label}
                            </Button>
                          </div>
                        );
                      }

                      return (

                        <div
                          key={key}
                          className="relative border rounded-lg p-4 flex gap-4"
                        >

                          <div className="absolute top-3 right-3 flex gap-2">

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                onNavigate('recipes', {
                                  selectingFor: {
                                    mealType: key,
                                    date: formatLocalDate(selectedDate),
                                    mode: 'edit',
                                  },
                                  editMode: true,
                                })
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setDeletingMeal({
                                  date: formatLocalDate(selectedDate),
                                  mealType: key,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>

                          </div>

                          <div
                            className="w-24 h-24 cursor-pointer"
                            onClick={() => onRecipeClick(meal)}
                          >
                            <ImageWithFallback
                              src={meal.image}
                              alt={meal.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>

                          <div className="flex-1">

                            <p className="text-sm flex items-center gap-1">
                              <Icon className="w-4 h-4 text-green-600" />
                              {label}
                            </p>

                            <h4
                              className="text-lg cursor-pointer hover:text-green-600"
                              onClick={() => onRecipeClick(meal)}
                            >
                              {meal.title}
                            </h4>

                            <Button
  size="sm"
  variant="outline"
  onClick={() => toggleMealEaten(key)}
  className={
    eaten
      ? "bg-green-600 hover:bg-green-700 text-white border-0"
      : "border-green-600 text-green-600 hover:bg-green-50"
  }
>
  {eaten ? "✓ Eaten" : "Mark as Eaten"}
</Button>

                          </div>

                        </div>

                      );

                    })}

                  </div>

                </CardContent>
              </Card>
            ) : (
              <Card>
  <CardContent className="p-12 text-center">
    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />

    <h3 className="text-xl text-gray-900 mb-2">
      No Plan for This Day
    </h3>

    <p className="text-gray-600 mb-6">
      You haven't created a meal plan for{" "}
      {selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
    </p>

    <div className="flex gap-3 justify-center">
      <Button
        className="bg-green-600 hover:bg-green-700"
        onClick={() => onNavigate("generate")}
      >
        Generate Plan
      </Button>

      <Button
        variant="outline"
        onClick={() =>
          onNavigate("manual", { selectedDate: formatLocalDate(selectedDate) })
        }
      >
        Build Manually
      </Button>
    </div>
  </CardContent>
</Card>
            )}

          </div>

<div className="space-y-6">

  <div className="space-y-6">

  {!hasPlan ? (

    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <CardContent className="p-6 text-center">

        <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-4" />

        <h3 className="text-xl text-gray-900 mb-2">
          No Plan Yet
        </h3>

        <p className="text-gray-600 mb-6">
          Start your journey by creating a personalized meal plan
        </p>

        <div className="space-y-3">

          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => onNavigate("generate")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Plan
          </Button>

          <Button
            variant="outline"
            className="w-full hover:border-green-600 hover:text-green-600"
            onClick={() =>
              onNavigate("manual", { selectedDate: formatLocalDate(selectedDate) })
            }
          >
            Build Yourself
          </Button>

        </div>

        <p className="text-xs text-gray-500 mt-4">
          Choose how you want to create your meal plan
        </p>

      </CardContent>
    </Card>

  ) : (

    <Card>
      <CardContent className="p-6">

        <h3 className="text-xl text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Your Progress
        </h3>

        {user?.goalWeight ? (
          <>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress to Goal</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>

            <Progress value={calculateProgress()} className="h-3" />

            <div className="grid grid-cols-2 gap-4 mt-6">

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Current Weight</p>
                <p className="text-2xl text-gray-900">
                  {Number(user.weight).toFixed(1)}
                  <span className="text-sm text-gray-500 ml-1">kg</span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Goal Weight</p>
                <p className="text-2xl text-gray-900">
                  {Number(user.goalWeight).toFixed(1)}
                  <span className="text-sm text-gray-500 ml-1">kg</span>
                </p>
              </div>

            </div>

            <div className="bg-green-50 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-1">
                {user.goal === 'lose' ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}

                <p className="text-xs text-gray-600">To Go</p>
              </div>

              <p className="text-2xl text-green-600">
                {Math.abs(Number(user.weight) - Number(user.goalWeight)).toFixed(1)}
                <span className="text-sm ml-1">kg</span>
              </p>
            </div>

            {nutrition && (
              <div className="bg-orange-50 rounded-lg p-4 mt-4">

                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-gray-600">
                    Recommended calories for today
                  </p>
                </div>

                <p className="text-2xl text-orange-600">
                  {Math.round(nutrition.maxCalories)}
                  <span className="text-sm ml-1">kcal</span>
                </p>

              </div>
            )}

          </>
        ) : (
          <p className="text-gray-600">
            Set a goal weight to see your progress.
          </p>
        )}

      </CardContent>
    </Card>

  )}

</div>
  
    </div>
        </div>
<AlertDialog open={showWeightDialog} onOpenChange={setShowWeightDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Weekly Weight Check-In</AlertDialogTitle>
      <AlertDialogDescription>
        It's time for your weekly weigh-in! Please enter your current weight to
        track your progress.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="py-4">
      <Label htmlFor="weight">Current Weight (kg)</Label>
      <Input
        id="weight"
        type="number"
        step="0.1"
        placeholder="Enter your weight"
        value={newWeight}
        onChange={(e) => setNewWeight(e.target.value)}
        className="mt-2"
      />
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel
        onClick={() => setShowWeightDialog(false)}
      >
        Cancel
      </AlertDialogCancel>

      <AlertDialogAction
        onClick={handleWeightUpdate}
        className="bg-green-600 hover:bg-green-700"
      >
        Update Weight
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
        {/* DELETE DIALOG */}

        <AlertDialog
          open={!!deletingMeal}
          onOpenChange={() => setDeletingMeal(null)}
        >
          <AlertDialogContent>

            <AlertDialogHeader>
              <AlertDialogTitle>Delete Meal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this meal from your plan?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>

              <AlertDialogCancel
                onClick={() => setDeletingMeal(null)}
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white"
  onClick={async () => {
    console.log("DELETE CLICKED", deletingMeal);

    if (!deletingMeal) return;

    try {
      await deleteMealFromPlan(
        deletingMeal.date,
        deletingMeal.mealType
      );

      toast.success("Meal removed from plan");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete meal");
    } finally {
      setDeletingMeal(null);
    }
  }}
>
                Delete
              </AlertDialogAction>

            </AlertDialogFooter>

          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}