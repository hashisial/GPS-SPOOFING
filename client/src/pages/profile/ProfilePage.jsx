import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { profileService } from "../../services/profile/profile.service.js";
import { setSession } from "../../app/store/slices/authSlice.js";
import { persistSession, readStoredSession } from "../../utils/helpers/auth-storage.js";

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load the profile workspace right now."
  );
}

export function ProfilePage() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadProfile() {
      try {
        const response = await profileService.get();

        if (!isMounted) {
          return;
        }

        setProfile(response.data.user);
        setForm({
          name: response.data.user.name ?? "",
          email: response.data.user.email ?? ""
        });
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

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await profileService.update({
        name: form.name.trim(),
        email: form.email.trim()
      });
      const nextUser = response.data.user;

      setProfile(nextUser);
      setForm({
        name: nextUser.name ?? "",
        email: nextUser.email ?? ""
      });
      setSuccessMessage("Profile updated successfully.");

      const currentSession = readStoredSession();

      if (currentSession?.accessToken) {
        const nextSession = {
          accessToken: currentSession.accessToken,
          user: nextUser
        };

        persistSession(nextSession, Boolean(currentSession.rememberMe));
        dispatch(
          setSession({
            ...nextSession,
            rememberMe: Boolean(currentSession.rememberMe)
          })
        );
      }
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Workspace User"
        title="Profile"
        description="Manage your signed-in identity, review account metadata, and keep your operator details synchronized with the backend."
      />

      {errorMessage ? (
        <div className="rounded-[1.75rem] border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-5 py-4 text-sm text-[var(--text-primary)]">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <PanelCard
          eyebrow="Identity"
          title="Profile details"
          description="Update the account name and email address stored on the backend profile service."
        >
          {isLoading ? (
            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
              Loading profile...
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {successMessage ? (
                <div className="rounded-2xl border border-[#1BC2D5]/20 bg-[#1BC2D5]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                  {successMessage}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[#1BC2D5] px-5 py-3 text-sm font-semibold text-[#000000] shadow-[0_0_24px_rgba(27,194,213,0.24)] transition hover:bg-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}
        </PanelCard>

        <PanelCard
          eyebrow="Account Metadata"
          title="Workspace identity status"
          description="Read-only account metadata fetched from the protected backend profile endpoint."
        >
          {isLoading ? (
            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
              Syncing metadata...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Role
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {profile?.role ?? "N/A"}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Account Status
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {profile?.isActive ? "Active" : "Blocked"}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Last Login
                </div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "Never"}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background-muted)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Created
                </div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "N/A"}
                </div>
              </div>
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
