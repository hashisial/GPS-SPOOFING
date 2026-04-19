// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import authReducer from "../app/store/slices/authSlice.js";
import uiReducer from "../app/store/slices/uiSlice.js";
import { ProtectedRoute } from "./ProtectedRoute.jsx";

function renderProtectedRoute(authState) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer
    },
    preloadedState: {
      auth: authState,
      ui: {
        theme: "dark",
        sidebarOpen: true
      }
    }
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute({
      session: null,
      accessToken: null,
      user: null,
      role: null,
      rememberMe: false,
      isAuthenticated: false,
      isBootstrapping: false
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders a loading state while auth bootstrap is active", () => {
    renderProtectedRoute({
      session: null,
      accessToken: null,
      user: null,
      role: null,
      rememberMe: false,
      isAuthenticated: false,
      isBootstrapping: true
    });

    expect(screen.getByText("Session Check")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    renderProtectedRoute({
      session: {
        accessToken: "token",
        user: {
          id: "user-1",
          role: "SUPER_ADMIN"
        },
        rememberMe: true
      },
      accessToken: "token",
      user: {
        id: "user-1",
        role: "SUPER_ADMIN"
      },
      role: "SUPER_ADMIN",
      rememberMe: true,
      isAuthenticated: true,
      isBootstrapping: false
    });

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});
