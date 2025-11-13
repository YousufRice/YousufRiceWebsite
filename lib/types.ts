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

export interface Order {
  $id: string;
  customer_id: string;
  address_id: string;
  order_items: string; // CSV format: productId:5kg,productId:10kg
  total_price: number;
  status: 'pending' | 'accepted' | 'out_for_delivery' | 'delivered';
  $createdAt: string;
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
    kg1: number;   // count of 1kg bags
    kg5: number;   // count of 5kg bags
    kg10: number;  // count of 10kg bags
    kg25: number;  // count of 25kg bags
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerKg: number;
  totalPrice: number;
}
