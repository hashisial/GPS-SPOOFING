import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { PageTransition } from "../../components/animations/MotionPrimitives.jsx";

export function AuthLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,183,255,0.18),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_24rem),var(--background)] px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
