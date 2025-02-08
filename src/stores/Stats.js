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
        // Handle artists with no genres
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

  // Fetch top artists
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

  // Fetch top tracks
  const fetchTopTracks = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (!(await validateToken())) {
        return;
      }

      const response = await fetchWithRetry(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${selectedTimeRange.value}&limit=${selectedLimit.value}`,
        {
          headers: {
            Authorization: `Bearer ${oauthStore.accessToken}`,
          },
        }
      );

      topTracks.value = await response.json();
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
  function updateTimeRange(timeRange) {
    if (timeRangeOptions.some((option) => option.value === timeRange)) {
      selectedTimeRange.value = timeRange;
      fetchTopArtists();
      fetchTopTracks();
    }
  }

  function updateLimit(limit) {
    const numLimit = Math.min(Math.max(Math.floor(Number(limit)) || 1, 1), 50);
    selectedLimit.value = numLimit;
    fetchTopArtists();
    fetchTopTracks();
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
