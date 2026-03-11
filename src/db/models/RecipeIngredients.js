const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('RecipeIngredients', {
    RecipeIngredientId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    RecipeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Recipes',
        key: 'RecipeId'
      }
    },
    LineText: {
      type: DataTypes.STRING(300),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'RecipeIngredients',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__RecipeIn__A2C3421609C7A8DB",
        unique: true,
        fields: [
          { name: "RecipeIngredientId" },
        ]
      },
    ]
  });
};
