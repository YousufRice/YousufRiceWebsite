# Page Transitions Guide for Yousuf Rice Website

This guide explains how page transitions have been implemented in the Yousuf Rice website using React 19 and Next.js 16's View Transitions API.

## Overview

The implementation uses React 19's `<ViewTransition>` component combined with Next.js 16's `viewTransition` configuration to create smooth, animated transitions between pages. The solution is built on the browser's native View Transitions API with enhanced CSS animations that include subtle scaling, opacity changes, and blur effects for a more polished user experience.

## Features

- **Multiple Transition Types**: Fade, slide, and scale transitions
- **Directional Transitions**: Forward and backward navigation animations
- **Named Element Transitions**: Shared elements that animate between pages
- **Reduced Motion Support**: Respects user preferences for reduced motion
- **Progressive Enhancement**: Falls back gracefully on unsupported browsers

## Implementation Details

### 1. Configuration

The View Transitions API is enabled in `next.config.ts`:

```typescript
// next.config.ts
experimental: {
  // Other experimental features...
  viewTransition: true,
}
```

### 2. CSS Transitions

Enhanced transition animations are defined in `app/globals.css`:

```css
/* Base view transitions with CSS variables for dynamic control */
:root {
  --transition-duration: 600ms;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: var(--transition-duration);
  animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
  will-change: transform, opacity;
}

/* Fade transition with subtle scaling */
@keyframes fade-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.98); }
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(1.02); }
  to { opacity: 1; transform: scale(1); }
}

/* Slide transitions with opacity */
@keyframes slide-out-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(30%); opacity: 0; }
}

/* Scale transitions with blur effect */
@keyframes scale-out {
  from { opacity: 1; transform: scale(1); filter: blur(0); }
  to { opacity: 0; transform: scale(0.92); filter: blur(4px); }
}

/* Named element transitions with custom timing */
::view-transition-old(hero),
::view-transition-new(hero) {
  animation-duration: 800ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Page transition helper class */
.transition-page {
  transition: filter 0.3s ease;
}

/* Route-specific transition styles */
[data-transition="slide"] { ... }
[data-transition="scale"] { ... }
[data-transition="fade"] { ... }

/* Directional transitions */
[data-direction="forward"] { ... }
[data-direction="backward"] { ... }
```

### 3. Components

#### Template Component

The enhanced `app/template.tsx` file wraps all pages with React 19's `<ViewTransition>` component and tracks transition state:

```tsx
// app/template.tsx
'use client'

import { ViewTransition } from 'react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Track when transitions start and end
  useEffect(() => {
    const handleNavigationStart = () => {
      setIsTransitioning(true)
    }
    
    const handleNavigationComplete = () => {
      // Small delay to ensure transition completes
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }
    
    // Listen for navigation events
    window.addEventListener('startViewTransition', handleNavigationStart)
    window.addEventListener('pageshow', handleNavigationComplete)
    
    return () => {
      window.removeEventListener('startViewTransition', handleNavigationStart)
      window.removeEventListener('pageshow', handleNavigationComplete)
    }
  }, [])
  
  return (
    <ViewTransition>
      <div 
        key={pathname}
        className={`transition-page ${isTransitioning ? 'transitioning' : ''}`}
      >
        {children}
      </div>
    </ViewTransition>
  )
}
```

#### TransitionLink Component

The enhanced `TransitionLink` component handles transitions between pages with custom durations and prevents multiple transitions from firing simultaneously:

```tsx
// components/TransitionLink.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ComponentProps, useState } from 'react'

type TransitionType = 'fade' | 'slide' | 'scale'
type DirectionType = 'forward' | 'backward'

interface TransitionLinkProps extends ComponentProps<typeof Link> {
  transitionType?: TransitionType
  direction?: DirectionType
  duration?: number
}

export function TransitionLink({ 
  href, 
  transitionType = 'fade',
  direction,
  duration = 600,
  children,
  className,
  ...props 
}: TransitionLinkProps) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    if (isTransitioning) return // Prevent multiple transitions
    setIsTransitioning(true)
    
    // Set transition type and custom duration
    document.documentElement.dataset.transition = transitionType
    document.documentElement.style.setProperty('--transition-duration', `${duration}ms`)
    
    if (direction) {
      document.documentElement.dataset.direction = direction
    }

    // Dispatch custom event for template component
    window.dispatchEvent(new Event('startViewTransition'))

    // Use View Transitions API with proper cleanup
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        router.push(href.toString())
      })
      
      transition.finished.finally(() => {
        setIsTransitioning(false)
        document.documentElement.style.removeProperty('--transition-duration')
      })
    } else {
      router.push(href.toString())
      setTimeout(() => setIsTransitioning(false), 500)
    }
  }

  return (
    <Link 
      href={href} 
      onClick={handleClick} 
      className={`${className || ''} ${isTransitioning ? 'transitioning' : ''}`}
      {...props}
    >
      {children}
    </Link>
  )
}
```

#### TransitionProvider

The `TransitionProvider` component provides context for transitions:

```tsx
// components/TransitionProvider.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export function TransitionProvider({ children }) {
  // Implementation details...
}

export function useTransition() {
  // Hook implementation...
}
```

### 4. Usage

#### Basic Usage with Custom Duration

```tsx
import { TransitionLink } from '@/components/TransitionLink'

// In your component:
<TransitionLink 
  href="/about" 
  transitionType="fade"
  duration={700} // Custom duration in milliseconds
  className="your-styles"
>
  About Us
</TransitionLink>
```

#### Directional Transitions

```tsx
import { DirectionalLink } from '@/components/DirectionalLink'

// In your component:
<DirectionalLink 
  href="/products" 
  direction="forward"
  duration={850} // Longer duration for more dramatic effect
  className="your-styles"
>
  View Products
</DirectionalLink>
```

#### Named Element Transitions

```tsx
// Shared elements across pages with enhanced transitions
<img 
  src="/logo.png" 
  alt="Logo"
  className="transition-image" // This class sets view-transition-name with custom animation
/>

// Title that transitions between pages
<h1 className="transition-title text-4xl font-bold mb-8">
  Page Title
</h1>
```

#### Transition Provider Context

```tsx
import { useTransition } from '@/components/TransitionProvider'

function MyComponent() {
  const { setTransitionType, setDirection } = useTransition()
  
  // Set transition type programmatically
  useEffect(() => {
    setTransitionType('scale')
  }, [])
  
  // Later in your component...
  return (
    <button onClick={() => setDirection('backward')}>
      Go Back with Animation
    </button>
  )
}
```

## Demo Page

A demo page is available at `/transitions` that showcases all transition types.

## Browser Support

The View Transitions API is supported in:
- Chrome 111+
- Edge 111+
- Opera 97+
- Safari 17.4+

For unsupported browsers, the implementation falls back to regular page navigation without animations.

## References

- [React ViewTransition Documentation](https://react.dev/reference/react/ViewTransition)
- [Next.js View Transition Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition)
- [MDN View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
