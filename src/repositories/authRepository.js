const db = require("../db/models");

async function findUserByEmail(email) {
  return db.Users.findOne({ where: { Email: email } });
}

async function createUser(userData) {
  return db.Users.create(userData);
}

async function createPasswordResetToken(userId, tokenHash, expiresAt) {
  return db.PasswordResetTokens.create({
    UserId: userId,
    Token: tokenHash,
    ExpiresAt: expiresAt,
    UsedAt: null,
  });
}

async function findValidPasswordResetToken(userId, tokenHash) {
  return db.PasswordResetTokens.findOne({
    where: {
      UserId: userId,
      Token: tokenHash,
      UsedAt: null,
    },
    order: [["TokenId", "DESC"]],
  });
}

async function markResetTokenUsed(tokenId) {
  return db.PasswordResetTokens.update(
    { UsedAt: new Date() },
    { where: { TokenId: tokenId } }
  );
}

async function deleteAllResetTokens(userId) {
  return db.PasswordResetTokens.destroy({ where: { UserId: userId } });
}

async function updateUserPassword(userId, passwordHash) {
  return db.Users.update(
    { Password: passwordHash },
    { where: { UserId: userId } }
  );
}

module.exports = {
  findUserByEmail,
  createUser,
  createPasswordResetToken,
  findValidPasswordResetToken,
  markResetTokenUsed,
  deleteAllResetTokens,
  updateUserPassword,
};