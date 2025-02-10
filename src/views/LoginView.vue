<script setup>
import { useOAuthStore } from '../stores/OAuth';
import { onMounted } from 'vue';

const oauthStore = useOAuthStore();
const { isAuthenticated, login, logout } = oauthStore;

onMounted(() => {
    if (window.location.hash) {
        oauthStore.handleCallback();
    }

    if (isAuthenticated) {
        oauthStore.getUserProfile();
    }
});
</script>

<template>
    <div class="h-[calc(100vh-10rem)] w-full flex items-center justify-center ">
        <div class="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl text-center max-w-md w-11/12 font-family">
            <img src="../assets/Circle-icons-bar-chart.svg" alt="Spotify Logo" class="w-32 mx-auto mb-6" />
            <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">Vítejte u spotify statistik</h1>
            <p class="text-gray-200 mb-8">Zobrazte si své statistiky z poslechu</p>

            <button v-if="!isAuthenticated" @click="login" class="cursor-pointer bg-transparent text-white border-gray-400 border px-8 py-3 rounded-full font-semibold 
                       hover:border-white transition duration-200 ease-in-out
                       flex items-center justify-center gap-2 mx-auto w-full md:w-auto font-family">
                <img src="@/assets/Spotify_icon.svg" alt="" class="w-6 h-6" />
                Přihlásit se přes Spotify
            </button>

            <button v-else @click="logout" class="bg-red-500 text-white px-8 py-3 rounded-full font-semibold 
                       hover:scale-105 transition duration-200 ease-in-out w-full md:w-auto">
                Logout
            </button>
        </div>
    </div>
</template>
