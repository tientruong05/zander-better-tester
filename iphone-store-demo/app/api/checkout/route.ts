import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPayOS } from "@/lib/payos";
import { isMockPayment } from "@/lib/test-mode";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/mail";
import { sendAndForwardEmail } from "@/lib/email-forwarder";
import {
  createPendingOrderEmail,
  createCashOrderEmail,
  createAdminOrderNotificationEmail,
  getT,
} from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, "checkout");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const {
      customerInfo,
      items,
      totalAmount,
      paymentMethod,
      deliveryMethod,
      collectionPointId,
      language = "vi",
      shippingFee = 0,
    } = body;

    // Validate required fields
    if (!customerInfo || !items || !totalAmount || items.length === 0) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 },
      );
    }

    // Validate stock availability + gather product names (parallel)
    const stockChecks = await Promise.all(
      items.map((item: any) =>
        supabaseAdmin
          .from("products")
          .select("name, stock, is_active")
          .eq("id", item.productId)
          .single()
          .then(({ data: product }: { data: any }) => ({ item, product })),
      ),
    );

    const enrichedItems: {
      productId: string;
      quantity: number;
      price: number;
      product_name: string;
    }[] = [];
    for (const { item, product } of stockChecks) {
      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: "Sản phẩm không tồn tại hoặc đã ngừng bán" },
          { status: 400 },
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: "Không đủ hàng trong kho" },
          { status: 400 },
        );
      }
      enrichedItems.push({ ...item, product_name: product.name });
    }

    // Generate unique order code (timestamp-based)
    const orderCode = Date.now();

    // Format full shipping address
    const fullShippingAddress = [
      customerInfo.address,
      customerInfo.ward,
      customerInfo.district,
      customerInfo.city,
    ]
      .filter(Boolean)
      .join(", ");

    // For pickup orders, fetch the collection point name + address
    let emailAddress = fullShippingAddress;
    if (deliveryMethod === "pickup" && collectionPointId) {
      const { data: cp } = await supabaseAdmin
        .from("collection_points")
        .select("name, address")
        .eq("id", collectionPointId)
        .single();
      if (cp) {
        emailAddress = `${cp.name} - ${cp.address}`;
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_code: orderCode,
        shipping_address: fullShippingAddress,
        customer_name: customerInfo.fullName,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        total_amount: totalAmount,
        status: paymentMethod === "cash" ? "processing" : "pending",
        payment_method: paymentMethod || "bank_transfer",
        delivery_method: deliveryMethod || "shipping",
        collection_point_id: collectionPointId || null,
        language,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Không thể tạo đơn hàng" },
        { status: 500 },
      );
    }

    const orderItemsToInsert = enrichedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

    if (shippingFee > 0) {
      orderItemsToInsert.push({
        order_id: order.id,
        product_id: null as any,
        product_name: "Phí vận chuyển",
        price: shippingFee,
        quantity: 1,
        subtotal: shippingFee,
      });
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Không thể tạo chi tiết đơn hàng" },
        { status: 500 },
      );
    }

    // Create payment link: either the real PayOS checkout or the local
    // mock gateway used by automated tests (PAYMENT_MODE=mock).
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    let checkoutUrl: string | null = null;

    if (paymentMethod !== "cash") {
      if (isMockPayment()) {
        // Skip PayOS entirely. The mock page lets Playwright click
        // "pay successfully" or "payment failed".
        checkoutUrl = `${baseUrl}/checkout/mock-payment?orderId=${order.id}`;

        await Promise.all([
          supabaseAdmin.from("payments").insert({
            order_id: order.id,
            payment_link_id: `MOCK-${orderCode}`,
            checkout_url: checkoutUrl,
            amount: totalAmount,
            status: "pending",
          }),
          supabaseAdmin
            .from("orders")
            .update({ payment_link_url: checkoutUrl })
            .eq("id", order.id),
        ]);
      } else {
        try {
          const payosItems = enrichedItems.map((item) => ({
            name: item.product_name.substring(0, 50),
            quantity: item.quantity,
            price: Math.round(item.price),
          }));

          if (shippingFee > 0) {
            payosItems.push({
              name: "Phí vận chuyển",
              quantity: 1,
              price: Math.round(shippingFee),
            });
          }

          const paymentData = {
            orderCode,
            amount: Math.round(totalAmount),
            description: `DH ${orderCode}`.substring(0, 25),
            items: payosItems,
            returnUrl: `${baseUrl}/orders/${order.id}`,
            cancelUrl: `${baseUrl}/checkout`,
          };

          const paymentLinkResponse =
            await getPayOS().paymentRequests.create(paymentData);
          checkoutUrl = paymentLinkResponse.checkoutUrl;

          // Save payment record + store checkout URL on the order
          await Promise.all([
            supabaseAdmin.from("payments").insert({
              order_id: order.id,
              payment_link_id: paymentLinkResponse.paymentLinkId,
              checkout_url: checkoutUrl,
              amount: totalAmount,
              status: "pending",
            }),
            supabaseAdmin
              .from("orders")
              .update({ payment_link_url: checkoutUrl })
              .eq("id", order.id),
          ]);
        } catch (paymentError) {
          console.error("PayOS error:", paymentError);
          // Proceed without payment link — order is created
        }
      }
    }

    if (paymentMethod === "cash") {
      // Decrement stock for cash orders in parallel (no webhook fires for cash payments)
      await Promise.all(
        enrichedItems.map((item) =>
          supabaseAdmin.rpc("decrease_product_stock", {
            p_product_id: item.productId,
            p_quantity: item.quantity,
          }),
        ),
      );
    }

    // Fire-and-forget email — don't block the response for SMTP
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

    if (!isMockPayment() && paymentMethod === "cash" && customerInfo.email) {
      const trackingUrl = `${baseUrl}/track-order?code=${orderCode}`;
      const tEmail = getT(language);

      // Email to customer (cash payment confirmation)
      const customerEmailHtml = createCashOrderEmail({
        customerName: customerInfo.fullName,
        orderCode: orderCode.toString(),
        items: orderItemsToInsert,
        total: totalAmount,
        shippingAddress: emailAddress,
        deliveryMethod: deliveryMethod || "shipping",
        trackingUrl,
        language,
      });

      sendEmail({
        to: customerInfo.email,
        subject: tEmail("cash_subject", { code: orderCode.toString() }),
        html: customerEmailHtml,
      }).catch((emailError) =>
        console.error(
          "Failed to send cash order email to customer:",
          emailError,
        ),
      );

      // Admin notification email (will be forwarded)
      const adminEmailHtml = createAdminOrderNotificationEmail({
        customerName: customerInfo.fullName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        orderCode: orderCode.toString(),
        items: orderItemsToInsert,
        total: totalAmount,
        shippingAddress: emailAddress,
        paymentMethod: "cash",
        deliveryMethod: deliveryMethod || "shipping",
        language,
      });

      sendAndForwardEmail({
        to: adminEmail,
        subject: `Bạn có đơn hàng mới - Đơn hàng #${orderCode}`,
        html: adminEmailHtml,
      }).catch((emailError) =>
        console.error("Failed to send admin notification:", emailError),
      );
    } else if (
      !isMockPayment() &&
      paymentMethod !== "cash" &&
      customerInfo.email &&
      checkoutUrl
    ) {
      const trackingUrl = `${baseUrl}/track-order?code=${orderCode}`;
      const tEmail = getT(language);

      // Email to customer (pending payment)
      const customerEmailHtml = createPendingOrderEmail({
        customerName: customerInfo.fullName,
        orderCode: orderCode.toString(),
        items: orderItemsToInsert,
        total: totalAmount,
        shippingAddress: emailAddress,
        paymentUrl: checkoutUrl,
        trackingUrl,
        language,
      });

      sendEmail({
        to: customerInfo.email,
        subject: tEmail("pending_subject", { code: orderCode.toString() }),
        html: customerEmailHtml,
      }).catch((emailError) =>
        console.error(
          "Failed to send pending order email to customer:",
          emailError,
        ),
      );

      // Admin notification email (will be forwarded)
      const adminEmailHtml = createAdminOrderNotificationEmail({
        customerName: customerInfo.fullName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        orderCode: orderCode.toString(),
        items: orderItemsToInsert,
        total: totalAmount,
        shippingAddress: emailAddress,
        paymentMethod: "bank_transfer",
        deliveryMethod: deliveryMethod || "shipping",
        language,
      });

      sendAndForwardEmail({
        to: adminEmail,
        subject: `Bạn có đơn hàng mới - Đơn hàng #${orderCode}`,
        html: adminEmailHtml,
      }).catch((emailError) =>
        console.error("Failed to send admin notification:", emailError),
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderCode,
      paymentUrl: checkoutUrl,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình xử lý" },
      { status: 500 },
    );
  }
}
