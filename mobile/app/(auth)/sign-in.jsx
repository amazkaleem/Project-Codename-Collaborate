import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors: COLORS } = useTheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/home");
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Sign in failed. Please try again.");
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Error",
        err.errors?.[0]?.message ||
          "Sign in failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        {/* Logo/Icon Section */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.primary,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="checkmark-done" size={40} color={COLORS.white} />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: COLORS.text,
              marginBottom: 8,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: COLORS.textLight,
              textAlign: "center",
            }}
          >
            Sign in to continue managing your tasks
          </Text>
        </View>

        {/* Email Input */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 8,
            }}
          >
            Email Address
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: COLORS.white,
              borderRadius: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Ionicons name="mail-outline" size={20} color={COLORS.textLight} />
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textLight}
              onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
              keyboardType="email-address"
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 12,
                fontSize: 16,
                color: COLORS.text,
              }}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 8,
            }}
          >
            Password
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: COLORS.white,
              borderRadius: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.textLight}
            />
            <TextInput
              value={password}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showPassword}
              onChangeText={(password) => setPassword(password)}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 12,
                fontSize: 16,
                color: COLORS.text,
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={onSignInPress}
          disabled={loading}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 16,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: COLORS.white }}
            >
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 14, color: COLORS.textLight }}>
            Don&apos;t have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: COLORS.primary,
                }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}