export interface PracticeQuestion {
  questionText: string
  answer: string
  questionType: 'MCQ' | 'ShortAnswer' | 'LongAnswer' | 'Coding' | 'Other'
  options: string[]
  correctOptionIndex?: number
}

export async function generatePracticeQuestions(
  topic: string,
  count: number,
  token: string
): Promise<PracticeQuestion[]> {
  const res = await fetch('/api/practice/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic, count }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ errors: ['Server error'] })) as { errors?: string[] }
    throw new Error(body.errors?.join(', ') ?? `Request failed (${res.status})`)
  }
  return res.json()
}
