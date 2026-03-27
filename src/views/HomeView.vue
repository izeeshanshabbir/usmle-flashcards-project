<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">
          <span class="hero-emoji">🩺</span>
          MedFlash
        </h1>
        <p class="hero-sub">
          {{ totalQ.toLocaleString() }} exam-style MCQs across 5 subjects.
          Click a subject to start practising.
        </p>

        <!-- Overall stats bar -->
        <div v-if="store.totalAnswered > 0" class="global-stats">
          <StatBadge :value="store.totalAnswered" label="Answered" variant="default" />
          <StatBadge :value="store.totalCorrect" label="Correct" variant="correct" />
          <StatBadge :value="store.totalAnswered - store.totalCorrect" label="Wrong" variant="wrong" />
          <StatBadge
            :value="store.totalAnswered > 0
              ? Math.round((store.totalCorrect / store.totalAnswered) * 100) + '%'
              : '—'"
            label="Score"
            variant="warn"
          />
          <button class="reset-all-btn" @click="confirmReset">Reset all</button>
        </div>
      </div>
    </section>

    <!-- Subject grid -->
    <section class="subjects">
      <LoadingSpinner v-if="loading" label="Loading subjects…" />

      <p v-else-if="error" class="error-msg">⚠️ {{ error }}</p>

      <div v-else class="subject-grid">
        <RouterLink
          v-for="subj in index?.subjects"
          :key="subj.id"
          :to="`/subject/${subj.id}`"
          class="subject-card"
          :style="{ '--subject-color': subj.color }"
        >
          <div class="sc-top">
            <span class="sc-icon">{{ subj.icon }}</span>
            <div class="sc-info">
              <h2 class="sc-title">{{ subj.title }}</h2>
              <p class="sc-desc">{{ subj.description }}</p>
            </div>
          </div>

          <div class="sc-meta">
            <span class="sc-badge">{{ subj.totalQuestions.toLocaleString() }} questions</span>
            <span class="sc-badge">{{ subj.topicCount }} topics</span>
          </div>

          <!-- Per-subject progress -->
          <div class="sc-progress">
            <ProgressBar
              :answered="store.getSubjectStats(subj.id).answered"
              :total="subj.totalQuestions"
              :color="subj.color"
              :show-label="true"
            />
          </div>

          <div v-if="store.getSubjectStats(subj.id).answered > 0" class="sc-score">
            <span class="score-pct" :style="{ color: subj.color }">
              {{ Math.round((store.getSubjectStats(subj.id).correct / store.getSubjectStats(subj.id).answered) * 100) }}%
            </span>
            <span class="score-label">accuracy</span>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchIndex } from '@/composables/useData'
import { useProgressStore } from '@/stores/progress'
import type { SubjectIndex } from '@/types'
import StatBadge from '@/components/StatBadge.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const store = useProgressStore()
const index  = ref<SubjectIndex | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

onMounted(async () => {
  try {
    index.value = await fetchIndex()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const totalQ = computed(() =>
  index.value?.subjects.reduce((s, sub) => s + sub.totalQuestions, 0) ?? 0
)

function confirmReset() {
  if (confirm('Reset ALL progress across every subject? This cannot be undone.')) {
    store.resetAll()
  }
}
</script>

<style scoped>
/* ── Hero ── */
.hero {
  background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%);
  border-bottom: 1px solid var(--border);
  padding: 3.5rem 1.5rem 2.5rem;
}
.hero-inner { max-width: 860px; margin: 0 auto; }

.hero-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800; letter-spacing: -1px;
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.hero-emoji { font-size: 0.85em; }
.hero-sub { color: var(--muted); font-size: 1rem; max-width: 540px; line-height: 1.6; }

.global-stats {
  display: flex; align-items: center; gap: 0.75rem;
  margin-top: 1.5rem; flex-wrap: wrap;
}
.reset-all-btn {
  margin-left: auto;
  background: #ef444418; border: 1px solid #ef444433;
  color: var(--wrong); border-radius: var(--radius-sm);
  padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 600;
  transition: background 0.15s;
}
.reset-all-btn:hover { background: #ef444430; }

/* ── Subjects ── */
.subjects { padding: 2rem 1.5rem 4rem; max-width: 1100px; margin: 0 auto; }

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 1.25rem;
}

.subject-card {
  display: flex; flex-direction: column; gap: 1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  text-decoration: none; color: inherit;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  position: relative; overflow: hidden;
}
.subject-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--subject-color, var(--accent));
  opacity: 0; transition: opacity 0.2s;
}
.subject-card:hover {
  border-color: var(--subject-color, var(--accent));
  transform: translateY(-2px);
  box-shadow: 0 8px 32px #0006;
  text-decoration: none;
}
.subject-card:hover::before { opacity: 1; }

.sc-top { display: flex; gap: 1rem; align-items: flex-start; }
.sc-icon { font-size: 2.2rem; flex-shrink: 0; line-height: 1; }
.sc-info { flex: 1; }
.sc-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.3rem; }
.sc-desc { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }

.sc-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.sc-badge {
  font-size: 0.72rem; font-weight: 600;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 20px; padding: 0.2rem 0.6rem; color: var(--muted);
}

.sc-score {
  display: flex; align-items: baseline; gap: 0.35rem;
}
.score-pct { font-size: 1.3rem; font-weight: 800; }
.score-label { font-size: 0.75rem; color: var(--muted); }

.error-msg { color: var(--wrong); padding: 2rem; text-align: center; }
</style>
