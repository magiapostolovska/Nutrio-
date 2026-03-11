const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getMealPlan,               
  getMealsByDay,             
  createMealPlanManually,    
  updateMealPlan,            
  updateMealStatus,          
  deleteMealPlan,           
  createMealPlanGenerate,   
  checkIfUserHasMealPlan
} = require("../controllers/mealPlanController");

router.get("/", authenticateToken, getMealPlan);
router.get("/day/:date", authenticateToken, getMealsByDay);
router.post("/", authenticateToken, createMealPlanManually);
router.post("/generate", authenticateToken, createMealPlanGenerate);
router.put("/:mealPlanItemId", authenticateToken, updateMealPlan);
router.patch("/:mealPlanItemId/eaten", authenticateToken, updateMealStatus);
router.delete("/:mealPlanItemId", authenticateToken, deleteMealPlan);
router.get(
  "/has-meal-plan",
  authenticateToken, checkIfUserHasMealPlan
);

module.exports = router;