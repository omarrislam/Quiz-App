const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("auth_token");
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("auth_token", token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("auth_token");
}

function resolveUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const url = resolveUrl(input);
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}
