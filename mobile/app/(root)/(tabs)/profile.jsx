import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { useBoards } from "@/hooks/useBoards";
import { useTasks } from "@/hooks/useTasks";
import { SignOutButton } from "@/components/SignOutButton";
import { useTheme } from "@/contexts/ThemeContext";
import { THEME_NAMES } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { updateUser, deleteUser, getUserByClerkId } from "@/services/api";

export default function ProfileScreen() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const { currentTheme, colors: COLORS, changeTheme } = useTheme();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [dbUsername, setDbUsername] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { boards, loadData: loadBoards } = useBoards(userId);
  const { tasks, loadData: loadTasks } = useTasks(userId);

  // Load data when component mounts
  useEffect(() => {
    if (userId) {
      console.log("👤 Loading profile data for user:", userId);
      loadBoards();
      loadTasks();
    }
  }, [userId, loadBoards, loadTasks]);

  // Initialize form with user data (prefer database username)
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const dbUser = await getUserByClerkId(userId);
          if (dbUser && dbUser.username) {
            setDbUsername(dbUser.username);
            setUsername(dbUser.username);
            setFullName(dbUser.full_name || user.fullName || "");
          } else {
            setUsername(
              user.username ||
                user.emailAddresses[0]?.emailAddress.split("@")[0] ||
                ""
            );
            setFullName(user.fullName || "");
          }
        } catch (error) {
          console.error("Error loading user data:", error);
          setUsername(
            user.username ||
              user.emailAddresses[0]?.emailAddress.split("@")[0] ||
              ""
          );
          setFullName(user.fullName || "");
        }
      }
    };

    loadUserData();
  }, [user, userId]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload all profile data
      await Promise.all([loadBoards(), loadTasks()]);

      // Reload username
      if (userId) {
        try {
          const dbUser = await getUserByClerkId(userId);
          if (dbUser && dbUser.username) {
            setDbUsername(dbUser.username);
            setUsername(dbUser.username);
            setFullName(dbUser.full_name || user.fullName || "");
          }
        } catch (error) {
          console.error("Error reloading username:", error);
        }
      }
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate stats
  const totalBoards = boards?.length || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks =
    tasks?.filter((task) => task.status === "Done").length || 0;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      return Alert.alert("Error", "Username cannot be empty");
    }

    if (username.length < 3 || username.length > 50) {
      return Alert.alert(
        "Error",
        "Username must be between 3 and 50 characters"
      );
    }

    setIsUpdating(true);
    try {
      console.log("📝 Updating user profile:", { username, fullName });
      //The "null" could be where I am getting the error
      await updateUser(userId, {
        username: username.trim(),
        full_name: fullName.trim() || null,
      });

      await user.update({
        ...(fullName.trim() && { firstName: fullName.trim() }),
      });

      Alert.alert("Success", "Profile updated successfully");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and will delete all your boards and tasks.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🗑️ Deleting user account:", userId);
              await deleteUser(userId);
              await user.delete();
              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted"
              );
            } catch (error) {
              console.error("❌ Error deleting account:", error);
              Alert.alert("Error", error.message || "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  // Handle theme change
  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
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
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      {/* HEADER */}
      <View
        style={{
          backgroundColor: COLORS.primary,
          paddingTop: 20,
          paddingBottom: 40,
          paddingHorizontal: 20,
          alignItems: "center",
        }}
      >
        {/* Avatar Circle */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: COLORS.white,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 15,
          }}
        >
          <Text
            style={{ fontSize: 40, fontWeight: "bold", color: COLORS.primary }}
          >
            {user?.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* User Info */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: COLORS.white,
            marginBottom: 5,
          }}
        >
          {dbUsername || user?.fullName || user?.username || "User"}
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.white, opacity: 0.9 }}>
          {user?.emailAddresses[0]?.emailAddress}
        </Text>
      </View>

      {/* STATS CARDS */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 20,
          marginTop: -20,
          marginBottom: 20,
        }}
      >
        {/* Boards */}
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: COLORS.text,
              marginTop: 8,
            }}
          >
            {totalBoards}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
            Boards
          </Text>
        </View>

        {/* Tasks */}
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons
            name="checkbox-outline"
            size={24}
            color={COLORS.boardTitle}
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: COLORS.text,
              marginTop: 8,
            }}
          >
            {totalTasks}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
            Tasks
          </Text>
        </View>

        {/* Completion */}
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons name="trophy-outline" size={24} color="#f59e0b" />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: COLORS.text,
              marginTop: 8,
            }}
          >
            {completionRate}%
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
            Complete
          </Text>
        </View>
      </View>

      {/* THEME SELECTOR SECTION */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <Ionicons
              name="color-palette-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: COLORS.text,
                marginLeft: 10,
              }}
            >
              Theme
            </Text>
          </View>

          <Text
            style={{ fontSize: 14, color: COLORS.textLight, marginBottom: 12 }}
          >
            Choose your preferred color theme
          </Text>

          {/* Theme Options */}
          <View style={{ gap: 10 }}>
            {Object.entries(THEME_NAMES).map(([key, name]) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleThemeChange(key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor:
                    currentTheme === key ? COLORS.background : COLORS.white,
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor:
                    currentTheme === key ? COLORS.primary : COLORS.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor:
                        require("@/constants/colors").THEMES[key].primary,
                      marginRight: 12,
                      borderWidth: 2,
                      borderColor: COLORS.border,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: currentTheme === key ? "600" : "400",
                      color: COLORS.text,
                    }}
                  >
                    {name}
                  </Text>
                </View>
                {currentTheme === key && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* PROFILE SECTION */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text }}
            >
              Profile Information
            </Text>
            {!isEditingProfile ? (
              <TouchableOpacity onPress={() => setIsEditingProfile(true)}>
                <Ionicons
                  name="create-outline"
                  size={24}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditingProfile(false);
                    setUsername(
                      user?.username ||
                        user?.emailAddresses[0]?.emailAddress.split("@")[0] ||
                        ""
                    );
                    setFullName(user?.fullName || "");
                  }}
                >
                  <Ionicons
                    name="close-outline"
                    size={24}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateProfile}
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

          {/* Username */}
          <View style={{ marginBottom: 15 }}>
            <Text
              style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 5 }}
            >
              Username
            </Text>
            {isEditingProfile ? (
              <TextInput
                style={{
                  backgroundColor: COLORS.background,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={COLORS.textLight}
              />
            ) : (
              <Text style={{ fontSize: 16, color: COLORS.text }}>
                {dbUsername || username || "Not set"}
              </Text>
            )}
          </View>

          {/* Full Name */}
          <View style={{ marginBottom: 15 }}>
            <Text
              style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 5 }}
            >
              Full Name
            </Text>
            {isEditingProfile ? (
              <TextInput
                style={{
                  backgroundColor: COLORS.background,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textLight}
              />
            ) : (
              <Text style={{ fontSize: 16, color: COLORS.text }}>
                {user?.fullName || "Not set"}
              </Text>
            )}
          </View>

          {/* Email (Read-only) */}
          <View>
            <Text
              style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 5 }}
            >
              Email
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.text }}>
              {user?.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* ACTIVITY SECTION */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 12,
          }}
        >
          Activity Overview
        </Text>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          {/* Completed Tasks */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text
                style={{ fontSize: 16, color: COLORS.text, marginLeft: 10 }}
              >
                Completed Tasks
              </Text>
            </View>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}
            >
              {completedTasks}
            </Text>
          </View>

          {/* Pending Tasks */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="time" size={20} color="#f59e0b" />
              <Text
                style={{ fontSize: 16, color: COLORS.text, marginLeft: 10 }}
              >
                Pending Tasks
              </Text>
            </View>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}
            >
              {pendingTasks}
            </Text>
          </View>

          {/* Member Since */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text
                style={{ fontSize: 16, color: COLORS.text, marginLeft: 10 }}
              >
                Member Since
              </Text>
            </View>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}
            >
              {new Date(user?.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* ACTIONS SECTION */}
      <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
        {/* Sign Out Button */}
        <View style={{ marginBottom: 15 }}>
          <SignOutButton />
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={{
            backgroundColor: COLORS.white,
            paddingVertical: 15,
            paddingHorizontal: 20,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#ef4444",
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#ef4444",
              marginLeft: 8,
            }}
          >
            Delete Account
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
