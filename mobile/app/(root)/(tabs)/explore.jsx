import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { useBoards } from "@/hooks/useBoards";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function ExploreScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBoards, setFilteredBoards] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, my-boards, shared

  const { boards, isLoading, loadData } = useBoards(userId);

  // Load boards when component mounts
  useEffect(() => {
    if (userId) {
      console.log("🔍 Loading boards for explore:", userId);
      loadData();
    }
  }, [userId, loadData]);

  // Filter boards based on search query and selected filter
  useEffect(() => {
    if (!boards) {
      setFilteredBoards([]);
      return;
    }

    let result = [...boards];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (board) =>
          board.board_name.toLowerCase().includes(query) ||
          board.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedFilter === "my-boards") {
      result = result.filter((board) => board.created_by === userId);
    } else if (selectedFilter === "shared") {
      result = result.filter((board) => board.created_by !== userId);
    }

    // Sort by updated_at (most recent first)
    result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    setFilteredBoards(result);
  }, [searchQuery, selectedFilter, boards, userId]);

  // Navigate to board detail
  const handleBoardPress = (boardId) => {
    router.push(`/board/${boardId}`);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Show loading if Clerk hasn't loaded yet
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
          Loading boards...
        </Text>
      </View>
    );
  }

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
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 15,
          }}
        >
          Explore Boards
        </Text>

        {/* SEARCH BAR */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.background,
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 16,
              color: COLORS.text,
            }}
            placeholder="Search boards..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER TABS */}
        <View style={{ flexDirection: "row", marginTop: 15, gap: 10 }}>
          <TouchableOpacity
            onPress={() => setSelectedFilter("all")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor:
                selectedFilter === "all" ? COLORS.primary : COLORS.background,
              borderWidth: 1,
              borderColor:
                selectedFilter === "all" ? COLORS.primary : COLORS.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: selectedFilter === "all" ? COLORS.white : COLORS.text,
              }}
            >
              All Boards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter("my-boards")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor:
                selectedFilter === "my-boards"
                  ? COLORS.primary
                  : COLORS.background,
              borderWidth: 1,
              borderColor:
                selectedFilter === "my-boards" ? COLORS.primary : COLORS.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color:
                  selectedFilter === "my-boards" ? COLORS.white : COLORS.text,
              }}
            >
              My Boards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter("shared")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor:
                selectedFilter === "shared"
                  ? COLORS.primary
                  : COLORS.background,
              borderWidth: 1,
              borderColor:
                selectedFilter === "shared" ? COLORS.primary : COLORS.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: selectedFilter === "shared" ? COLORS.white : COLORS.text,
              }}
            >
              Shared
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RESULTS COUNT */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: COLORS.background,
        }}
      >
        <Text style={{ fontSize: 14, color: COLORS.textLight }}>
          {filteredBoards.length}{" "}
          {filteredBoards.length === 1 ? "board" : "boards"} found
        </Text>
      </View>

      {/* BOARDS LIST */}
      <FlatList
        data={filteredBoards}
        keyExtractor={(item) => item.board_id}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isCreator = item.created_by === userId;

          return (
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
              {/* Board Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: COLORS.text,
                      }}
                    >
                      {item.board_name}
                    </Text>
                    {isCreator && (
                      <View
                        style={{
                          backgroundColor: COLORS.primary,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 4,
                          marginLeft: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: COLORS.white,
                            fontWeight: "600",
                          }}
                        >
                          OWNER
                        </Text>
                      </View>
                    )}
                  </View>
                  {item.description && (
                    <Text
                      style={{
                        fontSize: 14,
                        color: COLORS.textLight,
                        marginTop: 6,
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

              {/* Board Stats */}
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

              {/* Updated Time */}
              <Text
                style={{ fontSize: 11, color: COLORS.textLight, marginTop: 8 }}
              >
                Updated {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons
              name={
                searchQuery.trim()
                  ? "search-outline"
                  : selectedFilter === "shared"
                  ? "people-outline"
                  : "clipboard-outline"
              }
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
              {searchQuery.trim()
                ? "No boards found"
                : selectedFilter === "shared"
                ? "No shared boards"
                : "No boards yet"}
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
              {searchQuery.trim()
                ? `No boards match "${searchQuery}"`
                : selectedFilter === "shared"
                ? "Boards shared with you will appear here"
                : "Create a board to get started"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
