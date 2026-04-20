import { bcrypt } from "../utils/vendor.js";
import { mongoose } from "../utils/vendor.js";
import { env } from "../config/env.js";
import { ROLE_VALUES, ROLES } from "../constants/roles.js";

const objectIdField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.VIEWER,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    blockedAt: {
      type: Date,
      default: null
    },
    blockedReason: {
      type: String,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false
    },
    preferences: {
      theme: {
        type: String,
        enum: ["dark", "light"],
        default: "dark"
      },
      notifications: {
        emailAlerts: {
          type: Boolean,
          default: true
        },
        inAppAlerts: {
          type: Boolean,
          default: true
        },
        soundAlerts: {
          type: Boolean,
          default: true
        },
        digestFrequency: {
          type: String,
          enum: ["OFF", "DAILY", "WEEKLY"],
          default: "DAILY"
        }
      },
      thresholds: {
        jumpDistanceKm: {
          type: Number,
          default: 15,
          min: 0
        },
        unrealisticSpeedKph: {
          type: Number,
          default: 320,
          min: 0
        },
        signalAnomalyScore: {
          type: Number,
          default: 70,
          min: 0,
          max: 100
        },
        accuracyThresholdM: {
          type: Number,
          default: 100,
          min: 0
        }
      }
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
        ret.isBlocked = !ret.isActive;
        delete ret._id;
        delete ret.password;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpiresAt;
        return ret;
      }
    },
    toObject: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.isBlocked = !ret.isActive;
        delete ret._id;
        delete ret.password;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpiresAt;
        return ret;
      }
    }
  }
);

userSchema.index({ name: 1 });
userSchema.index({ role: 1, isActive: 1 });

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);

  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }

  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasPasswordChangedAfter = function hasPasswordChangedAfter(jwtIssuedAt) {
  if (!this.passwordChangedAt || !jwtIssuedAt) {
    return false;
  }

  return this.passwordChangedAt.getTime() / 1000 > jwtIssuedAt;
};

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);


