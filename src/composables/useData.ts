import { ref } from 'vue'
import type { SubjectIndex, SubjectFull } from '@/types'

// Simple in-memory cache so we don't re-fetch on every navigation
const subjectCache = new Map<string, SubjectFull>()
let indexCache: SubjectIndex | null = null

export async function fetchIndex(): Promise<SubjectIndex> {
  if (indexCache) return indexCache
  const res = await fetch('/data/index.json')
  if (!res.ok) throw new Error(`Failed to load index: ${res.status}`)
  indexCache = await res.json()
  return indexCache!
}

export async function fetchSubject(subjectId: string): Promise<SubjectFull> {
  if (subjectCache.has(subjectId)) return subjectCache.get(subjectId)!
  const res = await fetch(`/data/${subjectId}.json`)
  if (!res.ok) throw new Error(`Failed to load subject "${subjectId}": ${res.status}`)
  const data: SubjectFull = await res.json()
  subjectCache.set(subjectId, data)
  return data
}

// Composable wrapper with loading / error state
export function useSubject(subjectId: string) {
  const subject = ref<SubjectFull | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  fetchSubject(subjectId)
    .then((d) => { subject.value = d })
    .catch((e) => { error.value = e.message })
    .finally(() => { loading.value = false })

  return { subject, loading, error }
}
