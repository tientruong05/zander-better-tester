import { supabase } from '@/lib/supabase';
import { Product, ProductReview } from '@/types';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

type ProductWithImages = Product & {
  product_images?: Array<{ image_url: string; is_primary: boolean; sort_order: number }>;
};

async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images(image_url, is_primary, sort_order)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !product) {
    return null;
  }

  const typedProduct = product as ProductWithImages;
  const primaryImage = typedProduct.product_images?.find((img) => img.is_primary)
    || typedProduct.product_images?.[0];

  return {
    ...typedProduct,
    image_url: primaryImage?.image_url || typedProduct.image_url || undefined,
  };
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, product_images(image_url, is_primary, sort_order)')
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4);

  if (product.category_id) {
    query = query.eq('category_id', product.category_id);
  }

  const { data } = await query;

  return ((data || []) as ProductWithImages[]).map((product) => {
    const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0];
    return { ...product, image_url: primaryImage?.image_url || product.image_url || undefined };
  });
}

async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const { data } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  return data || [];
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedProducts(product),
    getProductReviews(product.id),
  ]);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      initialReviews={reviews}
    />
  );
}
