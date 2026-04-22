import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { settingsService } from "../../services/settings/settings.service.js";
import { setTheme } from "../../app/store/slices/uiSlice.js";
import { APP_ROLES } from "../../utils/constants/app.constants.js";

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load settings right now."
  );
}

const emptySettings = {
  theme: "dark",
  notifications: {
    emailAlerts: true,
    inAppAlerts: true,
    soundAlerts: true,
    digestFrequency: "DAILY"
  },
  thresholds: {
    jumpDistanceKm: 1.5,
    unrealisticSpeedKph: 280,
    signalAnomalyScore: 40,
    accuracyThresholdM: 50
  }
};

export function SettingsPage() {
  const dispatch = useDispatch();
  const { role } = useAuth();
  const canEditThresholds =
    role === APP_ROLES.SUPER_ADMIN || role === APP_ROLES.SECURITY_ANALYST;
  const [form, setForm] = useState(emptySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadSettings() {
      try {
        const response = await settingsService.get();

        if (!isMounted) {
          return;
        }

        setForm(response.data.settings);
        dispatch(setTheme(response.data.settings.theme ?? "dark"));
        setErrorMessage("");
      } catch (error) {
        if (isMounted) {
          setErrorMessage(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await settingsService.update({
        theme: form.theme,
        notifications: form.notifications,
        ...(canEditThresholds
          ? {
              thresholds: {
                jumpDistanceKm: Number(form.thresholds.jumpDistanceKm),
                unrealisticSpeedKph: Number(form.thresholds.unrealisticSpeedKph),
                signalAnomalyScore: Number(form.thresholds.signalAnomalyScore),
                accuracyThresholdM: Number(form.thresholds.accuracyThresholdM)
              }
            }
          : {})
      });

      setForm(response.data.settings);
      dispatch(setTheme(response.data.settings.theme));
      setSuccessMessage("Settings saved successfully.");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Configuration"
        title="Settings"
        description="Manage notification preferences, visual theme, and detection threshold values backed by the authenticated settings API."
      />

      {errorMessage ? (
        <div className="rounded-[1.75rem] border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-5 py-4 text-sm text-[var(--text-primary)]">
          {errorMessage}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <PanelCard
            eyebrow="Appearance"
            title="Workspace preferences"
            description="Persist the signed-in user theme and notification channels through the backend settings service."
          >
            {isLoading ? (
              <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
                Loading settings...
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">Theme</label>
                  <select
                    value={form.theme}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        theme: event.target.value
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                <div className="grid gap-3">
                  {[
                    ["emailAlerts", "Email alerts"],
                    ["inAppAlerts", "In-app alerts"],
                    ["soundAlerts", "Sound notifications"]
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)]"
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form.notifications[key])}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            notifications: {
                              ...current.notifications,
                              [key]: event.target.checked
                            }
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Report Digest Frequency
                  </label>
                  <select
                    value={form.notifications.digestFrequency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notifications: {
                          ...current.notifications,
                          digestFrequency: event.target.value
                        }
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                  >
                    <option value="OFF">Off</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
              </div>
            )}
          </PanelCard>

        <PanelCard
          eyebrow="Detection Thresholds"
          title="Risk tuning"
          description="Adjust the saved threshold values used by the detection engine. Threshold updates are limited to elevated analyst roles."
        >
          {isLoading ? (
            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
              Loading thresholds...
            </div>
          ) : (
            <div className="space-y-4">
              {!canEditThresholds ? (
                <div className="rounded-2xl border border-[#145052]/25 bg-[#145052]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                  Threshold changes are restricted to Super Admin and Security Analyst accounts. You can still review the active detection values.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["jumpDistanceKm", "Jump Distance (km)"],
                  ["unrealisticSpeedKph", "Unrealistic Speed (km/h)"],
                  ["signalAnomalyScore", "Alert Trigger Score"],
                  ["accuracyThresholdM", "Accuracy Threshold (m)"]
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={key === "jumpDistanceKm" ? "0.1" : "1"}
                      value={form.thresholds[key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          thresholds: {
                            ...current.thresholds,
                            [key]: event.target.value
                          }
                        }))
                      }
                      disabled={!canEditThresholds}
                      className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-[var(--accent)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </PanelCard>
        </div>

        {successMessage ? (
          <div className="rounded-[1.75rem] border border-[#1BC2D5]/20 bg-[#1BC2D5]/10 px-5 py-4 text-sm text-[var(--text-primary)]">
            {successMessage}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="rounded-2xl bg-[#1BC2D5] px-5 py-3 text-sm font-semibold text-[#000000] shadow-[0_0_24px_rgba(27,194,213,0.24)] transition hover:bg-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
