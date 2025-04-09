import { ID } from "react-native-appwrite";
import { databases, config } from "./appwrite";

const COLLECTIONS = {
  GOODS: config.goodsCollectionId, // 👈 Make sure this matches your Appwrite setup
};

const categories = [
  "FruitsAndVegetables",
  "MeatAndSeafood",
  "DairyAndEggs",
  "Bakery",
  "Beverages",
  "FrozenFoods",
  "PantryStaples",
  "SnacksAndSweets",
  "HouseholdEssentials",
];

const productNames = [
  "Milk",
  "Eggs",
  "Bread",
  "Apples",
  "Chicken Breast",
  "Cheddar Cheese",
  "Salmon",
  "Pasta",
  "Chips",
  "Toothpaste",
  "Toilet Paper",
  "Ice Cream",
  "Croissant",
  "Pepsi",
  "Rice",
  "Beans",
  "Chocolate Bar",
  "Frozen Pizza",
  "Ground Beef",
  "Coffee",
  "Laundry Detergent",
  "Water",
  "Candy",
  "Broccoli",
  "Frosted Muffins",
  "No Result Img",
  "Avocado",
];

const productImageIds = [
  "67bac0d90018f10fe895",
  "67bac0bb002361097491",
  "67bac0a90015ab0d5e85",
  "67bac07b003df8626cb7",
  "67bac04e001534516a9f",
  "67bac04e001534516a9f",
  "67bac0230002ce25a265",
  "67bac00c00272a177b81",
  "67babff3000375c578fb",
  "67babfd600175ea8c37e",
  "67babfb80026cac61fc0",
  "67babf96002972e28894",
  "67babf730038eb15f271",
  "67babf6000251a21b393",
  "67babf1b000445a67b26",
  "67babefc003e7996b616",
  "67babe93003c4bc83211",
  "67babe7c00052aaaf477",
  "67babe6600358a9fd740",
  "67babe4b00299db611bf",
  "67babe1a001056bbd3f9",
  "67babddd003242b52c44",
  "67babd3900301f1fd883",
  "67babd21002ada926952",
  "67babb08003cac50d8c0",
  "67baba630034597f7afe",
  "67baba370032b224ca9b",
];

async function seed() {
  try {
    // Clear existing products
    const documents = await databases.listDocuments(
      config.databaseId!,
      COLLECTIONS.GOODS!
    );
    for (const doc of documents.documents) {
      await databases.deleteDocument(
        config.databaseId!,
        COLLECTIONS.GOODS!,
        doc.$id
      );
    }

    console.log("Cleared existing products.");

    // Seed new products
    for (let i = 0; i < productNames.length; i++) {
      const name = productNames[i];
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const imageId = productImageIds[i % productImageIds.length];

      const price = (Math.random() * 10 + 1).toFixed(2);
      const rating = Math.floor(Math.random() * 2) + 4; // Between 4 and 5

      const product = await databases.createDocument(
        config.databaseId!,
        COLLECTIONS.GOODS!,
        ID.unique(),
        {
          name,
          category,
          imageId,
          price: parseFloat(price),
          rating,
        }
      );

      console.log(`Seeded: ${product.name} (${category})`);
    }

    console.log("Seeding complete.");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

export default seed;