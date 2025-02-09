<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { ref, onMounted, watch, computed } from 'vue';
import { useOAuthStore } from '../stores/OAuth';

const route = useRoute();
const oauthStore = useOAuthStore();
const userProfile = ref(null);
const showDropdown = ref(false);
const loading = ref(false);


const isHomeActive = computed(() => route.path === '/home' || route.path === '/');
const isFaqActive = computed(() => route.path === '/faq');

const fetchProfile = async () => {
    try {
        loading.value = true;
        if (oauthStore.isAuthenticated) {
            const profile = await oauthStore.getUserProfile();
            if (profile) {
                userProfile.value = profile;
                console.log('Profile loaded:', profile); // Debug log
            }
        } else {
            userProfile.value = null;
        }
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        userProfile.value = null;
    } finally {
        loading.value = false;
    }
};

watch(() => oauthStore.isAuthenticated, (newValue) => {
    if (newValue) {
        fetchProfile();
    } else {
        userProfile.value = null;
    }
}, { immediate: true });

onMounted(() => {
    if (oauthStore.isAuthenticated) {
        fetchProfile();
    }
});
</script>

<template>
    <header class="bg-2ndbg h-[5em] flex items-center px-6">
        <nav class="container mx-auto flex justify-between items-center">
            <div class="flex gap-6">
                <RouterLink to="/home" class="font-bold font-family uppercase" :class="{
                    'text-primary': isHomeActive,
                    'text-white hover:text-primary/80': !isHomeActive
                }">home</RouterLink>
                <RouterLink to="/faq" class=" font-bold font-family uppercase" :class="{
                    'text-primary': isFaqActive,
                    'text-white hover:text-primary/80': !isFaqActive
                }">faq</RouterLink>
            </div>

            <div v-if="userProfile" class="relative">
                <button @click="showDropdown = !showDropdown"
                    class="flex items-center gap-3 text-black hover:opacity-80 transition-opacity cursor-pointer font-family bg-primary px-4 py-2 rounded-full text-base">
                    <img :src="userProfile.images?.[0]?.url" alt="Profile" class="w-8 h-8 rounded-full" />
                    <span>{{ userProfile.display_name }}</span>
                </button>

                <div v-if="showDropdown"
                    class="absolute right-0 mt-2 w-64 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg pt-2 z-50"
                    @mouseleave="showDropdown = false">
                    <div class="px-4 py-2 border-b border-primary">
                        <p class="text-white font-family">{{ userProfile.email }}</p>
                        <p class="text-gray-400 text-sm font-family">Country: {{ userProfile.country }}</p>
                    </div>
                    <button @click="oauthStore.logout()"
                        class="w-full text-left px-4 py-2 text-red-500 hover:bg-primary hover:text-black transition cursor-pointer font-family hover:rounded-b-lg">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    </header>
</template>
