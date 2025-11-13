import { ProductCard } from '@/components/product-card';
import { getCachedRegularProducts, getCachedProductImages } from '@/lib/cached-data';
import { Package } from 'lucide-react';

/**
 * Async component that fetches and displays products
 * Wrapped in Suspense boundary for PPR optimization
 */
export async function AsyncProductsList() {
  // Fetch products using cached data functions
  const products = await getCachedRegularProducts();
  
  // Custom sort order: Every Grain -> All Steam -> All Sella -> Bachat Basmati -> Bachat Regular
  const sortedProducts = products.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // Define priority groups
    const getPriority = (name: string) => {
      if (name.includes('every grain')) return 1;
      if (name.includes('steam')) return 2;
      if (name.includes('sella')) return 3;
      if (name.includes('bachat') && name.includes('basmati')) return 4;
      if (name.includes('bachat')) return 5;
      return 6;
    };
    
    const aPriority = getPriority(aName);
    const bPriority = getPriority(bName);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Sub-sort for Steam products
    if (aPriority === 2 && bPriority === 2) {
      const getSteamPriority = (name: string) => {
        if (name.includes('x-steam') || name.includes('x steam')) return 1;
        if (name.includes('platinum')) return 2;
        if (name.includes('premium')) return 3;
        return 4;
      };
      return getSteamPriority(aName) - getSteamPriority(bName);
    }
    
    // Sub-sort for Sella products
    if (aPriority === 3 && bPriority === 3) {
      const getSellaPriority = (name: string) => {
        if (name.includes('ultimate')) return 1;
        if (name.includes('platinum')) return 2;
        if (name.includes('gold')) return 3;
        return 4;
      };
      return getSellaPriority(aName) - getSellaPriority(bName);
    }
    
    return 0;
  });
  
  const productIds = sortedProducts.map(p => p.$id);
  const images = await getCachedProductImages(productIds);
  const imageMap = new Map(images.map(img => [img.product_id, img.file_id]));

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
        <Package className="w-32 h-32 text-[#27247b]/20 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-[#27247b] mb-4">No Products Available</h2>
        <p className="text-xl text-gray-600">Check back soon for our premium rice selection!</p>
      </div>
    );
  }

  return (
    <>
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-block">
          <h2 className="text-4xl md:text-5xl font-bold text-[#27247b] mb-4">
            Our Products
          </h2>
          <div className="h-1.5 bg-[#ffff03] rounded-full"></div>
        </div>
        <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
          Choose your preferred quantity for the best pricing. All products come with our quality guarantee.
        </p>
      </div>

      {/* Products Grid with Category Headings */}
      <div className="flex flex-col gap-8 mb-16 max-w-5xl mx-auto">
        {sortedProducts.map((product, index) => {
          const productName = product.name.toLowerCase();
          const prevProductName = index > 0 ? sortedProducts[index - 1].name.toLowerCase() : '';
          
          let categoryHeading = null;
          
          if (index === 0 || 
              (productName.includes('every grain') && !prevProductName.includes('every grain')) ||
              (productName.includes('steam') && !prevProductName.includes('steam')) ||
              (productName.includes('sella') && !prevProductName.includes('sella')) ||
              (productName.includes('bachat') && !prevProductName.includes('bachat'))) {
            
            if (productName.includes('every grain')) {
              categoryHeading = 'Every Grain Rice XXXL';
            } else if (productName.includes('steam')) {
              categoryHeading = 'Steam Rice';
            } else if (productName.includes('sella')) {
              categoryHeading = 'Sella Rice';
            } else if (productName.includes('bachat')) {
              categoryHeading = 'Bachat Rice';
            }
          }
          
          return (
            <div key={product.$id}>
              {categoryHeading && (
                <div className="mb-6 mt-8">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-0.5 bg-linear-to-r from-transparent via-[#ffff03] to-[#ffff03]"></div>
                    <h3 className="text-2xl md:text-3xl font-bold text-[#27247b] whitespace-nowrap">
                      {categoryHeading}
                    </h3>
                    <div className="flex-1 h-0.5 bg-linear-to-l from-transparent via-[#ffff03] to-[#ffff03]"></div>
                  </div>
                </div>
              )}
              <ProductCard
                product={product}
                imageFileId={imageMap.get(product.$id)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
