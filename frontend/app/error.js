"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-6 text-text-primary">
      <div className="panel max-w-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-danger/12 text-danger">
          <AlertTriangle size={24} />
        </div>
        <p className="eyebrow mt-6">System Recovery</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">
          A runtime fault interrupted the dashboard.
        </h1>
        <p className="mt-4 text-sm leading-7 text-text-muted">
          The application caught the error safely. You can retry the current view or
          return to the secure home surface.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="primary-button" onClick={reset} type="button">
            <RefreshCcw size={16} />
            Retry view
          </button>
          <Link className="secondary-button" href="/">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}

