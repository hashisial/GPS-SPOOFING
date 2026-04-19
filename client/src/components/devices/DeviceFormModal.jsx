import { useEffect, useMemo, useState } from "react";
import { DEVICE_STATUSES, DEVICE_TYPES } from "./device-ui.js";

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]";

const emptyForm = {
  deviceName: "",
  deviceId: "",
  type: "TRACKER",
  owner: "",
  status: "OFFLINE",
  notes: ""
};

export function DeviceFormModal({
  mode,
  device,
  isOpen,
  isSubmitting,
  ownerOptions,
  isLoadingOwners,
  errorMessage,
  onClose,
  onSubmit
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (device) {
      setForm({
        deviceName: device.deviceName ?? "",
        deviceId: device.deviceId ?? "",
        type: device.type ?? "TRACKER",
        owner: device.owner?.id ?? device.owner?._id ?? "",
        status: device.status ?? "OFFLINE",
        notes: device.notes ?? ""
      });
      return;
    }

    setForm(emptyForm);
  }, [device, isOpen]);

  const title = useMemo(() => (mode === "edit" ? "Edit Device" : "Add Device"), [mode]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await onSubmit({
      deviceName: form.deviceName.trim(),
      deviceId: form.deviceId.trim(),
      type: form.type,
      status: form.status,
      notes: form.notes.trim() || null,
      owner: form.owner || null
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur">
      <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Device Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Device Name</label>
              <input
                name="deviceName"
                value={form.deviceName}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Device ID</label>
              <input
                name="deviceId"
                value={form.deviceId}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
              >
                {DEVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
              >
                {DEVICE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Owner</label>
              <select
                name="owner"
                value={form.owner}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                disabled={isLoadingOwners}
              >
                <option value="">Unassigned</option>
                {ownerOptions.map((user) => (
                  <option key={user.id ?? user._id} value={user.id ?? user._id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {isLoadingOwners
                  ? "Loading available owners from the user directory..."
                  : "Assign an active user as the device owner or leave it unassigned."}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className={`${inputClassName} mt-2 resize-none`}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-4 py-3 text-sm text-[#FFB3B3]">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#0ea5e9)] px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
