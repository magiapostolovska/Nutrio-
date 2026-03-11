var DataTypes = require("sequelize").DataTypes;
var _Favorites = require("./Favorites");
var _MealPlanItems = require("./MealPlanItems");
var _PasswordResetTokens = require("./PasswordResetTokens");
var _RecipeIngredients = require("./RecipeIngredients");
var _RecipeInstructions = require("./RecipeInstructions");
var _Recipes = require("./Recipes");
var _ShoppingListItems = require("./ShoppingListItems");
var _UserMemberships = require("./UserMemberships");
var _Users = require("./Users");

function initModels(sequelize) {
  var Favorites = _Favorites(sequelize, DataTypes);
  var MealPlanItems = _MealPlanItems(sequelize, DataTypes);
  var PasswordResetTokens = _PasswordResetTokens(sequelize, DataTypes);
  var RecipeIngredients = _RecipeIngredients(sequelize, DataTypes);
  var RecipeInstructions = _RecipeInstructions(sequelize, DataTypes);
  var Recipes = _Recipes(sequelize, DataTypes);
  var ShoppingListItems = _ShoppingListItems(sequelize, DataTypes);
  var UserMemberships = _UserMemberships(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);

  Recipes.belongsToMany(Users, { as: 'UserId_Users', through: Favorites, foreignKey: "RecipeId", otherKey: "UserId" });
  Users.belongsToMany(Recipes, { as: 'RecipeId_Recipes', through: Favorites, foreignKey: "UserId", otherKey: "RecipeId" });
  ShoppingListItems.belongsTo(RecipeIngredients, { as: "RecipeIngredient", foreignKey: "RecipeIngredientId"});
  RecipeIngredients.hasMany(ShoppingListItems, { as: "ShoppingListItems", foreignKey: "RecipeIngredientId"});
  Favorites.belongsTo(Recipes, { as: "Recipe", foreignKey: "RecipeId"});
  Recipes.hasMany(Favorites, { as: "Favorites", foreignKey: "RecipeId"});
  MealPlanItems.belongsTo(Recipes, { as: "Recipe", foreignKey: "RecipeId"});
  Recipes.hasMany(MealPlanItems, { as: "MealPlanItems", foreignKey: "RecipeId"});
  RecipeIngredients.belongsTo(Recipes, { as: "Recipe", foreignKey: "RecipeId"});
  Recipes.hasMany(RecipeIngredients, { as: "RecipeIngredients", foreignKey: "RecipeId"});
  RecipeInstructions.belongsTo(Recipes, { as: "Recipe", foreignKey: "RecipeId"});
  Recipes.hasMany(RecipeInstructions, { as: "RecipeInstructions", foreignKey: "RecipeId"});
  Favorites.belongsTo(Users, { as: "User", foreignKey: "UserId"});
  Users.hasMany(Favorites, { as: "Favorites", foreignKey: "UserId"});
  MealPlanItems.belongsTo(Users, { as: "User", foreignKey: "UserId"});
  Users.hasMany(MealPlanItems, { as: "MealPlanItems", foreignKey: "UserId"});
  PasswordResetTokens.belongsTo(Users, { as: "User", foreignKey: "UserId"});
  Users.hasMany(PasswordResetTokens, { as: "PasswordResetTokens", foreignKey: "UserId"});
  ShoppingListItems.belongsTo(Users, { as: "User", foreignKey: "UserId"});
  Users.hasMany(ShoppingListItems, { as: "ShoppingListItems", foreignKey: "UserId"});
  UserMemberships.belongsTo(Users, { as: "User", foreignKey: "UserId"});
  Users.hasMany(UserMemberships, { as: "UserMemberships", foreignKey: "UserId"});

  return {
    Favorites,
    MealPlanItems,
    PasswordResetTokens,
    RecipeIngredients,
    RecipeInstructions,
    Recipes,
    ShoppingListItems,
    UserMemberships,
    Users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
