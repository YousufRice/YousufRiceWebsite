#!/usr/bin/env node
/**
 * Push Notification Tables Setup Script
 * Run with: pnpm dotenv tsx scripts/setup-push-tables.ts
 *
 * Uses the same Databases API pattern as recreate-database.js
 */

const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
};

const tableIds = {
  pushSubscriptions:
    process.env.NEXT_PUBLIC_APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID ||
    'push_subscriptions',
  pushNotificationLog:
    process.env.NEXT_PUBLIC_APPWRITE_PUSH_LOG_TABLE_ID ||
    'push_notification_log',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deleteCollectionIfExists(databases, collectionId, name) {
  try {
    await databases.deleteCollection(config.databaseId, collectionId);
    console.log(`🗑️  Deleted existing table "${name}"`);
    await sleep(1000);
  } catch (error) {
    if (error.code === 404) {
      console.log(`ℹ️  Table "${name}" doesn't exist yet. Skipping delete.`);
    } else {
      console.error(`❌ Failed to delete "${name}":`, error.message);
    }
  }
}

async function setupPushTables() {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const databases = new Databases(client);

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!config.endpoint || !config.projectId || !config.apiKey || !config.databaseId) {
    console.error('❌ Missing required environment variables. Check your .env file.');
    process.exit(1);
  }

  console.log('🚀 Push Notification Tables Setup');
  console.log('================================\n');
  console.log('✅ Environment validated\n');

  // ── Push Subscriptions ────────────────────────────────────────────────────
  console.log('📋 Creating Push Subscriptions table...');

  await deleteCollectionIfExists(databases, tableIds.pushSubscriptions, 'Push Subscriptions');

  await databases.createCollection(
    config.databaseId,
    tableIds.pushSubscriptions,
    'Push Subscriptions',
    [
      Permission.create(Role.any()),
      Permission.read(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ]
  );

  await databases.createStringAttribute(config.databaseId, tableIds.pushSubscriptions, 'endpoint',   500, true);
  await databases.createStringAttribute(config.databaseId, tableIds.pushSubscriptions, 'p256dh',     255, true);
  await databases.createStringAttribute(config.databaseId, tableIds.pushSubscriptions, 'auth',       255, true);
  await databases.createStringAttribute(config.databaseId, tableIds.pushSubscriptions, 'user_id',    255, false);
  await databases.createStringAttribute(config.databaseId, tableIds.pushSubscriptions, 'tags',       500, false);
  await databases.createEnumAttribute(
    config.databaseId,
    tableIds.pushSubscriptions,
    'status',
    ['active', 'inactive'],
    false,
    'active'
  );
  await databases.createIntegerAttribute(config.databaseId, tableIds.pushSubscriptions, 'fail_count', false, 0);
  await databases.createStringAttribute(config.databaseId, tableIds.pushSubscriptions, 'user_agent', 500, false);
  await databases.createStringAttribute(config.databaseId, tableIds.pushSubscriptions, 'ip_address',  50, false);

  console.log('✅ Push Subscriptions table created\n');

  // ── Push Notification Log ─────────────────────────────────────────────────
  console.log('📋 Creating Push Notification Log table...');

  await deleteCollectionIfExists(databases, tableIds.pushNotificationLog, 'Push Notification Log');

  await databases.createCollection(
    config.databaseId,
    tableIds.pushNotificationLog,
    'Push Notification Log',
    [
      Permission.create(Role.any()),
      Permission.read(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ]
  );

  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'subscription_id', 255,  true);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'title',           255,  true);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'body',            1000, true);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'url',             500,  false);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'tag',             100,  false);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'image',           500,  false);
  await databases.createEnumAttribute(
    config.databaseId,
    tableIds.pushNotificationLog,
    'status',
    ['sent', 'clicked', 'dismissed', 'failed', 'delivered'],
    false,
    'sent'
  );
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'sent_at',      50,  false);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'clicked_at',   50,  false);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'dismissed_at', 50,  false);
  await databases.createStringAttribute(config.databaseId, tableIds.pushNotificationLog, 'error_message', 500, false);
  await databases.createIntegerAttribute(config.databaseId, tableIds.pushNotificationLog, 'error_code',  false);

  // Indexes — wait for attributes to finish processing first
  console.log('   ⏳ Waiting for attributes to be ready before creating indexes...');
  await sleep(5000);

  await databases.createIndex(
    config.databaseId,
    tableIds.pushNotificationLog,
    'idx_subscription_status',
    'key',
    ['subscription_id', 'status']
  );
  await databases.createIndex(
    config.databaseId,
    tableIds.pushNotificationLog,
    'idx_status_sent',
    'key',
    ['status', 'sent_at']
  );

  console.log('✅ Push Notification Log table created\n');

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('🎉 All push notification tables created successfully!\n');
  console.log('📝 Add the following to your .env file:');
  console.log(`
NEXT_PUBLIC_APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID=${tableIds.pushSubscriptions}
NEXT_PUBLIC_APPWRITE_PUSH_LOG_TABLE_ID=${tableIds.pushNotificationLog}

# VAPID Keys (Generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:your-email@example.com

# Push API Secret (for protecting admin send endpoint)
PUSH_API_SECRET=your_random_secret_here
`);
}

setupPushTables().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  if (error.code) console.error('Error code:', error.code);
  process.exit(1);
});