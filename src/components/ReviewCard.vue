<template>
  <div
    class="rcard"
    :class="{
      'state-correct': result?.correct === true,
      'state-wrong':   result?.correct === false,
      'state-unanswered': result === null,
    }"
  >
    <!-- Breadcrumb -->
    <div class="rcard-crumb">
      <span class="crumb-subject">{{ item.subjectTitle }}</span>
      <span class="crumb-sep">›</span>
      <span class="crumb-topic">{{ item.topicTitle }}</span>
      <span class="rcard-status" :class="statusClass">{{ statusLabel }}</span>
    </div>

    <!-- Stem -->
    <p class="rcard-stem">{{ item.question.stem }}</p>

    <!-- Options -->
    <div class="opts">
      <button
        v-for="opt in item.question.options"
        :key="opt.letter"
        class="opt-btn"
        :class="optClass(opt.letter)"
        :disabled="result !== null"
        @click="choose(opt.letter)"
      >
        <span class="opt-letter">{{ opt.letter }}</span>
        <span class="opt-text">{{ opt.text }}</span>
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="result !== null" class="feedback" :class="result.correct ? 'correct' : 'wrong'">
      <span>
        <template v-if="result.correct">✓ Correct! Answer: <strong>{{ item.question.answer }}</strong>.</template>
        <template v-else>✗ Chose <strong>{{ result.chosenLetter }}</strong>. Correct: <strong>{{ item.question.answer }}</strong>.</template>
      </span>
      <button class="undo-btn" @click="undo">↩ Undo</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import type { WrongItem } from '@/views/ReviewView.vue'

const props = defineProps<{ item: WrongItem }>()
const store = useProgressStore()

const result = computed(() =>
  store.getQuestionResult(props.item.subjectId, props.item.topicId, props.item.question.id)
)

const statusClass = computed(() => {
  if (result.value === null) return 'unanswered'
  return result.value.correct ? 'correct' : 'wrong'
})

const statusLabel = computed(() => {
  if (result.value === null) return '⬜ Retry'
  return result.value.correct ? '✅ Corrected' : '❌ Wrong'
})

function choose(letter: string) {
  if (result.value !== null) return
  store.recordAnswer(
    props.item.subjectId,
    props.item.topicId,
    props.item.question.id,
    letter,
    props.item.question.answer
  )
}

function undo() {
  store.undoAnswer(props.item.subjectId, props.item.topicId, props.item.question.id)
}

function optClass(letter: string) {
  if (result.value === null) return ''
  const isCorrect = letter === props.item.question.answer
  const isChosen  = letter === result.value.chosenLetter
  if (isCorrect) return 'correct-choice'
  if (isChosen && !isCorrect) return 'wrong-choice'
  return 'dimmed'
}
</script>

<style scoped>
.rcard {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.2s;
}
.rcard.state-correct   { border-color: #22c55e55; }
.rcard.state-wrong     { border-color: #ef444455; }
.rcard.state-unanswered { border-color: #f59e0b55; }

.rcard-crumb {
  display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;
  padding: 0.55rem 1rem;
  background: #ffffff06;
  border-bottom: 1px solid var(--border);
  font-size: 0.72rem;
}
.crumb-subject { color: var(--accent); font-weight: 600; }
.crumb-sep     { color: var(--muted); }
.crumb-topic   { color: var(--muted); }
.rcard-status  { margin-left: auto; font-size: 0.72rem; font-weight: 700; color: var(--muted); }
.rcard-status.correct    { color: var(--correct); }
.rcard-status.wrong      { color: var(--wrong); }
.rcard-status.unanswered { color: var(--warn); }

.rcard-stem {
  padding: 0.9rem 1rem;
  font-size: 0.875rem; line-height: 1.65;
  color: var(--text);
}

.opts {
  padding: 0 1rem 1rem;
  display: flex; flex-direction: column; gap: 0.4rem;
}

.opt-btn {
  display: flex; align-items: flex-start; gap: 0.6rem;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius); padding: 0.55rem 0.8rem;
  text-align: left; width: 100%;
  transition: border-color 0.15s, background 0.15s;
  color: var(--text); font-size: 0.85rem;
}
.opt-btn:not(:disabled):hover { border-color: var(--wrong); background: #ef444410; }

.opt-letter {
  min-width: 26px; height: 26px; border-radius: 50%;
  background: #ef444415; color: var(--wrong);
  font-weight: 700; font-size: 0.78rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.opt-text { flex: 1; line-height: 1.5; }

.opt-btn.correct-choice { background: #22c55e18 !important; border-color: var(--correct) !important; }
.opt-btn.correct-choice .opt-letter { background: var(--correct); color: #fff; }
.opt-btn.wrong-choice { background: #ef444418 !important; border-color: var(--wrong) !important; }
.opt-btn.wrong-choice .opt-letter { background: var(--wrong); color: #fff; }
.opt-btn.dimmed { opacity: 0.38; }
.opt-btn:disabled { cursor: default; }

.feedback {
  margin: 0 1rem 1rem;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius); font-size: 0.83rem; font-weight: 500;
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
}
.feedback.correct { background: #22c55e12; border: 1px solid #22c55e33; color: var(--correct); }
.feedback.wrong   { background: #ef444412; border: 1px solid #ef444433; color: var(--wrong); }

.undo-btn {
  flex-shrink: 0;
  background: #ffffff10; border: 1px solid #ffffff20;
  color: var(--muted); border-radius: var(--radius-sm);
  padding: 0.25rem 0.6rem; font-size: 0.75rem; font-weight: 600;
  transition: background 0.15s, color 0.15s; white-space: nowrap;
}
.undo-btn:hover { background: #ffffff20; color: var(--text); }
</style>
