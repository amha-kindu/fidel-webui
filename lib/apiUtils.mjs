const TRAILING_SLASHES_RE = /\/+$/;

export function resolveApiBaseUrl(value = process.env.NEXT_PUBLIC_API_URL) {
  return typeof value === "string" ? value.replace(TRAILING_SLASHES_RE, "") : "";
}

export function requireApiBaseUrl(value = process.env.NEXT_PUBLIC_API_URL) {
  const apiBaseUrl = resolveApiBaseUrl(value);

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }

  return apiBaseUrl;
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
