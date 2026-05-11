// Shared constants across web and mobile
// Collection IDs — same for both platforms
export const COLLECTIONS = {
  PRODUCTS: '6916ac06002cba46aaa9',
  ORDERS: '6916ac06002cd3573362',
  ORDER_ITEMS: 'order_items_table',
  CUSTOMERS: '6916ac06002cd811b613',
  ADDRESSES: '6916ac06002cdc8982bf',
  PRODUCT_IMAGES: '6916ac06002cd4ccd508',
  DISCOUNT_MANAGEMENT: 'discount_management',
  PUSH_SUBSCRIPTIONS: 'push_subscriptions',
  PUSH_LOG: 'push_notification_log',
  PUSH_TEMPLATES: 'push_templates',
  PUSH_PREFERENCES: 'push_user_preferences',
  NOTIFICATION_CAMPAIGNS: 'notification_campaigns',
  NOTIFICATION_ANALYTICS: 'notification_campaign_analytics',
  ANNOUNCEMENTS: 'announcements',
  POPUPS: 'popups',
} as const;

export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  BANNER_IMAGES: 'banner-images',
  NOTIFICATION_IMAGES: 'notification-images',
} as const;

export const DOMAINS = {
  PRIMARY: 'https://yousufrice.com',
  APPWRITE: 'https://yousufricemill.com',
} as const;

export const FEATURE_FLAGS = {
  ENABLE_LOYALTY_DISCOUNT: false,
  ENABLE_RAMADAN_OFFER: false,
  ENABLE_COLD_DRINK_BUNDLE: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
} as const;
