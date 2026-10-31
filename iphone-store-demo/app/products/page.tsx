import ProductsClient from './ProductsClient';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';

interface SearchParams {
  page?: string;
  category?: string;    // slug - from Navbar links
  categoryId?: string;  // id - from sidebar filters
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return [];
  return data || [];
}

async function getProducts(params: SearchParams, categories: Category[]): Promise<{ products: Product[]; total: number }> {
  const page = Number(params.page) || 1;
  const limit = 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Resolve category: prefer categoryId (direct ID), fall back to slug lookup
  let resolvedCategoryId: string | undefined = params.categoryId;
  if (!resolvedCategoryId && params.category) {
    const found = categories.find((c) => c.slug === params.category);
    if (found) resolvedCategoryId = found.id;
  }

  // Determine sort order
  let ascending = false;
  let sortCol = 'created_at';
  if (params.sort === 'price_asc') { sortCol = 'price'; ascending = true; }
  else if (params.sort === 'price_desc') { sortCol = 'price'; ascending = false; }

  let query = supabase
    .from('products')
    .select(`*, product_images(image_url, is_primary, sort_order)`, { count: 'exact' })
    .eq('is_active', true)
    .order(sortCol, { ascending })
    .range(from, to);

  if (resolvedCategoryId) query = query.eq('category_id', resolvedCategoryId);
  if (params.minPrice) query = query.gte('price', Number(params.minPrice));
  if (params.maxPrice) query = query.lte('price', Number(params.maxPrice));

  const { data: products, error, count } = await query;
  if (error) return { products: [], total: 0 };

  const processedProducts = ((products || []) as Array<Product & { product_images?: Array<{ image_url: string; is_primary: boolean }> }>).map((product) => {
    const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0];
    return { ...product, image_url: primaryImage?.image_url || product.image_url || undefined };
  });

  return { products: processedProducts, total: count || 0 };
}

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;
  const categories = await getCategories();
  const { products, total } = await getProducts(searchParams, categories);
  const currentPage = Number(searchParams.page) || 1;
  const totalPages = Math.ceil(total / 12);

  // Resolve active categoryId for sidebar highlighting
  let activeCategoryId = searchParams.categoryId;
  if (!activeCategoryId && searchParams.category) {
    const found = categories.find((c) => c.slug === searchParams.category);
    if (found) activeCategoryId = found.id;
  }

  return (
    <ProductsClient
      products={products}
      total={total}
      categories={categories}
      currentPage={currentPage}
      totalPages={totalPages}
      activeCategoryId={activeCategoryId}
      activeSort={searchParams.sort}
    />
  );
}
