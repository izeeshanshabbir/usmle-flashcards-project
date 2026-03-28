export interface Option {
  letter: string
  text: string
}

export interface Question {
  id: number
  stem: string
  options: Option[]
  answer: string
}

export interface Topic {
  id: string
  title: string
  questionCount: number
  questions: Question[]
}

export interface TopicMeta {
  id: string
  title: string
  questionCount: number
}

export interface SubjectMeta {
  id: string
  title: string
  description: string
  color: string
  icon: string
  order: number
  totalQuestions: number
  topicCount: number
  topics: TopicMeta[]
}

export interface SubjectIndex {
  subjects: SubjectMeta[]
}

export interface Section {
  id: string
  title: string
  topics: Topic[]
}

export interface SubjectFull {
  id: string
  title: string
  description: string
  color: string
  icon: string
  totalQuestions: number
  topics?: Topic[]       // flat subjects (most)
  sections?: Section[]   // sectioned subjects (e.g. OB/GYN)
}

// Progress types stored in localStorage
export interface QuestionResult {
  correct: boolean
  answeredAt: number // timestamp
  chosenLetter: string
}

export interface TopicProgress {
  [questionId: number]: QuestionResult
}

export interface SubjectProgress {
  [topicId: string]: TopicProgress
}

export interface AllProgress {
  [subjectId: string]: SubjectProgress
}
