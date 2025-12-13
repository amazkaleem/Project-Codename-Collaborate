import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import {
  getBoardsByUserId,
  addBoardMember,
  removeBoardMember,
} from "@/services/api";

export default function BoardMembersScreen() {
  const router = useRouter();
  const { id: boardId } = useLocalSearchParams();
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [isAdding, setIsAdding] = useState(false);

  // Load board and members
  const loadBoardMembers = async () => {
    if (!userId || !boardId) return;

    try {
      console.log("📥 Loading board members for board:", boardId);

      // Fetch all user's boards to find this specific board
      const userBoards = await getBoardsByUserId(userId);
      const currentBoard = userBoards.find((b) => b.board_id === boardId);

      if (!currentBoard) {
        Alert.alert("Error", "Board not found");
        router.back();
        return;
      }

      setBoard(currentBoard);

      // Note: In a real implementation, you would fetch the actual member list
      // from a dedicated endpoint. For now, we'll show a placeholder message.
      // The backend supports this via board_members table, but we need a GET endpoint.

      // Mock members data structure (replace with actual API call when endpoint exists)
      setMembers([
        {
          user_id: currentBoard.created_by,
          role: "admin",
          email: user?.emailAddresses[0]?.emailAddress || "Unknown",
          joined_at: currentBoard.created_at || new Date().toISOString(),
        },
      ]);

      console.log("✅ Board members loaded");
    } catch (error) {
      console.error("❌ Error loading board members:", error);
      Alert.alert("Error", "Failed to load board members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoardMembers();
  }, [userId, boardId]);

  // Add member
  const handleAddMember = async () => {
    if (!newMemberUserId.trim()) {
      return Alert.alert("Error", "Please enter a valid user ID");
    }

    // Basic UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newMemberUserId.trim())) {
      return Alert.alert("Error", "Invalid user ID format");
    }

    setIsAdding(true);
    try {
      console.log("➕ Adding member:", {
        userId: newMemberUserId,
        role: newMemberRole,
      });

      await addBoardMember(boardId, {
        user_id: newMemberUserId.trim(),
        role: newMemberRole,
      });

      Alert.alert("Success", "Member added successfully");
      setNewMemberUserId("");
      setNewMemberRole("member");
      setShowAddMember(false);
      await loadBoardMembers();
    } catch (error) {
      console.error("❌ Error adding member:", error);
      Alert.alert("Error", error.message || "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  // Remove member
  const handleRemoveMember = (memberId, memberEmail) => {
    // Prevent removing yourself if you're the only member
    if (members.length === 1) {
      return Alert.alert(
        "Cannot Remove",
        "You cannot remove the last member from the board"
      );
    }

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberEmail} from this board?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("➖ Removing member:", memberId);

              await removeBoardMember(boardId, memberId);

              Alert.alert("Success", "Member removed successfully");
              await loadBoardMembers();
            } catch (error) {
              console.error("❌ Error removing member:", error);
              Alert.alert("Error", error.message || "Failed to remove member");
            }
          },
        },
      ]
    );
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
          Loading members...
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

  // Check if user is board owner/admin
  const isAdmin =
    board.created_by === userId ||
    members.find((m) => m.user_id === userId && m.role === "admin");

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
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: "bold",
              color: COLORS.text,
            }}
          >
            Team Members
          </Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => setShowAddMember(!showAddMember)}>
              <Ionicons
                name={showAddMember ? "close" : "person-add"}
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={{ fontSize: 14, color: COLORS.textLight }}>
          {board.board_name}
        </Text>
      </View>

      {/* ADD MEMBER FORM */}
      {showAddMember && isAdmin && (
        <View
          style={{
            backgroundColor: COLORS.white,
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: COLORS.text,
              marginBottom: 12,
            }}
          >
            Add New Member
          </Text>

          {/* User ID Input */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 5 }}
            >
              User ID *
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.background,
                borderRadius: 8,
                paddingHorizontal: 15,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.textLight}
              />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  fontSize: 14,
                  color: COLORS.text,
                  fontFamily: "monospace",
                }}
                placeholder="Enter user UUID..."
                placeholderTextColor={COLORS.textLight}
                value={newMemberUserId}
                onChangeText={setNewMemberUserId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Role Selection */}
          <View style={{ marginBottom: 15 }}>
            <Text
              style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 8 }}
            >
              Role
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setNewMemberRole("member")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  borderRadius: 8,
                  backgroundColor:
                    newMemberRole === "member"
                      ? COLORS.primary
                      : COLORS.background,
                  borderWidth: 1,
                  borderColor:
                    newMemberRole === "member" ? COLORS.primary : COLORS.border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color:
                      newMemberRole === "member" ? COLORS.white : COLORS.text,
                  }}
                >
                  Member
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setNewMemberRole("admin")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  borderRadius: 8,
                  backgroundColor:
                    newMemberRole === "admin"
                      ? COLORS.primary
                      : COLORS.background,
                  borderWidth: 1,
                  borderColor:
                    newMemberRole === "admin" ? COLORS.primary : COLORS.border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color:
                      newMemberRole === "admin" ? COLORS.white : COLORS.text,
                  }}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleAddMember}
            disabled={isAdding}
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              opacity: isAdding ? 0.6 : 1,
            }}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text
                style={{ color: COLORS.white, fontWeight: "600", fontSize: 16 }}
              >
                Add Member
              </Text>
            )}
          </TouchableOpacity>

          {/* Info Note */}
          <View
            style={{
              backgroundColor: "#fef3c7",
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#f59e0b"
            />
            <Text
              style={{ fontSize: 12, color: "#92400e", marginLeft: 8, flex: 1 }}
            >
              You need the user&apos;s UUID to add them. Users can find their
              UUID in their profile settings.
            </Text>
          </View>
        </View>
      )}

      {/* MEMBERS LIST */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const isCurrentUser = item.user_id === userId;
          const isBoardOwner = item.user_id === board.created_by;

          return (
            <View
              style={{
                backgroundColor: COLORS.white,
                padding: 16,
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Avatar */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: COLORS.white,
                    }}
                  >
                    {item.email.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Member Info */}
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: COLORS.text,
                      }}
                    >
                      {item.email}
                    </Text>
                    {isCurrentUser && (
                      <View
                        style={{
                          backgroundColor: COLORS.background,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 4,
                          marginLeft: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: COLORS.text,
                            fontWeight: "600",
                          }}
                        >
                          YOU
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {/* Role Badge */}
                    <View
                      style={{
                        backgroundColor:
                          item.role === "admin"
                            ? COLORS.primary
                            : COLORS.background,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color:
                            item.role === "admin" ? COLORS.white : COLORS.text,
                          fontWeight: "600",
                        }}
                      >
                        {item.role.toUpperCase()}
                      </Text>
                    </View>

                    {/* Owner Badge */}
                    {isBoardOwner && (
                      <View
                        style={{
                          backgroundColor: COLORS.boardTitle,
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
                          OWNER
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.textLight,
                      marginTop: 4,
                    }}
                  >
                    Joined {new Date(item.joined_at).toLocaleDateString()}
                  </Text>
                </View>

                {/* Remove Button */}
                {isAdmin && !isBoardOwner && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(item.user_id, item.email)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={28}
                      color="#ef4444"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons
              name="people-outline"
              size={64}
              color={COLORS.textLight}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: COLORS.text,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              No Members Yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textLight,
                marginTop: 8,
                textAlign: "center",
                paddingHorizontal: 40,
              }}
            >
              Add members to collaborate on this board
            </Text>
          </View>
        }
      />

      {/* USER ID DISPLAY (For easy sharing) */}
      <View
        style={{
          backgroundColor: COLORS.white,
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <Text
          style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 5 }}
        >
          Your User ID (share this to be added to boards)
        </Text>
        <View
          style={{
            backgroundColor: COLORS.background,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: COLORS.text,
              fontFamily: "monospace",
            }}
            selectable
          >
            {userId}
          </Text>
        </View>
      </View>
    </View>
  );
}
