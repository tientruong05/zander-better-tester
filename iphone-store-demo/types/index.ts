export interface Product {
  id: string;
  category_id?: string;
  name: string;
  name_en?: string;
  slug: string;
  description: string;
  description_en?: string;
  price: number;
  sale_price?: number;
  stock: number;
  sku: string;
  is_active: boolean;
  created_at: string;
  image_url?: string; // Primary image URL (computed from product_images)
  product_images?: ProductImage[]; // Array of all product images
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Category {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  order_code: number;
  user_id?: string;
  shipping_address_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  payment_method?: 'bank_transfer' | 'cash';
  delivery_method?: 'shipping' | 'pickup';
  collection_point_id?: string;
  language?: string;
  created_at: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_link_id?: string;
  checkout_url?: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'failed';
  paid_at?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  district?: string;
  ward?: string;
  is_default: boolean;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
