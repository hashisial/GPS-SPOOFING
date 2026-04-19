import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { Roles } from "../constants/roles.js";
import { createHttpError } from "../utils/http-error.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    reportCount: user._count?.reports ?? 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function buildUserWhereClause(search) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        email: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        role: search.toUpperCase() === Roles.ADMIN ? Roles.ADMIN : undefined
      }
    ].filter(Boolean)
  };
}

export async function listUsers({ page = 1, pageSize = 10, search } = {}) {
  const pagination = getPagination(page, pageSize);
  const where = buildUserWhereClause(search);

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        _count: {
          select: {
            reports: true
          }
        }
      }
    })
  ]);

  return {
    data: users.map(serializeUser),
    pagination: buildPaginationMeta(total, pagination.page, pagination.pageSize)
  };
}

export async function createManagedUser(payload) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email
    }
  });

  if (existingUser) {
    throw createHttpError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role ?? Roles.USER,
      isActive: payload.isActive ?? true,
      notificationPreference: {
        create: {
          preferredEmail: payload.email
        }
      }
    },
    include: {
      _count: {
        select: {
          reports: true
        }
      }
    }
  });

  return serializeUser(user);
}

export async function updateManagedUser(userId, payload, actorUserId) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!existingUser) {
    throw createHttpError(404, "User not found.");
  }

  if (
    existingUser.id === actorUserId &&
    (payload.isActive === false || payload.role === Roles.USER)
  ) {
    throw createHttpError(400, "You cannot deactivate or demote your own admin account.");
  }

  if (
    existingUser.role === Roles.ADMIN &&
    (payload.isActive === false || payload.role === Roles.USER)
  ) {
    const activeAdminCount = await prisma.user.count({
      where: {
        role: Roles.ADMIN,
        isActive: true
      }
    });

    if (activeAdminCount <= 1) {
      throw createHttpError(400, "At least one active admin account must remain.");
    }
  }

  const updateData = {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.role !== undefined ? { role: payload.role } : {}),
    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {})
  };

  if (payload.password) {
    updateData.passwordHash = await bcrypt.hash(payload.password, 12);
  }

  const user = await prisma.user.update({
    where: {
      id: userId
    },
    data: updateData,
    include: {
      _count: {
        select: {
          reports: true
        }
      }
    }
  });

  return serializeUser(user);
}
