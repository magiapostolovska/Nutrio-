const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Favorites', {
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Users',
        key: 'UserId'
      }
    },
    RecipeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Recipes',
        key: 'RecipeId'
      }
    }
  }, {
    sequelize,
    tableName: 'Favorites',
    schema: 'dbo',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "PK_Favorites",
        unique: true,
        fields: [
          { name: "UserId" },
          { name: "RecipeId" },
        ]
      },
    ]
  });
};
