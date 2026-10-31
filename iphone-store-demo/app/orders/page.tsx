'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_url?: string | null;
}

interface Payment {
  status: string;
  paid_at: string | null;
}

interface Order {
  id: string;
  order_code: number;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
  payments: Payment[];
}

export default function OrdersPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && session) {
      fetchOrders();
    }
  }, [user, session]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(t('orders.error_loading'));
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('orders.status_pending');
      case 'processing': return t('orders.status_processing');
      case 'completed': return t('orders.status_completed');
      case 'cancelled': return t('orders.status_cancelled');
      case 'shipping': return t('orders.status_shipping');
      case 'paid': return t('orders.status_paid');
      default: return status;
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 border border-gray-100 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
            </div>

            {error && (
              <div data-testid="orders-error-message" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                ⚠ {error}
              </div>
            )}

            {loadingOrders ? (
              <div data-testid="orders-loading-state" className="bg-white rounded-lg p-12 text-center border border-gray-100">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
                </div>
                <p className="text-gray-500 mt-2">{t('orders.loading')}</p>
              </div>
            ) : orders.length === 0 ? (
              <div data-testid="orders-empty-state" className="bg-white rounded-lg p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('orders.empty_title')}</h2>
                <p className="text-gray-500 text-sm mb-6">
                  {t('orders.empty_desc')}
                </p>
                <Link
                  href="/products"
                  data-testid="orders-shop-now-link"
                  className="inline-block bg-[#0071e3] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#005bb5] transition-all text-sm"
                >
                  {t('orders.shop_now')}
                </Link>
              </div>
            ) : (
              <div data-testid="orders-list" className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} data-testid={`orders-order-card-${order.order_code}`} className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="p-5">
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between mb-4 gap-3 border-b border-gray-50 pb-4">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {t('orders.order_number')}{order.order_code}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t('orders.placed_on')} {new Date(order.created_at.includes('Z') || order.created_at.includes('+') ? order.created_at : order.created_at + 'Z').toLocaleDateString('vi-VN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Ho_Chi_Minh',
                              hour12: false
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span data-testid={`orders-order-status-${order.order_code}`} className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{t('orders.total')}</p>
                            <p data-testid={`orders-order-total-${order.order_code}`} className="text-lg font-bold text-[#0071e3]">
                              {order.total_amount.toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            {/* Product Image */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.product_name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  📦
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {item.product_name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {item.price.toLocaleString('vi-VN')}₫ × {item.quantity}
                              </p>
                            </div>
                            
                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm text-gray-900">
                                {item.subtotal.toLocaleString('vi-VN')}₫
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-2">
                        <Link
                          href={`/orders/${order.id}`}
                          data-testid={`orders-view-detail-link-${order.order_code}`}
                          className="text-[#0071e3] bg-[#0071e3]/5 px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#0071e3]/10 transition-colors"
                        >
                          {t('orders.view_details')}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
