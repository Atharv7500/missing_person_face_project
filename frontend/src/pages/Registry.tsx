import { useState, useRef, FormEvent } from 'react'
import { personsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { UserPlus, Upload, Trash2, User, Camera, Phone, Tag } from 'lucide-react'
import { useFetch } from '@/lib/useFetch'

interface Person {
  id: string; case_id: string; name: string; age: string | null
  contact: string | null; priority: string; photo_url: string | null
  registered_at: string
}

export default function Registry() {
  const { user } = useAuth()
  const { data: persons, refresh, loading } = useFetch<Person[]>('/persons', [])
  const [form, setForm] = useState({ name: '', age: '', contact: '', priority: 'normal' })
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setPhoto(f)
    if (f) setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      if (form.age) fd.append('age', form.age)
      if (form.contact) fd.append('contact', form.contact)
      fd.append('priority', form.priority)
      if (photo) fd.append('photo', photo)
      await personsApi.register(fd)
      setForm({ name: '', age: '', contact: '', priority: 'normal' })
      setPhoto(null); setPreview(null)
      setMsg('Person registered successfully.')
      refresh()
    } catch {
      setMsg('Failed to register. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    await personsApi.delete(id)
    refresh()
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <div className="mb-6">
        <p className="text-xs text-slate-500 mb-1">Home / <span className="text-slate-300">Registry</span></p>
        <h1 className="text-2xl font-bold text-slate-100">Missing Persons Registry</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-blue-400" /> Register New Entry
            </h2>

            {msg && (
              <p className={`text-xs mb-3 p-2 rounded ${msg.includes('success') ? 'text-green-300 bg-green-500/10' : 'text-red-300 bg-red-500/10'}`}>
                {msg}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-colors hover:border-blue-500"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
                  {preview
                    ? <img src={preview} className="w-full h-full object-cover" alt="" />
                    : <Camera size={28} className="text-slate-500" />
                  }
                </div>
                <p className="text-xs text-slate-500">Click to upload photo</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>

              {[
                { label: 'Full Name', key: 'name', icon: <User size={14} />, required: true, placeholder: 'Subject full name' },
                { label: 'Age', key: 'age', icon: <Tag size={14} />, required: false, placeholder: 'Approximate age' },
                { label: 'Contact', key: 'contact', icon: <Phone size={14} />, required: false, placeholder: 'Family contact' },
              ].map(({ label, key, icon, required, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
                    <input
                      type="text"
                      value={(form as any)[key]}
                      onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                      required={required}
                      placeholder={placeholder}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg text-slate-200 placeholder-slate-600 outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Priority</label>
                <select value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg text-slate-200 outline-none"
                  style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="monitored">Monitored</option>
                </select>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary mt-2">
                <Upload size={15} /> {submitting ? 'Registering…' : 'Register Entry'}
              </button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 glass-card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-slate-200">Registered Persons ({persons?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Photo', 'Case ID', 'Name', 'Age', 'Priority', 'Registered', 'Action'].map(h => (
                    <th key={h} className="text-xs text-slate-500 font-medium text-left px-4 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">Loading…</td></tr>}
                {!loading && persons?.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded bg-slate-700 overflow-hidden flex items-center justify-center">
                        {p.photo_url
                          ? <img src={p.photo_url} className="w-full h-full object-cover" alt="" />
                          : <User size={16} className="text-slate-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-300">{p.case_id}</td>
                    <td className="px-4 py-3 text-xs text-slate-200 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{p.age || '—'}</td>
                    <td className="px-4 py-3"><span className={`badge-${p.priority}`}>{p.priority}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(p.registered_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && (persons?.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">No persons registered yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
