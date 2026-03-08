import { redirect } from 'next/navigation'

// Redirect /learning/module/[id] → /modules/[id]
// This handles the common URL pattern confusion
export default async function LearningModuleRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/modules/${id}`)
}
