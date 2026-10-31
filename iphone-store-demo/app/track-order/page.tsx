"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import OrderStatusStepper from "@/components/OrderStatusStepper";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search,
  Package,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { formatPhoneNumber } from "@/lib/format";

interface OrderItem {
  id: string;
  product_name: string; // stored snapshot (Vietnamese)
  price: number;
  quantity: number;
  subtotal: number;
  product?: { name: string; name_en?: string | null };
}

interface OrderDetail {
  id: string;
  order_code: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
  payment_link_url?: string;
}

function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  const cfg: Record<string, { color: string; bg: string }> = {
    pending: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    paid: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    processing: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    shipping: {
      color: "text-indigo-700",
      bg: "bg-indigo-50 border-indigo-200",
    },
    completed: { color: "text-green-700", bg: "bg-green-50 border-green-200" },
    failed: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
    cancelled: { color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
  };
  const c = cfg[status] || {
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  };
  const label = t(`track_order.status_${status}`) || status;
  return (
    <span
      data-testid="track-order-status-badge"
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.color}`}
    >
      {label}
    </span>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  const [step, setStep] = useState<"search" | "verify" | "result">("search");
  const [query, setQuery] = useState("");
  const [phone4, setPhone4] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [singleOrder, setSingleOrder] = useState<OrderDetail | null>(null);
  const [singleItems, setSingleItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setQuery(code);
      doSearch(code);
    }
  }, []);

  const resetAll = () => {
    setQuery("");
    setPhone4("");
    setError("");
    setSingleOrder(null);
    setSingleItems([]);
    setStep("search");
  };

  const doSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setSingleOrder(null);
    setSingleItems([]);

    const res = await fetch(`/api/track-order?code=${encodeURIComponent(q)}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t("track_order.not_found"));
      return;
    }

    if (data.type === "require_phone") {
      setStep("verify");
    } else {
      // In case we don't need verification somehow, but based on API we do
      if (data.type === "single") {
        setSingleOrder(data.order);
        setSingleItems(data.items || []);
        setStep("result");
      }
    }
  };

  const doVerify = async () => {
    const p = phone4.trim();
    if (p.length !== 4) return;
    setLoading(true);
    setError("");

    const res = await fetch(
      `/api/track-order?code=${encodeURIComponent(query.trim())}&phone4=${encodeURIComponent(p)}`,
    );
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t("track_order.verify_error"));
      return;
    }

    if (data.type === "single") {
      setSingleOrder(data.order);
      setSingleItems(data.items || []);
      setStep("result");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doVerify();
  };

  const formatDate = (dateStr: string) =>
    new Date(
      dateStr.includes("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z",
    ).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });

  const shippingFeeItem = singleItems.find(
    (item) =>
      item.product_name?.toLowerCase() === "phí vận chuyển" ||
      item.product_name?.toLowerCase() === "shipping fee",
  );
  const productItems = singleItems.filter(
    (item) =>
      item.product_name?.toLowerCase() !== "phí vận chuyển" &&
      item.product_name?.toLowerCase() !== "shipping fee",
  );
  const productsTotal = productItems.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0,
  );
  const shippingFee = Number(shippingFeeItem?.subtotal || 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#f5f5f7] via-white to-[#f0f9ff]">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-28 pb-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#0071e3]/10 rounded-2xl mb-3 sm:mb-4">
              <Package className="text-[#0071e3]" size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">
              {t("track_order.title")}
            </h1>
            <p className="text-gray-500 text-sm">{t("track_order.subtitle")}</p>
          </div>

          {/* Search Card */}
          {step === "search" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 animate-in fade-in duration-300 mx-auto max-w-2xl">
              <form onSubmit={handleSearchSubmit} data-testid="track-order-search-form" className="flex gap-3">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    data-testid="track-order-code-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("track_order.placeholder_code")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 focus:outline-none text-sm transition-all"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="track-order-search-button"
                  disabled={loading || !query.trim()}
                  className="bg-[#0071e3] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#005bb5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Search size={16} />
                  )}
                  <span className="hidden sm:inline">
                    {t("track_order.search_btn")}
                  </span>
                </button>
              </form>

              {/* Error */}
              {error && (
                <div data-testid="track-order-search-error" className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Verify Card */}
          {step === "verify" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 sm:mb-6 animate-in slide-in-from-right-4 duration-300 mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-4">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t("track_order.verify_title")}
              </h2>

              <p
                className="text-gray-500 text-sm mb-6 max-w-sm mx-auto"
                dangerouslySetInnerHTML={{
                  __html: t("track_order.verify_desc")
                    .replace("**", "<strong>")
                    .replace("**", "</strong>"),
                }}
              />

              <form
                onSubmit={handleVerifySubmit}
                data-testid="track-order-verify-form"
                className="max-w-xs mx-auto flex flex-col gap-4"
              >
                <input
                  data-testid="track-order-phone4-input"
                  type="text"
                  maxLength={4}
                  value={phone4}
                  onChange={(e) => setPhone4(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("track_order.verify_placeholder")}
                  className={`w-full text-center text-xl px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 focus:outline-none transition-all ${phone4 ? "tracking-[0.5em]" : "tracking-normal placeholder:text-sm"}`}
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    data-testid="track-order-verify-back-button"
                    onClick={() => {
                      setStep("search");
                      setPhone4("");
                      setError("");
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
                  >
                    {t("track_order.verify_back")}
                  </button>
                  <button
                    type="submit"
                    data-testid="track-order-verify-button"
                    disabled={loading || phone4.length !== 4}
                    className="flex-1 bg-[#0071e3] text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-[#005bb5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : null}
                    {t("track_order.verify_btn")}
                  </button>
                </div>
              </form>

              {error && (
                <div data-testid="track-order-verify-error" className="mt-5 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-left max-w-xs mx-auto">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Order Detail */}
          {step === "result" && singleOrder && (
            <div data-testid="track-order-result" className="space-y-4 animate-in fade-in duration-300">
              <button
                data-testid="track-order-back-button"
                onClick={resetAll}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0071e3] transition-colors"
              >
                <ArrowLeft size={16} />
                {t("track_order.back_to_list")}
              </button>

              {/* Status Stepper */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-start sm:items-center justify-between gap-2 mb-2">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                    {t("track_order.order_label")}{" "}
                    <span data-testid="track-order-order-code" className="text-[#0071e3]">
                      #{singleOrder.order_code}
                    </span>
                  </h2>
                  <StatusBadge status={singleOrder.status} t={t} />
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {t("track_order.placed_on")}{" "}
                  {formatDate(singleOrder.created_at)}
                </p>

                {/* Pending — show payment button */}
                {singleOrder.status === "pending" &&
                  singleOrder.payment_link_url && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle
                        className="text-amber-600 shrink-0 mt-0.5"
                        size={18}
                      />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          {t("track_order.unpaid_notice")}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {t("track_order.unpaid_warning")}
                        </p>
                        <a
                          href={singleOrder.payment_link_url}
                          data-testid="track-order-pay-now-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 bg-[#0071e3] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#005bb5] transition-colors"
                        >
                          💳 {t("track_order.pay_now")}{" "}
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}

                {singleOrder.status === "cancelled" && (
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                    ❌ {t("track_order.cancelled_notice")}
                  </div>
                )}

                {singleOrder.status === "failed" && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    ⚠️ {t("track_order.failed_notice")}
                  </div>
                )}

                {!["cancelled", "failed"].includes(singleOrder.status) && (
                  <OrderStatusStepper
                    status={singleOrder.status}
                    createdAt={singleOrder.created_at}
                    updatedAt={singleOrder.updated_at || singleOrder.created_at}
                    paymentMethod={singleOrder.payment_method}
                    paidAt={
                      ["paid", "processing", "shipping", "completed"].includes(
                        singleOrder.status,
                      )
                        ? singleOrder.updated_at || singleOrder.created_at
                        : undefined
                    }
                  />
                )}
              </div>

              {/* Items */}
              {singleItems.length > 0 && (
                <div data-testid="track-order-items" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-50">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {t("track_order.order_items")} ({productItems.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {productItems.map((item) => {
                      const displayName =
                        language === "en" && item.product?.name_en
                          ? item.product.name_en
                          : item.product_name;
                      return (
                        <div
                          key={item.id}
                          data-testid={`track-order-item-${item.id}`}
                          className="flex items-center gap-3 px-4 sm:px-6 py-3.5"
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center text-base shrink-0">
                            📦
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Number(item.price).toLocaleString("vi-VN")}₫ ×{" "}
                              {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-sm text-gray-900 whitespace-nowrap shrink-0">
                            {Number(item.subtotal).toLocaleString("vi-VN")}₫
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tổng sản phẩm</span>
                        <span data-testid="track-order-shipping-fee" className="font-medium text-gray-800">
                        {productsTotal.toLocaleString("vi-VN")}₫
                      </span>
                    </div>

                    {shippingFee > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Phí vận chuyển</span>
                      <span data-testid="track-order-products-total" className="font-medium text-gray-800">
                          {shippingFee.toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-semibold text-gray-700 text-sm">
                        Total
                      </span>
                      <span data-testid="track-order-total" className="text-lg sm:text-xl font-bold text-[#0071e3]">
                        {Number(singleOrder.total_amount).toLocaleString(
                          "vi-VN",
                        )}
                        ₫
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer + Shipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">
                    👤 {t("track_order.customer_info")}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p data-testid="track-order-customer-name" className="text-gray-700 font-medium">
                      {singleOrder.customer_name}
                    </p>
                    <p data-testid="track-order-customer-phone" className="text-gray-500 text-xs">
                      {formatPhoneNumber(singleOrder.customer_phone)}
                    </p>
                    <p data-testid="track-order-customer-email" className="text-gray-500 text-xs">
                      {singleOrder.customer_email}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">
                    📍 {t("track_order.shipping_address")}
                  </h3>
                  <p data-testid="track-order-shipping-address" className="text-sm text-gray-600 leading-relaxed">
                    {singleOrder.shipping_address}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty hint */}
          {step === "search" && !loading && !error && (
            <div data-testid="track-order-empty-hint" className="text-center py-12 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("track_order.empty_hint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#0071e3]" size={32} />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
