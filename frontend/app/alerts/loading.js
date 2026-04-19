import { SiteShell } from "@/components/layout/site-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsLoading() {
  return (
    <SiteShell
      eyebrow="Incident Monitoring"
      loading
      session={null}
      subtitle="Loading alert queue."
      title="Alerts"
    >
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-[2rem]" />
        <Skeleton className="h-[460px] rounded-[2rem]" />
      </div>
    </SiteShell>
  );
}
