import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import {
  getBoardsByUserId,
  getTasksByBoardId,
  updateBoard,
  deleteBoard,
  createTask,
  updateTask,
  deleteTask,
} from "@/services/api";

const TASK_STATUSES = ["To-Do", "In-Progress", "In-Review", "Done"];

export default function BoardDetailScreen() {
  const router = useRouter();
  const { id: boardId } = useLocalSearchParams();
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // New task modal state
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("To-Do");

  // Load board and tasks
  const loadBoardData = async () => {
    if (!userId || !boardId) return;

    try {
      console.log("📥 Loading board data:", boardId);

      // Fetch all user's boards to find this specific board
      const userBoards = await getBoardsByUserId(userId);
      const currentBoard = userBoards.find((b) => b.board_id === boardId);

      if (!currentBoard) {
        Alert.alert("Error", "Board not found");
        router.back();
        return;
      }

      setBoard(currentBoard);
      setBoardName(currentBoard.board_name);
      setBoardDescription(currentBoard.description || "");

      // Fetch tasks for this board
      const boardTasks = await getTasksByBoardId(boardId);
      setTasks(boardTasks);

      console.log("✅ Board loaded:", currentBoard.board_name);
      console.log("✅ Tasks loaded:", boardTasks.length);
    } catch (error) {
      console.error("❌ Error loading board:", error);
      Alert.alert("Error", "Failed to load board data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [userId, boardId]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadBoardData();
    setRefreshing(false);
  };

  // Update board details
  const handleUpdateBoard = async () => {
    if (!boardName.trim()) {
      return Alert.alert("Error", "Board name cannot be empty");
    }

    if (boardName.length > 100) {
      return Alert.alert("Error", "Board name must not exceed 100 characters");
    }

    setIsUpdating(true);
    try {
      console.log("📝 Updating board:", { boardName, boardDescription });

      await updateBoard(boardId, {
        board_name: boardName.trim(),
        description: boardDescription.trim() || null,
      });

      Alert.alert("Success", "Board updated successfully");
      setIsEditingBoard(false);
      await loadBoardData();
    } catch (error) {
      console.error("❌ Error updating board:", error);
      Alert.alert("Error", error.message || "Failed to update board");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete board
  const handleDeleteBoard = () => {
    Alert.alert(
      "Delete Board",
      "Are you sure you want to delete this board? All tasks will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🗑️ Deleting board:", boardId);
              await deleteBoard(boardId);
              Alert.alert("Success", "Board deleted successfully");
              router.back();
            } catch (error) {
              console.error("❌ Error deleting board:", error);
              Alert.alert("Error", error.message || "Failed to delete board");
            }
          },
        },
      ]
    );
  };

  // Create new task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      return Alert.alert("Error", "Task title cannot be empty");
    }

    try {
      console.log("📝 Creating task:", {
        title: newTaskTitle,
        status: newTaskStatus,
      });

      await createTask({
        title: newTaskTitle.trim(),
        boardId: boardId,
        created_by: userId,
        status: newTaskStatus,
        description: null,
        assigned_to: null,
        due_date: null,
        tags: null,
      });

      setNewTaskTitle("");
      setNewTaskStatus("To-Do");
      setShowNewTaskInput(false);
      await loadBoardData();
    } catch (error) {
      console.error("❌ Error creating task:", error);
      Alert.alert("Error", error.message || "Failed to create task");
    }
  };

  // Update task status (drag & drop simulation)
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      console.log("📝 Updating task status:", { taskId, newStatus });

      await updateTask(taskId, { status: newStatus });

      // Update local state immediately for better UX
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.task_id === taskId ? { ...task, status: newStatus } : task
        )
      );

      console.log("✅ Task status updated");
    } catch (error) {
      console.error("❌ Error updating task:", error);
      Alert.alert("Error", error.message || "Failed to update task status");
      // Reload to sync state
      await loadBoardData();
    }
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🗑️ Deleting task:", taskId);
            await deleteTask(taskId);
            await loadBoardData();
          } catch (error) {
            console.error("❌ Error deleting task:", error);
            Alert.alert("Error", error.message || "Failed to delete task");
          }
        },
      },
    ]);
  };

  // Navigate to members screen
  const handleManageMembers = () => {
    router.push(`/board/${boardId}/members`);
  };

  // Show loading
  if (!isLoaded || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textLight }}>
          Loading board...
        </Text>
      </View>
    );
  }

  if (!board) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={COLORS.textLight}
        />
        <Text style={{ fontSize: 18, color: COLORS.text, marginTop: 16 }}>
          Board not found
        </Text>
      </View>
    );
  }

  // Check if user is board owner
  const isOwner = board.created_by === userId;

  // Group tasks by status
  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* HEADER */}
      <View
        style={{
          backgroundColor: COLORS.white,
          paddingTop: 20,
          paddingBottom: 15,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {isEditingBoard ? (
            <TextInput
              style={{
                flex: 1,
                fontSize: 20,
                fontWeight: "bold",
                color: COLORS.text,
                backgroundColor: COLORS.background,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              value={boardName}
              onChangeText={setBoardName}
              placeholder="Board name"
              placeholderTextColor={COLORS.textLight}
            />
          ) : (
            <Text
              style={{
                flex: 1,
                fontSize: 20,
                fontWeight: "bold",
                color: COLORS.text,
              }}
            >
              {board.board_name}
            </Text>
          )}

          {isOwner && !isEditingBoard && (
            <TouchableOpacity
              onPress={() => setIsEditingBoard(true)}
              style={{ marginLeft: 10 }}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}

          {isEditingBoard && (
            <View style={{ flexDirection: "row", marginLeft: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsEditingBoard(false);
                  setBoardName(board.board_name);
                  setBoardDescription(board.description || "");
                }}
                style={{ marginRight: 10 }}
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateBoard}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name="checkmark-outline"
                    size={24}
                    color={COLORS.boardTitle}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditingBoard ? (
          <TextInput
            style={{
              fontSize: 14,
              color: COLORS.textLight,
              backgroundColor: COLORS.background,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 10,
            }}
            value={boardDescription}
            onChangeText={setBoardDescription}
            placeholder="Board description"
            placeholderTextColor={COLORS.textLight}
            multiline
          />
        ) : (
          board.description && (
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textLight,
                marginBottom: 10,
              }}
            >
              {board.description}
            </Text>
          )
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 5,
          }}
        >
          <View style={{ flexDirection: "row", gap: 15 }}>
            <TouchableOpacity
              onPress={handleManageMembers}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={COLORS.textLight}
              />
              <Text
                style={{ fontSize: 12, color: COLORS.textLight, marginLeft: 5 }}
              >
                {board.member_count}{" "}
                {board.member_count === 1 ? "member" : "members"}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="checkbox-outline"
                size={16}
                color={COLORS.textLight}
              />
              <Text
                style={{ fontSize: 12, color: COLORS.textLight, marginLeft: 5 }}
              >
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </Text>
            </View>
          </View>

          {isOwner && (
            <TouchableOpacity onPress={handleDeleteBoard}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* KANBAN BOARD */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {TASK_STATUSES.map((status) => (
          <View
            key={status}
            style={{
              width: 280,
              marginRight: 15,
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 15,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            {/* Column Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 10,
                borderBottomWidth: 2,
                borderBottomColor:
                  status === "Done"
                    ? "#22c55e"
                    : status === "In-Progress"
                    ? "#3b82f6"
                    : status === "In-Review"
                    ? "#f59e0b"
                    : COLORS.textLight,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}
              >
                {status}
              </Text>
              <View
                style={{
                  backgroundColor: COLORS.background,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: COLORS.text,
                  }}
                >
                  {tasksByStatus[status].length}
                </Text>
              </View>
            </View>

            {/* Tasks List */}
            <ScrollView
              style={{ maxHeight: 500 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {tasksByStatus[status].map((task) => (
                <View
                  key={task.task_id}
                  style={{
                    backgroundColor: COLORS.background,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: COLORS.text,
                      marginBottom: 8,
                    }}
                  >
                    {task.title}
                  </Text>

                  {task.description && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: COLORS.textLight,
                        marginBottom: 8,
                      }}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  )}

                  {task.due_date && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={COLORS.textLight}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: COLORS.textLight,
                          marginLeft: 5,
                        }}
                      >
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 5,
                        marginBottom: 8,
                      }}
                    >
                      {task.tags.map((tag, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: COLORS.primary,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: COLORS.white,
                              fontWeight: "600",
                            }}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Task Actions */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: COLORS.border,
                    }}
                  >
                    {/* Move Status Buttons */}
                    <View style={{ flexDirection: "row", gap: 5 }}>
                      {status !== "To-Do" && (
                        <TouchableOpacity
                          onPress={() => {
                            const currentIndex = TASK_STATUSES.indexOf(status);
                            handleTaskStatusChange(
                              task.task_id,
                              TASK_STATUSES[currentIndex - 1]
                            );
                          }}
                          style={{
                            backgroundColor: COLORS.white,
                            padding: 6,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                          }}
                        >
                          <Ionicons
                            name="arrow-back"
                            size={14}
                            color={COLORS.text}
                          />
                        </TouchableOpacity>
                      )}
                      {status !== "Done" && (
                        <TouchableOpacity
                          onPress={() => {
                            const currentIndex = TASK_STATUSES.indexOf(status);
                            handleTaskStatusChange(
                              task.task_id,
                              TASK_STATUSES[currentIndex + 1]
                            );
                          }}
                          style={{
                            backgroundColor: COLORS.white,
                            padding: 6,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                          }}
                        >
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={COLORS.text}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => handleDeleteTask(task.task_id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add Task Button */}
              {status === "To-Do" && !showNewTaskInput && (
                <TouchableOpacity
                  onPress={() => {
                    setShowNewTaskInput(true);
                    setNewTaskStatus(status);
                  }}
                  style={{
                    backgroundColor: COLORS.background,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderStyle: "dashed",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="add" size={20} color={COLORS.textLight} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.textLight,
                      marginTop: 5,
                    }}
                  >
                    Add Task
                  </Text>
                </TouchableOpacity>
              )}

              {/* New Task Input */}
              {showNewTaskInput && status === newTaskStatus && (
                <View
                  style={{
                    backgroundColor: COLORS.background,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: COLORS.primary,
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 14,
                      color: COLORS.text,
                      marginBottom: 10,
                      backgroundColor: COLORS.white,
                      padding: 8,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                    placeholder="Task title..."
                    placeholderTextColor={COLORS.textLight}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    autoFocus
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={handleCreateTask}
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.primary,
                        padding: 8,
                        borderRadius: 6,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.white,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        Add
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowNewTaskInput(false);
                        setNewTaskTitle("");
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.white,
                        padding: 8,
                        borderRadius: 6,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.text,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
