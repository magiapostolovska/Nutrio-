const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Recipes', {
    RecipeId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    Title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    Description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Category: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    Tags: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    PrepMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    CookMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Servings: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Difficulty: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Calories: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ProteinG: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: true
    },
    CarbsG: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: true
    },
    FatG: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Recipes',
    schema: 'dbo',
    timestamps: true,
    indexes: [
      {
        name: "IX_Recipes_Category",
        fields: [
          { name: "Category" },
        ]
      },
      {
        name: "PK__Recipes__FDD988B0ADB9A46D",
        unique: true,
        fields: [
          { name: "RecipeId" },
        ]
      },
    ]
  });
};
