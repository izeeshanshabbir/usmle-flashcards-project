<template>
  <div class="review-view">
    <!-- Header -->
    <div class="review-header">
      <div class="review-header-inner">
        <RouterLink to="/" class="back-link">← Home</RouterLink>
        <div class="review-title-row">
          <span class="review-icon">🔁</span>
          <div>
            <h1 class="review-title">Review Wrong Answers</h1>
            <p class="review-desc">
              Re-answer your incorrect questions. Correct answers update your progress everywhere.
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div class="review-stats" v-if="wrongQuestions.length > 0">
          <div class="stat-chip">
            <span class="stat-val">{{ wrongQuestions.length }}</span>
            <span class="stat-lbl">Wrong</span>
          </div>
          <div class="stat-chip correct">
            <span class="stat-val">{{ correctedCount }}</span>
            <span class="stat-lbl">Fixed ✓</span>
          </div>
          <div class="stat-chip muted">
            <span class="stat-val">{{ stillWrong }}</span>
            <span class="stat-lbl">Remaining</span>
          </div>
          <button class="retry-btn" @click="retryAll">↺ Reset all to unanswered</button>
        </div>

        <!-- Progress -->
        <div v-if="wrongQuestions.length > 0" class="review-prog">
          <div
            class="review-prog-fill"
            :style="{ width: (correctedCount / wrongQuestions.length * 100) + '%' }"
          ></div>
          <span class="review-prog-label">
            {{ correctedCount }} / {{ wrongQuestions.length }} corrected
          </span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" label="Loading wrong answers…" />

    <!-- Empty state -->
    <div v-else-if="wrongQuestions.length === 0" class="empty-state">
      <div class="empty-icon">🎉</div>
      <h2>No wrong answers!</h2>
      <p>You haven't answered any questions incorrectly yet — or you've corrected them all.</p>
      <RouterLink to="/" class="go-home-btn">Go practise →</RouterLink>
    </div>

    <!-- Questions grid -->
    <div v-else class="review-content">
      <!-- Filter bar -->
      <div class="filter-bar">
        <button
          v-for="f in filterOptions"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
          <span class="filter-count">{{ f.count }}</span>
        </button>
      </div>

      <div class="questions-grid">
        <ReviewCard
          v-for="item in filteredQuestions"
          :key="`${item.subjectId}-${item.topicId}-${item.question.id}`"
          :item="item"
        />
      </div>
      <p v-if="filteredQuestions.length === 0" class="no-results">No questions in this filter.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchSubject } from '@/composables/useData'
import { useProgressStore } from '@/stores/progress'
import { fetchIndex } from '@/composables/useData'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import type { Question } from '@/types'

export interface WrongItem {
  subjectId: string
  topicId: string
  subjectTitle: string
  topicTitle: string
  question: Question
}

const store   = useProgressStore()
const loading = ref(true)
const wrongQuestions = ref<WrongItem[]>([])

type Filter = 'all' | 'still-wrong' | 'corrected'
const activeFilter = ref<Filter>('all')

// ── Build wrong-question list ─────────────────────────────────────────────
onMounted(async () => {
  try {
    const index = await fetchIndex()
    const items: WrongItem[] = []

    for (const subjMeta of index.subjects) {
      const subjProgress = store.progress[subjMeta.id]
      if (!subjProgress) continue

      // Check if any wrong answers exist in this subject before loading its JSON
      const hasWrong = Object.values(subjProgress).some(
        tp => Object.values(tp).some(r => !r.correct)
      )
      if (!hasWrong) continue

      const subjectFull = await fetchSubject(subjMeta.id)

      // Flatten topics (handles both flat and sectioned subjects)
      const allTopics = subjectFull.topics
        ? subjectFull.topics
        : (subjectFull.sections ?? []).flatMap(s => s.topics)

      for (const topic of allTopics) {
        const topicProgress = subjProgress[topic.id]
        if (!topicProgress) continue
        for (const q of topic.questions) {
          const result = topicProgress[q.id]
          if (result && !result.correct) {
            items.push({
              subjectId: subjMeta.id,
              topicId: topic.id,
              subjectTitle: subjMeta.title,
              topicTitle: topic.title,
              question: q,
            })
          }
        }
      }
    }
    wrongQuestions.value = items
  } finally {
    loading.value = false
  }
})

// ── Computed ──────────────────────────────────────────────────────────────
const correctedCount = computed(() =>
  wrongQuestions.value.filter(item => {
    const r = store.getQuestionResult(item.subjectId, item.topicId, item.question.id)
    return r?.correct === true
  }).length
)

const stillWrong = computed(() =>
  wrongQuestions.value.filter(item => {
    const r = store.getQuestionResult(item.subjectId, item.topicId, item.question.id)
    return r === null || r.correct === false
  }).length
)

const filterOptions = computed(() => [
  { value: 'all' as Filter,         label: 'All',         count: wrongQuestions.value.length },
  { value: 'still-wrong' as Filter, label: 'Still Wrong', count: stillWrong.value },
  { value: 'corrected' as Filter,   label: 'Corrected',   count: correctedCount.value },
])

const filteredQuestions = computed(() => {
  if (activeFilter.value === 'all') return wrongQuestions.value
  if (activeFilter.value === 'corrected')
    return wrongQuestions.value.filter(item => {
      const r = store.getQuestionResult(item.subjectId, item.topicId, item.question.id)
      return r?.correct === true
    })
  // still-wrong: unanswered (after undo/retry) or wrong
  return wrongQuestions.value.filter(item => {
    const r = store.getQuestionResult(item.subjectId, item.topicId, item.question.id)
    return r === null || r.correct === false
  })
})

function retryAll() {
  if (!confirm('Reset all these questions to unanswered so you can retry them?')) return
  for (const item of wrongQuestions.value) {
    store.undoAnswer(item.subjectId, item.topicId, item.question.id)
  }
}
</script>

<style scoped>
.review-header {
  background: linear-gradient(160deg, #0f172a 0%, #1a1035 100%);
  border-bottom: 1px solid var(--border);
  border-top: 3px solid var(--wrong);
  padding: 2rem 1.5rem;
}
.review-header-inner { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }

.back-link { font-size: 0.82rem; color: var(--muted); text-decoration: none; }
.back-link:hover { color: var(--accent); }

.review-title-row { display: flex; gap: 1rem; align-items: center; }
.review-icon { font-size: 2.5rem; line-height: 1; }
.review-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; }
.review-desc { color: var(--muted); font-size: 0.88rem; margin-top: 0.25rem; }

.review-stats { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.stat-chip {
  display: flex; flex-direction: column; align-items: center;
  background: #ef444415; border: 1px solid #ef444430;
  border-radius: var(--radius); padding: 0.4rem 0.9rem; min-width: 64px;
}
.stat-chip.correct { background: #22c55e15; border-color: #22c55e30; }
.stat-chip.muted   { background: var(--surface); border-color: var(--border); }
.stat-val { font-size: 1.2rem; font-weight: 800; color: var(--text); line-height: 1; }
.stat-chip.correct .stat-val { color: var(--correct); }
.stat-lbl { font-size: 0.68rem; font-weight: 600; color: var(--muted); margin-top: 2px; }

.retry-btn {
  margin-left: auto;
  background: #ef444415; border: 1px solid #ef444430;
  color: var(--wrong); border-radius: var(--radius-sm);
  padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 600;
  transition: background 0.15s;
}
.retry-btn:hover { background: #ef444428; }

.review-prog {
  position: relative; height: 8px; background: var(--border);
  border-radius: 99px; overflow: hidden;
}
.review-prog-fill {
  position: absolute; top: 0; left: 0; height: 100%;
  background: var(--correct); border-radius: 99px;
  transition: width 0.4s ease;
}
.review-prog-label {
  display: block; font-size: 0.72rem; color: var(--muted);
  margin-top: 0.4rem; text-align: right;
}

/* Filter */
.filter-bar {
  display: flex; gap: 0.4rem; padding: 1rem 1.5rem;
  max-width: 1200px; margin: 0 auto;
  border-bottom: 1px solid var(--border);
}
.filter-btn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.85rem; border-radius: 20px;
  font-size: 0.82rem; font-weight: 600;
  color: var(--muted); background: var(--surface);
  border: 1px solid var(--border); transition: all 0.15s;
}
.filter-btn:hover { color: var(--wrong); border-color: var(--wrong); }
.filter-btn.active { color: var(--wrong); border-color: var(--wrong); background: #ef444415; }
.filter-count {
  background: var(--border); color: var(--muted);
  border-radius: 10px; padding: 0.05rem 0.4rem; font-size: 0.72rem;
}
.filter-btn.active .filter-count { background: #ef444425; color: var(--wrong); }

/* Content */
.review-content { padding: 0 0 5rem; }
.questions-grid {
  padding: 1.25rem 1.5rem;
  max-width: 1200px; margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 1rem;
}
.no-results { text-align: center; color: var(--muted); padding: 3rem; }

/* Empty state */
.empty-state {
  max-width: 440px; margin: 6rem auto; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
}
.empty-icon { font-size: 3.5rem; }
.empty-state h2 { font-size: 1.5rem; font-weight: 800; }
.empty-state p { color: var(--muted); font-size: 0.9rem; line-height: 1.6; }
.go-home-btn {
  display: inline-block; margin-top: 0.5rem;
  background: var(--accent); color: #fff;
  padding: 0.65rem 1.5rem; border-radius: var(--radius);
  font-weight: 600; font-size: 0.9rem; text-decoration: none;
  transition: background 0.15s;
}
.go-home-btn:hover { background: #2563eb; text-decoration: none; }

@media (max-width: 600px) {
  .questions-grid { grid-template-columns: 1fr; }
}
</style>
