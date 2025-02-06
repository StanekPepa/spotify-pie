<script setup>
import { RouterLink } from 'vue-router'
</script>
<template>
    <header class="bg-2ndbg">
        <nav>
            <div class="container mx-auto flex justify-between items-center">
                <router-link to="/" class="text-white font-bold">Home</router-link>
                <router-link to="/about" class="text-white font-bold">About</router-link>
            </div>
        </nav>
    </header>
</template>