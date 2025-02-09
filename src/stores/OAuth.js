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
    ? "https://spotify.stanekj.com/callback"
    : "http://localhost:5173/callback";
  const scope = "user-read-private user-read-email user-top-read";

  function login() {
    try {
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem("spotify_auth_state", state);

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "token",
        redirect_uri: redirectUri,
        scope: scope,
        state: state,
        show_dialog: true,
      });

      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (e) {
      error.value = e.message;
      router.push("/");
    }
  }

  function handleCallback() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");
      const state = params.get("state");
      const storedState = localStorage.getItem("spotify_auth_state");

      if (state !== storedState) {
        throw new Error("State mismatch");
      }

      localStorage.removeItem("spotify_auth_state");

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
    localStorage.removeItem("spotify_auth_state");
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
    logout,
  };
});
