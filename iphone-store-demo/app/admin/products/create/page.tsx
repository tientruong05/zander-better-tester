'use client';

import ProductForm from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CreateProductPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/products" data-testid="admin-product-back-link" className="text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.create_product_title') || 'Thêm Sản Phẩm Mới'}</h1>
      </div>

      <ProductForm />
    </div>
  );
}
