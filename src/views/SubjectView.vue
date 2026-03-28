<template>
  <div class="subject-view">
    <LoadingSpinner v-if="loading" label="Loading subject…" />
    <p v-else-if="error" class="error-msg">⚠️ {{ error }}</p>

    <template v-else-if="subject">
      <!-- Subject header -->
      <div class="subj-header" :style="{ '--sc': subject.color }">
        <div class="subj-header-inner">
          <RouterLink to="/" class="back-link">← Home</RouterLink>
          <div class="subj-title-row">
            <span class="subj-icon">{{ subject.icon }}</span>
            <div>
              <h1 class="subj-title">{{ subject.title }}</h1>
              <p class="subj-desc">{{ subject.description }}</p>
            </div>
          </div>

          <!-- Subject-level stats -->
          <div class="subj-stats">
            <StatBadge :value="stats.answered" label="Answered" variant="default" />
            <StatBadge :value="stats.correct"  label="Correct"  variant="correct" />
            <StatBadge :value="stats.wrong"    label="Wrong"    variant="wrong" />
            <StatBadge
              :value="stats.answered > 0 ? Math.round(stats.correct / stats.answered * 100) + '%' : '—'"
              label="Score" variant="warn"
            />
            <button
              v-if="stats.answered > 0"
              class="reset-btn"
              @click="resetSubject"
            >Reset</button>
          </div>

          <ProgressBar
            :answered="stats.answered"
            :total="subject.totalQuestions"
            :color="subject.color"
            :show-label="true"
          />
        </div>
      </div>

      <!-- ── Flat topic list (most subjects) ── -->
      <div v-if="subject.topics && subject.topics.length" class="topics-wrap">
        <h2 class="topics-heading">Topics</h2>
        <div class="topic-list">
          <RouterLink
            v-for="topic in subject.topics"
            :key="topic.id"
            :to="`/subject/${subjectId}/topic/${topic.id}`"
            class="topic-row"
          >
            <div class="topic-row-left">
              <span class="topic-name">{{ topic.title }}</span>
              <span class="topic-count">{{ topic.questionCount }} questions</span>
            </div>
            <div class="topic-row-right">
              <div class="topic-prog-wrap">
                <ProgressBar
                  :answered="store.getTopicStats(subjectId, topic.id).answered"
                  :total="topic.questionCount"
                  :color="subject.color"
                />
              </div>
              <span class="topic-answered">
                {{ store.getTopicStats(subjectId, topic.id).answered }}/{{ topic.questionCount }}
              </span>
            </div>
            <span class="topic-arrow">→</span>
          </RouterLink>
        </div>
      </div>

      <!-- ── Sectioned layout (OB/GYN etc.) ── -->
      <div v-else-if="subject.sections && subject.sections.length" class="topics-wrap">
        <h2 class="topics-heading">Topics</h2>

        <div class="section-list">
          <div
            v-for="section in subject.sections"
            :key="section.id"
            class="section-block"
          >
            <!-- Section header / toggle -->
            <button
              class="section-header"
              :class="{ open: openSections.has(section.id) }"
              :style="{ '--sc': subject.color }"
              @click="toggleSection(section.id)"
            >
              <div class="section-header-left">
                <span class="section-chevron">{{ openSections.has(section.id) ? '▾' : '▸' }}</span>
                <span class="section-title">{{ section.title }}</span>
                <span class="section-pill">{{ section.topics.length }} topics</span>
              </div>
              <div class="section-header-right">
                <ProgressBar
                  :answered="sectionAnswered(section)"
                  :total="sectionTotal(section)"
                  :color="subject.color"
                  class="section-prog"
                />
                <span class="topic-answered">
                  {{ sectionAnswered(section) }}/{{ sectionTotal(section) }}
                </span>
              </div>
            </button>

            <!-- Collapsible topic list -->
            <div v-show="openSections.has(section.id)" class="section-topics">
              <RouterLink
                v-for="topic in section.topics"
                :key="topic.id"
                :to="`/subject/${subjectId}/topic/${topic.id}`"
                class="topic-row topic-row--indented"
              >
                <div class="topic-row-left">
                  <span class="topic-name">{{ topic.title }}</span>
                  <span class="topic-count">{{ topic.questionCount }} questions</span>
                </div>
                <div class="topic-row-right">
                  <div class="topic-prog-wrap">
                    <ProgressBar
                      :answered="store.getTopicStats(subjectId, topic.id).answered"
                      :total="topic.questionCount"
                      :color="subject.color"
                    />
                  </div>
                  <span class="topic-answered">
                    {{ store.getTopicStats(subjectId, topic.id).answered }}/{{ topic.questionCount }}
                  </span>
                </div>
                <span class="topic-arrow">→</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useSubject } from '@/composables/useData'
import { useProgressStore } from '@/stores/progress'
import StatBadge from '@/components/StatBadge.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Section } from '@/types'

const props = defineProps<{ subjectId: string }>()

const store = useProgressStore()
const { subject, loading, error } = useSubject(props.subjectId)

const stats = computed(() => store.getSubjectStats(props.subjectId))

// Track which sections are expanded — start with all open
const openSections = ref<Set<string>>(new Set())

// When subject loads, open all sections by default
import { watch } from 'vue'
watch(subject, (s) => {
  if (s?.sections) {
    openSections.value = new Set(s.sections.map((sec) => sec.id))
  }
})

function toggleSection(id: string) {
  const next = new Set(openSections.value)
  next.has(id) ? next.delete(id) : next.add(id)
  openSections.value = next
}

function sectionTotal(section: Section): number {
  return section.topics.reduce((sum, t) => sum + t.questionCount, 0)
}

function sectionAnswered(section: Section): number {
  return section.topics.reduce(
    (sum, t) => sum + store.getTopicStats(props.subjectId, t.id).answered,
    0
  )
}

function resetSubject() {
  if (confirm(`Reset all progress for ${subject.value?.title}?`)) {
    store.resetSubject(props.subjectId)
  }
}
</script>

<style scoped>
/* ── Header ── */
.subj-header {
  background: linear-gradient(160deg, #0f172a 0%, #1a1f35 100%);
  border-bottom: 1px solid var(--border);
  padding: 2rem 1.5rem;
  border-top: 3px solid var(--sc, var(--accent));
}
.subj-header-inner { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }

.back-link { font-size: 0.82rem; color: var(--muted); text-decoration: none; }
.back-link:hover { color: var(--accent); }

.subj-title-row { display: flex; gap: 1rem; align-items: center; }
.subj-icon { font-size: 2.5rem; line-height: 1; }
.subj-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; }
.subj-desc { color: var(--muted); font-size: 0.88rem; margin-top: 0.25rem; }

.subj-stats {
  display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
}
.reset-btn {
  background: #ef444415; border: 1px solid #ef444430;
  color: var(--wrong); border-radius: var(--radius-sm);
  padding: 0.35rem 0.8rem; font-size: 0.8rem; font-weight: 600;
  transition: background 0.15s; margin-left: auto;
}
.reset-btn:hover { background: #ef444428; }

/* ── Topics ── */
.topics-wrap { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.topics-heading { font-size: 1rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }

.topic-list { display: flex; flex-direction: column; gap: 0.5rem; }

.topic-row {
  display: flex; align-items: center; gap: 1rem;
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 0.9rem 1rem;
  text-decoration: none; color: inherit;
  transition: border-color 0.15s, background 0.15s;
}
.topic-row:hover { border-color: var(--accent); background: var(--accent-lo); text-decoration: none; }

.topic-row-left { display: flex; flex-direction: column; gap: 0.2rem; min-width: 180px; }
.topic-name { font-size: 0.95rem; font-weight: 600; }
.topic-count { font-size: 0.75rem; color: var(--muted); }

.topic-row-right { flex: 1; display: flex; align-items: center; gap: 0.75rem; }
.topic-prog-wrap { flex: 1; }
.topic-answered { font-size: 0.75rem; color: var(--muted); white-space: nowrap; min-width: 50px; text-align: right; }

.topic-arrow { color: var(--muted); font-size: 1rem; flex-shrink: 0; }

.error-msg { color: var(--wrong); padding: 3rem; text-align: center; }

/* ── Sectioned layout (OB/GYN etc.) ── */
.section-list { display: flex; flex-direction: column; gap: 0.75rem; }

.section-block {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.section-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  background: var(--card);
  border: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.section-header:hover { background: color-mix(in srgb, var(--sc, var(--accent)) 8%, var(--card)); }
.section-header.open { background: color-mix(in srgb, var(--sc, var(--accent)) 8%, var(--card)); border-bottom: 1px solid var(--border); }

.section-header-left { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
.section-chevron { font-size: 0.85rem; color: var(--muted); width: 14px; display: inline-block; }
.section-title { font-size: 0.98rem; font-weight: 700; letter-spacing: -0.2px; }
.section-pill {
  font-size: 0.72rem; font-weight: 600;
  background: color-mix(in srgb, var(--sc, var(--accent)) 15%, transparent);
  color: var(--sc, var(--accent));
  padding: 0.15rem 0.55rem; border-radius: 99px;
}

.section-header-right {
  flex: 1; display: flex; align-items: center; gap: 0.75rem;
  justify-content: flex-end; max-width: 300px;
}
.section-prog { flex: 1; }

.section-topics { display: flex; flex-direction: column; }
.section-topics .topic-row {
  border-radius: 0; border: none; border-bottom: 1px solid var(--border);
}
.section-topics .topic-row:last-child { border-bottom: none; }
.topic-row--indented { padding-left: 2.2rem; }
</style>
