const shoppingRepo = require("../repositories/shoppingListRepository");

function toInt(val) {
  const n = Number(val);
  return Number.isInteger(n) ? n : null;
}

function getAuthUserId(req) {
  return req.user?.userId;
}

async function getShoppingList(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const data = await shoppingRepo.getShoppingListRolling(userId);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to load shopping list",
      error: err.message,
    });
  }
}

async function updateShoppingItem(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = toInt(req.params.shoppingListItemId);
    if (!id) return res.status(400).json({ message: "Invalid shoppingListItemId" });

    const { checked } = req.body;
    if (typeof checked !== "boolean") {
      return res.status(400).json({ message: "Body must include checked: true/false" });
    }

    const ok = await shoppingRepo.setItemChecked(userId, id, checked);
    if (!ok) return res.status(404).json({ message: "Shopping item not found" });

    const data = await shoppingRepo.getShoppingListRolling(userId);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update shopping item", error: err.message });
  }
}

async function setDayCheckAll(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { date } = req.params;
    const { checked } = req.body;

    if (typeof checked !== "boolean") {
      return res.status(400).json({ message: "Body must include checked: true/false" });
    }

    await shoppingRepo.setDayAllChecked(userId, date, checked);

    const data = await shoppingRepo.getShoppingListRolling(userId);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update day items", error: err.message });
  }
}

module.exports = {
  getShoppingList,
  updateShoppingItem,
  setDayCheckAll,
};