import mongoose from "mongoose";

const gpsLogSchema = new mongoose.Schema(
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
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    speed: {
      type: Number,
      required: true,
      min: 0
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0
    },
    heading: {
      type: Number,
      required: true,
      min: 0,
      max: 360
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
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

gpsLogSchema.index({ device: 1, timestamp: -1 });
gpsLogSchema.index({ device: 1, receivedAt: -1 });

export const GpsLogModel = mongoose.models.GpsLog || mongoose.model("GpsLog", gpsLogSchema);
