'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { Plus, Search, Loader2, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  product_images: { image_url: string; is_primary: boolean }[];
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`*, product_images(image_url, is_primary)`)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (isMounted) setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: t('admin.confirm_delete_title'),
      text: `${t('admin.confirm_delete_text')} "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0071e3',
      cancelButtonText: t('common.cancel') || 'Hủy',
      confirmButtonText: t('admin.btn_delete'),
    });
    if (result.isConfirmed) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        Swal.fire(t('admin.msg_error'), t('admin.msg_error_delete'), 'error');
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        Swal.fire(t('admin.msg_success'), t('admin.msg_success_delete'), 'success');
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p)));
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImage = (product: Product) => {
    const primary = product.product_images?.find((img) => img.is_primary);
    return primary?.image_url || product.product_images?.[0]?.image_url || null;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">{t('admin.products_title')}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              data-testid="admin-products-search-input"
              type="text"
              placeholder={t('admin.orders_search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent w-56"
            />
          </div>
          <Link
            href="/admin/products/create"
            data-testid="admin-products-create-link"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] text-white text-sm font-medium rounded-lg hover:bg-[#005bb5] transition-colors"
          >
            <Plus size={16} />
            <span>{t('admin.btn_add_new')}</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="admin-products-table" className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                <th className="text-left px-5 py-3">{t('admin.table_product')}</th>
                <th className="text-left px-5 py-3">{t('admin.table_price')}</th>
                <th className="text-left px-5 py-3">{t('admin.table_sale_price')}</th>
                <th className="text-left px-5 py-3">{t('admin.status') || 'Trạng thái'}</th>
                <th className="text-right px-5 py-3">{t('admin.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="animate-spin text-[#0071e3] mx-auto" size={28} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} data-testid="admin-products-empty-state" className="py-12 text-center text-sm text-gray-400">
                    {t('admin.products_no_products')}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const imageUrl = getImage(product);
                  return (
                    <tr key={product.id} data-testid={`admin-product-row-${product.id}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={product.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {Number(product.price).toLocaleString('vi-VN')}₫
                      </td>
                      <td className="px-5 py-3 text-sm">
                        {product.sale_price ? (
                          <span className="text-[#0071e3] font-medium">{Number(product.sale_price).toLocaleString('vi-VN')}₫</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button data-testid={`admin-product-toggle-active-${product.id}`} onClick={() => toggleActive(product.id, product.is_active)}>
                          {product.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <Eye size={12} /> {t('admin.btn_show')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              <EyeOff size={12} /> {t('admin.btn_hide')}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product.id}`}
                            data-testid={`admin-product-edit-link-${product.id}`}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={15} />
                          </Link>
                          <button
                            data-testid={`admin-product-delete-button-${product.id}`}
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
