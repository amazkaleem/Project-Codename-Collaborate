import * as React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { colors: COLORS } = useTheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
      Alert.alert("Success", "Verification code sent to your email");
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Error",
        err.errors?.[0]?.message || "Sign up failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/home");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
        Alert.alert("Error", "Verification failed. Please try again.");
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Error",
        err.errors?.[0]?.message ||
          "Verification failed. Please check your code."
      );
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
        >
          {/* Header */}
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
              <Ionicons name="mail-outline" size={40} color={COLORS.white} />
            </View>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: COLORS.text,
                marginBottom: 8,
              }}
            >
              Verify Your Email
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: COLORS.textLight,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              We&apos;ve sent a verification code to{"\n"}
              <Text style={{ fontWeight: "600", color: COLORS.text }}>
                {emailAddress}
              </Text>
            </Text>
          </View>

          {/* Verification Code Input */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: COLORS.text,
                marginBottom: 8,
              }}
            >
              Verification Code
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
                name="shield-checkmark-outline"
                size={20}
                color={COLORS.textLight}
              />
              <TextInput
                value={code}
                placeholder="Enter 6-digit code"
                placeholderTextColor={COLORS.textLight}
                onChangeText={(code) => setCode(code)}
                keyboardType="number-pad"
                maxLength={6}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: COLORS.text,
                  letterSpacing: 4,
                }}
              />
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={onVerifyPress}
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
                Verify Email
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <TouchableOpacity
            onPress={onSignUpPress}
            style={{ alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, color: COLORS.textLight }}>
              Didn&apos;t receive the code?{" "}
              <Text style={{ fontWeight: "600", color: COLORS.primary }}>
                Resend
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            <Ionicons name="person-add" size={40} color={COLORS.white} />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: COLORS.text,
              marginBottom: 8,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: COLORS.textLight,
              textAlign: "center",
            }}
          >
            Sign up to start managing your tasks
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
              onChangeText={(email) => setEmailAddress(email)}
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
        <View style={{ marginBottom: 8 }}>
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

        {/* Password Hint */}
        <Text
          style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 24 }}
        >
          Password must be at least 8 characters long
        </Text>

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={onSignUpPress}
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
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 14, color: COLORS.textLight }}>
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: COLORS.primary,
                }}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
