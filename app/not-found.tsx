'use client'

import { useRouter } from 'next/navigation'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/10 mb-8">
          <Search className="w-12 h-12 text-accent" />
        </div>

        <h1 className="text-6xl font-bold mb-4 text-gradient">
          404
        </h1>

        <h2 className="text-3xl font-bold mb-4 tracking-tight">
          Page Not Found
        </h2>

        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="glass px-8 py-4 rounded-xl text-base font-semibold hover:bg-secondary/50 transition-colors flex items-center gap-2 border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <button
            onClick={() => router.push('/')}
            className="btn-primary px-8 py-4 rounded-xl text-base font-bold flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.push('/preview')}
              className="text-sm text-accent hover:underline"
            >
              Course Preview
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              onClick={() => router.push('/assessment')}
              className="text-sm text-accent hover:underline"
            >
              Free Assessment
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              onClick={() => router.push('/course')}
              className="text-sm text-accent hover:underline"
            >
              Enroll Now
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-accent hover:underline"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
