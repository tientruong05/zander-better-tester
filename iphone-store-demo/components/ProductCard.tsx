'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t, language } = useLanguage();
  const displayPrice = product.sale_price || product.price;
  const hasDiscount = !!product.sale_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group block h-full"
    >
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden card-hover h-full flex flex-col">
        {/* Product Image */}
        <div data-testid="product-card-image" className="relative aspect-square bg-gray-50">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl group-hover:scale-105 transition-transform duration-300">📦</span>
            </div>
          )}
          {hasDiscount && (
            <div
              data-testid="product-card-discount-badge"
              className="absolute top-2 right-2 bg-[#0071e3] text-white text-xs font-bold px-2 py-1 rounded"
            >
              -{discountPercent}%
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <div
              data-testid="product-card-low-stock-badge"
              className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded"
            >
              {t('product_detail.low_stock').replace('{stock}', String(product.stock))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 flex flex-col flex-1">
          <h3
            data-testid="product-card-title"
            className="text-[15px] sm:text-base font-bold leading-tight text-gray-800 line-clamp-2 mb-2 group-hover:text-[#0071e3] transition-colors"
          >
            {language === 'en' && product.name_en ? product.name_en : product.name}
          </h3>

          <div className="mt-auto">

          <div className="flex items-baseline gap-2">
            <span data-testid="product-card-price" className="text-lg font-bold text-[#0071e3]">
              {displayPrice.toLocaleString('vi-VN')}₫
            </span>
            {hasDiscount && (
              <span
                data-testid="product-card-original-price"
                className="text-xs text-gray-400 line-through"
              >
                {product.price.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>

          {product.stock > 0 ? (
            <p data-testid="product-card-stock-status" className="text-xs text-gray-400 mt-1.5">{t('product_detail.in_stock_count')}</p>
          ) : (
            <p data-testid="product-card-stock-status" className="text-xs text-red-500 mt-1.5 font-medium">{t('product_detail.out_of_stock_count')}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
