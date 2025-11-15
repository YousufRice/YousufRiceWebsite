'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Package, Sparkles, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useCartStore } from '@/lib/store/cart-store';
import { calculatePrice, formatCurrency, getPricePerKg } from '@/lib/utils';
import { storage, STORAGE_BUCKET_ID } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface SpecialDealCardProps {
  product: Product;
  imageFileId?: string;
}

export function SpecialDealCard({ product, imageFileId }: SpecialDealCardProps) {
  const [bagCount, setBagCount] = useState(0);
  const addBag = useCartStore((state) => state.addBag);
  const removeBag = useCartStore((state) => state.removeBag);
  const router = useRouter();

  const totalKg = bagCount * 25;
  const pricePerKg = getPricePerKg(product, totalKg || 25);
  const totalPrice = calculatePrice(product, totalKg || 0);

  const imageUrl = imageFileId
    ? storage.getFileView(STORAGE_BUCKET_ID, imageFileId).toString()
    : null;

  const handleAddBag = () => {
    setBagCount(prev => prev + 1);
    addBag(product, 25);
    toast.success(`Added 25kg bag of ${product.name} to cart!`, {
      icon: '🎉',
      style: {
        borderRadius: '12px',
        background: '#27247b',
        color: '#ffff03',
        fontWeight: 'bold',
      },
    });
  };

  const handleRemoveBag = () => {
    if (bagCount > 0) {
      setBagCount(prev => prev - 1);
      removeBag(product.$id, 25);
      toast.success(`Removed 25kg bag from cart!`);
    }
  };

  const handleBuyNow = () => {
    if (bagCount === 0) {
      toast.error('Please add at least one 25kg bag to continue!');
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

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-700 border-2 border-transparent hover:border-[#ffff03] bg-linear-to-br from-white via-white to-[#ffff03]/5 group relative">
      {/* Premium Badge */}
      <div className="absolute top-4 right-4 z-10 bg-linear-to-r from-[#ffff03] to-[#e6e600] text-[#27247b] px-4 py-2 rounded-full font-bold text-sm shadow-lg transform rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span>Bulk Deal</span>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Image Section */}
        <Link href={`/products/${product.$id}`} className="lg:w-2/5 relative group/image cursor-pointer">
          <div className="relative h-72 lg:h-[450px] bg-linear-to-br from-[#27247b]/5 via-[#ffff03]/10 to-[#27247b]/5 group-hover/image:from-[#27247b]/10 group-hover/image:to-[#ffff03]/20 transition-all duration-700 overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain p-6 group-hover/image:scale-110 transition-transform duration-1000 ease-out"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Package className="w-24 h-24 mx-auto mb-4 text-[#27247b]/20 animate-pulse" />
                  <p className="text-sm text-gray-600 font-medium">Premium Rice</p>
                </div>
              </div>
            )}
            
            {!product.available && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-2xl bg-red-600 px-8 py-4 rounded-full shadow-2xl">Out of Stock</span>
              </div>
            )}
            
            {/* Animated Border Glow */}
            <div className="absolute inset-0 border-4 border-transparent group-hover/image:border-[#ffff03]/60 transition-all duration-500 pointer-events-none rounded-lg"></div>
            
            {/* View Details Button */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 group-hover/image:scale-110 transition-all duration-500">
              <div className="flex items-center gap-3 bg-linear-to-r from-[#27247b] via-[#27247b] to-[#1a1854] px-6 py-3 rounded-full shadow-2xl group-hover/image:shadow-[#ffff03]/50 border-2 border-[#ffff03]">
                <span className="text-base font-bold text-white">View Full Details</span>
                <svg className="w-5 h-5 text-[#ffff03] transform group-hover/image:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Content Section */}
        <CardContent className="lg:w-3/5 p-6 lg:p-8 flex flex-col justify-between">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl lg:text-3xl font-bold text-[#27247b] mb-3 group-hover:text-[#1a1854] transition-colors leading-tight">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-base text-gray-600 leading-relaxed mb-4">{product.description}</p>
                )}
              </div>
            </div>

            {/* Bulk Pricing Highlight */}
            <div className="bg-linear-to-r from-[#27247b] via-[#27247b] to-[#1a1854] rounded-2xl p-6 relative overflow-hidden shadow-xl mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffff03] rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-white/70 mb-1 uppercase tracking-wider font-semibold">Bulk Price (25kg)</p>
                    <p className="text-4xl font-bold text-[#ffff03]">
                      {formatCurrency(pricePerKg)}
                      <span className="text-lg text-white/90 ml-2">/kg</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/70 mb-1">Per Bag</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(pricePerKg * 25)}</p>
                  </div>
                </div>
                
                {/* Savings Badge */}
                {product.has_tier_pricing && product.base_price_per_kg > pricePerKg && (
                  <div className="bg-[#ffff03] text-[#27247b] px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Save {formatCurrency((product.base_price_per_kg - pricePerKg) * 25)} per bag!
                  </div>
                )}
              </div>
            </div>

            {/* Tier Pricing Info */}
            {product.has_tier_pricing && (
              <div className="bg-linear-to-br from-[#ffff03]/15 via-[#ffff03]/10 to-transparent rounded-xl p-5 border-2 border-[#ffff03]/40 shadow-lg">
                <p className="text-sm font-bold text-[#27247b] mb-3 flex items-center gap-2">
                  <span className="text-xl">💰</span> 
                  <span>Volume Discounts Available</span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {product.tier_2_4kg_price && (
                    <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1 font-semibold">50-100kg</div>
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(product.tier_2_4kg_price)}/kg</div>
                    </div>
                  )}
                  {product.tier_5_9kg_price && (
                    <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1 font-semibold">125-225kg</div>
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(product.tier_5_9kg_price)}/kg</div>
                    </div>
                  )}
                  {product.tier_10kg_up_price && (
                    <div className="bg-linear-to-br from-[#ffff03] to-[#e6e600] rounded-lg p-3 shadow-lg border-2 border-[#ffff03]">
                      <div className="text-xs text-[#27247b]/80 mb-1 font-semibold">250kg+</div>
                      <div className="text-sm font-bold text-[#27247b]">{formatCurrency(product.tier_10kg_up_price)}/kg</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Section */}
          <div className="space-y-4">
            {/* Current Order Summary */}
            <div className="bg-linear-to-r from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-semibold">Total Weight</p>
                  <p className="text-3xl font-bold text-[#27247b]">{totalKg}kg</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">Total Price</p>
                  <p className="text-3xl font-bold text-[#27247b]">{formatCurrency(totalPrice)}</p>
                </div>
              </div>
              
              {/* Bag Counter */}
              <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-md border-2 border-[#ffff03]/30">
                <div className="flex items-center gap-4">
                  <div className="bg-linear-to-br from-[#27247b] to-[#1a1854] text-[#ffff03] rounded-xl px-5 py-3 text-lg font-bold shadow-lg">
                    25kg Bags
                  </div>
                  <span className="text-lg text-gray-700 font-semibold">
                    {bagCount > 0 ? `${bagCount} bag${bagCount > 1 ? 's' : ''}` : 'No bags selected'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleRemoveBag}
                    disabled={!product.available || bagCount === 0}
                    className="h-12 w-12 p-0 border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all duration-300"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleAddBag}
                    disabled={!product.available}
                    className="h-12 px-8 bg-linear-to-r from-[#ffff03] to-[#e6e600] hover:from-[#e6e600] hover:to-[#ffff03] text-[#27247b] font-bold border-2 border-[#ffff03] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Bag
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Add to Cart */}
            {bagCount > 0 && (
              <div className="bg-linear-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">
                    {bagCount} bag{bagCount > 1 ? 's' : ''} added to cart
                  </span>
                </div>
                <Link href="/cart">
                  <Button className="bg-green-600 hover:bg-green-700 text-white font-bold">
                    View Cart
                  </Button>
                </Link>
              </div>
            )}

            {/* Buy Now Button */}
            {bagCount > 0 && (
              <div className="mt-3 animate-in slide-in-from-bottom duration-500">
                <Button
                  onClick={handleBuyNow}
                  disabled={!product.available}
                  className="w-full h-14 bg-linear-to-r from-[#27247b] to-[#1a1854] hover:from-[#1a1854] hover:to-[#27247b] text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-[#ffff03]"
                >
                  <Zap className="w-6 h-6 mr-2 text-[#ffff03] animate-pulse" />
                  Buy Now - {formatCurrency(totalPrice)}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
