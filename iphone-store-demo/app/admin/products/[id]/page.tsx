'use client';

import ProductForm from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EditProductPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images(id, image_url, is_primary, sort_order)
          `)
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        Swal.fire('Lỗi', 'Không tìm thấy sản phẩm', 'error').then(() => {
            router.push('/admin/products');
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="animate-spin text-[#0071e3]" size={40} />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/products" data-testid="admin-product-back-link" className="text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.edit_product_title') || 'Chỉnh Sửa Sản Phẩm'}</h1>
      </div>

      <ProductForm initialData={product} isEdit={true} />
    </div>
  );
}
