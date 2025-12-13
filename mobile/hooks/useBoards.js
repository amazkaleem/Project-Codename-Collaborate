// hooks/useBoards.js

import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  getBoardsByUserId,
  createBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember,
} from "@/services/api";

export const useBoards = (userId) => {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all boards for the user
  const fetchBoards = useCallback(async () => {
    if (!userId) {
      console.log("⚠️  No userId provided to fetchBoards");
      return;
    }

    try {
      console.log("📥 Fetching boards for userId:", userId);
      const data = await getBoardsByUserId(userId);
      setBoards(data);
      console.log("✅ Boards fetched:", data.length);
    } catch (error) {
      console.error("❌ Error fetching boards:", error);
      Alert.alert("Error", "Failed to fetch boards");
    }
  }, [userId]);

  // Load data
  const loadData = useCallback(async () => {
    if (!userId) {
      console.log("⚠️  No userId, skipping loadData");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await fetchBoards();
    } catch (error) {
      console.error("❌ Error loading board data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBoards, userId]);

  // Create a new board
  const createNewBoard = async (boardData) => {
    try {
      console.log("📝 Creating board:", boardData);
      const newBoard = await createBoard({
        ...boardData,
        created_by: userId, // Add the creator's userId
      });
      console.log("✅ Board created:", newBoard);

      // Refresh the boards list
      await loadData();
      Alert.alert("Success", "Board created successfully");
      return newBoard;
    } catch (error) {
      console.error("❌ Error creating board:", error);
      Alert.alert("Error", error.message || "Failed to create board");
      throw error;
    }
  };

  // Update a board
  const updateExistingBoard = async (boardId, boardData) => {
    try {
      console.log("📝 Updating board:", boardId);
      const updatedBoard = await updateBoard(boardId, boardData);
      console.log("✅ Board updated:", updatedBoard);

      // Refresh the boards list
      await loadData();
      Alert.alert("Success", "Board updated successfully");
      return updatedBoard;
    } catch (error) {
      console.error("❌ Error updating board:", error);
      Alert.alert("Error", error.message || "Failed to update board");
      throw error;
    }
  };

  // Delete a board
  const deleteExistingBoard = async (boardId) => {
    try {
      console.log("🗑️  Deleting board:", boardId);
      await deleteBoard(boardId);
      console.log("✅ Board deleted");

      // Refresh the boards list
      await loadData();
      Alert.alert("Success", "Board deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting board:", error);
      Alert.alert("Error", error.message || "Failed to delete board");
      throw error;
    }
  };

  // Add a member to a board
  const addMember = async (boardId, memberData) => {
    try {
      console.log("👥 Adding member to board:", boardId);
      await addBoardMember(boardId, memberData);
      console.log("✅ Member added");

      // Refresh the boards list
      await loadData();
      Alert.alert("Success", "Member added successfully");
    } catch (error) {
      console.error("❌ Error adding member:", error);
      Alert.alert("Error", error.message || "Failed to add member");
      throw error;
    }
  };

  // Remove a member from a board
  const removeMember = async (boardId, memberId) => {
    try {
      console.log("👥 Removing member from board:", boardId);
      await removeBoardMember(boardId, memberId);
      console.log("✅ Member removed");

      // Refresh the boards list
      await loadData();
      Alert.alert("Success", "Member removed successfully");
    } catch (error) {
      console.error("❌ Error removing member:", error);
      Alert.alert("Error", error.message || "Failed to remove member");
      throw error;
    }
  };

  return {
    boards,
    isLoading,
    loadData,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    addMember,
    removeMember,
  };
};
