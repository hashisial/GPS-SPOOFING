import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  exportReport,
  generateReport,
  getReportById,
  listReports
} from "../../services/reports/report.service.js";

export const generateReportHandler = asyncHandler(async (req, res) => {
  const report = await generateReport(req.body, req.user);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Report generated successfully",
    report
  });
});

export const listReportsHandler = asyncHandler(async (req, res) => {
  const result = await listReports(req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result
  });
});

export const getReportHandler = asyncHandler(async (req, res) => {
  const report = await getReportById(req.params.reportId);

  res.status(StatusCodes.OK).json({
    success: true,
    report
  });
});

export const exportReportHandler = asyncHandler(async (req, res) => {
  const exportedFile = await exportReport(req.params.reportId, req.query.format);

  res.setHeader("Content-Type", exportedFile.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${exportedFile.fileName}"`);
  res.status(StatusCodes.OK).send(exportedFile.buffer);
});
