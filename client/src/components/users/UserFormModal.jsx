import { useEffect, useMemo, useState } from "react";
import { APP_ROLES } from "../../utils/constants/app.constants.js";

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]";

const emptyForm = {
  name: "",
  email: "",
  role: APP_ROLES.VIEWER,
  password: ""
};

export function UserFormModal({
  mode,
  user,
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? APP_ROLES.VIEWER,
        password: ""
      });
      return;
    }

    setForm(emptyForm);
  }, [isOpen, user]);

  const title = useMemo(() => (mode === "edit" ? "Edit User" : "Create User"), [mode]);

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

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role
    };

    if (mode === "create" || form.password.trim()) {
      payload.password = form.password;
    }

    await onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 px-3 py-4 backdrop-blur sm:items-center sm:px-4 sm:py-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-xs sm:tracking-[0.24em]">
              User Management
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[var(--text-primary)] sm:text-2xl">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </div>

        <form className="max-h-[calc(100vh-9rem)] space-y-5 overflow-y-auto px-4 py-5 sm:max-h-none sm:px-6 sm:py-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                minLength={2}
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
              >
                {Object.values(APP_ROLES).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {mode === "edit" ? "New Password" : "Password"}
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className={`${inputClassName} mt-2`}
                minLength={8}
                placeholder={mode === "edit" ? "Leave blank to keep current password" : ""}
                required={mode === "create"}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-4 py-3 text-sm text-[#FFB3B3]">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
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
              className="rounded-2xl bg-[linear-gradient(135deg,#00FFC6,#74FBE0)] px-5 py-3 text-sm font-semibold text-[#041018] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
