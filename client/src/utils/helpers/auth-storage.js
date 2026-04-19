import { STORAGE_KEYS } from "../constants/app.constants.js";

function safeRead(storage) {
  try {
    return storage.getItem(STORAGE_KEYS.authSession);
  } catch {
    return null;
  }
}

function safeWrite(storage, value) {
  try {
    storage.setItem(STORAGE_KEYS.authSession, JSON.stringify(value));
  } catch {
    // Ignore storage errors in UI scaffolding mode.
  }
}

function safeRemove(storage) {
  try {
    storage.removeItem(STORAGE_KEYS.authSession);
  } catch {
    // Ignore storage errors in UI scaffolding mode.
  }
}

export function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const localValue = safeRead(window.localStorage);

  if (localValue) {
    try {
      return JSON.parse(localValue);
    } catch {
      safeRemove(window.localStorage);
    }
  }

  const sessionValue = safeRead(window.sessionStorage);

  if (sessionValue) {
    try {
      return JSON.parse(sessionValue);
    } catch {
      safeRemove(window.sessionStorage);
    }
  }

  return null;
}

export function persistSession(session, rememberMe = true) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedSession = {
    ...session,
    rememberMe
  };

  safeRemove(window.localStorage);
  safeRemove(window.sessionStorage);

  if (rememberMe) {
    safeWrite(window.localStorage, normalizedSession);
    return;
  }

  safeWrite(window.sessionStorage, normalizedSession);
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  safeRemove(window.localStorage);
  safeRemove(window.sessionStorage);
}
