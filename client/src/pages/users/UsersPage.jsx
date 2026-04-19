import { useEffect, useMemo, useState } from "react";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { UserFormModal } from "../../components/users/UserFormModal.jsx";
import { userService } from "../../services/users/user.service.js";

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load user management data right now."
  );
}

export function UsersPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    role: "",
    status: ""
  });
  const [draftSearch, setDraftSearch] = useState("");
  const [usersState, setUsersState] = useState({
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadUsers() {
      try {
        const response = await userService.list({
          page: filters.page,
          limit: filters.limit,
          sortBy: "createdAt",
          sortOrder: "desc",
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.role ? { role: filters.role } : {}),
          ...(filters.status ? { status: filters.status } : {})
        });

        if (!isMounted) {
          return;
        }

        setUsersState({
          data: response.data.data,
          pagination: response.data.pagination
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

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const summary = useMemo(() => {
    const activeUsers = usersState.data.filter((user) => user.isActive).length;
    const blockedUsers = usersState.data.filter((user) => !user.isActive).length;

    return {
      total: usersState.pagination.total,
      active: activeUsers,
      blocked: blockedUsers
    };
  }, [usersState]);

  async function handleStatusAction(user) {
    setBusyUserId(user.id);
    setActionMessage("");
    setErrorMessage("");

    try {
      if (user.isActive) {
        await userService.block(user.id, {
          reason: "Blocked from the frontend admin console"
        });
        setActionMessage(`User ${user.name} was blocked successfully.`);
      } else {
        await userService.unblock(user.id);
        setActionMessage(`User ${user.name} was unblocked successfully.`);
      }

      setFilters((current) => ({
        ...current
      }));
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setBusyUserId("");
    }
  }

  function refreshCurrentPage() {
    setFilters((current) => ({
      ...current
    }));
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingUser(null);
    setModalError("");
    setIsModalOpen(true);
  }

  function openEditModal(user) {
    setModalMode("edit");
    setEditingUser(user);
    setModalError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
    setModalError("");
    setIsSubmitting(false);
  }

  async function handleSubmitUser(payload) {
    setIsSubmitting(true);
    setModalError("");

    try {
      if (modalMode === "edit" && editingUser) {
        await userService.update(editingUser.id, payload);
        setActionMessage(`User ${payload.name} was updated successfully.`);
      } else {
        await userService.create(payload);
        setActionMessage(`User ${payload.name} was created successfully.`);
      }

      closeModal();
      refreshCurrentPage();
    } catch (error) {
      setModalError(extractErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser(user) {
    const confirmed = window.confirm(`Delete user ${user.name} (${user.email})?`);

    if (!confirmed) {
      return;
    }

    setBusyUserId(user.id);
    setActionMessage("");
    setErrorMessage("");

    try {
      await userService.remove(user.id);
      setActionMessage(`User ${user.name} was deleted successfully.`);
      refreshCurrentPage();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administration"
        title="Users"
        description="Search, filter, and review the live user directory with role-aware access controls and account status actions."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Total Users
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.total}
          </div>
        </article>
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Active In View
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.active}
          </div>
        </article>
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Blocked In View
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.blocked}
          </div>
        </article>
      </section>

      <PanelCard
        eyebrow="Directory Filters"
        title="Search and filter users"
        description="Use live backend queries to narrow the user directory by name, email, role, or status, then launch create and edit actions from the admin console."
      >
        <form
          className="grid gap-3 xl:grid-cols-[1.4fr_0.9fr_0.9fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({
              ...current,
              page: 1,
              search: draftSearch.trim()
            }));
          }}
        >
          <input
            type="search"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search by user name or email"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)]"
          />

          <select
            value={filters.role}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                role: event.target.value
              }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SECURITY_ANALYST">Security Analyst</option>
            <option value="VIEWER">Viewer</option>
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                status: event.target.value
              }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
            >
              Search
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-2xl border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-4 py-3 text-sm font-semibold text-[#9DFFEB] transition hover:border-[#00FFC6]/35 hover:text-white"
            >
              Add User
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftSearch("");
                setFilters({
                  page: 1,
                  limit: 10,
                  search: "",
                  role: "",
                  status: ""
                });
              }}
              className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Reset
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard
        eyebrow="User Directory"
        title="Live user list"
        description="Review account roles, current status, and last login details with create, edit, delete, block, and unblock actions."
      >
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/10 px-4 py-3 text-sm text-[#FFB3B3]">
            {errorMessage}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mb-4 rounded-2xl border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-4 py-3 text-sm text-[#B8FFF0]">
            {actionMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
            Loading users...
          </div>
        ) : usersState.data.length === 0 ? (
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-muted)] p-5 text-sm text-[var(--text-secondary)]">
            No users matched the current search and filter selection.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--background-elevated)]">
            <div className="hidden grid-cols-[1fr_1fr_0.75fr_0.75fr_1.2fr] gap-4 border-b border-[var(--border)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] lg:grid">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Last Login</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {usersState.data.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_0.75fr_0.75fr_1.2fr] lg:items-center"
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{user.name}</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">{user.email}</div>
                  </div>

                  <div className="text-sm font-medium text-[var(--text-primary)]">{user.role}</div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${
                        user.isActive
                          ? "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]"
                          : "border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FFB3B3]"
                      }`}
                    >
                      {user.isActive ? "Active" : "Blocked"}
                    </span>
                  </div>

                  <div className="text-sm text-[var(--text-secondary)]">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      disabled={busyUserId === user.id}
                      className="rounded-2xl border border-[#00FFC6]/20 bg-[#00FFC6]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9DFFEB] transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusAction(user)}
                      disabled={busyUserId === user.id}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                        user.isActive
                          ? "border-[#00FFC6]/20 bg-[#00FFC6]/10 text-[#9DFFEB]"
                          : "border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FFB3B3]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {busyUserId === user.id
                        ? "Updating..."
                        : user.isActive
                          ? "Block"
                          : "Unblock"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={busyUserId === user.id}
                      className="rounded-2xl border border-[#8B949E]/25 bg-[#8B949E]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C3CBD3] transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {usersState.pagination.totalPages > 1 ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--text-secondary)]">
              Page {usersState.pagination.page} of {usersState.pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={usersState.pagination.page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1
                  }))
                }
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={usersState.pagination.page >= usersState.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1
                  }))
                }
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </PanelCard>

      <UserFormModal
        mode={modalMode}
        user={editingUser}
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        errorMessage={modalError}
        onClose={closeModal}
        onSubmit={handleSubmitUser}
      />
    </div>
  );
}
