This is a pnpm workspace monorepo.
- apps/web: Next.js 16.2.4 (yousufrice.com)
- apps/mobile: Expo 55.0.23 (iOS + Android)

CRITICAL RULE for packages/*:
NEVER import from 'next/image', 'next/link', or any Next.js-specific API.
Use platform files: Component.web.tsx + Component.native.tsx.

Shared packages read config via factory functions, never process.env directly.
Each app passes its own env (NEXT_PUBLIC_* for web, EXPO_PUBLIC_* for Expo).
Appwrite Realtime is used for live product/banner/announcement/popup updates.