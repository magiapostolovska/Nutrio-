const { sequelize } = require("../index");
const initModels = require("./init-models");

const db = initModels(sequelize);
db.sequelize = sequelize;

module.exports = db;