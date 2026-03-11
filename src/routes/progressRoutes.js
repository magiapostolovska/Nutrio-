const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const { getProgress } = require("../controllers/progressController");

router.get("/", authenticateToken, getProgress);

module.exports = router;