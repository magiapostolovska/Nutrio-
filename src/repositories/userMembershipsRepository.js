const db = require("../db/models");
const { Op } = require("sequelize");


async function getLatestByUserId(userId) {
  return db.UserMemberships.findOne({
    where: { UserId: userId },
    order: [["UserMembershipId", "DESC"]],
  });
}

async function getActiveByUserId(userId, now = new Date()) {
  return db.UserMemberships.findOne({
    where: {
      UserId: userId,
      Status: { [Op.in]: ["active", "ACTIVE", "Active"] },
      StartsAt: { [Op.lte]: now },
      EndsAt: { [Op.gt]: now },
    },
    order: [["UserMembershipId", "DESC"]],
  });
}

async function createMembership(payload) {
  const row = await db.UserMemberships.create(payload);
  return row.UserMembershipId;
}

async function cancelMembershipById(userMembershipId, now = new Date()) {
  const row = await db.UserMemberships.findByPk(userMembershipId);
  if (!row) return null;

  await row.update({
    Status: "cancelled",
    EndsAt: now,
  });

  return true;
}

async function cancelActiveByUserId(userId, now = new Date()) {
  const active = await getActiveByUserId(userId, now);
  if (!active) return null;

  await active.update({
    Status: "cancelled",
    EndsAt: now,
  });

  return active.UserMembershipId;
}

module.exports = {
  getLatestByUserId,
  getActiveByUserId,
  createMembership,
  cancelMembershipById,
  cancelActiveByUserId,
};