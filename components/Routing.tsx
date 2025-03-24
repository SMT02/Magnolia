import { Models } from "react-native-appwrite";
import { getGoodsById } from '../lib/appwrite'; // Import the function for fetching items
import { config } from '../lib/appwrite'; // Import configuration if needed, for now it is not

// Define the item structure using Models.Document
interface Item extends Models.Document {
  name: string;
  category: string;
  categoryNumber: number;
}

export const generateRoute = async (itemIds: number[]): Promise<string[]> => {
  const entrance = "Entrance";
  const checkout = "Checkout";

  // Category order
  const categoryOrder = [
    "FruitsAndVegetables",
    "MeatAndSeafood",
    "DairyAndEggs",
    "Bakery",
    "Beverages",
    "FrozenFoods",
    "PantryStaples",
    "SnacksAndSweets",
    "HouseholdEssentials"
  ];

  try {
    // Fetch data for each item ID
    const promises = itemIds.map((id) =>
      getGoodsById({ id: id.toString() })
    );
    
    const fetchedItems = (await Promise.all(promises))
      .filter((item): item is Item => item !== null); // Filter out null items with type assertion

    // Sort items by category order and in-aisle position
    fetchedItems.sort((a, b) => {
      const categoryAIndex = categoryOrder.indexOf(a?.category || '');
      const categoryBIndex = categoryOrder.indexOf(b?.category || '');

      // Compare based on category order
      if (categoryAIndex !== categoryBIndex) {
        return categoryAIndex - categoryBIndex;
      }

      // If categories are the same, compare by in-aisle position
      return (a?.categoryNumber || 0) - (b?.categoryNumber || 0);
    });

    // Construct and return the route using item names
    return [entrance, ...fetchedItems.map((item) => item?.name || "Unnamed Item"), checkout];
  } catch (error) {
    console.error("Error generating route:", error);
    return [entrance, "Error loading route", checkout];
  }
};
