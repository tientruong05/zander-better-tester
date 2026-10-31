'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Package, ShoppingBag, DollarSign, ArrowUpRight, Clock } from 'lucide-react';

interface RecentOrder {
  id: string;
  order_code: number;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const REVENUE_STATUSES = ['paid', 'shipping', 'completed'];

type TranslateFn = (keyPath: string, variables?: Record<string, string | number>) => string;

const getStatusMap = (t: TranslateFn): Record<string, { label: string; color: string }> => ({
  pending: { label: t('admin.status_pending'), color: 'bg-yellow-50 text-yellow-700' },
  processing: { label: t('admin.status_processing'), color: 'bg-blue-50 text-blue-700' },
  paid: { label: t('admin.status_paid'), color: 'bg-emerald-50 text-emerald-700' },
  shipping: { label: t('admin.status_shipping'), color: 'bg-indigo-50 text-indigo-700' },
  completed: { label: t('admin.status_completed'), color: 'bg-green-50 text-green-700' },
  cancelled: { label: t('admin.status_cancelled'), color: 'bg-gray-100 text-gray-500' },
  failed: { label: t('admin.status_failed'), color: 'bg-red-50 text-red-700' },
});

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const statusMap = getStatusMap(t);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [productsResult, ordersResult, revenueResult, recentResult] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('total_amount').in('status', REVENUE_STATUSES),
          supabase.from('orders').select('id, order_code, customer_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        if (!isMounted) return;

        const totalRevenue = revenueResult.data?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

        setStats({
          users: 0,
          products: productsResult.count || 0,
          orders: ordersResult.count || 0,
          revenue: totalRevenue,
        });
        setRecentOrders(recentResult.data || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const statCards = [
    { id: 'orders', label: t('admin.orders'), value: stats.orders, icon: ShoppingBag, color: 'from-blue-500 to-sky-500', link: '/admin/orders' },
    { id: 'revenue', label: t('admin.revenue'), value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue), icon: DollarSign, color: 'from-emerald-500 to-teal-500', link: '/admin/orders' },
    { id: 'products', label: t('admin.products'), value: stats.products, icon: Package, color: 'from-blue-500 to-indigo-500', link: '/admin/products' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0071e3] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{t('admin.overview')}</h1>
        <p className="text-sm text-gray-500 font-medium">{t('admin.dashboard_subtitle')}</p>
      </div>

      {/* Stat Cards + Journey Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Link key={card.label} href={card.link} data-testid={`admin-dashboard-${card.id}-card`} className="group">
            <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg shadow-gray-200/50 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="text-white" size={22} />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Clock size={18} className="text-gray-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900">{t('admin.recent_orders')}</h2>
          </div>
          <Link href="/admin/orders" data-testid="admin-dashboard-view-all-orders-link" className="text-sm text-[#0071e3] hover:text-[#005bb5] font-bold flex items-center gap-1 transition-colors">
            {t('admin.view_all')}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table data-testid="admin-dashboard-recent-orders-table" className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.order_code')}</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.customer')}</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.total_amount')}</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">{t('admin.status')}</th>
                <th className="text-right px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <tr data-testid="admin-dashboard-recent-orders-empty">
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 font-medium italic">
                    {t('admin.no_orders')}
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const status = statusMap[order.status] || statusMap.pending;
                  return (
                    <tr key={order.id} data-testid={`admin-dashboard-recent-order-row-${order.order_code}`} className="hover:bg-gray-50/80 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-[#0071e3] transition-colors">#{order.order_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-700">{order.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">
                          {Number(order.total_amount).toLocaleString('vi-VN')}
                          <span className="text-[10px] ml-0.5 text-gray-400">₫</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color.replace('bg-', 'bg-opacity-10 bg-').replace('text-', 'text-')}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
