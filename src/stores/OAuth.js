import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";

export const useOAuthStore = defineStore("oauth", () => {
  const router = useRouter();
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const tokenExpiry = ref(null);
  const isAuthenticated = computed(() => !!accessToken.value);
  const error = ref(null);
  const loading = ref(false);

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;
  const scope = "user-read-private user-read-email user-top-read";
  const TOKEN_FILE_PATH = "spotify_tokens.json";

  async function saveTokensToFile() {
    try {
      const tokenData = JSON.stringify({
        accessToken: accessToken.value,
        refreshToken: refreshToken.value,
        expiry: tokenExpiry.value,
      });

      const result = await window.electronAPI.writeFile(
        TOKEN_FILE_PATH,
        tokenData
      );
      if (!result.success) {
        console.error("Chyba při ukládání tokenů:", result.error);
      }
    } catch (e) {
      console.error("Chyba při ukládání tokenů:", e);
    }
  }

  async function loadTokensFromFile() {
    try {
      const result = await window.electronAPI.readFile(TOKEN_FILE_PATH);
      if (result.success) {
        return JSON.parse(result.data);
      }
      return null;
    } catch (e) {
      console.error("Chyba při načítání tokenů:", e);
      return null;
    }
  }

  async function validateToken(token) {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  function login() {
    try {
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem("spotify_auth_state", state);

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
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

  async function handleCallback() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const storedState = localStorage.getItem("spotify_auth_state");

      if (state !== storedState) {
        throw new Error("State mismatch - Security validation failed");
      }

      localStorage.removeItem("spotify_auth_state");

      if (!code) {
        throw new Error("No authorization code received from Spotify");
      }

      const basicAuth = btoa(`${clientId}:${clientSecret}`);
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `Failed to exchange code for tokens: ${errorData.error}`
        );
      }

      const data = await response.json();
      accessToken.value = data.access_token;
      refreshToken.value = data.refresh_token;
      tokenExpiry.value = Date.now() + data.expires_in * 1000;

      await saveTokensToFile();

      window.history.replaceState({}, document.title, window.location.pathname);
      router.push("/home");
    } catch (e) {
      error.value = e.message;
      console.error("Callback error:", e);
      router.push("/");
    }
  }

  async function refreshAccessToken() {
    try {
      if (!refreshToken.value) {
        throw new Error("No refresh token available");
      }

      if (!clientId || !clientSecret) {
        throw new Error("Chybí Spotify API credentials");
      }

      const basicAuth = btoa(`${clientId}:${clientSecret}`);
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken.value,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(`Failed to refresh token: ${errorData.error}`);
      }

      const data = await response.json();
      accessToken.value = data.access_token;
      if (data.refresh_token) {
        refreshToken.value = data.refresh_token;
      }
      tokenExpiry.value = Date.now() + data.expires_in * 1000;

      await saveTokensToFile();
      return true;
    } catch (e) {
      console.error("Token refresh error:", e);
      return false;
    }
  }

  async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (tokenExpiry.value && Date.now() > tokenExpiry.value) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            logout();
            throw new Error("Failed to refresh token, please login again");
          }
        }

        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken.value}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            logout();
            throw new Error("Session expired, please login again");
          }
          continue;
        }

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

  async function getUserProfile() {
    try {
      loading.value = true;
      if (!accessToken.value) {
        throw new Error("No access token available");
      }

      const response = await fetchWithRetry("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      });

      const data = await response.json();
      return data;
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    tokenExpiry.value = null;

    window.electronAPI
      .writeFile(TOKEN_FILE_PATH, "")
      .catch((e) => console.error("Chyba při mazání tokenů:", e));

    localStorage.removeItem("spotify_auth_state");
    router.push("/");
  }

  async function initialize() {
    const tokens = await loadTokensFromFile();

    if (tokens && tokens.accessToken) {
      accessToken.value = tokens.accessToken;
      refreshToken.value = tokens.refreshToken;
      tokenExpiry.value = tokens.expiry;

      if (tokenExpiry.value && Date.now() > tokenExpiry.value) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          router.push("/login");
          return;
        }
      }

      const isValid = await validateToken(accessToken.value);
      if (!isValid) {
        logout();
        router.push("/login");
      }
    }
  }

  initialize().catch(() => router.push("/login"));

  return {
    accessToken,
    refreshToken,
    isAuthenticated,
    error,
    loading,
    login,
    handleCallback,
    logout,
    getUserProfile,
    validateToken,
    refreshAccessToken,
  };
});
