import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMealPlan } from '../contexts/MealPlanContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Target,
  Activity,
  Ruler,
  Weight,
  Utensils,
  Leaf,
  Fish,
  Apple,
  Info,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
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
interface GeneratePlanPageProps {
  onNavigate: (page: string) => void;
}

type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';

export function GeneratePlanPage({ onNavigate }: GeneratePlanPageProps) {
  const { user, updateUserProfile } = useAuth();
  const { mealPlan, generateMonthlyPlan } = useMealPlan();
const profileReady = isProfileComplete(user);

const [step, setStep] = useState(profileReady ? 3 : 1);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const [goal, setGoal] = useState(user?.goal || 'maintain');
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || 'moderate');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [currentWeight, setCurrentWeight] = useState(user?.weight?.toString() || '');
  const [goalWeight, setGoalWeight] = useState(user?.goalWeight?.toString() || '');

  const [dietType, setDietType] = useState<DietType>('omnivore');
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null); // <-- selected start date

  const commonExclusions = ['Dairy','Gluten','Nuts','Soy','Eggs','Shellfish','Fish','Pork'];

  const dietTypes: Array<{ value: DietType; label: string; icon: any; desc: string }> = [
    { value: 'omnivore', label: 'Omnivore', icon: Utensils, desc: 'Eat everything' },
    { value: 'vegetarian', label: 'Vegetarian', icon: Leaf, desc: 'No meat' },
    { value: 'vegan', label: 'Vegan', icon: Apple, desc: 'No animal products' },
    { value: 'pescatarian', label: 'Pescatarian', icon: Fish, desc: 'Fish only' },
  ];

  const handleStep1Submit = () => {
    if (!height || !currentWeight || !goalWeight) {
      alert('Please fill in all fields');
      return;
    }

    updateUserProfile({
      goal,
      activityLevel,
      height: parseFloat(height),
      weight: parseFloat(currentWeight),
      goalWeight: parseFloat(goalWeight),
    });

    setStep(2);
  };

  const handleStep2Submit = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    setGenerating(true);

    try {
      await generateMonthlyPlan(
        {
          goal,
          activityLevel,
          dietType,
          excludedIngredients,
        },
        startDate 
      );

      setSuccess(true);
    } catch (e: any) {
      alert(e?.message || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExclusion = (ingredient: string) => {
    setExcludedIngredients(prev =>
      prev.includes(ingredient) ? prev.filter(i => i !== ingredient) : [...prev, ingredient]
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl text-gray-900 mb-3">Plan Created Successfully!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Your personalized meal plan has been generated.
            </p>
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onNavigate('myplan')}
            >
              View My Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-green-600 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl text-gray-900 mb-3">Generating Your Plan...</h2>
            <p className="text-gray-600 mb-6">
              We're creating a personalized meal plan just for you
            </p>
            <Progress value={66} className="h-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress Steps */}
        {step !== 3 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
              <span className={step >= 1 ? 'text-green-600' : 'text-gray-500'}>Your Goals</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-300">
              <div className={`h-full transition-all ${step >= 2 ? 'bg-green-600 w-full' : 'w-0'}`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
              <span className={step >= 2 ? 'text-green-600' : 'text-gray-500'}>Preferences</span>
            </div>
          </div>
        </div>
        )}
        {/* Step 1 */}
        {step === 1 && (
  <div className="container mx-auto px-4 max-w-2xl">
    <Card>
      <CardContent className="p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-3xl text-gray-900 mb-2">
            Set Your Goals
          </h2>

          <p className="text-lg text-gray-600">
            Tell us about yourself so we can create the perfect plan
          </p>
        </div>

        <div className="space-y-6">

          {/* Goal */}
          <div>
            <Label className="mb-3 block flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              Goal
            </Label>

            <RadioGroup value={goal} onValueChange={setGoal}>
              <div className="grid grid-cols-3 gap-3">
                {['lose','maintain','gain'].map(v => (
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

          {/* Activity */}
          <div>
            <Label className="mb-3 block flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              Activity Level
            </Label>

            <RadioGroup value={activityLevel} onValueChange={setActivityLevel}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['sedentary','light','moderate','active'].map(v => (
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
                onChange={(e) => setHeight(e.target.value)}
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
                onChange={(e) => setCurrentWeight(e.target.value)}
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
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder="65"
                className="h-11"
              />
            </div>

          </div>
        </div>

        <Button
          onClick={handleStep1Submit}
          className="w-full bg-green-600 hover:bg-green-700 h-12 mt-8"
        >
          Next Step
        </Button>

      </CardContent>
    </Card>
  </div>
)}

        {/* Step 2 */}
        {step === 2 && (
  <Card>
    <CardContent className="p-8">

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-3xl text-gray-900 mb-2">
          Dietary Preferences
        </h2>

        <p className="text-lg text-gray-600">
          Customize your meal plan based on your eating style
        </p>
      </div>
              <div className="space-y-8">
                {/* Diet Type */}
                <div>
                  <Label className="text-base mb-4 flex items-center gap-2"><Utensils className="w-5 h-5 text-green-600" />Choose Your Diet Type</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dietTypes.map(({value,label,icon:Icon,desc})=>(
                      <button key={value} onClick={()=>setDietType(value)} className={`border-2 rounded-lg p-4 transition-all text-left ${dietType===value?'border-green-600 bg-green-50':'border-gray-200 hover:border-green-300'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-green-600"/></div>
                          <div><p className="font-semibold text-gray-900">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Date Picker */}
                <div>
                  <Label className="text-base mb-2">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={e => setStartDate(new Date(e.target.value))}
                    className="h-11"
                  />
                </div>

              

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/>
                  <p className="text-sm text-blue-900">
                    Your selections will impact recipe generation and meal plan recommendations. We'll ensure all meals match your preferences.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="outline" onClick={()=>setStep(1)} className="flex-1 h-12">Back</Button>
                <Button onClick={handleStep2Submit} className="flex-1 bg-green-600 hover:bg-green-700 h-12">Generate My Plan</Button>
              </div>
            </CardContent>
          </Card>
        )}
{step === 3 && (
  <Card>
    <CardContent className="p-8">

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-3xl text-gray-900 mb-2">
          Generate Your Meal Plan
        </h2>

        <p className="text-lg text-gray-600">
          Your profile is already complete. Just choose a start date.
        </p>
      </div>

      <div className="space-y-6">

        <div>
          <Label className="text-base mb-2">Start Date</Label>
          <Input
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={e => setStartDate(new Date(e.target.value))}
            className="h-11"
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <Sparkles className="w-5 h-5 text-green-600 mt-0.5"/>
          <p className="text-sm text-green-900">
            We'll generate a personalized monthly meal plan based on your saved profile.
          </p>
        </div>

        <Button
          onClick={handleStep2Submit}
          className="w-full bg-green-600 hover:bg-green-700 h-12"
        >
          Generate My Plan
        </Button>

      </div>
    </CardContent>
  </Card>
)}
      </div>
      
    </div>
    
  );
  
}
