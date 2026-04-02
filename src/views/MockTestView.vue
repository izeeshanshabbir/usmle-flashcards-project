<template>
  <div class="test-view">

    <!-- ── SETUP SCREEN ── -->
    <div v-if="!testStore.isActive && !testStore.isFinished" class="setup-screen">
      <div class="setup-card">
        <div class="setup-icon">📝</div>
        <h1 class="setup-title">Mock Test</h1>
        <p class="setup-desc">
          Randomly picks {{ TEST_SIZE }} questions from all subjects and topics.
          Your answers here are <strong>not saved</strong> to your main progress.
        </p>

        <div class="setup-options">
          <label class="option-label">Number of questions</label>
          <div class="size-row">
            <button
              v-for="n in sizeOptions"
              :key="n"
              class="size-btn"
              :class="{ active: selectedSize === n }"
              @click="selectedSize = n"
            >{{ n }}</button>
          </div>
        </div>

        <button class="start-btn" @click="startTest" :disabled="loadingData">
          <span v-if="loadingData">Loading questions…</span>
          <span v-else>Start Test →</span>
        </button>
        <p v-if="loadError" class="load-error">⚠️ {{ loadError }}</p>

        <RouterLink to="/" class="back-link-setup">← Back to home</RouterLink>
      </div>
    </div>

    <!-- ── ACTIVE TEST ── -->
    <template v-else-if="testStore.isActive && !testStore.isFinished">
      <!-- Top bar -->
      <div class="test-topbar">
        <div class="test-topbar-inner">
          <div class="test-progress-text">
            <span class="q-counter">Question {{ currentIndex + 1 }} <span class="q-total">/ {{ testStore.totalQuestions }}</span></span>
            <span class="q-score">✓ {{ testStore.correctCount }} &nbsp; ✗ {{ testStore.wrongCount }}</span>
          </div>
          <div class="test-progbar">
            <div
              class="test-progbar-fill"
              :style="{ width: ((testStore.answeredCount / testStore.totalQuestions) * 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Question card -->
      <div class="test-content">
        <div class="test-card" v-if="currentQ">
          <!-- Breadcrumb -->
          <div class="test-crumb">
            <span class="crumb-s">{{ currentQ.subjectTitle }}</span>
            <span class="crumb-sep">›</span>
            <span class="crumb-t">{{ currentQ.topicTitle }}</span>
          </div>

          <!-- Stem -->
          <p class="test-stem">{{ currentQ.question.stem }}</p>

          <!-- Options -->
          <div class="test-opts">
            <button
              v-for="opt in currentQ.question.options"
              :key="opt.letter"
              class="test-opt"
              :class="testOptClass(opt.letter)"
              :disabled="currentAnswer !== null"
              @click="chooseAnswer(opt.letter)"
            >
              <span class="test-opt-letter">{{ opt.letter }}</span>
              <span class="test-opt-text">{{ opt.text }}</span>
            </button>
          </div>

          <!-- Feedback + navigation -->
          <div v-if="currentAnswer !== null" class="test-feedback-row">
            <div class="test-feedback" :class="currentAnswer.correct ? 'correct' : 'wrong'">
              <template v-if="currentAnswer.correct">
                ✓ Correct!
              </template>
              <template v-else>
                ✗ Correct answer: <strong>{{ currentQ.question.answer }}</strong>
              </template>
            </div>

            <button
              class="next-btn"
              @click="nextQuestion"
            >
              {{ isLastQuestion ? 'Finish Test →' : 'Next →' }}
            </button>
          </div>
        </div>

        <!-- Navigation dots -->
        <div class="nav-dots">
          <button
            v-for="(_, i) in testStore.questions"
            :key="i"
            class="nav-dot"
            :class="{
              current: i === currentIndex,
              correct: testStore.getAnswer(i)?.correct === true,
              wrong:   testStore.getAnswer(i)?.correct === false,
            }"
            @click="jumpTo(i)"
            :title="`Question ${i + 1}`"
          ></button>
        </div>
      </div>
    </template>

    <!-- ── RESULTS SCREEN ── -->
    <div v-else-if="testStore.isFinished" class="results-screen">
      <div class="results-card">
        <div class="results-emoji">{{ scoreEmoji }}</div>
        <h1 class="results-score">{{ testStore.score }}%</h1>
        <p class="results-label">{{ scoreMessage }}</p>

        <div class="results-stats">
          <div class="rs-chip correct">
            <span class="rs-val">{{ testStore.correctCount }}</span>
            <span class="rs-lbl">Correct</span>
          </div>
          <div class="rs-chip wrong">
            <span class="rs-val">{{ testStore.wrongCount }}</span>
            <span class="rs-lbl">Wrong</span>
          </div>
          <div class="rs-chip total">
            <span class="rs-val">{{ testStore.totalQuestions }}</span>
            <span class="rs-lbl">Total</span>
          </div>
        </div>

        <!-- Per-question review mini-list -->
        <div class="results-review">
          <h3 class="rr-heading">Review answers</h3>
          <div class="rr-list">
            <button
              v-for="(_, i) in testStore.questions"
              :key="i"
              class="rr-item"
              :class="{
                correct: testStore.getAnswer(i)?.correct === true,
                wrong:   testStore.getAnswer(i)?.correct === false,
                skipped: testStore.getAnswer(i) === null,
              }"
              @click="reviewQuestion(i)"
            >
              <span class="rr-num">{{ i + 1 }}</span>
              <span class="rr-icon">
                {{ testStore.getAnswer(i)?.correct ? '✓' : testStore.getAnswer(i) ? '✗' : '—' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Reviewed question -->
        <div v-if="reviewIdx !== null && testStore.questions[reviewIdx]" class="rr-detail">
          <div class="rr-detail-crumb">
            Q{{ reviewIdx + 1 }} · {{ testStore.questions[reviewIdx].subjectTitle }} › {{ testStore.questions[reviewIdx].topicTitle }}
          </div>
          <p class="rr-detail-stem">{{ testStore.questions[reviewIdx].question.stem }}</p>
          <div class="rr-detail-opts">
            <div
              v-for="opt in testStore.questions[reviewIdx].question.options"
              :key="opt.letter"
              class="rr-opt"
              :class="reviewOptClass(reviewIdx, opt.letter)"
            >
              <span class="rr-opt-letter">{{ opt.letter }}</span>
              <span>{{ opt.text }}</span>
            </div>
          </div>
        </div>

        <div class="results-actions">
          <button class="action-btn primary" @click="retakeTest">↺ New Test</button>
          <RouterLink to="/" class="action-btn secondary">← Home</RouterLink>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMockTestStore } from '@/stores/mockTest'
import type { TestQuestion } from '@/stores/mockTest'
import { fetchRandomQuestions } from '@/composables/useData'

const TEST_SIZE = 100
const sizeOptions = [20, 40, 60, 100]
const selectedSize = ref(100)

const testStore   = useMockTestStore()
const loadingData = ref(false)
const loadError   = ref<string | null>(null)

function startTest() {
  loadingData.value = true
  loadError.value = null
  fetchRandomQuestions(selectedSize.value)
    .then((picked) => {
      testStore.startTest(picked)
      currentIndex.value = 0
      reviewIdx.value = null
    })
    .catch((e: any) => {
      loadError.value = e.message
    })
    .finally(() => {
      loadingData.value = false
    })
}

// ── Active test ──────────────────────────────────────────────────────────
const currentIndex = ref(0)

const currentQ = computed(() => testStore.questions[currentIndex.value] ?? null)
const currentAnswer = computed(() => testStore.getAnswer(currentIndex.value))
const isLastQuestion = computed(() => currentIndex.value === testStore.totalQuestions - 1)

function chooseAnswer(letter: string) {
  if (currentAnswer.value !== null) return
  testStore.recordAnswer(currentIndex.value, letter)
}

function nextQuestion() {
  if (isLastQuestion.value) {
    testStore.finishTest()
  } else {
    currentIndex.value++
    // skip already-answered questions when navigating forward? No — just move next
  }
}

function jumpTo(i: number) {
  currentIndex.value = i
}

function testOptClass(letter: string) {
  const ans = currentAnswer.value
  if (ans === null) return ''
  const isCorrect = letter === currentQ.value?.question.answer
  const isChosen  = letter === ans.chosenLetter
  if (isCorrect) return 'correct-choice'
  if (isChosen && !isCorrect) return 'wrong-choice'
  return 'dimmed'
}

// ── Results ──────────────────────────────────────────────────────────────
const reviewIdx = ref<number | null>(null)

const scoreEmoji = computed(() => {
  const s = testStore.score
  if (s >= 90) return '🏆'
  if (s >= 75) return '🎯'
  if (s >= 60) return '📚'
  return '💪'
})

const scoreMessage = computed(() => {
  const s = testStore.score
  if (s >= 90) return 'Excellent work!'
  if (s >= 75) return 'Great job!'
  if (s >= 60) return 'Good effort, keep reviewing.'
  return 'Keep practising — you\'ll get there!'
})

function reviewQuestion(i: number) {
  reviewIdx.value = reviewIdx.value === i ? null : i
}

function reviewOptClass(idx: number | null, letter: string) {
  if (idx === null) return ''
  const q   = testStore.questions[idx]
  const ans = testStore.getAnswer(idx)
  if (!q || !ans) return ''
  const isCorrect = letter === q.question.answer
  const isChosen  = letter === ans.chosenLetter
  if (isCorrect) return 'correct-choice'
  if (isChosen && !isCorrect) return 'wrong-choice'
  return 'dimmed'
}

function retakeTest() {
  testStore.resetTest()
  currentIndex.value = 0
  reviewIdx.value    = null
  startTest()
}
</script>

<style scoped>
.test-view { min-height: calc(100vh - 56px); }

/* ── Setup ── */
.setup-screen {
  display: flex; align-items: center; justify-content: center;
  min-height: calc(100vh - 56px); padding: 2rem 1rem;
}
.setup-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 2.5rem 2rem;
  max-width: 460px; width: 100%; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
}
.setup-icon { font-size: 3rem; }
.setup-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; }
.setup-desc { color: var(--muted); font-size: 0.88rem; line-height: 1.65; }

.setup-options { width: 100%; text-align: left; }
.option-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.5rem; }
.size-row { display: flex; gap: 0.5rem; }
.size-btn {
  flex: 1; padding: 0.5rem; border-radius: var(--radius);
  background: var(--surface); border: 1.5px solid var(--border);
  font-size: 0.9rem; font-weight: 700; color: var(--muted);
  transition: all 0.15s;
}
.size-btn.active { background: var(--accent-lo); border-color: var(--accent); color: var(--accent); }
.size-btn:hover:not(.active) { border-color: var(--border-hi); color: var(--text); }

.start-btn {
  width: 100%; padding: 0.85rem;
  background: var(--accent); color: #fff; border: none;
  border-radius: var(--radius); font-size: 1rem; font-weight: 700;
  transition: background 0.15s; margin-top: 0.25rem;
}
.start-btn:hover:not(:disabled) { background: #2563eb; }
.start-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.load-error { color: var(--wrong); font-size: 0.82rem; }
.back-link-setup { font-size: 0.82rem; color: var(--muted); text-decoration: none; }
.back-link-setup:hover { color: var(--accent); }

/* ── Top bar ── */
.test-topbar {
  position: sticky; top: 56px; z-index: 50;
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 0.6rem 1.5rem 0;
}
.test-topbar-inner { max-width: 760px; margin: 0 auto; }
.test-progress-text {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.85rem; margin-bottom: 0.4rem;
}
.q-counter { font-weight: 700; }
.q-total { color: var(--muted); font-weight: 400; }
.q-score { color: var(--muted); font-weight: 600; }
.test-progbar {
  height: 5px; background: var(--border); border-radius: 99px; overflow: hidden;
  margin-bottom: 0.5rem;
}
.test-progbar-fill {
  height: 100%; background: var(--accent); border-radius: 99px;
  transition: width 0.4s ease;
}

/* ── Test content ── */
.test-content { max-width: 760px; margin: 0 auto; padding: 1.5rem 1.5rem 5rem; }

.test-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem;
}
.test-crumb {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.55rem 1rem; background: #ffffff06;
  border-bottom: 1px solid var(--border); font-size: 0.72rem;
}
.crumb-s { color: var(--accent); font-weight: 600; }
.crumb-sep { color: var(--muted); }
.crumb-t { color: var(--muted); }

.test-stem {
  padding: 1rem 1rem 0.5rem;
  font-size: 0.9rem; line-height: 1.7; color: var(--text);
}
.test-opts { padding: 0.5rem 1rem 1rem; display: flex; flex-direction: column; gap: 0.45rem; }
.test-opt {
  display: flex; align-items: flex-start; gap: 0.6rem;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius); padding: 0.6rem 0.9rem;
  text-align: left; width: 100%; color: var(--text); font-size: 0.875rem;
  transition: border-color 0.15s, background 0.15s;
}
.test-opt:not(:disabled):hover { border-color: var(--accent); background: var(--accent-lo); }
.test-opt-letter {
  min-width: 28px; height: 28px; border-radius: 50%;
  background: var(--accent-lo); color: var(--accent);
  font-weight: 700; font-size: 0.78rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.test-opt-text { flex: 1; line-height: 1.5; }
.test-opt.correct-choice { background: #22c55e18 !important; border-color: var(--correct) !important; }
.test-opt.correct-choice .test-opt-letter { background: var(--correct); color: #fff; }
.test-opt.wrong-choice   { background: #ef444418 !important; border-color: var(--wrong) !important; }
.test-opt.wrong-choice   .test-opt-letter { background: var(--wrong); color: #fff; }
.test-opt.dimmed { opacity: 0.38; }
.test-opt:disabled { cursor: default; }

.test-feedback-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0 1rem 1rem;
}
.test-feedback {
  flex: 1; padding: 0.6rem 0.85rem; border-radius: var(--radius);
  font-size: 0.83rem; font-weight: 600;
}
.test-feedback.correct { background: #22c55e12; border: 1px solid #22c55e33; color: var(--correct); }
.test-feedback.wrong   { background: #ef444412; border: 1px solid #ef444433; color: var(--wrong); }

.next-btn {
  flex-shrink: 0; padding: 0.6rem 1.25rem;
  background: var(--accent); color: #fff; border-radius: var(--radius);
  font-size: 0.88rem; font-weight: 700; transition: background 0.15s;
}
.next-btn:hover { background: #2563eb; }

/* Nav dots */
.nav-dots {
  display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
}
.nav-dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--border); border: none; transition: all 0.15s;
}
.nav-dot.current { background: var(--accent); transform: scale(1.4); }
.nav-dot.correct { background: var(--correct); }
.nav-dot.wrong   { background: var(--wrong); }

/* ── Results ── */
.results-screen {
  display: flex; justify-content: center;
  padding: 3rem 1rem 5rem;
}
.results-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 2.5rem 2rem;
  max-width: 680px; width: 100%;
  display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
}
.results-emoji { font-size: 3.5rem; }
.results-score { font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; }
.results-label { color: var(--muted); font-size: 0.95rem; }

.results-stats { display: flex; gap: 1rem; }
.rs-chip {
  display: flex; flex-direction: column; align-items: center;
  padding: 0.6rem 1.25rem; border-radius: var(--radius); border: 1px solid;
  min-width: 80px;
}
.rs-chip.correct { background: #22c55e12; border-color: #22c55e33; }
.rs-chip.wrong   { background: #ef444412; border-color: #ef444433; }
.rs-chip.total   { background: var(--surface); border-color: var(--border); }
.rs-val { font-size: 1.6rem; font-weight: 800; line-height: 1; }
.rs-chip.correct .rs-val { color: var(--correct); }
.rs-chip.wrong   .rs-val { color: var(--wrong); }
.rs-lbl { font-size: 0.72rem; color: var(--muted); margin-top: 2px; font-weight: 600; }

/* Review list */
.results-review { width: 100%; }
.rr-heading { font-size: 0.82rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; }
.rr-list { display: flex; flex-wrap: wrap; gap: 6px; }
.rr-item {
  width: 36px; height: 36px; border-radius: var(--radius-sm); border: 1.5px solid var(--border);
  background: var(--surface); font-size: 0.72rem; font-weight: 700; color: var(--muted);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px; transition: all 0.15s; cursor: pointer;
}
.rr-item.correct { background: #22c55e15; border-color: var(--correct); color: var(--correct); }
.rr-item.wrong   { background: #ef444415; border-color: var(--wrong); color: var(--wrong); }
.rr-item:hover   { transform: scale(1.1); }
.rr-num  { font-size: 0.65rem; color: inherit; }
.rr-icon { font-size: 0.85rem; }

/* Detail */
.rr-detail {
  width: 100%; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 1rem; text-align: left;
}
.rr-detail-crumb { font-size: 0.72rem; color: var(--muted); margin-bottom: 0.5rem; }
.rr-detail-stem { font-size: 0.875rem; line-height: 1.65; margin-bottom: 0.75rem; }
.rr-detail-opts { display: flex; flex-direction: column; gap: 0.35rem; }
.rr-opt {
  display: flex; gap: 0.5rem; align-items: flex-start;
  padding: 0.45rem 0.75rem; border-radius: var(--radius-sm);
  border: 1.5px solid var(--border); font-size: 0.82rem;
  background: var(--card);
}
.rr-opt-letter {
  min-width: 22px; height: 22px; border-radius: 50%;
  background: var(--border); font-weight: 700; font-size: 0.72rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rr-opt.correct-choice { background: #22c55e18; border-color: var(--correct); }
.rr-opt.correct-choice .rr-opt-letter { background: var(--correct); color: #fff; }
.rr-opt.wrong-choice   { background: #ef444418; border-color: var(--wrong); }
.rr-opt.wrong-choice   .rr-opt-letter { background: var(--wrong); color: #fff; }
.rr-opt.dimmed { opacity: 0.38; }

/* Actions */
.results-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
.action-btn {
  padding: 0.7rem 1.5rem; border-radius: var(--radius);
  font-size: 0.9rem; font-weight: 700; text-decoration: none;
  transition: background 0.15s; border: none;
}
.action-btn.primary { background: var(--accent); color: #fff; }
.action-btn.primary:hover { background: #2563eb; }
.action-btn.secondary {
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border);
}
.action-btn.secondary:hover { background: var(--card); text-decoration: none; }

@media (max-width: 600px) {
  .test-content { padding: 1rem 0.75rem 5rem; }
  .results-stats { gap: 0.5rem; }
  .rr-list { gap: 4px; }
}
</style>
