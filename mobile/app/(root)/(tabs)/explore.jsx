import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { searchBoardsByName, getBoardMembers } from "@/services/api";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function ExploreScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const { colors: COLORS } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      console.log("🔍 Searching boards:", searchQuery);
      const results = await searchBoardsByName(searchQuery.trim());
      setSearchResults(results);
      console.log("✅ Search results:", results.length);
    } catch (error) {
      console.error("❌ Error searching boards:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  // Navigate to board detail
  const handleBoardPress = async (board) => {
    try {
      // Check if user is a member of this board
      const members = await getBoardMembers(board.board_id);
      const isMember = members.some((member) => member.user_id === userId);

      if (!isMember) {
        // User is not a member, show alert
        Alert.alert(
          "Access Denied",
          "You are not a member of this board. Please contact the board admin to join.",
          [{ text: "OK" }]
        );
        return;
      }

      // User is a member, navigate to board
      router.push(`/board/${board.board_id}`);
    } catch (error) {
      console.error("❌ Error checking board access:", error);
      Alert.alert("Error", "Failed to check board access");
    }
  };

  // Show loading if Clerk hasn't loaded yet
  if (!isLoaded) {
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
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
              marginBottom: 12,
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
              placeholder="Search for boards..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
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

          {/* SEARCH BUTTON */}
          <TouchableOpacity
            onPress={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            style={{
              backgroundColor: !searchQuery.trim()
                ? COLORS.textLight
                : COLORS.primary,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              opacity: isSearching ? 0.6 : 1,
            }}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: COLORS.white,
                }}
              >
                Search
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* RESULTS */}
        {isSearching ? (
          // Loading State
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 40,
              minHeight: 400,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                color: COLORS.textLight,
                textAlign: "center",
              }}
            >
              Loading boards...
            </Text>
          </View>
        ) : !hasSearched ? (
          // Initial State - No search yet
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 40,
              minHeight: 400,
            }}
          >
            <Ionicons
              name="search-outline"
              size={80}
              color={COLORS.textLight}
            />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: COLORS.text,
                marginTop: 20,
                textAlign: "center",
              }}
            >
              Search for Boards
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textLight,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Type a board name in the search field above and tap Search to find
              boards
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          // Empty Results
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 40,
              minHeight: 400,
            }}
          >
            <Ionicons
              name="file-tray-outline"
              size={80}
              color={COLORS.textLight}
            />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: COLORS.text,
                marginTop: 20,
                textAlign: "center",
              }}
            >
              No Boards Found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textLight,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              No boards match &quot;{searchQuery}&quot;
            </Text>
            <TouchableOpacity
              onPress={handleClearSearch}
              style={{
                marginTop: 20,
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: COLORS.primary,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: COLORS.white, fontWeight: "600" }}>
                Try Another Search
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Results List
          <View style={{ flex: 1 }}>
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: COLORS.background,
              }}
            >
              <Text style={{ fontSize: 14, color: COLORS.textLight }}>
                {searchResults.length}{" "}
                {searchResults.length === 1 ? "board" : "boards"} found
              </Text>
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.board_id}
              contentContainerStyle={{ padding: 20, paddingTop: 0 }}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isCreator = item.created_by === userId;

                return (
                  <TouchableOpacity
                    onPress={() => handleBoardPress(item)}
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
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
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
                    <View
                      style={{ flexDirection: "row", marginTop: 12, gap: 15 }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
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
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
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
                          {item.task_count}{" "}
                          {item.task_count === 1 ? "task" : "tasks"}
                        </Text>
                      </View>
                    </View>

                    {/* Updated Time & Creator */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: COLORS.textLight }}>
                        Updated {new Date(item.updated_at).toLocaleDateString()}
                      </Text>
                      {item.creator_username && (
                        <Text style={{ fontSize: 11, color: COLORS.textLight }}>
                          by @{item.creator_username}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
