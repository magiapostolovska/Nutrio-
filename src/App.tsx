import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MealPlanProvider, useMealPlan } from "./contexts/MealPlanContext";
import { NutriLifeHeader } from "./components/NutriLifeHeader";
import { RecipeDetailModal } from "./components/RecipeDetailModal";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { MyPlanPage } from "./pages/MyPlanPage";
import { GeneratePlanPage } from "./pages/GeneratePlanPage";
import { ManualPlanPage } from "./pages/ManualPlanPage";
import { RecipesPage } from "./pages/RecipesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { Recipe } from "./types/recipe";
import { Toaster } from "./components/ui/sonner";
import { MealKey } from "./pages/ManualPlanPage";
import { PaymentPage } from "./pages/PaymentPage";
import { AdminRecipesPage } from "./pages/AdminRecipesPage";
import { toast } from "sonner";
import { fetchMembershipStatus } from "./services/profileService";

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const { addMealToPlan } = useMealPlan();

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem("user");
    const u = saved ? JSON.parse(saved) : null;
    return u?.isAdmin ? "admin" : "home";
  });

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [navigationParams, setNavigationParams] = useState<any>(null);

  const [membershipActive, setMembershipActive] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);

  const isAdmin = !!user?.isAdmin;

  const paidPages = ["myplan", "generate", "manual", "shopping"] as const;
  const publicPages = ["home", "login", "register", "recipes", "payment"] as const;

  const closeRecipeModal = () => {
    setIsRecipeModalOpen(false);
    setSelectedRecipe(null);
  };

  const refreshMembership = async () => {
    if (!isAuthenticated || isAdmin) {
      setMembershipActive(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMembershipActive(false);
      return;
    }

    try {
      setMembershipLoading(true);
      const m = await fetchMembershipStatus();
      setMembershipActive(!!m?.isActive);
    } catch {
      setMembershipActive(false);
    } finally {
      setMembershipLoading(false);
    }
  };

  useEffect(() => {
    refreshMembership();
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setCurrentPage("admin");
      setNavigationParams(null);
    }
  }, [isAuthenticated, isAdmin]);

  const handleNavigate = (page: string, params?: any) => {
    window.history.pushState({ page, params }, "", `#${page}`);

    if (isAdmin && page !== "admin") {
      setCurrentPage("admin");
      setNavigationParams(null);
      return;
    }

    if (page === "payment") {
      setCurrentPage("payment");
      setNavigationParams({
        ...(params || {}),
        returnTo: params?.returnTo || currentPage,
      });
      return;
    }

    if (isAuthenticated && !isAdmin && !membershipActive) {
      if (paidPages.includes(page as any)) {
        toast.error("Please complete payment to access meal planning features");
        setCurrentPage("payment");
        setNavigationParams({
          returnTo: currentPage,
          attempted: page,
          ...(params || {}),
        });
        return;
      }
    }

    setCurrentPage(page);
    setNavigationParams(params || null);
  };

  useEffect(() => {
    const handler = (event: PopStateEvent) => {
      if (event.state?.page) {
        setCurrentPage(event.state.page);
        setNavigationParams(event.state.params || null);
      }
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleRecipeSelect = async (recipe: Recipe) => {
    if (navigationParams?.selectingFor) {
      const { mealType, date, mode } = navigationParams.selectingFor;

      const mealKeys: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];
      const normalizedMealType = String(mealType).toLowerCase() as MealKey;

      const formattedDate =
        typeof date === "string"
          ? date
          : date.toISOString().split("T")[0];

      await addMealToPlan(formattedDate, normalizedMealType, recipe);

      if (mode === "edit") {
        handleNavigate("myplan");
        return;
      }

      const nextIndex = mealKeys.indexOf(normalizedMealType) + 1;

      const nextManualState = {
        step: nextIndex < mealKeys.length ? "meals" : "done",
        mealIndex: nextIndex,
        progress: {
          ...(navigationParams.manualPlanState?.progress || {}),
          [normalizedMealType]: true,
        },
      };

      handleNavigate("manual", {
        selectedDate: date,
        manualPlanState: nextManualState,
      });

      return;
    }

    handleNavigate("myplan");
  };

  if (!isAuthenticated && !publicPages.includes(currentPage as any)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NutriLifeHeader currentPage="home" onNavigate={handleNavigate} />

        <HomePage
          onNavigate={handleNavigate}
          onRecipeClick={handleRecipeClick}
          isLoggedIn={isAuthenticated}
          user={user ? { fullName: user.fullName, email: user.email } : undefined}
        />

        <RecipeDetailModal
          recipe={selectedRecipe}
          open={isRecipeModalOpen}
          onClose={closeRecipeModal}
          onNavigate={handleNavigate}
        />

        <Toaster position="top-center" />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NutriLifeHeader currentPage="admin" onNavigate={handleNavigate} />
        <main>
          <AdminRecipesPage onRecipeClick={handleRecipeClick} />
        </main>

        <RecipeDetailModal
          recipe={selectedRecipe}
          open={isRecipeModalOpen}
          onClose={closeRecipeModal}
          onNavigate={handleNavigate}
        />

        <Toaster position="top-center" />
      </div>
    );
  }

  if (currentPage === "login" || currentPage === "register") {
    return <AuthPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NutriLifeHeader currentPage={currentPage} onNavigate={handleNavigate} />

      <main>
        {currentPage === "home" && (
          <HomePage
            onNavigate={handleNavigate}
            onRecipeClick={handleRecipeClick}
            isLoggedIn={isAuthenticated}
            user={user ? { fullName: user.fullName, email: user.email } : undefined}
          />
        )}

        {currentPage === "payment" && (
          <PaymentPage
            onNavigate={handleNavigate}
            returnTo={navigationParams?.returnTo || "profile"}
            onPaid={async () => {
              await refreshMembership();
              const back = navigationParams?.returnTo || "profile";
              setCurrentPage(back);
              setNavigationParams(null);
            }}
          />
        )}

        {currentPage === "myplan" && (
          <MyPlanPage onNavigate={handleNavigate} onRecipeClick={handleRecipeClick} />
        )}

        {currentPage === "recipes" && (
          <RecipesPage
            onRecipeClick={handleRecipeClick}
            selectingFor={navigationParams?.selectingFor}
            onNavigate={handleNavigate}
            onRecipeSelect={handleRecipeSelect}
          />
        )}

        {currentPage === "generate" && (
          <GeneratePlanPage onNavigate={handleNavigate} />
        )}

        {currentPage === "manual" && (
          <ManualPlanPage
            onNavigate={handleNavigate}
            selectedDate={
              navigationParams?.selectedDate
                ? new Date(navigationParams.selectedDate)
                : new Date()
            }
            manualPlanState={navigationParams?.manualPlanState}
          />
        )}

        {currentPage === "profile" && (
          <ProfilePage
            onNavigate={handleNavigate}
            membershipActive={membershipActive}
            membershipLoading={membershipLoading}
            refreshMembership={refreshMembership}
          />
        )}

        {currentPage === "shopping" && <ShoppingListPage />}
      </main>

      <RecipeDetailModal
        recipe={selectedRecipe}
        open={isRecipeModalOpen}
        onClose={closeRecipeModal}
        onNavigate={handleNavigate}
      />

      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MealPlanProvider>
        <AppContent />
      </MealPlanProvider>
    </AuthProvider>
  );
}