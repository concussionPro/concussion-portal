export default function SCATFormsPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Select Assessment Tool
        </h2>
        <p className="text-slate-600 mb-6">
          Choose the appropriate concussion assessment tool based on timing and setting.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-bold text-blue-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• These forms replicate the official SCAT6™ and SCOAT6™ assessment tools</li>
            <li>• All calculations are performed automatically as you fill out the form</li>
            <li>• Your progress is saved automatically every few seconds</li>
            <li>• You can export completed assessments as PDF files</li>
            <li>• Forms meet the world standard for concussion assessment</li>
          </ul>
        </div>

        <div className="text-sm text-slate-500">
          <p className="mb-2">
            <strong>SCAT6</strong> is for acute assessment (within 72 hours to 7 days post-injury)
          </p>
          <p>
            <strong>SCOAT6</strong> is for office-based assessment (3-30 days post-injury)
          </p>
        </div>
      </div>
    </div>
  )
}
