'use client';

import { useCartStore } from '@/lib/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { calculatePrice, formatCurrency, getPricePerKg, calculateSavings } from '@/lib/utils';
import Link from 'next/link';
import { storage, STORAGE_BUCKET_ID } from '@/lib/appwrite';
import Image from 'next/image';

export default function CartPage() {
  const { items, removeItem, addBag, removeBag, getTotalPrice, clearCart } = useCartStore();
  const totalPrice = getTotalPrice();
  
  // Calculate total savings across all items
  const totalSavings = items.reduce((total, item) => {
    const savingsInfo = calculateSavings(item.product, item.quantity);
    return total + savingsInfo.savings;
  }, 0);
  
  const totalOriginalPrice = items.reduce((total, item) => {
    const savingsInfo = calculateSavings(item.product, item.quantity);
    return total + savingsInfo.originalPrice;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <Link href="/#products">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900">Shopping Cart</h1>
        <Button variant="ghost" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const pricePerKg = getPricePerKg(item.product, item.quantity);
            const itemTotal = calculatePrice(item.product, item.quantity);
            const savingsInfo = calculateSavings(item.product, item.quantity);
            
            // Get image URL if available
            const imageUrl = item.product.primary_image_id
              ? storage.getFileView(STORAGE_BUCKET_ID, item.product.primary_image_id).toString()
              : null;

            return (
              <Card key={item.product.$id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-green-100 to-green-200">
                          <div className="text-3xl">🌾</div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatCurrency(pricePerKg)}/kg • Total: {item.quantity}kg
                      </p>

                      {/* Bag Controls */}
                      <div className="space-y-1.5 mb-2">
                        {/* 1kg bags */}
                        {item.bags.kg1 > 0 && (
                          <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                            <span className="text-xs text-gray-600">1kg bags: {item.bags.kg1}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBag(item.product.$id, 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addBag(item.product, 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* 5kg bags */}
                        {item.bags.kg5 > 0 && (
                          <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                            <span className="text-xs text-gray-600">5kg bags: {item.bags.kg5}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBag(item.product.$id, 5)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addBag(item.product, 5)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* 10kg bags */}
                        {item.bags.kg10 > 0 && (
                          <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                            <span className="text-xs text-gray-600">10kg bags: {item.bags.kg10}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBag(item.product.$id, 10)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addBag(item.product, 10)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* 25kg bags */}
                        {item.bags.kg25 > 0 && (
                          <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                            <span className="text-xs text-gray-600">25kg bags: {item.bags.kg25}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBag(item.product.$id, 25)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addBag(item.product, 25)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(itemTotal)}
                        </p>
                        {savingsInfo.savings > 0 && (
                          <div className="text-sm">
                            <p className="text-gray-500 line-through">
                              Original: {formatCurrency(savingsInfo.originalPrice)}
                            </p>
                            <p className="text-green-600 font-semibold">
                              💰 You save {formatCurrency(savingsInfo.savings)} ({savingsInfo.savingsPercentage.toFixed(0)}% off)
                            </p>
                            {savingsInfo.tierApplied && (
                              <p className="text-blue-600 text-xs">
                                🎯 {savingsInfo.tierApplied} discount applied
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.product.$id)}
                      className="self-start"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.product.$id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} ({item.quantity}kg)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(calculatePrice(item.product, item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                {totalSavings > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">Original Total:</span>
                      <span className="text-gray-500 line-through">
                        {formatCurrency(totalOriginalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-700 font-semibold">Total Savings:</span>
                      <span className="text-green-700 font-bold">
                        -{formatCurrency(totalSavings)} ({((totalSavings / totalOriginalPrice) * 100).toFixed(0)}% off)
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/#products">
                <Button variant="outline" size="lg" className="w-full mt-3">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
