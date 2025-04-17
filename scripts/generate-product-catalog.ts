import { databases, config } from '../lib/appwrite';
import { Query } from 'appwrite';
import * as fs from 'fs';
import * as path from 'path';

async function generateProductCatalog() {
  try {
    // Fetch all products from Appwrite
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(100)]
    );

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

  } catch (error) {
    console.error("Error generating product catalog:", error);
  }
}

generateProductCatalog(); 