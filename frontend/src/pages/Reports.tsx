import { useFetch } from '@/lib/useFetch'
import { detectionsApi } from '@/lib/api'
import { FileBarChart, Download, ScanFace } from 'lucide-react'

interface Detection {
  id: string; case_id: string | null; person_name: string | null
  location: string | null; camera_id: string | null; timestamp: string
  confidence: number | null; status: string; sms_sent: boolean
  snapshot_url: string | null
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
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">Home / <span className="text-slate-300">Reports</span></p>
          <h1 className="text-2xl font-bold text-slate-100">Detection Reports</h1>
        </div>
        <button onClick={exportCsv} className="btn-primary !w-auto">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Detections', value: detections?.length ?? 0, color: '#60a5fa' },
          { label: 'SMS Alerts Sent', value: detections?.filter(d => d.sms_sent).length ?? 0, color: '#10b981' },
          { label: 'Pending Review', value: detections?.filter(d => d.status === 'pending').length ?? 0, color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} className="glass-card p-4">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Detection log table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileBarChart size={15} className="text-blue-400" /> Full Detection Log
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Snapshot', 'Case ID', 'Name', 'Location', 'Camera', 'Timestamp', 'Confidence', 'Status', 'SMS'].map(h => (
                  <th key={h} className="text-slate-500 font-medium text-left px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>}
              {detections?.map(d => (
                <tr key={d.id} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <div className="w-8 h-8 rounded bg-slate-700 overflow-hidden flex items-center justify-center">
                      {d.snapshot_url
                        ? <img src={d.snapshot_url} className="w-full h-full object-cover" alt="" />
                        : <ScanFace size={13} className="text-slate-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-300">{d.case_id || '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{d.person_name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-slate-400">{d.location || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{d.camera_id || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono">{new Date(d.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: confColor(d.confidence) }}>
                    {d.confidence != null ? ((1 - d.confidence) * 100).toFixed(1) + '%' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={d.status === 'pending' ? 'badge-monitored' : 'badge-normal'}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={d.sms_sent ? 'text-green-400' : 'text-slate-600'}>
                      {d.sms_sent ? '✓ Sent' : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && !detections?.length && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No detections logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
