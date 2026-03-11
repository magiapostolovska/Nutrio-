const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getMe,
  updateUser,
  updatePassword,
  deleteUser,
} = require("../controllers/userController");

router.get("/", authenticateToken, getMe);
router.put("/:userId", authenticateToken, updateUser);
router.put("/password/:userId", authenticateToken, updatePassword);
router.delete("/:userId", authenticateToken, deleteUser);

module.exports = router;