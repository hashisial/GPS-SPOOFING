import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getLiveMonitoringData, ingestGpsData } from "../../services/gps/gps.service.js";

export const ingestGpsDataHandler = asyncHandler(async (req, res) => {
  const result = await ingestGpsData(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
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
