import { Provider, useDispatch, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { AppRouter } from "../../routes/AppRouter.jsx";
import { selectAuthState, selectTheme, store } from "../store/index.js";
import { STORAGE_KEYS } from "../../utils/constants/app.constants.js";
import { authService } from "../../services/auth/auth.service.js";
import {
  clearStoredSession,
  persistSession,
  readStoredSession
} from "../../utils/helpers/auth-storage.js";
import {
  clearSession,
  setBootstrapping,
  setSession
} from "../store/slices/authSlice.js";
import { setTheme } from "../store/slices/uiSlice.js";

function ThemeSync() {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  return null;
}

function AuthBootstrap() {
  const dispatch = useDispatch();
  const authState = useSelector(selectAuthState);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      const storedSession = readStoredSession();

      try {
        if (storedSession?.accessToken) {
          const response = await authService.getCurrentUser();
          const accessToken =
            readStoredSession()?.accessToken ?? storedSession.accessToken;
          const nextSession = {
            accessToken,
            user: response.data.user
          };

          persistSession(nextSession, Boolean(storedSession.rememberMe));

          if (isMounted) {
            dispatch(setTheme(response.data.user?.preferences?.theme ?? "dark"));
            dispatch(
              setSession({
                ...nextSession,
                rememberMe: Boolean(storedSession.rememberMe)
              })
            );
          }

          return;
        }

        const response = await authService.refreshSession();
        const rememberMe = Boolean(storedSession?.rememberMe);
        const nextSession = {
          accessToken: response.data.accessToken,
          user: response.data.user
        };

        persistSession(nextSession, rememberMe);

        if (isMounted) {
          dispatch(setTheme(response.data.user?.preferences?.theme ?? "dark"));
          dispatch(
            setSession({
              ...nextSession,
              rememberMe
            })
          );
        }
      } catch {
        clearStoredSession();

        if (isMounted) {
          dispatch(clearSession());
        }
      } finally {
        if (isMounted) {
          dispatch(setBootstrapping(false));
        }
      }
    }

    if (authState.isBootstrapping) {
      bootstrapSession();
    }

    return () => {
      isMounted = false;
    };
  }, [authState.isBootstrapping, dispatch]);

  return null;
}

export function AppProviders() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthBootstrap />
        <ThemeSync />
        <AppRouter />
      </BrowserRouter>
    </Provider>
  );
}
