import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isTestApiEnabled, testApiNotFound } from "@/lib/test-mode";
import {
  IPHONE_CATEGORIES,
  IPHONE_IMAGE,
  IPHONE_PRODUCTS,
} from "@/lib/iphone-catalog";
import {
  ORDER_STATUSES,
  TEST_ADMIN,
  TEST_CUSTOMER,
  TEST_ORDER_CODE_BASE,
  ensureTestUser,
  paymentStatusForOrderStatus,
  resetTestData,
  type OrderStatus,
} from "@/lib/test-data";

type SeedBody = {
  includeOrders?: boolean;
  reset?: boolean;
};

async function insertSeedOrder(payload: Record<string, unknown>) {
  const first = await supabaseAdmin.from("orders").insert(payload).select().single();
  if (!first.error) return first.data;

  // Older databases may not have orders.user_id yet. Retry without it so
  // seeding still works before architecture/db_schema_full.sql is applied.
  if (/user_id/i.test(first.error.message)) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.user_id;
    const second = await supabaseAdmin
      .from("orders")
      .insert(fallbackPayload)
      .select()
      .single();
    if (second.error) {
      throw new Error(`Failed to create seed order: ${second.error.message}`);
    }
    return second.data;
  }

  throw new Error(`Failed to create seed order: ${first.error.message}`);
}

export async function POST(request: NextRequest) {
  if (!isTestApiEnabled()) return testApiNotFound();

  try {
    const body = (await request.json().catch(() => ({}))) as SeedBody;
    const includeOrders = body.includeOrders !== false;

    if (body.reset !== false) {
      await resetTestData();
    }

    // ---- Fixed test accounts ----
    const admin = await ensureTestUser({
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
      fullName: TEST_ADMIN.fullName,
      isAdmin: true,
    });
    const customer = await ensureTestUser({
      email: TEST_CUSTOMER.email,
      password: TEST_CUSTOMER.password,
      fullName: TEST_CUSTOMER.fullName,
      isAdmin: false,
      phone: TEST_CUSTOMER.phone,
    });

    // ---- iPhone categories ----
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from("categories")
      .insert(
        IPHONE_CATEGORIES.map((category) => ({
          name: category.name,
          name_en: category.name_en,
          slug: category.slug,
          sort_order: category.sort_order,
          is_active: true,
        })),
      )
      .select();
    if (categoriesError || !categories) {
      throw new Error(`Failed to create seed categories: ${categoriesError?.message}`);
    }

    const categoryBySlug = new Map<string, { id: string }>(
      (categories as Array<{ id: string; slug: string }>).map((category) => [
        category.slug,
        category,
      ]),
    );

    // ---- iPhone products ----
    const productRows = IPHONE_PRODUCTS.map((product) => ({
      category_id: categoryBySlug.get(product.categorySlug)?.id ?? null,
      name: product.name,
      name_en: product.name_en,
      slug: product.slug,
      description: product.description,
      description_en: product.description_en,
      price: product.price,
      sale_price: product.sale_price,
      stock: product.stock,
      sku: product.sku,
      is_active: true,
      image_url: product.image_url,
    }));

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .insert(productRows)
      .select();
    if (productsError || !products) {
      throw new Error(`Failed to create seed products: ${productsError?.message}`);
    }

    type SeedProduct = {
      id: string;
      slug: string;
      name: string;
      price: number;
      sale_price: number | null;
      stock: number;
    };

    const seededProducts = products as SeedProduct[];

    // ---- Product images ----
    const { error: imagesError } = await supabaseAdmin
      .from("product_images")
      .insert(
        seededProducts.map((product) => ({
          product_id: product.id,
          image_url: IPHONE_IMAGE,
          sort_order: 0,
          is_primary: true,
        })),
      );
    if (imagesError) {
      throw new Error(`Failed to create seed product images: ${imagesError.message}`);
    }

    // ---- Pickup location ----
    const { data: collectionPoint, error: collectionPointError } = await supabaseAdmin
      .from("collection_points")
      .insert({
        name: "[TEST] Pickup Point",
        address: "123 Test Street, Test Ward, Test City",
        is_active: true,
      })
      .select()
      .single();
    if (collectionPointError || !collectionPoint) {
      throw new Error(
        `Failed to create seed collection point: ${collectionPointError?.message}`,
      );
    }

    // ---- Orders: one per status ----
    const seededOrders: Array<{
      id: string;
      order_code: number;
      status: string;
      order_items: number;
    }> = [];

    if (includeOrders) {
      const statuses: OrderStatus[] = [...ORDER_STATUSES];

      for (let index = 0; index < statuses.length; index += 1) {
        const status = statuses[index];
        const firstProduct = seededProducts[index % seededProducts.length];
        const secondProduct = seededProducts[(index + 1) % seededProducts.length];
        const items = [
          { product: firstProduct, quantity: 2 },
          { product: secondProduct, quantity: 1 },
        ];
        const totalAmount = items.reduce((sum, item) => {
          const unitPrice = item.product.sale_price ?? item.product.price;
          return sum + Number(unitPrice) * item.quantity;
        }, 0);
        const orderCode = TEST_ORDER_CODE_BASE + index + 1;

        const order = await insertSeedOrder({
          order_code: orderCode,
          user_id: customer.id,
          customer_name: TEST_CUSTOMER.fullName,
          customer_email: TEST_CUSTOMER.email,
          customer_phone: TEST_CUSTOMER.phone,
          shipping_address: "123 Test Street, Test Ward, Test City",
          total_amount: totalAmount,
          status,
          payment_method: "bank_transfer",
          delivery_method: "shipping",
          language: "vi",
        });

        const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
          items.map((item) => {
            const unitPrice = Number(item.product.sale_price ?? item.product.price);
            return {
              order_id: order.id,
              product_id: item.product.id,
              product_name: item.product.name,
              price: unitPrice,
              quantity: item.quantity,
              subtotal: unitPrice * item.quantity,
            };
          }),
        );
        if (itemsError) {
          throw new Error(`Failed to create seed order items: ${itemsError.message}`);
        }

        const paymentStatus = paymentStatusForOrderStatus(status);
        const { error: paymentError } = await supabaseAdmin.from("payments").insert({
          order_id: order.id,
          payment_link_id: `MOCK-${orderCode}`,
          checkout_url: "/checkout/mock-payment",
          amount: totalAmount,
          status: paymentStatus,
          paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
        });
        if (paymentError) {
          throw new Error(`Failed to create seed payment: ${paymentError.message}`);
        }

        seededOrders.push({
          id: order.id,
          order_code: orderCode,
          status,
          order_items: items.length,
        });
      }
    }

    return NextResponse.json({
      success: true,
      accounts: { admin, customer },
      categories: (categories as Array<{ id: string; slug: string; name: string }>).map(
        (category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
        }),
      ),
      products: seededProducts.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        sale_price: product.sale_price,
        stock: product.stock,
      })),
      collectionPoint: {
        id: collectionPoint.id,
        name: collectionPoint.name,
        address: collectionPoint.address,
      },
      orders: seededOrders,
    });
  } catch (error) {
    console.error("Test seed error:", error);
    return NextResponse.json(
      {
        error: "Failed to seed test data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
