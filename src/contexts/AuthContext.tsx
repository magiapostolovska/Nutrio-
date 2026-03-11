import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import { User, AuthState } from "../types/user";

const AuthContext = createContext<AuthState | undefined>(undefined);

const API = "http://localhost:5000/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!user;


  const API_BASE = "http://localhost:5000";

async function fetchMe(token: string) {
  const res = await fetch(`${API_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch profile");
  }

  return await res.json();
}

const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    const token = res.data.accessToken;

    if (!token) {
      console.error("No token returned from backend on login");
      return false;
    }

    localStorage.setItem("token", token);

    const backendUser = await fetchMe(token);

    let age = backendUser.Age || 0;
    if (!age && backendUser.DateOfBirth) {
      const dob = new Date(backendUser.DateOfBirth);
      if (!isNaN(dob.getTime())) {
        const diff = Date.now() - dob.getTime();
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    const mappedUser: User = {
      id: backendUser.UserId?.toString() || "",
      email: backendUser.Email || "",
      fullName: backendUser.FullName || "",
      dateOfBirth: backendUser.DateOfBirth,
      age,
      gender: backendUser.Sex,
      height: backendUser.HeightCm,
      weight: Number(backendUser.CurrentWeightKg ?? 0),
currentWeight: Number(backendUser.StartWeightKg ?? backendUser.CurrentWeightKg ?? 0),
goalWeight: Number(backendUser.GoalWeightKg ?? 0),
      dietType: backendUser.DietType || "omnivore",
      activityLevel: backendUser.ActivityLevel || "moderate",
      goal: backendUser.Goal || "maintain",
      excludedIngredients: backendUser.ExcludedIngredients || [],
      favoriteRecipes: backendUser.FavoriteRecipes || [],
      dailyCalories: backendUser.DailyTargetCal,
      planStartDate: backendUser.PlanStartDate,
      lastWeightUpdate: backendUser.LastWeightUpdate,
      isAdmin: !!backendUser.IsAdmin,
      hasPaid: !!backendUser.HasPaid,
    };

    setUser(mappedUser);
    localStorage.setItem("user", JSON.stringify(mappedUser));

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};


  const loginAsAdmin = () => {

    const adminUser: User = {

      id: "0",

      email: "admin@admin.com",

      fullName: "Admin",

      age: 0,

      gender: "male",

      height: 0,

      weight: 0,

      goalWeight: 0,

      dietType: "omnivore",

      activityLevel: "moderate",

      goal: "maintain",

      excludedIngredients: [],

      favoriteRecipes: [],

      isAdmin: true,

      hasPaid: true
    };

    setUser(adminUser);

  };


const register = async (
  fullName: string,
  email: string,
  password: string,
  gender: string,
  dateOfBirth?: string
): Promise<boolean> => {
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      fullName,
      email,
      password,
      dateOfBirth,
      sex: gender, 
    });

    const token = res.data.accessToken;
    if (!token) {
      console.error("No token returned from backend on register");
      return false;
    }

    localStorage.setItem("token", token);

    const backendUser = await fetchMe(token);

    let age = backendUser.Age || 0;
    if (!age && backendUser.DateOfBirth) {
      const dob = new Date(backendUser.DateOfBirth);
      if (!isNaN(dob.getTime())) {
        const diff = Date.now() - dob.getTime();
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    const mappedUser: User = {
      id: backendUser.UserId?.toString() || res.data.userId?.toString() || "",
      email: backendUser.Email || email,
      fullName: backendUser.FullName || fullName,
      dateOfBirth: backendUser.DateOfBirth || dateOfBirth,
      age,
      gender: backendUser.Sex || gender, 
      height: backendUser.HeightCm || 0,
      weight: Number(backendUser.CurrentWeightKg ?? 0),
      currentWeight: Number(backendUser.StartWeightKg ?? backendUser.CurrentWeightKg ?? 0),
      goalWeight: Number(backendUser.GoalWeightKg ?? 0),
      dietType: backendUser.DietType || "omnivore",
      activityLevel: backendUser.ActivityLevel || "moderate",
      goal: backendUser.Goal || "maintain",
      excludedIngredients: backendUser.ExcludedIngredients || [],
      favoriteRecipes: backendUser.FavoriteRecipes || [],
      dailyCalories: backendUser.DailyTargetCal,
      planStartDate: backendUser.PlanStartDate,
      lastWeightUpdate: backendUser.LastWeightUpdate,
      isAdmin: !!backendUser.IsAdmin,
      hasPaid: !!backendUser.HasPaid,
    };

    setUser(mappedUser);
    localStorage.setItem("user", JSON.stringify(mappedUser));

    return true;
  } catch (err: any) {
    console.error("REGISTER ERROR:", err?.response?.data || err?.message || err);
    return false;
  }
};


  const logout = () => {

    setUser(null);

    localStorage.removeItem("user");

    localStorage.removeItem("token");

  };



  const updateUserProfile = async (userData: Partial<User>) => {
  if (!user) return;

  try {
    const token = localStorage.getItem("token");

    const res = await axios.put(
      `http://localhost:5000/user/${user.id}`,
      {
        FullName: userData.fullName,
        Age: userData.age,
        HeightCm: userData.height,
        CurrentWeightKg: userData.weight,
        GoalWeightKg: userData.goalWeight,
        DietType: userData.dietType,
        Goal: userData.goal,
        ActivityLevel: userData.activityLevel,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const backendUser = res.data;

    const updatedUser = {
      ...user,
      ...userData
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

  } catch (err) {
    console.error(err);
  }
};


  const updateUserWeight = async (newWeight: number) => {
  if (!user) return;

  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/user/${user.id}/weight`,
      { weight: newWeight },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const updatedUser = {
  ...user,
  currentWeight: newWeight,
  lastWeightUpdate: new Date().toISOString()
};

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

  } catch (err) {
    console.error(err);
  }
};


  const cancelMembership = async () => {
  if (!user) return;

  try {
    const token = localStorage.getItem("token");

    await axios.post(
      "http://localhost:5000/membership/cancel",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const updatedUser = {
      ...user,
      hasPaid: false
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

  } catch (err) {
    console.error(err);
  }
};



  // CHANGE PASSWORD
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {

    try {

      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/change-password`,
        {
          currentPassword,
          newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return true;

    } catch (err) {

      console.error(err);

      return false;
    }
  };



  // SEND RESET CODE
  const sendPasswordResetCode = async (
    email: string
  ): Promise<string | null> => {

    try {

      const res = await axios.post(
        `${API}/forgot-password`,
        { email }
      );

      return res.data.code || null;

    } catch (err) {

      console.error(err);

      return null;
    }
  };



  // VERIFY RESET CODE
  const verifyResetCode = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {

    try {

      await axios.post(
        `${API}/reset-password`,
        {
          email,
          code,
          newPassword
        }
      );

      return true;

    } catch (err) {

      console.error(err);

      return false;
    }
  };



  return (

    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        loginAsAdmin,
        register,
        logout,
        updateUserProfile,
        updateUserWeight,
        cancelMembership,
        changePassword,
        sendPasswordResetCode,
        verifyResetCode
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};



export const useAuth = () => {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error("useAuth must be used inside AuthProvider");

  }

  return context;
};