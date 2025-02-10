<script setup>
import FaqDropdown from '../components/FaqDropdown.vue';

const downloadUrl = `https://github.com/StanekPepa/spotify-pie/releases/download/v1.0.0/Spotify.Pie-Setup-1.0.0.exe`;
</script>

<template>
  <main class="text-white font-family flex flex-col items-center mt-10 pb-10">
    <h2 class="text-2xl font-bold uppercase mb-8">Desktopová aplikace</h2>
    <p class="text-center mb-6">Aplikaci si lze stáhnout také na desktopu. Stáhnutím souhlasíte s ochranou
      osobních údajů, která je napsána níže
      na této stránce</p>
    <a :href="downloadUrl" download class="bg-primary text-black px-8 py-3 rounded-full font-semibold mb-12
             hover:scale-105 transition-transform duration-200 ease-in-out
             flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Stáhnout aplikaci</a>
    <h2 class="text-2xl font-bold uppercase mb-8">FAQ</h2>
    <FaqDropdown />
  </main>
</template>
