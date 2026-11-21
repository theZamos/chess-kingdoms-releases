// The webpage's way to the accounts server (relay/api.js), as the game's
// AccountClient talks to it (net/account.gd): the same addresses, the same
// answers, the same words when something goes wrong. Signed in, it sends your
// token (account.js). The server's address is the page's <meta name="ck-api">
// (the tests point it at a pretend server).

import { account } from "./account.js";

export const API_URL = "https://api.chesskingdoms.net";

export function apiUrl() {
  const meta = typeof document !== "undefined" ? document.querySelector('meta[name="ck-api"]') : null;
  return (meta && meta.content) || API_URL;
}

// One request: the server's JSON answer plus `status` (0: couldn't reach it),
// and `error` in words whenever it didn't work. A 401 while signed in means
// the sign-in ended: it's forgotten here (the game finds out on its own).
export async function call(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = account.token();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(apiUrl() + path, {
      method,
      headers,
      body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body || {}),
    });
  } catch {
    return { status: 0, error: "Couldn't reach the accounts server. Check your connection." };
  }
  let data = {};
  try {
    const parsed = await res.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed;
  } catch { /* not JSON: the status says what happened */ }
  const out = { ...data, status: res.status };
  if (!("error" in out) && res.status >= 400) out.error = `The accounts server said no (${res.status}).`;
  if (res.status === 401 && token && !path.startsWith("/login")) account.forget();
  return out;
}

// A query string from {key: value} (empty and null values left out).
export function query(params) {
  const parts = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? "?" + parts.join("&") : "";
}

// GET /maps or /replays with a section, sort and filters (AccountClient.browse).
export function browse(kind, params) {
  return call("GET", `/${kind}${query(params)}`);
}

// One shared map or replay's listing (`download`: counted as a download), as
// AccountClient.fetch_item(): the listing itself, or {error, status} (404:
// there's no such one).
export async function fetchItem(kind, id, download = false) {
  const r = await call("GET", `/${kind}/${Number(id)}${download ? "?download=1" : ""}`);
  if (r.status === 200 && r.item && typeof r.item === "object") return r.item;
  return { error: String(r.error || "Couldn't reach the server."), status: Number(r.status) || 0 };
}

// Why it didn't work in words, or "" if it did (the game's `-> String` calls).
export function why(r, otherwise = "Something went wrong.") {
  return r.status === 200 ? "" : String(r.error || otherwise);
}
