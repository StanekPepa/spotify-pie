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
    localStorage.removeItem("spotify_token");
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = authUrl;
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

      if (token) {
        accessToken.value = token;
        localStorage.setItem("spotify_token", token);

        // Clean URL and redirect
        window.history.replaceState({}, document.title, "/");
        router.push("/home");
      } else {
        router.push("/login");
      }
    } catch (e) {
      error.value = e.message;
      router.push("/login");
    }
  }

  function logout() {
    accessToken.value = null;
    localStorage.removeItem("spotify_token");
    router.push("/");
  }

  // Initialize from localStorage
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
