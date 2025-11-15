import { SpecialDealCard } from '@/components/special-deal-card';
import { getCachedHotelRestaurantProducts, getCachedProductImages } from '@/lib/cached-data';
import { Package } from 'lucide-react';

/**
 * Async component that fetches and displays special deals (hotel/restaurant products)
 * Wrapped in Suspense boundary for PPR optimization
 */
export async function AsyncSpecialDeals() {
  // Fetch hotel/restaurant products using cached data functions
  const products = await getCachedHotelRestaurantProducts();
  
  const productIds = products.map(p => p.$id);
  const images = await getCachedProductImages(productIds);
  const imageMap = new Map(images.map(img => [img.product_id, img.file_id]));

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
        <Package className="w-32 h-32 text-[#27247b]/20 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-[#27247b] mb-4">No Special Deals Available</h2>
        <p className="text-xl text-gray-600">Check back soon for bulk deals!</p>
      </div>
    );
  }

  return (
    <>
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-block">
          <h2 className="text-4xl md:text-5xl font-bold text-[#27247b] mb-4">
            Special Deals for Hotels & Restaurants
          </h2>
          <div className="h-1.5 bg-[#ffff03] rounded-full"></div>
        </div>
        <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
          Bulk quantities at special prices. Perfect for businesses and large orders.
        </p>
      </div>

      {/* Special Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {products.map((product) => (
          <SpecialDealCard
            key={product.$id}
            product={product}
            imageFileId={imageMap.get(product.$id)}
          />
        ))}
      </div>
    </>
  );
}
