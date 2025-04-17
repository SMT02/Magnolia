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
  platform: "com.jsm.foodapp",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  goodsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_GOODS_COLLECTION_ID,
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

export async function getLatestGoods() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(5)]
    );
    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getGoods({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderAsc("$createdAt"), Query.limit(100)];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("category", filter));

    if (query)
      buildQuery.push(
        Query.or([
          Query.search("name", query),
          Query.search("description", query),
          Query.search("category", query),
        ])
      );

    if (limit) {
      buildQuery[1] = Query.limit(limit);
    }

    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      buildQuery
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getGoodsById({ id }: { id: string }) {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [Query.equal("id", parseInt(id))]
    );

    if (result.documents.length > 0) {
      return result.documents[0];
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function searchGoods(query: string) {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [
        Query.search('name', query),
        Query.limit(20)
      ]
    );
    return result.documents;
  } catch (error) {
    console.error('Error searching goods:', error);
    return [];
  }
}

export async function getGoodsByCategory(category: string) {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [Query.equal('category', category)]
    );
    return result.documents;
  } catch (error) {
    console.error('Error fetching goods by category:', error);
    return [];
  }
}

export interface Good {
  $id: string;
  name: string;
  category: string;
  imageId: string;
  price: number;
  rating: number;
}

export { Query };
