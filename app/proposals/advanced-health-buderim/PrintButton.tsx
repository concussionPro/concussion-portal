'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs font-semibold px-3 py-1.5 bg-teal-700 text-white rounded-md hover:bg-teal-800"
    >
      Print / Save PDF
    </button>
  )
}
