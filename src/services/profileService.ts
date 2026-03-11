const API_BASE = "http://localhost:5000"; 

export async function fetchUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to fetch profile");
  }

  const u = await res.json();

  return {
    id: u.UserId?.toString() || "",
    fullName: u.FullName || "",
    email: u.Email || "",
    dateOfBirth: u.DateOfBirth || null,
    age: u.Age || (u.DateOfBirth ? Math.floor((Date.now() - new Date(u.DateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0),
    gender: u.Sex || "male",
    height: u.HeightCm || 0,
    weight: Number(u.CurrentWeightKg ?? 0),
currentWeight: Number(u.StartWeightKg ?? u.CurrentWeightKg ?? 0),
goalWeight: Number(u.GoalWeightKg ?? 0),
    dietType: u.DietType || "omnivore",
    activityLevel: u.ActivityLevel || "moderate",
    goal: u.Goal || "maintain",
    excludedIngredients: u.ExcludedIngredients || [],
    favoriteRecipes: u.FavoriteRecipes || [],
    dailyCalories: u.DailyTargetCal || 0,
    planStartDate: u.PlanStartDate || null,
    lastWeightUpdate: u.LastWeightUpdate || null,
    isAdmin: u.IsAdmin || false,
    hasPaid: Boolean(u.HasPaid)
  };
}
  
export async function updateUserProfile(userId: string, data: {
  FullName?: string;
  Sex?: string;
  DateOfBirth?: string | null;
  HeightCm?: number;
  CurrentWeightKg?: number;
  GoalWeightKg?: number;
  Goal?: string;
  ActivityLevel?: string;
  DailyTargetCal?: number;
  DietType?: string;
}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/user/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update user");
  }

  const updatedUser = await res.json();
  return updatedUser;
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/user/password/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update password");
  }

  return await res.json();
}

export async function cancelMembership() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found.");

  const res = await fetch(`${API_BASE}/membership/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to cancel membership");
  }

  return await res.json();
}

export async function fetchMembershipStatus(): Promise<{ isActive: boolean; membership: any | null }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/membership`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch membership");
  }

  const data = await res.json();
  return {
    isActive: !!data.isActive,
    membership: data.membership ?? null,
  };
}