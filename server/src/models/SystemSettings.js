import mongoose from "mongoose";
import {
  DEFAULT_THRESHOLD_SETTINGS,
  SETTINGS_SCOPES
} from "../constants/settings.js";

const systemSettingsSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      required: true,
      unique: true,
      default: SETTINGS_SCOPES.GLOBAL
    },
    thresholds: {
      jumpDistanceKm: {
        type: Number,
        default: DEFAULT_THRESHOLD_SETTINGS.jumpDistanceKm,
        min: 0
      },
      unrealisticSpeedKph: {
        type: Number,
        default: DEFAULT_THRESHOLD_SETTINGS.unrealisticSpeedKph,
        min: 0
      },
      signalAnomalyScore: {
        type: Number,
        default: DEFAULT_THRESHOLD_SETTINGS.signalAnomalyScore,
        min: 0,
        max: 100
      },
      accuracyThresholdM: {
        type: Number,
        default: DEFAULT_THRESHOLD_SETTINGS.accuracyThresholdM,
        min: 0
      }
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const SystemSettingsModel =
  mongoose.models.SystemSettings ||
  mongoose.model("SystemSettings", systemSettingsSchema);
