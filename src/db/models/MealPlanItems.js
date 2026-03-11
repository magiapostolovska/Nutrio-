const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MealPlanItems', {
    MealPlanItemId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'UserId'
      }
    },
    PlanDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    MealType: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    RecipeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Recipes',
        key: 'RecipeId'
      }
    },
    Calories: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    IsEaten: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    EatenAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'MealPlanItems',
    schema: 'dbo',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "IX_MealPlanItems_UserDate",
        fields: [
          { name: "UserId" },
          { name: "PlanDate" },
        ]
      },
      {
        name: "PK__MealPlan__F7846F55A52F5663",
        unique: true,
        fields: [
          { name: "MealPlanItemId" },
        ]
      },
      {
        name: "UX_MealPlanItems_OnePerMeal",
        unique: true,
        fields: [
          { name: "UserId" },
          { name: "PlanDate" },
          { name: "MealType" },
        ]
      },
    ]
  });
};
