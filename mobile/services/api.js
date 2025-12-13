// constants/api.js

import { debugFetch } from "@/utils/networkDebug";

// Base URL for your backend API (should include /api)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Log the API URL on app start
console.log("🚀 API Base URL configured:", API_BASE_URL);

if (!API_BASE_URL) {
  console.error("⚠️  WARNING: EXPO_PUBLIC_API_BASE_URL is not set!");
  console.error("⚠️  Please check your .env file");
}

/**
 * Generic API request handler with error handling
 *Implement this logic inside the following api_request
 *Generic API request handler with error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    // Remove leading slash from endpoint if present
    // const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1)
    //   : endpoint;
    const url = `${API_BASE_URL}/api/${endpoint}`;

    const data = await debugFetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    return data;
  } catch (error) {
    console.error(`❌ API Request Failed [${endpoint}]:`, error.message);
    throw error;
  }
};

// ==================== USER ENDPOINTS ====================

export const createUser = async (userData) => {
  return apiRequest("users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (userId, userData) => {
  return apiRequest(`users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (userId) => {
  return apiRequest(`users/${userId}`, {
    method: "DELETE",
  });
};

// ==================== BOARD ENDPOINTS ====================

export const getBoardsByUserId = async (userId) => {
  return apiRequest(`boards/${userId}`, {
    method: "GET",
  });
};

export const createBoard = async (boardData) => {
  return apiRequest("boards", {
    method: "POST",
    body: JSON.stringify(boardData),
  });
};

export const updateBoard = async (boardId, boardData) => {
  return apiRequest(`boards/${boardId}`, {
    method: "PATCH",
    body: JSON.stringify(boardData),
  });
};

export const deleteBoard = async (boardId) => {
  return apiRequest(`boards/${boardId}`, {
    method: "DELETE",
  });
};

export const addBoardMember = async (boardId, memberData) => {
  return apiRequest(`boards/${boardId}/members`, {
    method: "POST",
    body: JSON.stringify(memberData),
  });
};

export const removeBoardMember = async (boardId, userId) => {
  return apiRequest(`boards/${boardId}/members/${userId}`, {
    method: "DELETE",
  });
};

// ==================== TASK ENDPOINTS ====================

export const getTasksByBoardId = async (boardId) => {
  return apiRequest(`tasks/board/${boardId}`, {
    method: "GET",
  });
};

export const getTasksByUserId = async (userId) => {
  return apiRequest(`tasks/user/${userId}`, {
    method: "GET",
  });
};

export const createTask = async (taskData) => {
  return apiRequest("tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
  });
};

export const updateTask = async (taskId, taskData) => {
  return apiRequest(`tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(taskData),
  });
};

export const deleteTask = async (taskId) => {
  return apiRequest(`tasks/${taskId}`, {
    method: "DELETE",
  });
};

// ==================== HEALTH CHECK ====================

export const checkAPIHealth = async () => {
  return apiRequest("health", {
    method: "GET",
  });
};
