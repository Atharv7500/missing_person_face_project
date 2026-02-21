import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useLocation, Link } from 'react-router-dom'
import { Landmark, User, LogOut } from 'lucide-react'

export default function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Registry', path: '/registry' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ]

  return (
    <header className="px-6 py-4 flex items-center justify-between"
      style={{ background: '#0f172a', borderBottom: '4px solid #d97706' }}>
      
      {/* 1. Logo area */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shrink-0">
          <Landmark size={22} className="text-slate-900" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-widest text-white uppercase leading-none mb-1 shadow-sm" style={{ fontFamily: 'var(--font-serif)' }}>
            Bureau of Identification
          </p>
          <p className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase leading-none">
            National Command Center • Secure Terminal
          </p>
        </div>
      </div>

      {/* 2. Center Nav links */}
      <nav className="hidden md:flex items-center gap-2">
        {navItems.map((n) => {
          const active = location.pathname === n.path
          return (
            <Link key={n.path} to={n.path}
              className={`px-5 py-2 text-sm font-bold rounded-md transition-colors ${
                active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}>
              {n.label}
            </Link>
          )
        })}
      </nav>

      {/* 3. Right side Operator Info */}
      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 px-2 py-1 rounded transition-colors hover:bg-white/5 text-right">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white leading-tight">
              {user?.username ? `Officer ${user.username.charAt(0).toUpperCase() + user.username.slice(1)}` : 'Officer J. Reynolds'}
            </p>
            <p className="text-[9px] font-bold mt-0.5 tracking-wider uppercase" style={{ color: '#f59e0b' }}>
              LEVEL {user?.clearance_level || 5} CLEARANCE
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
            <User size={18} className="text-slate-800" />
          </div>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg py-1 shadow-xl border border-slate-200 z-50 bg-white"
            onMouseLeave={() => setShowMenu(false)}>
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800">{user?.username || 'admin'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'operator'}</p>
            </div>
            <button onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={16} /> Logout Access
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
