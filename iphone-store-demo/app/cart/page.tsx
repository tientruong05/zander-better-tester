'use client';

import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div data-testid="cart-empty-state" className="bg-white rounded-lg p-12 text-center max-w-xl mx-auto">
            <div className="text-7xl mb-4">🛒</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h1>
            <p className="text-gray-500 text-sm mb-6">
              {t('cart.empty')}
            </p>
            <Link
              href="/products"
              data-testid="cart-empty-continue-link"
              className="inline-block bg-[#0071e3] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#005bb5] transition-all text-sm"
            >
              {t('cart.continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="bg-white rounded-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('cart.title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const displayPrice = item.product.sale_price || item.product.price;
              return (
                <div key={item.product.id} data-testid={`cart-item-${item.product.id}`} className="bg-white rounded-lg p-5 border border-gray-100">
                  <div className="flex gap-4">
                    {/* Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden relative">
                      {item.product.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">📦</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        data-testid="cart-item-name-link"
                        className="text-sm font-medium text-gray-900 hover:text-[#0071e3] transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{t('common.sku_label')} {item.product.sku}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#0071e3]">
                          {displayPrice.toLocaleString('vi-VN')}₫
                        </span>
                        {item.product.sale_price && (
                          <span className="text-xs text-gray-400 line-through">
                            {item.product.price.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity + Remove */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0 ml-auto">
                      <button
                        data-testid="cart-item-remove-button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-gray-400 hover:text-red-500 text-xs transition-colors"
                      >
                        {t('cart.remove')}
                      </button>

                      <div className="flex items-center gap-0">
                        <button
                          data-testid="cart-item-qty-decrease"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-l border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm"
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span data-testid="cart-item-qty-value" className="w-10 h-8 border-t border-b border-gray-200 text-center leading-8 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          data-testid="cart-item-qty-increase"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-r border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm"
                          disabled={item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>

                      <p data-testid="cart-item-line-total" className="text-sm font-bold text-[#0071e3] whitespace-nowrap">
                        {(displayPrice * item.quantity).toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              data-testid="cart-clear-button"
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 text-xs font-medium hover:underline"
            >
              {t('cart.clear_cart')}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-5 border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('cart.total')}</h2>

              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span data-testid="cart-subtotal-value" className="font-medium">{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.shipping_fee')}</span>
                  <span className="text-gray-400 text-xs">{t('cart.shipping_calc')}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">{t('cart.total')}</span>
                    <span data-testid="cart-total-value" className="font-bold text-xl text-[#0071e3]">
                      {totalPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                data-testid="cart-checkout-button"
                className="block w-full bg-[#0071e3] text-white text-center py-3 rounded-lg font-semibold hover:bg-[#005bb5] transition-all text-sm mb-3"
              >
                {t('cart.checkout')}
              </Link>

              <Link
                href="/products"
                data-testid="cart-continue-shopping-link"
                className="block w-full text-center text-[#0071e3] text-sm font-medium hover:underline py-2"
              >
                {t('cart.continue_shopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
