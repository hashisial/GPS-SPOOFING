import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  deleteAlert,
  escalateAlert,
  getAlertById,
  listAlerts,
  markAlertFalsePositive,
  resolveAlert
} from "../../services/alerts/alert-management.service.js";

export const listAlertsHandler = asyncHandler(async (req, res) => {
  const result = await listAlerts(req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result
  });
});

export const getAlertHandler = asyncHandler(async (req, res) => {
  const alert = await getAlertById(req.params.alertId);

  res.status(StatusCodes.OK).json({
    success: true,
    alert
  });
});

export const resolveAlertHandler = asyncHandler(async (req, res) => {
  const alert = await resolveAlert(req.params.alertId, req.body, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Alert resolved successfully",
    alert
  });
});

export const falsePositiveAlertHandler = asyncHandler(async (req, res) => {
  const alert = await markAlertFalsePositive(req.params.alertId, req.body, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Alert marked as false positive",
    alert
  });
});

export const escalateAlertHandler = asyncHandler(async (req, res) => {
  const alert = await escalateAlert(req.params.alertId, req.body, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Alert escalated successfully",
    alert
  });
});

export const deleteAlertHandler = asyncHandler(async (req, res) => {
  const result = await deleteAlert(req.params.alertId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Alert deleted successfully",
    result
  });
});
