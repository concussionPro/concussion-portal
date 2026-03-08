'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-6">
          We hit an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#5b9aa6] text-white rounded-xl font-semibold hover:bg-[#4a8a96] transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 text-slate-700 font-semibold hover:text-slate-900 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
        <p className="text-sm text-slate-400 mt-8">
          Need help? Contact zac@concussion-education-australia.com
        </p>
      </div>
    </div>
  )
}
