"use client";

import { useEffect, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import OrderStatusStepper from "@/components/OrderStatusStepper";
import PaymentVerifier from "@/components/PaymentVerifier";
import { supabase } from "@/lib/supabase";
import { User } from "lucide-react";
import { formatPhoneNumber } from "@/lib/format";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  product?: {
    name: string;
    product_images: { image_url: string }[];
  };
}

interface Order {
  id: string;
  order_code: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: PageProps) {
  const { t } = useLanguage();
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const id = resolvedParams.id;
  const paymentStatus = searchParams.get("status") || undefined;
  const orderCode = searchParams.get("orderCode") || undefined;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!data.order) {
        setLoading(false);
        return;
      }
      setOrder(data.order as Order);
      setItems((data.items || []) as OrderItem[]);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] pb-12">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 text-center">
          <p className="text-gray-500">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const shippingFeeItem = items.find(
    (item) =>
      item.product_name?.toLowerCase() === "phí vận chuyển" ||
      item.product_name?.toLowerCase() === "shipping fee",
  );
  const productItems = items.filter(
    (item) =>
      item.product_name?.toLowerCase() !== "phí vận chuyển" &&
      item.product_name?.toLowerCase() !== "shipping fee",
  );
  const productsTotal = productItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  const shippingFee = shippingFeeItem?.subtotal || 0;

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t("order_detail.status_completed");
      case "cancelled":
        return t("order_detail.status_cancelled");
      case "shipping":
        return t("order_detail.status_shipping");
      case "processing":
      case "paid":
        return t("order_detail.status_processing");
      default:
        return t("order_detail.status_pending");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-12">
      <Navbar />

      <PaymentVerifier
        orderId={order.id}
        orderStatus={order.status}
        paymentStatus={paymentStatus}
        orderCode={orderCode}
        onConfirmed={fetchData}
      />

      <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-28 pb-10">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t("order_detail.title")}
            </h1>
          </div>

          {/* Status Stepper Card */}
          <div data-testid="order-detail-status-stepper" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
            <OrderStatusStepper
              status={order.status}
              createdAt={order.created_at}
              updatedAt={order.updated_at || order.created_at}
              paidAt={
                order.status !== "pending" &&
                order.status !== "failed" &&
                order.status !== "cancelled"
                  ? order.updated_at || order.created_at
                  : undefined
              }
              paymentMethod={order.payment_method}
            />
          </div>

          {/* Order Info & Items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Order Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">
                      {t("order_detail.package_info")}
                    </h2>
                    <p data-testid="order-detail-order-code" className="text-sm text-gray-500">
                      {t("order_detail.order_code")}
                      {order.order_code}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("order_detail.order_date")}{" "}
                      {new Date(
                        order.created_at.includes("Z") ||
                          order.created_at.includes("+")
                          ? order.created_at
                          : order.created_at + "Z",
                      ).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                        hour12: false,
                      })}
                    </p>
                  </div>
                  {/* Status Badge */}
                  <div>
                    <span
                      data-testid="order-detail-status-badge"
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                            ? "bg-gray-100 text-gray-700"
                            : order.status === "shipping"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "processing" ||
                                  order.status === "paid"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-yellow-100 text-yellow-700"
                      }
                    `}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {productItems.map((item) => (
                    <div
                      key={item.id}
                      data-testid={`order-detail-item-${item.id}`}
                      className="p-3.5 sm:p-4 flex gap-3 sm:gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-md shrink-0 overflow-hidden border border-gray-200">
                        {item.product?.product_images?.[0]?.image_url ? (
                          <img
                            src={item.product.product_images[0].image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {item.product_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("order_detail.item_qty")} {item.quantity}
                        </p>
                        <p className="text-xs sm:hidden mt-1 font-semibold text-gray-700">
                          {item.subtotal.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="font-medium text-sm text-gray-900">
                          {item.price.toLocaleString("vi-VN")}₫
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("order_detail.item_total")}{" "}
                          {item.subtotal.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tổng sản phẩm</span>
                        <span data-testid="order-detail-shipping-fee" className="font-medium text-gray-800">
                        {productsTotal.toLocaleString("vi-VN")}₫
                      </span>
                    </div>

                    {shippingFee > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Phí vận chuyển</span>
                      <span data-testid="order-detail-products-total" className="font-medium text-gray-800">
                          {shippingFee.toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-semibold text-gray-700 text-sm">
                        {t("order_detail.order_total")}
                      </span>
                      <span data-testid="order-detail-total" className="text-lg sm:text-xl font-bold text-[#0071e3]">
                        {order.total_amount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  {t("order_detail.customer_info")}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">
                      {t("order_detail.full_name")}
                    </p>
                    <p data-testid="order-detail-customer-name" className="font-medium text-gray-900">
                      {order.customer_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">
                      {t("order_detail.email")}
                    </p>
                    <p data-testid="order-detail-customer-email" className="font-medium text-gray-900">
                      {order.customer_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">
                      {t("order_detail.phone")}
                    </p>
                    <p data-testid="order-detail-customer-phone" className="font-medium text-gray-900">
                      {formatPhoneNumber(order.customer_phone)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                    />
                  </svg>
                  {t("order_detail.payment_title")}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">
                      {t("order_detail.payment_method")}
                    </p>
                    <p data-testid="order-detail-payment-method" className="font-medium text-gray-900">
                      {order.payment_method === "cash"
                        ? t("checkout.payment_cash") ||
                          "Thanh toán bằng tiền mặt"
                        : t("order_detail.payment_method_value")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">
                      {t("order_detail.payment_status")}
                    </p>
                    <p
                      data-testid="order-detail-payment-status"
                      className={`font-medium ${
                        order.status === "cancelled" ||
                        order.status === "failed"
                          ? "text-red-600"
                          : order.status === "pending" ||
                              (order.payment_method === "cash" &&
                                order.status !== "completed")
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {order.status === "cancelled" || order.status === "failed"
                        ? t("order_detail.payment_failed")
                        : order.status === "pending" ||
                            (order.payment_method === "cash" &&
                              order.status !== "completed")
                          ? t("order_detail.payment_pending")
                          : t("order_detail.payment_paid")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
