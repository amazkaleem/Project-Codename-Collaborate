import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { useBoards } from "@/hooks/useBoards";
import { useTasks } from "@/hooks/useTasks";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { getUserByClerkId } from "@/services/api";

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const { colors: COLORS } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [dbUsername, setDbUsername] = useState("");

  // Create board modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Use custom hooks
  const {
    boards,
    isLoading: boardsLoading,
    loadData: loadBoards,
    createNewBoard,
  } = useBoards(userId);
  const {
    tasks,
    isLoading: tasksLoading,
    loadData: loadTasks,
  } = useTasks(userId);

  // Load data when component mounts
  useEffect(() => {
    if (userId) {
      console.log("🔄 Loading home data for user:", userId);
      loadBoards();
      loadTasks();
    }
  }, [userId, loadBoards, loadTasks]);

  // Load database username
  useEffect(() => {
    const loadUsername = async () => {
      if (userId) {
        try {
          const dbUser = await getUserByClerkId(userId);
          if (dbUser && dbUser.username) {
            setDbUsername(dbUser.username);
          }
        } catch (error) {
          console.error("Error loading username:", error);
        }
      }
    };

    loadUsername();
  }, [userId]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBoards(), loadTasks()]);
    setRefreshing(false);
  };

  // Handle create board
  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      return Alert.alert("Error", "Please enter a board name");
    }

    if (newBoardName.length > 100) {
      return Alert.alert("Error", "Board name must not exceed 100 characters");
    }

    setIsCreating(true);
    try {
      console.log("📝 Creating board:", {
        boardName: newBoardName,
        description: newBoardDescription,
      });

      await createNewBoard({
        board_name: newBoardName.trim(),
        description: newBoardDescription.trim() || null,
        created_by: userId,
      });

      // Clear form and close modal
      setNewBoardName("");
      setNewBoardDescription("");
      setShowCreateModal(false);

      // Success feedback is already handled by the hook
    } catch (error) {
      console.error("❌ Error creating board:", error);
      // Error alert is already handled by the hook
    } finally {
      setIsCreating(false);
    }
  };

  // Navigate to board detail
  const handleBoardPress = (boardId) => {
    router.push(`/board/${boardId}`);
  };

  // Show loading if Clerk hasn't loaded yet
  if (
    !isLoaded ||
    (boardsLoading && !boards.length) ||
    (tasksLoading && !tasks.length)
  ) {
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
          Loading...
        </Text>
      </View>
    );
  }

  // Get tasks due soon (within 7 days)
  const upcomingTasks = tasks
    .filter((task) => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const today = new Date();
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 14, color: COLORS.textLight }}>
              Welcome back,
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: COLORS.text,
                marginTop: 2,
              }}
            >
              {dbUsername ||
                user?.emailAddresses[0]?.emailAddress.split("@")[0] ||
                "User"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{
              backgroundColor: COLORS.createBoardButton,
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text
              style={{ color: COLORS.white, fontWeight: "600", marginLeft: 5 }}
            >
              New Board
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <>

            {/* UPCOMING TASKS SECTION */}
            {upcomingTasks.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={COLORS.text} />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: COLORS.text,
                      marginLeft: 8,
                    }}
                  >
                    Due Soon
                  </Text>
                </View>
                {upcomingTasks.map((task) => (
                  <TouchableOpacity
                    key={task.task_id}
                    onPress={() => handleBoardPress(task.board_id)}
                    style={{
                      backgroundColor: COLORS.white,
                      padding: 15,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: COLORS.text,
                      }}
                    >
                      {task.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor:
                            task.status === "Done"
                              ? "#22c55e"
                              : task.status === "In-Progress"
                              ? "#3b82f6"
                              : "#f59e0b",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: COLORS.white,
                            fontWeight: "600",
                          }}
                        >
                          {task.status}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.textLight,
                          marginLeft: 10,
                        }}
                      >
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* MY BOARDS SECTION HEADER */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="grid-outline" size={20} color={COLORS.text} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: COLORS.text,
                  marginLeft: 8,
                }}
              >
                My Boards
              </Text>
            </View>
          </>
        }
        data={boards}
        keyExtractor={(item) => item.board_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleBoardPress(item.board_id)}
            style={{
              backgroundColor: COLORS.white,
              padding: 18,
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              shadowColor: COLORS.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: COLORS.text,
                  }}
                >
                  {item.board_name}
                </Text>
                {item.description && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.textLight,
                      marginTop: 4,
                    }}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textLight}
              />
            </View>

            <View style={{ flexDirection: "row", marginTop: 12, gap: 15 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={COLORS.textLight}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textLight,
                    marginLeft: 5,
                  }}
                >
                  {item.member_count}{" "}
                  {item.member_count === 1 ? "member" : "members"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="checkbox-outline"
                  size={16}
                  color={COLORS.textLight}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textLight,
                    marginLeft: 5,
                  }}
                >
                  {item.task_count} {item.task_count === 1 ? "task" : "tasks"}
                </Text>
              </View>
            </View>

            <Text
              style={{ fontSize: 11, color: COLORS.textLight, marginTop: 8 }}
            >
              Updated {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons
              name="clipboard-outline"
              size={64}
              color={COLORS.textLight}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: COLORS.text,
                marginTop: 16,
              }}
            >
              No Boards Yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textLight,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Create your first board to start organizing tasks
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                marginTop: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: "600",
                  marginLeft: 8,
                }}
              >
                Create Board
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* CREATE BOARD MODAL */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
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
              maxHeight: "80%",
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
                Create New Board
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* Board Name Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.text,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                Board Name *
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
                  name="clipboard-outline"
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
                  placeholder="Enter board name"
                  placeholderTextColor={COLORS.textLight}
                  value={newBoardName}
                  onChangeText={setNewBoardName}
                  maxLength={100}
                  autoFocus
                />
              </View>
              <Text
                style={{ fontSize: 12, color: COLORS.textLight, marginTop: 5 }}
              >
                {newBoardName.length}/100 characters
              </Text>
            </View>

            {/* Description Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.text,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                Description (Optional)
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
                  placeholder="Add a description for this board..."
                  placeholderTextColor={COLORS.textLight}
                  value={newBoardDescription}
                  onChangeText={setNewBoardDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setNewBoardName("");
                  setNewBoardDescription("");
                  setShowCreateModal(false);
                }}
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
                onPress={handleCreateBoard}
                disabled={isCreating || !newBoardName.trim()}
                style={{
                  flex: 1,
                  backgroundColor: !newBoardName.trim()
                    ? COLORS.textLight
                    : COLORS.primary,
                  paddingVertical: 15,
                  borderRadius: 8,
                  alignItems: "center",
                  opacity: isCreating ? 0.6 : 1,
                }}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text
                    style={{
                      color: COLORS.white,
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Create Board
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
