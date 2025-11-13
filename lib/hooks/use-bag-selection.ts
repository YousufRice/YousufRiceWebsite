import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart-store';
import { calculatePrice, getPricePerKg } from '@/lib/utils';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing bag selection logic
 * Shared between ProductCard and ProductDetailClient components
 */
export function useBagSelection(product: Product) {
  const [bagCounts, setBagCounts] = useState({ kg1: 0, kg5: 0, kg10: 0, kg25: 0 });
  const addBag = useCartStore((state) => state.addBag);
  const removeBag = useCartStore((state) => state.removeBag);
  const router = useRouter();

  // Calculate totals
  const totalKg = bagCounts.kg1 * 1 + bagCounts.kg5 * 5 + bagCounts.kg10 * 10 + bagCounts.kg25 * 25;
  const pricePerKg = getPricePerKg(product, totalKg || 1);
  const totalPrice = calculatePrice(product, totalKg || 0);

  /**
   * Add a bag of specified size to cart
   */
  const handleAddBag = (size: 1 | 5 | 10 | 25) => {
    const key = `kg${size}` as keyof typeof bagCounts;
    setBagCounts(prev => ({ ...prev, [key]: prev[key] + 1 }));
    addBag(product, size);
    toast.success(`Added ${size}kg bag of ${product.name} to cart!`);
  };

  /**
   * Remove a bag of specified size from cart
   */
  const handleRemoveBag = (size: 1 | 5 | 10 | 25) => {
    const key = `kg${size}` as keyof typeof bagCounts;
    if (bagCounts[key] > 0) {
      setBagCounts(prev => ({ ...prev, [key]: prev[key] - 1 }));
      removeBag(product.$id, size);
      toast.success(`Removed ${size}kg bag from cart!`);
    }
  };

  /**
   * Add all selected bags to cart (for "Add to Cart" button)
   */
  const handleAddToCart = () => {
    if (totalKg === 0) {
      toast.error('Please select at least one bag to add to cart!');
      return;
    }
    
    toast.success(`Added ${totalKg}kg of ${product.name} to cart!`, {
      icon: '🛒',
      style: {
        borderRadius: '12px',
        background: '#27247b',
        color: '#ffff03',
        fontWeight: 'bold',
      },
    });
  };

  /**
   * Buy now - proceed directly to checkout
   */
  const handleBuyNow = () => {
    if (totalKg === 0) {
      toast.error('Please select at least one bag to continue!');
      return;
    }
    
    toast.success('Proceeding to checkout!', {
      icon: '🚀',
      style: {
        borderRadius: '12px',
        background: '#27247b',
        color: '#ffff03',
        fontWeight: 'bold',
      },
    });
    router.push('/checkout');
  };

  return {
    bagCounts,
    totalKg,
    pricePerKg,
    totalPrice,
    handleAddBag,
    handleRemoveBag,
    handleAddToCart,
    handleBuyNow,
  };
}
