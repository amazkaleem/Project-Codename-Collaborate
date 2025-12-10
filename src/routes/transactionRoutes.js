import express from "express";

import {
  deleteUser,
  deleteBoard,
  deleteTask,
  removeBoardMember,
} from "../controllers/deleteControllers.js";

import {
  getBoardsByUserId,
  getTasksByBoardId,
  getTasksByUserId,
} from "../controllers/getControllers.js";

import {
  patchUserByUserId,
  patchBoardByBoardId,
  patchTaskByTaskId,
} from "../controllers/patchControllers.js";

import {
  createUser,
  createBoard,
  createTask,
  addBoardMember,
} from "../controllers/postControllers.js";

// Import the middleware
import cleanClerkIdMiddleware from "../middleware/cleanClerkIdMiddleware.js";

// ------------------------------------------------------------------
// Helper Middleware to target only routes that need cleaning
// ------------------------------------------------------------------
const cleanUserId = (req, res, next) => {
  // Check if the parameter name is 'userId' and call the main cleaner
  if (req.params.userId) {
    return cleanClerkIdMiddleware(req, res, next);
  }
  next();
};

const router = express.Router();

// GET routes
router.get("/boards/:userId", cleanClerkIdMiddleware, getBoardsByUserId);
router.get("/tasks/board/:boardId", getTasksByBoardId);
router.get("/tasks/user/:userId", cleanClerkIdMiddleware, getTasksByUserId);

// POST routes
router.post("/users", createUser);
router.post("/boards", createBoard);
router.post("/tasks", createTask);
router.post("/boards/:boardId/members", addBoardMember);

// DELETE routes
router.delete("/users/:userId", cleanClerkIdMiddleware, deleteUser);
router.delete("/boards/:deleteId", deleteBoard);
router.delete("/tasks/:deleteId", deleteTask);
router.delete(
  "/boards/:boardId/members/:userId",
  cleanClerkIdMiddleware,
  removeBoardMember
);

// PATCH routes
router.patch("/users/:userId", cleanClerkIdMiddleware, patchUserByUserId);
router.patch("/boards/:boardId", patchBoardByBoardId);
router.patch("/tasks/:taskId", patchTaskByTaskId);

export default router;
