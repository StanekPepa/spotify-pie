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
        backgroundColor: [
            "#a25f8b",
            "#5360ae",
            "#fae377",
            "#889c55",
            "#613860",
            "#fb9f32",
            "#95bdf8",
            "#963f58",
            "#b894d1",
            "#a8c571",
            "#d86680",
            "#cbc0fa",
            "#708735",
            "#d1651d",
            "#f17bdc",
            "#b4c153",
            "#775498",
        ],
        borderColor: '#454545',
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


</script>
<template>
    <div class="flex flex-col items-center gap-8">

        <section class="grid grid-cols-1 xl:grid-cols-2 gap-8 ">
            <Songs />
            <div class="bg-2ndbg p-6 rounded-lg aspect-square w-full">
                <Pie :data="chartData" :options="chartOptions" />
            </div>
        </section>


        <section
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-10 gap-6 w-full">
            <ArtistCard v-for="artist in artists" :key="artist.name" :artist="artist" />
        </section>
    </div>
</template>