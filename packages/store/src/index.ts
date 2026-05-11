import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import type { CartItem, Product } from '@yousuf-rice/types';

type BagSize = 3 | 5 | 10 | 25;

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, isColdDrinkBundle?: boolean) => void;
  addBag: (product: Product, bagSize: BagSize, isColdDrinkBundle?: boolean) => void;
  removeBag: (productId: string, bagSize: BagSize, isColdDrinkBundle?: boolean) => void;
  removeItem: (productId: string, isColdDrinkBundle?: boolean) => void;
  updateQuantity: (productId: string, quantity: number, isColdDrinkBundle?: boolean) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isHighlighted: boolean;
  highlightCart: () => void;
}

function migrateLegacyCartItem(item: any): CartItem {
  if (!item.bags) {
    return { ...item, bags: { kg3: 0, kg5: 0, kg10: 0, kg25: 0 } };
  }
  return item as CartItem;
}

function calculatePrice(product: Product, quantity: number): number {
  if (!product.has_tier_pricing) return product.base_price_per_kg * quantity;
  if (quantity >= 10) return (product.tier_10kg_up_price || product.base_price_per_kg) * quantity;
  if (quantity >= 5) return (product.tier_5_9kg_price || product.base_price_per_kg) * quantity;
  if (quantity >= 2) return (product.tier_2_4kg_price || product.base_price_per_kg) * quantity;
  return product.base_price_per_kg * quantity;
}

export function createCartStore(storage?: PersistStorage<CartStore>) {
  return create<CartStore>()(
    persist(
      (set, get) => ({
        items: [],
        isOpen: false,
        setIsOpen: (isOpen) => set({ isOpen }),
        isHighlighted: false,
        highlightCart: () => {
          set({ isHighlighted: true });
          setTimeout(() => set({ isHighlighted: false }), 1000);
        },

        addItem: (product, quantity, isColdDrinkBundle = false) => {
          set((state) => {
            const existingItem = state.items.find(
              (item) => item.product.$id === product.$id && !!item.isColdDrinkBundle === isColdDrinkBundle
            );
            if (existingItem) {
              return {
                items: state.items.map((item) =>
                  item.product.$id === product.$id && !!item.isColdDrinkBundle === isColdDrinkBundle
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              };
            }
            return {
              items: [
                ...state.items,
                { product, quantity, bags: { kg3: 0, kg5: 0, kg10: 0, kg25: 0 }, isColdDrinkBundle },
              ],
            };
          });
        },

        addBag: (product, bagSize, isColdDrinkBundle = false) => {
          set((state) => {
            const existingItem = state.items.find(
              (item) => item.product.$id === product.$id && !!item.isColdDrinkBundle === isColdDrinkBundle
            );
            if (existingItem) {
              const newBags = { ...existingItem.bags };
              const bagKey = `kg${bagSize}` as keyof typeof newBags;
              newBags[bagKey] += 1;
              const newQuantity =
                newBags.kg3 * 3 + newBags.kg5 * 5 + newBags.kg10 * 10 + newBags.kg25 * 25;
              return {
                items: state.items.map((item) =>
                  item.product.$id === product.$id && !!item.isColdDrinkBundle === isColdDrinkBundle
                    ? { ...item, bags: newBags, quantity: newQuantity }
                    : item
                ),
              };
            }
            const bags = { kg3: 0, kg5: 0, kg10: 0, kg25: 0 };
            const bagKey = `kg${bagSize}` as keyof typeof bags;
            bags[bagKey] = 1;
            return {
              items: [...state.items, { product, quantity: bagSize, bags, isColdDrinkBundle }],
            };
          });
        },

        removeBag: (productId, bagSize, isColdDrinkBundle = false) => {
          set((state) => {
            const existingItem = state.items.find(
              (item) => item.product.$id === productId && !!item.isColdDrinkBundle === isColdDrinkBundle
            );
            if (!existingItem) return state;
            const newBags = { ...existingItem.bags };
            const bagKey = `kg${bagSize}` as keyof typeof newBags;
            if (newBags[bagKey] > 0) newBags[bagKey] -= 1;
            const newQuantity =
              newBags.kg3 * 3 + newBags.kg5 * 5 + newBags.kg10 * 10 + newBags.kg25 * 25;
            if (newQuantity === 0) {
              return {
                items: state.items.filter(
                  (item) => !(item.product.$id === productId && !!item.isColdDrinkBundle === isColdDrinkBundle)
                ),
              };
            }
            return {
              items: state.items.map((item) =>
                item.product.$id === productId && !!item.isColdDrinkBundle === isColdDrinkBundle
                  ? { ...item, bags: newBags, quantity: newQuantity }
                  : item
              ),
            };
          });
        },

        removeItem: (productId, isColdDrinkBundle = false) => {
          set((state) => ({
            items: state.items.filter(
              (item) => !(item.product.$id === productId && !!item.isColdDrinkBundle === isColdDrinkBundle)
            ),
          }));
        },

        updateQuantity: (productId, quantity, isColdDrinkBundle = false) => {
          set((state) => ({
            items: state.items.map((item) =>
              item.product.$id === productId && !!item.isColdDrinkBundle === isColdDrinkBundle
                ? { ...item, quantity }
                : item
            ),
          }));
        },

        clearCart: () => set({ items: [] }),

        getTotalPrice: () => {
          const { items } = get();
          return items.reduce((total, item) => total + calculatePrice(item.product, item.quantity), 0);
        },

        getTotalItems: () => {
          const { items } = get();
          return items.reduce((total, item) => {
            const totalBags = Object.values(item.bags || {}).reduce((sum: number, count: unknown) => sum + (count as number), 0);
            return total + totalBags;
          }, 0);
        },
      }),
      {
        name: 'cart-storage',
        storage,
        partialize: (state) => ({ items: state.items } as CartStore),
        onRehydrateStorage: () => (state) => {
          if (state?.items) {
            state.items = state.items.map(migrateLegacyCartItem);
          }
        },
      }
    )
  );
}

// Web default store (uses localStorage via default persist)
export const useCartStore = createCartStore();
