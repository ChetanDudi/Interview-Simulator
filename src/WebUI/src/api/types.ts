export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: string
  name: string
  email: string
  roles: string[]
  accessToken: string
  expiresAtUtc: string
}

export interface PendingVerification {
  requiresEmailVerification: true
  email: string
  message: string
}

export interface ResendOtpResponse {
  secondsUntilResend: number
  message?: string
}

export interface ResetPasswordRequest {
  email: string
  token: string
  newPassword: string
}

export interface ResumeResponse {
  id: string
  originalFileName: string
  fileSizeBytes: number
  uploadedAtUtc: string
  status: string
}

export interface QuestionResponse {
  id: string
  questionText: string
  category: string
  difficulty: string
  orderIndex: number
  questionType: 'MCQ' | 'ShortAnswer' | 'LongAnswer' | 'Coding' | 'Other'
  options: string[]
  correctOptionIndex?: number
}

export interface SessionResponse {
  id: string
  resumeId: string
  resumeFileName: string
  status: string
  createdAtUtc: string
  overallScore?: number
  timeTakenSeconds?: number
  questions: QuestionResponse[]
}

export interface QuestionFeedbackResponse {
  questionId: string
  questionText: string
  answerText: string
  score: number
  feedback: string
  suggestion: string
  idealAnswer: string
  questionType: string
  options: string[]
  correctOptionIndex?: number
}

export interface ReportResponse {
  id: string
  sessionId: string
  overallScore: number
  technicalScore: number
  communicationScore: number
  summary: string
  generatedAtUtc: string
  timeTakenSeconds?: number
  questionFeedbacks: QuestionFeedbackResponse[]
}
