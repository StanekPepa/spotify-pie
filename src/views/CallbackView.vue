<script setup>
import { onMounted } from 'vue';
import { useOAuthStore } from '../stores/OAuth';

const oauthStore = useOAuthStore();

onMounted(() => {
    if (window.location.hash) {
        oauthStore.handleCallback();
    }
});
</script>

<template>
    <div class="flex items-center justify-center h-screen">
        <p class="text-white">Přihlašování...</p>
    </div>
</template>