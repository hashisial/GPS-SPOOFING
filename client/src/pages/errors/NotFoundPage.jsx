import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../routes/route-paths.js";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-10 text-[var(--text-primary)]">
      <div className="max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--background-elevated)] p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Not Found
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Route not available in this client shell</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          The requested page does not exist in the current frontend architecture scaffold.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard}
          className="mt-6 inline-flex rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
