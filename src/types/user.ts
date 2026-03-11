export interface User {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth?: string ;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; 
  weight: number; 
  goalWeight: number; 
  currentWeight?: number; 
  dietType: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  goal: 'lose' | 'maintain' | 'gain';
  excludedIngredients: string[];
  favoriteRecipes: string[];
  dailyCalories?: number;
  planStartDate?: string;
  lastWeightUpdate?: string;
  isAdmin?: boolean;
  hasPaid?: boolean;
}

export interface AuthState {

  user: User | null;

  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<boolean>;

  loginAsAdmin: () => void;

  register: (
    fullName: string,
    email: string,
    password: string,
    gender:string,
    dateOfBirth?: string
) => Promise<boolean>;

  logout: () => void;

  updateUserProfile: (userData: Partial<User>) => void;

  updateUserWeight: (newWeight: number) => void;

  cancelMembership: () => void;

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;

  sendPasswordResetCode: (
    email: string
  ) => Promise<string | null>;

  verifyResetCode: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<boolean>;
}