const API_BASE = "http://localhost:5000"; 

export interface HasMealPlanResponse {
  message: string;
  hasMealPlan: boolean;
}

export async function checkHasMealPlan(token: string): Promise<HasMealPlanResponse> {
  const res = await fetch(`${API_BASE}/mealplan/has-meal-plan`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, 
    },
  });

  if (!res.ok) {
    throw new Error('Failed to check meal plan');
  }

  return res.json();
}