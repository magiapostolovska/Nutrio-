const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('RecipeInstructions', {
    RecipeInstructionId: {
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
    StepNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    StepText: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'RecipeInstructions',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__RecipeIn__979A63D1C9B88DDC",
        unique: true,
        fields: [
          { name: "RecipeInstructionId" },
        ]
      },
    ]
  });
};
