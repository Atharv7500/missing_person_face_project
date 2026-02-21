import { useFetch } from '@/lib/useFetch'
import { detectionsApi } from '@/lib/api'
import { FileBarChart, Download, ScanFace } from 'lucide-react'

interface Detection {
  id: string; case_id: string | null; person_name: string | null
  location: string | null; camera_id: string | null; timestamp: string
  confidence: number | null; status: string; sms_sent: boolean
  snapshot_url: string | null
}

const priorityColor: Record<string, string> = {
  high: 'badge-high',
  normal: 'badge-normal',
  monitored: 'badge-monitored',
}
const priorityLabel: Record<string, string> = {
  high: 'HIGH PRIORITY',
  normal: 'PENDING REVIEW',
  monitored: 'MONITORED',
}

export default function Reports() {
  const { data: detections, loading } = useFetch<Detection[]>('/detections?limit=100', [])

  const exportCsv = () => {
    if (!detections?.length) return
    const rows = [
      ['Case ID', 'Name', 'Location', 'Camera', 'Timestamp', 'Confidence', 'Status', 'SMS Sent'],
      ...detections.map(d => [
        d.case_id || '', d.person_name || '', d.location || '', d.camera_id || '',
        d.timestamp, d.confidence != null ? ((1 - d.confidence) * 100).toFixed(1) + '%' : '',
        d.status, d.sms_sent ? 'Yes' : 'No',
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `detections_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const confColor = (c: number | null) => {
    if (c == null) return '#94a3b8'
    const pct = (1 - c) * 100
    return pct >= 90 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444'
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-500 mb-1 font-medium">
            <span className="hover:text-slate-800 transition-colors cursor-pointer underline decoration-slate-300 underline-offset-2">Home</span> 
            <span className="mx-2 text-slate-300">/</span> 
            <span className="text-slate-800 font-semibold">Reports</span>
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
            Detection Reports
          </h1>
        </div>
        <button onClick={exportCsv} className="btn-secondary !w-auto shadow-sm mt-3">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'TOTAL DETECTIONS', value: detections?.length ?? 0, color: '#0f172a' },
          { label: 'SMS ALERTS SENT', value: detections?.filter(d => d.sms_sent).length ?? 0, color: '#10b981' },
          { label: 'PENDING REVIEW', value: detections?.filter(d => d.status === 'pending').length ?? 0, color: '#d97706' },
        ].map(c => (
          <div key={c.label} className="glass-card p-6 border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">{c.label}</p>
            <p className="text-4xl font-bold" style={{ color: c.color, fontFamily: 'var(--font-serif)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Detection log table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
            <FileBarChart size={18} className="text-slate-600" /> Full Detection Log
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                {['Snapshot', 'Case ID', 'Name', 'Location', 'Camera', 'Timestamp', 'Confidence', 'Status', 'SMS'].map(h => (
                  <th key={h} className="text-[10px] text-slate-500 font-bold text-left px-5 py-3 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-500">Loading…</td></tr>}
              {detections?.map(d => (
                <tr key={d.id} className="table-row-border hover:bg-slate-50 transition-colors bg-white">
                  <td className="px-5 py-3">
                    <div className="w-8 h-8 bg-slate-200 flex items-center justify-center p-px" style={{ borderRadius: '2px' }}>
                      {d.snapshot_url
                        ? <img src={d.snapshot_url} className="w-full h-full object-cover" alt="" />
                        : <ScanFace size={16} className="text-slate-400" />}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono font-medium text-slate-600 whitespace-nowrap">{d.case_id || '—'}</td>
                  <td className="px-5 py-3 text-slate-800 font-bold whitespace-nowrap">{d.person_name || 'Unknown'}</td>
                  <td className="px-5 py-3 text-slate-600 font-medium whitespace-nowrap">{d.location || '—'}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono whitespace-nowrap">{d.camera_id || '—'}</td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">{new Date(d.timestamp).toLocaleString('en-GB')}</td>
                  <td className="px-5 py-3 font-bold text-center" style={{ color: confColor(d.confidence) }}>
                    {d.confidence != null ? ((1 - d.confidence) * 100).toFixed(1) + '%' : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={priorityColor[d.status] ?? 'badge-normal'}>
                      {priorityLabel[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={d.sms_sent ? 'text-green-600 font-bold text-xs flex items-center gap-1' : 'text-slate-400 text-xs'}>
                      {d.sms_sent ? 'SENT' : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && !detections?.length && (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-500">No detections logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
