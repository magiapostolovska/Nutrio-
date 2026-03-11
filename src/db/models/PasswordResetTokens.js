const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PasswordResetTokens', {
    TokenId: {
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
    Token: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    UsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'PasswordResetTokens',
    schema: 'dbo',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "IX_PasswordResetTokens_User",
        fields: [
          { name: "UserId" },
        ]
      },
      {
        name: "PK__Password__658FEEEACF05FABC",
        unique: true,
        fields: [
          { name: "TokenId" },
        ]
      },
    ]
  });
};
