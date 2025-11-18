import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "../types";
import { calculatePrice } from "../utils";

type BagSize = 1 | 5 | 10 | 25;

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  addBag: (product: Product, bagSize: BagSize) => void;
  removeBag: (productId: string, bagSize: BagSize) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// Helper function to ensure cart items have bags structure
const migrateLegacyCartItem = (item: any): CartItem => {
  if (!item.bags) {
    // Legacy item without bags - convert quantity to bags
    return {
      ...item,
      bags: { kg1: 0, kg5: 0, kg10: 0, kg25: 0 },
    };
  }
  return item as CartItem;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.$id === product.$id
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.$id === product.$id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity,
                bags: { kg1: 0, kg5: 0, kg10: 0, kg25: 0 },
              },
            ],
          };
        });
      },

      addBag: (product, bagSize) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.$id === product.$id
          );

          if (existingItem) {
            const newBags = { ...existingItem.bags };
            const bagKey = `kg${bagSize}` as keyof typeof newBags;
            newBags[bagKey] += 1;

            const newQuantity =
              newBags.kg1 * 1 +
              newBags.kg5 * 5 +
              newBags.kg10 * 10 +
              newBags.kg25 * 25;

            return {
              items: state.items.map((item) =>
                item.product.$id === product.$id
                  ? { ...item, bags: newBags, quantity: newQuantity }
                  : item
              ),
            };
          }

          const bags = { kg1: 0, kg5: 0, kg10: 0, kg25: 0 };
          const bagKey = `kg${bagSize}` as keyof typeof bags;
          bags[bagKey] = 1;

          return {
            items: [
              ...state.items,
              {
                product,
                quantity: bagSize,
                bags,
              },
            ],
          };
        });
      },

      removeBag: (productId, bagSize) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.$id === productId
          );

          if (!existingItem) return state;

          const newBags = { ...existingItem.bags };
          const bagKey = `kg${bagSize}` as keyof typeof newBags;

          if (newBags[bagKey] > 0) {
            newBags[bagKey] -= 1;
          }

          const newQuantity =
            newBags.kg1 * 1 +
            newBags.kg5 * 5 +
            newBags.kg10 * 10 +
            newBags.kg25 * 25;

          // Remove item if no bags left
          if (newQuantity === 0) {
            return {
              items: state.items.filter(
                (item) => item.product.$id !== productId
              ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.product.$id === productId
                ? { ...item, bags: newBags, quantity: newQuantity }
                : item
            ),
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.$id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.$id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          return total + calculatePrice(item.product, item.quantity);
        }, 0);
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          // Sum up all the bags (1kg, 5kg, 10kg, 25kg)
          const totalBags = Object.values(item.bags || {}).reduce(
            (sum, count) => sum + count,
            0
          );
          return total + totalBags;
        }, 0);
      },
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        // Migrate legacy cart items when loading from storage
        if (state?.items) {
          state.items = state.items.map(migrateLegacyCartItem);
        }
      },
    }
  )
);
