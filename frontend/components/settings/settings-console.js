"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Save, SlidersHorizontal, Waves } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useAuthSession } from "@/hooks/useAuthSession";
import { apiRequest } from "@/lib/api";
import {
  mockNotificationPreferences,
  mockSystemSettings
} from "@/lib/mock-data";

function MetricCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <motion.article whileHover={{ y: -3 }} className="monitor-kpi">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-text-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-wide">{value}</p>
          <p className="mt-3 text-sm text-text-muted">{hint}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </motion.article>
  );
}

function PreviewNotice({ children }) {
  return (
    <div className="monitor-panel mb-6 border-signal/20 bg-signal/10 px-4 py-3 text-sm text-text-primary">
      {children}
    </div>
  );
}

export function SettingsConsole() {
  const { session, loading: authLoading, logout } = useAuthSession();
  const [systemSettings, setSystemSettings] = useState(mockSystemSettings);
  const [notificationSettings, setNotificationSettings] = useState(
    mockNotificationPreferences
  );
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      if (!session?.token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const requests = [
          apiRequest("/settings/notifications", {
            token: session.token
          })
        ];

        if (isAdmin) {
          requests.unshift(
            apiRequest("/settings/system", {
              token: session.token
            })
          );
        }

        const responses = await Promise.all(requests);

        if (!active) {
          return;
        }

        if (isAdmin) {
          setSystemSettings(responses[0].data ?? mockSystemSettings);
          setNotificationSettings(responses[1].data ?? mockNotificationPreferences);
        } else {
          setNotificationSettings(responses[0].data ?? mockNotificationPreferences);
        }

        setPreviewMode(false);
        setMessage("");
      } catch {
        if (!active) {
          return;
        }

        setSystemSettings(mockSystemSettings);
        setNotificationSettings(mockNotificationPreferences);
        setPreviewMode(true);
        setMessage(
          "Preview mode is active. Settings are using local demo values because the secured settings API is currently unavailable."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [isAdmin, session?.token]);

  const enabledNotificationCount = useMemo(
    () =>
      [
        notificationSettings.emailEnabled,
        notificationSettings.smsEnabled,
        notificationSettings.pushEnabled,
        notificationSettings.weeklyDigest
      ].filter(Boolean).length,
    [notificationSettings]
  );

  async function handleSaveSystem(event) {
    event.preventDefault();
    setSavingSystem(true);
    setMessage("");

    try {
      if (previewMode) {
        setMessage("Preview mode: system thresholds saved locally.");
      } else {
        await apiRequest("/settings/system", {
          method: "PUT",
          token: session.token,
          body: JSON.stringify(systemSettings)
        });
        setMessage("System thresholds saved.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingSystem(false);
    }
  }

  async function handleSaveNotifications(event) {
    event.preventDefault();
    setSavingNotifications(true);
    setMessage("");

    try {
      if (previewMode) {
        setMessage("Preview mode: notification preferences saved locally.");
      } else {
        await apiRequest("/settings/notifications", {
          method: "PUT",
          token: session.token,
          body: JSON.stringify(notificationSettings)
        });
        setMessage("Notification preferences saved.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingNotifications(false);
    }
  }

  if (authLoading) {
    return (
      <SiteShell
        eyebrow="Thresholds and Notifications"
        loading
        onLogout={logout}
        session={session}
        subtitle="Restoring secure settings context."
        title="Settings"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[440px] rounded-[2rem]" />
          <Skeleton className="h-[440px] rounded-[2rem]" />
        </div>
      </SiteShell>
    );
  }

  if (!session?.token) {
    return (
      <SiteShell
        eyebrow="Thresholds and Notifications"
        loading={false}
        onLogout={logout}
        session={session}
        subtitle="A secure session is required to manage thresholds and notifications."
        title="Settings"
      >
        <EmptyState
          action={<Link className="primary-button" href="/login">Login</Link>}
          description="Sign in to manage alert thresholds, notification channels, and secure delivery preferences."
          title="Authentication required"
        />
      </SiteShell>
    );
  }

  return (
    <SiteShell
      eyebrow="Thresholds and Notifications"
      loading={false}
      onLogout={logout}
      session={session}
      subtitle="Tune spoofing thresholds, choose notification channels, and shape how the operations team gets alerted in the live control surface."
      title="Settings"
    >
      {previewMode ? (
        <PreviewNotice>
          The settings console is running in preview mode, so changes are stored locally until the backend settings service becomes available.
        </PreviewNotice>
      ) : null}

      {message ? (
        <div className="monitor-panel mb-6 px-4 py-3 text-sm text-text-primary">{message}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          hint="Current confidence score required to escalate spoofing."
          icon={SlidersHorizontal}
          label="Confidence"
          tone="bg-accent/15 text-accent"
          value={`${systemSettings.confidenceThreshold}%`}
        />
        <MetricCard
          hint="Allowed drift before the route is considered suspect."
          icon={Waves}
          label="Drift Limit"
          tone="bg-signal/15 text-signal"
          value={`${systemSettings.driftThresholdMeters}m`}
        />
        <MetricCard
          hint="Notification channels currently enabled for this operator."
          icon={BellRing}
          label="Channels"
          tone="bg-success/15 text-success"
          value={enabledNotificationCount}
        />
        <MetricCard
          hint="Heading delta tolerance applied by the rules engine."
          icon={SlidersHorizontal}
          label="Heading Delta"
          tone="bg-danger/15 text-danger"
          value={`${systemSettings.headingThresholdDegrees}deg`}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.section whileHover={{ y: -3 }} className="monitor-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent/15 p-3 text-accent">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <p className="eyebrow">Threshold Configuration</p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-wide">
                Detection policy
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
            </div>
          ) : isAdmin ? (
            <form className="mt-6 space-y-4" onSubmit={handleSaveSystem}>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm text-text-muted">Confidence threshold</span>
                  <input
                    className="field"
                    onChange={(event) =>
                      setSystemSettings((current) => ({
                        ...current,
                        confidenceThreshold: event.target.value
                      }))
                    }
                    type="number"
                    value={systemSettings.confidenceThreshold}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-text-muted">Drift threshold (m)</span>
                  <input
                    className="field"
                    onChange={(event) =>
                      setSystemSettings((current) => ({
                        ...current,
                        driftThresholdMeters: event.target.value
                      }))
                    }
                    type="number"
                    value={systemSettings.driftThresholdMeters}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-text-muted">Heading threshold (deg)</span>
                  <input
                    className="field"
                    onChange={(event) =>
                      setSystemSettings((current) => ({
                        ...current,
                        headingThresholdDegrees: event.target.value
                      }))
                    }
                    type="number"
                    value={systemSettings.headingThresholdDegrees}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <ToggleSwitch
                  checked={Boolean(systemSettings.emailNotificationsEnabled)}
                  description="Allow system-wide email alert delivery."
                  label="Global email notifications"
                  onChange={(checked) =>
                    setSystemSettings((current) => ({
                      ...current,
                      emailNotificationsEnabled: checked
                    }))
                  }
                />
                <ToggleSwitch
                  checked={Boolean(systemSettings.smsNotificationsEnabled)}
                  description="Allow system-wide SMS escalation."
                  label="Global SMS notifications"
                  onChange={(checked) =>
                    setSystemSettings((current) => ({
                      ...current,
                      smsNotificationsEnabled: checked
                    }))
                  }
                />
                <ToggleSwitch
                  checked={Boolean(systemSettings.webhookNotificationsEnabled)}
                  description="Forward anomaly events to downstream response tooling."
                  label="Webhook delivery"
                  onChange={(checked) =>
                    setSystemSettings((current) => ({
                      ...current,
                      webhookNotificationsEnabled: checked
                    }))
                  }
                />
                <input
                  className="field"
                  onChange={(event) =>
                    setSystemSettings((current) => ({
                      ...current,
                      webhookUrl: event.target.value
                    }))
                  }
                  placeholder="https://hooks.example.com/gps"
                  value={systemSettings.webhookUrl || ""}
                />
              </div>

              <button className="primary-button" disabled={savingSystem} type="submit">
                <Save size={16} />
                {savingSystem ? "Saving..." : "Save thresholds"}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-3 rounded-[1.5rem] border border-line/15 bg-surface/55 p-5 text-sm text-text-muted">
              <p>
                Threshold controls are restricted to administrators. Your account can still
                manage personal notification preferences.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="monitor-badge">
                  Confidence: <span className="text-text-primary">{systemSettings.confidenceThreshold}%</span>
                </span>
                <span className="monitor-badge">
                  Drift: <span className="text-text-primary">{systemSettings.driftThresholdMeters}m</span>
                </span>
                <span className="monitor-badge">
                  Heading: <span className="text-text-primary">{systemSettings.headingThresholdDegrees}deg</span>
                </span>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section whileHover={{ y: -3 }} className="monitor-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-signal/15 p-3 text-signal">
              <BellRing size={18} />
            </div>
            <div>
              <p className="eyebrow">Notification Preferences</p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-wide">
                Personal delivery rules
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              <Skeleton className="h-20 rounded-3xl" />
              <Skeleton className="h-20 rounded-3xl" />
              <Skeleton className="h-20 rounded-3xl" />
            </div>
          ) : (
            <form className="mt-6 space-y-3" onSubmit={handleSaveNotifications}>
              <ToggleSwitch
                checked={Boolean(notificationSettings.emailEnabled)}
                description="Receive incident alerts in email."
                label="Email alerts"
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    emailEnabled: checked
                  }))
                }
              />
              <ToggleSwitch
                checked={Boolean(notificationSettings.smsEnabled)}
                description="Receive SMS escalations for urgent detections."
                label="SMS alerts"
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    smsEnabled: checked
                  }))
                }
              />
              <ToggleSwitch
                checked={Boolean(notificationSettings.pushEnabled)}
                description="Send in-app alerts into the realtime dashboard."
                label="In-app alerts"
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    pushEnabled: checked
                  }))
                }
              />
              <ToggleSwitch
                checked={Boolean(notificationSettings.weeklyDigest)}
                description="Receive a weekly operational digest."
                label="Weekly digest"
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    weeklyDigest: checked
                  }))
                }
              />
              <ToggleSwitch
                checked={Boolean(notificationSettings.criticalOnly)}
                description="Only notify on high-risk and critical anomalies."
                label="Critical only"
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    criticalOnly: checked
                  }))
                }
              />

              <label className="block space-y-2">
                <span className="text-sm text-text-muted">Preferred email</span>
                <input
                  className="field"
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      preferredEmail: event.target.value
                    }))
                  }
                  type="email"
                  value={notificationSettings.preferredEmail || ""}
                />
              </label>

              <button className="primary-button" disabled={savingNotifications} type="submit">
                <Save size={16} />
                {savingNotifications ? "Saving..." : "Save preferences"}
              </button>
            </form>
          )}
        </motion.section>
      </div>
    </SiteShell>
  );
}
