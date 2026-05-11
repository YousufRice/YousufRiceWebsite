#!/usr/bin/env node
/**
 * Creates the announcements and popups collections in Appwrite.
 *
 * Required env vars (from root .env or env.example):
 *   APPWRITE_API_KEY
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   NEXT_PUBLIC_APPWRITE_DATABASE_ID
 *
 * Run: node scripts/setup-appwrite-collections.js
 */

const fs = require('fs');
const path = require('path');

// Load env from apps/web/.env manually (dotenv may not be installed)
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', 'apps', 'web', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !databaseId || !apiKey) {
  console.error('Missing required env vars. Need: APPWRITE_API_KEY, NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID');
  process.exit(1);
}

async function request(method, path, body = null) {
  const url = `${endpoint}${path}`;
  const headers = {
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Appwrite API error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function createCollection(collectionId, name, attributes, permissions = []) {
  let collection;
  try {
    collection = await request('GET', `/databases/${databaseId}/collections/${collectionId}`);
    console.log(`Collection "${name}" already exists.`);
  } catch {
    collection = await request('POST', `/databases/${databaseId}/collections`, {
      collectionId,
      name,
      documentSecurity: false,
      permissions,
    });
    console.log(`Created collection: ${name} (${collectionId})`);
  }

  // Get existing attributes to avoid duplicates
  const existingAttrsRes = await request('GET', `/databases/${databaseId}/collections/${collectionId}/attributes`);
  const existingKeys = new Set((existingAttrsRes.attributes || []).map((a) => a.key));

  for (const attr of attributes) {
    if (existingKeys.has(attr.key)) {
      console.log(`  Attribute already exists: ${attr.key}`);
      continue;
    }
    await request('POST', `/databases/${databaseId}/collections/${collectionId}/attributes/${attr.type}`, {
      key: attr.key,
      size: attr.size || undefined,
      required: attr.required ?? false,
      default: attr.default ?? undefined,
      array: attr.array ?? false,
    });
    console.log(`  Added attribute: ${attr.key}`);
  }

  return collection;
}

async function main() {
  console.log('Creating Appwrite collections...\n');

  // Announcements collection
  await createCollection('announcements', 'Announcements', [
    { key: 'text', type: 'string', size: 500, required: true },
    { key: 'is_active', type: 'boolean', required: false, default: true },
    { key: 'bg_color', type: 'string', size: 50, required: false },
    { key: 'text_color', type: 'string', size: 50, required: false },
  ]);

  // Popups collection
  await createCollection('popups', 'Popups', [
    { key: 'image_url', type: 'string', size: 500, required: true },
    { key: 'link_url', type: 'string', size: 500, required: false },
    { key: 'is_active', type: 'boolean', required: false, default: true },
    { key: 'delay_ms', type: 'integer', required: false, default: 3000 },
  ]);

  console.log('\nAll collections created successfully!');
  console.log('You can now manage announcements and popups from the Appwrite console.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
