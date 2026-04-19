const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

export function LoginFormCard({
  values,
  showPassword,
  isSubmitting,
  isResettingPassword,
  errorMessage,
  forgotPasswordMessage,
  forgotPasswordResetUrl,
  onChange,
  onToggleRememberMe,
  onTogglePassword,
  onSubmit,
  onForgotPassword
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--background-elevated)] p-6 shadow-2xl backdrop-blur sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
        Authenticated Access
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
        Sign in to the control room
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        Use your operator credentials to access device telemetry, alerts, reports, and administration modules.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={onChange}
            placeholder="operator@company.com"
            className={inputClassName}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isResettingPassword}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:opacity-80 disabled:opacity-50"
            >
              {isResettingPassword ? "Sending..." : "Forgot password?"}
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={values.password}
              onChange={onChange}
              placeholder="Enter your password"
              className={`${inputClassName} pr-24`}
              required
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-2 right-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={values.rememberMe}
            onChange={onToggleRememberMe}
            className="h-4 w-4 rounded border-[var(--border)] bg-transparent accent-[var(--accent)]"
          />
          <span>Remember me on this device</span>
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-4 py-3 text-sm text-[#FFB3B3]">
            {errorMessage}
          </div>
        ) : null}

        {forgotPasswordMessage ? (
          <div className="rounded-2xl border border-[#00FFC6]/25 bg-[#00FFC6]/10 px-4 py-3 text-sm text-[#B8FFF0]">
            <div>{forgotPasswordMessage}</div>
            {forgotPasswordResetUrl ? (
              <a
                href={forgotPasswordResetUrl}
                className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFC6] underline underline-offset-4"
              >
                Open reset page
              </a>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-[linear-gradient(135deg,#00FFC6,#74FBE0)] px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#041018] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Authenticating..." : "Enter dashboard"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          Secure Session Notes
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
          <li>Sessions use JWT access tokens with refresh-cookie support from the backend.</li>
          <li>Remember me stores the session in persistent browser storage.</li>
          <li>Forgot password uses the backend recovery API with the current email field.</li>
        </ul>
      </div>
    </section>
  );
}
