'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notifySuccess, notifyError, confirmAction } from '@/lib/utils/notifications';
import { Plus, Loader2, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await confirmAction(
      t('admin.confirm_delete_title'),
      `${t('admin.confirm_delete_text')} "${name}"?`,
      t('admin.btn_delete')
    );
    if (result.isConfirmed) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        notifySuccess(t('admin.msg_success'), t('admin.msg_success_delete'));
      } else {
        notifyError(t('admin.msg_error'), t('admin.msg_error_delete_category'));
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('categories').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !currentStatus } : c)));
      notifySuccess(t('admin.msg_success'), `${!currentStatus ? t('admin.btn_show') : t('admin.btn_hide')}`);
    } else {
      notifyError(t('admin.msg_error'), t('admin.msg_error'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">{t('admin.categories_title')}</h1>
        <Link
          href="/admin/categories/create"
          data-testid="admin-categories-create-link"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] text-white text-sm font-medium rounded-lg hover:bg-[#005bb5] transition-colors"
        >
          <Plus size={16} />
          <span>{t('admin.btn_add_new')}</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="admin-categories-table" className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                <th className="text-left px-5 py-3">{t('admin.table_category')}</th>
                <th className="text-left px-5 py-3">{t('admin.table_slug')}</th>
                <th className="text-left px-5 py-3">{t('admin.status') || 'Trạng thái'}</th>
                <th className="text-right px-5 py-3">{t('admin.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr data-testid="admin-categories-loading-state">
                  <td colSpan={4} className="py-12 text-center">
                    <Loader2 className="animate-spin text-[#0071e3] mx-auto" size={28} />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr data-testid="admin-categories-empty-state">
                  <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                    {t('admin.categories_no_categories')}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} data-testid={`admin-category-row-${cat.id}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">{cat.slug}</code>
                    </td>
                    <td className="px-5 py-3">
                      <button data-testid={`admin-category-toggle-active-${cat.id}`} onClick={() => toggleActive(cat.id, cat.is_active)}>
                        {cat.is_active ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 items-center gap-1">
                            <Eye size={12} /> {t('admin.btn_show')}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 items-center gap-1">
                            <EyeOff size={12} /> {t('admin.btn_hide')}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/categories/${cat.id}`}
                          data-testid={`admin-category-edit-link-${cat.id}`}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          data-testid={`admin-category-delete-button-${cat.id}`}
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
