import { StatusCodes } from "../../utils/vendor.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { getLiveMonitoringData, ingestGpsData } from "../../services/gps/gps.service.js";

export const ingestGpsDataHandler = asyncHandler(async (req, res) => {
  const result = await ingestGpsData(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "GPS data ingested successfully",
    ...result
  });
});

export const ingestDeviceGpsDataHandler = asyncHandler(async (req, res) => {
  const requestedDeviceId =
    typeof req.body.deviceId === "string" ? req.body.deviceId.trim().toUpperCase() : null;

  if (requestedDeviceId && requestedDeviceId !== req.deviceAuth.deviceId) {
    throw ApiError.forbidden("Payload deviceId does not match the authenticated device");
  }

  const result = await ingestGpsData({
    ...req.body,
    deviceId: req.deviceAuth.deviceId
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    authMode: "device",
    message: "GPS data ingested successfully",
    ...result
  });
});

export const getLiveGpsHandler = asyncHandler(async (req, res) => {
  const result = await getLiveMonitoringData(req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result
  });
});

