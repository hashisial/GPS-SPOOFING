import { asyncHandler } from "../utils/async-handler.js";
import {
  createManagedUser,
  listUsers,
  updateManagedUser
} from "../services/user.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await listUsers(req.query);

  return res.status(200).json(users);
});

export const postUser = asyncHandler(async (req, res) => {
  const user = await createManagedUser(req.body);

  return res.status(201).json({
    data: user
  });
});

export const patchUser = asyncHandler(async (req, res) => {
  const user = await updateManagedUser(req.params.id, req.body, req.user.sub);

  return res.status(200).json({
    data: user
  });
});
