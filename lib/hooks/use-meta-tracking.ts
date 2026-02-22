'use client';

import { useCallback } from 'react';
import {
  generateEventId,
  getFacebookCookies,
  sanitizeCustomerNameForMeta,
  type MetaCustomData
} from '@/lib/meta';

// Get test event code from environment variable
const TEST_EVENT_CODE = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE || '';

// Extend Window interface for Meta Pixel
declare global {
  interface Window {
    fbq?: (
      action: string,
      eventName: string,
      data?: Record<string, any>,
      options?: { eventID: string }
    ) => void;
  }
}

interface TrackEventParams {
  eventName: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  };
  customData?: MetaCustomData;
  testEventCode?: string;
}

export function useMetaTracking() {
  // Track event on both browser (Pixel) and server (Conversions API)
  const trackEvent = useCallback(async ({
    eventName,
    userData = {},
    customData = {},
    testEventCode,
  }: TrackEventParams) => {
    try {
      // Generate unique event ID for deduplication
      const eventId = generateEventId();
      const eventSourceUrl = typeof window !== 'undefined' ? window.location.href : undefined;

      // Get Facebook cookies
      const { fbp, fbc } = getFacebookCookies();

      // 1. Browser-side: Track with Meta Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, customData, { eventID: eventId });
        console.log(`[Meta Pixel] ${eventName} tracked with ID: ${eventId}`);
      }

      // 2. Server-side: Send to Conversions API via our endpoint
      const response = await fetch('/api/meta-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: eventName,
          event_id: eventId,
          event_source_url: eventSourceUrl,
          user_data: {
            ...userData,
            firstName: userData.firstName ? sanitizeCustomerNameForMeta(userData.firstName) : undefined,
            lastName: userData.lastName ? sanitizeCustomerNameForMeta(userData.lastName) : undefined,
            fbp,
            fbc,
          },
          custom_data: customData,
          test_event_code: testEventCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Meta Conversions API] Error:', error);
        return { success: false, error: error.error };
      }

      const result = await response.json();
      const testModeIndicator = testEventCode ? ' [TEST MODE]' : '';
      console.log(`[Meta Conversions API] ${eventName} sent with ID: ${eventId}${testModeIndicator}`);

      return { success: true, eventId };
    } catch (error) {
      console.error('[Meta Tracking] Error:', error);
      return { success: false, error: 'Tracking failed' };
    }
  }, []);

  // Convenience methods for common events
  const trackPageView = useCallback(() => {
    return trackEvent({ eventName: 'PageView' });
  }, [trackEvent]);

  const trackViewContent = useCallback((productData: {
    contentName: string;
    contentId: string;
    contentType?: string;
    value?: number;
    currency?: string;
    userData?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      externalId?: string;
    };
  }) => {
    return trackEvent({
      eventName: 'ViewContent',
      userData: productData.userData,
      customData: {
        content_name: productData.contentName,
        content_ids: [productData.contentId],
        content_type: productData.contentType || 'product',
        value: productData.value,
        currency: productData.currency || 'PKR',
      },
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((cartData: {
    contentName: string;
    contentId: string;
    value: number;
    currency?: string;
    quantity?: number;
    userData?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      externalId?: string;
    };
  }) => {
    return trackEvent({
      eventName: 'AddToCart',
      userData: cartData.userData,
      customData: {
        content_name: cartData.contentName,
        content_ids: [cartData.contentId],
        content_type: 'product',
        value: cartData.value,
        currency: cartData.currency || 'PKR',
        contents: [{
          id: cartData.contentId,
          quantity: cartData.quantity || 1,
          item_price: cartData.value,
        }],
      },
      testEventCode: TEST_EVENT_CODE || undefined,
    });
  }, [trackEvent]);

  const trackInitiateCheckout = useCallback((checkoutData: {
    value: number;
    currency?: string;
    numItems: number;
    contentIds: string[];
    userData?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      externalId?: string;
    };
  }) => {
    return trackEvent({
      eventName: 'InitiateCheckout',
      userData: checkoutData.userData,
      customData: {
        value: checkoutData.value,
        currency: checkoutData.currency || 'PKR',
        num_items: checkoutData.numItems,
        content_ids: checkoutData.contentIds,
        content_type: 'product',
      },
    });
  }, [trackEvent]);

  const trackPurchase = useCallback((purchaseData: {
    value: number;
    currency?: string;
    orderId: string;
    numItems: number;
    contentIds: string[];
    contents: Array<{
      id: string;
      quantity: number;
      item_price: number;
    }>;
    userData?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      externalId?: string;
    };
  }) => {
    return trackEvent({
      eventName: 'Purchase',
      userData: purchaseData.userData,
      customData: {
        value: purchaseData.value,
        currency: purchaseData.currency || 'PKR',
        content_ids: purchaseData.contentIds,
        content_type: 'product',
        num_items: purchaseData.numItems,
        contents: purchaseData.contents,
      },
      testEventCode: TEST_EVENT_CODE || undefined,
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchQuery: string) => {
    return trackEvent({
      eventName: 'Search',
      customData: {
        search_string: searchQuery,
      },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
  };
}
