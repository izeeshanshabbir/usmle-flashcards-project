import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AllProgress, QuestionResult } from '@/types'

const STORAGE_KEY = 'medflash_progress_v1'

function loadFromStorage(): AllProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(data: AllProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage quota exceeded — fail silently
  }
}

export const useProgressStore = defineStore('progress', () => {
  const progress = ref<AllProgress>(loadFromStorage())

  // ── mutations ──────────────────────────────────────────────────────────────

  function recordAnswer(
    subjectId: string,
    topicId: string,
    questionId: number,
    chosenLetter: string,
    correctLetter: string
  ) {
    if (!progress.value[subjectId]) progress.value[subjectId] = {}
    if (!progress.value[subjectId][topicId]) progress.value[subjectId][topicId] = {}

    progress.value[subjectId][topicId][questionId] = {
      correct: chosenLetter === correctLetter,
      answeredAt: Date.now(),
      chosenLetter,
    }
    saveToStorage(progress.value)
  }

  function resetTopic(subjectId: string, topicId: string) {
    if (progress.value[subjectId]) {
      delete progress.value[subjectId][topicId]
      saveToStorage(progress.value)
    }
  }

  function resetSubject(subjectId: string) {
    delete progress.value[subjectId]
    saveToStorage(progress.value)
  }

  function resetAll() {
    progress.value = {}
    saveToStorage(progress.value)
  }

  // ── getters ────────────────────────────────────────────────────────────────

  function getQuestionResult(
    subjectId: string,
    topicId: string,
    questionId: number
  ): QuestionResult | null {
    return progress.value[subjectId]?.[topicId]?.[questionId] ?? null
  }

  function getTopicStats(subjectId: string, topicId: string) {
    const tp = progress.value[subjectId]?.[topicId] ?? {}
    const results = Object.values(tp)
    return {
      answered: results.length,
      correct: results.filter((r) => r.correct).length,
      wrong: results.filter((r) => !r.correct).length,
    }
  }

  function getSubjectStats(subjectId: string) {
    const sp = progress.value[subjectId] ?? {}
    let answered = 0, correct = 0
    for (const tp of Object.values(sp)) {
      for (const r of Object.values(tp)) {
        answered++
        if (r.correct) correct++
      }
    }
    return { answered, correct, wrong: answered - correct }
  }

  const totalAnswered = computed(() => {
    let n = 0
    for (const sp of Object.values(progress.value))
      for (const tp of Object.values(sp))
        n += Object.keys(tp).length
    return n
  })

  const totalCorrect = computed(() => {
    let n = 0
    for (const sp of Object.values(progress.value))
      for (const tp of Object.values(sp))
        for (const r of Object.values(tp))
          if (r.correct) n++
    return n
  })

  return {
    progress,
    recordAnswer,
    resetTopic,
    resetSubject,
    resetAll,
    getQuestionResult,
    getTopicStats,
    getSubjectStats,
    totalAnswered,
    totalCorrect,
  }
})
