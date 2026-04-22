import { useEffect, useMemo, useState } from "react";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { DevicesFiltersBar } from "../../components/devices/DevicesFiltersBar.jsx";
import { DevicesTable } from "../../components/devices/DevicesTable.jsx";
import { DevicesPagination } from "../../components/devices/DevicesPagination.jsx";
import { DeviceFormModal } from "../../components/devices/DeviceFormModal.jsx";
import { deviceService } from "../../services/devices/device.service.js";
import { userService } from "../../services/users/user.service.js";
import { useAuth } from "../../hooks/useAuth.js";
import { APP_ROLES } from "../../utils/constants/app.constants.js";

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to process the device request right now."
  );
}

export function DevicesPage() {
  const { role } = useAuth();
  const canManageDevices = role === APP_ROLES.SUPER_ADMIN;

  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: "",
    status: "",
    type: "",
    online: ""
  });
  const [draftSearch, setDraftSearch] = useState(filters.search);
  const [devicesState, setDevicesState] = useState({
    data: [],
    pagination: {
      page: 1,
      limit: 8,
      total: 0,
      totalPages: 1
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingDevice, setEditingDevice] = useState(null);
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [ownersError, setOwnersError] = useState("");

  useEffect(() => {
    if (!canManageDevices) {
      setOwnerOptions([]);
      setOwnersError("");
      setIsLoadingOwners(false);
      return;
    }

    let isMounted = true;
    setIsLoadingOwners(true);

    async function loadOwners() {
      try {
        const response = await userService.list({
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortBy: "name",
          sortOrder: "asc"
        });

        if (!isMounted) {
          return;
        }

        setOwnerOptions(response.data.data);
        setOwnersError("");
      } catch (error) {
        if (isMounted) {
          setOwnerOptions([]);
          setOwnersError(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingOwners(false);
        }
      }
    }

    loadOwners();

    return () => {
      isMounted = false;
    };
  }, [canManageDevices]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadDevices() {
      try {
        const params = {
          page: filters.page,
          limit: filters.limit,
          sortBy: "createdAt",
          sortOrder: "desc"
        };

        if (filters.search) {
          params.search = filters.search;
        }

        if (filters.status) {
          params.status = filters.status;
        }

        if (filters.type) {
          params.type = filters.type;
        }

        if (filters.online) {
          params.online = filters.online;
        }

        const response = await deviceService.list(params);

        if (!isMounted) {
          return;
        }

        setDevicesState({
          data: response.data.data,
          pagination: response.data.pagination
        });
        setPageError("");
      } catch (error) {
        if (isMounted) {
          setPageError(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDevices();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const summary = useMemo(() => {
    const total = devicesState.pagination.total;
    const online = devicesState.data.filter((device) => device.status === "ONLINE").length;
    const disabled = devicesState.data.filter((device) => device.status === "DISABLED").length;

    return { total, online, disabled };
  }, [devicesState]);

  function openCreateModal() {
    setModalMode("create");
    setEditingDevice(null);
    setModalError("");
    setIsModalOpen(true);
  }

  function openEditModal(device) {
    setModalMode("edit");
    setEditingDevice(device);
    setModalError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingDevice(null);
    setModalError("");
    setIsSubmitting(false);
  }

  function refreshCurrentPage() {
    setFilters((current) => ({
      ...current
    }));
  }

  async function handleSubmitDevice(payload) {
    setIsSubmitting(true);
    setModalError("");

    try {
      if (modalMode === "edit" && editingDevice) {
        await deviceService.update(editingDevice.id, payload);
      } else {
        await deviceService.create(payload);
      }

      closeModal();
      refreshCurrentPage();
    } catch (error) {
      setModalError(extractErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  async function handleDeleteDevice(device) {
    const confirmed = window.confirm(
      `Delete device ${device.deviceName} (${device.deviceId})?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deviceService.remove(device.id);
      refreshCurrentPage();
    } catch (error) {
      setPageError(extractErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Fleet"
        title="Devices"
      description="Manage device inventory with search, filters, responsive table views, and create or edit workflows."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Devices In Scope
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.total}
          </div>
        </article>
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Online In View
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.online}
          </div>
        </article>
        <article className="dashboard-panel rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Disabled In View
          </div>
          <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {summary.disabled}
          </div>
        </article>
      </section>

      <PanelCard
        eyebrow="Filters"
        title="Search and refine device inventory"
        description="Use backend-powered search, type filters, and status filters to narrow the current fleet view."
      >
        <DevicesFiltersBar
          filters={filters}
          draftSearch={draftSearch}
          canManageDevices={canManageDevices}
          onDraftSearchChange={setDraftSearch}
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({
              ...current,
              page: 1,
              search: draftSearch.trim()
            }));
          }}
          onFilterChange={(key, value) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              [key]: value
            }))
          }
          onReset={() => {
            setDraftSearch("");
            setFilters({
              page: 1,
              limit: 8,
              search: "",
              status: "",
              type: "",
              online: ""
            });
          }}
          onCreate={openCreateModal}
        />
      </PanelCard>

      <PanelCard
        eyebrow="Device Table"
        title="Fleet inventory"
        description="Review current devices, edit metadata, and manage inventory lifecycle from a single responsive table."
      >
        {pageError ? (
          <div className="mb-4 rounded-2xl border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
            {pageError}
          </div>
        ) : null}

        {ownersError && canManageDevices ? (
          <div className="mb-4 rounded-2xl border border-[#145052]/25 bg-[#145052]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
            Owner directory could not be loaded. You can still review devices, but owner assignment is temporarily unavailable.
          </div>
        ) : null}

        <DevicesTable
          devices={devicesState.data}
          isLoading={isLoading}
          canManageDevices={canManageDevices}
          onEdit={openEditModal}
          onDelete={handleDeleteDevice}
        />

        <div className="mt-5">
          <DevicesPagination
            pagination={devicesState.pagination}
            onPageChange={(page) =>
              setFilters((current) => ({
                ...current,
                page
              }))
            }
          />
        </div>
      </PanelCard>

      <DeviceFormModal
        mode={modalMode}
        device={editingDevice}
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        ownerOptions={ownerOptions}
        isLoadingOwners={isLoadingOwners}
        errorMessage={modalError}
        onClose={closeModal}
        onSubmit={handleSubmitDevice}
      />
    </div>
  );
}
