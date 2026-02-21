import { ReactNode } from 'react'
import Topbar from '@/components/Topbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative p-1.5" style={{ background: '#60a5fa' }}>
      {/* Real app container providing the internal background */}
      <div className="min-h-[calc(100vh-12px)] flex flex-col rounded-sm overflow-hidden relative shadow-2xl" style={{ background: '#f1f5f9' }}>
        
        {/* Navigation Bar */}
        <Topbar />

        {/* Main Content Area */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 px-8 py-5 flex flex-col lg:flex-row items-center justify-between gap-4 mt-auto z-10">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
              © 2025 Bureau of Identification. All rights reserved.
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Authorized Personnel Only. Unauthorized access is a federal offense.
            </p>
          </div>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Use', 'Support'].map(l => (
              <button key={l} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                {l}
              </button>
            ))}
            <span className="text-[10px] font-mono font-bold text-slate-400 pl-4 border-l border-slate-200">
              v2.0.0 (Build 9002)
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
