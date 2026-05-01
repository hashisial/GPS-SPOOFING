import { StatusCodes } from "../../utils/vendor.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createDevice,
  deleteDevice,
  getDeviceById,
  listDevices,
  updateDevice
} from "../../services/devices/device.service.js";
import { provisionDeviceApiKey } from "../../services/devices/device-auth.service.js";

export const listDevicesHandler = asyncHandler(async (req, res) => {
  const result = await listDevices(req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result
  });
});

export const getDeviceHandler = asyncHandler(async (req, res) => {
  const device = await getDeviceById(req.params.deviceId);

  res.status(StatusCodes.OK).json({
    success: true,
    device
  });
});

export const createDeviceHandler = asyncHandler(async (req, res) => {
  const device = await createDevice(req.body, req.user);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Device created successfully",
    device
  });
});

export const updateDeviceHandler = asyncHandler(async (req, res) => {
  const device = await updateDevice(req.params.deviceId, req.body, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Device updated successfully",
    device
  });
});

export const deleteDeviceHandler = asyncHandler(async (req, res) => {
  const result = await deleteDevice(req.params.deviceId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Device deleted successfully",
    result
  });
});

export const provisionDeviceApiKeyHandler = asyncHandler(async (req, res) => {
  const result = await provisionDeviceApiKey(req.params.deviceId, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Device API key generated successfully. Store it now because it will not be shown again.",
    ...result
  });
});

