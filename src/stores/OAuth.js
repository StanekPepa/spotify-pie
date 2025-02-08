import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useOAuthStore = defineStore("oauth", () => {
  const accessToken = ref(null);
  const isAuthenticated = computed(() => !!accessToken.value);
  const error = ref(null);

  const clientId = "2a98d7f1b9b04a39bef63e7492ba2dcc";
  const redirectUri = "http://localhost:5173/home";
  const scope = "user-read-private user-read-email user-top-read";

  function login() {
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
        throw new Error("Failed to fetch user profile");
      }

      return await response.json();
    } catch (e) {
      error.value = e.message;
      return null;
    }
  }
  function handleCallback() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");

    if (token) {
      accessToken.value = token;
      localStorage.setItem("spotify_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function logout() {
    accessToken.value = null;
    localStorage.removeItem("spotify_token");
    window.location.href = "/";
  }

  // Initialize from localStorage
  const storedToken = localStorage.getItem("spotify_token");
  if (storedToken) {
    accessToken.value = storedToken;
  }

  return {
    accessToken,
    isAuthenticated,
    login,
    handleCallback,
    getUserProfile,
    logout,
  };
});
// pozměnit callbacky
