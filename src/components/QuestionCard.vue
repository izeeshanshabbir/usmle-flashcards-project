<template>
  <div
    class="qcard"
    :class="{
      'state-correct': result?.correct === true,
      'state-wrong':   result?.correct === false,
    }"
  >
    <!-- Header row -->
    <div class="qcard-head">
      <span class="qnum">Q{{ question.id }}</span>
      <span
        class="qstatus"
        :class="{
          correct: result?.correct === true,
          wrong:   result?.correct === false,
        }"
      >
        <template v-if="result === null">⬜ Unanswered</template>
        <template v-else-if="result.correct">✅ Correct</template>
        <template v-else>❌ Wrong</template>
      </span>
    </div>

    <!-- Stem -->
    <p class="qstem">{{ question.stem }}</p>

    <!-- Options -->
    <div class="opts">
      <button
        v-for="opt in question.options"
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
        <template v-if="result.correct">
          ✓ Correct! The answer is <strong>{{ question.answer }}</strong>.
        </template>
        <template v-else>
          ✗ You chose <strong>{{ result.chosenLetter }}</strong>.
          Correct answer is <strong>{{ question.answer }}</strong>.
        </template>
      </span>
      <button class="undo-btn" @click="undo" title="Undo — pick again">↩ Undo</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import type { Question } from '@/types'

const props = defineProps<{
  question: Question
  subjectId: string
  topicId: string
}>()

const store = useProgressStore()

const result = computed(() =>
  store.getQuestionResult(props.subjectId, props.topicId, props.question.id)
)

function choose(letter: string) {
  if (result.value !== null) return
  store.recordAnswer(props.subjectId, props.topicId, props.question.id, letter, props.question.answer)
}

function undo() {
  store.undoAnswer(props.subjectId, props.topicId, props.question.id)
}

function optClass(letter: string) {
  if (result.value === null) return ''
  const isCorrect = letter === props.question.answer
  const isChosen  = letter === result.value.chosenLetter
  if (isCorrect) return 'correct-choice'
  if (isChosen && !isCorrect) return 'wrong-choice'
  return 'dimmed'
}
</script>

<style scoped>
.qcard {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.2s;
}
.qcard.state-correct { border-color: #22c55e55; }
.qcard.state-wrong   { border-color: #ef444455; }

/* Head */
.qcard-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 1rem;
  background: #ffffff06;
  border-bottom: 1px solid var(--border);
}
.qnum {
  background: var(--accent-lo); color: var(--accent);
  border-radius: var(--radius-sm); padding: 0.15rem 0.5rem;
  font-size: 0.75rem; font-weight: 700;
}
.qstatus { font-size: 0.75rem; color: var(--muted); }
.qstatus.correct { color: var(--correct); }
.qstatus.wrong   { color: var(--wrong);   }

/* Stem */
.qstem {
  padding: 0.9rem 1rem;
  font-size: 0.875rem; line-height: 1.65;
  color: var(--text);
}

/* Options */
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
.opt-btn:not(:disabled):hover {
  border-color: var(--accent); background: var(--accent-lo);
}

.opt-letter {
  min-width: 26px; height: 26px; border-radius: 50%;
  background: var(--accent-lo); color: var(--accent);
  font-weight: 700; font-size: 0.78rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.opt-text { flex: 1; line-height: 1.5; }

/* Answer states */
.opt-btn.correct-choice {
  background: #22c55e18 !important;
  border-color: var(--correct) !important;
}
.opt-btn.correct-choice .opt-letter { background: var(--correct); color: #fff; }

.opt-btn.wrong-choice {
  background: #ef444418 !important;
  border-color: var(--wrong) !important;
}
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
.feedback.wrong   { background: #ef444412; border: 1px solid #ef444433; color: var(--wrong);   }

.undo-btn {
  flex-shrink: 0;
  background: #ffffff10; border: 1px solid #ffffff20;
  color: var(--muted); border-radius: var(--radius-sm);
  padding: 0.25rem 0.6rem; font-size: 0.75rem; font-weight: 600;
  transition: background 0.15s, color 0.15s; white-space: nowrap;
}
.undo-btn:hover { background: #ffffff20; color: var(--text); }
</style>
