/**
 * /admin/login is public — override the parent admin layout (which renders
 * AdminNavBar for authenticated pages) so the key-entry form stands alone.
 */
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
