import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authService } from "../../services/auth/auth.service.js";
import { setSession } from "../../app/store/slices/authSlice.js";
import { setTheme } from "../../app/store/slices/uiSlice.js";
import { persistSession } from "../../utils/helpers/auth-storage.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTE_PATHS } from "../../routes/route-paths.js";

function extractApiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to reset the password right now."
  );
}

export function ResetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [values, setValues] = useState({
    token: initialToken,
    password: "",
    confirmPassword: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (isBootstrapping) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--background-elevated)] px-8 py-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Session Check
          </div>
          <div className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
            Restoring your secure session...
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.dashboard} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: value
    }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await authService.resetPassword({
        token: values.token.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword
      });

      const session = {
        accessToken: response.data.accessToken,
        user: response.data.user
      };

      persistSession(session, true);
      dispatch(setTheme(response.data.user?.preferences?.theme ?? "dark"));
      dispatch(
        setSession({
          ...session,
          rememberMe: true
        })
      );

      setSuccessMessage("Password reset successful. Redirecting to the dashboard...");
      window.setTimeout(() => {
        navigate(ROUTE_PATHS.dashboard, { replace: true });
      }, 1200);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--background-elevated)] p-6 shadow-2xl backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
          Credential Recovery
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
          Reset password
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Enter the reset token from your recovery link and choose a new secure password for your workspace account.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)]">Reset Token</label>
            <input
              name="token"
              value={values.token}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">New Password</label>
              <input
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                minLength={8}
                required
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-[#1BC2D5]/20 bg-[#1BC2D5]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <a
              href={ROUTE_PATHS.login}
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Back to Login
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-[#1BC2D5] px-5 py-3 text-sm font-semibold text-[#000000] shadow-[0_0_24px_rgba(27,194,213,0.24)] transition hover:bg-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
