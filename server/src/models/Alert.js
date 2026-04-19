import mongoose from "mongoose";
import {
  ALERT_ACTION_VALUES,
  ALERT_SEVERITY_VALUES,
  ALERT_STATUS,
  ALERT_STATUS_VALUES,
  SPOOFING_RULE_VALUES
} from "../constants/alert.js";

const findingSchema = new mongoose.Schema(
  {
    rule: {
      type: String,
      enum: SPOOFING_RULE_VALUES,
      required: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    _id: false
  }
);

const actionHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ALERT_ACTION_VALUES,
      required: true
    },
    note: {
      type: String,
      trim: true,
      default: null
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    actorRole: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const alertSchema = new mongoose.Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    deviceName: {
      type: String,
      required: true,
      trim: true
    },
    gpsLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GpsLog",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true
    },
    severity: {
      type: String,
      enum: ALERT_SEVERITY_VALUES,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ALERT_STATUS_VALUES,
      default: ALERT_STATUS.OPEN,
      index: true
    },
    escalationCount: {
      type: Number,
      default: 0,
      min: 0
    },
    escalatedAt: {
      type: Date,
      default: null
    },
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    findings: {
      type: [findingSchema],
      default: []
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    triggeredAt: {
      type: Date,
      required: true,
      index: true
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: null
    },
    falsePositiveAt: {
      type: Date,
      default: null
    },
    falsePositiveBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    falsePositiveReason: {
      type: String,
      trim: true,
      default: null
    },
    actionHistory: {
      type: [actionHistorySchema],
      default: []
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

alertSchema.index({ device: 1, triggeredAt: -1 });
alertSchema.index({ severity: 1, status: 1, triggeredAt: -1 });
alertSchema.index({ title: "text", message: "text", deviceId: "text", deviceName: "text" });
alertSchema.index({ gpsLog: 1 }, { unique: true });

export const AlertModel = mongoose.models.Alert || mongoose.model("Alert", alertSchema);
