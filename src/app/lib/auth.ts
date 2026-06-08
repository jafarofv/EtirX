import { API_BASE, extractApiErrorMessage } from "./config";

const TOKEN_KEY = "auth-token";

export type AuthUser = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken() {
  return getToken();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authRequest<T>(path: string, init?: RequestInit, useToken = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (useToken && getToken()) {
    headers.Authorization = `Token ${getToken()}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(extractApiErrorMessage(bodyText, res.status));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function registerAuth(payload: {
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
}) {
  const data = await authRequest<{ token: string; user: AuthUser }>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  return data.user;
}

export async function loginAuth(payload: { email: string; password: string }) {
  const data = await authRequest<{ token: string; user: AuthUser }>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  return data.user;
}

export async function getMe() {
  return authRequest<AuthUser>("/auth/me/", undefined, true);
}

export async function logoutAuth() {
  try {
    await authRequest<void>("/auth/logout/", { method: "POST" }, true);
  } finally {
    clearAuth();
  }
}

export async function updateMe(payload: { full_name: string; phone: string; address?: string }) {
  return authRequest<AuthUser>("/auth/me/", { method: "PATCH", body: JSON.stringify(payload) }, true);
}

export async function changePassword(payload: { current_password: string; new_password: string }) {
  const data = await authRequest<{ token: string }>("/auth/me/", { method: "POST", body: JSON.stringify(payload) }, true);
  setToken(data.token);
}

export type UserOrder = {
  code: string;
  full_name: string;
  phone: string;
  address: string;
  notes: string;
  promo_code: string;
  discount_amount: string;
  payment_method: string;
  status: string;
  subtotal: string;
  shipping_fee: string;
  total: string;
  created_at: string;
  items: Array<{ product: number; product_name: string; product_image: string; variant_label: string; variant_type: string; quantity: number; unit_price: string }>;
};

export async function getMyOrders() {
  return authRequest<UserOrder[]>("/orders/my-orders/", undefined, true);
}
