import { createRouter, createWebHistory } from "vue-router";
import { useOAuthStore } from "../stores/OAuth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/home",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/faq",
      name: "faq",
      component: () => import("../views/FAQView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/",
      name: "root",
      component: () => import("../views/CallbackView.vue"),
      meta: { requiresAuth: false },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const oauthStore = useOAuthStore();

  // Handle OAuth callback if there's a hash in URL
  if (window.location.hash) {
    oauthStore.handleCallback();
    window.location.hash = "";
    if (oauthStore.isAuthenticated) {
      return next({ name: "home" });
    }
  }

  // Check if token exists in localStorage
  const storedToken = localStorage.getItem("spotify_token");
  if (storedToken && !oauthStore.isAuthenticated) {
    oauthStore.accessToken = storedToken;
  }

  // Allow access to FAQ without authentication
  if (to.name === "faq") {
    return next();
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
