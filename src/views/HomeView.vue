<script setup>
import ArtistCard from '../components/ArtistCard.vue';
import { onMounted, onErrorCaptured, computed } from 'vue';
import { useStatsStore } from '../stores/Stats';
import { useRouter } from 'vue-router';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend);

const router = useRouter();
let statsStore;

try {
  statsStore = useStatsStore();
} catch (error) {
  console.error('Failed to initialize store:', error);
  router.push('/login');
}

const artists = computed(() => {
  if (!statsStore.topArtists?.items) return [];

  return statsStore.topArtists.items.map(artist => ({
    name: artist.name,
    image: artist.images[0]?.url,
    genres: artist.genres,
    spotifyUrl: artist.external_urls?.spotify
  }));
});


const openSpotifyUrl = (url) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

const handleLimitChange = (event) => {
  const value = parseInt(event.target.value);
  if (!isNaN(value) && value >= 1 && value <= 50) {
    statsStore.selectedLimit = value;
  }
};

const chartData = computed(() => ({
  labels: statsStore.genrePercentages.map(genre => genre.name),
  datasets: [{
    data: statsStore.genrePercentages.map(genre => genre.percentage),
    backgroundColor: ['#FF9B9B', '#9BFFC4', '#9BB5FF', '#FFE89B', '#FF9BE6', '#C39BFF', '#9BFFFC', '#FFB89B', '#B5FF9B', '#FF9BD7', '#9BCCFF', '#FFD89B'],
    borderColor: '#000',
    borderWidth: 1
  }]
}));

const chartOptions = {
  responsive: true,

  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: '#fff',
        font: {
          family: 'Nunito'
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {

          const genre = statsStore.genrePercentages[context.dataIndex];
          const artists = statsStore.topArtists.items
            .filter(artist => artist.genres.includes(genre.name))
            .map(artist => artist.name)
            .join(', ');
          return `${genre.name}: ${context.raw}% (${artists})`;
        }
      }
    }
  }
};

onErrorCaptured((error) => {
  console.error('Component error:', error);
  return false;
});

onMounted(async () => {
  try {
    if (statsStore) {
      await statsStore.fetchTopArtists();
    }
  } catch (error) {
    console.error('Failed to fetch artists:', error);
  }
});
</script>

<template>
  <div v-if="statsStore" class="container mx-auto px-4 py-8">
    <div class="mb-8 flex gap-4 justify-center items-center">
      <select v-model="statsStore.selectedTimeRange" @change="statsStore.updateTimeRange($event.target.value)"
        class="bg-2ndbg text-white px-4 py-2 rounded-lg cursor-pointer appearance-none font-family">
        <option v-for="option in statsStore.timeRangeOptions" :key="option.value" :value="option.value"
          class="font-family text-inherit">
          {{ option.label }}
        </option>
      </select>

      <div class="flex items-center gap-2">
        <input type="number" :value="statsStore.selectedLimit" @input="handleLimitChange" min="1" max="50"
          class="bg-2ndbg text-white px-4 py-2 rounded-lg w-24 text-center font-family" />
        <button @click="statsStore.fetchTopArtists()"
          class="bg-primary text-black px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="statsStore.loading" class="text-center font-family">
      <div class="animate-spin h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
      <p class="mt-4 text-white font-family">Loading your music stats...</p>
    </div>

    <div v-else-if="statsStore.error" class="text-red-500 text-center p-4 font-family">
      {{ statsStore.error }}
    </div>

    <div v-else-if="statsStore.genrePercentages.length" class="flex flex-col items-center gap-8">
      <div class="w-1/3 aspect-square">
        <div class="bg-2ndbg p-6 rounded-lg w-full mx-auto aspect-square">
          <Pie :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-10 gap-6">
        <ArtistCard v-for="artist in artists" :key="artist.name" :artist="artist"
          @click="() => openSpotifyUrl(artist.spotifyUrl)" />
      </div>
    </div>

    <div v-else class="text-center text-white p-4 font-family">
      No artist data available
    </div>
  </div>

  <div v-else class="text-center text-white p-4 font-family">
    Failed to initialize application. Please try again.
  </div>
</template>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

select option {
  font-family:
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Open Sans',
    'Helvetica Neue', sans-serif !important;
}
</style>