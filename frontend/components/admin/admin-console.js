"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from "react";
import { motion } from "framer-motion";
import {
  PencilLine,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  X
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { apiRequest } from "@/lib/api";
import { mockDevices, mockUsers } from "@/lib/mock-data";

const initialUserForm = {
  name: "",
  email: "",
  password: "",
  role: "USER"
};

const initialDeviceForm = {
  callsign: "",
  label: "",
  fleet: "",
  status: "ACTIVE",
  latitude: "",
  longitude: "",
  notes: ""
};

const initialUserEditor = {
  name: "",
  role: "USER",
  password: "",
  isActive: true
};

const initialDeviceEditor = {
  label: "",
  fleet: "",
  status: "ACTIVE",
  latitude: "",
  longitude: "",
  notes: ""
};

function filterUsers(users, search) {
  if (!search) {
    return users;
  }

  const query = search.toLowerCase();
  return users.filter((user) =>
    [user.name, user.email, user.role].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    )
  );
}

function filterDevices(devices, search) {
  if (!search) {
    return devices;
  }

  const query = search.toLowerCase();
  return devices.filter((device) =>
    [device.callsign, device.label, device.fleet, device.status].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    )
  );
}

function statusPill(status) {
  const styles = {
    ACTIVE: "border-success/20 bg-success/10 text-success",
    MAINTENANCE: "border-accent/20 bg-accent/10 text-accent",
    OFFLINE: "border-danger/20 bg-danger/10 text-danger"
  };

  return styles[status] ?? "border-line/20 bg-surface/50 text-text-muted";
}

function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="relative block">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        size={16}
      />
      <input className="field pl-11" onChange={onChange} placeholder={placeholder} value={value} />
    </label>
  );
}

function MetricCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <motion.article whileHover={{ y: -3 }} className="monitor-kpi">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-text-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-wide">{value}</p>
          <p className="mt-3 text-sm text-text-muted">{hint}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </motion.article>
  );
}

function PreviewNotice({ children }) {
  return (
    <div className="monitor-panel mb-6 border-signal/20 bg-signal/10 px-4 py-3 text-sm text-text-primary">
      {children}
    </div>
  );
}

function nextPreviewId(prefix) {
  return `${prefix}-${Date.now()}`;
}

export function AdminConsole() {
  const { session, loading: authLoading, logout, refreshSession } = useAuthSession();
  const [userDirectory, setUserDirectory] = useState([]);
  const [deviceDirectory, setDeviceDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [deviceForm, setDeviceForm] = useState(initialDeviceForm);
  const [savingUser, setSavingUser] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);
  const [editingUserId, setEditingUserId] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState("");
  const [userEditor, setUserEditor] = useState(initialUserEditor);
  const [deviceEditor, setDeviceEditor] = useState(initialDeviceEditor);
  const [savingUserPatch, setSavingUserPatch] = useState(false);
  const [savingDevicePatch, setSavingDevicePatch] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");

  const deferredUserSearch = useDeferredValue(userSearch);
  const deferredDeviceSearch = useDeferredValue(deviceSearch);
  const isAdmin = session?.user?.role === "ADMIN";
  const currentUserId = session?.user?.id;

  const users = useMemo(
    () => filterUsers(userDirectory, deferredUserSearch),
    [deferredUserSearch, userDirectory]
  );
  const devices = useMemo(
    () => filterDevices(deviceDirectory, deferredDeviceSearch),
    [deferredDeviceSearch, deviceDirectory]
  );

  const stats = useMemo(() => {
    const activeUsers = userDirectory.filter((user) => user.isActive).length;
    const adminUsers = userDirectory.filter((user) => user.role === "ADMIN").length;
    const activeDevices = deviceDirectory.filter((device) => device.status === "ACTIVE").length;
    const flaggedDevices = deviceDirectory.reduce(
      (count, device) => count + Number(device.alertCount ?? 0),
      0
    );

    return {
      totalUsers: userDirectory.length,
      activeUsers,
      adminUsers,
      activeDevices,
      flaggedDevices
    };
  }, [deviceDirectory, userDirectory]);

  async function loadAdminData() {
    if (!session?.token || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [usersResponse, devicesResponse] = await Promise.all([
        apiRequest("/users", {
          token: session.token,
          query: {
            page: 1,
            pageSize: 50
          }
        }),
        apiRequest("/devices", {
          token: session.token,
          query: {
            page: 1,
            pageSize: 50
          }
        })
      ]);

      setUserDirectory(usersResponse.data ?? []);
      setDeviceDirectory(devicesResponse.data ?? []);
      setPreviewMode(false);
      setMessage("");
    } catch {
      setUserDirectory(mockUsers);
      setDeviceDirectory(mockDevices);
      setPreviewMode(true);
      setMessage(
        "Preview mode is active. Local operator and device data is being used until the database connection is restored."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [session?.token, isAdmin]);

  function applyLocalUserUpdate(userId, patch) {
    setUserDirectory((current) =>
      current.map((user) => (user.id === userId ? { ...user, ...patch } : user))
    );
  }

  function applyLocalDeviceUpdate(deviceId, patch) {
    setDeviceDirectory((current) =>
      current.map((device) => (device.id === deviceId ? { ...device, ...patch } : device))
    );
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setSavingUser(true);
    setMessage("");

    try {
      if (previewMode) {
        setUserDirectory((current) => [
          {
            id: nextPreviewId("user-preview"),
            name: userForm.name,
            email: userForm.email,
            role: userForm.role,
            isActive: true,
            reportCount: 0
          },
          ...current
        ]);
        setMessage("Preview mode: user created locally.");
      } else {
        await apiRequest("/users", {
          method: "POST",
          token: session.token,
          body: JSON.stringify(userForm)
        });
        await loadAdminData();
      }

      setUserForm(initialUserForm);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingUser(false);
    }
  }

  async function handleCreateDevice(event) {
    event.preventDefault();
    setSavingDevice(true);
    setMessage("");

    try {
      if (previewMode) {
        setDeviceDirectory((current) => [
          {
            id: nextPreviewId("device-preview"),
            ...deviceForm,
            detectionCount: 0,
            alertCount: 0
          },
          ...current
        ]);
        setMessage("Preview mode: device added locally.");
      } else {
        await apiRequest("/devices", {
          method: "POST",
          token: session.token,
          body: JSON.stringify(deviceForm)
        });
        await loadAdminData();
      }

      setDeviceForm(initialDeviceForm);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingDevice(false);
    }
  }

  async function handleToggleRole(user) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setMessage("");

    try {
      if (previewMode) {
        applyLocalUserUpdate(user.id, { role: nextRole });
        setMessage("Preview mode: role updated locally.");
      } else {
        await apiRequest(`/users/${user.id}`, {
          method: "PATCH",
          token: session.token,
          body: JSON.stringify({ role: nextRole })
        });
        await refreshSession().catch(() => null);
        await loadAdminData();
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleToggleUserState(user) {
    const nextActiveState = !user.isActive;
    setMessage("");

    try {
      if (previewMode) {
        applyLocalUserUpdate(user.id, { isActive: nextActiveState });
        setMessage("Preview mode: user state updated locally.");
      } else {
        await apiRequest(`/users/${user.id}`, {
          method: "PATCH",
          token: session.token,
          body: JSON.stringify({ isActive: nextActiveState })
        });
        await refreshSession().catch(() => null);
        await loadAdminData();
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSaveUser(userId) {
    setSavingUserPatch(true);
    setMessage("");

    try {
      if (previewMode) {
        applyLocalUserUpdate(userId, {
          name: userEditor.name,
          role: userEditor.role,
          isActive: userEditor.isActive
        });
        setMessage("Preview mode: user changes saved locally.");
      } else {
        await apiRequest(`/users/${userId}`, {
          method: "PATCH",
          token: session.token,
          body: JSON.stringify({
            name: userEditor.name,
            role: userEditor.role,
            isActive: userEditor.isActive,
            ...(userEditor.password ? { password: userEditor.password } : {})
          })
        });

        if (userId === currentUserId) {
          await refreshSession().catch(() => null);
        }

        await loadAdminData();
      }

      setEditingUserId("");
      setUserEditor(initialUserEditor);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingUserPatch(false);
    }
  }

  async function handleSaveDevice(deviceId) {
    setSavingDevicePatch(true);
    setMessage("");

    try {
      if (previewMode) {
        applyLocalDeviceUpdate(deviceId, {
          label: deviceEditor.label,
          fleet: deviceEditor.fleet,
          status: deviceEditor.status,
          latitude: deviceEditor.latitude,
          longitude: deviceEditor.longitude,
          notes: deviceEditor.notes
        });
        setMessage("Preview mode: device changes saved locally.");
      } else {
        await apiRequest(`/devices/${deviceId}`, {
          method: "PATCH",
          token: session.token,
          body: JSON.stringify(deviceEditor)
        });
        await loadAdminData();
      }

      setEditingDeviceId("");
      setDeviceEditor(initialDeviceEditor);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingDevicePatch(false);
    }
  }

  async function handleQuickDeviceStatus(deviceId, status) {
    setMessage("");

    try {
      if (previewMode) {
        applyLocalDeviceUpdate(deviceId, { status });
        setMessage("Preview mode: device status updated locally.");
      } else {
        await apiRequest(`/devices/${deviceId}`, {
          method: "PATCH",
          token: session.token,
          body: JSON.stringify({ status })
        });
        await loadAdminData();
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (authLoading) {
    return (
      <SiteShell
        eyebrow="Administrative Control Surface"
        loading
        onLogout={logout}
        session={session}
        subtitle="Restoring protected operational state."
        title="Admin panel"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[520px] rounded-[2rem]" />
          <Skeleton className="h-[520px] rounded-[2rem]" />
        </div>
      </SiteShell>
    );
  }

  if (!session?.token) {
    return (
      <SiteShell
        eyebrow="Administrative Control Surface"
        loading={false}
        onLogout={logout}
        session={session}
        subtitle="Administrative actions require a secure authenticated session."
        title="Admin panel"
      >
        <EmptyState
          action={<Link className="primary-button" href="/login">Login</Link>}
          description="Manage operators, roles, and fleet inventory after signing in with an admin account."
          title="Authentication required"
        />
      </SiteShell>
    );
  }

  if (!isAdmin) {
    return (
      <SiteShell
        eyebrow="Administrative Control Surface"
        loading={false}
        onLogout={logout}
        session={session}
        subtitle="This view is restricted to administrator roles."
        title="Admin panel"
      >
        <EmptyState
          description="Your account can monitor detections and manage personal settings, but only admins can manage users and fleet inventory."
          title="Access restricted"
        />
      </SiteShell>
    );
  }

  return (
    <SiteShell
      actions={
        <button className="secondary-button" onClick={loadAdminData} type="button">
          <RefreshCcw size={16} />
          Refresh data
        </button>
      }
      eyebrow="Administrative Control Surface"
      loading={false}
      onLogout={logout}
      session={session}
      subtitle="Provision secure operator accounts, assign roles, and maintain monitored devices through a command-console administration workflow."
      title="Admin panel"
    >
      {previewMode ? (
        <PreviewNotice>
          Database-backed admin APIs are unavailable right now, so the console is running with local preview data.
        </PreviewNotice>
      ) : null}

      {message ? (
        <div className="monitor-panel mb-6 px-4 py-3 text-sm text-text-primary">{message}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          hint="Total operator records currently loaded."
          icon={Users}
          label="Operators"
          tone="bg-signal/15 text-signal"
          value={stats.totalUsers}
        />
        <MetricCard
          hint="Operators with active access rights."
          icon={ShieldCheck}
          label="Active Users"
          tone="bg-success/15 text-success"
          value={stats.activeUsers}
        />
        <MetricCard
          hint="Devices with active monitoring status."
          icon={Wrench}
          label="Active Devices"
          tone="bg-accent/15 text-accent"
          value={stats.activeDevices}
        />
        <MetricCard
          hint="Admin-role operators in the control surface."
          icon={PencilLine}
          label="Admins"
          tone="bg-danger/15 text-danger"
          value={stats.adminUsers}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="monitor-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-signal/15 p-3 text-signal">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="eyebrow">User Management</p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-wide">
                Accounts and roles
              </h3>
            </div>
          </div>

          <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={handleCreateUser}>
            <input
              className="field"
              onChange={(event) =>
                setUserForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Full name"
              value={userForm.name}
            />
            <input
              className="field"
              onChange={(event) =>
                setUserForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="Email"
              type="email"
              value={userForm.email}
            />
            <input
              className="field"
              onChange={(event) =>
                setUserForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Temporary password"
              type="password"
              value={userForm.password}
            />
            <select
              className="field"
              onChange={(event) =>
                setUserForm((current) => ({ ...current, role: event.target.value }))
              }
              value={userForm.role}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button className="primary-button md:col-span-2" disabled={savingUser} type="submit">
              <Plus size={16} />
              {savingUser ? "Creating user..." : "Create user"}
            </button>
          </form>

          <div className="mt-5">
            <SearchField
              onChange={(event) => {
                startTransition(() => {
                  setUserSearch(event.target.value);
                });
              }}
              placeholder="Search users by name, email, or role"
              value={userSearch}
            />
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-24 rounded-3xl" />
                <Skeleton className="h-24 rounded-3xl" />
              </>
            ) : users.length === 0 ? (
              <EmptyState
                description="No operators match the current filters."
                title="No users found"
              />
            ) : (
              users.map((user) => (
                <motion.article
                  key={user.id}
                  whileHover={{ y: -2 }}
                  className="rounded-[1.6rem] border border-line/15 bg-surface/55 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">{user.name}</p>
                      <p className="text-sm text-text-muted">{user.email}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="ghost-button"
                        onClick={() => {
                          setEditingUserId((current) => (current === user.id ? "" : user.id));
                          setUserEditor({
                            name: user.name,
                            role: user.role,
                            password: "",
                            isActive: user.isActive
                          });
                        }}
                        type="button"
                      >
                        <PencilLine size={14} />
                        {editingUserId === user.id ? "Close" : "Edit"}
                      </button>
                      <button
                        className="ghost-button"
                        disabled={user.id === currentUserId}
                        onClick={() => handleToggleRole(user)}
                        type="button"
                      >
                        {user.role === "ADMIN" ? "Demote" : "Promote"}
                      </button>
                      <button
                        className="ghost-button"
                        disabled={user.id === currentUserId}
                        onClick={() => handleToggleUserState(user)}
                        type="button"
                      >
                        {user.isActive ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                    <span className="chip">{user.role}</span>
                    <span className="chip">{user.isActive ? "Active" : "Disabled"}</span>
                    <span className="chip">{user.reportCount ?? 0} reports</span>
                  </div>

                  {editingUserId === user.id ? (
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        await handleSaveUser(user.id);
                      }}
                    >
                      <input
                        className="field"
                        onChange={(event) =>
                          setUserEditor((current) => ({
                            ...current,
                            name: event.target.value
                          }))
                        }
                        placeholder="Full name"
                        value={userEditor.name}
                      />
                      <select
                        className="field"
                        onChange={(event) =>
                          setUserEditor((current) => ({
                            ...current,
                            role: event.target.value
                          }))
                        }
                        value={userEditor.role}
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <input
                        className="field"
                        onChange={(event) =>
                          setUserEditor((current) => ({
                            ...current,
                            password: event.target.value
                          }))
                        }
                        placeholder="Reset password (optional)"
                        type="password"
                        value={userEditor.password}
                      />
                      <select
                        className="field"
                        onChange={(event) =>
                          setUserEditor((current) => ({
                            ...current,
                            isActive: event.target.value === "true"
                          }))
                        }
                        value={String(userEditor.isActive)}
                      >
                        <option value="true">Active</option>
                        <option value="false">Disabled</option>
                      </select>

                      <div className="flex flex-wrap gap-2 md:col-span-2">
                        <button
                          className="primary-button"
                          disabled={savingUserPatch}
                          type="submit"
                        >
                          <Save size={16} />
                          {savingUserPatch ? "Saving..." : "Save changes"}
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => {
                            setEditingUserId("");
                            setUserEditor(initialUserEditor);
                          }}
                          type="button"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </motion.article>
              ))
            )}
          </div>
        </section>

        <section className="monitor-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent/15 p-3 text-accent">
              <Wrench size={18} />
            </div>
            <div>
              <p className="eyebrow">Device Management</p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-wide">
                Fleet inventory
              </h3>
            </div>
          </div>

          <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={handleCreateDevice}>
            <input
              className="field"
              onChange={(event) =>
                setDeviceForm((current) => ({ ...current, callsign: event.target.value }))
              }
              placeholder="Callsign"
              value={deviceForm.callsign}
            />
            <input
              className="field"
              onChange={(event) =>
                setDeviceForm((current) => ({ ...current, label: event.target.value }))
              }
              placeholder="Device label"
              value={deviceForm.label}
            />
            <input
              className="field"
              onChange={(event) =>
                setDeviceForm((current) => ({ ...current, fleet: event.target.value }))
              }
              placeholder="Fleet / sector"
              value={deviceForm.fleet}
            />
            <select
              className="field"
              onChange={(event) =>
                setDeviceForm((current) => ({ ...current, status: event.target.value }))
              }
              value={deviceForm.status}
            >
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OFFLINE">Offline</option>
            </select>
            <input
              className="field"
              onChange={(event) =>
                setDeviceForm((current) => ({ ...current, latitude: event.target.value }))
              }
              placeholder="Latitude"
              value={deviceForm.latitude}
            />
            <input
              className="field"
              onChange={(event) =>
                setDeviceForm((current) => ({ ...current, longitude: event.target.value }))
              }
              placeholder="Longitude"
              value={deviceForm.longitude}
            />
            <textarea
              className="field md:col-span-2"
              onChange={(event) =>
                setDeviceForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Operational notes"
              rows={3}
              value={deviceForm.notes}
            />
            <button className="primary-button md:col-span-2" disabled={savingDevice} type="submit">
              <Plus size={16} />
              {savingDevice ? "Adding device..." : "Add device"}
            </button>
          </form>

          <div className="mt-5">
            <SearchField
              onChange={(event) => {
                startTransition(() => {
                  setDeviceSearch(event.target.value);
                });
              }}
              placeholder="Search devices by callsign, label, or fleet"
              value={deviceSearch}
            />
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-24 rounded-3xl" />
                <Skeleton className="h-24 rounded-3xl" />
              </>
            ) : devices.length === 0 ? (
              <EmptyState
                description="No devices match the current filters."
                title="No devices found"
              />
            ) : (
              devices.map((device) => (
                <motion.article
                  key={device.id}
                  whileHover={{ y: -2 }}
                  className="rounded-[1.6rem] border border-line/15 bg-surface/55 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">{device.label}</p>
                      <p className="text-sm text-text-muted">
                        {device.callsign} {device.fleet ? `- ${device.fleet}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${statusPill(device.status)}`}
                      >
                        {device.status}
                      </span>
                      <button
                        className="ghost-button"
                        onClick={() => {
                          setEditingDeviceId((current) => (current === device.id ? "" : device.id));
                          setDeviceEditor({
                            label: device.label,
                            fleet: device.fleet ?? "",
                            status: device.status,
                            latitude: device.latitude ?? "",
                            longitude: device.longitude ?? "",
                            notes: device.notes ?? ""
                          });
                        }}
                        type="button"
                      >
                        <PencilLine size={14} />
                        {editingDeviceId === device.id ? "Close" : "Edit"}
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-text-muted">
                    {device.notes || "No notes added."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                    <span className="chip">{device.detectionCount ?? 0} gps logs</span>
                    <span className="chip">{device.alertCount ?? 0} alerts</span>
                    <span className="chip">
                      {device.latitude ?? "--"}, {device.longitude ?? "--"}
                    </span>
                  </div>

                  {editingDeviceId === device.id ? (
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        await handleSaveDevice(device.id);
                      }}
                    >
                      <input
                        className="field"
                        onChange={(event) =>
                          setDeviceEditor((current) => ({
                            ...current,
                            label: event.target.value
                          }))
                        }
                        placeholder="Device label"
                        value={deviceEditor.label}
                      />
                      <input
                        className="field"
                        onChange={(event) =>
                          setDeviceEditor((current) => ({
                            ...current,
                            fleet: event.target.value
                          }))
                        }
                        placeholder="Fleet / sector"
                        value={deviceEditor.fleet}
                      />
                      <select
                        className="field"
                        onChange={(event) =>
                          setDeviceEditor((current) => ({
                            ...current,
                            status: event.target.value
                          }))
                        }
                        value={deviceEditor.status}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="OFFLINE">Offline</option>
                      </select>
                      <input
                        className="field"
                        onChange={(event) =>
                          setDeviceEditor((current) => ({
                            ...current,
                            latitude: event.target.value
                          }))
                        }
                        placeholder="Latitude"
                        value={deviceEditor.latitude}
                      />
                      <input
                        className="field"
                        onChange={(event) =>
                          setDeviceEditor((current) => ({
                            ...current,
                            longitude: event.target.value
                          }))
                        }
                        placeholder="Longitude"
                        value={deviceEditor.longitude}
                      />
                      <textarea
                        className="field md:col-span-2"
                        onChange={(event) =>
                          setDeviceEditor((current) => ({
                            ...current,
                            notes: event.target.value
                          }))
                        }
                        placeholder="Operational notes"
                        rows={3}
                        value={deviceEditor.notes}
                      />

                      <div className="flex flex-wrap gap-2 md:col-span-2">
                        <button
                          className="primary-button"
                          disabled={savingDevicePatch}
                          type="submit"
                        >
                          <Save size={16} />
                          {savingDevicePatch ? "Saving..." : "Save changes"}
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => {
                            setEditingDeviceId("");
                            setDeviceEditor(initialDeviceEditor);
                          }}
                          type="button"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["ACTIVE", "MAINTENANCE", "OFFLINE"].map((status) => (
                        <button
                          key={status}
                          className="ghost-button"
                          onClick={() => handleQuickDeviceStatus(device.id, status)}
                          type="button"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.article>
              ))
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
