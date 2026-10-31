'use client';

import Navbar from '@/components/Navbar';
import AddToCartSection from '@/components/AddToCartSection';
import ProductCard from '@/components/ProductCard';
import { Product, ProductReview } from '@/types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  initialReviews?: ProductReview[];
}

export default function ProductDetailClient({ product, relatedProducts, initialReviews = [] }: ProductDetailClientProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fbfbfd 0%, #f5f5f7 50%, #f5f5f7 100%)' }}>
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-28 pb-10 max-w-8xl">

        {/* Product Detail Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4 sm:p-6 lg:p-10 mb-6 sm:mb-10">
          <AddToCartSection product={product} initialReviews={initialReviews} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{t('product_detail.related_products')}</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{t('product_detail.related_products_subtitle')}</p>
              </div>
              <Link
                href="/products"
                data-testid="product-related-view-all-link"
                className="text-sm font-semibold text-[#0071e3] hover:underline flex items-center gap-1 transition-all"
              >
                {t('common.view_all') || 'View All'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div data-testid="product-related-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
