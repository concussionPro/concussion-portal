// Server-side quiz generation - answers never exposed to client
import { NextResponse } from 'next/server'
import { QUIZ_BANK } from '@/data/quiz-bank'

export async function GET() {
  try {
    // Shuffle and select 6 random questions
    const shuffled = [...QUIZ_BANK].sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, 6)

    // Return questions WITHOUT correct answers
    const clientQuestions = selectedQuestions.map(q => ({
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      // NEVER send 'correct' or 'rationale' to client!
    }))

    return NextResponse.json({
      questions: clientQuestions,
      sessionId: generateSessionId(),
    })
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}

function generateSessionId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).substring(7)}`
}
