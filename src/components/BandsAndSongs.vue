<script setup>
import { computed } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'vue-chartjs';
import { useStatsStore } from '../stores/Stats';
import ArtistCard from './ArtistCard.vue';
import Songs from './Songs.vue';

ChartJS.register(ArcElement, Tooltip, Legend);

const statsStore = useStatsStore();

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
</script>

<template>
    <div class="flex flex-col items-center gap-8">
        <section class="flex w-full justify-between gap-2">
            <Songs />
            <div class="w-9/20 aspect-square">
                <div class="bg-2ndbg p-6 rounded-lg w-full mx-auto aspect-square">
                    <Pie :data="chartData" :options="chartOptions" />
                </div>
            </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-10 gap-6">
            <ArtistCard v-for="artist in artists" :key="artist.name" :artist="artist"
                @click="() => openSpotifyUrl(artist.spotifyUrl)" />
        </section>
    </div>
</template>