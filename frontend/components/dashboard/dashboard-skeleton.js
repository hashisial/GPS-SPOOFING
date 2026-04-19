import { SiteShell } from "@/components/layout/site-shell";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <SiteShell
      eyebrow="Realtime Mission Intelligence"
      loading
      session={null}
      subtitle="Loading protected telemetry and visual layers."
      title="Futuristic GPS spoofing defense dashboard"
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-7">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="mt-6 h-12 w-4/5" />
          <Skeleton className="mt-3 h-6 w-3/5" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-36 rounded-[2rem]" />
          <Skeleton className="h-36 rounded-[2rem]" />
          <Skeleton className="h-36 rounded-[2rem]" />
          <Skeleton className="h-36 rounded-[2rem]" />
        </div>
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Skeleton className="h-[470px] rounded-[2rem]" />
        <Skeleton className="h-[470px] rounded-[2rem]" />
      </div>
    </SiteShell>
  );
}
