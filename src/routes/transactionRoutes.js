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
  getBoardMembers,
  getUserByClerkId,
  getAllBoards,
  getBoardsByBoardName, // Add this
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
  addBoardMemberByEmail,
} from "../controllers/postControllers.js";

const router = express.Router();

// GET routes
router.get("/boards/search", getBoardsByBoardName); // Add this - must come BEFORE /boards/:userId
router.get("/boards", getAllBoards);
router.get("/boards/:userId", getBoardsByUserId);
router.get("/tasks/board/:boardId", getTasksByBoardId);
router.get("/tasks/user/:userId", getTasksByUserId);
router.get("/boards/:boardId/members", getBoardMembers);
router.get("/users/:userId", getUserByClerkId);

// POST routes
router.post("/users", createUser);
router.post("/boards", createBoard);
router.post("/tasks", createTask);
router.post("/boards/:boardId/members", addBoardMemberByEmail);

// DELETE routes
router.delete("/users/:deleteId", deleteUser);
router.delete("/boards/:deleteId", deleteBoard);
router.delete("/tasks/:deleteId", deleteTask);
router.delete("/boards/:boardId/members/:userId", removeBoardMember);

// PATCH routes
router.patch("/users/:userId", patchUserByUserId);
router.patch("/boards/:boardId", patchBoardByBoardId);
router.patch("/tasks/:taskId", patchTaskByTaskId);

export default router;
