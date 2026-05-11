import { Client, TablesDB, Storage, Account, ID, Query } from "appwrite";
import { COLLECTIONS, BUCKETS } from "@yousuf-rice/config";

// Client for browser usage
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Server-side client configuration
let serverClient: Client | null = null;
let serverTablesDB: TablesDB | null = null;
let serverStorage: Storage | null = null;

// Initialize server-side client only when needed and available
if (typeof window === "undefined" && process.env.APPWRITE_API_KEY) {
  try {
    // Use node-appwrite for server-side operations
    const {
      Client: ServerClient,
      TablesDB: ServerTablesDB,
      Storage: ServerStorage,
    } = require("node-appwrite");

    serverClient = new ServerClient()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY);

    serverTablesDB = new ServerTablesDB(serverClient);
    serverStorage = new ServerStorage(serverClient);

    console.log("✅ Server-side Appwrite client initialized with API key");
  } catch (error) {
    console.warn("Failed to initialize server-side Appwrite client:", error);
  }
}

// Export the appropriate clients
export const tablesDB = serverTablesDB || new TablesDB(client);
export const storage = serverStorage || new Storage(client);
export const account = new Account(client); // Account always uses client-side for user sessions

// Re-export collection constants from shared config for backward compatibility
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const PRODUCTS_TABLE_ID = COLLECTIONS.PRODUCTS;
export const ORDERS_TABLE_ID = COLLECTIONS.ORDERS;
export const ORDER_ITEMS_TABLE_ID = COLLECTIONS.ORDER_ITEMS;
export const CUSTOMERS_TABLE_ID = COLLECTIONS.CUSTOMERS;
export const ADDRESSES_TABLE_ID = COLLECTIONS.ADDRESSES;
export const PRODUCT_IMAGES_TABLE_ID = COLLECTIONS.PRODUCT_IMAGES;
export const DISCOUNT_MANAGEMENT_TABLE_ID = COLLECTIONS.DISCOUNT_MANAGEMENT;
export const STORAGE_BUCKET_ID = BUCKETS.PRODUCT_IMAGES;

export const PUSH_SUBSCRIPTIONS_TABLE_ID = COLLECTIONS.PUSH_SUBSCRIPTIONS;
export const PUSH_LOG_TABLE_ID = COLLECTIONS.PUSH_LOG;

export const NOTIFICATION_CAMPAIGNS_TABLE_ID = COLLECTIONS.NOTIFICATION_CAMPAIGNS;
export const NOTIFICATION_ANALYTICS_TABLE_ID = COLLECTIONS.NOTIFICATION_ANALYTICS;

export const NOTIFICATION_IMAGES_BUCKET_ID = BUCKETS.NOTIFICATION_IMAGES;

export { client, ID, Query };
