import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, 'orders');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    // Create a Supabase client with the user's session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Phiên đăng nhập không hợp lệ' },
        { status: 401 }
      );
    }

    // Fetch user's orders with items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_code,
        total_amount,
        status,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          price,
          quantity,
          subtotal
        ),
        payments (
          status,
          paid_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Không thể tải đơn hàng' },
        { status: 500 }
      );
    }

    // Collect all unique product IDs across all orders
    const productIds = new Set<string>();
    for (const order of orders || []) {
      for (const item of (order as any).order_items || []) {
        if (item.product_id) productIds.add(item.product_id);
      }
    }

    // Batch fetch primary images for all products in ONE query
    let imageMap: Record<string, string> = {};
    if (productIds.size > 0) {
      const { data: images } = await supabase
        .from('product_images')
        .select('product_id, image_url, is_primary')
        .in('product_id', Array.from(productIds))
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });

      if (images) {
        // Keep only the first (best) image per product
        for (const img of images) {
          if (!imageMap[img.product_id]) {
            imageMap[img.product_id] = img.image_url;
          }
        }
      }
    }

    // Map images onto order items (no extra queries)
    const processedOrders = (orders || []).map((order: any) => ({
      ...order,
      order_items: order.order_items.map((item: any) => ({
        ...item,
        image_url: item.product_id ? (imageMap[item.product_id] || null) : null,
      })),
    }));

    return NextResponse.json({ orders: processedOrders });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    );
  }
}
