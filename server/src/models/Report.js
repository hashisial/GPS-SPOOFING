import mongoose from "mongoose";
import { REPORT_TYPE_VALUES } from "../constants/report.js";

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: REPORT_TYPE_VALUES,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    periodStart: {
      type: Date,
      default: null,
      index: true
    },
    periodEnd: {
      type: Date,
      default: null,
      index: true
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      default: null,
      index: true
    },
    deviceId: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      index: true
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    lastExportedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    }
  }
);

reportSchema.index({ type: 1, createdAt: -1 });
reportSchema.index({ title: "text", deviceId: "text" });

export const ReportModel = mongoose.models.Report || mongoose.model("Report", reportSchema);
