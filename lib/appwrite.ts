import {
  Client,
  Account,
  ID,
  Databases,
  OAuthProvider,
  Avatars,
  Query,
  Storage,
} from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

export const config = {
  platform: "com.jsm.foodapp", // Updated platform name
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
<<<<<<< HEAD
  foodGalleriesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_FOOD_GALLERIES_COLLECTION_ID, // Updated collection name
  foodReviewsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_FOOD_REVIEWS_COLLECTION_ID, // Updated collection name
  chefsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CHEFS_COLLECTION_ID, // Updated collection name
  foodItemsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_FOOD_ITEMS_COLLECTION_ID, // Updated collection name
=======
  goodsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_GOODS_COLLECTION_ID, // Updated collection name
>>>>>>> AdamDatabaseBranch2
  bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
};

export const client = new Client();
client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");

    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );
    if (!response) throw new Error("Create OAuth2 token failed");

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );
    if (browserResult.type !== "success")
      throw new Error("Create OAuth2 token failed");

    const url = new URL(browserResult.url);
    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();
    if (!secret || !userId) throw new Error("Create OAuth2 token failed");

    const session = await account.createSession(userId, secret);
    if (!session) throw new Error("Failed to create session");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logout() {
  try {
    const result = await account.deleteSession("current");
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const result = await account.get();
    if (result.$id) {
      const userAvatar = avatar.getInitials(result.name);

      return {
        ...result,
        avatar: userAvatar.toString(),
      };
    }

    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

<<<<<<< HEAD
export async function getLatestFoodItems() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.foodItemsCollectionId!,
=======
export async function getLatestGoods() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
>>>>>>> AdamDatabaseBranch2
      [Query.orderAsc("$createdAt"), Query.limit(5)]
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

<<<<<<< HEAD
export async function getFoodItems({
=======
export async function getGoods({
>>>>>>> AdamDatabaseBranch2
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
<<<<<<< HEAD
    const buildQuery = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("type", filter));
=======
    const buildQuery = [Query.orderAsc("$createdAt")];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("category", filter));
>>>>>>> AdamDatabaseBranch2

    if (query)
      buildQuery.push(
        Query.or([
          Query.search("name", query),
          Query.search("description", query), // Updated search fields
<<<<<<< HEAD
          Query.search("type", query),
=======
          Query.search("category", query),
>>>>>>> AdamDatabaseBranch2
        ])
      );

    if (limit) buildQuery.push(Query.limit(limit));

    const result = await databases.listDocuments(
      config.databaseId!,
<<<<<<< HEAD
      config.foodItemsCollectionId!,
=======
      config.goodsCollectionId!,
>>>>>>> AdamDatabaseBranch2
      buildQuery
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

<<<<<<< HEAD
// Write function to get food item by ID
export async function getFoodItemById({ id }: { id: string }) {
  try {
    const result = await databases.getDocument(
      config.databaseId!,
      config.foodItemsCollectionId!,
      id
    );
    return result;
=======
// Write function to get good by ID
export async function getGoodsById({ id }: { id: string }) {
  try {
    // Use a filter to match the custom `id` attribute
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [Query.equal("id", parseInt(id))] // Use `parseInt` to convert the string back to an integer
    );

    // Return the first document if found
    if (result.documents.length > 0) {
      return result.documents[0];
    }

    // If no matching documents are found, return null
    return null;
>>>>>>> AdamDatabaseBranch2
  } catch (error) {
    console.error(error);
    return null;
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> AdamDatabaseBranch2
