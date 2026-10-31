import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { sendEmail } from '@/lib/mail';
import { sendAndForwardEmail } from '@/lib/email-forwarder';
import { createOrderConfirmationEmail, createAdminOrderNotificationEmail, getT } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log webhook for debugging (non-blocking)
    supabaseAdmin.from('payment_webhooks').insert({
      order_code: body.orderCode || body.data?.orderCode || 0,
      payload: body,
    }).then(null, () => { /* Non-fatal — table may not exist yet */ });

    // ── Verify webhook signature (REQUIRED) ────────────────────────
    const signature = request.headers.get('x-payos-signature');
    if (!signature) {
      console.error('Webhook rejected: missing x-payos-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const checksumKey = process.env.PAYOS_CHECKSUM_KEY!;

    // PayOS sends the data object sorted, reconstruct signature
    const dataToSign = body.data
      ? Object.keys(body.data)
          .sort()
          .map((key) => `${key}=${body.data[key]}`)
          .join('&')
      : JSON.stringify(body);

    const expectedSignature = crypto
      .createHmac('sha256', checksumKey)
      .update(dataToSign)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Webhook rejected: invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ── Parse payload ──────────────────────────────────────────────
    const orderCode = body.data?.orderCode || body.orderCode;
    const code = body.data?.code || body.code;

    if (!orderCode) {
      return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 });
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
      console.error('Order not found:', orderCode);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ── Idempotency guard ──────────────────────────────────────────
    if (order.status !== 'pending') {
      console.log(`Webhook skipped: order ${orderCode} already has status '${order.status}'`);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const orderItems = (order as any).order_items as any[] | null;

    if (code === '00') {
      // ── Payment successful ──────────────────────────────────────
      // Update order + payment status in parallel
      await Promise.all([
        supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', order.id),
        supabaseAdmin
          .from('payments')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('order_id', order.id),
      ]);

      // Decrement stock in parallel (authoritative — only done here, NOT in confirm-payment)
      if (orderItems && orderItems.length > 0) {
        await Promise.all(
          orderItems
            .filter((item) => item.product_id)
            .map((item) =>
              supabaseAdmin.rpc('decrease_product_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              })
            )
        );
      }

      // Fire-and-forget email — don't block webhook response
      if (order.customer_email && orderItems) {
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        const trackingUrl = `${baseUrl}/track-order?code=${orderCode}`;
        const tEmail = getT(order.language || 'vi');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

        // Email to customer (payment confirmation)
        const customerEmailHtml = createOrderConfirmationEmail({
          customerName: order.customer_name,
          orderCode: orderCode.toString(),
          items: orderItems,
          total: order.total_amount,
          shippingAddress: order.shipping_address,
          trackingUrl,
          language: order.language || 'vi',
        });

        sendEmail({
          to: order.customer_email,
          subject: tEmail('confirmation_subject', { code: orderCode.toString() }),
          html: customerEmailHtml,
        }).catch((emailError) => console.error('Failed to send confirmation email to customer:', emailError));

        // Admin notification email (will be forwarded)
        const adminEmailHtml = createAdminOrderNotificationEmail({
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          orderCode: orderCode.toString(),
          items: orderItems,
          total: order.total_amount,
          shippingAddress: order.shipping_address,
          paymentMethod: order.payment_method || 'bank_transfer',
          language: order.language || 'vi',
        });

        sendAndForwardEmail({
          to: adminEmail,
          subject: `You have a new order - Order #${orderCode}`,
          html: adminEmailHtml,
        }).catch((emailError) => console.error('Failed to send admin notification:', emailError));
      }
    } else {
      // ── Payment failed or cancelled (parallel) ─────────────────
      await Promise.all([
        supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', order.id),
        supabaseAdmin.from('payments').update({ status: 'failed' }).eq('order_id', order.id),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
