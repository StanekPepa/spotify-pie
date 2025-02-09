import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useOAuthStore } from "./OAuth";
import { useRouter } from "vue-router";

export const useStatsStore = defineStore("stats", () => {
  const router = useRouter();
  const oauthStore = useOAuthStore();

  // State
  const topArtists = ref(null);
  const topTracks = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const selectedTimeRange = ref("short_term");
  const selectedLimit = ref(20);
  const retryCount = ref(0);

  // Constants
  const timeRangeOptions = [
    { value: "short_term", label: "Poslední 4 týdny" },
    { value: "medium_term", label: "Posledních 6 měsíců" },
    { value: "long_term", label: "Poslední rok" },
  ];

  // Computed
  const genrePercentages = computed(() => {
    if (!topArtists.value?.items) return [];

    const genreCounts = topArtists.value.items.reduce((acc, artist) => {
      if (!artist.genres || artist.genres.length === 0) {
        acc["Bez žánru"] = (acc["Bez žánru"] || 0) + 1;
      } else {
        artist.genres.forEach((genre) => {
          acc[genre] = (acc[genre] || 0) + 1;
        });
      }
      return acc;
    }, {});

    const total = Object.values(genreCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return Object.entries(genreCounts)
      .map(([genre, count]) => ({
        name: genre,
        percentage: ((count / total) * 100).toFixed(1),
        count: count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  });

  // Enhanced token validation with better error handling
  const validateToken = async () => {
    try {
      console.log("Validating token with retry count:", retryCount.value);

      if (!oauthStore.accessToken) {
        throw new Error("No access token available");
      }

      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${oauthStore.accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("Token validation status:", response.status);

      if (response.status === 401) {
        if (retryCount.value < 3) {
          retryCount.value++;
          console.log("Token expired, attempting refresh...");
          await oauthStore.login();
          return false;
        } else {
          throw new Error("Maximum retry attempts reached");
        }
      }

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      retryCount.value = 0;
      return true;
    } catch (e) {
      console.error("Token validation error:", e);
      error.value = e.message;
      return false;
    }
  };

  // Enhanced fetch with improved retry and logging
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}/${maxRetries} for ${url}`);

        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401 && attempt < maxRetries - 1) {
          console.log("Token expired, validating...");
          const isValid = await validateToken();
          if (!isValid) {
            oauthStore.logout();
            throw new Error("Authentication failed");
          }
          continue;
        }

        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get("Retry-After") || "3"
          );
          console.log(`Rate limited, waiting ${retryAfter}s`);
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Data fetched successfully");
        return data;
      } catch (e) {
        console.error(`Attempt ${attempt + 1} failed:`, e);
        if (attempt === maxRetries - 1) throw e;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 10000))
        );
      }
    }
  };

  // Enhanced data fetching functions
  const fetchTopArtists = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log("Fetching top artists...");
      if (!(await validateToken())) {
        throw new Error("Token validation failed");
      }

      const data = await fetchWithRetry(
        `https://api.spotify.com/v1/me/top/artists?time_range=${selectedTimeRange.value}&limit=${selectedLimit.value}`,
        {
          headers: {
            Authorization: `Bearer ${oauthStore.accessToken}`,
          },
        }
      );

      if (!data || !data.items) {
        throw new Error("Invalid response format");
      }

      topArtists.value = data;
      console.log("Top artists fetched successfully:", data.items.length);
    } catch (e) {
      error.value = e.message;
      console.error("Error fetching top artists:", e);
      if (e.message.includes("401")) {
        router.push("/login");
      }
    } finally {
      loading.value = false;
    }
  };

  const fetchTopTracks = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log("Fetching top tracks...");
      if (!(await validateToken())) {
        throw new Error("Token validation failed");
      }

      const data = await fetchWithRetry(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${selectedTimeRange.value}&limit=${selectedLimit.value}`,
        {
          headers: {
            Authorization: `Bearer ${oauthStore.accessToken}`,
          },
        }
      );

      if (!data || !data.items) {
        throw new Error("Invalid response format");
      }

      topTracks.value = data;
      console.log("Top tracks fetched successfully:", data.items.length);
    } catch (e) {
      error.value = e.message;
      console.error("Error fetching top tracks:", e);
      if (e.message.includes("401")) {
        router.push("/login");
      }
    } finally {
      loading.value = false;
    }
  };

  // Update functions
  const updateTimeRange = (timeRange) => {
    console.log("Updating time range to:", timeRange);
    if (timeRangeOptions.some((option) => option.value === timeRange)) {
      selectedTimeRange.value = timeRange;
      Promise.all([fetchTopArtists(), fetchTopTracks()]).catch((e) =>
        console.error("Error updating data:", e)
      );
    } else {
      console.error("Invalid time range:", timeRange);
    }
  };

  const updateLimit = (limit) => {
    console.log("Updating limit to:", limit);
    const numLimit = Math.min(Math.max(Math.floor(Number(limit)) || 1, 1), 50);
    selectedLimit.value = numLimit;
    Promise.all([fetchTopArtists(), fetchTopTracks()]).catch((e) =>
      console.error("Error updating data:", e)
    );
  };

  // Initialize data on store creation
  if (oauthStore.isAuthenticated) {
    Promise.all([fetchTopArtists(), fetchTopTracks()]).catch((e) =>
      console.error("Error initializing data:", e)
    );
  }

  return {
    topArtists,
    topTracks,
    loading,
    error,
    selectedTimeRange,
    selectedLimit,
    timeRangeOptions,
    genrePercentages,
    fetchTopArtists,
    fetchTopTracks,
    updateTimeRange,
    updateLimit,
  };
});
