import { asyncHandler } from "../utils/async-handler.js";
import {
  createReport,
  createReportPdf,
  exportReportCsv
} from "../services/report.service.js";

export const postReport = asyncHandler(async (req, res) => {
  const report = await createReport(req.body, req.user.sub);

  return res.status(201).json({
    data: report
  });
});

export const getReportCsv = asyncHandler(async (req, res) => {
  const csv = await exportReportCsv(req.query);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="gps-spoofing-report-${Date.now()}.csv"`
  );

  return res.status(200).send(csv);
});

export const getReportPdf = asyncHandler(async (req, res) => {
  const pdfDocument = await createReportPdf(req.query);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="gps-spoofing-report-${Date.now()}.pdf"`
  );

  pdfDocument.pipe(res);
  pdfDocument.end();
});
