const TOKEN_KEY = "wedguest_token";
const USER_KEY = "wedguest_user";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function parseBody(res) {
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || "Request failed" };
  }
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers: extraHeaders = {} } = options;
  const token = getStoredToken();
  const headers = { ...extraHeaders };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });

  const data = await parseBody(res);
  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && data.message
        ? data.message
        : "Request failed";
    throw new Error(msg);
  }
  return data;
}

export function apiGet(path) {
  return apiRequest(path, { method: "GET" });
}

export function apiPost(path, payload) {
  return apiRequest(path, { method: "POST", body: payload });
}

export function apiPatch(path, payload) {
  return apiRequest(path, { method: "PATCH", body: payload });
}

export function apiPut(path, payload) {
  return apiRequest(path, { method: "PUT", body: payload });
}

export function apiDelete(path) {
  return apiRequest(path, { method: "DELETE" });
}

export async function downloadBlob(path, filename) {
  const token = getStoredToken();
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await parseBody(res);
    throw new Error(data.message || "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  a.click();
  URL.revokeObjectURL(url);
}
