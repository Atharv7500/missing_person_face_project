import { ReactNode } from 'react'
import Topbar from '@/components/Topbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>
      <Topbar />
      <main>{children}</main>
      <footer className="border-t mt-8 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div>
          <p className="text-xs text-slate-500">© 2025 Bureau of Identification. All rights reserved.</p>
          <p className="text-xs text-slate-600">Authorized Personnel Only. Unauthorized access is a federal offense.</p>
        </div>
        <div className="flex items-center gap-4">
          {['Privacy Policy', 'Terms of Use', 'Support'].map(l => (
            <button key={l} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{l}</button>
          ))}
          <span className="text-xs text-slate-600">v2.0.0</span>
        </div>
      </footer>
    </div>
  )
}
