import { createSlice } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "../../../utils/constants/app.constants.js";

function readStoredTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem(STORAGE_KEYS.theme) ?? "dark";
}

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: readStoredTheme(),
    sidebarOpen: true
  },
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    }
  }
});

export const { setTheme, toggleTheme, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
