import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPayOS } from '@/lib/payos';
import { sendEmail } from '@/lib/mail';
import { createOrderConfirmationEmail, getT } from '@/lib/email-templates';

/**
 * POST /api/orders/confirm-payment
 *
 * Called by the frontend PaymentVerifier when the user is redirected back
 * from PayOS with ?status=PAID. This is a "catch-up" endpoint:
 *
 * - It verifies with PayOS that payment actually succeeded
 * - Sets order status to 'paid' + sends confirmation email
 * - Does NOT decrement stock (webhook is the authoritative source for stock)
 *
 * Idempotent: if order is already 'paid'/'processing'/'shipping'/'completed',
 * it returns success without doing anything.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderCode } = await request.json();

    if (!orderCode) {
      return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 });
    }

    // Verify with PayOS that payment actually succeeded
    const paymentInfo = await getPayOS().paymentRequests.get(orderCode);

    if (!paymentInfo || paymentInfo.status !== 'PAID') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Find order with items in a single query
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(`
        id, customer_name, customer_email, total_amount, shipping_address, status, language,
        order_items (product_id, quantity, price, product_name)
      `)
      .eq('order_code', orderCode)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency: already confirmed, just return success
    if (order.status !== 'pending' && order.status !== 'failed') {
      return NextResponse.json({ success: true, message: 'Order already processed' });
    }

    // Update order + payment status in parallel
    // NOTE: Stock decrement is NOT done here — webhook is the authoritative source.
    await Promise.all([
      supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', order.id),
      supabaseAdmin
        .from('payments')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('order_id', order.id),
    ]);

    // Fire-and-forget email — don't block the response
    const orderItems = (order as any).order_items as any[] | null;
    if (order.customer_email && orderItems) {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      const trackingUrl = `${baseUrl}/track-order?code=${orderCode}`;
      const emailHtml = createOrderConfirmationEmail({
        customerName: order.customer_name,
        orderCode: orderCode.toString(),
        items: orderItems,
        total: order.total_amount,
        shippingAddress: order.shipping_address,
        trackingUrl,
        language: order.language || 'vi',
      });
      const tEmail = getT(order.language || 'vi');
      sendEmail({
        to: order.customer_email,
        subject: tEmail('confirmation_subject', { code: orderCode.toString() }),
        html: emailHtml,
      }).catch((emailError) => console.error('Failed to send confirmation email:', emailError));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
