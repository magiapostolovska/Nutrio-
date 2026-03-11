const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, changePassword, verifyResetCode } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/change-password", changePassword);
router.post("/verify-reset-code", verifyResetCode);

module.exports = router;