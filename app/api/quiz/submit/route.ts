// Server-side quiz validation - secure answer checking
import { NextRequest, NextResponse } from 'next/server'
import { QUIZ_BANK } from '@/data/quiz-bank'

export async function POST(request: NextRequest) {
  try {
    const { questionIds, answers } = await request.json()

    if (!questionIds || !answers || questionIds.length !== answers.length) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      )
    }

    // Validate answers server-side
    const results = questionIds.map((id: string, index: number) => {
      const question = QUIZ_BANK.find(q => q.id === id)

      if (!question) {
        return {
          questionId: id,
          correct: false,
          rationale: 'Question not found',
        }
      }

      const userAnswer = answers[index]
      const isCorrect = userAnswer === question.correct

      return {
        questionId: id,
        category: question.category,
        correct: isCorrect,
        userAnswer: userAnswer,
        correctAnswer: question.correct,
        rationale: question.rationale,
      }
    })

    const score = results.filter(r => r.correct).length
    const percentage = Math.round((score / results.length) * 100)

    // Calculate knowledge gaps
    const categoryGaps = results
      .filter(r => !r.correct)
      .reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topGaps = Object.entries(categoryGaps)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    return NextResponse.json({
      score,
      total: results.length,
      percentage,
      results,
      topGaps: topGaps.map(([category, count]) => ({ category, count })),
    })
  } catch (error) {
    console.error('Quiz submission error:', error)
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}
