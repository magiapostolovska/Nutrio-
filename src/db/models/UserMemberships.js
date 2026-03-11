const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserMemberships', {
    UserMembershipId: {
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
    Status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    StartsAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    EndsAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    AmountUsd: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    Currency: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    PaymentProvider: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ProviderPaymentId: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    PaidAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'UserMemberships',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__UserMemb__5A4E736AAD66D78E",
        unique: true,
        fields: [
          { name: "UserMembershipId" },
        ]
      },
    ]
  });
};
