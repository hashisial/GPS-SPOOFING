import { asyncHandler } from "../utils/async-handler.js";
import { createDevice, listDevices, updateDevice } from "../services/device.service.js";

export const getDevices = asyncHandler(async (req, res) => {
  const devices = await listDevices(req.query);

  return res.status(200).json(devices);
});

export const postDevice = asyncHandler(async (req, res) => {
  const device = await createDevice(req.body);

  return res.status(201).json({
    data: device
  });
});

export const patchDevice = asyncHandler(async (req, res) => {
  const device = await updateDevice(req.params.id, req.body);

  return res.status(200).json({
    data: device
  });
});
