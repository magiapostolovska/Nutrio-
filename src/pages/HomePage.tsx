import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  CalendarDays,
  UtensilsCrossed,
  TrendingUp,
  Heart,
  Clock,
  Flame,
  Target,
} from "lucide-react";
import { Recipe } from "../types/recipe";
import { fetchAllRecipes } from "../services/recipeService";
import { toast } from "sonner";

interface HomePageProps {
  onNavigate: (page: string) => void;
  onRecipeClick: (recipe: Recipe) => void;
  isLoggedIn: boolean;
  user?: { fullName: string; email: string };
}

export function HomePage({
  onNavigate,
  onRecipeClick,
  isLoggedIn,
}: HomePageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRecipes() {
      try {
        setLoadingRecipes(true);
        const list = await fetchAllRecipes();
        if (mounted) setRecipes(list as any);
      } catch (err: any) {
        toast.error(err.message || "Failed to load recipes");
      } finally {
        if (mounted) setLoadingRecipes(false);
      }
    }

    loadRecipes();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredRecipes = recipes.slice(0, 3);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-green-50 to-emerald-50 py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-4xl text-gray-900 leading-tight">
                Smart Nutrition,{" "}
                <span className="text-green-600">Better Life</span>
              </h1>

              <p className="text-xl text-gray-600">
                Create personalized weekly meal plans with NutriLife. <br />
                Track calories, discover delicious recipes, and achieve 
                <br />your health objectives with ease.
              </p>

              <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4 inline-block">
                <p className="text-lg text-gray-900">
                  <span className="font-semibold text-green-700">
                    $5 payment
                  </span>{" "}
                  unlocks full meal planning access
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  Browse recipes for free • Premium features require payment
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  onClick={() => onNavigate("recipes")}
                >
                  Explore Recipes
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://i.ibb.co/WN0R6Gt0/Chat-GPT-Image-Mar-5-2026-10-36-05-PM.png"
                  alt="Healthy meal planning"
                  className="w-full h-[500px] object-cover"
                />
              </div>

              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-300 rounded-full opacity-30 blur-3xl" />
              <div className="absolute -top-6 -left-6 w-40 h-40 bg-emerald-300 rounded-full opacity-20 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to help you plan, track, and achieve your goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CalendarDays,
                title: "Weekly Meal Planning",
                text: "Plan all your meals for the week in minutes.",
              },
              {
                icon: UtensilsCrossed,
                title: "Smart Recipe Generation",
                text: "Get personalized recipe recommendations.",
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                text: "Monitor calories, weight, and progress.",
              },
              {
                icon: Heart,
                title: "Save Favorites",
                text: "Heart your favorite recipes for quick access.",
              },
              {
                icon: Clock,
                title: "Shopping Lists",
                text: "Generate automatic shopping lists.",
              },
              {
                icon: Target,
                title: "Goal Setting",
                text: "Set weight goals and activity level.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <Card
                key={title}
                className="border-2 hover:border-green-600 hover:shadow-lg transition-all"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-green-600" />
                  </div>

                  <h3 className="text-xl text-gray-900 mb-3">{title}</h3>

                  <p className="text-gray-600">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED RECIPES */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">Featured Recipes</h2>
            <p className="text-xl text-gray-600">
              Delicious, healthy meals crafted for your success
            </p>
          </div>

          {loadingRecipes && (
            <p className="text-center text-gray-500 mb-6">
              Loading recipes...
            </p>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => onRecipeClick(recipe)}
              >
                <div className="relative h-64 overflow-hidden">
                  <ImageWithFallback
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />

                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white text-gray-900">
                      {recipe.difficulty}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl text-gray-900 mb-2">
                    {recipe.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.prepTime + recipe.cookTime} min
                    </span>

                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {recipe.calories} cal
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {recipe.dietaryTags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-green-50 text-green-700"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onNavigate("recipes")}
            >
              View All Recipes
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl text-white mb-6">
            Ready to Start Your Journey?
          </h2>

          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have transformed their eating habits.
          </p>

          
        </div>
      </section>
    </div>
  );
}
