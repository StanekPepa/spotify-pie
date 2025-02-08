<script setup>
import { RouterLink } from 'vue-router';
import { ref, onMounted, watch } from 'vue';
import { useOAuthStore } from '../stores/OAuth';

const oauthStore = useOAuthStore();
const userProfile = ref(null);
const showDropdown = ref(false);

const fetchProfile = async () => {
    try {
        if (oauthStore.isAuthenticated) {
            const profile = await oauthStore.getUserProfile();
            if (profile) {
                userProfile.value = profile;
            }
        } else {
            userProfile.value = null;
        }
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        userProfile.value = null;
    }
};

watch(() => oauthStore.isAuthenticated, (newValue) => {
    if (newValue) {
        fetchProfile();
    } else {
        userProfile.value = null;
    }
}, { immediate: true });

onMounted(fetchProfile);
</script>

<template>
    <header class="bg-2ndbg h-[5em] flex items-center px-6">
        <nav class="container mx-auto flex justify-between items-center">
            <div class="flex gap-6">
                <RouterLink to="/home" class="text-white font-bold font-family">Home</RouterLink>
                <RouterLink to="/faq" class="text-white font-bold font-family">FAQ</RouterLink>
            </div>

            <div v-if="userProfile" class="relative">
                <button @click="showDropdown = !showDropdown"
                    class="flex items-center gap-3 text-white hover:opacity-80 transition-opacity cursor-pointer font-family">
                    <img :src="userProfile.images?.[0]?.url" alt="Profile" class="w-8 h-8 rounded-full" />
                    <span>{{ userProfile.display_name }}</span>
                </button>

                <div v-if="showDropdown"
                    class="absolute right-0 mt-2 w-64 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg py-2 z-50"
                    @mouseleave="showDropdown = false">
                    <div class="px-4 py-2 border-b border-primary">
                        <p class="text-white font-family">{{ userProfile.email }}</p>
                        <p class="text-gray-400 text-sm font-family">Country: {{ userProfile.country }}</p>
                    </div>
                    <button @click="oauthStore.logout()"
                        class="w-full text-left px-4 py-2 text-red-500 hover:bg-primary hover:text-black transition-colors cursor-pointer font-family">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    </header>
</template>
