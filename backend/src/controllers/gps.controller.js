import { asyncHandler } from "../utils/async-handler.js";
import { ingestGpsData, getGpsHistory, getLiveGpsFeed } from "../services/gps.service.js";
import { emitAlertCreated, emitGpsUpdated } from "../sockets/index.js";

export const postGpsData = asyncHandler(async (req, res) => {
  const result = await ingestGpsData(req.body);
  const io = req.app.get("io");
  emitGpsUpdated(io, {
    gpsLog: result.gpsLog,
    alert: result.alert
  });

  if (result.alert) {
    emitAlertCreated(io, result.alert);
  }

  return res.status(201).json({
    data: result
  });
});

export const getGpsLive = asyncHandler(async (req, res) => {
  const liveFeed = await getLiveGpsFeed(req.query);

  return res.status(200).json({
    data: liveFeed
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const history = await getGpsHistory(req.query);

  return res.status(200).json(history);
});
