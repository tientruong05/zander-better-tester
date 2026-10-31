'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Category } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductFiltersProps {
  categories: Category[];
  activeCategoryId?: string;
  onClose?: () => void;
}

export default function ProductFilters({ categories, activeCategoryId: propCategoryId, onClose }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { t, language } = useLanguage();
  
  // Use prop first (server-resolved), fall back to reading from URL
  const currentCategoryId = propCategoryId ?? searchParams.get('categoryId');
  // Initialize state from URL params
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  
  // Sync state with URL params
  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  const handleCategoryClick = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    // Always navigate using categoryId (clear slug-based 'category' param)
    params.delete('category');
    if (categoryId) {
      params.set('categoryId', categoryId);
    } else {
      params.delete('categoryId');
    }
    // Reset page to 1 when changing filters
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    router.push(pathname);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{t('common.filters')}</h3>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              data-testid="products-filter-close-button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              ✕ {t('common.close') || 'Đóng'}
            </button>
          )}
          <button 
            data-testid="products-filter-reset-button"
            onClick={handleReset}
            className="text-xs text-[#0071e3] hover:underline cursor-pointer"
          >
            {t('common.reset')}
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3">{t('products.filter_categories')}</h4>
          <div className="space-y-2">
            {/* All Categories Option */}
            <label data-testid="products-filter-category-all" className="flex items-center gap-2 cursor-pointer group" onClick={() => handleCategoryClick(null)}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!currentCategoryId ? 'border-[#0071e3] bg-[#0071e3]' : 'border-gray-300 group-hover:border-[#0071e3]'}`}>
                {!currentCategoryId && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
              </div>
              <span className={`text-sm ${!currentCategoryId ? 'text-[#0071e3] font-medium' : 'text-gray-600 group-hover:text-[#0071e3]'}`}>
                {t('products.filter_all')}
              </span>
            </label>

            {categories.map((cat) => (
              <label
                key={cat.id}
                data-testid={`products-filter-category-${cat.slug}`}
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => handleCategoryClick(cat.id)}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${currentCategoryId === cat.id ? 'border-[#0071e3] bg-[#0071e3]' : 'border-gray-300 group-hover:border-[#0071e3]'}`}>
                  {currentCategoryId === cat.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
                <span className={`text-sm ${currentCategoryId === cat.id ? 'text-[#0071e3] font-medium' : 'text-gray-600 group-hover:text-[#0071e3]'}`}>
                  {language === 'en' && (cat as any).name_en ? (cat as any).name_en : cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100"></div>

        {/* Price Range */}
        <div>
           <h4 className="text-sm font-semibold text-gray-800 mb-3">{t('products.filter_price')}</h4>
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <input 
                 data-testid="products-filter-min-price-input"
                 type="number" 
                 placeholder={t('common.from').toUpperCase()} 
                 value={minPrice}
                 onChange={(e) => setMinPrice(e.target.value)}
                 className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0071e3]"
               />
               <span className="text-gray-400">-</span>
               <input 
                 data-testid="products-filter-max-price-input"
                 type="number" 
                 placeholder={t('common.to').toUpperCase()} 
                 value={maxPrice}
                 onChange={(e) => setMaxPrice(e.target.value)}
                 className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0071e3]"
               />
             </div>
             <button 
               data-testid="products-filter-apply-button"
               onClick={handleApplyPrice}
               className="w-full bg-[#0071e3] text-white py-2 rounded text-sm font-semibold hover:bg-[#005bb5] transition-colors cursor-pointer"
             >
               {t('products.apply_filter')}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
