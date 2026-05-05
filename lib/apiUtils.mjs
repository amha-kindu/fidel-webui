const TRAILING_SLASHES_RE = /\/+$/;
const DEFAULT_API_BASE_URL = "/api/v1";

export function resolveApiBaseUrl(value = process.env.NEXT_PUBLIC_API_URL) {
  if (typeof value === "string") {
    const normalized = value.trim().replace(TRAILING_SLASHES_RE, "");
    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_API_BASE_URL;
}

export function requireApiBaseUrl(value = process.env.NEXT_PUBLIC_API_URL) {
  return resolveApiBaseUrl(value);
}

export function createBearerHeaders(token, headers = {}) {
  if (!token) return { ...headers };

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

function extractDetail(payload, fallbackMessage) {
  if (!payload) return fallbackMessage;

  if (typeof payload === "string") {
    const normalized = payload.trim();
    return normalized || fallbackMessage;
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail[0]?.msg || payload.detail[0] || fallbackMessage;
  }

  return payload.detail || payload.message || fallbackMessage;
}

export async function readResponseErrorMessage(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      return extractDetail(payload, fallbackMessage);
    }

    const text = await response.text();
    return extractDetail(text, fallbackMessage);
  } catch {
    return fallbackMessage;
  }
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}
