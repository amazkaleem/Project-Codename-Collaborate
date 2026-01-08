import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { getUserByClerkId, createUser } from "@/services/api";

export const useUserProfile = (clerkUser) => {
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    if (!clerkUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log("📥 Loading user profile from database");

      // Try to get user from database
      let user = await getUserByClerkId(clerkUser.id);

      // If API returns 404 or null, create the user
      if (!user) {
        console.log("Creating new user in database");
        user = await createUser({
          userId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          username:
            clerkUser.username ||
            clerkUser.emailAddresses[0]?.emailAddress.split("@")[0],
          full_name: clerkUser.fullName || "",
        });
      }

      setDbUser(user);
      console.log("✅ User profile loaded:", user?.username);
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  return { dbUser, isLoading, refreshProfile: loadUserProfile };
};
