import type { Models } from 'appwrite';

// ===================== Appwrite Generated Types =====================

export enum OrdersStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}

export type Products = Models.Row & {
  name: string;
  has_tier_pricing: boolean;
  description: string | null;
  available: boolean;
  primary_image_id: string | null;
  tier_2_4kg_price: number | null;
  tier_5_9kg_price: number | null;
  tier_10kg_up_price: number | null;
  base_price_per_kg: number | null;
};

export type ProductImages = Models.Row & {
  file_id: string;
  product_id: string;
  is_primary: boolean | null;
  is_cold_drink_bundle: boolean | null;
};

export type Customers = Models.Row & {
  email: string | null;
  user_id: string;
  full_name: string;
  phone: string;
};

export type Orders = Models.Row & {
  address_id: string;
  customer_id: string;
  total_price: number;
  status: OrdersStatus;
  order_items: string;
  total_items_count: number | null;
  total_weight_kg: number | null;
  subtotal_before_discount: number | null;
  total_discount_amount: number | null;
  payment_method: string | null;
  transaction_id: string | null;
};

export type Addresses = Models.Row & {
  address_line: string;
  longitude: number;
  customer_id: string;
  latitude: number;
  order_id: string;
  maps_url: string | null;
  city: string | null;
};

export type OrderItems = Models.Row & {
  order_id: string;
  product_id: string;
  product_name: string;
  product_description: string | null;
  quantity_kg: number;
  bags_3kg: number | null;
  bags_5kg: number | null;
  bags_10kg: number | null;
  bags_25kg: number | null;
  price_per_kg_at_order: number;
  base_price_per_kg: number;
  tier_applied: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  subtotal_before_discount: number;
  total_after_discount: number;
  notes: string | null;
};

export type DiscountManagement = Models.Row & {
  type: string;
  customer_id: string | null;
  customer_name: string | null;
  card_status: string | null;
  total_purchases: number | null;
  total_purchase_amount: number | null;
  eligible_for_extra_discount: boolean;
  extra_discount_percentage: number | null;
  rule_name: string | null;
  discount_percentage: number | null;
  rule_active: boolean;
  discount_code: string | null;
  code_status: string | null;
  used_in_order_id: string | null;
  code_generated_at: string | null;
  code_used_at: string | null;
  is_enabled: boolean;
  order_id: string;
};

export type PushSubscriptions = Models.Row & {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
  tags: string | null;
  status: 'active' | 'inactive';
  fail_count: number;
  user_agent: string | null;
  ip_address: string | null;
};

export enum PushNotificationLogStatus {
  SENT = 'sent',
  CLICKED = 'clicked',
  DISMISSED = 'dismissed',
  FAILED = 'failed',
  DELIVERED = 'delivered',
}

export type PushNotificationLog = Models.Row & {
  subscription_id: string;
  title: string;
  body: string;
  url: string | null;
  tag: string | null;
  image: string | null;
  status: PushNotificationLogStatus;
  sent_at: string | null;
  clicked_at: string | null;
  dismissed_at: string | null;
  error_message: string | null;
  error_code: number | null;
};

// ===================== Application Types =====================

export interface Product {
  $id: string;
  name: string;
  description?: string;
  base_price_per_kg: number;
  has_tier_pricing: boolean;
  tier_2_4kg_price?: number;
  tier_5_9kg_price?: number;
  tier_10kg_up_price?: number;
  available: boolean;
  primary_image_id?: string;
  $createdAt: string;
}

export interface ProductImage {
  $id: string;
  product_id: string;
  file_id: string;
  is_primary: boolean;
  is_cold_drink_bundle?: boolean;
  $createdAt: string;
}

export interface OrderItem {
  $id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_description?: string;
  quantity_kg: number;
  bags_3kg: number;
  bags_5kg: number;
  bags_10kg: number;
  bags_25kg: number;
  price_per_kg_at_order: number;
  base_price_per_kg: number;
  tier_applied?: string;
  discount_percentage: number;
  discount_amount: number;
  subtotal_before_discount: number;
  total_after_discount: number;
  notes?: string;
  $createdAt: string;
}

export interface Order {
  $id: string;
  customer_id: string;
  address_id: string;
  order_items?: string;
  total_items_count?: number;
  total_weight_kg?: number;
  subtotal_before_discount?: number;
  total_discount_amount?: number;
  total_price: number;
  status: 'pending' | 'accepted' | 'out_for_delivery' | 'delivered' | 'returned';
  $createdAt: string;
  items?: OrderItem[];
  customer?: Customer;
  address?: Address;
}

export interface Customer {
  $id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  $createdAt: string;
}

export interface Address extends Addresses {}

export interface CartItem {
  product: Product;
  quantity: number;
  bags: {
    kg3: number;
    kg5: number;
    kg10: number;
    kg25: number;
  };
  isColdDrinkBundle?: boolean;
}

export interface CreateOrderItemRequest {
  product_id: string;
  quantity_kg: number;
  bags: {
    kg3: number;
    kg5: number;
    kg10: number;
    kg25: number;
  };
  discount?: {
    percentage: number;
    reason: string;
  };
  notes?: string;
  is_custom_price?: boolean;
  custom_price_per_kg?: number;
}

export interface CreateOrderRequest {
  customer_id: string;
  items: CreateOrderItemRequest[];
  address: {
    address_line: string;
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  customer: Customer;
  address?: Address;
}

export interface NotificationCampaign {
  $id: string;
  title: string;
  body: string;
  image_url?: string;
  target_url?: string;
  icon_url?: string;
  badge_url?: string;
  tag?: string;
  campaign_type: 'push' | 'in-app' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  is_active: boolean;
  sent_count: number;
  clicked_count: number;
  failed_count: number;
  delivered_count: number;
  dismissed_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_by?: string;
  target_segment: 'all' | 'active_users' | 'inactive_users' | 'custom';
  target_tags?: string[];
  actions?: Array<{ action: string; title: string; icon?: string }>;
  require_interaction: boolean;
  $createdAt: string;
}

export interface NotificationCampaignAnalytics {
  $id: string;
  campaign_id: string;
  subscription_id: string;
  event_type: 'sent' | 'delivered' | 'clicked' | 'dismissed' | 'failed';
  user_agent?: string;
  ip_address?: string;
  clicked_url?: string;
  error_code?: number;
  error_message?: string;
  event_at?: string;
  $createdAt: string;
}

export interface BannerImage {
  $id: string;
  file_id: string;
  url: string;
  alt?: string;
  order?: number;
  is_active: boolean;
  $createdAt: string;
}

export interface Announcement {
  $id: string;
  text: string;
  is_active: boolean;
  bg_color?: string;
  text_color?: string;
  $createdAt: string;
}

export interface PopupConfig {
  $id: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  delay_ms: number;
  $createdAt: string;
}
