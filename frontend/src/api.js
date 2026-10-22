const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => (t ? localStorage.setItem("token", t) : localStorage.removeItem("token"));

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Can't reach the server. If it was idle, give it a minute to wake up and try again.");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : "Something went wrong";
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: () => request("/auth/me"),
  products: () => request("/products"),
  cart: () => request("/cart"),
  addToCart: (product_id, quantity = 1) => request("/cart/items", { method: "POST", body: { product_id, quantity } }),
  setQty: (product_id, quantity) => request(`/cart/items/${product_id}`, { method: "PATCH", body: { quantity } }),
  removeFromCart: (product_id) => request(`/cart/items/${product_id}`, { method: "DELETE" }),
  checkout: (body) => request("/orders/checkout", { method: "POST", body }),
  myOrders: () => request("/orders"),
  adminOrders: (status) => request(`/admin/orders${status ? `?status=${status}` : ""}`),
  adminSummary: () => request("/admin/summary"),
  adminSetStatus: (id, status) => request(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }),
};

export const money = (cents) => `Rs ${(cents / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
