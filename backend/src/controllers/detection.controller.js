import { asyncHandler } from "../utils/async-handler.js";
import {
  createDetection,
  getDetectionSummary,
  listDetections,
  updateDetectionStatus
} from "../services/detection.service.js";
import { emitDetectionCreated, emitDetectionStatusUpdated } from "../sockets/index.js";

export const getDetections = asyncHandler(async (req, res) => {
  const detections = await listDetections(req.query);

  return res.status(200).json(detections);
});

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await getDetectionSummary();

  return res.status(200).json({
    data: summary
  });
});

export const postDetection = asyncHandler(async (req, res) => {
  const detection = await createDetection(req.body, req.user.sub);
  const io = req.app.get("io");

  emitDetectionCreated(io, detection);

  return res.status(201).json({
    data: detection
  });
});

export const patchDetectionStatus = asyncHandler(async (req, res) => {
  const detection = await updateDetectionStatus(req.params.id, req.body.status);
  const io = req.app.get("io");

  emitDetectionStatusUpdated(io, detection);

  return res.status(200).json({
    data: detection
  });
});
