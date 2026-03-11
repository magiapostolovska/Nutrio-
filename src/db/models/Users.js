const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
    UserId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    FullName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    IsAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    HasPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    DateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    HeightCm: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    CurrentWeightKg: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    StartWeightKg: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true
    },
    GoalWeightKg: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    Goal: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ActivityLevel: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DailyTargetCal: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Sex: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    DietType: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    PlanStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Users',
    schema: 'dbo',
    hasTrigger: true,
    timestamps: true,
    indexes: [
      {
        name: "PK__Users__1788CC4C3DFF7D64",
        unique: true,
        fields: [
          { name: "UserId" },
        ]
      },
      {
        name: "UX_Users_Email",
        unique: true,
        fields: [
          { name: "Email" },
        ]
      },
    ]
  });
};
