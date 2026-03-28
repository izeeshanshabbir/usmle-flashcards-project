<template>
  <div class="topic-view">
    <LoadingSpinner v-if="loading" label="Loading questions…" />
    <p v-else-if="error" class="error-msg">⚠️ {{ error }}</p>

    <template v-else-if="topic && subject">
      <!-- Sticky stats bar -->
      <div class="stats-bar">
        <div class="stats-bar-inner">
          <div class="stats-bar-left">
            <RouterLink :to="`/subject/${subjectId}`" class="back-link">
              ← {{ subject.title }}
            </RouterLink>
            <h1 class="topic-title">{{ topic.title }}</h1>
          </div>

          <div class="stats-pills">
            <span class="pill total">{{ stats.answered }}/{{ topic.questionCount }}</span>
            <span class="pill correct">✓ {{ stats.correct }}</span>
            <span class="pill wrong">✗ {{ stats.wrong }}</span>
            <span class="pill pct">
              {{ stats.answered > 0 ? Math.round(stats.correct / stats.answered * 100) + '%' : '—' }}
            </span>
          </div>

          <button v-if="stats.answered > 0" class="reset-btn" @click="resetTopic">
            Reset
          </button>
        </div>

        <div class="stats-bar-progress">
          <ProgressBar
            :answered="stats.answered"
            :total="topic.questionCount"
            :color="subject.color"
          />
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="filter-bar">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
          <span class="filter-count">{{ f.count }}</span>
        </button>
      </div>

      <!-- Question grid -->
      <div class="questions-wrap">
        <div class="questions-grid">
          <QuestionCard
            v-for="q in filteredQuestions"
            :key="q.id"
            :question="q"
            :subject-id="subjectId"
            :topic-id="topicId"
          />
        </div>

        <p v-if="filteredQuestions.length === 0" class="empty-msg">
          No questions in this filter.
        </p>
      </div>

      <!-- Scroll-to-top -->
      <button class="fab-top" @click="scrollTop" title="Back to top">↑</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useSubject } from '@/composables/useData'
import { useProgressStore } from '@/stores/progress'
import type { Question } from '@/types'
import QuestionCard from '@/components/QuestionCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const props = defineProps<{
  subjectId: string
  topicId: string
}>()

const store = useProgressStore()
const { subject, loading, error } = useSubject(props.subjectId)

const topic = computed(() => {
  const s = subject.value
  if (!s) return null
  // Flat subjects
  if (s.topics?.length) return s.topics.find((t) => t.id === props.topicId) ?? null
  // Sectioned subjects (e.g. OB/GYN)
  if (s.sections?.length) {
    for (const sec of s.sections) {
      const found = sec.topics.find((t) => t.id === props.topicId)
      if (found) return found
    }
  }
  return null
})

const stats = computed(() => store.getTopicStats(props.subjectId, props.topicId))

// ── Filters ────────────────────────────────────────────────────────────────
type Filter = 'all' | 'unanswered' | 'correct' | 'wrong'
const activeFilter = ref<Filter>('all')

const filters = computed(() => {
  const qs = topic.value?.questions ?? []
  return [
    { value: 'all' as Filter,        label: 'All',        count: qs.length },
    { value: 'unanswered' as Filter, label: 'Unanswered', count: qs.filter(q => !store.getQuestionResult(props.subjectId, props.topicId, q.id)).length },
    { value: 'correct' as Filter,    label: 'Correct',    count: stats.value.correct },
    { value: 'wrong' as Filter,      label: 'Wrong',      count: stats.value.wrong },
  ]
})

const filteredQuestions = computed<Question[]>(() => {
  const qs = topic.value?.questions ?? []
  if (activeFilter.value === 'all') return qs
  return qs.filter((q) => {
    const r = store.getQuestionResult(props.subjectId, props.topicId, q.id)
    if (activeFilter.value === 'unanswered') return r === null
    if (activeFilter.value === 'correct')    return r?.correct === true
    if (activeFilter.value === 'wrong')      return r?.correct === false
    return true
  })
})

function resetTopic() {
  if (confirm(`Reset progress for "${topic.value?.title}"?`)) {
    store.resetTopic(props.subjectId, props.topicId)
  }
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
/* ── Stats bar ── */
.stats-bar {
  position: sticky; top: 56px; z-index: 50;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.stats-bar-inner {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  padding: 0.7rem 1.5rem; max-width: 1200px; margin: 0 auto;
}
.stats-bar-progress { padding: 0 1.5rem 0.5rem; max-width: 1200px; margin: 0 auto; }

.stats-bar-left { display: flex; flex-direction: column; gap: 0.1rem; }
.back-link { font-size: 0.75rem; color: var(--muted); text-decoration: none; }
.back-link:hover { color: var(--accent); }
.topic-title { font-size: 1rem; font-weight: 700; }

.stats-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-left: auto; }
.pill {
  font-size: 0.78rem; font-weight: 700;
  padding: 0.22rem 0.6rem; border-radius: 20px;
  border: 1px solid transparent;
}
.pill.total   { color: var(--accent);  border-color: #3b82f633; background: #3b82f610; }
.pill.correct { color: var(--correct); border-color: #22c55e33; background: #22c55e10; }
.pill.wrong   { color: var(--wrong);   border-color: #ef444433; background: #ef444410; }
.pill.pct     { color: var(--warn);    border-color: #f59e0b33; background: #f59e0b10; }

.reset-btn {
  background: #ef444415; border: 1px solid #ef444430;
  color: var(--wrong); border-radius: var(--radius-sm);
  padding: 0.3rem 0.7rem; font-size: 0.78rem; font-weight: 600;
  transition: background 0.15s;
}
.reset-btn:hover { background: #ef444428; }

/* ── Filter tabs ── */
.filter-bar {
  display: flex; gap: 0.4rem; padding: 0.9rem 1.5rem;
  max-width: 1200px; margin: 0 auto;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}
.filter-btn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.85rem; border-radius: 20px;
  font-size: 0.82rem; font-weight: 600;
  color: var(--muted); background: var(--surface);
  border: 1px solid var(--border); transition: all 0.15s;
}
.filter-btn:hover { color: var(--accent); border-color: var(--accent); }
.filter-btn.active { color: var(--accent); border-color: var(--accent); background: var(--accent-lo); }
.filter-count {
  background: var(--border); color: var(--muted);
  border-radius: 10px; padding: 0.05rem 0.4rem; font-size: 0.72rem;
}
.filter-btn.active .filter-count { background: var(--accent-lo); color: var(--accent); }

/* ── Questions ── */
.questions-wrap { padding: 1.25rem 1.5rem 5rem; max-width: 1200px; margin: 0 auto; }

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 1rem;
}

.empty-msg { color: var(--muted); text-align: center; padding: 3rem; }

/* ── FAB ── */
.fab-top {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 200;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--surface); border: 1px solid var(--border-hi);
  color: var(--accent); font-size: 1.1rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px #0006; transition: background 0.15s;
}
.fab-top:hover { background: var(--card); }

.error-msg { color: var(--wrong); padding: 3rem; text-align: center; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .questions-grid { grid-template-columns: 1fr; }
  .stats-bar-inner { flex-direction: column; align-items: flex-start; }
  .stats-pills { margin-left: 0; }
}
</style>
