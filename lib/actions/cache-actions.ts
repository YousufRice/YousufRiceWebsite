'use server';

import { updateTag } from 'next/cache';
import { revalidatePath } from 'next/cache';

/**
 * Server Action to immediately clear ALL site-wide caches
 * Uses updateTag for immediate cache invalidation (read-your-own-writes)
 * This ensures the admin sees fresh data immediately after clearing cache
 */
export async function clearImageCache() {
  try {
    // Immediately expire all caches site-wide
    // updateTag provides immediate cache clearing (no stale-while-revalidate)
    updateTag('product-images');
    updateTag('products');
    updateTag('banner-images');
    updateTag('orders');
    updateTag('customers');
    updateTag('addresses');
    
    // Revalidate ALL paths to ensure complete site-wide cache refresh
    revalidatePath('/', 'layout'); // This clears the entire site layout cache
    
    return {
      success: true,
      message: 'All site cache cleared successfully! The entire site will reload with fresh data.',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return {
      success: false,
      error: 'Failed to clear site cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
