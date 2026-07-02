import { redirect } from 'next/navigation'

// /app — legacy "get the app" front door, superseded by the SST Trainer
// platform site. Nothing routes here any more (the store-badge links that
// used to exist pointed at /platform/app); redirect rather than maintain a
// second copy of the marketing surface.
export default function GetAppPage() {
  redirect('/platform')
}
