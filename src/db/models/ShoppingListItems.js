const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ShoppingListItems', {
    ShoppingListItemId: {
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
    ForDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ItemText: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    IsChecked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    MealPlanItemId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    IsGenerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    IsHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    RecipeIngredientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'RecipeIngredients',
        key: 'RecipeIngredientId'
      }
    }
  }, {
    sequelize,
    tableName: 'ShoppingListItems',
    schema: 'dbo',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "IX_ShoppingList_UserDate",
        fields: [
          { name: "UserId" },
          { name: "ForDate" },
        ]
      },
      {
        name: "PK__Shopping__EBB182A9A0BAA3DC",
        unique: true,
        fields: [
          { name: "ShoppingListItemId" },
        ]
      },
    ]
  });
};
