export interface AuthUser {
  id: string;
  email: string;
}

const BASE = "/api/auth";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const authApi = {
  me: () => request<AuthUser>(`${BASE}/me`),
  register: (email: string, password: string, registrationCode?: string) =>
    request<AuthUser>(`${BASE}/register`, {
      method: "POST",
      body: JSON.stringify({ email, password, registrationCode }),
    }),
  login: (email: string, password: string) =>
    request<AuthUser>(`${BASE}/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>(`${BASE}/logout`, { method: "POST" }),
};
