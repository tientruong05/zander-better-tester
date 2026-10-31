import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/track-order
 *
 * Query params:
 *   ?code=<order_code>              → checks if order exists and returns { type: 'require_phone' }
 *   ?code=<order_code>&phone4=1234  → returns single order with items if phone matches
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const phone4 = searchParams.get('phone4');

  if (!code) {
    return NextResponse.json({ error: 'Vui lòng cung cấp mã đơn hàng' }, { status: 400 });
  }

  try {
    // ── Search by order code ──────────────────────────────────────
    if (code) {
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('id, order_code, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, created_at, updated_at, payment_link_url')
        .eq('order_code', Number(code))
        .single();

      if (error || !order) {
        return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }

      if (!phone4) {
        return NextResponse.json({ type: 'require_phone' });
      }

      const orderPhone = order.customer_phone || '';
      const orderPhone4 = orderPhone.replace(/\s/g, '').slice(-4);
      const inputPhone4 = phone4.trim();
      
      if (orderPhone4 !== inputPhone4) {
        return NextResponse.json({ error: '4 số cuối không chính xác' }, { status: 400 });
      }

      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('id, product_name, price, quantity, subtotal, product_id, product:products(name, name_en)')
        .eq('order_id', order.id);

      return NextResponse.json({ type: 'single', order, items: items || [] });
    }
  } catch (error) {
    console.error('Track order error:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
