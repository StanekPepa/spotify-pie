import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useOAuthStore } from "./OAuth";
import { useRouter } from "vue-router";

export const useStatsStore = defineStore("stats", () => {
  const router = useRouter();
  const oauthStore = useOAuthStore();

  // State
  const topArtists = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const selectedTimeRange = ref("short_term");
  const selectedLimit = ref(20);

  // Constants
  const timeRangeOptions = [
    { value: "short_term", label: "Last 4 Weeks" },
    { value: "medium_term", label: "Last 6 Months" },
    { value: "long_term", label: "All Time" },
  ];

  // Computed
  const artistPercentages = computed(() => {
    if (!topArtists.value?.items) return [];

    const total = topArtists.value.items.reduce(
      (sum, artist) => sum + artist.popularity,
      0
    );

    return topArtists.value.items.map((artist) => ({
      name: artist.name,
      percentage: ((artist.popularity / total) * 100).toFixed(1),
      image: artist.images[0]?.url || "",
      genres: artist.genres || [],
      spotifyUrl: artist.external_urls?.spotify || "",
    }));
  });

  // Token validation
  const validateToken = async () => {
    if (!oauthStore.accessToken) {
      error.value = "No access token available";
      router.push("/login");
      return false;
    }

    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${oauthStore.accessToken}`,
        },
      });

      if (response.status === 401) {
        error.value = "Token expired";
        oauthStore.logout();
        router.push("/login");
        return false;
      }

      return response.ok;
    } catch (e) {
      error.value = "Failed to validate token";
      return false;
    }
  };

  // Fetch with retry
  const fetchWithRetry = async (url, options, retries = 3) => {
    try {
      const response = await fetch(url, options);

      if (response.status === 401 && retries > 0) {
        await validateToken();
        return fetchWithRetry(url, options, retries - 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (e) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw e;
    }
  };

  // Main fetch function
  const fetchTopArtists = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (!(await validateToken())) {
        return;
      }

      const response = await fetchWithRetry(
        `https://api.spotify.com/v1/me/top/artists?time_range=${selectedTimeRange.value}&limit=${selectedLimit.value}`,
        {
          headers: {
            Authorization: `Bearer ${oauthStore.accessToken}`,
          },
        }
      );

      topArtists.value = await response.json();
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

  // Update functions
  function updateTimeRange(timeRange) {
    if (timeRangeOptions.some((option) => option.value === timeRange)) {
      selectedTimeRange.value = timeRange;
      fetchTopArtists();
    }
  }

  function updateLimit(limit) {
    const numLimit = Math.min(Math.max(Math.floor(Number(limit)) || 1, 1), 50);
    selectedLimit.value = numLimit;
    fetchTopArtists();
  }

  return {
    topArtists,
    loading,
    error,
    selectedTimeRange,
    selectedLimit,
    timeRangeOptions,
    artistPercentages,
    fetchTopArtists,
    updateTimeRange,
    updateLimit,
  };
});
