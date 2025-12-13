// hooks/useTasks.js

import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  getTasksByUserId,
  getTasksByBoardId,
  createTask,
  updateTask,
  deleteTask,
} from "@/services/api";

export const useTasks = (userId) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks assigned to the user
  const fetchUserTasks = useCallback(async () => {
    if (!userId) {
      console.log("⚠️  No userId provided to fetchUserTasks");
      return;
    }

    try {
      console.log("📥 Fetching tasks for userId:", userId);
      const data = await getTasksByUserId(userId);
      setTasks(data);
      console.log("✅ Tasks fetched:", data.length);
    } catch (error) {
      console.error("❌ Error fetching user tasks:", error);
      Alert.alert("Error", "Failed to fetch tasks");
    }
  }, [userId]);

  // Fetch tasks for a specific board
  const fetchBoardTasks = useCallback(async (boardId) => {
    if (!boardId) {
      console.log("⚠️  No boardId provided to fetchBoardTasks");
      return;
    }

    try {
      console.log("📥 Fetching tasks for boardId:", boardId);
      const data = await getTasksByBoardId(boardId);
      setTasks(data);
      console.log("✅ Tasks fetched:", data.length);
    } catch (error) {
      console.error("❌ Error fetching board tasks:", error);
      Alert.alert("Error", "Failed to fetch tasks");
    }
  }, []);

  // Load user tasks
  const loadData = useCallback(async () => {
    if (!userId) {
      console.log("⚠️  No userId, skipping loadData");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await fetchUserTasks();
    } catch (error) {
      console.error("❌ Error loading task data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserTasks, userId]);

  // Create a new task
  const createNewTask = async (taskData) => {
    try {
      console.log("📝 Creating task:", taskData);
      const newTask = await createTask({
        ...taskData,
        created_by: userId, // Add the creator's userId
      });
      console.log("✅ Task created:", newTask);

      // Refresh the tasks list
      await loadData();
      Alert.alert("Success", "Task created successfully");
      return newTask;
    } catch (error) {
      console.error("❌ Error creating task:", error);
      Alert.alert("Error", error.message || "Failed to create task");
      throw error;
    }
  };

  // Update a task
  const updateExistingTask = async (taskId, taskData) => {
    try {
      console.log("📝 Updating task:", taskId);
      const updatedTask = await updateTask(taskId, taskData);
      console.log("✅ Task updated:", updatedTask);

      // Refresh the tasks list
      await loadData();
      Alert.alert("Success", "Task updated successfully");
      return updatedTask;
    } catch (error) {
      console.error("❌ Error updating task:", error);
      Alert.alert("Error", error.message || "Failed to update task");
      throw error;
    }
  };

  // Delete a task
  const deleteExistingTask = async (taskId) => {
    try {
      console.log("🗑️  Deleting task:", taskId);
      await deleteTask(taskId);
      console.log("✅ Task deleted");

      // Refresh the tasks list
      await loadData();
      Alert.alert("Success", "Task deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      Alert.alert("Error", error.message || "Failed to delete task");
      throw error;
    }
  };

  return {
    tasks,
    isLoading,
    loadData,
    fetchBoardTasks,
    createNewTask,
    updateExistingTask,
    deleteExistingTask,
  };
};
