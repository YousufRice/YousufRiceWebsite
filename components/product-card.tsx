'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Eye, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { formatCurrency } from '@/lib/utils';
import { storage, STORAGE_BUCKET_ID } from '@/lib/appwrite';
import { useBagSelection } from '@/lib/hooks/use-bag-selection';

interface ProductCardProps {
  product: Product;
  imageFileId?: string;
}

export function ProductCard({ product, imageFileId }: ProductCardProps) {
  const [isBuyNowHovered, setIsBuyNowHovered] = useState(false);
  const {
    bagCounts,
    totalKg,
    pricePerKg,
    totalPrice,
    handleAddBag,
    handleRemoveBag,
    handleBuyNow,
  } = useBagSelection(product);

  const imageUrl = imageFileId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageFileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 border-2 border-transparent hover:border-[#ffff03] bg-linear-to-br from-white to-gray-50 group">
      <div className="flex flex-col md:flex-row">
        {/* Image Section - Left Side */}
        <Link href={`/products/${product.$id}`} className="md:w-1/2 relative group/image cursor-pointer">
          <div className="relative h-56 md:h-auto md:min-h-[400px] bg-linear-to-br from-[#27247b]/5 to-[#ffff03]/10 group-hover/image:from-[#27247b]/20 group-hover/image:to-[#ffff03]/30 transition-all duration-500 overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain p-4 group-hover/image:scale-110 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-3 animate-pulse">🌾</div>
                  <p className="text-xs text-gray-600 font-medium">No Image</p>
                </div>
              </div>
            )}
            {!product.available && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-xl bg-red-600 px-6 py-3 rounded-full">Out of Stock</span>
              </div>
            )}
            
            {/* Subtle Micro-interactions */}
            {/* Minimal fade overlay */}
            <div className="absolute inset-0 bg-[#27247b]/0 group-hover/image:bg-[#27247b]/5 transition-all duration-300"></div>
            
            {/* Border highlight on hover */}
            <div className="absolute inset-0 border-4 border-transparent group-hover/image:border-[#ffff03]/40 transition-all duration-300 pointer-events-none"></div>
            
            {/* Decorative Corner Badge with subtle animation - Only for non-Bachat products */}
            {!product.name.toLowerCase().includes('bachat') && (
              <div className="absolute top-4 left-4 bg-[#ffff03] text-[#27247b] px-4 py-2 rounded-full font-bold text-sm shadow-lg transform -rotate-2 group-hover/image:rotate-0 group-hover/image:shadow-xl transition-all duration-300">
                Premium Quality
              </div>
            )}
            
            {/* Always Visible "View Details" with attention-grabbing effects */}
            <div className="absolute bottom-4 right-4 transform group-hover/image:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2 bg-linear-to-r from-[#27247b] to-[#27247b]/90 px-4 py-2.5 rounded-full shadow-lg group-hover/image:shadow-2xl animate-pulse hover:animate-none">
                <span className="text-sm font-bold text-white">View Details & Images</span>
                <svg className="w-4 h-4 text-[#ffff03] transform group-hover/image:translate-x-1 transition-transform duration-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Content Section - Right Side */}
        <CardContent className="md:w-1/2 p-3 md:p-4 flex flex-col justify-between">
          {/* Header */}
          <div className={product.has_tier_pricing ? 'mb-2' : 'mb-0'}>
            <h3 className="text-lg font-bold text-[#27247b] mb-1.5 group-hover:text-[#27247b]/80 transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{product.description}</p>
            )}

            {/* Base Price Display with Enhanced Styling */}
            <div className={`bg-linear-to-r from-[#27247b] to-[#27247b]/90 rounded-lg p-2.5 relative overflow-hidden ${product.has_tier_pricing ? 'mb-2' : 'mb-0'}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#ffff03] rounded-full blur-3xl opacity-20"></div>
              <div className="relative">
                {product.has_tier_pricing && (
                  <p className="text-xs text-white/70 mb-0.5 uppercase tracking-wider">Starting from</p>
                )}
                <p className="text-xl font-bold text-[#ffff03]">
                  {formatCurrency(product.base_price_per_kg)}
                  <span className="text-xs text-white/90 ml-1">/kg</span>
                </p>
              </div>
            </div>

            {/* Quantity Discounts */}
            {product.has_tier_pricing && (
              <div className="bg-linear-to-br from-[#ffff03]/10 to-[#ffff03]/5 rounded-md p-2 border border-[#ffff03]/30">
                <p className="text-xs font-bold text-[#27247b] mb-1 flex items-center">
                  <span className="text-sm mr-1">💰</span> 
                  <span>Special Discounts</span>
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {product.tier_2_4kg_price && (
                    <div className="bg-white rounded p-1 shadow-sm">
                      <div className="text-xs text-gray-500">2-4kg</div>
                      <div className="text-xs font-bold text-gray-900">{formatCurrency(product.tier_2_4kg_price)}</div>
                    </div>
                  )}
                  {product.tier_5_9kg_price && (
                    <div className="bg-white rounded p-1 shadow-sm">
                      <div className="text-xs text-gray-500">5-9kg</div>
                      <div className="text-xs font-bold text-gray-900">{formatCurrency(product.tier_5_9kg_price)}</div>
                    </div>
                  )}
                  {product.tier_10kg_up_price && (
                    <div className="bg-linear-to-br from-[#ffff03] to-[#ffff03]/90 rounded p-1 shadow-md border border-[#ffff03]">
                      <div className="text-xs text-[#27247b]/80">10+kg</div>
                      <div className="text-xs font-bold text-[#27247b]">{formatCurrency(product.tier_10kg_up_price)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bag Size Selector */}
          <div className={`space-y-2 ${product.has_tier_pricing ? 'mt-1' : ''}`}>
            {/* Total Display */}
            <div className="bg-linear-to-r from-[#27247b] to-[#27247b]/90 rounded-lg p-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">Total Weight</p>
                  <p className="text-base font-bold text-[#ffff03]">{totalKg}kg</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/70">Total Price</p>
                  <p className="text-base font-bold text-white">{formatCurrency(totalPrice)}</p>
                </div>
              </div>
            </div>

            {/* Bag Size Buttons */}
            <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
              <p className="text-xs font-bold text-[#27247b] mb-2">Select Bag Size</p>
              
              {/* 1kg Bag */}
              <div className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="bg-[#27247b] text-[#ffff03] rounded-md px-2 py-1 text-xs font-bold">1kg</div>
                  <span className="text-xs text-gray-600">
                    {bagCounts.kg1 > 0 ? `${bagCounts.kg1} bag${bagCounts.kg1 > 1 ? 's' : ''}` : 'No bags'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(1)}
                    disabled={!product.available || bagCounts.kg1 === 0}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(1)}
                    disabled={!product.available}
                    className="h-7 w-7 p-0 bg-[#ffff03] hover:bg-[#ffff03]/90 border-[#ffff03]"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 5kg Bag */}
              <div className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="bg-[#27247b] text-[#ffff03] rounded-md px-2 py-1 text-xs font-bold">5kg</div>
                  <span className="text-xs text-gray-600">
                    {bagCounts.kg5 > 0 ? `${bagCounts.kg5} bag${bagCounts.kg5 > 1 ? 's' : ''}` : 'No bags'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(5)}
                    disabled={!product.available || bagCounts.kg5 === 0}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(5)}
                    disabled={!product.available}
                    className="h-7 w-7 p-0 bg-[#ffff03] hover:bg-[#ffff03]/90 border-[#ffff03]"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 10kg Bag */}
              <div className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="bg-[#27247b] text-[#ffff03] rounded-md px-2 py-1 text-xs font-bold">10kg</div>
                  <span className="text-xs text-gray-600">
                    {bagCounts.kg10 > 0 ? `${bagCounts.kg10} bag${bagCounts.kg10 > 1 ? 's' : ''}` : 'No bags'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(10)}
                    disabled={!product.available || bagCounts.kg10 === 0}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(10)}
                    disabled={!product.available}
                    className="h-7 w-7 p-0 bg-[#ffff03] hover:bg-[#ffff03]/90 border-[#ffff03]"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 25kg Bag */}
              <div className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="bg-[#27247b] text-[#ffff03] rounded-md px-2 py-1 text-xs font-bold">25kg</div>
                  <span className="text-xs text-gray-600">
                    {bagCounts.kg25 > 0 ? `${bagCounts.kg25} bag${bagCounts.kg25 > 1 ? 's' : ''}` : 'No bags'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(25)}
                    disabled={!product.available || bagCounts.kg25 === 0}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(25)}
                    disabled={!product.available}
                    className="h-7 w-7 p-0 bg-[#ffff03] hover:bg-[#ffff03]/90 border-[#ffff03]"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Buy Now Button - Shows when items are selected */}
            {totalKg > 0 && (
              <div className="mt-3 animate-in slide-in-from-bottom duration-500">
                <Button
                  onClick={handleBuyNow}
                  disabled={!product.available}
                  className="w-full h-12 bg-linear-to-r from-[#27247b] to-[#1a1854] hover:from-[#1a1854] hover:to-[#27247b] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 border-[#ffff03]"
                  onMouseEnter={() => setIsBuyNowHovered(true)}
                  onMouseLeave={() => setIsBuyNowHovered(false)}
                >
                  <Zap className="w-5 h-5 mr-2 text-[#ffff03]" />
                  {isBuyNowHovered ? 'Go to Checkout' : `Buy Now - ${formatCurrency(totalPrice)}`}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
