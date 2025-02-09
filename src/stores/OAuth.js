import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";

export const useOAuthStore = defineStore("oauth", () => {
  const router = useRouter();
  const accessToken = ref(null);
  const isAuthenticated = computed(() => !!accessToken.value);
  const error = ref(null);
  const loading = ref(false);

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;
  const scope = "user-read-private user-read-email user-top-read";

  // Utility function for fetch with retry logic
  async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Accept: "application/json",
          },
        });

        // Handle token expiration
        if (response.status === 401) {
          logout();
          throw new Error("Session expired, please login again");
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After") || 3;
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
      } catch (e) {
        if (attempt === maxRetries - 1) throw e;
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }
  }

  function login() {
    try {
      localStorage.removeItem("spotify_token");
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
      console.error("Login error:", e);
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
        throw new Error("State mismatch - Security validation failed");
      }

      localStorage.removeItem("spotify_auth_state");

      if (!token) {
        throw new Error("No access token received from Spotify");
      }

      // Store token and clean URL
      accessToken.value = token;
      localStorage.setItem("spotify_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
      router.push("/home");
    } catch (e) {
      error.value = e.message;
      console.error("Callback error:", e);
      router.push("/");
    }
  }

  async function getUserProfile() {
    try {
      loading.value = true;
      if (!accessToken.value) {
        throw new Error("No access token available");
      }

      const response = await fetchWithRetry("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      });

      const data = await response.json();
      console.debug("Profile data received successfully");
      return data;
    } catch (e) {
      error.value = e.message;
      console.error("Profile fetch error:", {
        message: e.message,
        hasToken: !!accessToken.value,
        isAuthenticated: isAuthenticated.value,
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    accessToken.value = null;
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_auth_state");
    router.push("/");
  }

  // Initialize from localStorage with validation
  const storedToken = localStorage.getItem("spotify_token");
  if (storedToken) {
    accessToken.value = storedToken;
    // Validate token on initialization
    getUserProfile().catch(() => {
      accessToken.value = null;
      localStorage.removeItem("spotify_token");
    });
  }

  return {
    accessToken,
    isAuthenticated,
    error,
    loading,
    login,
    handleCallback,
    logout,
    getUserProfile,
  };
});
