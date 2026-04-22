import { useEffect, useState } from "react";
import { PageIntro } from "../../components/common/PageIntro.jsx";
import { PanelCard } from "../../components/dashboard/PanelCard.jsx";
import { ReportGeneratorPanel } from "../../components/reports/ReportGeneratorPanel.jsx";
import { ReportsTable } from "../../components/reports/ReportsTable.jsx";
import { ReportChartsSummary } from "../../components/reports/ReportChartsSummary.jsx";
import { ReportExportActions } from "../../components/reports/ReportExportActions.jsx";
import {
  REPORT_TYPES,
  createReportDownloadName
} from "../../components/reports/report-ui.js";
import { reportService } from "../../services/reports/report.service.js";
import { useAuth } from "../../hooks/useAuth.js";
import { APP_ROLES } from "../../utils/constants/app.constants.js";

const emptyReportForm = {
  type: REPORT_TYPES[0],
  title: "",
  periodStart: "",
  periodEnd: "",
  deviceId: "",
  severity: "",
  status: ""
};

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to process the report request right now."
  );
}

function buildGeneratePayload(form) {
  const payload = {
    type: form.type
  };

  if (form.title.trim()) {
    payload.title = form.title.trim();
  }

  if (form.periodStart) {
    payload.periodStart = form.periodStart;
  }

  if (form.periodEnd) {
    payload.periodEnd = form.periodEnd;
  }

  if (form.type === "DEVICE" && form.deviceId.trim()) {
    payload.deviceId = form.deviceId.trim();
  }

  if (form.type === "INCIDENT" && form.severity) {
    payload.severity = form.severity;
  }

  if (form.type === "INCIDENT" && form.status) {
    payload.status = form.status;
  }

  return payload;
}

function extractDownloadFileName(headers, fallbackName) {
  const contentDisposition = headers?.["content-disposition"] || headers?.["Content-Disposition"];
  const match = /filename="?(?<name>[^"]+)"?/.exec(contentDisposition ?? "");
  return match?.groups?.name ?? fallbackName;
}

function downloadFile(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { role } = useAuth();
  const canGenerateReports =
    role === APP_ROLES.SUPER_ADMIN || role === APP_ROLES.SECURITY_ANALYST;

  const [form, setForm] = useState(emptyReportForm);
  const [reportsState, setReportsState] = useState({
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1
    }
  });
  const [selectedReportId, setSelectedReportId] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportLoadingKey, setExportLoadingKey] = useState("");
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoadingReports(true);

    async function loadReports() {
      try {
        const response = await reportService.list({
          page: 1,
          limit: 12,
          sortBy: "createdAt",
          sortOrder: "desc"
        });

        if (!isMounted) {
          return;
        }

        const nextReports = response.data.data;
        setReportsState({
          data: nextReports,
          pagination: response.data.pagination
        });
        setSelectedReportId((current) => {
          if (current && nextReports.some((report) => report.id === current)) {
            return current;
          }

          return nextReports[0]?.id ?? "";
        });
        setListError("");
      } catch (error) {
        if (isMounted) {
          setListError(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingReports(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedReportId) {
      setSelectedReport(null);
      setDetailError("");
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);

    async function loadReportDetails() {
      try {
        const response = await reportService.getById(selectedReportId);

        if (!isMounted) {
          return;
        }

        setSelectedReport(response.data.report);
        setDetailError("");
      } catch (error) {
        if (isMounted) {
          setDetailError(extractErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    }

    loadReportDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedReportId]);

  async function refreshReports(preferredReportId = "") {
    setIsLoadingReports(true);

    try {
      const response = await reportService.list({
        page: 1,
        limit: 12,
        sortBy: "createdAt",
        sortOrder: "desc"
      });

      const nextReports = response.data.data;
      setReportsState({
        data: nextReports,
        pagination: response.data.pagination
      });
      setSelectedReportId(
        preferredReportId ||
          (selectedReportId && nextReports.some((report) => report.id === selectedReportId)
            ? selectedReportId
            : nextReports[0]?.id ?? "")
      );
      setListError("");
    } catch (error) {
      setListError(extractErrorMessage(error));
    } finally {
      setIsLoadingReports(false);
    }
  }

  async function handleGenerateReport(event) {
    event.preventDefault();
    setIsGenerating(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await reportService.generate(buildGeneratePayload(form));
      const generatedReport = response.data.report;

      setSuccessMessage("Report generated successfully.");
      setSelectedReport(generatedReport);
      setSelectedReportId(generatedReport.id);
      await refreshReports(generatedReport.id);
    } catch (error) {
      setActionError(extractErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExport(report, format) {
    const exportKey = `${report.id}:${format}`;
    setExportLoadingKey(exportKey);
    setActionError("");

    try {
      const response = await reportService.export(report.id, format);
      const fileName = extractDownloadFileName(
        response.headers,
        createReportDownloadName(report, format)
      );

      downloadFile(response.data, fileName);

      if (selectedReportId === report.id) {
        setSelectedReport((current) =>
          current
            ? {
                ...current,
                lastExportedAt: new Date().toISOString()
              }
            : current
        );
      }
    } catch (error) {
      setActionError(extractErrorMessage(error));
    } finally {
      setExportLoadingKey("");
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Reporting"
        title="Reports"
        description="Generate operational or incident reports, inspect stored report history, and export selected reports as PDF, CSV, or Excel."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <PanelCard
          eyebrow="Generator"
          title="Create a report"
          description="Apply date filters and report options, then generate a saved report directly from the backend."
        >
          <ReportGeneratorPanel
            form={form}
            canGenerateReports={canGenerateReports}
            isSubmitting={isGenerating}
            errorMessage={actionError}
            successMessage={successMessage}
            onFieldChange={(key, value) =>
              setForm((current) => ({
                ...current,
                [key]: value
              }))
            }
            onSubmit={handleGenerateReport}
          />
        </PanelCard>

        <PanelCard
          eyebrow="Summary"
          title="Charts summary"
          description="Open any saved report to review its numeric highlights and visual severity and status breakdowns."
        >
          {detailError ? (
            <div className="mb-4 rounded-2xl border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              {detailError}
            </div>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--text-secondary)]">
              {selectedReport
                ? `Selected report ready for download across all supported formats.`
                : "Select a report from the history table or generate a new one to unlock exports."}
            </div>
            <ReportExportActions
              report={selectedReport}
              onExport={handleExport}
              loadingKey={exportLoadingKey}
            />
          </div>

          <ReportChartsSummary report={selectedReport} isLoading={isLoadingDetails} />
        </PanelCard>
      </div>

      <PanelCard
        eyebrow="History"
        title="Generated reports"
        description="Browse recent reports and download PDF, CSV, or Excel exports directly from the table."
      >
        {listError ? (
          <div className="mb-4 rounded-2xl border border-[#FFFFFF]/35 bg-[#FFFFFF]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
            {listError}
          </div>
        ) : null}

        <ReportsTable
          reports={reportsState.data}
          isLoading={isLoadingReports}
          selectedReportId={selectedReportId}
          loadingKey={exportLoadingKey}
          onSelect={setSelectedReportId}
          onExport={handleExport}
        />
      </PanelCard>
    </div>
  );
}
