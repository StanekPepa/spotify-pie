<script setup>
import { computed, onMounted } from 'vue';
import { useStatsStore } from '../stores/Stats';

const statsStore = useStatsStore();
onMounted(async () => {
    if (!statsStore.topTracks?.items) {
        await statsStore.fetchTopTracks();
    }
});

const tracks = computed(() => {
    if (!statsStore.topTracks?.items) return [];

    return statsStore.topTracks.items.map(track => ({
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        image: track.album.images[0]?.url,
        duration: track.duration_ms,
        spotifyUrl: track.external_urls?.spotify
    }));
});

const openSpotifyUrl = (url) => {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
};
</script>

<template>
    <div class="bg-2ndbg rounded-lg p-3 sm:p-6 w-full aspect-square">
        <h2 class="text-2xl font-bold text-white mb-6 font-family">Top tracky</h2>
        <div class="space-y-4 h-[calc(100%-4rem)] overflow-y-auto pr-4">
            <div v-for="(track, index) in tracks" :key="track.name" @click="openSpotifyUrl(track.spotifyUrl)"
                class="flex items-center gap-4 p-4 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                <!-- Track Number - Fixed width -->
                <span class="text-white/60 w-6 text-right shrink-0">{{ index + 1 }}</span>

                <!-- Album Art - Fixed size -->
                <img :src="track.image" :alt="track.name" class="w-12 h-12 object-cover rounded shrink-0" />

                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold font-family truncate">{{ track.name }}</p>
                    <p class="text-white/60 font-family truncate">{{ track.artist }}</p>
                </div>

                <div class="text-white/60 font-family w-16 text-right shrink-0">
                    {{ formatDuration(track.duration) }}
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.space-y-4 {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.space-y-4::-webkit-scrollbar {
    width: 6px;
}

.space-y-4::-webkit-scrollbar-track {
    background: transparent;
}

.space-y-4::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}
</style>