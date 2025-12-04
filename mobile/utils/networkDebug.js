// utils/networkDebug.js

/**
 * Enhanced fetch with detailed logging
 */
export const debugFetch = async (url, options = {}) => {
  console.log("🔍 ========== NETWORK REQUEST DEBUG ==========");
  console.log("📍 URL:", url);
  console.log("⚙️  Method:", options.method || "GET");
  console.log("📦 Body:", options.body || "No body");
  console.log("🔑 Headers:", JSON.stringify(options.headers || {}, null, 2));
  console.log("🌐 Environment API URL:", process.env.EXPO_PUBLIC_API_BASE_URL);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("✅ Response Status:", response.status);
    console.log("✅ Response OK:", response.ok);

    const responseText = await response.text();
    console.log("📥 Response Body:", responseText);

    const data = responseText ? JSON.parse(responseText) : null;

    console.log("🔍 ========== END DEBUG ==========\n");

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("❌ ========== NETWORK ERROR ==========");
    console.error("❌ Error Type:", error.name);
    console.error("❌ Error Message:", error.message);
    console.error("❌ Full Error:", error);
    console.error("❌ ========== END ERROR ==========\n");
    throw error;
  }
};
