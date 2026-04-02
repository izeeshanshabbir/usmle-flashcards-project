<template>
  <div class="app">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-icon">🩺</span>
        <span class="brand-name">MedFlash</span>
      </RouterLink>

      <nav class="header-nav">
        <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">
          Home
        </RouterLink>
        <RouterLink
          to="/review"
          class="nav-link nav-link--review"
          :class="{ active: route.path === '/review' }"
        >
          🔁 Review
        </RouterLink>
        <RouterLink
          to="/test"
          class="nav-link nav-link--test"
          :class="{ active: route.path === '/test' }"
        >
          📝 Mock Test
        </RouterLink>
      </nav>

      <div class="header-stats" v-if="store.totalAnswered > 0">
        <span class="stat correct">✓ {{ store.totalCorrect }}</span>
        <span class="stat wrong">✗ {{ store.totalAnswered - store.totalCorrect }}</span>
      </div>
    </header>

    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const store = useProgressStore()
</script>

<style scoped>
.app { display: flex; flex-direction: column; min-height: 100vh; }

/* ── Header ── */
.app-header {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; gap: 1.5rem;
  padding: 0 1.5rem;
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
}

.brand {
  display: flex; align-items: center; gap: 0.5rem;
  text-decoration: none; flex-shrink: 0;
}
.brand-icon { font-size: 1.3rem; }
.brand-name { font-size: 1.1rem; font-weight: 700; color: var(--text); letter-spacing: -0.3px; }

.header-nav { display: flex; gap: 0.25rem; flex: 1; }
.nav-link {
  padding: 0.35rem 0.75rem; border-radius: var(--radius-sm);
  font-size: 0.88rem; color: var(--muted);
  text-decoration: none; transition: all 0.15s;
}
.nav-link:hover, .nav-link.active { color: var(--accent); background: var(--accent-lo); }
.nav-link--review:hover, .nav-link--review.active { color: var(--wrong); background: #ef444415; }
.nav-link--test:hover, .nav-link--test.active { color: var(--warn); background: #f59e0b15; }

.header-stats { display: flex; gap: 0.5rem; flex-shrink: 0; }
.stat {
  font-size: 0.8rem; font-weight: 700;
  padding: 0.2rem 0.6rem; border-radius: 20px;
}
.stat.correct { color: var(--correct); background: #22c55e15; }
.stat.wrong   { color: var(--wrong);   background: #ef444415; }

/* ── Main ── */
.app-main { flex: 1; }
</style>
