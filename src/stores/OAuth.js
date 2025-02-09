import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";

export const useOAuthStore = defineStore("oauth", () => {
  const router = useRouter();
  const accessToken = ref(null);
  const isAuthenticated = computed(() => !!accessToken.value);
  const error = ref(null);

  const clientId = "2a98d7f1b9b04a39bef63e7492ba2dcc";
  const redirectUri = import.meta.env.PROD
    ? "https://spotify.stanekj.com"
    : "http://localhost:5173";
  const scope = "user-read-private user-read-email user-top-read";

  function login() {
    // Clear any existing tokens before login
    localStorage.removeItem("spotify_token");
    accessToken.value = null;

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  }

  async function getUserProfile() {
    try {
      error.value = null;
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handle expired or invalid token
          logout();
          throw new Error("Session expired. Please login again.");
        }
        throw new Error("Failed to fetch user profile");
      }

      return await response.json();
    } catch (e) {
      error.value = e.message;
      return null;
    }
  }

  function handleCallback() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");
      const error = params.get("error");

      if (error) {
        throw new Error(`Authentication failed: ${error}`);
      }

      if (!token) {
        throw new Error("No access token received");
      }

      // Store token
      accessToken.value = token;
      localStorage.setItem("spotify_token", token);

      // Clear hash and redirect
      window.history.replaceState({}, document.title, "/");
      router.push("/home");
    } catch (e) {
      error.value = e.message;
      router.push("/");
    }
  }

  function logout() {
    accessToken.value = null;
    localStorage.removeItem("spotify_token");
    router.push("/");
  }

  // Initialize from localStorage on store creation
  const storedToken = localStorage.getItem("spotify_token");
  if (storedToken) {
    accessToken.value = storedToken;
  }

  return {
    accessToken,
    isAuthenticated,
    error,
    login,
    handleCallback,
    getUserProfile,
    logout,
  };
});
