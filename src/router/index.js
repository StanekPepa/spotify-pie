import { createRouter, createWebHistory } from "vue-router";
import { useOAuthStore } from "../stores/OAuth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/home",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const oauthStore = useOAuthStore();

  // Handle OAuth callback if there's a hash in URL
  if (window.location.hash) {
    oauthStore.handleCallback();
    // Clear the hash to prevent repeated processing
    window.location.hash = "";
    // After successful login, redirect to home
    if (oauthStore.isAuthenticated) {
      return next({ name: "home" });
    }
  }

  // Check if token exists in localStorage
  const storedToken = localStorage.getItem("spotify_token");
  if (storedToken && !oauthStore.isAuthenticated) {
    oauthStore.accessToken = storedToken;
  }

  // Handle protected routes
  if (to.meta.requiresAuth && !oauthStore.isAuthenticated) {
    return next({ name: "login" });
  }

  // If on login page and already authenticated, redirect to home
  if (to.name === "login" && oauthStore.isAuthenticated) {
    return next({ name: "home" });
  }

  next();
});

export default router;
