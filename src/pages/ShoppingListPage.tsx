import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { ShoppingCart, Calendar } from "lucide-react";

import {
  fetchShoppingList,
  updateShoppingItem,
  setDayCheckAll,
} from "../services/shoppingListService";

interface ShoppingItem {
  shoppingListItemId: number;
  itemText: string;
  checked: boolean;
}

interface Day {
  date: string;
  completed: boolean;
  hasMeals: boolean;
  items: ShoppingItem[];
  counts: {
    total: number;
    checked: number;
  };
}

interface ShoppingListResponse {
  days: Day[];
  summary: {
    totalItems: number;
    checkedItems: number;
  };
}

export function ShoppingListPage() {
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShoppingList();
  }, []);

 async function loadShoppingList() {
  try {
    const data = await fetchShoppingList();
    console.log("SHOPPING LIST API:", data); 
    setShoppingList(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}
  async function toggleItem(item: ShoppingItem) {
    try {
      const updated = await updateShoppingItem(item.shoppingListItemId, !item.checked);
      setShoppingList(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleDay(day: Day) {
    const checkAll = day.counts.checked !== day.counts.total;

    try {
      const updated = await setDayCheckAll(day.date, checkAll);
      setShoppingList(updated);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <p className="text-center py-10">Loading shopping list...</p>;
  }

  if (!shoppingList)  {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl text-gray-900 mb-2">No Shopping List Yet</h2>
        <p className="text-gray-600">
          Create a meal plan to generate your weekly shopping list.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        <h1 className="text-4xl mb-8 flex items-center gap-3">
          <ShoppingCart className="w-10 h-10 text-green-600" />
          Shopping List
        </h1>

        <div className="grid gap-6">

          {shoppingList.days.map((day) => {

            const dayName = new Date(day.date).toLocaleDateString("en-US", {
              weekday: "long",
            });

            return (
              <Card key={day.date}>
                <CardContent className="p-6">

                  <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                    <Calendar className="w-6 h-6 text-green-600" />

                    <div className="flex-1">
                      <h3 className="text-xl">{dayName}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(day.date).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge className="bg-green-100 text-green-700">
                      {day.counts.checked}/{day.counts.total}
                    </Badge>

                    <Checkbox
                      checked={day.counts.checked === day.counts.total}
                      onCheckedChange={() => toggleDay(day)}
                    />
                  </div>

                  {day.items.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-3">

                      {day.items.map((item) => (
                        <label
                          key={item.shoppingListItemId}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                            item.checked
                              ? "bg-gray-50 border-gray-300"
                              : "bg-white border-gray-200 hover:border-green-300"
                          }`}
                        >

                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() => toggleItem(item)}
                          />

                          <span
                            className={
                              item.checked
                                ? "line-through text-gray-400"
                                : "text-gray-700"
                            }
                          >
                            {item.itemText}
                          </span>

                        </label>
                      ))}

                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-6">
                      No meals planned
                    </p>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 bg-green-50 border-green-200">
          <CardContent className="p-6 flex justify-between">

            <div>
              <p className="text-lg">Shopping Progress</p>
              <p className="text-sm text-gray-600">
                {shoppingList.summary.checkedItems} items checked
              </p>
            </div>

            <div className="text-right">
              <p className="text-3xl text-green-600">
                {shoppingList.summary.totalItems}
              </p>
              <p className="text-sm text-gray-600">total items</p>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}