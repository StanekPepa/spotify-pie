<script setup>
defineProps({
    artist: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['click']);

const handleClick = () => {
    emit('click', artist.spotifyUrl);
};
</script>

<template>
    <div @click="handleClick"
        class="bg-2ndbg rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer">
        <img :src="artist.image" :alt="artist.name" class="w-full h-48 object-cover" />
        <div class="p-4">
            <h3 class="text-xl font-bold text-white mb-2 font-family">
                {{ artist.name }}
            </h3>
            <div class="flex justify-between items-center">

                <div class="flex flex-wrap gap-2">
                    <span v-for="genre in artist.genres.slice(0, 2)" :key="genre"
                        class="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-family">
                        {{ genre }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>