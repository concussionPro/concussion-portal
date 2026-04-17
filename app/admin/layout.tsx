import AdminNavBar from '@/components/admin/AdminNavBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavBar />
      {children}
    </div>
  )
}
