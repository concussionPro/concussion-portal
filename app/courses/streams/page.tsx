import { redirect } from 'next/navigation'

/**
 * /courses/streams — RETIRED (owner 2026-07-28: "basically a home page
 * copy — redundant", and it lacked the accreditation badge rows the
 * homepage tabs carry). The homepage dual-stream tabs are the canonical
 * chooser; old links land there.
 */
export default function StreamsRedirect() {
  redirect('/')
}
