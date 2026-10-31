'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { showAlert } from '@/lib/alert';
import { Product, ProductReview } from '@/types';
import StarRating from './StarRating';
import ProductReviews from './ProductReviews';
import { ChevronRight, ShoppingCart, Zap, Copy } from 'lucide-react';

interface AddToCartSectionProps {
  product: Product;
  initialReviews?: ProductReview[];
}

export default function AddToCartSection({ product, initialReviews = [] }: AddToCartSectionProps) {
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'shipping' | 'returns' | 'reviews'>('description');
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);

  const displayPrice = product.sale_price || product.price;
  const hasDiscount = !!product.sale_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - displayPrice) / product.price) * 100)
    : 0;

  const images: string[] = [];
  if (product.product_images && product.product_images.length > 0) {
    const sorted = [...product.product_images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.sort_order - b.sort_order;
    });
    sorted.forEach((img) => images.push(img.image_url));
  } else if (product.image_url) {
    images.push(product.image_url);
  }

  const currentImage = images[selectedImageIndex] || null;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    addItem(product, quantity);
    showAlert.success(t('cart.added_to_cart') || 'Added to cart');
    setTimeout(() => {
      setIsAddingToCart(false);
      setQuantity(1);
    }, 800);
  };

  const productName = language === 'en' && (product as any).name_en ? (product as any).name_en : product.name;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const tabs = [
    { key: 'description' as const, label: t('product_detail.tab_desc') || 'Mô tả' },
    { key: 'shipping' as const, label: t('product_detail.tab_shipping') || 'Vận chuyển' },
    { key: 'returns' as const, label: t('product_detail.tab_returns') || 'Đổi trả' },
    { key: 'reviews' as const, label: `${t('reviews.tab_title') || 'Đánh giá'} (${reviews.length})` },
  ];

  return (
    <>
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 overflow-hidden flex-nowrap">
        <Link href="/" data-testid="product-breadcrumb-home-link" className="hover:text-[#0071e3] transition-colors shrink-0">{t('nav.home') || 'Trang chủ'}</Link>
        <ChevronRight size={12} className="shrink-0 text-gray-300" />
        <Link href="/products" data-testid="product-breadcrumb-products-link" className="hover:text-[#0071e3] transition-colors shrink-0">{t('nav.products') || 'Sản phẩm'}</Link>
        <ChevronRight size={12} className="shrink-0 text-gray-300" />
        <span className="text-gray-700 font-medium truncate">{productName}</span>
      </nav>

      {/* ── MOBILE: Stack layout / DESKTOP: Side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12 xl:gap-16">

        {/* ── Image Gallery ── */}
        <div className="mb-5 lg:mb-0">
          {/* Main image */}
          <div data-testid="product-detail-main-image" className="relative rounded-2xl overflow-hidden bg-white aspect-square border border-gray-100 shadow-md">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-contain p-3 sm:p-4"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {hasDiscount && (
                <span data-testid="product-detail-discount-badge" className="bg-[#0071e3] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  -{discountPercent}%
                </span>
              )}
              {product.stock <= 5 && product.stock > 0 && (
                <span data-testid="product-detail-low-stock-badge" className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  🔥 {t('product_detail.almost_out_of_stock')}
                </span>
              )}
              {product.stock === 0 && (
                <span data-testid="product-detail-out-of-stock-badge" className="bg-gray-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  {t('product_detail.out_of_stock')}
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  data-testid={`product-detail-thumbnail-${idx}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                    idx === selectedImageIndex
                      ? 'border-[#0071e3] shadow-md'
                      : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Ảnh ${idx + 1}`} fill className="object-contain p-1 bg-white" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="flex flex-col">

          {/* Stock badge + name */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 data-testid="product-detail-name" className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug flex-1">
              {productName}
            </h1>
            {product.stock > 0 ? (
              <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 whitespace-nowrap mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {t('product_detail.in_stock')}
              </span>
            ) : (
              <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 whitespace-nowrap mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                {t('product_detail.out_of_stock')}
              </span>
            )}
          </div>

          {/* Rating summary line */}
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={avgRating} size={15} />
            <button
              data-testid="product-detail-rating-summary"
              onClick={() => setActiveTab('reviews')}
              className="text-xs text-gray-400 hover:text-[#0071e3] transition-colors"
            >
              {avgRating > 0
                ? `${avgRating.toFixed(1)} (${reviews.length} ${t('reviews.reviews_count') || 'reviews'})`
                : (t('reviews.no_reviews_yet') || 'No reviews yet')}
            </button>
          </div>

          {/* Price Block */}
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl px-4 py-3.5 mb-4 shadow-sm">
            <div className="flex items-end gap-2.5 flex-wrap">
              <span data-testid="product-detail-price" className="text-2xl sm:text-3xl font-black text-[#0071e3] tracking-tight">
                {displayPrice.toLocaleString('vi-VN')}₫
              </span>
              {hasDiscount && (
                <>
                  <span data-testid="product-detail-original-price" className="text-base text-gray-400 line-through mb-0.5">
                    {product.price.toLocaleString('vi-VN')}₫
                  </span>
                  <span className="bg-[#0071e3] text-white text-[11px] font-bold px-2 py-0.5 rounded-md mb-0.5">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-gray-400 mt-1.5">
                💡 {t('product_detail.save_label')} <strong className="text-[#0071e3]">{(product.price - displayPrice).toLocaleString('vi-VN')}₫</strong> {t('product_detail.original_price_label')}
              </p>
            )}
          </div>

          {/* Quantity + CTAs */}
          {product.stock > 0 ? (
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">{t('product_detail.quantity') || 'Số lượng'}</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-10 shrink-0">
                  <button
                    data-testid="product-detail-qty-decrease"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 text-lg font-light active:bg-gray-100"
                  >−</button>
                  <span data-testid="product-detail-qty-value" className="w-10 flex items-center justify-center font-bold text-gray-900 border-x border-gray-200">{quantity}</span>
                  <button
                    data-testid="product-detail-qty-increase"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 text-lg font-light active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >+</button>
                </div>
                <span className="text-xs text-gray-400">
                  {t('product_detail.max_quantity')
                    ? t('product_detail.max_quantity').replace('{stock}', product.stock.toString())
                    : `Tối đa ${product.stock} sản phẩm`}
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  data-testid="product-detail-add-to-cart-button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border-2 border-[#0071e3] ${
                    isAddingToCart ? 'bg-[#0071e3] text-white' : 'bg-white text-[#0071e3] hover:bg-[#0071e3] hover:text-white'
                  }`}
                >
                  {isAddingToCart ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <ShoppingCart size={16} />
                  )}
                  {isAddingToCart
                    ? (t('product_detail.adding') || 'Đang thêm...')
                    : (t('product_detail.add_to_cart') || 'Thêm vào giỏ')}
                </button>

                <button
                  data-testid="product-detail-buy-now-button"
                  onClick={() => {
                    const currentCart: { product: typeof product; quantity: number }[] =
                      JSON.parse(localStorage.getItem('cart') || '[]');
                    const existing = currentCart.find((i) => i.product.id === product.id);
                    const newCart = existing
                      ? currentCart.map((i) =>
                          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
                        )
                      : [...currentCart, { product, quantity }];
                    localStorage.setItem('cart', JSON.stringify(newCart));
                    addItem(product, quantity);
                    window.location.href = '/checkout';
                  }}
                  className="h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#0071e3] text-white hover:bg-[#005bb5] transition-all shadow-md shadow-blue-200"
                >
                  <Zap size={16} />
                  {t('product_detail.buy_now') || 'Mua ngay'}
                </button>
              </div>
            </div>
          ) : (
            <div data-testid="product-detail-out-of-stock-message" className="mb-4 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
              <p className="text-xl mb-1">😔</p>
              <p className="font-bold text-red-600 text-sm">{t('product_detail.temp_out_of_stock') || 'Sản phẩm tạm thời hết hàng'}</p>
              <p className="text-xs text-red-400 mt-1">{t('product_detail.please_come_back') || 'Vui lòng quay lại sau'}</p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 mb-4" />

          {/* Tabs */}
          <div>
            <div className="flex border-b border-gray-100 mb-4 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  data-testid={`product-detail-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-3 py-2.5 text-sm font-semibold transition-all whitespace-nowrap mr-1 border-b-2 ${
                    activeTab === tab.key
                      ? 'text-[#0071e3] border-[#0071e3]'
                      : 'text-gray-500 border-transparent hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-[15px] sm:text-base text-gray-600 leading-relaxed">
              {activeTab === 'description' && (
                <p className="whitespace-pre-line">
                  {language === 'en' && (product as any).description_en
                    ? (product as any).description_en
                    : product.description || (t('product_detail.no_desc') || 'Chưa có mô tả.')}
                </p>
              )}
              {activeTab === 'shipping' && (
                <ul className="space-y-2.5">
                  {[
                    { icon: '🚚', text: t('product_detail.shipping_standard') || 'Giao hàng tiêu chuẩn: 2–5 ngày làm việc' },
                    { icon: '📦', text: t('product_detail.shipping_pack') || 'Đóng gói cẩn thận, chống va đập' },
                    // { icon: '🆓', text: t('product_detail.shipping_free') || 'Miễn phí vận chuyển cho đơn hàng trên 500.000₫' },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span>{item.icon}</span><span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
              {activeTab === 'returns' && (
                <ul className="space-y-2.5">
                  {[
                    { icon: '↩️', text: t('product_detail.returns_7days') || 'Đổi trả miễn phí trong vòng 7 ngày' },
                    { icon: '✅', text: t('product_detail.returns_condition') || 'Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng' },
                    { icon: '💳', text: t('product_detail.returns_refund') || 'Hoàn tiền trong vòng 3–5 ngày làm việc' },
                    { icon: '📞', text: t('product_detail.returns_contact') || 'Liên hệ CSKH để được hỗ trợ đổi trả' },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span>{item.icon}</span><span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
              {activeTab === 'reviews' && (
                <ProductReviews
                  productId={product.id}
                  reviews={reviews}
                  onReviewAdded={(review) => setReviews((prev) => [review, ...prev])}
                />
              )}
            </div>
          </div>

          {/* Share */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">{t('product_detail.share') || 'Chia sẻ:'}</span>
            <button
              data-testid="product-detail-share-facebook-button"
              title="Facebook"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:scale-110 active:scale-95 transition-transform bg-[#1877F2]"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')}
            >f</button>
            <button
              data-testid="product-detail-share-copy-button"
              title="Copy link"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:scale-110 active:scale-95 transition-transform bg-gray-500"
              onClick={() => { navigator.clipboard.writeText(window.location.href); showAlert.success('Đã sao chép liên kết!'); }}
            >
              <Copy size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
