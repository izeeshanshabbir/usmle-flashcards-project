<template>
  <div class="stat-badge" :class="variant">
    <span class="stat-value">{{ value }}</span>
    <span class="stat-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: number | string
  label: string
  variant?: 'default' | 'correct' | 'wrong' | 'warn'
}>()
</script>

<style scoped>
.stat-badge {
  display: flex; flex-direction: column; align-items: center;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 0.6rem 1rem;
  min-width: 72px;
}
.stat-value { font-size: 1.35rem; font-weight: 800; line-height: 1; }
.stat-label { font-size: 0.7rem; color: var(--muted); margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }

.stat-badge.correct .stat-value { color: var(--correct); }
.stat-badge.wrong   .stat-value { color: var(--wrong);   }
.stat-badge.warn    .stat-value { color: var(--warn);     }
.stat-badge.default .stat-value { color: var(--accent);   }
</style>
