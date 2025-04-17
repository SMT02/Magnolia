const { Client, Databases, Query } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local file
const result = dotenv.config({ path: '.env.local' });
if (result.error) {
  throw result.error;
}

console.log('Environment variables loaded:', {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  collectionId: process.env.EXPO_PUBLIC_APPWRITE_GOODS_COLLECTION_ID,
});

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function generateProductCatalog() {
  try {
    console.log("Starting catalog generation...");
    console.log("Database ID:", process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);
    console.log("Collection ID:", process.env.EXPO_PUBLIC_APPWRITE_GOODS_COLLECTION_ID);
    
    // Fetch all products from Appwrite
    const result = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.EXPO_PUBLIC_APPWRITE_GOODS_COLLECTION_ID,
      [Query.orderAsc("$createdAt"), Query.limit(100)]
    );

    console.log("Fetched documents:", result.documents.length);

    // Format products for the catalog
    const products = result.documents.map((doc, index) => ({
      code: `P${index + 1}`,
      name: doc.name,
      category: doc.category,
      price: doc.price,
      description: doc.description || `${doc.name} from ${doc.category} category`
    }));

    // Create the catalog object
    const catalog = {
      version: "1.0",
      last_updated: new Date().toISOString(),
      available_products: products,
      categories: [
        "FruitsAndVegetables",
        "MeatAndSeafood",
        "DairyAndEggs",
        "Bakery",
        "Beverages",
        "FrozenFoods",
        "PantryStaples",
        "SnacksAndSweets",
        "HouseholdEssentials"
      ],
      instructions: "This file contains the complete product catalog for Magnolia store. Each product has a unique code (P1, P2, etc.) that MUST be used when referring to products. Never suggest or mention products not listed in this file."
    };

    // Write to file
    const filePath = path.join(__dirname, '..', 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(catalog, null, 2));
    console.log(`✅ Product catalog generated with ${products.length} products`);
    console.log("Catalog saved to:", filePath);

  } catch (error) {
    console.error("Error generating product catalog:", error);
  }
}

// Run the function
console.log("Starting script...");
generateProductCatalog()
  .then(() => console.log("Script completed"))
  .catch(err => console.error("Script failed:", err)); 