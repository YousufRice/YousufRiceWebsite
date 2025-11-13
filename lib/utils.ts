import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Product } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePrice(product: Product, quantity: number): number {
  if (!product.has_tier_pricing) {
    return product.base_price_per_kg * quantity;
  }

  let pricePerKg = product.base_price_per_kg;

  if (quantity >= 10 && product.tier_10kg_up_price) {
    pricePerKg = product.tier_10kg_up_price;
  } else if (quantity >= 5 && product.tier_5_9kg_price) {
    pricePerKg = product.tier_5_9kg_price;
  } else if (quantity >= 2 && product.tier_2_4kg_price) {
    pricePerKg = product.tier_2_4kg_price;
  }

  return pricePerKg * quantity;
}

export function getPricePerKg(product: Product, quantity: number): number {
  if (!product.has_tier_pricing) {
    return product.base_price_per_kg;
  }

  if (quantity >= 10 && product.tier_10kg_up_price) {
    return product.tier_10kg_up_price;
  } else if (quantity >= 5 && product.tier_5_9kg_price) {
    return product.tier_5_9kg_price;
  } else if (quantity >= 2 && product.tier_2_4kg_price) {
    return product.tier_2_4kg_price;
  }

  return product.base_price_per_kg;
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString()}`;
}

export function calculateSavings(product: Product, quantity: number): { 
  originalPrice: number; 
  discountedPrice: number; 
  savings: number; 
  savingsPercentage: number;
  tierApplied: string | null;
} {
  const originalPrice = product.base_price_per_kg * quantity;
  const discountedPrice = calculatePrice(product, quantity);
  const savings = originalPrice - discountedPrice;
  const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;
  
  let tierApplied: string | null = null;
  
  if (product.has_tier_pricing && savings > 0) {
    if (quantity >= 10 && product.tier_10kg_up_price) {
      tierApplied = '10+ kg tier';
    } else if (quantity >= 5 && product.tier_5_9kg_price) {
      tierApplied = '5-9 kg tier';
    } else if (quantity >= 2 && product.tier_2_4kg_price) {
      tierApplied = '2-4 kg tier';
    }
  }
  
  return {
    originalPrice,
    discountedPrice,
    savings,
    savingsPercentage,
    tierApplied
  };
}

export function generateMapsUrl(latitude: number, longitude: number, platform: 'ios' | 'android' | 'web' = 'web'): string {
  if (platform === 'ios') {
    return `https://maps.apple.com/?q=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function parseOrderItems(orderItemsCSV: string): Array<{ productId: string; quantity: number }> {
  return orderItemsCSV.split(',').map(item => {
    const [productId, quantityStr] = item.split(':');
    return {
      productId,
      quantity: parseFloat(quantityStr.replace('kg', ''))
    };
  });
}

export function formatOrderItems(items: Array<{ productId: string; quantity: number }>): string {
  return items.map(item => `${item.productId}:${item.quantity}kg`).join(',');
}