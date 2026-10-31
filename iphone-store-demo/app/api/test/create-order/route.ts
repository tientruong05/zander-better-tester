import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isTestApiEnabled, testApiNotFound } from "@/lib/test-mode";
import {
  TEST_CUSTOMER,
  isValidOrderStatus,
  paymentStatusForOrderStatus,
} from "@/lib/test-data";

type CreateOrderBody = {
  status?: string;
  productId?: string;
  quantity?: number;
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  paymentMethod?: "bank_transfer" | "cash";
  deliveryMethod?: "shipping" | "pickup";
};

async function generateOrderCode(): Promise<number> {
  // millisecond timestamp, retried on the unlikely unique collision
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = Date.now() + attempt;
    const { data } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("order_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique order code");
}

export async function POST(request: NextRequest) {
  if (!isTestApiEnabled()) return testApiNotFound();

  try {
    const body = (await request.json().catch(() => ({}))) as CreateOrderBody;

    if (!isValidOrderStatus(body.status)) {
      return NextResponse.json(
        {
          error: "status is required and must be one of: pending, paid, processing, shipped, completed, cancelled, failed",
        },
        { status: 400 },
      );
    }

    const quantity = Number(body.quantity ?? 1);
    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "quantity must be a positive integer" },
        { status: 400 },
      );
    }

    // Find the requested product, or fall back to the first active product.
    let product: {
      id: string;
      name: string;
      price: number;
      sale_price: number | null;
      stock: number;
    } | null = null;

    if (body.productId) {
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("id, name, price, sale_price, stock, is_active")
        .eq("id", body.productId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      product = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("id, name, price, sale_price, stock")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw new Error(error.message);
      product = data?.[0] ?? null;
    }

    if (!product) {
      return NextResponse.json(
        { error: "No product found. Call POST /api/test/seed first." },
        { status: 400 },
      );
    }

    const unitPrice = Number(product.sale_price ?? product.price);
    const totalAmount = unitPrice * quantity;
    const orderCode = await generateOrderCode();

    const customer = {
      fullName: body.customer?.fullName || TEST_CUSTOMER.fullName,
      email: body.customer?.email || TEST_CUSTOMER.email,
      phone: body.customer?.phone || TEST_CUSTOMER.phone,
      address: body.customer?.address || "123 Test Street, Test Ward, Test City",
    };

    const paymentMethod = body.paymentMethod === "cash" ? "cash" : "bank_transfer";
    const deliveryMethod = body.deliveryMethod === "pickup" ? "pickup" : "shipping";

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_code: orderCode,
        customer_name: customer.fullName,
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_address: customer.address,
        total_amount: totalAmount,
        status: body.status,
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        language: "vi",
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        price: unitPrice,
        quantity,
        subtotal: totalAmount,
      })
      .select()
      .single();
    if (itemError) {
      throw new Error(`Failed to create order item: ${itemError.message}`);
    }

    const paymentStatus = paymentStatusForOrderStatus(body.status);
    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      payment_link_id: `TEST-${orderCode}`,
      checkout_url: null,
      amount: totalAmount,
      status: paymentStatus,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    });
    if (paymentError) {
      throw new Error(`Failed to create payment: ${paymentError.message}`);
    }

    return NextResponse.json({
      success: true,
      order,
      items: [item],
      product: { id: product.id, name: product.name, unitPrice },
    });
  } catch (error) {
    console.error("Test create-order error:", error);
    return NextResponse.json(
      {
        error: "Failed to create test order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
