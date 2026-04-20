import { useEffect, useMemo, useState } from "react";
import { AlertBadge } from "./AlertBadge.jsx";
import { canActOnAlert, formatAlertDate } from "./alert-ui.js";

function Section({ title, children }) {
  return (
    <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]";

export function AlertDetailsModal({
  alert,
  isOpen,
  isLoading,
  errorMessage,
  canManageAlerts,
  preferredAction,
  actionState,
  onClose,
  onResolve,
  onFalsePositive
}) {
  const [resolveNote, setResolveNote] = useState("");
  const [falsePositiveReason, setFalsePositiveReason] = useState("");

  useEffect(() => {
    setResolveNote("");
    setFalsePositiveReason("");
  }, [alert?.id, isOpen]);

  const actionHint = useMemo(() => {
    if (preferredAction === "resolve") {
      return "Resolution workflow ready. Add an optional note and resolve the alert.";
    }

    if (preferredAction === "falsePositive") {
      return "False positive workflow ready. Provide a reason before submitting.";
    }

    return null;
  }, [preferredAction]);

  if (!isOpen) {
    return null;
  }

  const actionable = canManageAlerts && canActOnAlert(alert);

  async function handleResolve() {
    const success = await onResolve(resolveNote);

    if (success) {
      setResolveNote("");
    }
  }

  async function handleFalsePositive() {
    const success = await onFalsePositive(falsePositiveReason);

    if (success) {
      setFalsePositiveReason("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 px-3 py-4 backdrop-blur sm:items-center sm:px-4 sm:py-6">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl sm:max-h-[92vh] sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-xs sm:tracking-[0.24em]">
              Alert Details
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[var(--text-primary)] sm:text-2xl">
              {alert?.title ?? "Loading alert..."}
            </h2>
            {actionHint ? (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{actionHint}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-5 sm:max-h-[calc(92vh-5.5rem)] sm:px-6 sm:py-6">
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
              Loading alert details...
            </div>
          ) : errorMessage ? (
            <div className="rounded-[1.5rem] border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 p-5 text-sm text-[#FFB3B3]">
              {errorMessage}
            </div>
          ) : alert ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <Section title="Overview">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <AlertBadge value={alert.severity} />
                      <AlertBadge variant="status" value={alert.status} />
                    </div>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{alert.message}</p>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          Device
                        </div>
                        <div className="mt-1 font-medium text-[var(--text-primary)]">
                          {alert.deviceName} ({alert.deviceId})
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          Risk Score
                        </div>
                        <div className="mt-1 font-medium text-[var(--text-primary)]">
                          {alert.riskScore}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          Triggered
                        </div>
                        <div className="mt-1 font-medium text-[var(--text-primary)]">
                          {formatAlertDate(alert.triggeredAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          Coordinates
                        </div>
                        <div className="mt-1 font-medium text-[var(--text-primary)]">
                          {alert.coordinates?.latitude}, {alert.coordinates?.longitude}
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Findings">
                  <div className="space-y-3">
                    {(alert.findings ?? []).map((finding) => (
                      <article
                        key={`${finding.rule}-${finding.summary}`}
                        className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)] p-4"
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                          {finding.rule}
                        </div>
                        <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                          {finding.summary}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          Risk {finding.riskScore}
                        </div>
                      </article>
                    ))}
                  </div>
                </Section>
              </div>

              <div className="space-y-4">
                <Section title="Action History">
                  <div className="space-y-3">
                    {(alert.actionHistory ?? []).map((entry, index) => (
                      <div
                        key={`${entry.action}-${entry.timestamp}-${index}`}
                        className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-[var(--text-primary)]">
                            {entry.action}
                          </div>
                          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                            {formatAlertDate(entry.timestamp)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-[var(--text-secondary)]">
                          {entry.note || "No note provided."}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          {entry.actor?.name ?? entry.actorRole ?? "System"}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Workflow Actions">
                  {actionable ? (
                    <div className="space-y-4">
                      <div
                        className={`rounded-[1.25rem] border p-4 ${
                          preferredAction === "resolve"
                            ? "border-[#00FFC6]/20 bg-[#00FFC6]/10"
                            : "border-[var(--border)] bg-[var(--background)]"
                        }`}
                      >
                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                          Resolve Alert
                        </div>
                        <textarea
                          value={resolveNote}
                          onChange={(event) => setResolveNote(event.target.value)}
                          placeholder="Optional resolution note"
                          rows={3}
                          className={`${inputClassName} mt-3 resize-none`}
                        />
                        <button
                          type="button"
                          onClick={handleResolve}
                          disabled={actionState === "resolve"}
                          className="mt-3 rounded-2xl border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-4 py-3 text-sm font-semibold text-[#9DFFEB] transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionState === "resolve" ? "Resolving..." : "Resolve"}
                        </button>
                      </div>

                      <div
                        className={`rounded-[1.25rem] border p-4 ${
                          preferredAction === "falsePositive"
                            ? "border-[#8B949E]/25 bg-[#8B949E]/10"
                            : "border-[var(--border)] bg-[var(--background)]"
                        }`}
                      >
                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                          Mark False Positive
                        </div>
                        <textarea
                          value={falsePositiveReason}
                          onChange={(event) => setFalsePositiveReason(event.target.value)}
                          placeholder="Required reason for marking this alert as false positive"
                          rows={3}
                          className={`${inputClassName} mt-3 resize-none`}
                        />
                        <button
                          type="button"
                          onClick={handleFalsePositive}
                          disabled={actionState === "falsePositive" || falsePositiveReason.trim().length < 3}
                          className="mt-3 rounded-2xl border border-[#8B949E]/25 bg-[#8B949E]/10 px-4 py-3 text-sm font-semibold text-[#C3CBD3] transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionState === "falsePositive" ? "Submitting..." : "Mark False Positive"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--text-secondary)]">
                      This alert is already closed or your role does not allow incident actions.
                    </div>
                  )}
                </Section>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
