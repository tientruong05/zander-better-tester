import { supabase } from '@/lib/supabase';
import HomeClient from './HomeClient';
import { Product, Category } from '@/types';

export const revalidate = 0;

type ProductWithImages = Product & {
  product_images?: Array<{ image_url: string; is_primary: boolean }>;
};

async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }

  return ((data || []) as ProductWithImages[]).map((product) => {
    const primaryImage = product.product_images?.find((img) => img.is_primary)
      || product.product_images?.[0];
    return {
      ...product,
      image_url: primaryImage?.image_url || product.image_url || undefined,
    };
  });
}

async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []) as Category[];
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <HomeClient featuredProducts={featuredProducts} categories={categories} />
  );
}
