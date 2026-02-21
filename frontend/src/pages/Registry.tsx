import { useState, useRef, FormEvent } from 'react'
import { personsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { UserPlus, Upload, Trash2, Camera, Phone, Tag } from 'lucide-react'
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
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-xs text-slate-500 mb-1 font-medium">
          <span className="hover:text-slate-800 transition-colors cursor-pointer underline decoration-slate-300 underline-offset-2">Home</span> 
          <span className="mx-2 text-slate-300">/</span> 
          <span className="text-slate-800 font-semibold">Registry</span>
        </p>
        <h1 className="text-3xl font-bold text-slate-900 mt-2" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
          Missing Persons Registry
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
              <UserPlus size={18} className="text-slate-600" /> Register New Entry
            </h2>

            {msg && (
              <p className={`text-xs mb-4 p-3 rounded font-medium border ${msg.includes('success') ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                {msg}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-28 h-28 rounded-lg border-2 border-dashed bg-slate-50 border-slate-300 cursor-pointer flex items-center justify-center overflow-hidden transition-colors hover:border-slate-500">
                  {preview
                    ? <img src={preview} className="w-full h-full object-cover" alt="" />
                    : <Camera size={28} className="text-slate-400" />
                  }
                </div>
                <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase mt-1">Upload Photo</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>

              {[
                { label: 'Full Name', key: 'name', icon: <UserPlus size={14} />, required: true, placeholder: 'Subject full name' },
                { label: 'Age', key: 'age', icon: <Tag size={14} />, required: false, placeholder: 'Approximate age' },
                { label: 'Contact', key: 'contact', icon: <Phone size={14} />, required: false, placeholder: 'Family contact' },
              ].map(({ label, key, icon, required, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
                    <input
                      type="text"
                      value={(form as any)[key]}
                      onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                      required={required}
                      placeholder={placeholder}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-md text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white shadow-sm"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest">Priority</label>
                <select value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-md text-slate-800 border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white shadow-sm appearance-none cursor-pointer">
                  <option value="normal">Pending Review</option>
                  <option value="high">High Priority</option>
                  <option value="monitored">Monitored</option>
                </select>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary mt-6 shadow-sm py-2.5">
                <Upload size={16} /> {submitting ? 'Registering…' : 'Register Entry'}
              </button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 glass-card overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-serif)' }}>Registered Persons ({persons?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {['Photo', 'Case ID', 'Name', 'Age', 'Priority', 'Registered', 'Action'].map(h => (
                    <th key={h} className="text-[10px] text-slate-500 font-bold text-left px-5 py-3 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Loading…</td></tr>}
                {!loading && persons?.map((p) => (
                  <tr key={p.id} className="table-row-border hover:bg-slate-50 transition-colors bg-white">
                    <td className="px-5 py-3">
                      <div className="w-10 h-10 bg-slate-200 flex items-center justify-center p-0.5" style={{ borderRadius: '2px' }}>
                        {p.photo_url
                          ? <img src={p.photo_url} className="w-full h-full object-cover" alt="" />
                          : <img src="https://api.dicebear.com/7.x/initials/svg?seed=MP&backgroundColor=e2e8f0" alt="Placeholder" />}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-slate-600 text-sm">{p.case_id}</td>
                    <td className="px-5 py-4 text-sm text-slate-800 font-bold">{p.name}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{p.age || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`badge-${p.priority === 'normal' ? 'normal' : p.priority}`}>
                         {p.priority === 'normal' ? 'PENDING REVIEW' : (p.priority === 'high' ? 'HIGH PRIORITY' : 'MONITORED')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                      {new Date(p.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && (persons?.length === 0) && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No persons registered yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
