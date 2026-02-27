// Layout pour les pages publiques (login, register, offline)
// Centré, sans sidebar

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      {children}
    </main>
  )
}
