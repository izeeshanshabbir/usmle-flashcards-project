/**
 * Mock Test store — fully isolated from the main progress store.
 * All state lives in memory only; nothing touches localStorage.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question } from '@/types'

export interface TestQuestion {
  /** The question data */
  question: Question
  /** Which subject + topic it came from (for display only) */
  subjectId: string
  topicId: string
  topicTitle: string
  subjectTitle: string
}

export interface TestAnswer {
  chosenLetter: string
  correct: boolean
}

export const useMockTestStore = defineStore('mockTest', () => {
  const questions = ref<TestQuestion[]>([])
  const answers   = ref<Map<number, TestAnswer>>(new Map())
  const isActive  = ref(false)
  const isFinished = ref(false)

  // ── setters ───────────────────────────────────────────────────────────────

  function startTest(qs: TestQuestion[]) {
    questions.value  = qs
    answers.value    = new Map()
    isActive.value   = true
    isFinished.value = false
  }

  function recordAnswer(questionIndex: number, chosenLetter: string) {
    const q = questions.value[questionIndex]
    if (!q) return
    answers.value.set(questionIndex, {
      chosenLetter,
      correct: chosenLetter === q.question.answer,
    })
  }

  function finishTest() {
    isFinished.value = true
  }

  function resetTest() {
    questions.value  = []
    answers.value    = new Map()
    isActive.value   = false
    isFinished.value = false
  }

  // ── getters ───────────────────────────────────────────────────────────────

  const totalQuestions = computed(() => questions.value.length)
  const answeredCount  = computed(() => answers.value.size)
  const correctCount   = computed(() => [...answers.value.values()].filter(a => a.correct).length)
  const wrongCount     = computed(() => [...answers.value.values()].filter(a => !a.correct).length)
  const score          = computed(() =>
    answeredCount.value > 0
      ? Math.round((correctCount.value / answeredCount.value) * 100)
      : 0
  )

  function getAnswer(idx: number): TestAnswer | null {
    return answers.value.get(idx) ?? null
  }

  return {
    questions, answers, isActive, isFinished,
    startTest, recordAnswer, finishTest, resetTest,
    totalQuestions, answeredCount, correctCount, wrongCount, score,
    getAnswer,
  }
})
