const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getShoppingList,
  updateShoppingItem,
  setDayCheckAll,
} = require("../controllers/shoppingListController");

router.get("/", authenticateToken, getShoppingList);
router.put("/item/:shoppingListItemId", authenticateToken, updateShoppingItem);
router.put("/day/:date/check-all", authenticateToken, setDayCheckAll);

module.exports = router;