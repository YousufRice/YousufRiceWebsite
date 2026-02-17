import { Client, Databases, Storage, Account, ID, Query } from "appwrite";

// Client for browser usage
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Server-side client configuration
let serverClient: Client | null = null;
let serverDatabases: Databases | null = null;
let serverStorage: Storage | null = null;

// Initialize server-side client only when needed and available
if (typeof window === "undefined" && process.env.APPWRITE_API_KEY) {
  try {
    // Use node-appwrite for server-side operations
    const {
      Client: ServerClient,
      Databases: ServerDatabases,
      Storage: ServerStorage,
    } = require("node-appwrite");

    serverClient = new ServerClient()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY);

    serverDatabases = new ServerDatabases(serverClient);
    serverStorage = new ServerStorage(serverClient);

    console.log("✅ Server-side Appwrite client initialized with API key");
  } catch (error) {
    console.warn("Failed to initialize server-side Appwrite client:", error);
  }
}

// Export the appropriate clients
export const databases = serverDatabases || new Databases(client);
export const storage = serverStorage || new Storage(client);
export const account = new Account(client); // Account always uses client-side for user sessions

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const PRODUCTS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_TABLE_ID!;
export const ORDERS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ORDERS_TABLE_ID!;
export const ORDER_ITEMS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ORDER_ITEMS_TABLE_ID!;
export const CUSTOMERS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CUSTOMERS_TABLE_ID!;
export const ADDRESSES_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ADDRESSES_TABLE_ID!;
export const PRODUCT_IMAGES_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_IMAGES_TABLE_ID!;
export const DISCOUNT_MANAGEMENT_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DISCOUNT_MANAGEMENT_TABLE_ID!;
export const STORAGE_BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;

export { client, ID, Query };
