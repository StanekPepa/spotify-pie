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

  function handleCallback() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");

      if (token) {
        accessToken.value = token;
        localStorage.setItem("spotify_token", token);
        window.history.replaceState({}, document.title, "/");
        router.push("/home");
      } else {
        throw new Error("No access token received");
      }
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
