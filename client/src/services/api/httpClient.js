import axios from "axios";
import { env } from "../../config/env.js";
import {
  clearStoredSession,
  persistSession,
  readStoredSession
} from "../../utils/helpers/auth-storage.js";
import { store } from "../../app/store/index.js";
import { clearSession, setSession } from "../../app/store/slices/authSlice.js";
import { setTheme } from "../../app/store/slices/uiSlice.js";
import {
  buildDemoResponse,
  hasActiveDemoSession,
  isDemoAccessToken
} from "./demo-api.js";

function readAccessToken() {
  return store.getState().auth.accessToken ?? readStoredSession()?.accessToken ?? null;
}

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

let refreshPromise = null;

function shouldSkipRefresh(config = {}) {
  if (config.skipAuthRefresh) {
    return true;
  }

  const url = config.url ?? "";

  return ["/auth/login", "/auth/register", "/auth/refresh-token", "/auth/logout"].some((path) =>
    url.includes(path)
  );
}

function shouldUseDemoAdapter(config = {}) {
  if (config.disablePreviewDemo) {
    return false;
  }

  const accessToken = readAccessToken();

  return hasActiveDemoSession() || isDemoAccessToken(accessToken);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${env.apiBaseUrl}/auth/refresh-token`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
      .then((response) => {
        const currentSession = readStoredSession();
        const rememberMe = Boolean(currentSession?.rememberMe);
        const nextSession = {
          accessToken: response.data.accessToken,
          user: response.data.user
        };

        persistSession(nextSession, rememberMe);
        store.dispatch(
          setSession({
            ...nextSession,
            rememberMe
          })
        );
        store.dispatch(setTheme(response.data.user?.preferences?.theme ?? "dark"));

        return response.data.accessToken;
      })
      .catch((error) => {
        clearStoredSession();
        store.dispatch(clearSession());
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

httpClient.interceptors.request.use((config) => {
  const accessToken = readAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (shouldUseDemoAdapter(config)) {
    config.adapter = () => buildDemoResponse(config);
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};

    if (!error?.response && !originalRequest._demoRetry && !originalRequest.disablePreviewDemo) {
      originalRequest._demoRetry = true;

      try {
        return await buildDemoResponse(originalRequest);
      } catch (demoError) {
        return Promise.reject(demoError);
      }
    }

    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest)
    ) {
      originalRequest._retry = true;

      try {
        const nextAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

        return httpClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
