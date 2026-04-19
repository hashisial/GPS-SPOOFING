import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import uiReducer from "./slices/uiSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer
  }
});

export const selectAuthState = (state) => state.auth;
export const selectUiState = (state) => state.ui;
export const selectTheme = (state) => state.ui.theme;
