import { mongoose } from "../utils/vendor.js";
import { DEVICE_STATUS, DEVICE_STATUS_VALUES, DEVICE_TYPE_VALUES } from "../constants/device.js";

const objectIdField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
};

const deviceSchema = new mongoose.Schema(
  {
    deviceName: {
      type: String,
      required: true,
      trim: true
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    imei: {
      type: String,
      trim: true,
      default: undefined,
      unique: true,
      sparse: true
    },
    serialNumber: {
      type: String,
      trim: true,
      default: undefined,
      unique: true,
      sparse: true
    },
    type: {
      type: String,
      enum: DEVICE_TYPE_VALUES,
      default: DEVICE_TYPE_VALUES[0],
      index: true
    },
    status: {
      type: String,
      enum: DEVICE_STATUS_VALUES,
      default: DEVICE_STATUS.OFFLINE,
      index: true
    },
    deviceApiKeyHash: {
      type: String,
      default: null,
      select: false
    },
    deviceApiKeyLastFour: {
      type: String,
      default: null
    },
    deviceApiKeyIssuedAt: {
      type: Date,
      default: null
    },
    owner: objectIdField,
    lastSeen: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: null
    },
    createdBy: objectIdField,
    updatedBy: objectIdField
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.hasDeviceApiKey = Boolean(ret.deviceApiKeyLastFour);
        delete ret.deviceApiKeyHash;
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.hasDeviceApiKey = Boolean(ret.deviceApiKeyLastFour);
        delete ret.deviceApiKeyHash;
        delete ret._id;
        return ret;
      }
    }
  }
);

deviceSchema.index({ owner: 1, status: 1 });
deviceSchema.index({ lastSeen: -1 });
deviceSchema.index({ deviceName: "text", deviceId: "text", notes: "text" });

export const DeviceModel = mongoose.models.Device || mongoose.model("Device", deviceSchema);

