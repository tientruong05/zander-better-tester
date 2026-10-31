'use client';

import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import Pagination from '@/components/Pagination';
import { Product, Category } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface ProductsClientProps {
  products: Product[];
  total: number;
  categories: Category[];
  currentPage: number;
  totalPages: number;
  activeCategoryId?: string;
  activeSort?: string;
}

export default function ProductsClient({ products, total, categories, currentPage, totalPages, activeCategoryId, activeSort }: ProductsClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', sort);
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentSort = activeSort || 'newest';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fbfbfd 0%, #f5f5f7 50%, #f5f5f7 100%)' }}>
      <Navbar />

      <div className="container mx-auto px-4 pt-24 sm:pt-28 pb-10 max-w-8xl">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#2997ff] flex items-center justify-center text-white text-lg shadow-md shadow-blue-200">
                📦
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t('products.title')}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{t('products.subtitle')}</p>
              </div>
            </div>
            {/* Mobile filter toggle button */}
            <button
              data-testid="products-filter-toggle-button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:border-[#0071e3] hover:text-[#0071e3] transition-colors flex-shrink-0"
            >
              <SlidersHorizontal size={16} />
              {t('common.filters')}
            </button>
          </div>
        </div>

        {/* Mobile filter panel overlay */}
        {showFilters && (
          <div data-testid="products-filter-panel-mobile" className="lg:hidden mb-4 animate-fade-in">
            <ProductFilters
              categories={categories}
              activeCategoryId={activeCategoryId}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Desktop sidebar filter */}
          <div data-testid="products-filter-sidebar" className="hidden lg:block lg:col-span-1">
            <ProductFilters categories={categories} activeCategoryId={activeCategoryId} />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-4 sm:p-5 min-h-[500px] shadow-sm border border-gray-100">
              {products.length === 0 ? (
                <div data-testid="products-empty-state" className="text-center py-20">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-lg text-gray-500 font-semibold">{t('products.empty')}</p>
                  <p className="text-gray-400 text-sm mt-1">{t('products.empty_desc')}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
                    <p data-testid="products-showing-count" className="text-sm text-gray-500">
                      {t('products.showing')} <span className="font-semibold text-gray-900">{products.length}</span> / {total} {t('products.products_count')}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="text-sm text-gray-400 hidden sm:inline">{t('products.sort_by')}</span>
                       <select
                         data-testid="products-sort-select"
                         value={currentSort}
                         onChange={(e) => handleSortChange(e.target.value)}
                         className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900 focus:ring-1 focus:ring-[#0071e3] focus:border-[#0071e3] cursor-pointer bg-white"
                       >
                          <option value="newest">{t('products.sort_newest')}</option>
                          <option value="price_asc">{t('products.sort_price_asc')}</option>
                          <option value="price_desc">{t('products.sort_price_desc')}</option>
                       </select>
                    </div>
                  </div>
                  <div data-testid="products-grid" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  <Pagination currentPage={currentPage} totalPages={totalPages} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

