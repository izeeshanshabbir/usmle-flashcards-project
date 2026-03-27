<template>
  <div class="spinner-wrap">
    <div class="spinner" :style="{ width: size, height: size, borderTopColor: color }" />
    <p v-if="label" class="spinner-label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: string
  color?: string
  label?: string
}>(), {
  size: '36px',
  color: 'var(--accent)',
})
</script>

<style scoped>
.spinner-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem; padding: 3rem;
}
.spinner {
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner-label { color: var(--muted); font-size: 0.85rem; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
