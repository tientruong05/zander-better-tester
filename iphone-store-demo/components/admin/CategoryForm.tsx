'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { notifySuccess, notifyError, parseSupabaseError } from '@/lib/utils/notifications';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function CategoryForm({ initialData, isEdit = false }: CategoryFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    slug: '',
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        name_en: initialData.name_en || '',
        slug: initialData.slug || '',
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    // Only auto-generate slug if creating, or if user hasn't manually edited slug (simplified logic: always auto-gen on create)
    const updates: any = { name };
    if (!isEdit) {
      updates.slug = generateSlug(name);
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notifyError('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);
    if (!slug) {
      notifyError('Lỗi', 'Slug không hợp lệ. Vui lòng nhập tên danh mục hoặc chỉnh sửa slug.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        name_en: formData.name_en || null,
        slug: formData.slug || generateSlug(formData.name),
        is_active: formData.is_active,
      };

      if (isEdit) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', initialData.id);
        if (error) throw error;
        notifySuccess('Thành công', 'Đã cập nhật danh mục!');
      } else {
        // Build payload including sort_order
        // We need to fetch current max sort_order to append. 
        // Or simpler: just count. For robust solution, fetch count.
        const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        
        const { error } = await supabase
          .from('categories')
          .insert([{ ...payload, sort_order: count || 0 }]);
          
        if (error) throw error;
        notifySuccess('Thành công', 'Đã tạo danh mục mới!');
      }

      router.push('/admin/categories');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving category:', error);
      notifyError('Lỗi', parseSupabaseError(error, 'danh mục'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/categories"
            data-testid="admin-category-back-link"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? (t('admin.edit_category_title') || 'Chỉnh Sửa Danh Mục') : (t('admin.create_category_title') || 'Thêm Danh Mục Mới')}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} data-testid="admin-category-form" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.category_name') || 'Tên danh mục *'}</label>
              <input
                type="text"
                data-testid="admin-category-name-input"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
                placeholder="VD: Quần áo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name (English)</label>
              <input
                type="text"
                data-testid="admin-category-name-en-input"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
                placeholder="VD: Clothing"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              data-testid="admin-category-slug-input"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-[#0071e3] focus:border-[#0071e3] font-mono text-sm"
              placeholder="quan-ao"
            />
          </div>



          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              data-testid="admin-category-active-checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-5 w-5 text-[#0071e3] focus:ring-[#0071e3] border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
              {t('admin.is_active_category') || 'Hiển thị danh mục này'}
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <Link
            href="/admin/categories"
            data-testid="admin-category-cancel-link"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            {t('admin.cancel') || 'Hủy'}
          </Link>
          <button
            type="submit"
            data-testid="admin-category-submit-button"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#005bb5] font-medium transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>{isEdit ? (t('admin.update_category_btn') || 'Lưu thay đổi') : (t('admin.create_category_btn') || 'Tạo danh mục')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
