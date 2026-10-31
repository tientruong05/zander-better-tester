import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isMockPayment } from "@/lib/test-mode";

// Mock payment gateway used when PAYMENT_MODE=mock.
// The page /checkout/mock-payment calls this endpoint after the user
// clicks "Pay successfully" or "Payment failed".
export async function POST(request: NextRequest) {
  if (!isMockPayment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    const orderCode = Number(body?.orderCode);
    const result = body?.result;

    if (result !== "success" && result !== "failed") {
      return NextResponse.json(
        { error: "result must be 'success' or 'failed'" },
        { status: 400 },
      );
    }

    if (!orderId && !Number.isFinite(orderCode)) {
      return NextResponse.json(
        { error: "orderId or orderCode is required" },
        { status: 400 },
      );
    }

    let query = supabaseAdmin
      .from("orders")
      .select("id, order_code, status, total_amount, order_items(id, product_id, quantity)");

    query = orderId ? query.eq("id", orderId) : query.eq("order_code", orderCode);

    const { data: order, error: orderError } = await query.maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: only pending orders can transition.
    if (order.status !== "pending") {
      return NextResponse.json({
        success: true,
        message: "Order already processed",
        orderId: order.id,
        orderCode: order.order_code,
        status: order.status,
      });
    }

    const configuredDelay = Number(process.env.MOCK_PAYMENT_DELAY_MS ?? 1000);
    const delayMs = Number.isFinite(configuredDelay)
      ? Math.min(30_000, Math.max(0, configuredDelay))
      : 1000;
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const targetStatus = result === "success" ? "paid" : "failed";
    const paymentStatus = result === "success" ? "paid" : "failed";

    const { error: updateOrderError } = await supabaseAdmin
      .from("orders")
      .update({ status: targetStatus })
      .eq("id", order.id);
    if (updateOrderError) throw new Error(updateOrderError.message);

    // The checkout route always creates a payments row in mock mode, but
    // fall back to an insert if the row is missing (e.g. legacy data).
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();

    const paymentUpdate = {
      status: paymentStatus,
      paid_at: result === "success" ? new Date().toISOString() : null,
    };

    if (existingPayment) {
      const { error } = await supabaseAdmin
        .from("payments")
        .update(paymentUpdate)
        .eq("id", existingPayment.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("payments").insert({
        order_id: order.id,
        payment_link_id: `MOCK-${order.order_code}`,
        checkout_url: null,
        amount: order.total_amount,
        ...paymentUpdate,
      });
      if (error) throw new Error(error.message);
    }

    // Successful bank-transfer payments decrease stock, mirroring the
    // real PayOS webhook behavior.
    if (result === "success") {
      const items = (order.order_items ?? []) as Array<{
        product_id: string | null;
        quantity: number;
      }>;
      await Promise.all(
        items
          .filter((item) => item.product_id)
          .map((item) =>
            supabaseAdmin.rpc("decrease_product_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            }),
          ),
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderCode: order.order_code,
      status: targetStatus,
    });
  } catch (error) {
    console.error("Mock payment error:", error);
    return NextResponse.json(
      {
        error: "Mock payment failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
