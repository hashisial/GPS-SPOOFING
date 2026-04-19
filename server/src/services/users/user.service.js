import { ROLES } from "../../constants/roles.js";
import { RefreshTokenModel } from "../../models/RefreshToken.js";
import { UserModel } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";

function sanitizeUser(user) {
  return typeof user.toObject === "function" ? user.toObject() : user;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchQuery(search) {
  if (!search) {
    return {};
  }

  const pattern = new RegExp(escapeRegExp(search), "i");

  return {
    $or: [
      { name: pattern },
      { email: pattern }
    ]
  };
}

async function ensureUserExists(userId, { includePassword = false } = {}) {
  const query = UserModel.findById(userId);

  if (includePassword) {
    query.select("+password");
  }

  const user = await query;

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
}

async function countActiveSuperAdmins(excludingUserId = null) {
  const query = {
    role: ROLES.SUPER_ADMIN,
    isActive: true
  };

  if (excludingUserId) {
    query._id = { $ne: excludingUserId };
  }

  return UserModel.countDocuments(query);
}

async function ensureSuperAdminSafety(user, patch = {}) {
  const nextRole = patch.role ?? user.role;
  const nextActiveState = patch.isActive ?? user.isActive;
  const isCurrentlyCritical = user.role === ROLES.SUPER_ADMIN && user.isActive;
  const remainsCritical = nextRole === ROLES.SUPER_ADMIN && nextActiveState === true;

  if (isCurrentlyCritical && !remainsCritical) {
    const remainingSuperAdmins = await countActiveSuperAdmins(user.id);

    if (remainingSuperAdmins === 0) {
      throw ApiError.badRequest("At least one active super admin must remain in the system");
    }
  }
}

async function revokeAllUserSessions(userId, reason) {
  await RefreshTokenModel.updateMany(
    {
      user: userId,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    }
  );
}

export async function listUsers(query = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const filters = {
    ...buildSearchQuery(query.search)
  };

  if (query.role) {
    filters.role = query.role;
  }

  if (query.status) {
    filters.isActive = query.status === "ACTIVE";
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = {
    [query.sortBy ?? "createdAt"]: sortDirection
  };

  const [items, total] = await Promise.all([
    UserModel.find(filters).sort(sort).skip(skip).limit(limit),
    UserModel.countDocuments(filters)
  ]);

  return {
    data: items.map((user) => sanitizeUser(user)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

export async function getUserById(userId) {
  const user = await ensureUserExists(userId);
  return sanitizeUser(user);
}

export async function createUser(payload, actor) {
  const email = payload.email.toLowerCase();

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const user = await UserModel.create({
    name: payload.name,
    email,
    password: payload.password,
    role: payload.role,
    createdBy: actor?.id ?? null,
    updatedBy: actor?.id ?? null
  });

  return sanitizeUser(user);
}

export async function updateUser(userId, payload, actor) {
  const user = await ensureUserExists(userId, {
    includePassword: Boolean(payload.password)
  });
  const shouldRevokeSessions = Boolean(payload.password);

  if (actor?.id === user.id && payload.role && payload.role !== user.role) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  await ensureSuperAdminSafety(user, {
    role: payload.role
  });

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

  if (payload.name) {
    user.name = payload.name;
  }

  if (payload.role) {
    user.role = payload.role;
  }

  if (payload.password) {
    user.password = payload.password;
  }

  user.updatedBy = actor?.id ?? null;
  await user.save();

  if (shouldRevokeSessions) {
    await revokeAllUserSessions(user.id, "password-updated-by-admin");
  }

  return sanitizeUser(user);
}

export async function blockUser(userId, payload, actor) {
  const user = await ensureUserExists(userId);

  if (actor?.id === user.id) {
    throw ApiError.badRequest("You cannot block your own account");
  }

  await ensureSuperAdminSafety(user, {
    isActive: false
  });

  user.isActive = false;
  user.blockedAt = new Date();
  user.blockedReason = payload.reason ?? "Blocked by administrator";
  user.updatedBy = actor?.id ?? null;
  await user.save();

  await revokeAllUserSessions(user.id, "user-blocked");

  return sanitizeUser(user);
}

export async function unblockUser(userId, actor) {
  const user = await ensureUserExists(userId);

  user.isActive = true;
  user.blockedAt = null;
  user.blockedReason = null;
  user.updatedBy = actor?.id ?? null;
  await user.save();

  return sanitizeUser(user);
}

export async function deleteUser(userId, actor) {
  const user = await ensureUserExists(userId);

  if (actor?.id === user.id) {
    throw ApiError.badRequest("You cannot delete your own account");
  }

  await ensureSuperAdminSafety(user, {
    role: null,
    isActive: false
  });

  await revokeAllUserSessions(user.id, "user-deleted");
  await UserModel.deleteOne({ _id: user.id });

  return {
    id: user.id
  };
}
