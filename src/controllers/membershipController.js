const membershipsRepo = require("../repositories/userMembershipsRepository");
const userRepository = require("../repositories/userRepository");


function getAuthUserId(req) {
  return req.user?.userId ?? null;
}

async function getPaymentMembership(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const membership = await membershipsRepo.getLatestByUserId(userId);

    if (!membership) {
      return res.json({
        isActive: false,
        membership: null,
      });
    }

    const now = new Date();
    const isActive =
      membership.Status === "active" &&
      new Date(membership.StartsAt) <= now &&
      new Date(membership.EndsAt) > now;

    res.json({
      isActive,
      membership,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load membership", error: err.message });
  }
}

async function createMembership(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { ProviderPaymentId } = req.body;
    if (!ProviderPaymentId) {
      return res.status(400).json({ message: "ProviderPaymentId is required" });
    }

    const now = new Date();
    const DURATION_DAYS = 30;
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + DURATION_DAYS);

    const active = await membershipsRepo.getActiveByUserId(userId, now);
    if (active) {
      return res.status(400).json({ message: "Membership already active" });
    }

    const payload = {
      UserId: userId,
      Status: "active",
      StartsAt: now,
      EndsAt: endsAt,
      AmountUsd: 5,
      Currency: "EUR",
      PaymentProvider: "demo",
      ProviderPaymentId,
      PaidAt: now,
    };

    await membershipsRepo.createMembership(payload);

    await userRepository.updateUser(userId, { HasPaid: true });

    const latest = await membershipsRepo.getLatestByUserId(userId);

    res.status(201).json({
      message: "Membership activated and user updated",
      membership: latest,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create membership", error: err.message });
  }
}

async function cancelMembership(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const cancelledId = await membershipsRepo.cancelActiveByUserId(userId, new Date());
    if (cancelledId === null) {
      return res.status(404).json({ message: "No active membership to cancel" });
    }

    const latest = await membershipsRepo.getLatestByUserId(userId);
    res.json({
      message: "Membership cancelled",
      cancelledMembershipId: cancelledId,
      membership: latest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel membership", error: err.message });
  }
}

module.exports = {
  getPaymentMembership,
  createMembership,
  cancelMembership,
};