import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMealPlan } from '../contexts/MealPlanContext';
import { Recipe } from '../types/recipe';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { CheckCircle2, Sunrise, Sun, Moon, Apple, Activity, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Ruler, Weight } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertTriangle, Flame } from 'lucide-react';
function isProfileComplete(user: any) {
  if (!user) return false;

  return (
    user.goal &&
    user.activityLevel &&
    user.dietType &&
    user.height &&
    user.weight &&
    user.goalWeight
  );
}
interface ManualPlanPageProps {
  onNavigate: (page: string, params?: any) => void;
  selectedDate?: Date;
  manualPlanState?: {
    step: 'setup' | 'meals' | 'done';
    mealIndex: number;
    progress: Record<MealKey, boolean>;
  };
}

export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export function ManualPlanPage({
  onNavigate,
  selectedDate: initialDate,
  manualPlanState,
}: ManualPlanPageProps) {
  const { user, updateUserProfile } = useAuth();
  const { mealPlan, addMealToPlan, nutritionByDay } = useMealPlan();

  const profileReady = isProfileComplete(user);

const [step, setStep] = useState<'setup' | 'meals' | 'done'>(
  manualPlanState?.step || (profileReady ? 'meals' : 'setup')
);
  const [currentMealIndex, setCurrentMealIndex] = useState(manualPlanState?.mealIndex || 0);
  const [planProgress, setPlanProgress] = useState<Record<MealKey, boolean>>(
    manualPlanState?.progress || { breakfast: false, lunch: false, dinner: false, snack: false }
  );

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
  }, [initialDate]);

  const [goal, setGoal] = useState(user?.goal || 'maintain');
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || 'moderate');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [currentWeight, setCurrentWeight] = useState(user?.weight?.toString() || '');
  const [goalWeight, setGoalWeight] = useState(user?.goalWeight?.toString() || '');

  const mealSteps: { key: MealKey; label: string; icon: any }[] = [
    { key: 'breakfast', label: 'Breakfast', icon: Sunrise },
    { key: 'lunch', label: 'Lunch', icon: Sun },
    { key: 'dinner', label: 'Dinner', icon: Moon },
    { key: 'snack', label: 'Snack', icon: Apple },
  ];

  const currentMeal = mealSteps[currentMealIndex] || null;

  const dateStr = selectedDate.toISOString().split('T')[0];
  const dayMeals = mealPlan?.[dateStr];

  const fallbackCurrentCalories =
    (dayMeals?.breakfast?.calories || 0) +
    (dayMeals?.lunch?.calories || 0) +
    (dayMeals?.dinner?.calories || 0) +
    (dayMeals?.snack?.calories || 0);

  const backendNutrition = nutritionByDay?.[dateStr];
  const targetCalories =
    (typeof backendNutrition?.maxCalories === 'number' && backendNutrition.maxCalories > 0)
      ? backendNutrition.maxCalories
      : (user?.dailyCalories || 2000);

  const currentCalories =
    (typeof backendNutrition?.dayTotalCalories === 'number')
      ? backendNutrition.dayTotalCalories
      : fallbackCurrentCalories;

  const isOverCalories = currentCalories > targetCalories;

  const handleSetupSubmit = () => {
    if (!height || !currentWeight || !goalWeight) {
      toast.error('Please fill in all fields');
      return;
    }

    updateUserProfile({
      goal,
      activityLevel,
      height: parseFloat(height),
      weight: parseFloat(currentWeight),
      goalWeight: parseFloat(goalWeight),
    });

    setStep('meals');
  };

  const handleSelectMeal = (mealKey: MealKey) => {
    onNavigate?.('recipes', {
      selectingFor: { mealType: mealKey, date: selectedDate },
      returnTo: 'manual',
      manualPlanState: { step, mealIndex: currentMealIndex, progress: planProgress },
    });
  };

  useEffect(() => {
    if (manualPlanState?.step === 'meals') {
      setStep('meals');
      setCurrentMealIndex(manualPlanState.mealIndex);
      setPlanProgress(manualPlanState.progress);
    }
  }, [manualPlanState]);

  const goToNextMeal = (mealKey?: MealKey) => {
    if (mealKey) {
      setPlanProgress(prev => ({ ...prev, [mealKey]: true }));
    }
    const nextIndex = currentMealIndex + 1;
    if (nextIndex < mealSteps.length) {
      setCurrentMealIndex(nextIndex);
    } else {
      setStep('done');
    }
  };

  const handleSkipMeal = () => {
    goToNextMeal();
  };

  const progress = currentMeal
    ? ((currentMealIndex + (planProgress[currentMeal.key] ? 1 : 0)) / mealSteps.length) * 100
    : 100;

  const allMealsDone = !currentMeal || step === 'done';


  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl text-gray-900 mb-2">Set Your Goals</h2>
                <p className="text-lg text-gray-600">
                  Tell us about yourself to personalize your plan
                </p>
              </div>

              <div className="space-y-6">
                {/* Activity Level */}
                <div>
                  <Label className="mb-3 block flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    Activity Level
                  </Label>
                  <RadioGroup value={activityLevel} onValueChange={setActivityLevel}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['sedentary', 'light', 'moderate', 'active'].map(v => (
                        <label
                          key={v}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                            activityLevel === v
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <RadioGroupItem value={v} className="sr-only" />
                          <p className="text-center text-sm">
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </p>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Goal */}
                <div>
                  <Label className="mb-3 block flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    Goal
                  </Label>
                  <RadioGroup value={goal} onValueChange={setGoal}>
                    <div className="grid grid-cols-3 gap-3">
                      {['lose', 'maintain', 'gain'].map(v => (
                        <label
                          key={v}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            goal === v
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <RadioGroupItem value={v} className="sr-only" />
                          <p className="text-center">
                            {v === 'lose'
                              ? 'Lose Weight'
                              : v === 'maintain'
                              ? 'Maintain'
                              : 'Gain Weight'}
                          </p>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Measurements */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Ruler className="w-4 h-4 text-green-600" />
                      Height (cm)
                    </Label>
                    <Input
                      type="number"
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      placeholder="170"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Weight className="w-4 h-4 text-green-600" />
                      Current Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      value={currentWeight}
                      onChange={e => setCurrentWeight(e.target.value)}
                      placeholder="70"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      Goal Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      value={goalWeight}
                      onChange={e => setGoalWeight(e.target.value)}
                      placeholder="65"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSetupSubmit}
                className="w-full bg-green-600 hover:bg-green-700 h-12 mt-8"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'meals' && currentMeal) {
    const mealLabelLower = currentMeal.label.toLowerCase();

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Top progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Meal {currentMealIndex + 1} of {mealSteps.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card>
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <currentMeal.icon className="w-10 h-10 text-green-600" />
                </div>

                <h2 className="text-3xl text-gray-900 mb-2">
                  {currentMeal.label} Search
                </h2>

                <p className="text-gray-600">
                  for{' '}
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Calorie warning */}
              {isOverCalories && (
                <Alert className="mb-6 border-orange-300 bg-orange-50">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <AlertDescription className="text-orange-900">
                    <strong>Calorie Warning:</strong> Current total ({currentCalories} kcal) exceeds your daily target ({targetCalories} kcal).
                  </AlertDescription>
                </Alert>
              )}

              {/* Calorie summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-gray-700" />
                    <span className="text-sm text-gray-600">Current Day Total</span>
                  </div>

                  <span className={`font-semibold ${isOverCalories ? 'text-orange-600' : 'text-gray-900'}`}>
                    {currentCalories} / {targetCalories} kcal
                  </span>
                </div>

                <Progress
                  value={Math.min((currentCalories / targetCalories) * 100, 100)}
                  className={`h-2 ${isOverCalories ? '[&>div]:bg-orange-500' : ''}`}
                />
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {mealSteps.map(meal => {
                  const Icon = meal.icon;
                  const isDone = planProgress[meal.key];
                  const isCurrent = meal.key === currentMeal.key;

                  return (
                    <div
                      key={meal.key}
                      className={`p-3 rounded-lg text-center transition-all ${
                        isDone
                          ? 'bg-green-100 border-2 border-green-600'
                          : isCurrent
                          ? 'bg-blue-50 border-2 border-blue-300'
                          : 'bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <Icon
                        className={`w-7 h-7 mx-auto mb-1 ${
                          isDone || isCurrent ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                      <p className="text-xs text-gray-700">{meal.label}</p>
                      {isDone && (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  className="bg-green-600 hover:bg-green-700 w-full h-12"
                  onClick={() => handleSelectMeal(currentMeal.key)}
                >
                  Search {mealLabelLower}
                </Button>

                <Button variant="outline" onClick={handleSkipMeal} className="w-full h-12">
                  Skip meal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (allMealsDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl text-gray-900 mb-3">Day Plan Created!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Your meals for {selectedDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })} have been saved.
            </p>
            <Button className="bg-green-600 hover:bg-green-700 w-full h-12" onClick={() => onNavigate('myplan')}>
              View My Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}