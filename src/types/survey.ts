export interface SurveyForm {
  id: string
  projectId: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'closed'
  targetResponses?: number
  startDate?: string
  endDate?: string
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SurveyGroup {
  id: string
  formId: string
  name: string
  token: string
  description?: string
  createdAt: string
}

export interface SurveyQuestion {
  id: string
  formId: string
  latentVariableId?: string
  questionText: string
  questionType: 'likert5' | 'likert7' | 'nominal' | 'ordinal' | 'text'
  scaleMin: number
  scaleMax: number
  isReversed: boolean
  orderIndex: number
  pageNumber: number
  isRequired: boolean
}

export interface SurveyResponse {
  id: string
  formId: string
  groupId?: string
  respondentToken: string
  startedAt: string
  completedAt?: string
  isComplete: boolean
}

export interface SurveyResponseItem {
  id: string
  responseId: string
  questionId: string
  valueNumeric?: number
  valueText?: string
}

export interface SurveyStats {
  total: number
  completed: number
  inProgress: number
  abandoned: number
  completionRate: number
  groupStats?: {
    groupId: string
    groupName: string
    completed: number
    inProgress: number
    total: number
    completionRate: number
  }[]
}
