import { Suspense } from 'react';
import BannerWrapper from '@/components/BannerWithImages';
import { AsyncProductsList } from '@/components/async-products-list';
import { ProductsGridSkeleton, BannerSkeleton } from '@/components/loading-skeletons';

/**
 * Home Page with Partial Prerendering (PPR)
 * 
 * Static Shell:
 * - Page structure and layout
 * - Navigation and footer (from layout)
 * 
 * Dynamic Content (Suspense boundaries):
 * - Banner images (streamed)
 * - Products list (streamed)
 * 
 * Benefits:
 * - Instant static shell (<100ms)
 * - Progressive content streaming
 * - Optimal SEO with immediate content
 * - Better UX with loading states
 */
export default function Home() {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const bucketId = process.env.NEXT_PUBLIC_BANNER_STORAGE_BUCKET_ID || '';

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Hero Banner - Suspense for dynamic images */}
      <Suspense fallback={<BannerSkeleton />}>
        {projectId && bucketId ? (
          <BannerWrapper projectId={projectId} bucketId={bucketId} />
        ) : (
          <BannerSkeleton />
        )}
      </Suspense>

      {/* Products Section - Suspense for dynamic product data */}
      <section className="container mx-auto px-4 py-16">
        <Suspense fallback={<ProductsGridSkeleton />}>
          <AsyncProductsList />
        </Suspense>
      </section>
    </div>
  );
}
