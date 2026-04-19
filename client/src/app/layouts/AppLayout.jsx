import { Outlet } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";

export function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
