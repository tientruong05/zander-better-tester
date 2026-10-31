import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/orders/[id]
 *
 * Fetches order details by its UUID.
 * We use `supabaseAdmin` here because RLS restricts public read access
 * to the `orders` and `order_items` tables to prevent data leaks.
 * The unguessable UUID acts as a secure access token for guests.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Mã đơn hàng không hợp lệ' }, { status: 400 });
    }

    // Fetch order with items and product images in a single query
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*, product:products(name, product_images(image_url)))
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      console.error('API /api/orders/[id] fetch error:', orderError);
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Extract items from the combined query result
    const items = (order as any).order_items || [];
    const { order_items, ...orderData } = order as any;

    return NextResponse.json({
      success: true,
      order: orderData,
      items,
    });
  } catch (error) {
    console.error('API /api/orders/[id] global error:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
