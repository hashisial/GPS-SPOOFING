import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  blockUser,
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  unblockUser,
  updateUser
} from "../../services/users/user.service.js";

export const listUsersHandler = asyncHandler(async (req, res) => {
  const result = await listUsers(req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result
  });
});

export const getUserHandler = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.userId);

  res.status(StatusCodes.OK).json({
    success: true,
    user
  });
});

export const createUserHandler = asyncHandler(async (req, res) => {
  const user = await createUser(req.body, req.user);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User created successfully",
    user
  });
});

export const updateUserHandler = asyncHandler(async (req, res) => {
  const user = await updateUser(req.params.userId, req.body, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User updated successfully",
    user
  });
});

export const blockUserHandler = asyncHandler(async (req, res) => {
  const user = await blockUser(req.params.userId, req.body, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User blocked successfully",
    user
  });
});

export const unblockUserHandler = asyncHandler(async (req, res) => {
  const user = await unblockUser(req.params.userId, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User unblocked successfully",
    user
  });
});

export const deleteUserHandler = asyncHandler(async (req, res) => {
  const result = await deleteUser(req.params.userId, req.user);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User deleted successfully",
    result
  });
});
