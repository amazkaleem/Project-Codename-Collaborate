import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { colors: COLORS } = useTheme();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // With these two lines:
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [movingDirection, setMovingDirection] = useState(null); // 'forward' or 'backward'

  // Enhanced task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(null);
  const [taskLabels, setTaskLabels] = useState("");
  const [taskStatus, setTaskStatus] = useState("To-Do");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  //There was another error with creating/updating tasks because Claude Ai
  //had modified the previous working version
  //This time the error came with the following:
  //const [taskDueDate, setTaskDueDate] = useState("");
  //The "due_date "TIMESTAMP WITH TIME ZONE" field of the database cannot
  //be set an empty string. It can either be set a timestamp or a null. Hence,
  //throwing an "Internal Server Error" upon an empty string

  // Load board and tasks
  const loadBoardData = async () => {
    if (!userId || !boardId) return;

    try {
      console.log("📥 Loading board data:", boardId);

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

  // Open task modal for creation
  const openCreateTaskModal = (status = "To-Do") => {
    setIsEditingTask(false);
    setCurrentTaskId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskAssignee("");
    setTaskDueDate(null);
    setTaskLabels("");
    setTaskStatus("To-Do"); // Always default to "To-Do" for new tasks
    setShowTaskModal(true);
  };

  // Open task modal for editing
  const openEditTaskModal = (task) => {
    setIsEditingTask(true);
    setCurrentTaskId(task.task_id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskAssignee(task.assigned_to || "");
    setTaskDueDate(task.due_date || null);
    setTaskLabels(task.tags ? task.tags.join(", ") : "");
    setTaskStatus(task.status);
    setShowTaskModal(true);
  };

  // Close task modal
  const closeTaskModal = () => {
    setShowTaskModal(false);
    setIsEditingTask(false);
    setCurrentTaskId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskAssignee("");
    setTaskDueDate(null);
    setTaskLabels("");
    setTaskStatus("To-Do");
  };

  // Create or update task
  const handleSaveTask = async () => {
    if (!taskTitle.trim()) {
      return Alert.alert("Error", "Task title is required");
    }

    if (taskTitle.length > 255) {
      return Alert.alert("Error", "Task title must not exceed 255 characters");
    }

    // Parse labels
    const tagsArray = taskLabels
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    setIsCreatingTask(true);
    try {
      if (isEditingTask && currentTaskId) {
        // Update existing task
        console.log("📝 Updating task:", currentTaskId);
        const updateData = {
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          assigned_to: taskAssignee.trim() || null,
          due_date: taskDueDate,
          tags: tagsArray.length > 0 ? tagsArray : null,
          status: taskStatus,
        };
        await updateTask(currentTaskId, updateData);
        Alert.alert("Success", "Task updated successfully");
      } else {
        // Create new task
        console.log("📝 Creating task");
        await createTask({
          title: taskTitle.trim(),
          boardId: boardId,
          created_by: userId,
          status: taskStatus,
          description: taskDescription.trim(),
          assigned_to: taskAssignee.trim() || null,
          due_date: taskDueDate,
          tags: tagsArray,
        });
        Alert.alert("Success", "Task created successfully");
      }

      closeTaskModal();
      await loadBoardData();
    } catch (error) {
      console.error("❌ Error saving task:", error);
      Alert.alert(
        "Error",
        error.message || `Failed to ${isEditingTask ? "update" : "create"} task`
      );
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Update task status with loading state
  const handleTaskStatusChange = async (taskId, newStatus, direction) => {
    setMovingTaskId(taskId); // Set loading state
    setMovingDirection(direction); // Set direction ('forward' or 'backward')
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
    } finally {
      setMovingTaskId(null); // Clear loading state
      setMovingDirection(null); // Clear direction
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

  const isOwner = board.created_by === userId;
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

        {/* BOARD DESCRIPTION */}
        {isEditingBoard ? (
          <TextInput
            style={{
              fontSize: 14,
              color: COLORS.text,
              backgroundColor: COLORS.background,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 10,
              minHeight: 60,
              textAlignVertical: "top",
            }}
            value={boardDescription}
            onChangeText={setBoardDescription}
            placeholder="Board description (optional)"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
          />
        ) : (
          <>
            {board.description ? (
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textLight,
                  marginBottom: 10,
                  lineHeight: 20,
                }}
              >
                {board.description}
              </Text>
            ) : null}
          </>
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

          {/* Action Buttons on Right */}
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            {/* Team Members Icon */}
            <TouchableOpacity onPress={handleManageMembers}>
              <Ionicons
                name="people-outline"
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            {/* Delete Board Icon (only for owner) */}
            {isOwner && (
              <TouchableOpacity onPress={handleDeleteBoard}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
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
                <TouchableOpacity
                  key={task.task_id}
                  onPress={() => openEditTaskModal(task)}
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
                          onPress={(e) => {
                            e.stopPropagation();
                            const currentIndex = TASK_STATUSES.indexOf(status);
                            handleTaskStatusChange(
                              task.task_id,
                              TASK_STATUSES[currentIndex - 1],
                              "backward"
                            );
                          }}
                          disabled={movingTaskId === task.task_id}
                          style={{
                            backgroundColor: COLORS.white,
                            padding: 6,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            opacity: movingTaskId === task.task_id ? 0.6 : 1,
                          }}
                        >
                          {movingTaskId === task.task_id &&
                          movingDirection === "backward" ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.text}
                            />
                          ) : (
                            <Ionicons
                              name="arrow-back"
                              size={14}
                              color={COLORS.text}
                            />
                          )}
                        </TouchableOpacity>
                      )}
                      {status !== "Done" && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            const currentIndex = TASK_STATUSES.indexOf(status);
                            handleTaskStatusChange(
                              task.task_id,
                              TASK_STATUSES[currentIndex + 1],
                              "forward"
                            );
                          }}
                          disabled={movingTaskId === task.task_id}
                          style={{
                            backgroundColor: COLORS.white,
                            padding: 6,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            opacity: movingTaskId === task.task_id ? 0.6 : 1,
                          }}
                        >
                          {movingTaskId === task.task_id &&
                          movingDirection === "forward" ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.text}
                            />
                          ) : (
                            <Ionicons
                              name="arrow-forward"
                              size={14}
                              color={COLORS.text}
                            />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.task_id);
                      }}
                      disabled={movingTaskId === task.task_id}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Add Task Button */}
              {status === "To-Do" && (
                <TouchableOpacity
                  onPress={() => openCreateTaskModal(status)}
                  style={{
                    backgroundColor: COLORS.background,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderStyle: "dashed",
                    alignItems: "center",
                    marginTop: 5,
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
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* ENHANCED TASK MODAL */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeTaskModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 20,
              maxHeight: "90%",
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text }}
              >
                {isEditingTask ? "Edit Task" : "Create New Task"}
              </Text>
              <TouchableOpacity onPress={closeTaskModal}>
                <Ionicons name="close" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Task Title */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: COLORS.text,
                    marginBottom: 8,
                    fontWeight: "600",
                  }}
                >
                  Task Title *
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.background,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 15,
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={COLORS.textLight}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 15,
                      paddingHorizontal: 10,
                      fontSize: 16,
                      color: COLORS.text,
                    }}
                    placeholder="Enter task title"
                    placeholderTextColor={COLORS.textLight}
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    maxLength={255}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: COLORS.text,
                    marginBottom: 8,
                    fontWeight: "600",
                  }}
                >
                  Description
                </Text>
                <View
                  style={{
                    backgroundColor: COLORS.background,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: COLORS.text,
                      minHeight: 100,
                      textAlignVertical: "top",
                    }}
                    placeholder="Add task description..."
                    placeholderTextColor={COLORS.textLight}
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Assignee & Due Date Row */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                {/* Assignee */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.text,
                      marginBottom: 8,
                      fontWeight: "600",
                    }}
                  >
                    Assignee
                  </Text>
                  <View
                    style={{
                      backgroundColor: COLORS.background,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      paddingHorizontal: 12,
                    }}
                  >
                    <TextInput
                      style={{
                        paddingVertical: 12,
                        fontSize: 14,
                        color: COLORS.text,
                      }}
                      placeholder="Select member"
                      placeholderTextColor={COLORS.textLight}
                      value={taskAssignee}
                      onChangeText={setTaskAssignee}
                    />
                  </View>
                </View>

                {/* Due Date */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.text,
                      marginBottom: 8,
                      fontWeight: "600",
                    }}
                  >
                    Due Date
                  </Text>
                  <View
                    style={{
                      backgroundColor: COLORS.background,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      paddingHorizontal: 12,
                    }}
                  >
                    <TextInput
                      style={{
                        paddingVertical: 12,
                        fontSize: 14,
                        color: COLORS.text,
                      }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORS.textLight}
                      value={taskDueDate}
                      onChangeText={setTaskDueDate}
                    />
                  </View>
                </View>
              </View>

              {/* Labels */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: COLORS.text,
                    marginBottom: 8,
                    fontWeight: "600",
                  }}
                >
                  Labels
                </Text>
                <View
                  style={{
                    backgroundColor: COLORS.background,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 15,
                  }}
                >
                  <TextInput
                    style={{
                      paddingVertical: 15,
                      fontSize: 16,
                      color: COLORS.text,
                    }}
                    placeholder="Add labels (comma separated)"
                    placeholderTextColor={COLORS.textLight}
                    value={taskLabels}
                    onChangeText={setTaskLabels}
                  />
                </View>
              </View>

              {/* Status - Only show when editing */}
              {isEditingTask && (
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.text,
                      marginBottom: 8,
                      fontWeight: "600",
                    }}
                  >
                    Status
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {TASK_STATUSES.map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() => setTaskStatus(status)}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor:
                            taskStatus === status
                              ? COLORS.primary
                              : COLORS.background,
                          borderWidth: 1,
                          borderColor:
                            taskStatus === status
                              ? COLORS.primary
                              : COLORS.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color:
                              taskStatus === status
                                ? COLORS.white
                                : COLORS.text,
                          }}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={closeTaskModal}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.background,
                    paddingVertical: 15,
                    borderRadius: 8,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.text,
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveTask}
                  disabled={isCreatingTask || !taskTitle.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: !taskTitle.trim()
                      ? COLORS.textLight
                      : COLORS.primary,
                    paddingVertical: 15,
                    borderRadius: 8,
                    alignItems: "center",
                    opacity: isCreatingTask ? 0.6 : 1,
                  }}
                >
                  {isCreatingTask ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text
                      style={{
                        color: COLORS.white,
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                    >
                      {isEditingTask ? "Update Task" : "Create Task"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
