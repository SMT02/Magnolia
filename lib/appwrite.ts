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
    // First do a broad search to get potential matches
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [
        Query.search('name', query),
        Query.limit(50) // Increased limit to get more candidates for filtering
      ]
    );
    
    const documents = result.documents;
    
    if (documents.length === 0) {
      console.log(`No results found for query: "${query}"`);
      return [];
    }
    
    // Apply client-side ranking to improve accuracy
    const lowerQuery = query.toLowerCase().trim();
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 2);
    
    // Calculate relevance score for each document
    const scoredDocuments = documents.map(doc => {
      const name = doc.name.toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (name === lowerQuery) {
        score += 200; // Double the score for exact matches
        console.log(`💯 EXACT match: "${doc.name}" = "${query}"`);
      }
      
      // Starting with the query terms is very relevant
      if (name.startsWith(lowerQuery)) {
        score += 80; // Increased from 50
        console.log(`🔤 Starts with query: "${doc.name}" starts with "${query}"`);
      }
      
      // Contains the exact query as a substring, but with word boundaries
      const queryRegex = new RegExp(`\\b${lowerQuery}\\b`, 'i');
      if (queryRegex.test(name)) {
        score += 70; // Increased matching specific words
        console.log(`🔣 Contains word: "${doc.name}" contains word "${query}"`);
      } else if (name.includes(lowerQuery)) {
        // Contains the query as a substring but not at word boundaries
        score += 40; // Increased from 30
        console.log(`📝 Contains string: "${doc.name}" contains "${query}"`);
      }
      
      // Split the product name into words to check for matches
      const nameWords = name.split(/\s+/);
      
      // Check for individual word matches - with extra scoring for position
      // Earlier words in a product name are typically more important
      queryWords.forEach(queryWord => {
        nameWords.forEach((nameWord: string, index: number) => {
          if (nameWord === queryWord) {
            // Exact word match - more important for first word
            const positionMultiplier = index === 0 ? 3 : (index === 1 ? 2 : 1);
            score += 15 * positionMultiplier;
            console.log(`🔤 Word match: "${nameWord}" in "${doc.name}" at position ${index}`);
          } else if (nameWord.includes(queryWord)) {
            // Substring match - less significant
            const positionMultiplier = index === 0 ? 2 : (index === 1 ? 1.5 : 1);
            score += 5 * positionMultiplier;
            console.log(`📝 Substring in word: "${queryWord}" in "${nameWord}" at position ${index}`);
          }
        });
      });
      
      // For multi-word queries, check if all words are present
      if (queryWords.length > 1) {
        const allWordsPresent = queryWords.every(word => name.includes(word));
        if (allWordsPresent) {
          score += 40; // Increased from 25
          
          // Calculate if the words appear in the same order
          let inOrder = true;
          let lastIndex = -1;
          for (const word of queryWords) {
            const index = name.indexOf(word, lastIndex + 1);
            if (index <= lastIndex) {
              inOrder = false;
              break;
            }
            lastIndex = index;
          }
          
          if (inOrder) {
            score += 30; // Extra bonus for words in same order
            console.log(`🔄 Words in order: all words from "${query}" appear in order in "${doc.name}"`);
          } else {
            console.log(`🔀 All words present: all words from "${query}" found in "${doc.name}"`);
          }
        }
      }
      
      // Penalize product names that are very different in length from the query
      // This helps to avoid matching "pizza" to "frozen pizza" when actual "pizza" exists
      const lengthRatio = Math.min(lowerQuery.length, name.length) / Math.max(lowerQuery.length, name.length);
      score *= (0.7 + 0.3 * lengthRatio); // Scale score by length similarity
      
      return { doc, score, lengthRatio };
    });
    
    // Sort by score and return the documents
    scoredDocuments.sort((a, b) => b.score - a.score);
    
    // Log top results for debugging with more detail
    console.log(`----- Search results for "${query}" -----`);
    scoredDocuments.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i+1}. ${item.doc.name} (score: ${item.score.toFixed(1)}, length ratio: ${item.lengthRatio.toFixed(2)})`);
    });
    console.log(`---------------------------------------`);
    
    return scoredDocuments.map(item => item.doc);
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
