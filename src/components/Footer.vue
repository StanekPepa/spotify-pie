<template>
    <footer class="bg-2ndbg text-white h-[5em] flex items-center justify-center font-family">
        <p>&copy; 2025
            <a href="https://stanekj.com" target="_blank" rel="noopener noreferrer"
                class="relative inline-block hover-underline-animation">
                Josef Staněk
            </a>
        </p>
    </footer>
</template>

<style scoped>
.hover-underline-animation {
    position: relative;
}

.hover-underline-animation::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 1px;
    bottom: 0;
    left: 0;
    background-color: #fff;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease-in-out;
}

.hover-underline-animation:hover::after {
    transform: scaleX(1);
}
</style>