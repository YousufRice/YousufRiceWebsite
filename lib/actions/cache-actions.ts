'use server';

import { updateTag } from 'next/cache';
import { revalidatePath } from 'next/cache';

/**
 * Server Action to immediately clear all product and image caches
 * Uses updateTag for immediate cache invalidation (read-your-own-writes)
 * This ensures the admin sees fresh data immediately after clearing cache
 */
export async function clearImageCache() {
  try {
    // Immediately expire all product and image related caches
    // updateTag provides immediate cache clearing (no stale-while-revalidate)
    updateTag('product-images');
    updateTag('products');
    updateTag('banner-images');
    
    // Also revalidate the paths to ensure full refresh
    revalidatePath('/', 'layout');
    revalidatePath('/products/[id]', 'page');
    
    return {
      success: true,
      message: 'Image cache cleared successfully! Images will reload with fresh data.',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return {
      success: false,
      error: 'Failed to clear image cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
