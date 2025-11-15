'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Minus, ArrowLeft, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatCurrency, getPricePerKg } from '@/lib/utils';
import { useMetaTracking } from '@/lib/hooks/use-meta-tracking';
import { useBagSelection } from '@/lib/hooks/use-bag-selection';
import Link from 'next/link';

interface ProductDetailClientProps {
  product: Product;
  imageUrls: string[];
  primaryImageIndex: number;
}

export default function ProductDetailClient({ product, imageUrls, primaryImageIndex }: ProductDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(primaryImageIndex);
  const [isBuyNowHovered, setIsBuyNowHovered] = useState(false);
  const { trackViewContent, trackAddToCart } = useMetaTracking();
  
  const {
    bagCounts,
    totalKg,
    pricePerKg,
    totalPrice,
    handleAddBag,
    handleRemoveBag,
    handleBuyNow: buyNow,
  } = useBagSelection(product);

  // Track ViewContent event when product page loads
  useEffect(() => {
    trackViewContent({
      contentName: product.name,
      contentId: product.$id,
      contentType: 'product',
      value: totalPrice,
      currency: 'PKR',
    });
  }, [product.$id, product.name, totalPrice, trackViewContent]);

  // Wrapper for handleBuyNow with analytics tracking
  const handleBuyNow = () => {
    if (totalKg === 0) {
      return; // Hook already shows error toast
    }
    
    // Track AddToCart event
    trackAddToCart({
      contentName: product.name,
      contentId: product.$id,
      value: totalPrice,
      currency: 'PKR',
      quantity: totalKg,
    });
    
    // Call the hook's buyNow function
    buyNow();
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/#products" className="inline-flex items-center text-[#27247b] hover:text-[#27247b]/80 mb-6 font-semibold transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4 sticky top-8">
          {/* Main Image */}
          <div className="relative aspect-square bg-linear-to-br from-[#27247b]/5 to-[#ffff03]/10 rounded-2xl overflow-hidden shadow-xl border-2 border-transparent hover:border-[#ffff03]/40 transition-all duration-300">
            {imageUrls.length > 0 ? (
              <>
                <Image
                  src={imageUrls[selectedImageIndex]}
                  alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#27247b] hover:bg-[#27247b]/90 p-3 rounded-full shadow-xl transition-all hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6 text-[#ffff03]" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#27247b] hover:bg-[#27247b]/90 p-3 rounded-full shadow-xl transition-all hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6 text-[#ffff03]" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#27247b]/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      {selectedImageIndex + 1} / {imageUrls.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4 animate-pulse">🌾</div>
                  <p className="text-lg text-gray-600 font-medium">No Images Available</p>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedImageIndex === index
                      ? 'border-[#ffff03] ring-4 ring-[#ffff03]/30 shadow-lg'
                      : 'border-gray-200 hover:border-[#27247b]/30'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                  {index === primaryImageIndex && (
                    <div className="absolute top-1 left-1 bg-[#ffff03] text-[#27247b] text-xs px-2 py-0.5 rounded-md font-bold">
                      Primary
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          {/* Product Header */}
          <div className="bg-linear-to-br from-white via-white to-[#ffff03]/5 rounded-xl shadow-lg p-4 md:p-5 border-2 border-[#ffff03]/20 hover:border-[#ffff03]/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-[#27247b] via-[#1a1854] to-[#27247b] bg-clip-text text-transparent leading-tight mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[#ffff03] text-sm md:text-base">★★★★★</span>
                    <span className="text-xs md:text-sm text-gray-600 font-medium ml-1">(Premium Quality)</span>
                  </div>
                </div>
              </div>
              {!product.name.toLowerCase().includes('bachat') && 
               !product.name.toLowerCase().includes('mota') && 
               !product.name.toLowerCase().includes('regular') && (
                <div className="bg-linear-to-r from-[#ffff03] to-[#ffd700] text-[#27247b] px-3 py-1.5 rounded-full font-bold text-xs shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 border-2 border-[#27247b]/10 shrink-0">
                  ✨ Premium
                </div>
              )}
            </div>
            
            {!product.available && (
              <div className="bg-linear-to-r from-red-100 to-red-50 border-2 border-red-400 text-red-800 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md">
                <span className="font-bold text-sm">⚠️ Currently Out of Stock - Check Back Soon!</span>
              </div>
            )}

            {product.description && (
              <div className="mt-3 p-3 md:p-4 bg-linear-to-r from-[#27247b]/5 to-transparent rounded-lg border-l-4 border-[#ffff03]">
                <h3 className="text-xs md:text-sm font-bold text-[#27247b] mb-2 uppercase tracking-wide">About This Product</h3>
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">{product.description}</p>
              </div>
            )}
          </div>

          {/* Bag Size Selectors with Integrated Pricing */}
          <div className="bg-linear-to-br from-white via-[#ffff03]/5 to-white rounded-xl shadow-lg p-4 md:p-5 border-2 border-[#ffff03]/30 hover:border-[#ffff03]/60 transition-all duration-300">
            {/* Header Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3 gap-3">
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-bold bg-linear-to-r from-[#27247b] to-[#1a1854] bg-clip-text text-transparent flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    Choose Your Quantity
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Select bag sizes to build your order · Special bulk discounts available</p>
                </div>
                {totalKg > 0 && (
                  <div className="bg-linear-to-r from-[#27247b] to-[#1a1854] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold text-sm md:text-base shadow-lg animate-in slide-in-from-right duration-500 border-2 border-[#ffff03] shrink-0">
                    📦 {totalKg}kg
                  </div>
                )}
              </div>

              {/* Pricing Tiers Display */}
              {product.has_tier_pricing && (
                <div className="flex flex-wrap gap-2 mb-1">
                  {product.tier_2_4kg_price && (
                    <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-200 text-xs md:text-sm">
                      <span className="text-gray-600">2-4kg:</span>
                      <span className="font-bold text-[#27247b] ml-1">{formatCurrency(product.tier_2_4kg_price)}/kg</span>
                    </div>
                  )}
                  {product.tier_5_9kg_price && (
                    <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-200 text-xs md:text-sm">
                      <span className="text-gray-600">5-9kg:</span>
                      <span className="font-bold text-[#27247b] ml-1">{formatCurrency(product.tier_5_9kg_price)}/kg</span>
                    </div>
                  )}
                  {product.tier_10kg_up_price && (
                    <div className="bg-linear-to-r from-[#ffff03] to-[#ffd700] rounded-lg px-3 py-1.5 shadow-md border-2 border-[#ffff03] text-xs md:text-sm">
                      <span className="text-[#27247b] font-semibold">10+kg:</span>
                      <span className="font-bold text-[#27247b] ml-1">{formatCurrency(product.tier_10kg_up_price)}/kg</span>
                      <span className="text-[#27247b] ml-1">🎉</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* 1kg Bag */}
              <div className="group flex items-center justify-between bg-linear-to-r from-white to-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-[#27247b] hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="bg-linear-to-br from-[#27247b] to-[#1a1854] text-white w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300">
                    1kg
                  </div>
                  <div>
                    <p className="font-bold text-[#27247b] text-sm md:text-base">1kg Bag</p>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">{formatCurrency(getPricePerKg(product, 1))}/kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(1)}
                    disabled={!product.available || bagCounts.kg1 === 0}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Minus className="w-4 h-4 text-red-600" />
                  </Button>
                  <span className="w-6 md:w-8 text-center font-bold text-[#27247b] text-base">{bagCounts.kg1}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(1)}
                    disabled={!product.available}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 bg-[#ffff03] hover:bg-[#ffd700] border-2 border-[#ffff03] rounded-lg transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4 text-[#27247b]" />
                  </Button>
                </div>
              </div>

              {/* 5kg Bag */}
              <div className="group flex items-center justify-between bg-linear-to-r from-white to-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-[#27247b] hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="bg-linear-to-br from-[#27247b] to-[#1a1854] text-white w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300">
                    5kg
                  </div>
                  <div>
                    <p className="font-bold text-[#27247b] text-sm md:text-base flex items-center gap-1 md:gap-2">
                      5kg Bag
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Popular</span>
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">{formatCurrency(getPricePerKg(product, 5))}/kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(5)}
                    disabled={!product.available || bagCounts.kg5 === 0}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Minus className="w-4 h-4 text-red-600" />
                  </Button>
                  <span className="w-6 md:w-8 text-center font-bold text-[#27247b] text-base">{bagCounts.kg5}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(5)}
                    disabled={!product.available}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 bg-[#ffff03] hover:bg-[#ffd700] border-2 border-[#ffff03] rounded-lg transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4 text-[#27247b]" />
                  </Button>
                </div>
              </div>

              {/* 10kg Bag */}
              <div className="group flex items-center justify-between bg-linear-to-r from-white to-blue-50 p-3 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="bg-linear-to-br from-[#27247b] to-[#1a1854] text-white w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300">
                    10kg
                  </div>
                  <div>
                    <p className="font-bold text-[#27247b] text-sm md:text-base flex items-center gap-1 md:gap-2">
                      10kg Bag
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Great Deal</span>
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">{formatCurrency(getPricePerKg(product, 10))}/kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(10)}
                    disabled={!product.available || bagCounts.kg10 === 0}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Minus className="w-4 h-4 text-red-600" />
                  </Button>
                  <span className="w-6 md:w-8 text-center font-bold text-[#27247b] text-base">{bagCounts.kg10}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(10)}
                    disabled={!product.available}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 bg-[#ffff03] hover:bg-[#ffd700] border-2 border-[#ffff03] rounded-lg transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4 text-[#27247b]" />
                  </Button>
                </div>
              </div>

              {/* 25kg Bag */}
              <div className="group flex items-center justify-between bg-linear-to-r from-[#ffff03]/20 via-[#ffff03]/10 to-white p-3 rounded-lg border-2 border-[#ffff03] hover:border-[#ffd700] hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-linear-to-l from-[#ffff03] to-transparent w-24 h-full opacity-20"></div>
                <div className="flex items-center gap-2 md:gap-3 relative z-10">
                  <div className="bg-linear-to-br from-[#27247b] via-[#1a1854] to-[#27247b] text-[#ffff03] w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-bold text-sm md:text-base shadow-lg group-hover:scale-105 transition-transform duration-300 border-2 border-[#ffff03]/30">
                    25kg
                  </div>
                  <div>
                    <p className="font-bold text-[#27247b] text-sm md:text-base flex items-center gap-1 flex-wrap">
                      25kg Bag
                      <span className="text-xs bg-linear-to-r from-[#ffff03] to-[#ffd700] text-[#27247b] px-2 py-0.5 rounded-full font-bold shadow-md">
                        ⭐ Best Value
                      </span>
                    </p>
                    <p className="text-xs md:text-sm text-gray-700 font-bold">{formatCurrency(getPricePerKg(product, 25))}/kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBag(25)}
                    disabled={!product.available || bagCounts.kg25 === 0}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Minus className="w-4 h-4 text-red-600" />
                  </Button>
                  <span className="w-6 md:w-8 text-center font-bold text-[#27247b] text-base">{bagCounts.kg25}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddBag(25)}
                    disabled={!product.available}
                    className="h-8 w-8 md:h-9 md:w-9 p-0 bg-[#ffff03] hover:bg-[#ffd700] border-2 border-[#ffff03] rounded-lg transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4 text-[#27247b] font-bold" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Total Price Display */}
            {totalKg > 0 && (
              <div className="mt-4 bg-linear-to-r from-[#27247b] to-[#1a1854] rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-[#ffff03]">{formatCurrency(totalPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm mb-1">Price per kg</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(pricePerKg)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buy Now Button */}
          {totalKg > 0 && (
            <div className="animate-in slide-in-from-bottom duration-500">
              <Button
                size="lg"
                className="w-full bg-linear-to-r from-[#27247b] to-[#1a1854] hover:from-[#1a1854] hover:to-[#27247b] text-white font-bold py-5 text-base shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 rounded-xl border-2 border-[#ffff03]"
                onClick={handleBuyNow}
                disabled={!product.available}
                onMouseEnter={() => setIsBuyNowHovered(true)}
                onMouseLeave={() => setIsBuyNowHovered(false)}
              >
                <Zap className="w-5 h-5 mr-2 text-[#ffff03] animate-pulse" />
                {isBuyNowHovered ? 'Go to Checkout' : `Buy Now - ${formatCurrency(totalPrice)}`}
              </Button>
              </div>
            )}
        </div>
      </div>
      </div>
    </div>
  );
}
