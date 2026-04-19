import { UserModel } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";

function sanitizeUser(user) {
  return typeof user.toObject === "function" ? user.toObject() : user;
}

async function ensureProfile(userId) {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw ApiError.notFound("User profile not found");
  }

  return user;
}

export async function getProfile(userId) {
  const user = await ensureProfile(userId);
  return sanitizeUser(user);
}

export async function updateProfile(userId, payload) {
  const user = await ensureProfile(userId);

  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const existingUser = await UserModel.findOne({
      email: payload.email.toLowerCase(),
      _id: {
        $ne: user.id
      }
    });

    if (existingUser) {
      throw ApiError.conflict("A user with this email already exists");
    }

    user.email = payload.email.toLowerCase();
  }

  if (payload.name !== undefined) {
    user.name = payload.name;
  }

  user.updatedBy = user.id;
  await user.save();

  return sanitizeUser(user);
}
