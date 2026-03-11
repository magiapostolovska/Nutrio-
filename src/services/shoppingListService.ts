const API_BASE = "http://localhost:5000";

export async function fetchShoppingList() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(`${API_BASE}/shopping`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch shopping list");
  }

  return await res.json();
}

export async function updateShoppingItem(
  shoppingListItemId: number,
  checked: boolean
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(
    `${API_BASE}/shopping/item/${shoppingListItemId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ checked }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update shopping item");
  }

  return await res.json();
}

export async function setDayCheckAll(date: string, checked: boolean) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");

  const res = await fetch(
    `${API_BASE}/shopping-list/day/${date}/check-all`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ checked }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update day items");
  }

  return await res.json();
}