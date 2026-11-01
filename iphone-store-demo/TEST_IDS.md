# TEST_IDS.md — data-testid reference

All interactive elements (plus key assertion targets) use `data-testid`.
Naming convention: **[area]-[component]-[action]** (kebab-case), e.g.
`checkout-step1-email-input`, `cart-item-qty-increase`,
`admin-orders-status-filter`.

## Dynamic suffixes

Repeated elements use a template. The container carries the dynamic ID and
children use stable IDs so tests can scope queries:

| Pattern | Example | Meaning |
|---|---|---|
| `product-card-{slug}` | `product-card-iphone-13` | Product card root link |
| `home-category-card-{slug}` | `home-category-card-iphone-13` | Homepage category card |
| `cart-item-{productId}` | `cart-item-<uuid>` | Cart row |
| `orders-order-card-{orderCode}` | `orders-order-card-9900000000001` | Customer order card |
| `admin-product-row-{productId}` | `admin-product-row-<uuid>` | Admin product row |
| `admin-category-row-{categoryId}` | `admin-category-row-<uuid>` | Admin category row |
| `admin-user-row-{userId}` | `admin-user-row-<uuid>` | Admin user row |
| `admin-orders-row-{orderCode}` | `admin-orders-row-9900000000001` | Admin order row |
| `products-filter-category-{slug}` | `products-filter-category-iphone-13` | Category filter |
| `nav-category-link-{slug}` | `nav-category-link-iphone-13` | Desktop category link |
| `nav-mobile-category-link-{slug}` | `nav-mobile-category-link-iphone-13` | Mobile category link |
| `review-item-{reviewId}` | `review-item-<uuid>` | Review row |
| `product-detail-thumbnail-{index}` | `product-detail-thumbnail-0` | Gallery thumbnail |
| `admin-product-image-item-{index}` | `admin-product-image-item-0` | Product image card |
| `order-status-step-{stepId}` | `order-status-step-paid` | Stepper step |
| `pagination-page-button-{page}` | `pagination-page-button-2` | Page number button |

Playwright scoping example:

```python
card = page.get_by_test_id("product-card-iphone-13")
card.get_by_test_id("product-card-title").click()
```

```python
row = page.get_by_test_id("admin-orders-row-9900000000001")
row.get_by_test_id("admin-orders-status-select-9900000000001").select_option("paid")
```

---

## Global — `components/Navbar.tsx`

| testid | Element |
|---|---|
| `nav-logo-link` | Logo link to `/` |
| `nav-products-link` | Desktop "Sản phẩm" link |
| `nav-categories-toggle` | Desktop category dropdown toggle |
| `nav-categories-dropdown` | Desktop category dropdown panel |
| `nav-category-link-{slug}` | Category link inside dropdown |
| `nav-track-order-link` | Desktop "Theo dõi đơn" link |
| `nav-admin-link` | Admin link (only when logged in as admin) |
| `nav-language-toggle` | Desktop language dropdown toggle |
| `nav-language-vi` | Desktop "Tiếng Việt" |
| `nav-language-en` | Desktop "English" |
| `nav-cart-button` | Cart icon button |
| `nav-cart-badge` | Cart item count badge |
| `nav-mobile-menu-button` | Hamburger button |
| `nav-mobile-backdrop` | Drawer backdrop |
| `nav-mobile-drawer` | Mobile drawer panel |
| `nav-mobile-close-button` | Drawer close button |
| `nav-mobile-link-home` | Mobile "Trang chủ" |
| `nav-mobile-link-products` | Mobile "Sản phẩm" |
| `nav-mobile-link-track-order` | Mobile "Theo dõi đơn" |
| `nav-mobile-categories-toggle` | Mobile categories accordion |
| `nav-mobile-category-link-{slug}` | Mobile category link |
| `nav-mobile-admin-link` | Mobile admin link |
| `nav-mobile-language-vi` | Mobile "VI" |
| `nav-mobile-language-en` | Mobile "EN" |

## `/` — Homepage (`app/HomeClient.tsx`)

| testid | Element |
|---|---|
| `home-hero-shop-link` | Hero CTA "Mua ngay" |
| `home-hero-categories-link` | Hero CTA "Xem dòng iPhone" |
| `home-categories-grid` | iPhone line category grid |
| `home-categories-empty-state` | Empty categories block |
| `home-category-card-{slug}` | Category card (e.g. `home-category-card-iphone-13`) |
| `home-featured-view-all-link` | "Xem tất cả" featured products |
| `home-featured-grid` | Featured products grid |
| `home-featured-empty-state` | Empty featured products block |
| `home-footer` | Footer |
| `home-footer-products-link` | Footer "Sản phẩm" |
| `home-footer-track-order-link` | Footer "Theo dõi đơn" |
| `home-footer-cart-link` | Footer "Giỏ hàng" |

## `/products` — Product listing

| testid | Element |
|---|---|
| `products-filter-toggle-button` | Mobile filter toggle |
| `products-filter-panel-mobile` | Mobile filter panel |
| `products-filter-sidebar` | Desktop filter sidebar |
| `products-empty-state` | Empty result block |
| `products-showing-count` | "Showing X / Y" text |
| `products-sort-select` | Sort dropdown (`newest`, `price_asc`, `price_desc`) |
| `products-grid` | Product grid |

### Product filters (`components/ProductFilters.tsx`)

| testid | Element |
|---|---|
| `products-filter-close-button` | Close (mobile only) |
| `products-filter-reset-button` | Reset all filters |
| `products-filter-category-all` | "All categories" option |
| `products-filter-category-{slug}` | Category option |
| `products-filter-min-price-input` | Minimum price input |
| `products-filter-max-price-input` | Maximum price input |
| `products-filter-apply-button` | Apply price filter |

### Pagination (`components/Pagination.tsx`)

| testid | Element |
|---|---|
| `pagination` | Pagination root (hidden when 1 page) |
| `pagination-prev-button` | Previous page |
| `pagination-page-button-{n}` | Page number |
| `pagination-next-button` | Next page |

### Product card (`components/ProductCard.tsx`)

| testid | Element |
|---|---|
| `product-card-{slug}` | Card root link |
| `product-card-image` | Image container |
| `product-card-discount-badge` | `-NN%` badge |
| `product-card-low-stock-badge` | Low stock badge |
| `product-card-title` | Product name |
| `product-card-price` | Current price |
| `product-card-original-price` | Original price (strikethrough) |
| `product-card-stock-status` | In stock / out of stock text |

## `/products/[slug]` — Product detail

| testid | Element |
|---|---|
| `product-breadcrumb-home-link` | Breadcrumb "Trang chủ" |
| `product-breadcrumb-products-link` | Breadcrumb "Sản phẩm" |
| `product-detail-main-image` | Main image container |
| `product-detail-thumbnail-{index}` | Gallery thumbnail |
| `product-detail-discount-badge` | Discount badge on image |
| `product-detail-low-stock-badge` | Low stock badge |
| `product-detail-out-of-stock-badge` | Out of stock badge |
| `product-detail-name` | Product name |
| `product-detail-rating-summary` | Rating summary (opens reviews tab) |
| `product-detail-price` | Current price |
| `product-detail-original-price` | Original price |
| `product-detail-qty-decrease` | Quantity − |
| `product-detail-qty-value` | Quantity value |
| `product-detail-qty-increase` | Quantity + |
| `product-detail-add-to-cart-button` | "Thêm vào giỏ" |
| `product-detail-buy-now-button` | "Mua ngay" |
| `product-detail-out-of-stock-message` | Out-of-stock block |
| `product-detail-tab-description` | Tab "Mô tả" |
| `product-detail-tab-shipping` | Tab "Vận chuyển" |
| `product-detail-tab-returns` | Tab "Đổi trả" |
| `product-detail-tab-reviews` | Tab "Đánh giá" |
| `product-detail-share-facebook-button` | Facebook share |
| `product-detail-share-copy-button` | Copy link |
| `product-related-view-all-link` | Related products "Xem tất cả" |
| `product-related-grid` | Related products grid |

### Reviews (`components/ProductReviews.tsx`)

| testid | Element |
|---|---|
| `reviews-form` | Review form |
| `reviews-name-input` | Reviewer name |
| `reviews-star-button-{1..5}` | Interactive star buttons |
| `reviews-comment-input` | Comment textarea |
| `reviews-error-message` | Validation/API error |
| `reviews-submit-button` | Submit review |
| `reviews-list` | Review list |
| `review-item-{reviewId}` | Single review |
| `reviews-empty-state` | "No reviews yet" |

## `/cart` — Cart

| testid | Element |
|---|---|
| `cart-empty-state` | Empty cart block |
| `cart-empty-continue-link` | Empty state "Tiếp tục mua sắm" |
| `cart-item-{productId}` | Cart row |
| `cart-item-name-link` | Product name link |
| `cart-item-remove-button` | Remove item |
| `cart-item-qty-decrease` | Quantity − |
| `cart-item-qty-value` | Quantity value |
| `cart-item-qty-increase` | Quantity + |
| `cart-item-line-total` | Line total |
| `cart-clear-button` | Clear cart |
| `cart-subtotal-value` | Subtotal |
| `cart-total-value` | Total |
| `cart-checkout-button` | "Thanh toán" |
| `cart-continue-shopping-link` | "Tiếp tục mua sắm" |

## `/checkout` — Checkout

| testid | Element |
|---|---|
| `checkout-empty-state` | Empty cart block |
| `checkout-empty-continue-link` | Continue shopping |
| `checkout-success-state` | Redirect/processing overlay |
| `checkout-step1-toggle` | Step 1 accordion header |
| `checkout-step1-fullname-input` | Full name |
| `checkout-step1-phone-input` | Phone |
| `checkout-step1-email-input` | Email |
| `checkout-step1-continue-button` | Confirm step 1 |
| `checkout-step2-toggle` | Step 2 accordion header |
| `checkout-step2-pickup-toggle` | Delivery: pickup |
| `checkout-step2-shipping-toggle` | Delivery: shipping |
| `checkout-step2-collection-point-radio-{id}` | Pickup location radio |
| `checkout-step2-province-select` | Province |
| `checkout-step2-district-select` | District (address v1) |
| `checkout-step2-ward-select` | Ward |
| `checkout-step2-address-input` | Street address |
| `checkout-step2-notes-input` | Notes |
| `checkout-step2-continue-button` | Confirm step 2 |
| `checkout-step3-toggle` | Step 3 accordion header |
| `checkout-step3-bank_transfer-button` | Payment: bank transfer |
| `checkout-step3-cash-button` | Payment: cash |
| `checkout-step3-continue-button` | Confirm step 3 |
| `checkout-order-summary` | Desktop order summary |
| `checkout-submit-button` | Desktop submit |
| `checkout-mobile-summary-toggle` | Mobile summary toggle |
| `checkout-mobile-submit-button` | Mobile submit |
| `checkout-back-to-cart-link` | Back to cart |

## `/checkout/mock-payment` — Mock gateway (PAYMENT_MODE=mock)

| testid | Element |
|---|---|
| `mock-payment-loading` | Loading text |
| `mock-payment-error` | Error message |
| `mock-payment-order-code` | Order code |
| `mock-payment-amount` | Amount |
| `mock-payment-status` | Current status |
| `mock-payment-success-button` | "Pay successfully" |
| `mock-payment-failure-button` | "Payment failed" |
| `mock-payment-back-link` | Back to order/products |

## `/orders` — Customer order history

| testid | Element |
|---|---|
| `orders-error-message` | Load error banner |
| `orders-loading-state` | Loading skeleton |
| `orders-empty-state` | Empty state |
| `orders-shop-now-link` | "Mua sắm ngay" |
| `orders-list` | Order list |
| `orders-order-card-{orderCode}` | Order card |
| `orders-order-status-{orderCode}` | Status badge |
| `orders-order-total-{orderCode}` | Order total |
| `orders-view-detail-link-{orderCode}` | "Xem chi tiết" |

### Account sidebar (`components/DashboardSidebar.tsx`)

| testid | Element |
|---|---|
| `dashboard-sidebar` | Sidebar root |
| `sidebar-user-name` | User display name |
| `sidebar-user-email` | User email |
| `sidebar-link-profile` | "Tài khoản" (`/profile`) |
| `sidebar-link-orders` | "Đơn hàng" (`/orders`) |
| `sidebar-signout-button` | Sign out |

## `/orders/[id]` — Order detail

| testid | Element |
|---|---|
| `order-detail-status-stepper` | Stepper card |
| `order-detail-order-code` | Order code |
| `order-detail-status-badge` | Status badge |
| `order-detail-item-{itemId}` | Item row |
| `order-detail-products-total` | Products subtotal |
| `order-detail-shipping-fee` | Shipping fee |
| `order-detail-total` | Grand total |
| `order-detail-customer-name` | Customer name |
| `order-detail-customer-email` | Customer email |
| `order-detail-customer-phone` | Customer phone |
| `order-detail-payment-method` | Payment method |
| `order-detail-payment-status` | Payment status |
| `order-status-stepper` | Stepper root |
| `order-status-step-{placed\|paid\|processing\|shipping\|completed}` | Stepper step (`data-active="true"` when reached) |
| `payment-verifier-overlay` | PayOS confirmation overlay |

## `/track-order` — Track order

| testid | Element |
|---|---|
| `track-order-search-form` | Search form |
| `track-order-code-input` | Order code input |
| `track-order-search-button` | "Tra cứu" |
| `track-order-search-error` | Search error |
| `track-order-verify-form` | Phone verification form |
| `track-order-phone4-input` | Last 4 phone digits |
| `track-order-verify-back-button` | "Quay lại" |
| `track-order-verify-button` | "Xác nhận" |
| `track-order-verify-error` | Verification error |
| `track-order-result` | Result container |
| `track-order-back-button` | Back to search |
| `track-order-order-code` | Order code |
| `track-order-status-badge` | Status badge |
| `track-order-pay-now-link` | Pay now (pending + payment link) |
| `track-order-items` | Items block |
| `track-order-item-{itemId}` | Item row |
| `track-order-products-total` | Products subtotal |
| `track-order-shipping-fee` | Shipping fee |
| `track-order-total` | Grand total |
| `track-order-customer-name` | Customer name |
| `track-order-customer-phone` | Customer phone |
| `track-order-customer-email` | Customer email |
| `track-order-shipping-address` | Shipping address |
| `track-order-empty-hint` | Initial hint |

## `/admin/login`

| testid | Element |
|---|---|
| `admin-login-form` | Login form |
| `admin-login-email-input` | Email |
| `admin-login-password-input` | Password |
| `admin-login-submit-button` | Submit |

## `/admin/*` layout (`app/admin/layout.tsx`)

| testid | Element |
|---|---|
| `admin-logo-link` | Logo link to `/admin` |
| `admin-nav-dashboard` | Nav "Tổng quan" |
| `admin-nav-orders` | Nav "Đơn hàng" |
| `admin-nav-products` | Nav "Sản phẩm" |
| `admin-nav-categories` | Nav "Danh mục" |
| `admin-nav-users` | Nav "Người dùng" |
| `admin-back-to-home-button` | "Về trang chủ" |
| `admin-signout-button` | "Đăng xuất" |

## `/admin` — Dashboard

| testid | Element |
|---|---|
| `admin-dashboard-orders-card` | Orders stat card |
| `admin-dashboard-revenue-card` | Revenue stat card |
| `admin-dashboard-products-card` | Products stat card |
| `admin-dashboard-view-all-orders-link` | "Xem tất cả" |
| `admin-dashboard-recent-orders-table` | Recent orders table |
| `admin-dashboard-recent-orders-empty` | Empty row |
| `admin-dashboard-recent-order-row-{orderCode}` | Recent order row |

## `/admin/orders`

| testid | Element |
|---|---|
| `admin-orders-search-input` | Search by name/email/order code |
| `admin-orders-status-filter` | Status filter |
| `admin-orders-table` | Orders table |
| `admin-orders-loading-state` | Loading row |
| `admin-orders-empty-state` | Empty row |
| `admin-orders-row-{orderCode}` | Order row |
| `admin-orders-expand-button-{orderCode}` | Expand/collapse |
| `admin-orders-status-select-{orderCode}` | Row status select (updates immediately) |
| `admin-orders-detail-{orderCode}` | Expanded detail row |
| `admin-orders-confirm-transfer-button-{orderCode}` | Confirm bank transfer |
| `admin-orders-confirm-cash-button-{orderCode}` | Confirm cash payment |
| `admin-orders-items-table-{orderCode}` | Items table in detail |

## `/admin/products` and product form

| testid | Element |
|---|---|
| `admin-products-search-input` | Search |
| `admin-products-create-link` | "Thêm mới" |
| `admin-products-table` | Table |
| `admin-products-empty-state` | Empty row |
| `admin-product-row-{id}` | Row |
| `admin-product-toggle-active-{id}` | Show/hide toggle |
| `admin-product-edit-link-{id}` | Edit link |
| `admin-product-delete-button-{id}` | Delete button |
| `admin-product-back-link` | Back link (create/edit pages) |
| `admin-product-form` | Form |
| `admin-product-name-input` | Name |
| `admin-product-name-en-input` | English name |
| `admin-product-slug-input` | Slug |
| `admin-product-sku-input` | SKU |
| `admin-product-price-input` | Price |
| `admin-product-sale-price-input` | Sale price |
| `admin-product-stock-input` | Stock |
| `admin-product-category-select` | Category |
| `admin-product-image-list` | Image card list |
| `admin-product-image-item-{index}` | Image card |
| `admin-product-image-primary-button-{index}` | Set primary |
| `admin-product-image-remove-button-{index}` | Remove image |
| `admin-product-image-file-input` | File upload |
| `admin-product-active-checkbox` | Active checkbox |
| `admin-product-description-input` | Description |
| `admin-product-description-en-input` | English description |
| `admin-product-cancel-button` | Cancel |
| `admin-product-submit-button` | Create/update |

## `/admin/categories` and category form

| testid | Element |
|---|---|
| `admin-categories-create-link` | "Thêm mới" |
| `admin-categories-table` | Table |
| `admin-categories-loading-state` | Loading row |
| `admin-categories-empty-state` | Empty row |
| `admin-category-row-{id}` | Row |
| `admin-category-toggle-active-{id}` | Show/hide toggle |
| `admin-category-edit-link-{id}` | Edit link |
| `admin-category-delete-button-{id}` | Delete button |
| `admin-category-back-link` | Back link |
| `admin-category-form` | Form |
| `admin-category-name-input` | Name |
| `admin-category-name-en-input` | English name |
| `admin-category-slug-input` | Slug |
| `admin-category-active-checkbox` | Active checkbox |
| `admin-category-cancel-link` | Cancel |
| `admin-category-submit-button` | Create/update |

## `/admin/users` and user form

| testid | Element |
|---|---|
| `admin-users-search-input` | Search |
| `admin-users-table` | Table |
| `admin-users-loading-state` | Loading row |
| `admin-users-empty-state` | Empty row |
| `admin-user-row-{id}` | Row |
| `admin-user-admin-toggle-{id}` | Grant/revoke admin |
| `admin-user-edit-link-{id}` | Edit link |
| `admin-user-active-toggle-{id}` | Lock/unlock account |
| `admin-user-loading-state` | Edit page loading |
| `admin-user-not-found` | Edit page not found |
| `admin-user-back-link` | Back link |
| `admin-user-form` | Form |
| `admin-user-email-input` | Email (disabled) |
| `admin-user-name-input` | Full name |
| `admin-user-phone-input` | Phone |
| `admin-user-cancel-link` | Cancel |
| `admin-user-submit-button` | Save |

