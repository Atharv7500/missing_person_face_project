import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useLocation, Link } from 'react-router-dom'
import { Shield, User, LogOut, Bell, ChevronDown } from 'lucide-react'

export default function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [time, setTime] = useState(new Date())
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const zuluTime = time.toUTCString().slice(17, 25) + ' ZULU'
  const zuluDate = time.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Registry', path: '/registry' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ]

  return (
    <header style={{ background: '#0a1628', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      className="sticky top-0 z-50 px-6 py-0 flex items-center justify-between h-14">
      {/* Logo */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded"
          style={{ background: 'linear-gradient(135deg,#1e3a70,#2563eb)', border: '1px solid rgba(37,99,235,0.4)' }}>
          <Shield size={18} color="#93c5fd" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold tracking-widest text-blue-100 uppercase leading-tight">Bureau of Identification</p>
          <p className="text-[10px] text-slate-500 tracking-wider uppercase">National Command Center · Secure Terminal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((n) => {
          const active = location.pathname === n.path
          return (
            <Link key={n.path} to={n.path}
              className="px-4 py-5 text-sm font-medium transition-colors relative"
              style={{ color: active ? '#93c5fd' : '#94a3b8', borderBottom: active ? '2px solid #2563eb' : '2px solid transparent' }}>
              {n.label}
            </Link>
          )
        })}
      </nav>

      {/* Right: time + user */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:block text-right">
          <p className="text-xs font-mono text-blue-300">{zuluTime}</p>
          <p className="text-[10px] text-slate-500">{zuluDate}</p>
        </div>

        <button className="relative p-1.5 rounded text-slate-400 hover:text-slate-200 transition-colors">
          <Bell size={17} />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* User badge */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors hover:bg-white/5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#1e3a70,#2563eb)' }}>
              <User size={14} color="white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.username ? `Officer ${user.username.charAt(0).toUpperCase() + user.username.slice(1)}` : 'Operator'}
              </p>
              <p className="text-[10px]" style={{ color: '#f59e0b' }}>
                LEVEL {user?.clearance_level || 1} CLEARANCE
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-lg py-1 z-50 shadow-xl"
              style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseLeave={() => setShowMenu(false)}>
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-xs text-slate-300 font-medium">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <button onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
