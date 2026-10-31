'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { notifySuccess, notifyError, parseSupabaseError } from '@/lib/utils/notifications';
import { Loader2, Upload, X, Star, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
}

interface ImageItem {
  key: string;
  type: 'existing' | 'new';
  url: string;
  dbId?: string;
  file?: File;
  is_primary: boolean;
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    slug: '',
    description: '',
    description_en: '',
    price: '',
    sale_price: '',
    stock: '',
    category_id: '',
    is_active: true,
  });

  // Unified image list — order in the array = display/sort order
  const [images, setImages] = useState<ImageItem[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Drag state
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchMetadata();
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        name_en: initialData.name_en || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        description_en: initialData.description_en || '',
        price: initialData.price || '',
        sale_price: initialData.sale_price || '',
        stock: initialData.stock || '',
        category_id: initialData.category_id || '',
        is_active: initialData.is_active ?? true,
      });
      if (initialData.product_images && initialData.product_images.length > 0) {
        const sorted = [...initialData.product_images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        setImages(sorted.map((img: any) => ({
          key: img.id,
          type: 'existing' as const,
          url: img.image_url,
          dbId: img.id,
          is_primary: !!img.is_primary,
        })));
      }
    }
  }, [initialData]);

  const fetchMetadata = async () => {
    try {
      const { data: categoriesData } = await supabase.from('categories').select('id, name');

      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-generate slug from name if creating
      if (name === 'name' && !isEdit) {
        const slug = value.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newItems: ImageItem[] = files.map((file, i) => ({
        key: `new-${Date.now()}-${i}`,
        type: 'new' as const,
        url: URL.createObjectURL(file),
        file,
        is_primary: false,
      }));
      setImages(prev => {
        const combined = [...prev, ...newItems];
        // If no primary exists, set the first image as primary
        if (!combined.some(img => img.is_primary) && combined.length > 0) {
          combined[0] = { ...combined[0], is_primary: true };
        }
        return combined;
      });
      e.target.value = '';
    }
  };

  const handleRemoveImage = (key: string) => {
    setImages(prev => {
      const removing = prev.find(img => img.key === key);
      if (removing?.type === 'existing' && removing.dbId) {
        setImagesToDelete(old => [...old, removing.dbId!]);
      }
      const remaining = prev.filter(img => img.key !== key);
      // If removed image was primary, assign primary to the first remaining
      if (removing?.is_primary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], is_primary: true };
      }
      return remaining;
    });
  };

  const handleSetPrimary = (key: string) => {
    setImages(prev => prev.map(img => ({ ...img, is_primary: img.key === key })));
  };

  // --- Drag and drop handlers ---
  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIdx.current;
    if (fromIdx === null || fromIdx === dropIdx) {
      dragIdx.current = null;
      setDragOverIdx(null);
      return;
    }
    setImages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(dropIdx, 0, moved);
      return updated;
    });
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      notifyError('Lỗi', 'Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!formData.slug.trim()) {
      notifyError('Lỗi', 'Slug không được để trống. Vui lòng nhập tên sản phẩm hoặc chỉnh sửa slug.');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      notifyError('Lỗi', 'Giá bán phải lớn hơn 0');
      return;
    }
    if (formData.sale_price && Number(formData.sale_price) >= Number(formData.price)) {
      notifyError('Lỗi', 'Giá khuyến mãi phải nhỏ hơn giá gốc');
      return;
    }
    if (!formData.stock || Number(formData.stock) < 0) {
      notifyError('Lỗi', 'Số lượng tồn kho không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      let productId = initialData?.id;
      
      const productPayload = {
        name: formData.name,
        name_en: formData.name_en,
        slug: formData.slug,
        description: formData.description,
        description_en: formData.description_en,
        price: Number(formData.price),
        sale_price: formData.sale_price ? Number(formData.sale_price) : null,
        stock: Number(formData.stock),
        category_id: formData.category_id || null,
        is_active: formData.is_active,
      };

      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productPayload])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle Image Upload, Deletion & Reordering
      if (imagesToDelete.length > 0) {
        await supabase.from('product_images').delete().in('id', imagesToDelete);
      }

      // Upload new images and collect their public URLs
      const uploadedNewImages: { key: string; url: string }[] = [];
      const newImages = images.filter(img => img.type === 'new' && img.file);
      if (newImages.length > 0 && productId) {
        const uploadResults = await Promise.all(
          newImages.map(async (img, idx) => {
            const fileExt = img.file!.name.split('.').pop();
            const fileName = `${productId}-${Date.now()}-${idx}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(filePath, img.file!);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath);

            return { key: img.key, url: publicUrl };
          })
        );
        uploadedNewImages.push(...uploadResults);
      }

      // Build final ordered list with correct sort_order and is_primary
      const newImageInserts: any[] = [];
      const existingImageUpdates: { id: string; sort_order: number; is_primary: boolean }[] = [];
      let primaryImageUrl: string | null = null;

      images.forEach((img, idx) => {
        if (img.type === 'existing' && img.dbId) {
          existingImageUpdates.push({ id: img.dbId, sort_order: idx, is_primary: img.is_primary });
          if (img.is_primary) primaryImageUrl = img.url;
        } else if (img.type === 'new') {
          const uploaded = uploadedNewImages.find(u => u.key === img.key);
          if (uploaded) {
            newImageInserts.push({
              product_id: productId,
              image_url: uploaded.url,
              sort_order: idx,
              is_primary: img.is_primary,
            });
            if (img.is_primary) primaryImageUrl = uploaded.url;
          }
        }
      });

      // Batch update existing images (sort_order + is_primary)
      if (existingImageUpdates.length > 0) {
        await Promise.all(
          existingImageUpdates.map(upd =>
            supabase.from('product_images')
              .update({ sort_order: upd.sort_order, is_primary: upd.is_primary })
              .eq('id', upd.id)
          )
        );
      }

      // Insert new images
      if (newImageInserts.length > 0) {
        const { error: imageDbError } = await supabase
          .from('product_images')
          .insert(newImageInserts);
        if (imageDbError) throw imageDbError;
      }

      // Update product's denormalized image_url to match the primary image
      if (primaryImageUrl && productId) {
        await supabase.from('products').update({ image_url: primaryImageUrl }).eq('id', productId);
      }

      notifySuccess('Thành công!', `Sản phẩm đã được ${isEdit ? 'cập nhật' : 'tạo'} thành công.`);
      router.push('/admin/products');
      router.refresh();

    } catch (error: any) {
      console.error('Error saving product:', error);
      notifyError('Lỗi', parseSupabaseError(error, 'sản phẩm'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="admin-product-form" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('admin.basic_info') || 'Thông tin cơ bản'}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.product_name') || 'Tên sản phẩm *'}</label>
            <input
              type="text"
              name="name"
              required
              data-testid="admin-product-name-input"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (English)</label>
            <input
              type="text"
              name="name_en"
              data-testid="admin-product-name-en-input"
              value={formData.name_en}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.slug_url') || 'Slug (URL) *'}</label>
            <input
              type="text"
              name="slug"
              required
              data-testid="admin-product-slug-input"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-[#0071e3] focus:border-[#0071e3]"
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.price_label') || 'Giá bán *'}</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                data-testid="admin-product-price-input"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.sale_price_label') || 'Giá khuyến mãi'}</label>
              <input
                type="number"
                name="sale_price"
                min="0"
                data-testid="admin-product-sale-price-input"
                value={formData.sale_price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.stock_label') || 'Số lượng trong kho *'}</label>
            <input
              type="number"
              name="stock"
              required
              min="0"
              data-testid="admin-product-stock-input"
              value={formData.stock}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
            />
          </div>
        </div>

        {/* Classification & Image */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('admin.classification_images') || 'Phân loại & Hình ảnh'}</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.category_label') || 'Danh mục'}</label>
            <select
              name="category_id"
              data-testid="admin-product-category-select"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
            >
              <option value="">{t('admin.select_category') || '-- Chọn danh mục --'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.product_images') || 'Hình ảnh sản phẩm (Có thể chọn nhiều)'}</label>
             <p className="text-xs text-gray-400 mb-3">Kéo thả để sắp xếp thứ tự. Nhấn ★ để chọn ảnh chính.</p>
             <div data-testid="admin-product-image-list" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
               {images.map((img, idx) => (
                 <div
                   key={img.key}
                   data-testid={`admin-product-image-item-${idx}`}
                   draggable
                   onDragStart={() => handleDragStart(idx)}
                   onDragOver={(e) => handleDragOver(e, idx)}
                   onDrop={(e) => handleDrop(e, idx)}
                   onDragEnd={handleDragEnd}
                   className={`relative aspect-square border-2 rounded-lg overflow-hidden group bg-white shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                     dragOverIdx === idx ? 'border-[#0071e3] scale-[1.02] shadow-md' : img.is_primary ? 'border-amber-400' : 'border-gray-200'
                   }`}
                 >
                   <Image src={img.url} alt="Product" fill className="object-contain p-2" />

                   {/* Drag handle */}
                   <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                     <GripVertical size={14} className="text-gray-400" />
                   </div>

                   {/* Set primary button */}
                   <button
                     type="button"
                     data-testid={`admin-product-image-primary-button-${idx}`}
                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSetPrimary(img.key); }}
                     className={`absolute top-2 left-1/2 -translate-x-1/2 p-1.5 rounded-full transition-all z-10 ${
                       img.is_primary
                         ? 'bg-amber-400 text-white shadow-sm'
                         : 'bg-white/80 backdrop-blur-sm text-gray-300 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                     }`}
                     title={img.is_primary ? 'Ảnh chính' : 'Đặt làm ảnh chính'}
                   >
                     <Star size={14} fill={img.is_primary ? 'currentColor' : 'none'} />
                   </button>

                   {/* Remove button */}
                   <button
                     type="button"
                     data-testid={`admin-product-image-remove-button-${idx}`}
                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveImage(img.key); }}
                     className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                   >
                     <X size={14} />
                   </button>

                   {/* Primary label */}
                   {img.is_primary && (
                     <div className="absolute bottom-0 left-0 right-0 bg-amber-400 text-white text-[10px] text-center py-1 font-medium z-10">
                       {t('admin.primary_image') || 'Ảnh chính'}
                     </div>
                   )}

                   {/* Sort order badge */}
                   <div className="absolute bottom-1 right-1 bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
                     {idx + 1}
                   </div>
                 </div>
               ))}

               <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                 <input
                   type="file"
                   accept="image/*"
                   multiple
                   data-testid="admin-product-image-file-input"
                   onChange={handleImageChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <Upload size={24} className="text-gray-400 mb-2 group-hover:text-[#0071e3] transition-colors" />
                 <span className="text-xs text-gray-500 font-medium">{t('admin.add_image') || 'Thêm ảnh'}</span>
               </label>
             </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              data-testid="admin-product-active-checkbox"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-5 w-5 text-[#0071e3] focus:ring-[#0071e3] border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              {t('admin.is_active_product') || 'Kích hoạt sản phẩm (Hiển thị trên web)'}
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.product_description') || 'Mô tả sản phẩm'}</label>
          <textarea
            name="description"
            rows={5}
            data-testid="admin-product-description-input"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Description (English)</label>
          <textarea
            name="description_en"
            rows={5}
            data-testid="admin-product-description-en-input"
            value={formData.description_en}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          data-testid="admin-product-cancel-button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          {t('admin.cancel') || 'Hủy bỏ'}
        </button>
        <button
          type="submit"
          data-testid="admin-product-submit-button"
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#005bb5] font-medium transition-colors disabled:opacity-70"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          <span>{isEdit ? (t('admin.update_product') || 'Cập nhật sản phẩm') : (t('admin.create_product_btn') || 'Tạo sản phẩm')}</span>
        </button>
      </div>
    </form>
  );
}
