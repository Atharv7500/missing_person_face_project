import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Shield, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Invalid credentials. Access denied.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #0f2244 100%)' }}>
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow orbs */}
      <div className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)', top: '10%', left: '15%' }} />
      <div className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', bottom: '15%', right: '20%' }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #1e3a70, #2563eb)', border: '2px solid rgba(37,99,235,0.5)' }}>
            <Shield size={30} color="#93c5fd" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-blue-100">
            Bureau of Identification
          </h1>
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mt-1">
            National Command Center · Secure Terminal
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8"
          style={{ border: '1px solid rgba(37,99,235,0.3)', boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100">Operator Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Authorized Personnel Only</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-5 p-3 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wider uppercase">
                Operator ID
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter operator ID"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wider uppercase">
                Access Code
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access code"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm tracking-wider uppercase transition-all mt-2"
              style={{ background: loading ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white', border: '1px solid rgba(37,99,235,0.5)' }}>
              {loading ? 'Authenticating…' : 'Access System'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Default: <code className="text-blue-400">admin</code> / <code className="text-blue-400">admin123</code>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Unauthorized access is a federal offense. All activity is logged.
        </p>
      </div>
    </div>
  )
}
