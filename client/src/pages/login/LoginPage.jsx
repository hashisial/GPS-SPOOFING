import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AuthShowcase } from "../../components/auth/AuthShowcase.jsx";
import { LoginFormCard } from "../../components/auth/LoginFormCard.jsx";
import { setSession } from "../../app/store/slices/authSlice.js";
import { setTheme } from "../../app/store/slices/uiSlice.js";
import { authService } from "../../services/auth/auth.service.js";
import { persistSession } from "../../utils/helpers/auth-storage.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTE_PATHS } from "../../routes/route-paths.js";

function extractApiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to complete the request right now."
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const redirectTarget = useMemo(
    () => location.state?.from || ROUTE_PATHS.dashboard,
    [location.state]
  );

  const [values, setValues] = useState({
    email: "",
    password: "",
    rememberMe: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [forgotPasswordResetUrl, setForgotPasswordResetUrl] = useState("");

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
    return <Navigate to={redirectTarget} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: value
    }));
    setErrorMessage("");
    setForgotPasswordMessage("");
    setForgotPasswordResetUrl("");
  }

  function handleToggleRememberMe() {
    setValues((current) => ({
      ...current,
      rememberMe: !current.rememberMe
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setForgotPasswordMessage("");
    setForgotPasswordResetUrl("");

    try {
      const response = await authService.login({
        email: values.email.trim(),
        password: values.password
      });

      const session = {
        accessToken: response.data.accessToken,
        user: response.data.user
      };

      persistSession(session, values.rememberMe);
      dispatch(setTheme(response.data.user?.preferences?.theme ?? "dark"));
      dispatch(
        setSession({
          ...session,
          rememberMe: values.rememberMe
        })
      );

      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setForgotPasswordMessage("");
    setErrorMessage("");
    setForgotPasswordResetUrl("");

    if (!isValidEmail(values.email.trim())) {
      setErrorMessage("Enter a valid email first to request a password reset link.");
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await authService.forgotPassword({
        email: values.email.trim()
      });

      setForgotPasswordMessage(
        response.data?.message ||
          "If the email exists, a password reset flow has been initiated."
      );
      setForgotPasswordResetUrl(response.data?.resetUrl ?? "");
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-10rem] h-72 w-72 rounded-full bg-[#1BC2D5]/12 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-80 w-80 rounded-full bg-[#FFFFFF]/8 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block">
          <AuthShowcase />
        </div>
        <LoginFormCard
          values={values}
          showPassword={showPassword}
          isSubmitting={isSubmitting}
          isResettingPassword={isResettingPassword}
          errorMessage={errorMessage}
          forgotPasswordMessage={forgotPasswordMessage}
          forgotPasswordResetUrl={forgotPasswordResetUrl}
          onChange={handleChange}
          onToggleRememberMe={handleToggleRememberMe}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onSubmit={handleSubmit}
          onForgotPassword={handleForgotPassword}
        />
      </div>
    </div>
  );
}
