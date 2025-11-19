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
  $createdAt: string;
}

// NEW: Proper Order Item structure
export interface OrderItem {
  $id: string;
  order_id: string;
  product_id: string;

  // Product snapshot (prevents data loss if product is deleted/modified)
  product_name: string;
  product_description?: string;

  // Quantity information
  quantity_kg: number;

  // Bag breakdown for inventory tracking
  bags_1kg: number;
  bags_5kg: number;
  bags_10kg: number;
  bags_25kg: number;

  // Price information at time of order (CRITICAL for price integrity)
  price_per_kg_at_order: number;
  base_price_per_kg_at_order: number;

  // Tier pricing snapshot
  tier_applied?: string; // 'base', '2-4kg', '5-9kg', '10kg+'
  tier_price_at_order?: number;

  // Discount information
  discount_percentage: number;
  discount_amount: number;
  discount_reason?: string; // 'bulk_discount', 'promo_code', 'manual'

  // Calculated totals
  subtotal_before_discount: number;
  total_after_discount: number;

  // Additional metadata
  notes?: string;
  is_custom_price: boolean;

  $createdAt: string;
}

// Updated Order interface
export interface Order {
  $id: string;
  customer_id: string;
  address_id: string;

  // Legacy CSV field (kept for backward compatibility during migration)
  order_items?: string;

  // Summary fields (calculated from OrderItems)
  total_items_count?: number;
  total_weight_kg?: number;
  subtotal_before_discount?: number;
  total_discount_amount?: number;
  total_price: number; // final total after all discounts

  status:
    | "pending"
    | "accepted"
    | "out_for_delivery"
    | "delivered"
    | "returned";
  $createdAt: string;

  // Navigation properties (not stored in DB, populated by queries)
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

export interface Address {
  $id: string;
  customer_id: string;
  order_id: string;
  address_line: string;
  latitude: number;
  longitude: number;
  maps_url: string;
  $createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // in kg (calculated from bags)
  bags: {
    kg1: number; // count of 1kg bags
    kg5: number; // count of 5kg bags
    kg10: number; // count of 10kg bags
    kg25: number; // count of 25kg bags
  };
}

// For order creation
export interface CreateOrderItemRequest {
  product_id: string;
  quantity_kg: number;
  bags: {
    kg1: number;
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

// For order display with full details
export interface OrderWithDetails extends Order {
  items: OrderItem[];
  customer: Customer;
  address: Address;
}
