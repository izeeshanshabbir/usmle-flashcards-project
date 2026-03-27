<template>
  <div class="progress-wrap" :title="`${answered} of ${total} answered`">
    <div class="bar-bg">
      <div
        class="bar-fill"
        :style="{ width: pct + '%', background: color }"
      />
    </div>
    <span v-if="showLabel" class="bar-label">{{ answered }}/{{ total }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  answered: number
  total: number
  color?: string
  showLabel?: boolean
}>()

const pct = computed(() =>
  props.total > 0 ? Math.min(100, Math.round((props.answered / props.total) * 100)) : 0
)
</script>

<style scoped>
.progress-wrap {
  display: flex; align-items: center; gap: 0.6rem;
}
.bar-bg {
  flex: 1; height: 6px; background: var(--border);
  border-radius: 3px; overflow: hidden;
}
.bar-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.4s ease;
  background: var(--accent);
}
.bar-label {
  font-size: 0.75rem; color: var(--muted);
  white-space: nowrap; flex-shrink: 0;
}
</style>
