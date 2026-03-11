import { User } from '../types/user';

// Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
export function calculateBMR(user: User): number {
  const { weight, height, age, gender } = user;
  
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// Calculate Total Daily Energy Expenditure
export function calculateTDEE(user: User): number {
  const bmr = calculateBMR(user);
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9,
  };
  
  return Math.round(bmr * activityMultipliers[user.activityLevel]);
}

// Calculate daily calorie target based on goal
export function calculateTargetCalories(user: User): number {
  const tdee = calculateTDEE(user);
  
  switch (user.goal) {
    case 'lose':
      return Math.round(tdee - 500); // 500 calorie deficit
    case 'gain':
      return Math.round(tdee + 300); // 300 calorie surplus
    case 'maintain':
    default:
      return tdee;
  }
}
