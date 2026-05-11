#!/usr/bin/env node
/**
 * Splits env.example into apps/web/.env and apps/mobile/.env
 * Removes duplicate variable names by keeping the correct prefix per app.
 *
 * Run: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envExamplePath = path.join(rootDir, 'env.example');

function parseEnv(content) {
  const lines = content.split('\n');
  const entries = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      entries.push({ type: 'comment', value: line });
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      entries.push({ type: 'raw', value: line });
      continue;
    }
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    entries.push({ type: 'var', key, value, raw: line });
  }
  return entries;
}

function buildWebEnv(entries) {
  const out = [];
  for (const entry of entries) {
    if (entry.type === 'comment') {
      out.push(entry.value);
      continue;
    }
    if (entry.type === 'raw') {
      out.push(entry.value);
      continue;
    }
    const key = entry.key;
    // Skip EXPO_PUBLIC_* variables (mobile-only)
    if (key.startsWith('EXPO_PUBLIC_')) {
      continue;
    }
    // Skip mobile-only comments section
    if (entry.value.includes('Expo Mobile App')) {
      continue;
    }
    out.push(entry.raw);
  }
  return out.join('\n');
}

function buildMobileEnv(entries) {
  const out = [];
  let inMobileSection = false;
  for (const entry of entries) {
    if (entry.type === 'comment') {
      if (entry.value.includes('Expo Mobile App')) {
        inMobileSection = true;
        out.push(entry.value);
        continue;
      }
      // Skip web-only comments before mobile section
      if (!inMobileSection) {
        continue;
      }
      out.push(entry.value);
      continue;
    }
    if (entry.type === 'raw') {
      out.push(entry.value);
      continue;
    }
    const key = entry.key;
    // Keep EXPO_PUBLIC_* variables
    if (key.startsWith('EXPO_PUBLIC_')) {
      out.push(entry.raw);
      continue;
    }
    // Also keep server secrets that mobile might need (none for now)
  }
  return out.join('\n');
}

function main() {
  if (!fs.existsSync(envExamplePath)) {
    console.error('env.example not found at', envExamplePath);
    process.exit(1);
  }

  const content = fs.readFileSync(envExamplePath, 'utf-8');
  const entries = parseEnv(content);

  const webEnv = buildWebEnv(entries);
  const mobileEnv = buildMobileEnv(entries);

  const webEnvPath = path.join(rootDir, 'apps', 'web', '.env');
  const mobileEnvPath = path.join(rootDir, 'apps', 'mobile', '.env');

  fs.writeFileSync(webEnvPath, webEnv + '\n');
  console.log('Created', webEnvPath);

  fs.writeFileSync(mobileEnvPath, mobileEnv + '\n');
  console.log('Created', mobileEnvPath);

  console.log('\nNext steps:');
  console.log('1. Review apps/web/.env and fill in empty values');
  console.log('2. Review apps/mobile/.env and fill in empty values');
}

main();
