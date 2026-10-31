const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

const buildItemsHtml = (items: any[]) =>
  items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">
          ${item.product_name || item.products?.name || ""}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">
          ${formatVND(item.price)}
        </td>
      </tr>
    `,
    )
    .join("");

const translations: Record<string, any> = {
  vi: {
    pending_subject: "Đơn hàng #{code} đang chờ thanh toán - Cửa Hàng Sự Kiện",
    confirmation_subject: "✅ Thanh toán thành công - Đơn hàng #{code}",
    cash_subject: "Xác nhận đơn hàng #{code} - Thanh toán tiền mặt",
    header_pending: "📦 Đơn hàng đã được đặt!",
    header_pending_desc:
      "Vui lòng hoàn tất thanh toán để chúng tôi xử lý đơn hàng của bạn.",
    welcome: "Xin chào {name},",
    pending_body:
      "Chúng tôi đã nhận được đơn hàng của bạn. Để hoàn tất, vui lòng thanh toán qua liên kết bên dưới.",
    order_code: "Mã đơn hàng:",
    warning_auto_cancel:
      "⏰ <strong>Lưu ý:</strong> Đơn hàng sẽ tự động bị hủy nếu chưa thanh toán trong vòng <strong>3 ngày</strong>.",
    btn_pay_now: "💳 Thanh Toán Ngay",
    order_details: "Chi tiết đơn hàng:",
    table_product: "Sản phẩm",
    table_qty: "SL",
    table_price: "Giá",
    table_total: "Tổng cộng:",
    shipping_address: "📍 Địa chỉ giao hàng:",
    pickup_address: "📍 Địa điểm nhận hàng:",
    track_order_desc: "🔍 Theo dõi đơn hàng của bạn bất cứ lúc nào:",
    btn_track_order: "Theo Dõi Đơn Hàng",
    contact_footer:
      "Nếu có thắc mắc, vui lòng liên hệ với chúng tôi qua email này.",
    header_confirmation: "✅ Thanh toán thành công!",
    header_confirmation_desc: "Cảm ơn bạn đã mua sắm tại iPhone Store.",
    confirmation_body:
      "Thanh toán của bạn đã được xác nhận. Chúng tôi đang chuẩn bị gói hàng và sẽ giao trong <strong>3–5 ngày làm việc</strong>.",
    header_cash: "📦 Đơn hàng đã được đặt thành công!",
    header_cash_desc: "Cảm ơn bạn đã đặt hàng.",
    cash_body_pickup:
      "Chúng tôi đã nhận được đơn hàng của bạn. Bạn đã chọn hình thức <strong>thanh toán bằng tiền mặt</strong>. Vui lòng thanh toán khi đến nhận hàng tại điểm đã chọn.",
    cash_body_shipping:
      "Chúng tôi đã nhận được đơn hàng của bạn. Bạn đã chọn hình thức <strong>thanh toán bằng tiền mặt</strong>. Vui lòng thanh toán cho nhân viên giao hàng khi nhận được gói hàng.",
  },
  en: {
    pending_subject: "Order #{code} is awaiting payment - Cửa Hàng Sự Kiện",
    confirmation_subject: "✅ Payment Successful - Order #{code}",
    cash_subject: "Order Confirmation #{code} - Cash on Delivery",
    header_pending: "📦 Order Placed!",
    header_pending_desc:
      "Please complete the payment so we can process your order.",
    welcome: "Hello {name},",
    pending_body:
      "We have received your order. To complete it, please pay via the link below.",
    order_code: "Order Code:",
    warning_auto_cancel:
      "⏰ <strong>Note:</strong> Order will be automatically cancelled if not paid within <strong>3 days</strong>.",
    btn_pay_now: "💳 Pay Now",
    order_details: "Order Details:",
    table_product: "Product",
    table_qty: "Qty",
    table_price: "Price",
    table_total: "Total:",
    shipping_address: "📍 Shipping Address:",
    pickup_address: "📍 Pickup Location:",
    track_order_desc: "🔍 Track your order anytime:",
    btn_track_order: "Track Order",
    contact_footer:
      "If you have any questions, please contact us via this email.",
    header_confirmation: "✅ Payment Successful!",
    header_confirmation_desc: "Thank you for shopping at iPhone Store.",
    confirmation_body:
      "Your payment has been confirmed. We are preparing your package and will deliver in <strong>3–5 business days</strong>.",
    header_cash: "📦 Order placed successfully!",
    header_cash_desc: "Thank you for your order.",
    cash_body_pickup:
      "We have received your order. You have chosen <strong>cash payment</strong>. Please pay when you pick up your items at the selected location.",
    cash_body_shipping:
      "We have received your order. You have chosen <strong>cash payment</strong>. Please pay the delivery person when you receive your package.",
  },
};

export const getT = (lang: string) => {
  const dict = translations[lang] || translations.vi;
  return (key: string, vars?: Record<string, string>) => {
    let t = dict[key] || translations.vi[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        t = t.replace(`{${k}}`, v).replace(`#{${k}}`, v);
      });
    }
    return t;
  };
};

const baseStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f7; }
  .wrapper { padding: 30px 10px; background: #f5f5f7; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #0071e3; color: white; padding: 30px 30px 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
  .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
  .content { padding: 28px 30px; }
  .order-code { background: #f5f5f7; border: 1px solid #fdd5cc; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 15px; }
  .order-code strong { color: #0071e3; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 2px solid #ddd; font-size: 13px; color: #555; }
  .total-row { text-align: right; font-size: 17px; font-weight: bold; margin: 16px 0; color: #333; }
  .total-row span { color: #0071e3; }
  .btn { display: inline-block; background: #0071e3; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 8px 0; }
  .btn-secondary { display: inline-block; background: transparent; border: 2px solid #0071e3; color: #0071e3 !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0; }
  .track-box { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
  .track-box p { margin: 0 0 10px; font-size: 14px; color: #1e40af; }
  .warning-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin: 16px 0; }
  .warning-box p { margin: 0; font-size: 13px; color: #92400e; }
  .address-box { background: #f9fafb; border-radius: 8px; padding: 14px 16px; margin: 12px 0; font-size: 14px; }
  .footer { text-align: center; font-size: 12px; color: #888; padding: 20px 30px; background: #f9fafb; border-top: 1px solid #eee; }
`;

// ─── Email 1: Order Placed — NOT YET PAID ──────────────────────────────────
export const createPendingOrderEmail = ({
  customerName,
  orderCode,
  items,
  total,
  shippingAddress,
  paymentUrl,
  trackingUrl,
  language = "vi",
}: {
  customerName: string;
  orderCode: string;
  items: any[];
  total: number;
  shippingAddress: string;
  paymentUrl: string;
  trackingUrl: string;
  language?: string;
}) => {
  const t = getT(language);
  const itemsHtml = buildItemsHtml(items);
  const formattedTotal = formatVND(total);

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t("pending_subject", { code: orderCode })}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>${t("header_pending")}</h1>
            <p>${t("header_pending_desc")}</p>
          </div>
          <div class="content">
            <p>${t("welcome", { name: customerName })}</p>
            <p>${t("pending_body")}</p>

            <div class="order-code">
              ${t("order_code")} <strong>#${orderCode}</strong>
            </div>

            <div class="warning-box">
              <p>${t("warning_auto_cancel")}</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${paymentUrl}" class="btn">${t("btn_pay_now")}</a>
            </div>

            <h3 style="font-size: 15px; margin-bottom: 4px;">${t("order_details")}</h3>
            <table>
              <thead>
                <tr>
                  <th>${t("table_product")}</th>
                  <th style="text-align: center;">${t("table_qty")}</th>
                  <th style="text-align: right;">${t("table_price")}</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div class="total-row">${t("table_total")} <span>${formattedTotal}</span></div>

            <div class="address-box">
              <strong>${t("shipping_address")}</strong><br>${shippingAddress}
            </div>

            <div class="track-box">
              <p>${t("track_order_desc")}</p>
              <a href="${trackingUrl}" class="btn-secondary">${t("btn_track_order")}</a>
            </div>

            <p style="font-size: 13px; color: #777; margin-top: 20px;">${t("contact_footer")}</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} iPhone Store. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─── Email 2: Order PAID — Confirmation ────────────────────────────────────
export const createOrderConfirmationEmail = ({
  customerName,
  orderCode,
  items,
  total,
  shippingAddress,
  trackingUrl,
  language = "vi",
}: {
  customerName: string;
  orderCode: string;
  items: any[];
  total: number;
  shippingAddress: string;
  trackingUrl?: string;
  language?: string;
}) => {
  const t = getT(language);
  const itemsHtml = buildItemsHtml(items);
  const formattedTotal = formatVND(total);
  const resolvedTrackingUrl =
    trackingUrl ||
    `${process.env.NEXT_PUBLIC_URL}/track-order?code=${orderCode}`;

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t("confirmation_subject", { code: orderCode })}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>${t("header_confirmation")}</h1>
            <p>${t("header_confirmation_desc")}</p>
          </div>
          <div class="content">
            <p>${t("welcome", { name: customerName })}</p>
            <p>${t("confirmation_body")}</p>

            <div class="order-code">
              ${t("order_code")} <strong>#${orderCode}</strong>
            </div>

            <h3 style="font-size: 15px; margin-bottom: 4px;">${t("order_details")}</h3>
            <table>
              <thead>
                <tr>
                  <th>${t("table_product")}</th>
                  <th style="text-align: center;">${t("table_qty")}</th>
                  <th style="text-align: right;">${t("table_price")}</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div class="total-row">${t("table_total")} <span>${formattedTotal}</span></div>

            <div class="address-box">
              <strong>${t("shipping_address")}</strong><br>${shippingAddress}
            </div>

            <div class="track-box">
              <p>${t("track_order_desc")}</p>
              <a href="${resolvedTrackingUrl}" class="btn-secondary">${t("btn_track_order")}</a>
            </div>

            <p style="font-size: 13px; color: #777; margin-top: 20px;">${t("contact_footer")}</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} iPhone Store. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─── Email 3: Admin Notification — New Order ────────────────────────────────────
export const createAdminOrderNotificationEmail = ({
  customerName,
  customerEmail,
  customerPhone,
  orderCode,
  items,
  total,
  shippingAddress,
  paymentMethod,
  deliveryMethod = "shipping",
  language = "vi",
}: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderCode: string;
  items: any[];
  total: number;
  shippingAddress: string;
  paymentMethod: string;
  deliveryMethod?: string;
  language?: string;
}) => {
  const t = getT(language);

  // Separate shipping fee from products
  const productItems = items.filter(
    (item) => item.product_name !== "Phí vận chuyển",
  );
  const shippingFeeItem = items.find(
    (item) => item.product_name === "Phí vận chuyển",
  );
  const productsHtml = buildItemsHtml(productItems);
  const productsTotal = productItems.reduce(
    (sum, item) => sum + (item.subtotal || item.price * item.quantity),
    0,
  );
  const formattedProductsTotal = formatVND(productsTotal);
  const formattedTotal = formatVND(total);
  const formattedShippingFee = shippingFeeItem
    ? formatVND(shippingFeeItem.subtotal)
    : formatVND(0);

  const addressLabel =
    deliveryMethod === "pickup" ? "Điểm nhận hàng" : "Địa chỉ giao hàng";
  const deliveryLabel =
    deliveryMethod === "pickup" ? "Nhận tại điểm" : "Giao hàng tận nơi";
  const paymentLabel =
    paymentMethod === "cash"
      ? "Tiền mặt khi nhận hàng"
      : "Chuyển khoản ngân hàng";

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thông báo đơn hàng mới</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #0071e3 0%, #2997ff 100%);">
            <h1 style="margin: 0; font-size: 24px;">🆕 Đơn hàng mới</h1>
            <p style="margin: 8px 0 0; opacity: 0.95;">Mã đơn hàng: <strong>#${orderCode}</strong></p>
          </div>
          <div class="content">

            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Khách hàng</h4>
              <p style="margin: 6px 0; font-size: 15px;"><strong>${customerName}</strong></p>
              <p style="margin: 6px 0; font-size: 13px; color: #666;">📧 ${customerEmail}</p>
              <p style="margin: 6px 0; font-size: 13px; color: #666;">📱 ${customerPhone}</p>
            </div>

            <h4 style="margin: 20px 0 12px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Sản phẩm</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <thead>
                <tr style="border-bottom: 2px solid #ddd;">
                  <th style="text-align: left; padding: 10px 12px; font-size: 12px; color: #666; font-weight: 600;">Sản phẩm</th>
                  <th style="text-align: center; padding: 10px 12px; font-size: 12px; color: #666; font-weight: 600;">SL</th>
                  <th style="text-align: right; padding: 10px 12px; font-size: 12px; color: #666; font-weight: 600;">Giá</th>
                </tr>
              </thead>
              <tbody>${productsHtml}</tbody>
              <tfoot>
                <tr style="border-top: 1px solid #eee;">
                  <td colspan="2" style="padding: 12px 12px; text-align: right; font-size: 14px; color: #333;">Tổng sản phẩm:</td>
                  <td style="padding: 12px 12px; text-align: right; font-size: 14px; font-weight: 600; color: #333;">${formattedProductsTotal}</td>
                </tr>
              </tfoot>
            </table>

            ${
              shippingFeeItem
                ? `
            <div style="background: #fef3e2; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="font-size: 14px; color: #92400e; padding-right: 12px;">🚚 Phí vận chuyển</td>
                  <td style="font-size: 14px; font-weight: 600; color: #92400e; text-align: right; white-space: nowrap;">${formattedShippingFee}</td>
                </tr>
              </table>
            </div>
            `
                : ""
            }

            <div style="background: #f0f4ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="font-size: 15px; font-weight: 600; color: #1e40af; padding-right: 12px;">Tổng cộng</td>
                  <td style="font-size: 16px; font-weight: 700; color: #1e40af; text-align: right; white-space: nowrap;">${formattedTotal}</td>
                </tr>
              </table>
            </div>

            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Thông tin giao hàng</h4>
              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #999;">📍 ${addressLabel}</p>
                <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">${shippingAddress}</p>
              </div>
              <div style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 8px 0; font-size: 13px;"><span style="color: #666;">🚚 Hình thức:</span> <strong>${deliveryLabel}</strong></p>
                <p style="margin: 8px 0; font-size: 13px;"><span style="color: #666;">💳 Thanh toán:</span> <strong>${paymentLabel}</strong></p>
              </div>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/admin/orders?code=${orderCode}" class="btn" style="background: linear-gradient(135deg, #0071e3 0%, #2997ff 100%); display: inline-block; padding: 14px 32px; border-radius: 8px; text-decoration: none; color: white; font-weight: 700; font-size: 15px;">Xem trong trang quản trị</a>
            </div>

            <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
              Đây là email thông báo tự động. Vui lòng đăng nhập vào trang quản trị để xử lý đơn hàng này.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} iPhone Store. Thông báo quản trị
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─── Email 4: Cash Payment Order ────────────────────────────────────
export const createCashOrderEmail = ({
  customerName,
  orderCode,
  items,
  total,
  shippingAddress,
  deliveryMethod,
  trackingUrl,
  language = "vi",
}: {
  customerName: string;
  orderCode: string;
  items: any[];
  total: number;
  shippingAddress: string;
  deliveryMethod: "shipping" | "pickup";
  trackingUrl: string;
  language?: string;
}) => {
  const t = getT(language);
  const itemsHtml = buildItemsHtml(items);
  const formattedTotal = formatVND(total);

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t("cash_subject", { code: orderCode })}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>${t("header_cash")}</h1>
            <p>${t("header_cash_desc")}</p>
          </div>
          <div class="content">
            <p>${t("welcome", { name: customerName })}</p>
            <p>${deliveryMethod === "pickup" ? t("cash_body_pickup") : t("cash_body_shipping")}</p>

            <div class="order-code">
              ${t("order_code")} <strong>#${orderCode}</strong>
            </div>

            <h3 style="font-size: 15px; margin-bottom: 4px;">${t("order_details")}</h3>
            <table>
              <thead>
                <tr>
                  <th>${t("table_product")}</th>
                  <th style="text-align: center;">${t("table_qty")}</th>
                  <th style="text-align: right;">${t("table_price")}</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div class="total-row">${t("table_total")} <span>${formattedTotal}</span></div>

            <div class="address-box">
              <strong>${deliveryMethod === "pickup" ? t("pickup_address") : t("shipping_address")}</strong><br>${shippingAddress}
            </div>

            <div class="track-box">
              <p>${t("track_order_desc")}</p>
              <a href="${trackingUrl}" class="btn-secondary">${t("btn_track_order")}</a>
            </div>

            <p style="font-size: 13px; color: #777; margin-top: 20px;">${t("contact_footer")}</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} iPhone Store. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
