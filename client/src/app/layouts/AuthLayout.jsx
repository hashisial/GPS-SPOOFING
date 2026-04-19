import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24rem),var(--background)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center">
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
