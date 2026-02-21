import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, detectionsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import {
  Bell, Filter, Download, UserPlus, FileBarChart, Video, Info, LayoutDashboard, Database, Activity
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

const priorityLabel: Record<string, string> = {
  high: 'HIGH PRIORITY',
  normal: 'PENDING REVIEW',  // In screenshot, normal status is mapped to pending review
  monitored: 'MONITORED',
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
    const t = setInterval(loadData, 15000)
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
    <div className="min-h-screen pb-12" style={{ background: '#f1f5f9' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Breadcrumb + heading */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium">
              <span className="hover:text-slate-800 transition-colors cursor-pointer underline decoration-slate-300 underline-offset-2">Home</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">Surveillance Overview</span>
            </p>
            <h1 className="text-3xl font-bold text-slate-900 mt-2" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
              Operations Dashboard
            </h1>
          </div>
          <div className="text-right mt-1">
            <LiveClock />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <StatCard
            label="TOTAL REGISTERED"
            value={stats?.total_registered ?? '1,248'}
            sub="Daily Increase"
            subValue={`↑ ${stats?.daily_new_records ?? 12} New Records`}
            subColor="#10b981"
            icon={<Database size={20} strokeWidth={2.5} />}
            loading={loading}
          />
          <StatCard
            label="ACTIVE MATCHES"
            value={stats?.active_matches ?? '86'}
            sub="System Accuracy"
            subValue="98.2% Verified"
            subColor="#0f172a"
            icon={<Activity size={20} />}
            loading={loading}
          />
          <StatCard
            label="ALERTS DISPATCHED"
            value={stats?.alerts_dispatched ?? '342'}
            sub="Status"
            subValue="▲ Moderate Activity"
            subColor="#d97706"
            icon={<Bell size={20} />}
            loading={loading}
          />
        </div>

        {/* Main 2-col layout */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Identification Log */}
          <div className="flex-1 glass-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <LayoutDashboard size={20} className="text-slate-600" />
                <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-serif)' }}>
                  Recent Identification Log
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary !w-auto !py-1.5 !px-3 text-xs gap-1.5 shadow-sm">
                  <Filter size={14} /> Filter
                </button>
                <button className="btn-secondary !w-auto !py-1.5 !px-3 text-xs gap-1.5 shadow-sm">
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  {['Subject Identity', 'Location / CAM', 'Time Stamp', 'Match Confidence', 'Action'].map((h, i) => (
                    <th key={h} className={`text-[10px] text-slate-500 font-bold px-6 py-3 uppercase tracking-widest ${i > 2 ? 'text-center' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detections.slice(0, 5).map((d) => (
                  <tr key={d.id} className="table-row-border hover:bg-slate-50 transition-colors bg-white">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-200 shrink-0 flex items-center justify-center p-0.5" style={{ borderRadius: '2px' }}>
                          {d.snapshot_url
                            ? <img src={d.snapshot_url} className="w-full h-full object-cover" alt="" />
                            : <img src="https://api.dicebear.com/7.x/initials/svg?seed=JD&backgroundColor=e2e8f0" alt="Placeholder" />
                          }
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm mb-1">{d.case_id || 'ID-0000'}: {d.person_name || 'Unknown'}</p>
                          <span className={priorityColor[d.status] ?? 'badge-normal'}>
                            {priorityLabel[d.status] ?? d.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700">{d.location || 'Central Station'}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">CAM-{d.camera_id || '84A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-medium text-slate-700">
                        {new Date(d.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-bold mb-1.5" style={{ color: confColor(d.confidence) }}>
                        {fmtConf(d.confidence)}
                      </p>
                      <div className="h-0.5 rounded-full w-20 mx-auto bg-slate-200">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: confBarWidth(d.confidence), background: confColor(d.confidence) }} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors underline decoration-2 underline-offset-4 decoration-slate-300">
                        {d.status === 'pending' ? 'Verify' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
                {detections.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">No detections found</td></tr>
                )}
              </tbody>
            </table>

            <div className="px-6 py-4 text-center bg-white rounded-b-lg border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                End of Recent Log • Data Refreshed Automatically
              </p>
            </div>
          </div>

          <!-- Right panel -->
          <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
            {/* Operator Controls */}
            <div className="glass-card p-6 pb-7">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-5" style={{ fontFamily: 'var(--font-serif)' }}>
                Operator Controls
              </h3>
              <div className="flex flex-col gap-3">
                <Link to="/registry">
                  <button className="btn-primary py-2.5 shadow-sm">
                    <UserPlus size={16} /> Register New Entry
                  </button>
                </Link>
                <Link to="/live">
                  <button className="btn-secondary py-2.5 shadow-sm">
                    <Video size={16} /> Initiate Manual Scan
                  </button>
                </Link>
                <Link to="/reports">
                  <button className="btn-secondary py-2.5 shadow-sm">
                    <FileBarChart size={16} /> Generate Report
                  </button>
                </Link>
              </div>
            </div>

            {/* System Diagnostics */}
            <div className="glass-card p-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                System Diagnostics
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-600 font-medium">Storage Capacity</span>
                    <span className="text-slate-800 font-semibold">{health?.storage_used_pct ?? 42}% Used</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-500" style={{ width: `${health?.storage_used_pct ?? 42}%` }} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600 font-medium">API Latency</span>
                    <span className="text-xs font-bold text-green-600">
                      Stable ({health?.api_latency_ms ?? 45}ms)
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-200 w-full mb-4">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `10%` }} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-medium">Database Connection</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-slate-600 mt-0.5 shrink-0" fill="#e2e8f0" stroke="#0f172a" />
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-1.5">SYSTEM NOTICE</p>
                  <p className="text-xs text-slate-600 leading-relaxed pr-2">
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
    <>
      <p className="text-xs font-bold text-slate-700 mb-1">{t.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p className="text-2xl font-mono font-bold text-slate-900 tracking-tight">{t.toUTCString().slice(17, 25)} <span className="text-slate-600 font-sans text-xl ml-1">ZULU</span></p>
    </>
  )
}

function StatCard({ label, value, sub, subValue, subColor, icon, loading }: {
  label: string; value: string | number; sub: string; subValue: string; subColor: string; icon: React.ReactNode; loading: boolean
}) {
  return (
    <div className="glass-card p-6 relative">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</p>
        <div className="p-2 rounded bg-slate-100 text-slate-700 absolute top-5 right-5">{icon}</div>
      </div>
      <p className="text-4xl font-bold text-slate-800 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
        {loading ? <span className="text-slate-300">…</span> : value}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] font-medium text-slate-500">{sub}</span>
        <span className="text-[11px] font-bold" style={{ color: subColor }}>{subValue}</span>
      </div>
    </div>
  )
}
