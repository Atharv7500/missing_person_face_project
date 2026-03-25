import { useState, useRef, useEffect } from 'react'
import { Video, Camera, StopCircle, RefreshCw, ScanFace } from 'lucide-react'
import { detectionsApi } from '@/lib/api'

export default function Live() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.warn('Geolocation blocked:', err)
      )
    }
  }, [])

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
      if (isScanning) {
        setIsScanning(false)
        addLog('Live surveillance scan halted due to disconnect.')
      }
      addLog('Camera feed disconnected.')
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [stream])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isScanning && stream) {
      addLog('LIVE SURVEILLANCE ACTIVE: Initiating continuous scan cycle (1.5s interval)...')
      
      const captureFrame = () => {
        if (!videoRef.current || !canvasRef.current) return
        
        const video = videoRef.current
        const canvas = canvasRef.current
        let w = video.videoWidth
        let h = video.videoHeight
        if (w === 0 || h === 0) return
        
        const MAX_DIM = 1000
        if (w > h && w > MAX_DIM) { h *= MAX_DIM / w; w = MAX_DIM; }
        else if (h > w && h > MAX_DIM) { w *= MAX_DIM / h; h = MAX_DIM; }
        
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h)
          canvas.toBlob(async (blob) => {
            if (blob) {
              const fd = new FormData()
              fd.append('photo', blob, 'scan.jpg')
              if (location) {
                fd.append('latitude', location.lat.toString())
                fd.append('longitude', location.lng.toString())
              }
              
              try {
                const res = await detectionsApi.liveScan(fd)
                const faces = res.data.faces || [];
                
                const overlay = overlayCanvasRef.current;
                const oCtx = overlay?.getContext('2d');
                if (overlay && oCtx) {
                   overlay.width = w;
                   overlay.height = h;
                   oCtx.clearRect(0, 0, w, h);
                   
                   let anyMatch = false;
                   faces.forEach((f: any) => {
                      const [x=0, y=0, x2=w, y2=h] = f.box;
                      const bw = x2 - x;
                      const bh = y2 - y;
                      
                      const isMatch = !!f.match;
                      oCtx.strokeStyle = isMatch ? '#22c55e' : '#ef4444'; // green/red
                      oCtx.lineWidth = 3;
                      oCtx.strokeRect(x, y, bw, bh);
                      
                      const label = isMatch ? `MATCH: ${f.match.name} (${(f.match.confidence*100).toFixed(1)}%)` : 'Unknown';
                      oCtx.font = 'bold 16px sans-serif';
                      const tw = oCtx.measureText(label).width;
                      
                      oCtx.fillStyle = isMatch ? '#22c55e' : '#ef4444';
                      oCtx.fillRect(x, y - 24, tw + 8, 24);
                      
                      oCtx.fillStyle = 'white';
                      oCtx.fillText(label, x + 4, y - 6);
                      
                      if(isMatch) {
                          anyMatch = true;
                          addLog(`🚨 MATCH FOUND: ${f.match.name} (${(f.match.confidence*100).toFixed(1)}% confidence)`)
                      }
                   });
                   
                   if (faces.length > 0 && !anyMatch) {
                      addLog(`Subject(s) evaluated: NO MATCH in registry.`);
                   }
                }
              } catch (e) {
                addLog('ERROR: Connection to main server failed.')
              }
            }
          }, 'image/jpeg')
        }
      }
      
      // Perform one initial scan then loop
      captureFrame()
      interval = setInterval(captureFrame, 1500)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, stream])

  const toggleScan = () => {
    if (!stream) return
    if (!isScanning) {
      setLogs([]) // Clear old logs when starting fresh scan
    } else {
      addLog('Live surveillance scan halted.')
    }
    setIsScanning(!isScanning)
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
          <Video className="text-blue-600" size={28} /> Active Surveillance feed
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
            
            {stream && (
              <canvas 
                 ref={overlayCanvasRef} 
                 className="absolute inset-0 w-full h-full pointer-events-none object-cover" 
                 style={{ opacity: isScanning ? 1 : 0 }}
              />
            )}
            
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
        <div className="w-full lg:w-80 shrink-0 glass-card flex flex-col h-full min-h-[400px] overflow-hidden">
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


