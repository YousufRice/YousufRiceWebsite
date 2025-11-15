# PWA Setup Guide for Yousuf Rice

This document outlines the Progressive Web App (PWA) configuration for your Next.js 16 application.

## What's Been Implemented

### 1. Web App Manifest (`app/manifest.ts`)
- Already configured with your app details
- Defines how your app appears when installed on home screen
- Includes app name, icons, theme colors, and display mode

### 2. Service Worker (`public/sw.js`)
- Handles push notifications
- Manages notification clicks
- Lifecycle management (install, activate)
- Automatically caches and serves content

### 3. Security Headers (`next.config.ts`)
- Added specific headers for service worker (`/sw.js`)
- Prevents caching of service worker (ensures users get latest version)
- Implements Content Security Policy for service worker
- Maintains existing security headers for the app

### 4. PWA Install Component (`components/PWAInstall.tsx`)
- Automatically registers service worker
- Shows install prompt on compatible browsers
- Provides iOS-specific installation instructions
- Dismissible UI that doesn't annoy users

## Features

### ✅ Installation
- **Desktop/Android**: Shows native install prompt
- **iOS**: Shows instructions to use "Add to Home Screen"
- Gracefully handles browsers without PWA support

### ✅ Push Notifications
- Supports all modern browsers (Chrome, Firefox, Safari 16+, iOS 16.4+)
- Custom notification styling with your logo
- Vibration patterns on supported devices
- Click handling to open app when notification is tapped

### ✅ Security
- Service worker has strict Content Security Policy
- No caching of service worker (always fresh)
- All security headers properly configured
- HTTPS required for production

## Testing Locally

### 1. Run with HTTPS (Required for PWA)
```bash
npm run dev -- --experimental-https
```

### 2. Test Installation
- Open DevTools (F12)
- Go to Application → Manifest
- Verify manifest loads correctly
- Check Application → Service Workers
- Verify service worker is registered

### 3. Test on Mobile
- Use Chrome DevTools device emulation
- Or test on actual mobile device
- Look for install prompt

### 4. Test Push Notifications
- Subscribe to notifications (when prompted)
- Send test notification from your backend
- Verify notification appears

## Next Steps (Optional)

### 1. Add Offline Support
Create a more advanced service worker with offline caching:
```javascript
// Cache static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles.css',
        '/script.js',
      ])
    })
  )
})

// Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
```

### 2. Implement Push Notifications Backend
You'll need to:
- Generate VAPID keys for your server
- Store user subscriptions in database
- Send push notifications from backend API

### 3. Add App Icons
For best results, create icons at these sizes:
- 192x192px (Android home screen)
- 512x512px (Splash screen)
- 180x180px (iOS)

Place them in `public/` folder and update `app/manifest.ts`

### 4. Add Splash Screens
Configure splash screen images for iOS:
```html
<link rel="apple-touch-startup-image" href="/splash.png">
```

## Troubleshooting

### Service Worker Not Registering
- Ensure you're using HTTPS (or localhost)
- Check browser console for errors
- Verify `/sw.js` file exists in public folder

### Install Prompt Not Showing
- Must be HTTPS (or localhost for testing)
- Must have valid manifest
- Browser must support PWA (Chrome, Edge, Firefox, Safari)
- User must not have already installed the app

### Notifications Not Working
- Check browser notification permissions
- Verify service worker is registered
- Ensure VAPID keys are configured (for push notifications)
- Test with `next dev --experimental-https`

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Installation | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | 16+ | ✅ |
| Offline Support | ✅ | ✅ | ✅ | ✅ |

## Resources

- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-protocol)
