import { useEffect, useMemo, useState } from "react";
import {
  AnimatedButton,
  AnimatedInput,
  AnimatedItem,
  MotionModal
} from "../animations/MotionPrimitives.jsx";
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
    <MotionModal className="w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-xs sm:tracking-[0.24em]">
              Device Management
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[var(--text-primary)] sm:text-2xl">{title}</h2>
          </div>
          <AnimatedButton
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            Close
          </AnimatedButton>
        </div>

        <form className="max-h-[calc(100vh-9rem)] space-y-5 overflow-y-auto px-4 py-5 sm:max-h-none sm:px-6 sm:py-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Device Name</label>
              <AnimatedInput
                name="deviceName"
                value={form.deviceName}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Device ID</label>
              <AnimatedInput
                name="deviceId"
                value={form.deviceId}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Type</label>
              <AnimatedInput
                as="select"
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
              </AnimatedInput>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Status</label>
              <AnimatedInput
                as="select"
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
              </AnimatedInput>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Owner</label>
              <AnimatedInput
                as="select"
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
              </AnimatedInput>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {isLoadingOwners
                  ? "Loading available owners from the user directory..."
                  : "Assign an active user as the device owner or leave it unassigned."}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Notes</label>
              <AnimatedInput
                as="textarea"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className={`${inputClassName} mt-2 resize-none`}
              />
            </div>
          </div>

          {errorMessage ? (
            <AnimatedItem className="rounded-2xl border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              {errorMessage}
            </AnimatedItem>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <AnimatedButton
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-[linear-gradient(135deg,#1BC2D5,#FFFFFF)] px-5 py-3 text-sm font-semibold text-[#000000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Device"}
            </AnimatedButton>
          </div>
        </form>
    </MotionModal>
  );
}
