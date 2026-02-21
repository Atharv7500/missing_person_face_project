import { useState, useRef, useEffect } from 'react'
import { Video, Camera, StopCircle, RefreshCw, UploadCloud } from 'lucide-react'

export default function Live() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLogs(p => [`[${new Date().toLocaleTimeString('en-US', {hour12:false})}] ${msg}`, ...p].slice(0, 10))
  }

  const startCamera = async () => {
    setError('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
      addLog('Camera feed established.')
    } catch (e: any) {
      console.error(e)
      setError('Camera access denied or unavailable.')
      addLog('ERROR: Could not access camera.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
      addLog('Camera feed disconnected.')
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [stream])

  const toggleScan = () => {
    if (!stream) return
    setIsScanning(!isScanning)
    if (!isScanning) {
      addLog('Initiating manual face scan sequence...')
      // Placeholder for future backend integration
      setTimeout(() => addLog('Analyzing feed... (Backend API not connected)'), 1500)
    } else {
      addLog('Manual scan halted.')
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-xs text-slate-500 mb-1 font-medium">
          <span className="hover:text-slate-800 transition-colors cursor-pointer underline decoration-slate-300 underline-offset-2">Home</span> 
          <span className="mx-2 text-slate-300">/</span> 
          <span className="text-slate-800 font-semibold">Live Surveillance</span>
        </p>
        <h1 className="text-3xl font-bold text-slate-900 mt-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
          <Video className="text-blue-600" size={28} /> Initiate Manual Scan
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Video Feed */}
        <div className="w-full lg:flex-1 shrink-0 glass-card overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${stream ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
               <span className="text-xs font-bold text-white uppercase tracking-widest">{stream ? 'FEED ACTIVE' : 'FEED OFFLINE'}</span>
             </div>
             <span className="text-xs font-mono text-slate-400">CAM-MANUAL-01</span>
          </div>
          
          <div className="relative bg-black w-full aspect-video flex items-center justify-center">
            {error && <p className="text-red-500 text-sm font-bold absolute z-10 bg-black/80 px-4 py-2 rounded">{error}</p>}
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`} 
            />
            
            {!stream && !error && (
              <div className="flex flex-col items-center text-slate-500">
                <Camera size={48} className="mb-4 opacity-30" />
                <p className="text-sm font-bold tracking-widest uppercase">Select 'Start Camera' to begin</p>
              </div>
            )}

            {/* Scan Overlay UI */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 animate-pulse">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-400 opacity-50 relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-4">
            {!stream ? (
              <button onClick={startCamera} className="btn-primary py-2.5 px-6 !w-auto">
                <Camera size={16} /> Start Camera
              </button>
            ) : (
              <>
                <button onClick={toggleScan} className={`btn-primary py-2.5 px-6 !w-auto ${isScanning ? '!bg-red-600 hover:!bg-red-700' : '!bg-blue-600 hover:!bg-blue-700'}`}>
                  {isScanning ? <><StopCircle size={16} /> Stop Scan</> : <><ScanFace size={16} /> Start Scan Analysis</>}
                </button>
                <button onClick={stopCamera} className="btn-secondary py-2.5 px-6 !w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Logs */}
        <div className="w-full lg:w-80 shrink-0 glass-card flex flex-col h-full min-h-[400px]">
           <div className="px-5 py-3 border-b border-slate-200 bg-white">
             <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest" style={{ fontFamily: 'var(--font-serif)' }}>Terminal Logs</h3>
           </div>
           
           <div className="flex-1 bg-[#0f172a] p-4 overflow-y-auto font-mono text-[10px] text-green-400 space-y-1 rounded-b-lg">
             {logs.length === 0 && <p className="text-slate-500 italic">No system activity...</p>}
             {logs.map((l, i) => (
               <p key={i} className={l.includes('ERROR') ? 'text-red-400' : ''}>{l}</p>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function ScanFace({size}: {size: number}) {
  return <RefreshCw size={size} /> // Placeholder icon instead of full lucide package import for 1 icon
}
