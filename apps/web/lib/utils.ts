import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Web-only helper: tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export all platform-agnostic utilities from shared package
export {
  calculatePrice,
  getPricePerKg,
  formatCurrency,
  calculateSavings,
  generateMapsUrl,
  parseOrderItems,
  formatOrderItems,
  calculateTierPricing,
  calculateItemTotal,
  calculateBagsFromQuantity,
  calculateQuantityFromBags,
  validatePakistaniPhoneNumber,
  formatPhoneNumber,
  formatPhoneNumberForDisplay,
} from '@yousuf-rice/utils';
