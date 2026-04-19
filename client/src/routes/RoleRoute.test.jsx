// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import authReducer from "../app/store/slices/authSlice.js";
import uiReducer from "../app/store/slices/uiSlice.js";
import { RoleRoute } from "./RoleRoute.jsx";

function renderRoleRoute(role) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer
    },
    preloadedState: {
      auth: {
        session: {
          accessToken: "token",
          user: {
            id: "user-1",
            role
          },
          rememberMe: true
        },
        accessToken: "token",
        user: {
          id: "user-1",
          role
        },
        role,
        rememberMe: true,
        isAuthenticated: true,
        isBootstrapping: false
      },
      ui: {
        theme: "dark",
        sidebarOpen: true
      }
    }
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path="/users" element={<div>Users Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("RoleRoute", () => {
  it("redirects unauthorized users to the dashboard", () => {
    renderRoleRoute("VIEWER");

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  it("renders the protected role route for authorized users", () => {
    renderRoleRoute("SUPER_ADMIN");

    expect(screen.getByText("Users Page")).toBeInTheDocument();
  });
});
