<script setup>
import { onMounted } from 'vue';
import { useOAuthStore } from '../stores/OAuth';

const oauthStore = useOAuthStore();

onMounted(() => {
    oauthStore.handleCallback();
});
</script>

<template>
    <div class="min-h-screen flex items-center justify-center">
        <div class="text-white text-center">
            <div class="animate-spin h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
            <p class="mt-4">Authenticating...</p>
        </div>
    </div>
</template>