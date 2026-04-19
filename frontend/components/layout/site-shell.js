"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BellRing,
  Cog,
  History,
  LayoutDashboard,
  LogOut,
  Radar,
  Shield,
  ShieldAlert,
  Users
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const BackgroundScene = dynamic(
  () => import("./background-scene").then((module) => module.BackgroundScene),
  { ssr: false }
);

const navigationGroups = [
  {
    title: "Main",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard
      },
      {
        href: "/detections",
        label: "Detection",
        icon: Radar
      },
      {
        href: "/alerts",
        label: "Alerts",
        icon: ShieldAlert
      },
      {
        href: "/history",
        label: "History",
        icon: History
      }
    ]
  },
  {
    title: "Control",
    items: [
      {
        href: "/admin",
        label: "Admin",
        icon: Users
      },
      {
        href: "/settings",
        label: "Settings",
        icon: Cog
      }
    ]
  }
];

function isActivePath(pathname, href) {
  return href === "/" ? pathname === "/" : pathname?.startsWith(href);
}

function SidebarLink({ href, label, icon: Icon, active }) {
  return (
    <Link
      href={href}
      className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
    >
      <span className="sidebar-link-icon">
        <Icon size={16} />
      </span>
      <span>{label}</span>
    </Link>
  );
}

export function SiteShell({
  session,
  loading,
  title,
  eyebrow,
  subtitle,
  actions,
  children,
  onLogout
}) {
  const pathname = usePathname();

  return (
    <main className="relative min-h-screen overflow-hidden bg-app text-text-primary">
      <BackgroundScene />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(86,199,255,0.12),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(255,194,92,0.08),_transparent_24%)]" />
      <div className="absolute inset-0 bg-grid-fade bg-[size:42px_42px] opacity-[0.05]" />

      <div className="relative flex min-h-screen">
        <aside className="hidden w-[17rem] shrink-0 flex-col border-r border-line/10 bg-[#07152f]/90 px-4 py-5 backdrop-blur-2xl xl:flex">
          <div className="flex items-center gap-4 rounded-[1.35rem] border border-line/15 bg-surface/60 px-4 py-4 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(86,199,255,0.28),rgba(31,78,165,0.84))] text-white shadow-[0_12px_30px_rgba(22,75,165,0.28)]">
              <Shield size={22} />
            </div>
            <div>
              <p className="eyebrow text-[0.62rem]">GPS Shield</p>
              <h1 className="font-display text-xl font-semibold tracking-wide">
                Monitoring Console
              </h1>
              <p className="mt-1 text-xs text-text-muted">Real-time GPS spoofing monitor</p>
            </div>
          </div>

          <div className="mt-8 flex-1 space-y-7">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-[0.62rem] uppercase tracking-[0.34em] text-text-muted/75">
                  {group.title}
                </p>
                <div className="mt-3 space-y-1.5">
                  {group.items.map((item) => (
                    <SidebarLink
                      key={item.href}
                      active={isActivePath(pathname, item.href)}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.25rem] border border-line/15 bg-surface/55 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-signal/15 text-signal">
                  <BellRing size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {session?.user?.name ?? "Guest preview"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {session?.user?.role ?? "Demo access"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {session?.user ? (
                <button className="ghost-button flex-1" onClick={onLogout} type="button">
                  <LogOut size={16} />
                  Sign out
                </button>
              ) : loading ? (
                <span className="chip flex-1 justify-center">Restoring session...</span>
              ) : (
                <Link href="/login" className="primary-button flex-1 justify-center">
                  Secure Login
                </Link>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-line/10 bg-[#071429]/82 px-4 py-4 backdrop-blur-2xl sm:px-6 xl:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 xl:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(86,199,255,0.24),rgba(31,78,165,0.82))] text-white">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="eyebrow text-[0.6rem]">GPS Shield</p>
                    <p className="font-display text-lg">Monitoring Console</p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 xl:flex">
                  <span className="chip">
                    Signal Mesh: <span className="text-signal">Online</span>
                  </span>
                  <span className="chip">
                    Mode: <span className="text-text-primary">Adaptive</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ThemeToggle />
                  {session?.user ? (
                    <>
                      <span className="chip">
                        {session.user.name} - {session.user.role}
                      </span>
                      <button className="ghost-button xl:hidden" onClick={onLogout} type="button">
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </>
                  ) : loading ? (
                    <span className="chip">Restoring session...</span>
                  ) : (
                    <Link href="/login" className="primary-button px-4 py-2.5 xl:hidden">
                      Secure Login
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 xl:hidden">
                {navigationGroups.flatMap((group) => group.items).map((item) => (
                  <SidebarLink
                    key={item.href}
                    active={isActivePath(pathname, item.href)}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-5 sm:px-6 xl:px-8 xl:py-7">
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 14 }}
              className="monitor-panel px-5 py-5 sm:px-6"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <p className="eyebrow">{eyebrow}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-wide sm:text-4xl">
                    {title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-text-muted sm:text-base">
                    {subtitle}
                  </p>
                </div>
                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
              </div>
            </motion.section>

            <section className="mt-6">{children}</section>
          </div>
        </div>
      </div>
    </main>
  );
}
