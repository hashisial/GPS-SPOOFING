import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import { PageTransition } from "../../components/animations/MotionPrimitives.jsx";

export function AppLayout() {
  const location = useLocation();

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </AnimatePresence>
    </AppShell>
  );
}
