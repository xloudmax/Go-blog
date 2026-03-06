import { useState, useCallback, useRef, useEffect } from 'react';
import { LiquidSurface, LiquidGlassProfile } from '../components/LiquidSurface';
import { LiquidSlider } from '../components/LiquidSlider';
import { LiquidMagnifier } from '../components/LiquidMagnifier';
import { LiquidSwitch } from '../components/LiquidSwitch';

/* ──────────────────── Height functions (mirrored from engine) ──────────────────── */
const cubicBezierTolerance = 1e-7;
const getTForX = (x: number, p1x: number, p2x: number): number => {
  let lower = 0, upper = 1, t = 0.5, currentX = 0;
  for (let i = 0; i < 12; i++) {
    currentX = 3 * (1-t)**2 * t * p1x + 3 * (1-t) * t**2 * p2x + t**3;
    if (Math.abs(currentX - x) < cubicBezierTolerance) break;
    if (currentX < x) lower = t; else upper = t;
    t = (upper + lower) / 2;
  }
  return t;
};
const cubicBezierY = (t: number, p1y: number, p2y: number): number =>
  3 * (1-t)**2 * t * p1y + 3 * (1-t) * t**2 * p2y + t**3;
const solveBezier = (x: number, p1x: number, p1y: number, p2x: number, p2y: number): number => {
  if (x <= 0) return 0; if (x >= 1) return 1;
  return cubicBezierY(getTForX(x, p1x, p2x), p1y, p2y);
};
const heightConvex = (x: number) =>
  x <= 0.5
    ? solveBezier(2*x, 0.33, 1.53, 0.69, 0.99) / 2
    : (2 - solveBezier(2*(1-x), 0.33, 1.53, 0.69, 0.99)) / 2;
const heightCircle = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return Math.sqrt(1 - (1-c)*(1-c));
};
const heightConcave = (x: number) => 1 - heightConvex(1 - x);
const smootherStep = (x: number) => x*x*x*(x*(x*6-15)+10);
const heightLip = (x: number) => {
  const c1 = heightConvex(x), c2 = heightConcave(x), m = smootherStep(x);
  return c1*(1-m) + c2*m;
};
const heightFlat = () => 1;

function getHeightFn(p: LiquidGlassProfile) {
  switch(p) {
    case 'convex': return heightConvex;
    case 'convex-circle': return heightCircle;
    case 'concave': return heightConcave;
    case 'lip': return heightLip;
    case 'flat': return heightFlat;
  }
}

/* ──────────────────── Snell refraction on a 1D surface ──────────────────── */
function computeRadiusDisplacements(
  heightFn: (x: number) => number,
  bezelRatio: number,
  ior: number,
  samples: number = 127
): { t: number; displacement: number; maxDisplacement: number }[] {
  const result: { t: number; displacement: number; maxDisplacement: number }[] = [];
  let maxD = 0;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    if (t > bezelRatio) {
      result.push({ t, displacement: 0, maxDisplacement: 0 });
      continue;
    }
    const normalizedT = t / bezelRatio;
    const delta = 0.001;
    const y1 = heightFn(Math.max(0, normalizedT - delta));
    const y2 = heightFn(Math.min(1, normalizedT + delta));
    const derivative = (y2 - y1) / (2 * delta);
    // Snell: displacement from slope × ior factor
    const displacement = derivative * (ior / 1.5);
    if (Math.abs(displacement) > maxD) maxD = Math.abs(displacement);
    result.push({ t, displacement, maxDisplacement: 0 });
  }
  // Normalize and store max
  return result.map(r => ({ ...r, maxDisplacement: maxD }));
}

/* ──────────────────── Canvas-based panels ──────────────────── */
function SurfaceProfileGraph({ profile, bezelRatio }: { profile: LiquidGlassProfile; bezelRatio: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const pad = 20;
    ctx.clearRect(0, 0, w, h);
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gy = pad + (h - 2*pad) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w-pad, gy); ctx.stroke();
      const gx = pad + (w - 2*pad) * i / 4;
      ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, h-pad); ctx.stroke();
    }
    
    // Bezel boundary line
    const bezelX = pad + bezelRatio * (w - 2*pad);
    ctx.strokeStyle = 'rgba(255,165,0,0.4)';
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(bezelX, pad); ctx.lineTo(bezelX, h-pad); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,165,0,0.6)';
    ctx.font = '9px monospace';
    ctx.fillText('bezel', bezelX + 3, pad + 12);
    
    // Draw height function
    const fn = getHeightFn(profile);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px <= w - 2*pad; px++) {
      const t = px / (w - 2*pad);
      const val = t <= bezelRatio ? fn(t / bezelRatio) : 1;
      const x = pad + px;
      const y = h - pad - val * (h - 2*pad);
      if (px === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('0', pad - 2, h - pad + 12);
    ctx.fillText('1', w - pad - 4, h - pad + 12);
    ctx.fillText('h=1', 2, pad + 4);
    ctx.fillText('h=0', 2, h - pad);
  }, [profile, bezelRatio]);
  
  return <canvas ref={canvasRef} width={250} height={160} className="w-full rounded-lg bg-black/30" />;
}

function RadiusSimulationCanvas({ profile, bezelRatio, ior }: { profile: LiquidGlassProfile; bezelRatio: number; ior: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const fn = getHeightFn(profile);
    const glassTop = h * 0.3;
    const glassBottom = h * 0.7;
    const glassHeight = glassBottom - glassTop;
    const pad = 10;
    const usableW = w - 2*pad;
    
    // Draw glass body
    ctx.fillStyle = 'rgba(100,180,255,0.08)';
    ctx.fillRect(pad, glassTop, usableW, glassHeight);
    ctx.strokeStyle = 'rgba(100,180,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, glassTop, usableW, glassHeight);
    
    // Draw glass surface (top profile)
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px <= usableW; px++) {
      const t = px / usableW;
      const surfH = t <= bezelRatio ? fn(t / bezelRatio) : 1;
      const x = pad + px;
      const y = glassBottom - surfH * glassHeight;
      if (px === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw rays
    const numRays = 15;
    for (let i = 0; i < numRays; i++) {
      const t = (i + 0.5) / numRays;
      const x = pad + t * usableW;
      const normalizedT = t <= bezelRatio ? t / bezelRatio : 1;
      
      // Height at point
      const surfH = t <= bezelRatio ? fn(normalizedT) : 1;
      const surfY = glassBottom - surfH * glassHeight;
      
      // Compute slope → refraction angle
      const delta = 0.001;
      const y1 = fn(Math.max(0, normalizedT - delta));
      const y2 = fn(Math.min(1, normalizedT + delta));
      const slope = (y2 - y1) / (2 * delta);
      const displacement = slope * (ior / 1.5) * 30; // visual scale
      
      // Incoming ray (straight down)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, surfY);
      ctx.stroke();
      
      // Refracted ray
      const endX = x + displacement;
      const mag = Math.abs(displacement);
      const hue = 200 + mag * 4;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.7)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, surfY);
      ctx.lineTo(endX, h);
      ctx.stroke();
      
      // Dot at surface hit
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(x, surfY, 2, 0, Math.PI*2);
      ctx.fill();
    }
    
    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px monospace';
    ctx.fillText('Air', pad + 2, glassTop - 4);
    ctx.fillText('Glass', pad + 2, glassTop + 14);
  }, [profile, bezelRatio, ior]);
  
  return <canvas ref={canvasRef} width={250} height={200} className="w-full rounded-lg bg-black/30" />;
}

function RadiusDisplacementsCanvas({ profile, bezelRatio, ior }: { profile: LiquidGlassProfile; bezelRatio: number; ior: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const displacements = computeRadiusDisplacements(getHeightFn(profile), bezelRatio, ior, 63);
    const pad = 20;
    const centerY = h / 2;
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, centerY); ctx.lineTo(w-pad, centerY); ctx.stroke();
    
    // Zero line label
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px monospace';
    ctx.fillText('0', pad - 12, centerY + 3);
    
    // Draw displacement arrows
    const maxVis = 60;
    for (const d of displacements) {
      const x = pad + d.t * (w - 2*pad);
      const arrowLen = d.maxDisplacement > 0 
        ? (d.displacement / d.maxDisplacement) * maxVis 
        : 0;
      
      const mag = Math.abs(d.displacement);
      const maxMag = d.maxDisplacement || 1;
      const hue = 200 + (mag / maxMag) * 60;
      
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, centerY);
      ctx.lineTo(x, centerY - arrowLen);
      ctx.stroke();
      
      // Arrow head
      if (Math.abs(arrowLen) > 3) {
        const dir = arrowLen > 0 ? -1 : 1;
        const tipY = centerY - arrowLen;
        ctx.beginPath();
        ctx.moveTo(x, tipY);
        ctx.lineTo(x - 3, tipY + dir * 5);
        ctx.lineTo(x + 3, tipY + dir * 5);
        ctx.closePath();
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
        ctx.fill();
      }
    }
    
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px monospace';
    ctx.fillText('edge', pad - 2, h - 4);
    ctx.fillText('center', w - pad - 30, h - 4);
  }, [profile, bezelRatio, ior]);
  
  return <canvas ref={canvasRef} width={250} height={160} className="w-full rounded-lg bg-black/30" />;
}

/* ──────────────────── Reusable Controls ──────────────────── */
function ParamSlider({ label, value, onChange, min = 0, max = 1, step = 0.01, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] text-slate-400 font-medium w-14 shrink-0 text-right">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="accent-blue-500 flex-1 h-1" />
      <span className="text-[10px] font-mono text-blue-400 w-10 shrink-0">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
    </div>
  );
}

/* ──────────────────── Panel card ──────────────────── */
function PanelCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden ${className}`}>
      <div className="px-3 py-1.5 border-b border-white/10 bg-white/[0.02]">
        <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ──────────────────── Component demo wrapper ──────────────────── */
function DemoSection({ title, description, children, controls }: {
  title: string; description: string; children: React.ReactNode; controls: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-white/90">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div className="relative flex items-center justify-center min-h-[140px] rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%),
            linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}>
        <div className="absolute w-32 h-32 bg-pink-500/30 rounded-full blur-3xl -top-8 -left-8 pointer-events-none" />
        <div className="absolute w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl -bottom-8 -right-8 pointer-events-none" />
        <div className="relative z-10 p-6 flex items-center justify-center w-full">{children}</div>
      </div>
      <div className="mt-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex flex-col gap-1">{controls}</div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
export default function LiquidGlassTestPage() {
  // ─── Playground ───
  const [pgProfile, setPgProfile] = useState<LiquidGlassProfile>('convex');
  const [pgScale, setPgScale] = useState(30);
  const [pgBezel, setPgBezel] = useState(0.40);
  const [pgIor, setPgIor] = useState(1.5);
  const [pgRadius, setPgRadius] = useState(24);
  const [pgSpecular, setPgSpecular] = useState(1.0);
  const [mapUrl, setMapUrl] = useState('');
  const handleMapGenerated = useCallback((url: string) => setMapUrl(url), []);

  // ─── SearchBox ───
  const [sbBezel, setSbBezel] = useState(0.20);
  const [sbIor, setSbIor] = useState(1.5);
  const [sbScale, setSbScale] = useState(4);
  const [sbSpec, setSbSpec] = useState(0.70);

  // ─── Switch ───
  const [swChecked, setSwChecked] = useState(false);
  const [swScale, setSwScale] = useState(50);
  const [swSpec, setSwSpec] = useState(0.20);

  // ─── Slider ───
  const [slBezel, setSlBezel] = useState(0.40);
  const [slIor, setSlIor] = useState(1.5);
  const [slScale, setSlScale] = useState(7);
  const [slSpec, setSlSpec] = useState(0.0);

  // ─── Music Player ───
  const [mpBezel, setMpBezel] = useState(0.40);
  const [mpIor, setMpIor] = useState(1.5);
  const [mpScale, setMpScale] = useState(6);
  const [mpSpec, setMpSpec] = useState(1.0);
  // iTunes API
  const [itunesQuery, setItunesQuery] = useState('glass animals');
  const [itunesTrack, setItunesTrack] = useState<{ name: string; artist: string; album: string; artwork: string; previewUrl: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!itunesQuery.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(itunesQuery)}&media=music&limit=1`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            const t = data.results[0];
            setItunesTrack({
              name: t.trackName || 'Unknown',
              artist: t.artistName || 'Unknown',
              album: t.collectionName || '',
              artwork: (t.artworkUrl100 || '').replace('100x100', '300x300'),
              previewUrl: t.previewUrl || '',
            });
          }
        })
        .catch(() => {});
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [itunesQuery]);

  const togglePlay = useCallback(() => {
    if (!itunesTrack?.previewUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) audioRef.current = new Audio(itunesTrack.previewUrl);
      else audioRef.current.src = itunesTrack.previewUrl;
      audioRef.current.play().catch(() => {});
      audioRef.current.onended = () => setIsPlaying(false);
      setIsPlaying(true);
    }
  }, [itunesTrack, isPlaying]);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-slate-200">
      {/* Header */}
      <header className="text-center py-10 px-4">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          Liquid Glass Playground
        </h1>
        <p className="text-slate-400 mt-1.5 text-xs max-w-lg mx-auto">
          Physics-based refraction with SDF displacement maps — 1:1 replica of the kube.io demo.
        </p>
        <p className="text-pink-400/60 text-[10px] mt-1">Chrome/Edge only (SVG filters as backdrop-filter)</p>
      </header>

      <div className="px-4 pb-16 max-w-5xl mx-auto space-y-10">
        {/* ═══════════ PLAYGROUND — 6 PANELS ═══════════ */}
        <section>
          <h2 className="text-lg font-bold text-white/90 mb-1">Playground</h2>
          <p className="text-xs text-slate-400 mb-4">
            Tweak surface shape, bezel width, glass thickness, and effect scale. Watch how these inputs change the refraction field, the generated displacement map, and the final rendering.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Panel 1: Surface */}
            <PanelCard title="Surface">
              <div className="grid grid-cols-3 gap-1 mb-3">
                {(['convex', 'convex-circle', 'concave', 'lip', 'flat'] as const).map(p => (
                  <button key={p} onClick={() => setPgProfile(p)}
                    className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all ${
                      pgProfile === p
                        ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                        : 'bg-white/[0.06] text-slate-400 hover:bg-white/10'
                    }`}>
                    {p === 'convex-circle' ? 'Circle' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <SurfaceProfileGraph profile={pgProfile} bezelRatio={pgBezel} />
            </PanelCard>

            {/* Panel 2: Controls */}
            <PanelCard title="Controls">
              <div className="flex flex-col gap-2">
                <ParamSlider label="Bezel" value={pgBezel} onChange={setPgBezel} />
                <ParamSlider label="Thickness" value={pgIor} onChange={setPgIor} min={1} max={3} step={0.1} />
                <ParamSlider label="Scale" value={pgScale} onChange={setPgScale} min={0} max={100} step={1} />
                <ParamSlider label="Radius" value={pgRadius} onChange={setPgRadius} min={0} max={150} step={1} unit="px" />
                <ParamSlider label="Specular" value={pgSpecular} onChange={setPgSpecular} />
              </div>
            </PanelCard>

            {/* Panel 3: Radius Simulation */}
            <PanelCard title="Radius Simulation">
              <RadiusSimulationCanvas profile={pgProfile} bezelRatio={pgBezel} ior={pgIor} />
            </PanelCard>

            {/* Panel 4: Displacement Map */}
            <PanelCard title="Displacement Map">
              {mapUrl ? (
                <img src={mapUrl} alt="Displacement Map" className="w-full rounded-lg border border-white/10" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-slate-500 text-xs">Generating...</div>
              )}
            </PanelCard>

            {/* Panel 5: Radius Displacements */}
            <PanelCard title="Radius Displacements">
              <RadiusDisplacementsCanvas profile={pgProfile} bezelRatio={pgBezel} ior={pgIor} />
            </PanelCard>

            {/* Panel 6: Preview */}
            <PanelCard title="Preview" className="relative">
              <div className="relative flex items-center justify-center min-h-[160px] rounded-lg overflow-hidden">
                <div className="absolute w-24 h-24 bg-pink-500/40 rounded-full blur-2xl -top-4 -left-4 pointer-events-none" />
                <div className="absolute w-28 h-28 bg-cyan-500/30 rounded-full blur-2xl -bottom-4 -right-4 pointer-events-none" />
                <div className="absolute text-[60px] font-black italic opacity-[0.06] text-white select-none pointer-events-none">
                  GLASS
                </div>
                <LiquidSurface
                  profile={pgProfile}
                  fidelity="high"
                  scale={pgScale}
                  bezelRatio={pgBezel}
                  ior={pgIor}
                  borderRadius={pgRadius}
                  specular={pgSpecular}
                  interactiveLighting
                  highlightColor={`rgba(255,255,255,${pgSpecular * 0.5})`}
                  width={200}
                  height={200}
                  onMapGenerated={handleMapGenerated}
                >
                  <div className="w-full h-full flex items-center justify-center text-white/50 text-[10px] p-4 text-center">
                    Hover to illuminate
                  </div>
                </LiquidSurface>
              </div>
            </PanelCard>
          </div>
        </section>

        {/* ═══════════ MAGNIFYING GLASS ═══════════ */}
        <section className="w-full">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-white/90">Magnifying Glass</h2>
            <p className="text-xs text-slate-400 mt-0.5">Drag the lens across the scene — dual displacement maps for bezel refraction + center zoom.</p>
          </div>
          <div className="relative flex items-center justify-center rounded-xl overflow-hidden border border-white/10"
            style={{
              height: 300,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23667'/%3E%3Cstop offset='100%25' stop-color='%23334'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='200' height='200'/%3E%3Ctext x='10' y='40' fill='%23aab' font-size='14' font-family='monospace'%3ELiquid Glass%3C/text%3E%3Ctext x='10' y='80' fill='%2388a' font-size='11' font-family='monospace'%3ESDF Displacement%3C/text%3E%3Ctext x='10' y='120' fill='%2366a' font-size='11' font-family='monospace'%3ERefraction Engine%3C/text%3E%3Ccircle cx='160' cy='50' r='20' fill='%23f4a' opacity='0.3'/%3E%3Ccircle cx='140' cy='150' r='30' fill='%234af' opacity='0.2'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}>
            <div className="absolute w-40 h-40 bg-purple-500/30 rounded-full blur-3xl top-4 right-12 pointer-events-none" />
            <div className="absolute w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl bottom-0 left-8 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[80px] font-black italic opacity-[0.05] text-white select-none pointer-events-none">LENS</span>
            </div>
            <LiquidMagnifier
              width={180}
              height={120}
              borderRadius={60}
              bezelRatio={0.50}
              scale={9}
              ior={1.5}
              specular={1.0}
            />
          </div>
        </section>

        {/* ═══════════ SEARCHBOX ═══════════ */}
        <DemoSection
          title="Searchbox"
          description="Pill-shaped search input with convex bezel refraction."
          controls={<>
            <ParamSlider label="Bezel" value={sbBezel} onChange={setSbBezel} />
            <ParamSlider label="Thickness" value={sbIor} onChange={setSbIor} min={1} max={3} step={0.1} />
            <ParamSlider label="Scale" value={sbScale} onChange={setSbScale} min={0} max={100} step={1} />
            <ParamSlider label="Specular" value={sbSpec} onChange={setSbSpec} />
          </>}
        >
          <LiquidSurface profile="convex" fidelity="high" scale={sbScale} bezelRatio={sbBezel} ior={sbIor}
            borderRadius={35} width={400} height={70} specular={sbSpec}
            interactiveLighting={sbSpec > 0} highlightColor={`rgba(255,255,255,${sbSpec * 0.5})`}
            className="flex items-center px-5">
            <svg className="w-5 h-5 text-white/50 shrink-0 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-white/40 text-base font-medium select-none">Search</span>
          </LiquidSurface>
        </DemoSection>

        {/* ═══════════ SWITCH ═══════════ */}
        <DemoSection
          title="Switch"
          description='Apple iOS replica with 146x92 lens refracting the green container.'
          controls={<>
            <ParamSlider label="Scale" value={swScale} onChange={setSwScale} min={0} max={100} step={1} />
            <ParamSlider label="Specular" value={swSpec} onChange={setSwSpec} />
          </>}
        >
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold w-12 text-right transition-colors" style={{ color: swChecked ? '#4ade80' : '#94a3b8' }}>
              {swChecked ? 'ON' : 'OFF'}
            </span>
            <LiquidSwitch checked={swChecked} onCheckedChange={setSwChecked} scale={swScale} />
          </div>
        </DemoSection>

        {/* ═══════════ SLIDER ═══════════ */}
        <DemoSection
          title="Slider"
          description="Convex bezel refracts the sides while the level shows through the glass."
          controls={<>
            <ParamSlider label="Bezel" value={slBezel} onChange={setSlBezel} />
            <ParamSlider label="Thickness" value={slIor} onChange={setSlIor} min={1} max={3} step={0.1} />
            <ParamSlider label="Scale" value={slScale} onChange={setSlScale} min={0} max={50} step={1} />
            <ParamSlider label="Specular" value={slSpec} onChange={setSlSpec} />
          </>}
        >
          <LiquidSlider scale={slScale} width={380} height={40} containerClassName="mx-auto" />
        </DemoSection>

        {/* ═══════════ MUSIC PLAYER ═══════════ */}
        <section className="w-full">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-white/90">Music Player</h2>
            <p className="text-xs text-slate-400 mt-0.5">Glass panel mimicking Apple Music — uses iTunes Search API for real album art and 30s previews.</p>
          </div>

          {/* iTunes Search */}
          <div className="mb-3">
            <input
              type="text"
              value={itunesQuery}
              onChange={e => setItunesQuery(e.target.value)}
              placeholder="Search iTunes…"
              className="w-full px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Player */}
          <div className="relative flex items-center justify-center rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]"
            style={{ minHeight: 220 }}>
            {/* Album art blurred background */}
            {itunesTrack?.artwork && (
              <div className="absolute inset-0 overflow-hidden">
                <img src={itunesTrack.artwork} alt="" className="w-full h-full object-cover blur-3xl opacity-30 scale-150" />
              </div>
            )}
            <div className="absolute w-32 h-32 bg-pink-500/30 rounded-full blur-3xl -top-8 -left-8 pointer-events-none" />
            <div className="absolute w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl -bottom-8 -right-8 pointer-events-none" />

            <div className="relative z-10 p-4 w-full">
              <LiquidSurface profile="convex" fidelity="high" scale={mpScale} bezelRatio={mpBezel} ior={mpIor}
                borderRadius={24} width="100%" height={180} specular={mpSpec}
                interactiveLighting={mpSpec > 0} highlightColor={`rgba(255,255,255,${mpSpec * 0.5})`}
                className="p-5 flex items-center justify-between overflow-hidden">
                <div className="flex items-center gap-5 z-10">
                  {itunesTrack?.artwork ? (
                    <img src={itunesTrack.artwork} alt="Album" className="w-20 h-20 rounded-xl shadow-lg border border-white/20 shrink-0 object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-tr from-pink-500 to-orange-400 shadow-lg border border-white/20 shrink-0" />
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-white/90 text-base font-bold drop-shadow-sm truncate">
                      {itunesTrack?.name || 'Search for a song…'}
                    </span>
                    <span className="text-white/50 text-sm font-medium truncate">
                      {itunesTrack?.artist || ''}
                    </span>
                    <span className="text-white/30 text-xs truncate">
                      {itunesTrack?.album || ''}
                    </span>
                    <div className="w-36 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full bg-white/40 rounded-full transition-all duration-300 ${isPlaying ? 'w-[60%]' : 'w-0'}`} />
                    </div>
                  </div>
                </div>
                <button onClick={togglePlay}
                  className="z-10 w-12 h-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors shrink-0">
                  {isPlaying ? (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-4 bg-white/80 rounded-sm" />
                      <div className="w-1.5 h-4 bg-white/80 rounded-sm" />
                    </div>
                  ) : (
                    <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[12px] border-l-white/80 border-b-[7px] border-b-transparent ml-0.5" />
                  )}
                </button>
              </LiquidSurface>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex flex-col gap-1">
            <ParamSlider label="Bezel" value={mpBezel} onChange={setMpBezel} />
            <ParamSlider label="Thickness" value={mpIor} onChange={setMpIor} min={1} max={3} step={0.1} />
            <ParamSlider label="Scale" value={mpScale} onChange={setMpScale} min={0} max={50} step={1} />
            <ParamSlider label="Specular" value={mpSpec} onChange={setMpSpec} />
          </div>
        </section>

      </div>
    </div>
  );
}
