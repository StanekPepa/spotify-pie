<script setup>
import { RouterLink } from 'vue-router'
</script>
<template>
    <header class="bg-2ndbg h-[5em] flex items-center justify-center">

        <nav class="container mx-auto flex justify-between items-center w-40">
            <router-link to="/" class="text-white font-bold">Home</router-link>
            <router-link to="/about" class="text-white font-bold">About</router-link>
        </nav>

    </header>
</template>