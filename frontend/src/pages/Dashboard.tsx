import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, detectionsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import {
  Users, Activity, Bell, Filter, Download,
  UserPlus, ScanFace, FileBarChart, ArrowUp,
  CheckCircle, AlertTriangle, WifiOff
} from 'lucide-react'

interface Stats {
  total_registered: number
  active_matches: number
  alerts_dispatched: number
  daily_new_records: number
}
interface Health {
  db_connected: boolean
  storage_connected: boolean
  api_latency_ms: number
  storage_used_pct: number
}
interface Detection {
  id: string
  case_id: string | null
  person_name: string | null
  location: string | null
  camera_id: string | null
  timestamp: string
  confidence: number | null
  status: string
  snapshot_url: string | null
}

const priorityColor: Record<string, string> = {
  high: 'badge-high',
  normal: 'badge-normal',
  monitored: 'badge-monitored',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    Promise.all([
      dashboardApi.stats(),
      dashboardApi.health(),
      detectionsApi.recent(),
    ]).then(([s, h, d]) => {
      setStats(s.data)
      setHealth(h.data)
      setDetections(d.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    const t = setInterval(loadData, 15000) // poll every 15s
    return () => clearInterval(t)
  }, [])

  const fmtConf = (c: number | null) =>
    c != null ? `${((1 - c) * 100).toFixed(1)}%` : '—'

  const confBarWidth = (c: number | null) =>
    c != null ? `${((1 - c) * 100).toFixed(0)}%` : '0%'

  const confColor = (c: number | null) => {
    if (c == null) return '#94a3b8'
    const pct = (1 - c) * 100
    if (pct >= 90) return '#10b981'
    if (pct >= 65) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Breadcrumb + heading */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">
              <span className="hover:text-slate-300 cursor-pointer">Home</span>
              <span className="mx-1.5">/</span>
              <span className="text-slate-300">Surveillance Overview</span>
            </p>
            <h1 className="text-2xl font-bold text-slate-100">Operations Dashboard</h1>
          </div>
          {/* Live ZULU clock display */}
          <div className="hidden lg:block text-right">
            <LiveClock />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Registered"
            value={stats?.total_registered ?? '—'}
            sub="Daily Increase"
            subValue={`↑ ${stats?.daily_new_records ?? 0} New Records`}
            subColor="#10b981"
            icon={<Users size={22} />}
            loading={loading}
          />
          <StatCard
            label="Active Matches"
            value={stats?.active_matches ?? '—'}
            sub="System Accuracy"
            subValue="98.2% Verified"
            subColor="#94a3b8"
            icon={<Activity size={22} />}
            loading={loading}
          />
          <StatCard
            label="Alerts Dispatched"
            value={stats?.alerts_dispatched ?? '—'}
            sub="Status"
            subValue="⚠ Moderate Activity"
            subColor="#f59e0b"
            icon={<Bell size={22} />}
            loading={loading}
          />
        </div>

        {/* Main 2-col layout */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Identification Log */}
          <div className="flex-1 glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <ScanFace size={16} className="text-blue-400" />
                Recent Identification Log
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary !w-auto !py-1.5 !px-3 text-xs gap-1">
                  <Filter size={13} /> Filter
                </button>
                <button className="btn-secondary !w-auto !py-1.5 !px-3 text-xs gap-1">
                  <Download size={13} /> Export
                </button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Subject Identity', 'Location / CAM', 'Time Stamp', 'Match Confidence', 'Action'].map((h) => (
                    <th key={h} className="text-xs text-slate-500 font-medium text-left px-5 py-3 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detections.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                          {d.snapshot_url
                            ? <img src={d.snapshot_url} className="w-full h-full object-cover" alt="" />
                            : <ScanFace size={16} className="text-slate-500" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 text-xs">{d.case_id || 'UNKNOWN'}: {d.person_name || 'Unknown'}</p>
                          <span className={priorityColor[d.status] ?? 'badge-normal'}>
                            {d.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-300">{d.location || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">CAM: {d.camera_id || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-mono text-slate-300">
                        {new Date(d.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(d.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-bold mb-1" style={{ color: confColor(d.confidence) }}>
                        {fmtConf(d.confidence)}
                      </p>
                      <div className="h-1 rounded-full w-24" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: confBarWidth(d.confidence), background: confColor(d.confidence) }} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                        {d.status === 'pending' ? 'Verify' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
                {detections.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">No detections yet</td></tr>
                )}
              </tbody>
            </table>

            <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-slate-500 tracking-widest uppercase">
                End of Recent Log · Data Refreshed Automatically
              </p>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
            {/* Operator Controls */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
                Operator Controls
              </h3>
              <div className="flex flex-col gap-2">
                <Link to="/registry">
                  <button className="btn-primary">
                    <UserPlus size={15} /> Register New Entry
                  </button>
                </Link>
                <Link to="/live">
                  <button className="btn-secondary">
                    <ScanFace size={15} /> Initiate Manual Scan
                  </button>
                </Link>
                <Link to="/reports">
                  <button className="btn-secondary">
                    <FileBarChart size={15} /> Generate Report
                  </button>
                </Link>
              </div>
            </div>

            {/* System Diagnostics */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
                System Diagnostics
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Storage Capacity</span>
                    <span className="text-slate-300">{health?.storage_used_pct ?? 42}% Used</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${health?.storage_used_pct ?? 42}%`, background: 'linear-gradient(90deg,#2563eb,#06b6d4)' }} />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">API Latency</span>
                  <span className="text-xs font-medium text-green-400">
                    Stable ({health?.api_latency_ms ?? '—'}ms)
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Database Connection</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {health?.db_connected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Azure Storage</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${health?.storage_connected ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${health?.storage_connected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                    {health?.storage_connected ? 'ONLINE' : 'LOCAL'}
                  </span>
                </div>
              </div>
            </div>

            {/* System Notice */}
            <div className="glass-card p-4" style={{ borderLeft: '3px solid #2563eb' }}>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-blue-300 mb-1">SYSTEM NOTICE</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Routine maintenance is scheduled for 0300 hours ZULU. Please ensure all case files are saved before this time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return (
    <div>
      <p className="text-xl font-mono font-bold text-slate-100">{t.toUTCString().slice(17, 25)} <span className="text-blue-400 text-sm">ZULU</span></p>
      <p className="text-xs text-slate-500">{t.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
  )
}

function StatCard({ label, value, sub, subValue, subColor, icon, loading }: {
  label: string; value: string | number; sub: string; subValue: string; subColor: string; icon: React.ReactNode; loading: boolean
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">{label}</p>
        <div className="p-2 rounded" style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa' }}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-100 mb-3">
        {loading ? <span className="text-slate-500">…</span> : value}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{sub}</span>
        <span className="text-xs font-medium" style={{ color: subColor }}>{subValue}</span>
      </div>
    </div>
  )
}
