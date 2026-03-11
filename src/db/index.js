const dotenv = require("dotenv");
const { Sequelize, DataTypes } = require('sequelize');

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: process.env.DB_DIALECT,
  host: process.env.DB_SERVER,
  port: process.env.DB_PORT || 1433,
  dialectOptions: {
    options: {
      trustServerCertificate: process.env.DB_TRUSTSERVERCERTIFICATE === 'true', 
      encrypt: process.env.DB_ENCRYPT === 'true', 
    },
  },
  logging: process.env.DEBUG === 'true' ? console.log : false, 
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connected to the database!");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

module.exports = { sequelize, testConnection };  

