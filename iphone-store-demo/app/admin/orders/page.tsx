"use client";

import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/lib/supabase";
import { notifySuccess, notifyError } from "@/lib/utils/notifications";
import { Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { formatPhoneNumber } from "@/lib/format";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_code: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  delivery_method?: string;
  collection_point_id?: string;
  collection_points?: { name: string; address: string };
  created_at: string;
}

const getStatusOptions = (t: any) => [
  {
    value: "pending",
    label: t("admin.status_pending"),
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    desc: "Đơn đặt, chưa thanh toán",
  },
  {
    value: "paid",
    label: t("admin.status_paid"),
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "PayOS đã xác nhận thanh toán",
  },
  {
    value: "processing",
    label: t("admin.status_processing"),
    color: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Shop đang chuẩn bị hàng",
  },
  {
    value: "shipping",
    label: t("admin.status_shipping"),
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    desc: "Đang vận chuyển",
  },
  {
    value: "completed",
    label: t("admin.status_completed"),
    color: "bg-green-50 text-green-700 border-green-200",
    desc: "Giao hàng thành công",
  },
  {
    value: "failed",
    label: t("admin.status_failed"),
    color: "bg-red-50 text-red-700 border-red-200",
    desc: "Giao hàng thất bại",
  },
  {
    value: "cancelled",
    label: t("admin.status_cancelled"),
    color: "bg-gray-100 text-gray-500 border-gray-200",
    desc: "Hủy (quá 3 ngày hoặc thủ công)",
  },
];

export default function OrdersPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const statusOptions = getStatusOptions(t);
  const statusMap = Object.fromEntries(statusOptions.map((s) => [s.value, s]));

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);
    setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }));
  };

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            "*, collection_points!orders_collection_point_id_fkey(name, address)",
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (isMounted) setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      notifySuccess("Đã cập nhật trạng thái");
    } else {
      notifyError("Không thể cập nhật trạng thái");
    }
  };

  const confirmPayment = async (orderId: string, method: string) => {
    // Both forms of confirmation set the status to paid/completed and mark as successfully tracked.
    const newStatus = method === "cash" ? "completed" : "paid";

    // Using updateStatus will automatically handle state updates
    await updateStatus(orderId, newStatus);
  };

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    await loadOrderItems(orderId);
  };

  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (!codeParam || orders.length === 0) return;

    const targetOrder = orders.find((o) => String(o.order_code) === codeParam);
    if (!targetOrder) return;

    setExpandedOrder(targetOrder.id);
    setFilterStatus("all");
    setSearchTerm(codeParam);
    loadOrderItems(targetOrder.id);

    const timer = setTimeout(() => {
      const row = document.getElementById(`order-row-${targetOrder.id}`);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchParams, orders]);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.order_code).includes(searchTerm);
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          {t("admin.orders_title")}
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              data-testid="admin-orders-search-input"
              placeholder={t("admin.orders_search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent w-56"
            />
          </div>
          <select
            data-testid="admin-orders-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
          >
            <option value="all">
              {t("common.all") ||
                (t("common.search") === "Search" ? "All" : "Tất cả")}
            </option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="admin-orders-table" className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                <th className="w-8 px-3 py-3"></th>
                <th className="text-left px-5 py-3">
                  {t("admin.order_code") || "Mã đơn"}
                </th>
                <th className="text-left px-5 py-3">
                  {t("admin.customer") || "Khách hàng"}
                </th>
                <th className="text-left px-5 py-3">
                  {t("admin.total_amount") || "Tổng tiền"}
                </th>
                <th className="text-left px-5 py-3">
                  {t("admin.status") || "Trạng thái"}
                </th>
                <th className="text-left px-5 py-3">
                  {t("admin.date") || "Ngày đặt"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr data-testid="admin-orders-loading-state">
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2
                      className="animate-spin text-[#0071e3] mx-auto"
                      size={28}
                    />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr data-testid="admin-orders-empty-state">
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    {t("admin.orders_no_orders")}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const status = statusMap[order.status] || statusMap.pending;
                  const isExpanded = expandedOrder === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr
                        id={`order-row-${order.id}`}
                        data-testid={`admin-orders-row-${order.order_code}`}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-3 py-3">
                          <button
                            data-testid={`admin-orders-expand-button-${order.order_code}`}
                            onClick={() => toggleExpand(order.id)}
                            className="p-1 rounded-md text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            #{order.order_code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.customer_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatPhoneNumber(order.customer_phone)}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          <div className="flex flex-col gap-1">
                            <span>
                              {Number(order.total_amount).toLocaleString(
                                "vi-VN",
                              )}
                              ₫
                            </span>
                            {order.payment_method === "cash" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 self-start w-fit whitespace-nowrap">
                                Tiền mặt
                              </span>
                            ) : order.payment_method === "bank_transfer" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 self-start w-fit whitespace-nowrap">
                                PayOS
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <select
                            data-testid={`admin-orders-status-select-${order.order_code}`}
                            value={order.status}
                            onChange={(e) =>
                              updateStatus(order.id, e.target.value)
                            }
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${status.color}`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                                {s.desc ? ` — ${s.desc}` : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-400">
                          {new Date(
                            order.created_at.includes("Z") ||
                              order.created_at.includes("+")
                              ? order.created_at
                              : order.created_at + "Z",
                          ).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Ho_Chi_Minh",
                            hour12: false,
                          })}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr data-testid={`admin-orders-detail-${order.order_code}`}>
                          <td colSpan={6} className="bg-gray-50/50 px-8 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                              {/* Shipping Address */}
                              <div className="bg-white border border-gray-100 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {order.delivery_method === "pickup"
                                      ? "📦 Điểm nhận hàng"
                                      : "📍 Địa chỉ giao hàng"}
                                  </p>
                                  {order.delivery_method === "pickup" && (
                                    <span className="text-[10px] font-medium bg-[#0071e3]/10 text-[#0071e3] px-2 py-0.5 rounded-full">
                                      Khách tự lấy
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {order.customer_name}
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {formatPhoneNumber(order.customer_phone)}
                                </p>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {order.customer_email}
                                </p>

                                {order.delivery_method === "pickup" &&
                                order.collection_points ? (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Địa điểm đã chọn:
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {order.collection_points.name}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {order.collection_points.address}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-[#0071e3] font-medium mt-2 leading-snug">
                                    {order.shipping_address}
                                  </p>
                                )}

                                {/* Payment Actions Area */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  {order.payment_method === "bank_transfer" &&
                                    order.status === "pending" && (
                                      <button
                                        data-testid={`admin-orders-confirm-transfer-button-${order.order_code}`}
                                        onClick={() =>
                                          confirmPayment(
                                            order.id,
                                            "bank_transfer",
                                          )
                                        }
                                        className="flex items-center justify-center w-full gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors border border-blue-200"
                                      >
                                        Xác nhận đã nhận chuyển khoản
                                      </button>
                                    )}

                                  {order.payment_method === "cash" &&
                                    ["processing", "shipping"].includes(
                                      order.status,
                                    ) && (
                                      <button
                                        data-testid={`admin-orders-confirm-cash-button-${order.order_code}`}
                                        onClick={() =>
                                          confirmPayment(order.id, "cash")
                                        }
                                        className="flex items-center justify-center w-full gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors border border-emerald-200"
                                      >
                                        Xác nhận đã thu tiền mặt
                                      </button>
                                    )}
                                </div>
                              </div>

                              {/* Order Items */}
                              <div className="bg-white border border-gray-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                  📦 Sản phẩm
                                </p>
                                {!orderItems[order.id] ? (
                                  <div className="flex justify-center py-2">
                                    <Loader2
                                      className="animate-spin text-gray-400"
                                      size={18}
                                    />
                                  </div>
                                ) : orderItems[order.id].length === 0 ? (
                                  <p className="text-xs text-gray-400">
                                    {t("admin.orders_no_products")}
                                  </p>
                                ) : (
                                  <table data-testid={`admin-orders-items-table-${order.order_code}`} className="w-full text-sm">
                                    <thead>
                                      <tr className="text-xs text-gray-400">
                                        <th className="text-left pb-2">
                                          {t("admin.table_product")}
                                        </th>
                                        <th className="text-right pb-2">
                                          {t("admin.table_unit_price")}
                                        </th>
                                        <th className="text-right pb-2">
                                          {t("admin.table_quantity")}
                                        </th>
                                        <th className="text-right pb-2">
                                          {t("admin.table_subtotal")}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {orderItems[order.id].map((item) => (
                                        <tr key={item.id}>
                                          <td className="py-1.5 text-gray-700">
                                            {item.product_name}
                                          </td>
                                          <td className="py-1.5 text-right text-gray-500">
                                            {Number(item.price).toLocaleString(
                                              "vi-VN",
                                            )}
                                            ₫
                                          </td>
                                          <td className="py-1.5 text-right text-gray-700 font-medium">
                                            {item.quantity}
                                          </td>
                                          <td className="py-1.5 text-right font-semibold text-[#0071e3]">
                                            {Number(
                                              item.subtotal,
                                            ).toLocaleString("vi-VN")}
                                            ₫
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
