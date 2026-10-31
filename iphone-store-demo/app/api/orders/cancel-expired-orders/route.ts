import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPayOS } from '@/lib/payos';

/**
 * GET /api/orders/cancel-expired-orders
 *
 * Cancels pending orders that are older than 3 days.
 * Must be called with the correct cron secret header:
 *   x-cron-secret: <CRON_SECRET env var>
 *
 * Set up a Vercel cron job or external scheduler to call this daily.
 */
export async function GET(request: NextRequest) {
  // Auth guard — prevent public access
  const cronSecret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Find all pending orders older than 3 days
    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_code')
      .eq('status', 'pending')
      .lt('created_at', threeDaysAgo);

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ success: true, cancelled: 0, message: 'No expired orders found' });
    }

    const results = await Promise.allSettled(
      expiredOrders.map(async (order: { id: string; order_code: number }) => {
        // Cancel PayOS payment link (ignore errors if link already expired/cancelled)
        try {
          await getPayOS().paymentRequests.cancel(order.order_code.toString());
        } catch (err) {
          console.warn(`Could not cancel PayOS link for order ${order.order_code}:`, err);
        }

        // Update order status to cancelled
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id);

        if (error) throw new Error(`Failed to cancel order ${order.id}: ${error.message}`);
        return order.id;
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Auto-cancel: ${succeeded} cancelled, ${failed} failed`);

    return NextResponse.json({
      success: true,
      cancelled: succeeded,
      failed,
      total: expiredOrders.length,
    });
  } catch (error) {
    console.error('Auto-cancel error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
