import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-6 text-text-primary">
      <div className="panel max-w-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-signal/12 text-signal">
          <Compass size={24} />
        </div>
        <p className="eyebrow mt-6">Navigation Error</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">
          That route is outside the mission map.
        </h1>
        <p className="mt-4 text-sm leading-7 text-text-muted">
          The page you requested does not exist or is no longer part of the secure
          operations console.
        </p>
        <div className="mt-6">
          <Link className="primary-button" href="/">
            Return to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

