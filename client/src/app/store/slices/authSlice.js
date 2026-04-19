import { createSlice } from "@reduxjs/toolkit";
import { readStoredSession } from "../../../utils/helpers/auth-storage.js";

const storedSession = readStoredSession();

const initialState = {
  session: storedSession,
  accessToken: storedSession?.accessToken ?? null,
  user: storedSession?.user ?? null,
  role: storedSession?.user?.role ?? null,
  rememberMe: Boolean(storedSession?.rememberMe),
  isAuthenticated: Boolean(storedSession?.accessToken && storedSession?.user),
  isBootstrapping: true
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action) {
      const session = action.payload;
      state.session = session;
      state.accessToken = session?.accessToken ?? null;
      state.user = session?.user ?? null;
      state.role = session?.user?.role ?? null;
      state.rememberMe = Boolean(session?.rememberMe);
      state.isAuthenticated = Boolean(session?.accessToken && session?.user);
      state.isBootstrapping = false;
    },
    clearSession(state) {
      state.session = null;
      state.accessToken = null;
      state.user = null;
      state.role = null;
      state.rememberMe = false;
      state.isAuthenticated = false;
      state.isBootstrapping = false;
    },
    setBootstrapping(state, action) {
      state.isBootstrapping = action.payload;
    }
  }
});

export const { setSession, clearSession, setBootstrapping } = authSlice.actions;
export default authSlice.reducer;
