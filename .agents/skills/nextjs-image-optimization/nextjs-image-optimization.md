---
name: nextjs-image-optimization
description: Best practices for implementing Next.js 16.2.3 Image Optimization across the application
---

# Next.js 16.2.3 Image Optimization Skill

This project uses Next.js 16.2.3 which bundles `sharp` internally for high-performance image optimization. When working with images across the codebase, strictly adhere to the following best practices to maximize Core Web Vitals, minimize bandwidth, and prevent Cumulative Layout Shift (CLS).

## 1. Global Configuration (`next.config.ts`)
- **Remote Patterns**: External domains (like Appwrite storage buckets) MUST be whitelisted in `remotePatterns`.
- **Formats**: Prioritize `formats: ["image/avif", "image/webp"]`. AVIF is up to 50% smaller than WebP and should be the first choice.
- **Caching**: Images should have an explicit `minimumCacheTTL` (e.g., 30 days) to prevent constant re-optimization of static external assets.

## 2. Component Implementation Practices

### A. The `<Image />` Tag Usage
- NEVER use plain HTML `<img>` tags. ALWAYS use `next/image`.
- ALWAYS use the `fill` property combined with `className="object-cover"` (or `object-contain`) within a container that has `position: relative`, `width`, and `height`. This completely eliminates layout shift (CLS).

### B. Intelligent Quality Tuning (`quality` prop)
Next.js defaults to `quality={75}`. Optimize this based on the visual context:
- **Hero/LCP Elements (Banners)**: Use `quality={85}` for high visual fidelity on prominent screen elements.
- **Grid Cards/Thumbnails**: Use `quality={75}`. The visual compression is imperceptible at grid scale, saving significant bandwidth.
- **Tiny UI Elements (Cart Items, Avatars)**: Use `quality={60}` for elements ~100px or smaller.
- **Background Blurs**: For decorative heavy blurred images, use `quality={30}`. Do not waste bytes on details that are obscured.

### C. Priority Loading (`priority` prop)
- ONLY apply `priority={true}` or `priority` to the Largest Contentful Paint (LCP) element (typically the first Hero image above the fold).
- NEVER use `priority` on images located below the fold (e.g., product grids, footer elements). Let Next.js natively lazy-load them.

### D. Layout Sizing (`sizes` prop)
- ALWAYS provide a `sizes` prop when using `fill`.
- Avoid lazy wildcard sizes like `sizes="100vw"` unless the image literally spans edge-to-edge on mobile AND desktop.
- **Example for grid cards**: `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`

### E. Screen Readers & SEO
- Meaningful images MUST have descriptive `alt` text.
- Purely decorative images (like blurred backgrounds or background shapes) MUST use `alt=""` and `aria-hidden="true"`.

## Reference Example
```tsx
import Image from "next/image";

// Good: Grid Image Profile
<Image
  src={imageUrl}
  alt={product.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  quality={75} // visually invisible compression
/>

// Good: Hero LCP Image
<Image
  src={heroImageUrl}
  alt="Summer Sale Banner"
  fill
  className="object-cover"
  sizes="100vw"
  priority={true} // LCP preload
  quality={85} // Crisp quality
/>

// Good: Blurred Decorative Background
<Image
  src={bgUrl}
  alt=""
  aria-hidden="true"
  fill
  className="object-cover blur-3xl opacity-50"
  sizes="100vw"
  quality={30} // Max compression for blur
/>
```
