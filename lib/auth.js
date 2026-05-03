import { requireApiBaseUrl, readResponseErrorMessage } from "@/lib/apiUtils.mjs";
import { createHttpError } from "@/lib/errorMessages";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export function getStoredAuth() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;

    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function storeAuth(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user || {}));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

async function fetchCurrentUser(token) {
  const endpoint = `${requireApiBaseUrl()}/users/me`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const detail = await readResponseErrorMessage(
        response,
        "Unable to fetch current user profile"
      );
      throw createHttpError(response.status, detail);
    }

    return response.json();
  } catch (err) {
    if (err?.status) throw err;
    throw new Error("Network error while loading your account.");
  }
}

async function resolveAndStoreAuth(token, fallbackUser) {
  let user = fallbackUser || null;

  try {
    user = await fetchCurrentUser(token);
  } catch {
    // Keep the lightweight fallback profile for the current session when the
    // profile endpoint is temporarily unavailable.
  }

  storeAuth(token, user);
  return { token, user };
}

export async function login({ email, password }) {
  const endpoint = `${requireApiBaseUrl()}/auth/login`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const detail = await readResponseErrorMessage(response, "Login failed");
      throw createHttpError(response.status, detail);
    }

    const data = await response.json();
    const token = data.access_token || data.token || data.accessToken;

    if (!token) {
      throw new Error("No access token returned from auth endpoint");
    }

    return resolveAndStoreAuth(token, { email });
  } catch (err) {
    if (err?.status) throw err;
    throw new Error("Network error while signing in.");
  }
}

export async function signup({ email, password }) {
  const endpoint = `${requireApiBaseUrl()}/auth/register`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const detail = await readResponseErrorMessage(response, "Signup failed");
      throw createHttpError(response.status, detail);
    }

    // Registration returns user info but no token; follow up with login to get
    // the bearer token expected by the rest of the client.
    return login({ email, password });
  } catch (err) {
    if (err?.status) throw err;
    throw new Error("Network error while creating your account.");
  }
}

export { fetchCurrentUser };
