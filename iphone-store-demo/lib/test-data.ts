import { supabaseAdmin } from "@/lib/supabase";

// Fixed test accounts created by POST /api/test/seed.
// These are intentionally obvious and only exist in test environments.
export const TEST_ADMIN = {
  email: "admin@test.local",
  password: "Admin123!",
  fullName: "Test Admin",
};

export const TEST_CUSTOMER = {
  email: "customer@test.local",
  password: "Customer123!",
  fullName: "Test Customer",
  phone: "0900000001",
};

export const TEST_EMAIL_DOMAIN = "@test.local";
export const TEST_NAME_PREFIX = "[TEST]";
export const TEST_SLUG_PREFIX = "test-";
export const TEST_SKU_PREFIX = "TEST-SKU-";
// Deterministic order codes let tests reference seeded orders without
// querying the database. Range: 9900000000001..9900000000099.
export const TEST_ORDER_CODE_BASE = 9900000000000;

// Canonical lifecycle used by the admin UI, order stepper and track-order.
// NOTE: types/index.ts still mentions the legacy value "shipped"; the
// application itself uses "shipping" everywhere, so tests should use
// "shipping".
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipping",
  "completed",
  "cancelled",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function paymentStatusForOrderStatus(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "pending";
    case "paid":
    case "processing":
    case "shipping":
    case "completed":
      return "paid";
    case "cancelled":
      return "cancelled";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

type EnsureUserInput = {
  email: string;
  password: string;
  fullName: string;
  isAdmin: boolean;
  phone?: string;
};

async function findAuthUserByEmail(email: string) {
  const normalized = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Failed to list auth users: ${error.message}`);

    const users = (data?.users ?? []) as Array<{ id: string; email?: string | null }>;
    const match = users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (users.length < 1000) return null;
    page += 1;
  }
}

/**
 * Creates (or repairs) a Supabase Auth user plus its public.users profile.
 * Safe to call repeatedly: existing users are updated instead of duplicated.
 */
export async function ensureTestUser(input: EnsureUserInput) {
  const existing = await findAuthUserByEmail(input.email);
  let userId: string;

  if (existing) {
    userId = existing.id;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
    if (error) {
      throw new Error(`Failed to update test user ${input.email}: ${error.message}`);
    }
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
    if (error || !data.user) {
      throw new Error(
        `Failed to create test user ${input.email}: ${error?.message ?? "unknown error"}. ` +
          "Run architecture/db_schema_full.sql first (it fixes the handle_new_user trigger).",
      );
    }
    userId = data.user.id;
  }

  const { error: profileError } = await supabaseAdmin.from("users").upsert(
    {
      id: userId,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone ?? null,
      is_admin: input.isAdmin,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Failed to upsert public.users profile: ${profileError.message}`);
  }

  return { id: userId, email: input.email, is_admin: input.isAdmin };
}

async function countRows(table: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function deleteAll(table: string): Promise<void> {
  const { error } = await supabaseAdmin.from(table).delete().not("id", "is", null);
  if (error) {
    throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}

export type ResetSummary = {
  users: number;
  orders: number;
  order_items: number;
  payments: number;
  payment_webhooks: number;
  products: number;
  product_images: number;
  product_reviews: number;
  categories: number;
  collection_points: number;
  forward_email: number;
};

/**
 * Wipes every business table so the database returns to a clean state.
 *
 * The owner explicitly chose a full wipe for this learning environment.
 * Pass { keepUsers: true } to preserve auth users (useful when a real
 * admin account must survive a reset).
 */
export async function resetTestData(
  options: { keepUsers?: boolean } = {},
): Promise<ResetSummary> {
  const summary: ResetSummary = {
    users: 0,
    orders: 0,
    order_items: 0,
    payments: 0,
    payment_webhooks: 0,
    products: 0,
    product_images: 0,
    product_reviews: 0,
    categories: 0,
    collection_points: 0,
    forward_email: 0,
  };

  // Count before deleting (best effort, for the API response).
  summary.payment_webhooks = await countRows("payment_webhooks");
  summary.payments = await countRows("payments");
  summary.order_items = await countRows("order_items");
  summary.orders = await countRows("orders");
  summary.product_reviews = await countRows("product_reviews");
  summary.product_images = await countRows("product_images");
  summary.products = await countRows("products");
  summary.categories = await countRows("categories");
  summary.collection_points = await countRows("collection_points");
  summary.forward_email = await countRows("forward_email");

  // Delete in FK-safe order.
  await deleteAll("payment_webhooks");
  await deleteAll("payments");
  await deleteAll("order_items");
  await deleteAll("orders");
  await deleteAll("product_reviews");
  await deleteAll("product_images");
  await deleteAll("products");
  await deleteAll("categories");
  await deleteAll("collection_points");
  await deleteAll("forward_email");

  // Reset (not delete) the visit counter row.
  await supabaseAdmin
    .from("site_visits")
    .update({ total_visits: 0, updated_at: new Date().toISOString() })
    .eq("id", "main");

  if (!options.keepUsers) {
    const { data: profiles, error: profileCountError } = await supabaseAdmin
      .from("users")
      .select("id");
    if (profileCountError) {
      throw new Error(`Failed to list users: ${profileCountError.message}`);
    }
    summary.users = profiles?.length ?? 0;

    // public.users references auth.users without ON DELETE CASCADE on
    // older installations, so profiles must be removed first.
    const { error: profileDeleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .not("id", "is", null);
    if (profileDeleteError) {
      throw new Error(`Failed to clear users: ${profileDeleteError.message}`);
    }

    const authUserIds: string[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error) {
        throw new Error(`Failed to list auth users: ${error.message}`);
      }
      const users = (data?.users ?? []) as Array<{ id: string }>;
      authUserIds.push(...users.map((user) => user.id));
      if (users.length < 1000) break;
      page += 1;
    }

    for (const userId of authUserIds) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        throw new Error(`Failed to delete auth user ${userId}: ${error.message}`);
      }
    }
  }

  return summary;
}
