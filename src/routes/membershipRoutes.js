const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getPaymentMembership,
  createMembership,
  cancelMembership,
} = require("../controllers/membershipController");

router.get("/", authenticateToken, getPaymentMembership);
router.post("/", authenticateToken, createMembership);
router.post("/cancel", authenticateToken, cancelMembership);

module.exports = router;