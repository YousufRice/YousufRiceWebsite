#!/usr/bin/env node
/**
 * Push Notification Tables Setup Script
 * 
 * This script creates the necessary Appwrite tables for production-grade push notifications.
 * Run with: npx tsx scripts/setup-push-tables.ts
 * 
 * Tables created:
 * - push_subscriptions: Stores user push subscription data
 * - push_notification_log: Tracks notification analytics (sent, clicked, dismissed)
 */

import { Client, TablesDB, ID, AppwriteException } from "node-appwrite";

// Configuration
const CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  apiKey: process.env.APPWRITE_API_KEY || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
};

// Table IDs (will be generated if they don't exist)
const TABLE_IDS = {
  pushSubscriptions: process.env.NEXT_PUBLIC_APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID || "push_subscriptions",
  pushNotificationLog: process.env.NEXT_PUBLIC_APPWRITE_PUSH_LOG_TABLE_ID || "push_notification_log",
};

// Validate environment
function validateConfig() {
  const missing: string[] = [];
  if (!CONFIG.endpoint) missing.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  if (!CONFIG.projectId) missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  if (!CONFIG.apiKey) missing.push("APPWRITE_API_KEY");
  if (!CONFIG.databaseId) missing.push("NEXT_PUBLIC_APPWRITE_DATABASE_ID");

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error("\nPlease set these in your .env file and try again.");
    process.exit(1);
  }
}

// Initialize Appwrite client
function createAdminClient() {
  const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);

  return new TablesDB(client);
}

// Create table with inline columns using object-param style
async function createTable(tablesDB: TablesDB, tableId: string, name: string, columns: any[]) {
  try {
    await tablesDB.createTable({
      databaseId: CONFIG.databaseId,
      tableId: tableId,
      name: name,
      columns: columns,
    });
    console.log(`✅ Created table "${name}" (${tableId}) with ${columns.length} columns`);
    return true;
  } catch (err: any) {
    if (err instanceof AppwriteException && err.code === 409) {
      console.log(`⚠️ Table "${name}" (${tableId}) already exists. Skipping creation.`);
      console.log(`   To add missing columns, run this script with a fresh table ID or manually update in the Appwrite Console.`);
      return true;
    }
    console.error(`❌ Failed to create table "${name}":`, err.message || err);
    return false;
  }
}

// Setup Push Subscriptions table
async function setupPushSubscriptionsTable(tablesDB: TablesDB) {
  console.log("\n📋 Setting up Push Subscriptions table...");

  const columns = [
    // Core subscription fields
    { key: "endpoint", type: "varchar", size: 500, required: true },
    { key: "p256dh", type: "varchar", size: 255, required: true },
    { key: "auth", type: "varchar", size: 255, required: true },
    // User association (optional - for logged in users)
    { key: "user_id", type: "varchar", size: 255, required: false },
    // Segmentation tags (stored as comma-separated string)
    { key: "tags", type: "varchar", size: 500, required: false },
    // Status tracking (enum via varchar)
    { key: "status", type: "varchar", size: 20, required: true, default: "active" },
    // Failure tracking for auto-cleanup
    { key: "fail_count", type: "integer", required: true, default: 0 },
    // Metadata
    { key: "user_agent", type: "text", required: false },
    { key: "ip_address", type: "varchar", size: 50, required: false },
  ];

  const success = await createTable(tablesDB, TABLE_IDS.pushSubscriptions, "Push Subscriptions", columns);
  if (!success) return;

  console.log("✅ Push Subscriptions table setup complete");
}

// Setup Push Notification Log table
async function setupPushNotificationLogTable(tablesDB: TablesDB) {
  console.log("\n📋 Setting up Push Notification Log table...");

  const columns = [
    // Link to subscription
    { key: "subscription_id", type: "varchar", size: 255, required: true },
    // Notification content
    { key: "title", type: "varchar", size: 255, required: true },
    { key: "body", type: "text", required: true },
    { key: "url", type: "varchar", size: 500, required: false },
    { key: "tag", type: "varchar", size: 100, required: false },
    { key: "image", type: "varchar", size: 500, required: false },
    // Status tracking (enum via varchar)
    { key: "status", type: "varchar", size: 20, required: true, default: "sent" },
    // Timestamps
    { key: "sent_at", type: "varchar", size: 50, required: false },
    { key: "clicked_at", type: "varchar", size: 50, required: false },
    { key: "dismissed_at", type: "varchar", size: 50, required: false },
    // Error tracking
    { key: "error_message", type: "text", required: false },
    { key: "error_code", type: "integer", required: false },
  ];

  const success = await createTable(tablesDB, TABLE_IDS.pushNotificationLog, "Push Notification Log", columns);
  if (!success) return;

  console.log("✅ Push Notification Log table setup complete");
}

// Update appwrite.config.json with new tables
function generateConfigUpdate() {
  console.log("\n📝 Add the following to your appwrite.config.json under 'tables':");
  console.log(JSON.stringify([
    {
      "$id": TABLE_IDS.pushSubscriptions,
      "$permissions": [
        'create("any")',
        'read("any")',
        'update("any")',
        'delete("any")'
      ],
      "databaseId": CONFIG.databaseId,
      "name": "Push Subscriptions",
      "enabled": true,
      "rowSecurity": false,
      "columns": [
        { "key": "endpoint", "type": "string", "required": true, "array": false, "size": 500 },
        { "key": "p256dh", "type": "string", "required": true, "array": false, "size": 255 },
        { "key": "auth", "type": "string", "required": true, "array": false, "size": 255 },
        { "key": "user_id", "type": "string", "required": false, "array": false, "size": 255 },
        { "key": "tags", "type": "string", "required": false, "array": false, "size": 500 },
        { "key": "status", "type": "string", "required": true, "array": false, "format": "enum", "elements": ["active", "inactive"], "default": "active" },
        { "key": "fail_count", "type": "integer", "required": true, "array": false, "default": 0 },
        { "key": "user_agent", "type": "string", "required": false, "array": false, "size": 500 },
        { "key": "ip_address", "type": "string", "required": false, "array": false, "size": 50 }
      ],
      "indexes": []
    },
    {
      "$id": TABLE_IDS.pushNotificationLog,
      "$permissions": [
        'create("label:admin")',
        'read("label:admin")',
        'update("label:admin")',
        'delete("label:admin")'
      ],
      "databaseId": CONFIG.databaseId,
      "name": "Push Notification Log",
      "enabled": true,
      "rowSecurity": false,
      "columns": [
        { "key": "subscription_id", "type": "string", "required": true, "array": false, "size": 255 },
        { "key": "title", "type": "string", "required": true, "array": false, "size": 255 },
        { "key": "body", "type": "string", "required": true, "array": false, "size": 1000 },
        { "key": "url", "type": "string", "required": false, "array": false, "size": 500 },
        { "key": "tag", "type": "string", "required": false, "array": false, "size": 100 },
        { "key": "image", "type": "string", "required": false, "array": false, "size": 500 },
        { "key": "status", "type": "string", "required": true, "array": false, "format": "enum", "elements": ["sent", "clicked", "dismissed", "failed", "delivered"], "default": "sent" },
        { "key": "error_message", "type": "string", "required": false, "array": false, "size": 500 },
        { "key": "error_code", "type": "integer", "required": false, "array": false }
      ],
      "indexes": [
        { "key": "idx_subscription_status", "type": "key", "attributes": ["subscription_id", "status"] },
        { "key": "idx_status_sent", "type": "key", "attributes": ["status", "sent_at"] }
      ]
    }
  ], null, 2));
}

// Print environment variable instructions
function printEnvInstructions() {
  console.log("\n📝 Add the following to your .env file:");
  console.log(`
# Push Notification Tables
NEXT_PUBLIC_APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID=${TABLE_IDS.pushSubscriptions}
NEXT_PUBLIC_APPWRITE_PUSH_LOG_TABLE_ID=${TABLE_IDS.pushNotificationLog}

# VAPID Keys (Generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:your-email@example.com

# Push API Secret (for protecting admin send endpoint)
PUSH_API_SECRET=your_random_secret_here
`);
}

// Main execution
async function main() {
  console.log("🚀 Push Notification Tables Setup");
  console.log("================================\n");

  validateConfig();
  console.log("✅ Environment variables validated\n");

  const tablesDB = createAdminClient();

  await setupPushSubscriptionsTable(tablesDB);
  await setupPushNotificationLogTable(tablesDB);

  console.log("\n✅ All tables setup complete!");
  
  printEnvInstructions();
  generateConfigUpdate();
  
  console.log("\n📝 Next steps:");
  console.log("   1. Add the environment variables to your .env file");
  console.log("   2. Generate VAPID keys: npx web-push generate-vapid-keys");
  console.log("   3. Update appwrite.config.json with the new table definitions");
  console.log("   4. Restart your development server");
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
