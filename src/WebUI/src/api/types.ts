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
  interviewCount: number
  averageScore?: number
  bestScore?: number
  lastInterviewDate?: string
}

export interface ReviewSection {
  score: number
  feedback: string
  suggestions: string[]
}

export interface ResumeReviewResponse {
  overallScore: number
  summary: string
  summarySection: ReviewSection
  experienceSection: ReviewSection
  skillsSection: ReviewSection
  educationSection: ReviewSection
  topStrengths: string[]
  criticalGaps: string[]
  atsScore: number
  atsTips: string[]
}

export interface JobMatchResponse {
  matchPercentage: number
  summary: string
  presentKeywords: string[]
  missingKeywords: string[]
  highlights: string[]
  gapAnalysis: string[]
  recommendations: string[]
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
  targetRole?: string
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
  shareToken?: string
  questionFeedbacks: QuestionFeedbackResponse[]
}

export interface PracticeSessionResponse {
  id: string
  topic: string
  createdAtUtc: string
  shareToken?: string
  questions: PracticeQuestion[]
}

export interface PracticeQuestion {
  questionText: string
  answer: string
  questionType: 'MCQ' | 'ShortAnswer' | 'LongAnswer' | 'Coding' | 'Other'
  options: string[]
  correctOptionIndex?: number
}

export interface InterviewAttemptResponse {
  sessionId: string
  resumeTitle: string
  createdAtUtc: string
  hasModelAnswers: boolean
  questions: AttemptQuestion[]
}

export interface AttemptQuestion {
  questionText: string
  questionType: 'MCQ' | 'ShortAnswer' | 'LongAnswer' | 'Coding' | 'Other'
  options: string[]
  correctOptionIndex?: number
  idealAnswer?: string
}

export interface ScorePoint {
  date: string
  score: number
  label: string
}

export interface CategoryScore {
  category: string
  score: number
}

export interface AnalyticsResponse {
  streak: number
  totalInterviews: number
  averageScore?: number
  bestScore?: number
  avgTechnical?: number
  avgCommunication?: number
  scoreHistory: ScorePoint[]
  weakAreas: CategoryScore[]
}

export interface BehavioralQuestion {
  id: string
  questionText: string
  starHint: string
  category: string
  answerText?: string
}

export interface BehavioralSessionResponse {
  id: string
  topic: string
  status: string
  createdAtUtc: string
  timeTakenSeconds?: number
  questions: BehavioralQuestion[]
}

export interface BehavioralFeedbackItem {
  questionIndex: number
  questionText: string
  answerText: string
  score: number
  feedback: string
  suggestion: string
  idealAnswer: string
  starAnalysis: string
}

export interface BehavioralReportResponse {
  overallScore: number
  summary: string
  feedbacks: BehavioralFeedbackItem[]
}
