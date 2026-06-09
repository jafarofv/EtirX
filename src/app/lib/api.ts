import { getAuthToken } from "./auth";
import { API_BASE, extractApiErrorMessage } from "./config";

async function request<T>(path: string, init?: RequestInit, retryWithoutToken = true): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init,
  });
  if (res.status === 401 && token && retryWithoutToken) {
    const retryHeaders = { ...headers };
    delete retryHeaders.Authorization;
    const retryRes = await fetch(`${API_BASE}${path}`, {
      headers: retryHeaders,
      ...init,
    });
    if (!retryRes.ok) {
      const bodyText = await retryRes.text();
      throw new Error(extractApiErrorMessage(bodyText, retryRes.status));
    }
    if (retryRes.status === 204) return undefined as T;
    return retryRes.json() as Promise<T>;
  }
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(extractApiErrorMessage(bodyText, res.status));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function sendContact(payload: { name: string; email: string; message: string }) {
  return request("/contact/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackOrder(code: string) {
  return request<{ code: string; status: string; created_at: string }>(`/orders/${code}/tracking/`);
}

export async function createOrder(payload: {
  full_name: string;
  phone: string;
  address: string;
  notes?: string;
  promo_code?: string;
  delivery_method?: string;
  shipping_fee?: string;
  items: Array<{
    product_id: number;
    product_slug?: string;
    variant_id?: number;
    quantity: number;
  }>;
}) {
  return request<{
    code: string;
    full_name: string;
    phone: string;
    address: string;
    notes: string;
    promo_code: string;
    discount_amount: string;
    payment_method: string;
    delivery_method: string;
    status: string;
    subtotal: string;
    shipping_fee: string;
    total: string;
    created_at: string;
    items: Array<{
      product: number;
      product_name: string;
      product_image: string;
      variant_label: string;
      variant_type: string;
      quantity: number;
      unit_price: string;
    }>;
  }>("/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  description: string;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  price: string;
  old_price: string | null;
  volume_ml?: number;
  gender?: string;
  stock: number;
  rating: string;
  review_count: number;
  image_url: string;
  images?: string[];
  variants?: Array<{
    id: number;
    variant_type: string;
    label: string;
    size_ml: number | null;
    price: string;
    stock: number;
    image_url: string;
    is_active: boolean;
    sort_order: number;
  }>;
  default_variant?: {
    id: number | null;
    variant_type: string;
    label: string;
    size_ml: number | null;
    price: string;
    stock: number;
    image_url: string;
    is_active: boolean;
    sort_order: number;
  };
  is_active: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  category: { id: number; name: string; slug: string };
  categories?: Array<{ id: number; name: string; slug: string }>;
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
};

export async function getProducts(params?: { category?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  const data = await request<{ results: ApiProduct[]; count: number } | ApiProduct[]>(
    `/products/${qs ? `?${qs}` : ""}`
  );
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function getCategories() {
  return request<ApiCategory[]>("/categories/");
}

export type ApiCampaign = {
  code: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: string;
  min_subtotal: string;
  ends_at: string | null;
};

export async function getCampaigns() {
  return request<ApiCampaign[]>("/promo-codes/");
}

export type ApiDeliveryMethod = {
  code: string;
  label: string;
  eta: string;
  fee: string;
  fee_label: string;
  requires_address: boolean;
  sort_order: number;
};

export const FALLBACK_DELIVERY_METHODS: ApiDeliveryMethod[] = [
  {
    code: "city_courier",
    label: "Şəhər daxili çatdırılma",
    eta: "Yango, Bolt və s.",
    fee: "0.00",
    fee_label: "Ödənişi siz edirsiniz",
    requires_address: true,
    sort_order: 10,
  },
  {
    code: "metro_drop",
    label: "N.Nərimanov / Gənclik metrosuna çatdırılma",
    eta: "1-2 saat",
    fee: "2.00",
    fee_label: "",
    requires_address: false,
    sort_order: 20,
  },
  {
    code: "azerpost",
    label: "AzərPoçt ilə göndəriş",
    eta: "2-4 iş günü",
    fee: "3.00",
    fee_label: "",
    requires_address: false,
    sort_order: 30,
  },
  {
    code: "pickup",
    label: "Depodan təhvil alma",
    eta: "Dərhal",
    fee: "0.00",
    fee_label: "Pulsuz",
    requires_address: false,
    sort_order: 40,
  },
];

export async function getDeliveryMethods() {
  const data = await request<{ results: ApiDeliveryMethod[]; count: number } | ApiDeliveryMethod[]>("/delivery-methods/");
  const methods = Array.isArray(data) ? data : (data.results ?? []);
  return methods.length > 0 ? methods : FALLBACK_DELIVERY_METHODS;
}

export type ApiTestimonial = {
  id: number;
  name: string;
  handle: string;
  time: string;
  rating: number;
  text: string;
};

export async function getTestimonials() {
  return request<ApiTestimonial[]>("/testimonials/");
}

export type ApiSiteSettings = {
  whatsapp_number: string;
  instagram_url: string;
  instagram_handle: string;
  tiktok_url: string;
  tiktok_handle: string;
  store_address: string;
  banner_text: string;
  gram_image_url: string;
  gram_image_15_url: string;
  gram_image_30_url: string;
  gram_image_50_url: string;
  gram_image_100_url: string;
};

export async function getSiteSettings() {
  return request<ApiSiteSettings>("/site-settings/");
}

export async function getProductBySlug(slug: string) {
  return request<ApiProduct>(`/products/${slug}/`);
}

export async function validatePromoCode(payload: { code: string; subtotal: string }) {
  return request<{
    valid: true;
    promo: {
      id: number;
      code: string;
      title: string;
      description: string;
      discount_type: string;
      discount_value: string;
      min_subtotal: string;
      active: boolean;
      max_total_uses: number | null;
      max_uses_per_user: number;
      starts_at: string | null;
      ends_at: string | null;
      created_at: string;
    };
    discount_amount: string;
    message: string;
  }>("/promo-codes/validate/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
