const db = require("../db/models");

async function getById(userId) {
  return db.Users.findByPk(userId, {
    attributes: { exclude: ["Password"] },
  });
}

async function updateUser(userId, patch) {
  const [count] = await db.Users.update(patch, { where: { UserId: userId } });
  if (!count) return null;
  return getById(userId);
}

async function getPassword(userId) {
  return db.Users.findByPk(userId, { attributes: ["UserId", "Password"] });
}

async function updatePasswordHash(userId, passwordHash) {
  const [count] = await db.Users.update(
    { Password: passwordHash },
    { where: { UserId: userId } }
  );
  return count > 0;
}

async function deleteUser(userId) {
  return db.Users.destroy({ where: { UserId: userId } });
}

module.exports = {
  getById,
  updateUser,
  getPassword,
  updatePasswordHash,
  deleteUser,
};