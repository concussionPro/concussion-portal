import { redirect } from 'next/navigation'

// Redirect /learning/module/[id] → /modules/[id]
// This handles the common URL pattern confusion
export default function LearningModuleRedirect({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/modules/${params.id}`)
}
