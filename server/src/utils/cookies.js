import { env } from "../config/env.js";
import { REFRESH_COOKIE_DEFAULT_NAME } from "../constants/auth.js";

export const refreshCookieName = env.refreshCookieName ?? REFRESH_COOKIE_DEFAULT_NAME;

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSameSite === "none" ? true : env.isProduction,
    sameSite: env.cookieSameSite,
    path: `${env.apiPrefix}/auth`,
    maxAge: env.refreshCookieMaxAgeMs
  };
}
