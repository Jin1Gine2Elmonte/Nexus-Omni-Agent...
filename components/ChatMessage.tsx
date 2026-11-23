
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message } from '../types';
import { User, Bot, BrainCircuit, Terminal, Sparkles, Copy, Check, FileText, Edit2, FileCode, FileImage, Paperclip, Eye, Network, Globe, ExternalLink, Play, Pause, Volume2, ChevronDown, ChevronUp, Aperture, Maximize2, Download, Key, AlertTriangle, Cpu, Clock, Settings, GitBranch, Award, MessageSquarePlus, Send, Layers, MoreHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getLocalEngine } from '../services/localLLMService';
import { parseOdysseyDirectives } from '../services/odysseyEngine';
import {
  createGoogleDocInWorkspace,
  createGoogleSheetInWorkspace,
  uploadFileToGoogleDrive,
  extractRowsFromTextForSheets,
  detectSmartExportProfile
} from '../services/googleWorkspaceService';

const getRoutedModelLimbLabel = (modelId: string) => {
  const mappings: Record<string, string> = {
    'auto-selection': 'التوجيه التلقائي · NEXUS Auto-Core',
    'nexus-4-neon': 'نيكسوس نيون 4 · gemini-4-neon',
    'gemini-4-neon': 'نيكسوس نيون 4 · gemini-4-neon',
    'nexus-4-pro': 'نيكسوس نيون 4 · gemini-4-neon',
    'nexus-4-carbon': 'نيكسوس كاربون 4 · gemini-4-carbon',
    'gemini-4-carbon': 'نيكسوس كاربون 4 · gemini-4-carbon',
    'nexus-4-argon': 'نيكسوس أرغون 4 · gemini-4-argon',
    'gemini-4-argon': 'نيكسوس أرغون 4 · gemini-4-argon',
    'nexus-3.1-pro': 'نيكسوس 3.1 برو · gemini-3.1-pro-preview',
    'gemini-3.1-pro-preview': 'نيكسوس 3.1 برو · gemini-3.1-pro-preview',
    'gemini-3.1-pro': 'نيكسوس 3.1 برو · gemini-3.1-pro-preview',
    'nexus-4-hydrogen': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'nexus-4-flash': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'gemini-4-hydrogen': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'nexus-3.8-flash': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'gemini-3.8-flash': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'nexus-3-flash': 'نيكسوس 3 فلاش · gemini-3-flash-preview',
    'gemini-3-flash-preview': 'نيكسوس 3 فلاش · gemini-3-flash-preview',
    'gemini-3-flash': 'نيكسوس 3 فلاش · gemini-3-flash-preview',
    'nexus-2.5-flash': 'نيكسوس 2.5 فلاش · gemini-2.5-flash',
    'gemini-2.5-flash': 'نيكسوس 2.5 فلاش · gemini-2.5-flash',
    'nexus-3.1-flash-lite': 'نيكسوس 3.1 لايت · gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite': 'نيكسوس 3.1 لايت · gemini-3.1-flash-lite',
    'pro': 'نيكسوس نيون 4 · gemini-4-neon',
    'pro-latest': 'نيكسوس نيون 4 · gemini-4-neon',
    'hyper-flash-3.5': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'flash-3.5': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'flash': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen',
    'flash-latest': 'نيكسوس هيدروجين 4 · gemini-4-hydrogen'
  };
  return mappings[modelId] || modelId || 'نيكسوس نيون 4 · gemini-4-neon';
};

export const NexusMultiModelCanvas = ({
    urls,
    prompt,
    onReady,
    onRegenerateWithAngle,
    onRefineZone,
    onToggleOdyssey,
    useOdyssey = true
}: {
    urls: string[];
    prompt?: string;
    onReady: (data: string) => void;
    onRegenerateWithAngle?: (angle: string) => void;
    onRefineZone?: (zoneLabel: string, coords: { x: number; y: number; w: number; h: number }, instruction: string) => void;
    onToggleOdyssey?: () => void;
    useOdyssey?: boolean;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [blendedUrl, setBlendedUrl] = useState<string | null>(null);
    const [isLocalMode] = useState<boolean>(false);
    const [showBlueprint, setShowBlueprint] = useState<boolean>(false);
    const [showLayerSliders, setShowLayerSliders] = useState<boolean>(false);
    const [activeZoneIdx, setActiveZoneIdx] = useState<number | null>(null);
    const [selectedZoneIdx, setSelectedZoneIdx] = useState<number | null>(null);
    const [zoneEditInstruction, setZoneEditInstruction] = useState<string>('');
    const [activePainterView, setActivePainterView] = useState<'masterpiece' | 'layer1' | 'layer2' | 'layer3' | 'compare'>('masterpiece');
    const [compareSplitPercent, setCompareSplitPercent] = useState<number>(50);

    // Parse deep structural coordinates template ("الرسام الطبقي: التأسيس، الأغراض المتراكبة، والغلاف الضوئي")
    const [zones, setZones] = useState<any[]>([]);

    // Local Simulation state
    const [simProgress, setSimProgress] = useState<number>(0);
    const [simLogs, setSimLogs] = useState<string[]>([]);
    const [isSimulating, setIsSimulating] = useState<boolean>(false);

    // Initializing weights per model layer
    const [multiModelWeights, setMultiModelWeights] = useState<Record<string, number>>(() => ({
        Flux: 1.0,   // Layer 1 & Structural Mold ("التأسيس والقالب الهيكلي")
        Turbo: 0.58, // Layer 3 Photonic Glaze & Odyssey Refraction ("الغلاف الضوئي وأوديسي")
        SD: 0.44,    // Layer 2 Object Micro-Texture & Wilderness ("الأغراض البؤرية والملمس")
        Gemini: 0.90
    }));

    const [showLayerTools, setShowLayerTools] = useState(false);

    useEffect(() => {
        setMultiModelWeights({
            Flux: 1.0,
            Turbo: 0.58,
            SD: 0.44,
            Gemini: 0.90
        });
        setActivePainterView('masterpiece');
        setSelectedZoneIdx(null);
        setShowLayerTools(false);
    }, [urls[0]]);

    useEffect(() => {
        let parsedZones: any[] = [];
        try {
            if (urls[3]) {
                const cleanJson = urls[3].trim();
                parsedZones = JSON.parse(cleanJson);
            }
        } catch (e) {
            console.warn("Unable to parse geometric coordinates, triggering default canvas template.");
        }

        if (!parsedZones || parsedZones.length === 0) {
            parsedZones = [
                {
                    id: 'LAYER1_MOLD',
                    x: 110,
                    y: 95,
                    w: 804,
                    h: 720,
                    label: "الطبقة 1 · القالب التأسيسي والمنظور (Foundation & Spatial Mold)",
                    model: "Flux",
                    layerIndex: 1,
                    weight: 0.95,
                    ior: 1.52,
                    feather: 0.30,
                    critiqueNoteAr: "تثبيت خطوط الأفق والمنظور الهندسي كقاعدة للرسم الطبقي."
                },
                {
                    id: 'LAYER2_OBJECTS',
                    x: 180,
                    y: 140,
                    w: 664,
                    h: 680,
                    label: "الطبقة 2 · بناء الأغراض البؤرية (غرض فوق غرض)",
                    model: "SD",
                    layerIndex: 2,
                    weight: 0.78,
                    ior: 1.44,
                    feather: 0.34,
                    critiqueNoteAr: "رسم الأغراض الرئيسية فوق القالب التأسيسي بتدرج شعاعي متقن."
                },
                {
                    id: 'LAYER3_GLAZE',
                    x: 220,
                    y: 110,
                    w: 584,
                    h: 540,
                    label: "الطبقة 3 · الغلاف الضوئي والمراجعة الذاتية (Photonic Glaze)",
                    model: "Turbo",
                    layerIndex: 3,
                    weight: 0.65,
                    ior: 1.33,
                    feather: 0.38,
                    critiqueNoteAr: "تعزيز الانكسار الضوئي (IOR=1.33) وإضاءة الحواف بعد معاينة الطبقتين السابقتين."
                }
            ];
        } else {
            // Normalize any fractional (0..1) coordinates to 0..1024 space
            parsedZones = parsedZones.map((z: any, idx: number) => {
                const isFractional = z.x <= 1 && z.y <= 1 && z.w <= 1 && z.h <= 1;
                return {
                    ...z,
                    id: z.id || `ZONE_${idx + 1}`,
                    x: Math.round(isFractional ? z.x * 1024 : Number(z.x) || 120),
                    y: Math.round(isFractional ? z.y * 1024 : Number(z.y) || 120),
                    w: Math.round(isFractional ? z.w * 1024 : Number(z.w) || 640),
                    h: Math.round(isFractional ? z.h * 1024 : Number(z.h) || 640),
                    layerIndex: z.layerIndex || ((idx % 3) + 1),
                    feather: Number(z.feather) || 0.32,
                    critiqueNoteAr: z.critiqueNoteAr || 'تمت معايرة هذا الغرض البصري ومطابقته مع الإضاءة المحيطة.'
                };
            });
        }
        setZones(parsedZones);
    }, [urls]);

    const renderMix = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loadImg = (src: string) => {
            return new Promise<HTMLImageElement>((resolve) => {
                if (!src) {
                    resolve(new Image());
                    return;
                }
                const img = new Image();
                if (/^https?:\/\//i.test(src)) {
                    img.crossOrigin = "anonymous";
                }
                img.onload = () => resolve(img);
                img.onerror = () => {
                    // If a remote image failed due to strict anonymous CORS, retry without crossOrigin so it still displays cleanly
                    if (/^https?:\/\//i.test(src) && img.crossOrigin) {
                        const fallbackImg = new Image();
                        fallbackImg.onload = () => resolve(fallbackImg);
                        fallbackImg.onerror = () => resolve(new Image());
                        fallbackImg.src = src;
                        return;
                    }
                    resolve(new Image());
                };
                img.src = src;
            });
        };

        try {
            const isPrimaryRealRaster = Boolean(urls[0] && !urls[0].startsWith('data:image/svg+xml'));
            const isLayer3SyntheticSvg = Boolean(urls[2] && urls[2].startsWith('data:image/svg+xml'));
            const hasDistinctRasterLayer1 = Boolean(
                urls[1] && urls[1] !== urls[0] && !urls[1].startsWith('data:image/svg+xml')
            );
            const hasDistinctRasterLayer3 = Boolean(
                urls[2] && urls[2] !== urls[0] && !isLayer3SyntheticSvg
            );

            // Preserve crystal-clear raster fidelity for authentic generated renders unless user actively blends distinct raster passes
            const isDefaultSliderState =
                Math.abs(multiModelWeights.Flux - 1.0) < 0.03 &&
                Math.abs(multiModelWeights.Turbo - 0.58) < 0.03 &&
                Math.abs(multiModelWeights.SD - 0.44) < 0.03;

            if (isPrimaryRealRaster && !hasDistinctRasterLayer3 && isDefaultSliderState) {
                setBlendedUrl(urls[0]);
                onReady(urls[0]);
                return;
            }

            const isSingleSourceGpuMode = Boolean(
                urls[0] &&
                (!urls[1] || urls[1] === urls[0] || (isPrimaryRealRaster && !hasDistinctRasterLayer1)) &&
                (!urls[2] || urls[2] === urls[0] || (isPrimaryRealRaster && isLayer3SyntheticSvg))
            );
            const [imgPrimaryObjects, imgFoundationLayer1, imgPhotonicLayer3] = isSingleSourceGpuMode
                ? await loadImg(urls[0]).then(img => [img, img, img] as [HTMLImageElement, HTMLImageElement, HTMLImageElement])
                : await Promise.all([
                      loadImg(urls[0]),
                      loadImg(urls[1] || urls[0]),
                      loadImg(urls[2] || urls[0])
                  ]);

            if (!imgPrimaryObjects.width && !imgFoundationLayer1.width && !imgPhotonicLayer3.width) {
                setBlendedUrl(urls[0]);
                onReady(urls[0]);
                return;
            }

            const width = imgPrimaryObjects.width || imgFoundationLayer1.width || imgPhotonicLayer3.width || 1024;
            const height = imgPrimaryObjects.height || imgFoundationLayer1.height || imgPhotonicLayer3.height || 1024;
            canvas.width = width;
            canvas.height = height;

            ctx.clearRect(0, 0, width, height);

            // 1. Draw Layer 1 Underpainting / Structural Base + Layer 2 Primary Objects Canvas
            if (imgFoundationLayer1.width && imgFoundationLayer1 !== imgPrimaryObjects && hasDistinctRasterLayer1) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;
                ctx.drawImage(imgFoundationLayer1, 0, 0, width, height);
                ctx.restore();
            }

            if (imgPrimaryObjects.width) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = Math.max(0.25, multiModelWeights.Flux);
                ctx.drawImage(imgPrimaryObjects, 0, 0, width, height);
                ctx.restore();
            }

            // 2. Only apply photonic/luster coordinate overlays when Layer 3 is a genuine distinct image OR in pure SVG mode
            if (!isPrimaryRealRaster || hasDistinctRasterLayer3) {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = width;
                offCanvas.height = height;
                const offCtx = offCanvas.getContext('2d');

                if (offCtx) {
                    zones.forEach((zone) => {
                        const zoneWeight = multiModelWeights[zone.model] !== undefined ? multiModelWeights[zone.model] : (zone.weight || 0.85);
                        if (zoneWeight <= 0.02) return;

                        const scaleX = width / 1024;
                        const scaleY = height / 1024;
                        const centerX = (zone.x + zone.w / 2) * scaleX;
                        const centerY = (zone.y + zone.h / 2) * scaleY;
                        const radiusX = Math.max(24, (zone.w / 2) * scaleX);
                        const radiusY = Math.max(24, (zone.h / 2) * scaleY);
                        const maxR = Math.max(radiusX, radiusY);
                        const innerR = maxR * Math.max(0.15, 1 - (zone.feather || 0.32));

                        offCtx.clearRect(0, 0, width, height);
                        offCtx.save();

                        if (zone.model === 'Turbo' && imgPhotonicLayer3.width && !isLayer3SyntheticSvg) {
                            offCtx.filter = 'blur(10px) brightness(1.08) saturate(1.22)';
                            offCtx.drawImage(imgPhotonicLayer3, 0, 0, width, height);
                        } else if (zone.model === 'SD' && imgPrimaryObjects.width) {
                            offCtx.filter = 'contrast(1.12) saturate(1.08)';
                            offCtx.drawImage(imgPrimaryObjects, 0, 0, width, height);
                        } else if (imgPrimaryObjects.width) {
                            offCtx.drawImage(imgPrimaryObjects, 0, 0, width, height);
                        }

                        offCtx.globalCompositeOperation = 'destination-in';
                        const radialMask = offCtx.createRadialGradient(centerX, centerY, innerR, centerX, centerY, maxR);
                        radialMask.addColorStop(0, 'rgba(0,0,0,1)');
                        radialMask.addColorStop(0.72, 'rgba(0,0,0,0.82)');
                        radialMask.addColorStop(1, 'rgba(0,0,0,0)');
                        offCtx.fillStyle = radialMask;
                        offCtx.fillRect(0, 0, width, height);
                        offCtx.restore();

                        ctx.save();
                        if (zone.model === 'Turbo') {
                            ctx.globalCompositeOperation = 'screen';
                            ctx.globalAlpha = zoneWeight * 0.22;
                        } else if (zone.model === 'SD') {
                            ctx.globalCompositeOperation = 'soft-light';
                            ctx.globalAlpha = zoneWeight * 0.36;
                        } else {
                            ctx.globalCompositeOperation = 'source-over';
                            ctx.globalAlpha = zoneWeight * 0.72;
                        }
                        ctx.drawImage(offCanvas, 0, 0, width, height);
                        ctx.restore();
                    });
                }

                if (imgPhotonicLayer3.width && hasDistinctRasterLayer3 && multiModelWeights.Turbo > 0.02) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.globalAlpha = multiModelWeights.Turbo * 0.18;
                    ctx.filter = 'blur(12px) brightness(1.08) saturate(1.22)';
                    ctx.drawImage(imgPhotonicLayer3, 0, 0, width, height);
                    ctx.restore();
                }
            }

            let finalUrl = urls[0];
            try {
                finalUrl = canvas.toDataURL('image/png', 0.95);
            } catch {
                finalUrl = urls[0];
            }
            setBlendedUrl(finalUrl);
            onReady(finalUrl);
        } catch (e) {
            console.warn("Master coordinate synthesis fallback:", e);
            setBlendedUrl(urls[0]);
            onReady(urls[0]);
        }
    };

    useEffect(() => {
        renderMix();
    }, [urls, zones, multiModelWeights, isLocalMode]);

    // Check for real local engine WebGPU availability
    const [localWebGPUEngineActive, setLocalWebGPUEngineActive] = useState<boolean>(false);

    const runMathOscillatorSimulation = async () => {
        setSimProgress(15);
        for (let step = 1; step <= 10; step++) {
            const progress = 15 + step * 8;
            setSimProgress(progress);
            const timeOffset = Date.now() / 1000;
            const updatedHarmonicZones = [
                {
                    x: Math.round(128 + Math.sin(timeOffset) * 40),
                    y: Math.round(128 + Math.cos(timeOffset) * 20),
                    w: 700,
                    h: 700,
                    label: "الطبقة 1 · القالب الهيكلي (Flux)",
                    model: "Flux",
                    layerIndex: 1,
                    weight: 0.90 + Math.sin(timeOffset) * 0.05
                },
                {
                    x: Math.round(50 + Math.cos(timeOffset * 1.5) * 30),
                    y: Math.round(100 + Math.sin(timeOffset * 0.8) * 40),
                    w: 900,
                    h: 800,
                    label: "الطبقة 2 · الأغراض المتراكبة (SD)",
                    model: "SD",
                    layerIndex: 2,
                    weight: 0.65 + Math.cos(timeOffset * 1.1) * 0.1
                },
                {
                    x: Math.round(256 - Math.sin(timeOffset * 2.0) * 50),
                    y: Math.round(128 + Math.sin(timeOffset * 0.5) * 30),
                    w: 512,
                    h: 768,
                    label: "الطبقة 3 · الغلاف الضوئي (Turbo)",
                    model: "Turbo",
                    layerIndex: 3,
                    weight: 0.50 + Math.sin(timeOffset) * 0.15
                }
            ];
            setZones(updatedHarmonicZones);
            setSimLogs(prev => [
                ...prev,
                `[MATH FRAME ${step}]: Re-calculated Rayleigh bounds. Flux_X: ${updatedHarmonicZones[0].x}px`
            ]);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        setSimProgress(100);
    };

    const displayedArtifactUrl = useMemo(() => {
        if (activePainterView === 'layer1') return urls[1] || urls[0] || blendedUrl;
        if (activePainterView === 'layer2') return urls[0] || blendedUrl;
        if (activePainterView === 'layer3') return urls[2] || urls[0] || blendedUrl;
        return blendedUrl || urls[0];
    }, [activePainterView, urls, blendedUrl]);

    const selectedZone = selectedZoneIdx !== null && zones[selectedZoneIdx] ? zones[selectedZoneIdx] : null;

    return (
        <div ref={containerRef} className="relative w-full bg-zinc-950 overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
            {/* Embedded Drawing Canvas (Hidden, used for merging) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Optional Collapsible Painter Layer & Evolution Switcher Bar */}
            {showLayerTools && (
              <div className="w-full bg-zinc-950/95 border-b border-zinc-800/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[10px]" dir="rtl">
                  <div className="flex items-center gap-1 text-emerald-300 font-medium">
                      <Layers size={12} className="text-emerald-400 shrink-0" />
                      <span>الطبقات البصرية:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                      {[
                          { id: 'masterpiece', label: 'اللوحة المدمجة' },
                          { id: 'layer1', label: 'الطبقة 1: التأسيس' },
                          { id: 'layer2', label: 'الطبقة 2: الأغراض' },
                          { id: 'layer3', label: 'الطبقة 3: الإضاءة' },
                          { id: 'compare', label: 'مقارنة' }
                      ].map(tab => (
                          <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActivePainterView(tab.id as any)}
                              className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                  activePainterView === tab.id
                                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 font-bold'
                                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                              }`}
                          >
                              {tab.label}
                          </button>
                      ))}
                  </div>
              </div>
            )}

            {/* Viewport Box */}
            <div className="w-full relative bg-black flex items-center justify-center">
                {isLocalMode && isSimulating ? (
                    <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] animate-[pulse_3s_infinite]" />
                        <Aperture className="text-emerald-500 animate-spin mb-4" size={32} />
                        <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                            {localWebGPUEngineActive ? "ACTIVE WEBGPU DEEP COORDINATOR" : "Harmonic Wave Shader Coordinator"}
                        </span>
                        <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden mt-3 mb-2">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${simProgress}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">{simProgress}% loaded</span>
                        <div className="mt-4 w-full max-w-[340px] h-28 overflow-y-auto text-left font-mono text-[8px] text-zinc-400 bg-black/60 border border-zinc-800 p-2 rounded custom-scrollbar">
                            {simLogs.map((log, idx) => (
                                <div key={idx} className="truncate text-emerald-500/80">❯ {log}</div>
                            ))}
                        </div>
                    </div>
                ) : displayedArtifactUrl ? (
                    <div className="relative w-full h-full">
                        {activePainterView === 'compare' ? (
                            <div className="relative w-full overflow-hidden select-none">
                                <img
                                    src={blendedUrl || urls[0]}
                                    alt="Final Masterpiece"
                                    className="w-full h-full object-contain mx-auto block"
                                />
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ clipPath: `inset(0 ${100 - compareSplitPercent}% 0 0)` }}
                                >
                                    <img
                                        src={urls[1] || urls[0]}
                                        alt="Layer 1 Foundation"
                                        className="w-full h-full object-contain mx-auto block"
                                    />
                                </div>
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981] pointer-events-none"
                                    style={{ left: `${compareSplitPercent}%` }}
                                />
                                <div className="absolute bottom-3 inset-x-6 flex items-center gap-3 bg-black/80 border border-zinc-800 rounded-lg px-3 py-1.5 backdrop-blur-md" dir="rtl">
                                    <span className="text-[10px] text-emerald-300 shrink-0">الطبقة 1 (القالب الأولي)</span>
                                    <input
                                        type="range"
                                        min="5"
                                        max="95"
                                        value={compareSplitPercent}
                                        onChange={e => setCompareSplitPercent(Number(e.target.value))}
                                        className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                                    />
                                    <span className="text-[10px] text-amber-300 shrink-0">اللوحة المدمجة النهائية</span>
                                </div>
                            </div>
                        ) : (
                            <img src={displayedArtifactUrl} alt="Blended Master Artifact" className="w-full h-full object-contain mx-auto" />
                        )}

                        {/* Active Layer Badge Overlay when inspecting individual layers */}
                        {activePainterView !== 'masterpiece' && activePainterView !== 'compare' && (
                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/85 border border-emerald-500/50 text-[10px] text-emerald-300 backdrop-blur-md" dir="rtl">
                                {activePainterView === 'layer1' && 'الطبقة 1: القالب الهندسي والتأسيس الخلفي (Underpainting & Spatial Mold)'}
                                {activePainterView === 'layer2' && 'الطبقة 2: رسم الأغراض والعناصر البؤرية (Object-over-Object Layer)'}
                                {activePainterView === 'layer3' && 'الطبقة 3: الغلاف الضوئي والانكسار الفوتوني (Photonic Glaze & Self-Critique)'}
                            </div>
                        )}

                        {/* BluePrint Overlay ("كاشف القالب والإحداثيات والأغراض") */}
                        {showBlueprint && !isLocalMode && (
                            <div className="absolute inset-0 pointer-events-none">
                                <svg viewBox="0 0 1024 1024" className="w-full h-full absolute inset-0">
                                    {zones.map((zone, idx) => {
                                        const isHovered = activeZoneIdx === idx || selectedZoneIdx === idx;
                                        const layerColor =
                                            zone.layerIndex === 1
                                                ? 'rgba(16, 185, 129, 0.85)'
                                                : zone.layerIndex === 2
                                                ? 'rgba(56, 189, 248, 0.85)'
                                                : 'rgba(245, 158, 11, 0.85)';
                                        return (
                                            <g key={idx}>
                                                <rect
                                                    x={zone.x}
                                                    y={zone.y}
                                                    width={zone.w}
                                                    height={zone.h}
                                                    rx="14"
                                                    fill={isHovered ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.02)"}
                                                    stroke={isHovered ? "rgba(236, 72, 153, 0.95)" : layerColor}
                                                    strokeWidth={isHovered ? "3.5" : "1.8"}
                                                    strokeDasharray={isHovered ? "none" : "6 4"}
                                                    className="transition-all duration-300"
                                                />
                                                <line x1={zone.x} y1={zone.y} x2={zone.x + 14} y2={zone.y} stroke={layerColor} strokeWidth="2.5" />
                                                <line x1={zone.x} y1={zone.y} x2={zone.x} y2={zone.y + 14} stroke={layerColor} strokeWidth="2.5" />
                                                <foreignObject
                                                    x={Math.max(8, Math.min(610, zone.x + 8))}
                                                    y={Math.max(8, Math.min(950, zone.y + 8))}
                                                    width="400"
                                                    height="54"
                                                    className="pointer-events-auto"
                                                >
                                                    <div
                                                        onMouseEnter={() => setActiveZoneIdx(idx)}
                                                        onMouseLeave={() => setActiveZoneIdx(null)}
                                                        onClick={() => setSelectedZoneIdx(prev => (prev === idx ? null : idx))}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/90 border text-[9px] font-mono tracking-wider backdrop-blur-md cursor-pointer transition-all ${
                                                            isHovered
                                                                ? 'border-pink-500 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.45)]'
                                                                : 'border-emerald-500/45 text-emerald-300'
                                                        }`}
                                                        title="اضغط لعرض مراجعة الرسام لهذا الغرض أو تعديله جراحياً"
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-pink-500' : 'bg-emerald-400'}`} />
                                                        <span>
                                                            {zone.label} · [X:{zone.x},Y:{zone.y}]
                                                            {zone.ior ? ` · IOR:${zone.ior}` : ''}
                                                        </span>
                                                    </div>
                                                </foreignObject>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-emerald-400 font-mono text-[10px] gap-4 py-20 min-h-[300px] animate-pulse">
                        <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce shadow-[0_0_8px_#ec4899]"></div>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce shadow-[0_0_8px_#a855f7]" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce shadow-[0_0_8px_#10b981]" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span>جاري صهر الطبقات الإحداثية الثلاث ومراجعتها البصرية...</span>
                    </div>
                )}
            </div>

            {/* Selected Coordinate Zone Critique & Surgical Object Refinement Panel */}
            {selectedZone && showBlueprint && (
                <div className="w-full bg-zinc-900/95 border-t border-pink-500/40 px-3.5 py-2.5 flex flex-col gap-2 text-[11px]" dir="rtl">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-pink-200 font-bold">
                            <Sparkles size={13} className="text-pink-400 shrink-0" />
                            <span>{selectedZone.label}</span>
                            <span className="px-1.5 py-0.5 rounded bg-black/60 border border-zinc-800 text-[9px] font-mono text-zinc-400">
                                الطبقة {selectedZone.layerIndex || 2} · [{selectedZone.x}, {selectedZone.y}, {selectedZone.w}×{selectedZone.h}] · IOR={selectedZone.ior || 1.42}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedZoneIdx(null)}
                            className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                        >
                            إغلاق ✕
                        </button>
                    </div>
                    {selectedZone.critiqueNoteAr && (
                        <p className="text-[11px] text-zinc-300 m-0 leading-relaxed bg-black/40 border border-zinc-800/80 rounded-lg px-2.5 py-1.5">
                            <span className="text-emerald-400 font-bold">ملاحظة الرسام الذاتية: </span>
                            {selectedZone.critiqueNoteAr}
                        </p>
                    )}
                    {onRefineZone && (
                        <div className="flex items-center gap-2 pt-0.5">
                            <input
                                type="text"
                                value={zoneEditInstruction}
                                onChange={e => setZoneEditInstruction(e.target.value)}
                                placeholder="اطلب تعديل هذا الغرض أو الطبقة في هذا الإحداثي (مثال: أضف تفاصيل ذهبية أو عدّل الإضاءة هنا)..."
                                className="flex-1 bg-black/70 border border-zinc-800 focus:border-emerald-500/60 rounded-lg px-2.5 py-1 text-[11px] text-zinc-100 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (!zoneEditInstruction.trim()) return;
                                    onRefineZone(
                                        selectedZone.label,
                                        { x: selectedZone.x, y: selectedZone.y, w: selectedZone.w, h: selectedZone.h },
                                        zoneEditInstruction.trim()
                                    );
                                    setZoneEditInstruction('');
                                }}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition cursor-pointer shrink-0"
                            >
                                تعديل هذا الغرض
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Compact Toggle + Collapsible Layered Studio Controls */}
            <div className="w-full bg-zinc-950/95 border-t border-zinc-800/80 px-3 py-1.5 flex flex-col gap-2 text-[11px]" dir="rtl">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowLayerTools(prev => !prev)}
                  className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Layers size={11} className="text-emerald-400" />
                  <span>{showLayerTools ? 'إخفاء أدوات الطبقات' : 'أدوات الطبقات'}</span>
                </button>
                {onRegenerateWithAngle && !showLayerTools && (
                  <span className="text-[10px] text-zinc-500">عرض صافي للّوحة</span>
                )}
              </div>

              {showLayerTools && (
                <div className="pt-1.5 border-t border-zinc-800/70 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                setShowBlueprint(prev => !prev);
                                if (!showBlueprint && selectedZoneIdx === null) {
                                    setSelectedZoneIdx(0);
                                }
                            }}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                showBlueprint
                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                        >
                            <Eye size={12} className="text-emerald-400" />
                            <span>{showBlueprint ? 'إخفاء القالب' : 'تعديل الأغراض بالإحداثيات'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowLayerSliders(prev => !prev)}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                showLayerSliders
                                    ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                        >
                            <Settings size={11} className="text-purple-400" />
                            <span>أوزان الطبقات</span>
                        </button>

                        {onToggleOdyssey && (
                            <button
                                type="button"
                                onClick={onToggleOdyssey}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                                    useOdyssey
                                        ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300'
                                        : 'bg-amber-950/35 border-amber-500/40 text-amber-300'
                                }`}
                            >
                                <Sparkles size={11} />
                                <span>{useOdyssey ? 'التوليد الطبقي: مفعّل' : 'التوليد المباشر'}</span>
                            </button>
                        )}
                    </div>

                    {onRegenerateWithAngle && (
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-zinc-500 ml-1">زاوية:</span>
                            {[
                                { id: 'low_angle', label: 'منخفضة' },
                                { id: 'birds_eye', label: 'علوية' },
                                { id: 'macro_closeup', label: 'مقربة Macro' },
                                { id: 'wide_isometric', label: 'واسعة 3D' }
                            ].map(ang => (
                                <button
                                    key={ang.id}
                                    type="button"
                                    onClick={() => onRegenerateWithAngle(ang.id)}
                                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/40 text-[10px] text-zinc-300 hover:text-emerald-300 transition cursor-pointer"
                                >
                                    {ang.label}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>

                  {showLayerSliders && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800/80 bg-black/40 p-2 rounded-lg">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-emerald-300">الطبقة 1 · الأساس</span>
                                <span className="font-mono text-zinc-400">{Math.round(multiModelWeights.Flux * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={multiModelWeights.Flux}
                                onChange={e => setMultiModelWeights(prev => ({ ...prev, Flux: parseFloat(e.target.value) }))}
                                className="accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-purple-300">الطبقة 2 · الأغراض</span>
                                <span className="font-mono text-zinc-400">{Math.round(multiModelWeights.SD * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={multiModelWeights.SD}
                                onChange={e => setMultiModelWeights(prev => ({ ...prev, SD: parseFloat(e.target.value) }))}
                                className="accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-sky-300">الطبقة 3 · الإضاءة</span>
                                <span className="font-mono text-zinc-400">{Math.round(multiModelWeights.Turbo * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={multiModelWeights.Turbo}
                                onChange={e => setMultiModelWeights(prev => ({ ...prev, Turbo: parseFloat(e.target.value) }))}
                                className="accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
    );
};

export const KineticLiveSpinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <span
    className="relative inline-flex items-center justify-center shrink-0"
    style={{ width: size, height: size }}
  >
    <span className="absolute inset-0 rounded-full border border-emerald-400/35 animate-ping" />
    <svg
      className="w-full h-full animate-spin text-emerald-400"
      style={{ animationDuration: '1.1s' }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeDasharray="34 26"
      />
    </svg>
    <svg
      className="absolute inset-0.5 w-[calc(100%-4px)] h-[calc(100%-4px)] text-teal-300"
      style={{ animation: 'spin 1.7s linear infinite reverse' }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="5.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="14 22"
      />
    </svg>
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
  </span>
);

export const CompletedGreenCheckCircle: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <span
    className="inline-flex items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/75 text-emerald-400 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-300"
    style={{ width: size, height: size }}
    title="مكتمل"
  >
    <Check size={Math.max(9, size - 6)} strokeWidth={3} className="text-emerald-400" />
  </span>
);

interface ChatMessageProps {
  message: Message;
  onEdit?: (content: string) => void;
  onViewMindMap?: (content: string) => void;
  onPlayAudio?: (messageId: string, content: string, base64?: string) => void;
  isPlaying?: boolean;
  onRunInTerminal?: (code: string, lang: string) => void;
  keepThinkingExpanded?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  onRegenerateImage?: (prompt: string, options?: { cameraAngle?: string; useOdyssey?: boolean }) => void;
  onOpenImageInStudio?: (prompt: string, imageDataUrl?: string) => void;
  onCorrectMessage?: (messageId: string, originalExcerpt: string, correctionRule: string) => void;
  onOpenInCanvasStudio?: (content: string, imageBase64?: string, targetTab?: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({
  message,
  onEdit,
  onViewMindMap,
  onPlayAudio,
  isPlaying,
  onRunInTerminal,
  keepThinkingExpanded = false,
  fontSize = 'medium',
  onRegenerateImage,
  onOpenImageInStudio,
  onCorrectMessage,
  onOpenInCanvasStudio
}) => {
  const isUser = message.role === 'user';
  const [showRecursiveLabDetails, setShowRecursiveLabDetails] = useState(false);
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionSavedBadge, setCorrectionSavedBadge] = useState(false);
  const [workspaceLinkInfo, setWorkspaceLinkInfo] = useState<{ label: string; url: string } | null>(null);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  
  const [terminalBuildState, setTerminalBuildState] = useState<{
    loading: boolean;
    terminalLog?: string;
    downloadUrl?: string;
    filename?: string;
    blueprint?: {
      words?: number;
      lines?: number;
      readingMinutes?: number;
      headings?: Array<{ level: number; title: string; line: number }>;
      tablesLines?: number;
      codeBlocks?: number;
      sha256?: string;
      recommendedTheme?: string;
    };
  }>({ loading: false });
  const [isGeneratingPdfBinary, setIsGeneratingPdfBinary] = useState(false);
  const [selectedPdfTheme, setSelectedPdfTheme] = useState<'sovereign_executive' | 'royal_literary' | 'scientific_academic'>('sovereign_executive');
  const [pdfPreviewPages, setPdfPreviewPages] = useState<string[]>([]);
  const [showPdfReaderModal, setShowPdfReaderModal] = useState(false);
  const [activePdfPageIdx, setActivePdfPageIdx] = useState(0);
  const [showPdfChapterOutline, setShowPdfChapterOutline] = useState(false);
  const autoCompiledArtifactRef = useRef<boolean>(false);

  const { sanitizedText, canvasEnvelope, fileArtifactEnvelope, generatedArtifactsList, legacyVisualPrompt } = useMemo(() => {
    if (isUser) {
      return {
        sanitizedText: message.content,
        canvasEnvelope: null as null | {
          title: string;
          type: 'document' | 'code';
          canvasBody: string;
          isClosed: boolean;
        },
        fileArtifactEnvelope: null as null | {
          filename: string;
          format: string;
          title: string;
          subtitle?: string;
          theme?: 'sovereign_executive' | 'royal_literary' | 'scientific_academic';
          layout?: 'tactical_manual' | 'literary_novel' | 'scientific_blueprint' | 'executive_dossier';
          primaryColor?: string;
          accentColor?: string;
          bgColor?: string;
          coverStyle?: string;
          diagramNodes?: string;
          customSeal?: string;
          terminalCmd?: string;
          artifactBody: string;
        },
        generatedArtifactsList: [] as Array<{
          filename: string;
          sizeBytes: number;
          mimeType: string;
          category: string;
          downloadUrl: string;
          streamUrl: string;
        }>,
        legacyVisualPrompt: null as string | null
      };
    }
    let workingText = parseOdysseyDirectives(message.content).sanitizedText;
    // Strip any <think>...</think> blocks and Void-Space internal calibration headers from surface message.content
    workingText = workingText
      .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
      .replace(/<thought>[\s\S]*?(?:<\/thought>|$)/gi, '')
      .replace(/\[معايرة حسابية حية:[^\n]*\]?:?/g, '')
      .replace(/^\s*\]:?\s*$/gm, '')
      .replace(/^\s*\]:\s*/gm, '')
      .replace(/•\s*\[(?:طور\s+\d+\/\d+|HUMAN-INTENT|KHORA-01|THE OMNI-LAYER|SIGIL-31|MORPHOGENETIC|9 ONTOLOGICAL)[^\n]*\n?/g, '')
      .replace(/\[[█░]{4,}\]\s*\d+%\s*—?[^\n]*/g, '')
      .replace(/(?:تحديثات التقدم|Progress Tracker)[\s\S]*?(?=\n\n|\n[#*•]|$)/gi, '')
      .replace(/(?:^|\n)\s*(?:\*\*)?(?:المحرك الحسي|المحرك الزمني|محرك اللاوعي|المحرك الاجتماعي|المحرك الوجودي)\s*\((?:Sensory|Temporal|Subconscious|Social|Existential)\s+Engine\)(?:\*\*)?:?\s*/gi, '\n\n')
      .trim();

    let extractedLegacyVisualPrompt: string | null = null;
    workingText = workingText
      .replace(
        /<?\s*(?:nexus_visual_artifact|generate_visual_artifact)\b([^>]*?)(?:\/>|>\s*<\/\s*(?:nexus_visual_artifact|generate_visual_artifact)\s*>|>)/gi,
        (_full, attrsRaw) => {
          const pMatch = String(attrsRaw || '').match(/prompt\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
          if (pMatch?.[1] || pMatch?.[2]) {
            extractedLegacyVisualPrompt = (pMatch[1] || pMatch[2]).trim();
          }
          return '';
        }
      )
      .replace(
        /<?\s*(?:nexus_visual_artifact|generate_visual_artifact)\s+prompt\s*=\s*"([^"]+)"[^\n]*(?:\/?>|<\/)?/gi,
        (_full, pVal) => {
          if (pVal && !extractedLegacyVisualPrompt) {
            extractedLegacyVisualPrompt = String(pVal).trim();
          }
          return '';
        }
      )
      .trim();

    // 0. Parse <nexus_generated_artifacts>[...]</nexus_generated_artifacts> emitted by Sovereign Terminal Execution
    const parsedGeneratedArtifacts: Array<{
      filename: string;
      sizeBytes: number;
      mimeType: string;
      category: string;
      downloadUrl: string;
      streamUrl: string;
    }> = [];
    const genArtRegex = /<nexus_generated_artifacts>([\s\S]*?)<\/nexus_generated_artifacts>/gi;
    workingText = workingText.replace(genArtRegex, (_full, jsonBody) => {
      try {
        const arr = JSON.parse(String(jsonBody || '[]').trim());
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (item && item.filename && item.downloadUrl) {
              parsedGeneratedArtifacts.push({
                filename: String(item.filename),
                sizeBytes: Number(item.sizeBytes || 0),
                mimeType: String(item.mimeType || 'application/octet-stream'),
                category: String(item.category || 'binary'),
                downloadUrl: String(item.downloadUrl),
                streamUrl: String(item.streamUrl || item.downloadUrl)
              });
            }
          }
        }
      } catch {
        // Ignore malformed JSON during streaming
      }
      return '';
    }).trim();

    // 1. Parse <nexus_file_artifact ...>...</nexus_file_artifact> with strict separation between Chat Message and Standalone Book
    let parsedFileArtifact: null | {
      filename: string;
      format: string;
      title: string;
      subtitle?: string;
      theme?: 'sovereign_executive' | 'royal_literary' | 'scientific_academic';
      layout?: 'tactical_manual' | 'literary_novel' | 'scientific_blueprint' | 'executive_dossier';
      primaryColor?: string;
      accentColor?: string;
      bgColor?: string;
      coverStyle?: string;
      diagramNodes?: string;
      customSeal?: string;
      terminalCmd?: string;
      artifactBody: string;
    } = null;

    const fileTagRegex = /<nexus_file_artifact([^>]*)>([\s\S]*?)(?:<\/nexus_file_artifact>|$)/i;
    const fileMatch = workingText.match(fileTagRegex);
    if (fileMatch) {
      const attrs = fileMatch[1] || '';
      const innerBody = (fileMatch[2] || '').trim();
      const fnMatch = attrs.match(/filename="([^"]*)"/i);
      const fmtMatch = attrs.match(/format="([^"]*)"/i);
      const titleMatch = attrs.match(/title="([^"]*)"/i);
      const subtitleMatch = attrs.match(/subtitle="([^"]*)"/i);
      const themeMatch = attrs.match(/theme="([^"]*)"/i);
      const layoutMatch = attrs.match(/layout="([^"]*)"/i);
      const primaryColorMatch = attrs.match(/primary_color="([^"]*)"/i);
      const accentColorMatch = attrs.match(/accent_color="([^"]*)"/i);
      const bgColorMatch = attrs.match(/bg_color="([^"]*)"/i);
      const coverStyleMatch = attrs.match(/cover_style="([^"]*)"/i);
      const diagramNodesMatch = attrs.match(/diagram_nodes="([^"]*)"/i);
      const customSealMatch = attrs.match(/custom_seal="([^"]*)"/i);
      const cmdMatch = attrs.match(/terminal_cmd="([^"]*)"/i);

      const textOutsideFileTag = workingText.replace(fileTagRegex, '').trim();
      const extractCleanChaptersFromXml = (rawXmlSource: string): string => {
        const chapterMatches = Array.from(
          rawXmlSource.matchAll(/<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
        );
        const proseChapters = chapterMatches
          .filter(m => !/\.(html|css|js|ts|sql)$/i.test(m[1] || ''))
          .map(m => {
            const fTitle = m[1]?.match(/title="([^"]*)"/i)?.[1]?.trim() || '';
            const fContent = (m[2] || '').trim();
            return fTitle && !fContent.startsWith('#') ? `# ${fTitle}\n\n${fContent}` : fContent;
          })
          .filter(Boolean);

        const stripped = rawXmlSource
          .replace(/<nexus_canvas\b[^>]*>/gi, '')
          .replace(/<\/nexus_canvas>/gi, '')
          .replace(/<nexus_file\b[^>]*>[\s\S]*?<\/nexus_file>/gi, '')
          .trim();

        return [stripped, ...proseChapters].filter(Boolean).join('\n\n').trim();
      };

      const cleanInnerManuscript = extractCleanChaptersFromXml(innerBody);
      const cleanOutsideChapters = Array.from(
        textOutsideFileTag.matchAll(/<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
      )
        .filter(m => !/\.(html|css|js|ts|sql)$/i.test(m[1] || ''))
        .map(m => {
          const fTitle = m[1]?.match(/title="([^"]*)"/i)?.[1]?.trim() || '';
          const fContent = (m[2] || '').trim();
          return fTitle && !fContent.startsWith('#') ? `# ${fTitle}\n\n${fContent}` : fContent;
        })
        .filter(Boolean)
        .join('\n\n');

      // Standalone Book Manuscript inside the PDF/File is strictly the inner artifact + any book chapters, NEVER the conversational chat intro!
      const standaloneBookManuscript =
        [cleanInnerManuscript, cleanOutsideChapters].filter(Boolean).join('\n\n').trim() || innerBody;

      // Conversational Chat Bubble is strictly the text outside <nexus_file_artifact>.
      // If the model placed 100% of its text inside <nexus_file_artifact>, synthesize a concise conversational executive guide for the chat bubble so the chat and PDF are never identical!
      if (textOutsideFileTag.length >= 45) {
        workingText = textOutsideFileTag;
      } else {
        const extractedHeadings = Array.from(standaloneBookManuscript.matchAll(/^#{1,2}\s+(.+)$/gm))
          .map(m => m[1].replace(/[*#]/g, '').trim())
          .filter(Boolean)
          .slice(0, 8);
        const totalBookWords = standaloneBookManuscript.split(/\s+/).filter(Boolean).length;
        const estBookPages = Math.max(1, Math.ceil(totalBookWords / 210));
        const resolvedDocTitle = titleMatch?.[1]?.trim() || 'المصنف المستقل المعماري';
        workingText = [
          `أعددتُ لك مصنفاً مستقلاً ومتكاملاً بعنوان **«${resolvedDocTitle}»** (يضم نحو **${totalBookWords} كلمة** موزعة على **~${estBookPages} صفحات** مصممة بصرياً)، وهو مفصول كلياً عن هذه الرسالة الحوارية وجاهز للمعاينة الحية والتحميل المباشر:`,
          extractedHeadings.length > 0
            ? `\n### الخريطة المعمارية للفصول داخل الملف المستقل:\n${extractedHeadings.map((h, idx) => `${idx + 1}. **${h}**`).join('\n')}`
            : ''
        ]
          .filter(Boolean)
          .join('\n');
      }

      const rawTheme = (themeMatch?.[1]?.trim() || '').toLowerCase();
      const rawLayout = (layoutMatch?.[1]?.trim() || '').toLowerCase();
      const isTacticalContent = /شطرنج|تكتيك|ميداني|تدريب|خطة|مناورة|افتتاحية|دفاع|هجوم|[♔♕♖♗♘♙♚♛♜♝♞♟]/.test(
        standaloneBookManuscript
      );
      const isLiteraryContent = /رواية|الفصل|مشهد|حكاية|قصيدة|رحلة|سرد/.test(standaloneBookManuscript);
      const isScientificContent = /```|خوارزمية|معادلة|برمجة|كود|بروتوكول|هندسة/.test(standaloneBookManuscript);

      const resolvedTheme: 'sovereign_executive' | 'royal_literary' | 'scientific_academic' =
        rawTheme === 'royal_literary' || rawTheme === 'literary'
          ? 'royal_literary'
          : rawTheme === 'scientific_academic' || rawTheme === 'scientific' || rawTheme === 'academic'
          ? 'scientific_academic'
          : isLiteraryContent && !isTacticalContent
          ? 'royal_literary'
          : isScientificContent
          ? 'scientific_academic'
          : 'sovereign_executive';

      const resolvedLayout: 'tactical_manual' | 'literary_novel' | 'scientific_blueprint' | 'executive_dossier' =
        rawLayout === 'tactical_manual' ||
        rawLayout === 'literary_novel' ||
        rawLayout === 'scientific_blueprint' ||
        rawLayout === 'executive_dossier'
          ? (rawLayout as any)
          : isTacticalContent
          ? 'tactical_manual'
          : resolvedTheme === 'royal_literary'
          ? 'literary_novel'
          : resolvedTheme === 'scientific_academic'
          ? 'scientific_blueprint'
          : 'executive_dossier';

      parsedFileArtifact = {
        filename: fnMatch?.[1]?.trim() || 'nexus_standalone_book.pdf',
        format: (fmtMatch?.[1]?.trim() || 'pdf').toLowerCase(),
        title: titleMatch?.[1]?.trim() || 'المصنف السيادي المستقل',
        subtitle: subtitleMatch?.[1]?.trim(),
        theme: resolvedTheme,
        layout: resolvedLayout,
        primaryColor: primaryColorMatch?.[1]?.trim(),
        accentColor: accentColorMatch?.[1]?.trim(),
        bgColor: bgColorMatch?.[1]?.trim(),
        coverStyle: coverStyleMatch?.[1]?.trim(),
        diagramNodes: diagramNodesMatch?.[1]?.trim(),
        customSeal: customSealMatch?.[1]?.trim(),
        terminalCmd: cmdMatch?.[1]?.trim(),
        artifactBody: standaloneBookManuscript
      };
    }

    const openMatch = workingText.match(/<nexus_canvas\b([^>]*)>/i);
    if (!openMatch || openMatch.index === undefined) {
      // Check if standalone <nexus_file> blocks exist without an outer <nexus_canvas> wrapper
      const standaloneFiles = Array.from(
        workingText.matchAll(/<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
      );
      if (standaloneFiles.length > 0) {
        const firstFileIdx = workingText.search(/<nexus_file\b/i);
        const beforeFiles = firstFileIdx > 0 ? workingText.slice(0, firstFileIdx).trim() : '';
        const reconstructedCanvasBody = standaloneFiles.map(m => m[0]).join('\n\n');
        const strippedChatText = workingText.replace(/<nexus_file\b[^>]*>[\s\S]*?<\/nexus_file>/gi, '').trim();
        return {
          sanitizedText: strippedChatText || beforeFiles || 'تم بناء الملفات والفصول الكاملة في مرسم الكانفاس الحي:',
          canvasEnvelope: {
            title: standaloneFiles[0]?.[1]?.match(/title="([^"]*)"/i)?.[1]?.trim() || 'وثيقة ومشروع الكانفاس الموسّع',
            type: standaloneFiles.some(m => /(?:language|lang)="(?:python|javascript|typescript|html|css|sql)"/i.test(m[1] || ''))
              ? 'code'
              : 'document',
            canvasBody: reconstructedCanvasBody,
            isClosed: true
          },
          fileArtifactEnvelope: parsedFileArtifact,
          generatedArtifactsList: parsedGeneratedArtifacts,
          legacyVisualPrompt: extractedLegacyVisualPrompt
        };
      }

      // Check if message has multiple explicit chapter sections (e.g., "### 📄 الفصل الأول ... (`chapters/chapter_01.md`)")
      const chapterSplits = workingText.split(/\n(?=#{2,3}\s*(?:📄|📑)?\s*الفصل\s+)/g);
      if (chapterSplits.length >= 3) {
        const synthesizedFiles = chapterSplits.map((sec, idx) => {
          const cleanSec = sec.trim();
          const firstLine = cleanSec.split('\n')[0]?.replace(/^#{1,4}\s*(?:📄|📑)?\s*/, '').trim() || `القسم ${idx + 1}`;
          const pathHint = firstLine.match(/\(`?([a-zA-Z0-9_./-]+\.[a-z0-9]+)`?\)/i)?.[1] || (idx === 0 ? 'codex/world_laws.md' : `chapters/chapter_0${idx}.md`);
          const cleanTitle = firstLine.replace(/\s*\(`?[a-zA-Z0-9_./-]+\.[a-z0-9]+`?\)/i, '').trim();
          return `<nexus_file path="${pathHint}" title="${cleanTitle}" language="markdown">\n${cleanSec}\n</nexus_file>`;
        });
        return {
          sanitizedText: workingText,
          canvasEnvelope: {
            title: 'المصنف الروائي والفصول الكاملة في مرسم نيكسوس',
            type: 'document',
            canvasBody: synthesizedFiles.join('\n\n'),
            isClosed: true
          },
          fileArtifactEnvelope: parsedFileArtifact,
          generatedArtifactsList: parsedGeneratedArtifacts,
          legacyVisualPrompt: extractedLegacyVisualPrompt
        };
      }

      return {
        sanitizedText: workingText,
        canvasEnvelope: null,
        fileArtifactEnvelope: parsedFileArtifact,
        generatedArtifactsList: parsedGeneratedArtifacts,
        legacyVisualPrompt: extractedLegacyVisualPrompt
      };
    }

    const rawCanvasAttrs = openMatch[1] || '';
    const canvasTitleAttr = rawCanvasAttrs.match(/title="([^"]*)"/i)?.[1]?.trim();
    const canvasTypeAttr = rawCanvasAttrs.match(/type="([^"]*)"/i)?.[1]?.trim();

    const beforeTag = workingText.slice(0, openMatch.index).trim();
    const afterOpen = workingText.slice(openMatch.index + openMatch[0].length);
    const closeIdx = afterOpen.search(/<\/nexus_canvas>/i);
    const isClosed = closeIdx !== -1;
    const canvasBody = (isClosed ? afterOpen.slice(0, closeIdx) : afterOpen).trim();
    const afterClose = isClosed ? afterOpen.slice(closeIdx + '</nexus_canvas>'.length).trim() : '';

    // Build a clean executive summary of <nexus_file> items for the chat bubble if beforeTag is empty,
    // while keeping the FULL multi-file content inside canvasEnvelope.canvasBody for NexusCanvasStudioModal!
    const fileMatchesInCanvas = Array.from(
      canvasBody.matchAll(/<nexus_file([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
    );
    const canvasFilesSummaryMd =
      fileMatchesInCanvas.length > 0 && !beforeTag
        ? [
            `تم بناء وتجسيد **${fileMatchesInCanvas.length} ملفات/فصول كاملة** داخل **مرسم الوكيل السائل (Canvas Studio)**:`,
            ...fileMatchesInCanvas.map(m => {
              const attrs = String(m[1] || '');
              const p = attrs.match(/path="([^"]*)"/i)?.[1]?.trim() || 'file.md';
              const t = attrs.match(/title="([^"]*)"/i)?.[1]?.trim() || p;
              const wc = String(m[2] || '').trim().split(/\s+/).filter(Boolean).length;
              return `- **${t}** (\`${p}\` — ${wc} كلمة)`;
            })
          ].join('\n')
        : '';

    const fullVisibleChatText = [beforeTag || canvasFilesSummaryMd, afterClose]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    return {
      sanitizedText: fullVisibleChatText || 'تم كتابة العمل الكامل في مرسم الكانفاس الحي.',
      canvasEnvelope: {
        title: canvasTitleAttr || 'وثيقة ومشروع الكانفاس الموسّع',
        type: (canvasTypeAttr?.toLowerCase() === 'code' ? 'code' : 'document') as 'document' | 'code',
        canvasBody,
        isClosed
      },
      fileArtifactEnvelope: parsedFileArtifact,
      generatedArtifactsList: parsedGeneratedArtifacts,
      legacyVisualPrompt: extractedLegacyVisualPrompt
    };
  }, [message.content, isUser]);

  const isQuotaExhausted = !isUser && (
    message.content.includes('NEXUS_QUOTA_EXHAUSTED') ||
    message.content.includes('API Quota Exhausted') ||
    message.content.includes('تجاوز الحصة المتاحة') ||
    (message.content.includes('[SYSTEM ERROR]') && (message.content.toLowerCase().includes('quota') || message.content.includes('429')))
  );

  // Open live while thinking in real-time, and automatically fold/close once finished (DeepSeek behavior)
  const [showThought, setShowThought] = useState(
    Boolean(message.isThinkingStreaming) || Boolean(keepThinkingExpanded)
  );
  const wasThinkingStreamingRef = useRef<boolean>(Boolean(message.isThinkingStreaming));
  const thoughtSectionRef = useRef<HTMLDivElement | null>(null);
  const [thinkingElapsedSec, setThinkingElapsedSec] = useState<number>(message.thinkingDuration || 0);
  const thinkingStartRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [showNanoTelemetry, setShowNanoTelemetry] = useState<boolean>(false);

  const hasThoughtTokens = Boolean(message.thoughtProcess && message.thoughtProcess.trim().length > 0);
  const hasVisibleResponseText = Boolean(message.content && message.content.trim().length > 20);
  const isActivelyThinking = Boolean(
    message.isThinkingStreaming &&
      message.isStreaming &&
      !hasVisibleResponseText &&
      thinkingElapsedSec < 240
  );

  useEffect(() => {
    if (typeof message.thinkingDuration === 'number' && message.thinkingDuration > 0) {
      setThinkingElapsedSec(Math.min(240, message.thinkingDuration));
    }
  }, [message.thinkingDuration]);

  useEffect(() => {
    if (isActivelyThinking) {
      setShowThought(true);
      if (thinkingStartRef.current === null) {
        thinkingStartRef.current = Date.now();
      }
      wasThinkingStreamingRef.current = true;
      const timer = setInterval(() => {
        if (thinkingStartRef.current !== null) {
          const elapsed = Number(((Date.now() - thinkingStartRef.current) / 1000).toFixed(1));
          if (elapsed >= 240) {
            setThinkingElapsedSec(240);
            clearInterval(timer);
          } else {
            setThinkingElapsedSec(Math.max(0.2, elapsed));
          }
        }
      }, 150);
      return () => clearInterval(timer);
    } else if (wasThinkingStreamingRef.current) {
      if (typeof message.thinkingDuration === 'number' && message.thinkingDuration > 0) {
        setThinkingElapsedSec(Math.min(240, message.thinkingDuration));
      } else if (thinkingStartRef.current !== null) {
        const finalSec = Number(((Date.now() - thinkingStartRef.current) / 1000).toFixed(1));
        setThinkingElapsedSec(Math.min(240, Math.max(0.4, finalSec)));
      }
      thinkingStartRef.current = null;
      wasThinkingStreamingRef.current = false;
      // Fold automatically upon completion like DeepSeek, unless user explicitly enabled keepThinkingExpanded
      setShowThought(Boolean(keepThinkingExpanded));
    }
  }, [isActivelyThinking, hasThoughtTokens, keepThinkingExpanded, message.thoughtProcess, message.thinkingDuration]);

  useEffect(() => {
    if (message.generatedImage) {
      if (!message.generatedImage.startsWith('NEXUS_MULTI_MODEL_MIX|')) {
        setResolvedImageUrl(
          message.generatedImage.startsWith('http') || message.generatedImage.startsWith('data:')
            ? message.generatedImage
            : `data:image/png;base64,${message.generatedImage}`
        );
      }
    }
  }, [message.generatedImage]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  // Aggregate the standalone document manuscript strictly from fileArtifactEnvelope or canvasEnvelope chapters.
  // NEVER prepend the conversational chat message (sanitizedText) into a standalone book/PDF artifact!
  const getFullDocumentManuscript = (): string => {
    const stripConversationalPreamble = (txt: string): string =>
      txt
        .replace(/<nexus_canvas\b[^>]*>/gi, '')
        .replace(/<\/nexus_canvas>/gi, '')
        .replace(/<nexus_file\b[^>]*>/gi, '\n\n')
        .replace(/<\/nexus_file>/gi, '\n\n')
        .replace(
          /^(?:\s*(?:أهلاً|مرحباً|بكل سرور|إليك|أعددتُ لك|لقد قمتُ|بناءً على طلبك|فيما يلي|هذا هو الملف)[^\n]*\n+)+/i,
          ''
        )
        .trim();

    if (fileArtifactEnvelope?.artifactBody?.trim()) {
      const artifactParts: string[] = [fileArtifactEnvelope.artifactBody.trim()];
      if (canvasEnvelope?.canvasBody) {
        const canvasFiles = Array.from(
          canvasEnvelope.canvasBody.matchAll(/<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
        );
        for (const m of canvasFiles) {
          const attrs = m[1] || '';
          if (/\.(html|css|js|ts|sql)$/i.test(attrs)) continue;
          const fTitle = attrs.match(/title="([^"]*)"/i)?.[1]?.trim() || '';
          const fBody = (m[2] || '').trim();
          if (fBody && !artifactParts.some(p => p.includes(fBody.slice(0, 120)))) {
            artifactParts.push(fTitle && !fBody.startsWith('#') ? `# ${fTitle}\n\n${fBody}` : fBody);
          }
        }
      }
      return stripConversationalPreamble(artifactParts.join('\n\n'));
    }

    if (canvasEnvelope?.canvasBody) {
      const canvasParts: string[] = [];
      const canvasFiles = Array.from(
        canvasEnvelope.canvasBody.matchAll(/<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
      );
      for (const m of canvasFiles) {
        const attrs = m[1] || '';
        const fTitle = attrs.match(/title="([^"]*)"/i)?.[1]?.trim() || '';
        const fBody = (m[2] || '').trim();
        if (fBody && !canvasParts.some(p => p.includes(fBody.slice(0, 120)))) {
          canvasParts.push(fTitle && !fBody.startsWith('#') ? `# ${fTitle}\n\n${fBody}` : fBody);
        }
      }
      if (canvasParts.length > 0) {
        return stripConversationalPreamble(canvasParts.join('\n\n'));
      }
    }

    const cleanSanitized = (sanitizedText || message.content || '').trim();
    return stripConversationalPreamble(cleanSanitized);
  };

  const handleExportMessageAsFile = async (
    format: 'doc' | 'docx' | 'xlsx' | 'pptx' | 'epub' | 'csv' | 'pdf_html' | 'md' | 'json'
  ) => {
    const cleanContent = getFullDocumentManuscript();
    const timestampSlug = new Date(message.timestamp).toISOString().slice(0, 10);
    if (format === 'docx' || format === 'xlsx' || format === 'pptx' || format === 'epub') {
      await handleRunServerTerminalFileBuild(format, true);
      setShowExportMenu(false);
      return;
    }
    let blobContent = cleanContent;
    let mimeType = 'text/plain;charset=utf-8';
    let ext = 'txt';

    if (format === 'doc') {
      ext = 'doc';
      mimeType = 'application/msword;charset=utf-8';
      const htmlBody = cleanContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
      blobContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;color:#111827;padding:28px;}h1,h2,h3{color:#065f46;}pre,code{background:#f3f4f6;padding:8px;border-radius:6px;direction:ltr;text-align:left;display:block;}</style></head><body><p>${htmlBody}</p></body></html>`;
    } else if (format === 'pdf_html') {
      ext = 'html';
      mimeType = 'text/html;charset=utf-8';
      const htmlBody = cleanContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
      blobContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${fileArtifactEnvelope?.title || 'Document'}</title><style>body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;line-height:1.9;color:#111827;max-width:840px;margin:32px auto;padding:28px;}h1,h2,h3{color:#0f172a;}@media print{.no-print{display:none;}}</style></head><body><div class="no-print" style="margin-bottom:20px;padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;display:flex;justify-content:space-between;align-items:center;"><span><strong>${fileArtifactEnvelope?.title || ''}</strong></span><button onclick="window.print()" style="background:#0f172a;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold;">طباعة / حفظ كـ PDF</button></div><p>${htmlBody}</p></body></html>`;
    } else if (format === 'csv') {
      ext = 'csv';
      mimeType = 'text/csv;charset=utf-8';
      const lines = cleanContent
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map((line, idx) => `${idx + 1},"${line.replace(/"/g, '""')}"`);
      blobContent = '\uFEFFالسطر,المحتوى\n' + lines.join('\n');
    } else if (format === 'md') {
      ext = 'md';
      mimeType = 'text/markdown;charset=utf-8';
      blobContent = cleanContent;
    } else if (format === 'json') {
      ext = 'json';
      mimeType = 'application/json;charset=utf-8';
      blobContent = JSON.stringify(
        {
          id: message.id,
          timestamp: new Date(message.timestamp).toISOString(),
          content: cleanContent,
          sources: message.groundingMetadata?.groundingChunks || []
        },
        null,
        2
      );
    }

    const blob = new Blob([blobContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_${timestampSlug}_${message.id.slice(-4)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  useEffect(() => {
    if (fileArtifactEnvelope?.theme) {
      setSelectedPdfTheme(fileArtifactEnvelope.theme);
    } else if (!isUser && sanitizedText) {
      if (/رواية|الفصل|مشهد|حكاية|قصيدة/.test(sanitizedText)) {
        setSelectedPdfTheme('royal_literary');
      } else if (/```|خوارزمية|معادلة|برمجة|كود/.test(sanitizedText)) {
        setSelectedPdfTheme('scientific_academic');
      }
    }
  }, [fileArtifactEnvelope?.theme, isUser, sanitizedText]);

  /**
   * PURE CREATIVE BESPOKE PDF ENGINE (v4.0 — Zero Boilerplate, Zero Rigid Templates, Full Visual Primitives)
   * Renders a multi-page High-DPI binary .PDF (%PDF-1.4) driven purely by the author's content and visual blocks:
   * - Supports custom color palettes, typography, and organic cover geometry without any forced system labels or telemetry.
   * - Native visual block compilers:
   *   1. `diagram` / `flow` / `architecture`: Connected vector nodes & directional arrows built from the author's diagram block.
   *   2. `metrics` / `stats` / `chart`: Visual KPI cards with progress bars and comparative indicators.
   *   3. `timeline`: Connected chronological or strategic phase steps.
   *   4. `split_cards`: Side-by-side comparison cards (from 2-column tables or ```split blocks).
   *   5. `board`: 8×8 algebraic/tactical board with rank/file coordinates and analysis panel.
   *   6. `callout`, `table`, `code`, `toc`, and hierarchical typography.
   */
  const handleDirectDownloadRealPdf = async (
    customTitle?: string,
    customFilename?: string,
    overrideTheme?: 'sovereign_executive' | 'royal_literary' | 'scientific_academic',
    previewOnly: boolean = false
  ) => {
    const rawText = getFullDocumentManuscript();
    if (!rawText || (isGeneratingPdfBinary && !previewOnly)) return;
    if (!previewOnly) setIsGeneratingPdfBinary(true);
    try {
      const activeTheme = overrideTheme || selectedPdfTheme || fileArtifactEnvelope?.theme || 'sovereign_executive';
      const activeLayout: 'tactical_manual' | 'literary_novel' | 'scientific_blueprint' | 'executive_dossier' =
        overrideTheme === 'royal_literary'
          ? 'literary_novel'
          : overrideTheme === 'scientific_academic'
          ? 'scientific_blueprint'
          : overrideTheme === 'sovereign_executive' && fileArtifactEnvelope?.layout !== 'tactical_manual'
          ? 'executive_dossier'
          : fileArtifactEnvelope?.layout ||
            (activeTheme === 'royal_literary'
              ? 'literary_novel'
              : activeTheme === 'scientific_academic'
              ? 'scientific_blueprint'
              : 'executive_dossier');

      const firstHeadingMatch = rawText.match(/^#{1,3}\s+(.+)$/m);
      const docTitle =
        customTitle ||
        fileArtifactEnvelope?.title ||
        firstHeadingMatch?.[1]?.replace(/[*#]/g, '').trim() ||
        '';
      // Only use subtitle if explicitly authored — never inject generic template subtitles!
      const docSubtitle = (fileArtifactEnvelope?.subtitle || '').trim();

      const baseSpec =
        activeLayout === 'literary_novel' || activeTheme === 'royal_literary'
          ? {
              pageBg: '#FAF6EE',
              outerBorder: '#C5A059',
              innerBorder: '#E6D7BE',
              bannerStart: '#2C1810',
              bannerEnd: '#1A0F0A',
              accent: '#A67C37',
              accentSoft: '#F3EAD8',
              h1Color: '#3E2723',
              h2Color: '#4E342E',
              h3Color: '#6D4C41',
              bodyColor: '#1E1612',
              mutedColor: '#795548',
              fontFamily: '"Amiri", "Traditional Arabic", "Georgia", "Segoe UI", Tahoma, serif'
            }
          : activeLayout === 'tactical_manual'
          ? {
              pageBg: '#F8FAFC',
              outerBorder: '#B45309',
              innerBorder: '#E2E8F0',
              bannerStart: '#0F172A',
              bannerEnd: '#1E293B',
              accent: '#D97706',
              accentSoft: '#FEF3C7',
              h1Color: '#0F172A',
              h2Color: '#1E293B',
              h3Color: '#B45309',
              bodyColor: '#0F172A',
              mutedColor: '#475569',
              fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif'
            }
          : activeLayout === 'scientific_blueprint' || activeTheme === 'scientific_academic'
          ? {
              pageBg: '#FFFFFF',
              outerBorder: '#0284C7',
              innerBorder: '#E0F2FE',
              bannerStart: '#0F172A',
              bannerEnd: '#0C4A6E',
              accent: '#0284C7',
              accentSoft: '#F0F9FF',
              h1Color: '#0F172A',
              h2Color: '#0369A1',
              h3Color: '#0284C7',
              bodyColor: '#0F172A',
              mutedColor: '#475569',
              fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif'
            }
          : {
              pageBg: '#FFFFFF',
              outerBorder: '#059669',
              innerBorder: '#D1FAE5',
              bannerStart: '#064E3B',
              bannerEnd: '#0F172A',
              accent: '#059669',
              accentSoft: '#ECFDF5',
              h1Color: '#064E3B',
              h2Color: '#065F46',
              h3Color: '#047857',
              bodyColor: '#111827',
              mutedColor: '#4B5563',
              fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif'
            };

      const serverBespoke = (terminalBuildState.blueprint as any)?.bespokeDesign;
      const customPrimary = fileArtifactEnvelope?.primaryColor || serverBespoke?.primaryColor;
      const customAccent = fileArtifactEnvelope?.accentColor || serverBespoke?.accentColor;
      const customBg = fileArtifactEnvelope?.bgColor || serverBespoke?.bgColor;
      // Only show a kicker/seal if the author explicitly provided a non-system custom_seal
      const rawCustomSeal = (fileArtifactEnvelope?.customSeal || '').trim();
      const cleanCustomSeal =
        rawCustomSeal && !/nexus|bespoke|edition|sha-?256/i.test(rawCustomSeal) ? rawCustomSeal : '';

      const getHexLuminance = (hexColor?: string): number => {
        if (!hexColor || !hexColor.startsWith('#')) return 0.95;
        const clean = hexColor.replace('#', '').trim();
        const full =
          clean.length === 3
            ? clean
                .split('')
                .map(c => c + c)
                .join('')
            : clean;
        if (full.length !== 6) return 0.95;
        const r = parseInt(full.slice(0, 2), 16) / 255;
        const g = parseInt(full.slice(2, 4), 16) / 255;
        const b = parseInt(full.slice(4, 6), 16) / 255;
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return 0.95;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const effectivePageBg =
        !overrideTheme && customBg && customBg.startsWith('#') ? customBg : baseSpec.pageBg;
      const isDarkPageBg = getHexLuminance(effectivePageBg) < 0.35;

      const candidatePrimary =
        !overrideTheme && customPrimary && customPrimary.startsWith('#') ? customPrimary : baseSpec.bannerStart;
      const safeBannerPrimary =
        getHexLuminance(candidatePrimary) > 0.45 ? baseSpec.bannerStart : candidatePrimary;

      const candidateAccent =
        !overrideTheme && customAccent && customAccent.startsWith('#') ? customAccent : baseSpec.accent;
      const safeAccent =
        isDarkPageBg && getHexLuminance(candidateAccent) < 0.22 ? '#F59E0B' : candidateAccent;

      const themeSpec = {
        ...baseSpec,
        pageBg: effectivePageBg,
        bannerStart: safeBannerPrimary,
        bannerEnd: isDarkPageBg ? '#050811' : baseSpec.bannerEnd,
        h1Color: isDarkPageBg ? '#FFFFFF' : safeBannerPrimary,
        h2Color: isDarkPageBg ? '#E2E8F0' : safeBannerPrimary,
        h3Color: isDarkPageBg ? '#38BDF8' : safeAccent,
        bodyColor: isDarkPageBg ? '#F1F5F9' : baseSpec.bodyColor,
        mutedColor: isDarkPageBg ? '#94A3B8' : baseSpec.mutedColor,
        accentSoft: isDarkPageBg ? '#131B2E' : baseSpec.accentSoft,
        innerBorder: isDarkPageBg ? '#1E293B' : baseSpec.innerBorder,
        outerBorder: safeAccent,
        accent: safeAccent,
        customKicker: cleanCustomSeal
      };

      const pageWidth = 1240;
      const pageHeight = 1754;
      const marginX = 96;
      const topMargin = 118;
      const bottomMargin = 104;
      const maxTextWidth = pageWidth - marginX * 2;

      type RenderBlock =
        | { kind: 'spacer'; height: number }
        | { kind: 'h1' | 'h2' | 'h3'; lines: string[]; rawTitle: string; height: number }
        | { kind: 'paragraph'; lines: string[]; height: number }
        | { kind: 'bullet'; marker: string; lines: string[]; height: number }
        | { kind: 'callout'; title?: string; lines: string[]; height: number }
        | { kind: 'code'; lang: string; lines: string[]; height: number }
        | { kind: 'board'; title: string; gridRows: string[][]; captionLines: string[]; height: number }
        | {
            kind: 'diagram';
            title?: string;
            nodes: Array<{ label: string; detailLines: string[] }>;
            height: number;
          }
        | {
            kind: 'metrics';
            title?: string;
            items: Array<{ label: string; value: string; percent?: number; noteLines: string[] }>;
            height: number;
          }
        | {
            kind: 'timeline';
            title?: string;
            steps: Array<{ phase: string; heading: string; detailLines: string[]; stepHeight: number }>;
            height: number;
          }
        | {
            kind: 'split_cards';
            rightHeader: string;
            leftHeader: string;
            pairs: Array<{ rightLines: string[]; leftLines: string[]; cardHeight: number }>;
            height: number;
          }
        | { kind: 'table'; headers: string[]; rows: string[][]; rowHeights: number[]; height: number }
        | { kind: 'toc'; items: Array<{ level: number; title: string }>; height: number };

      const measureCanvas = document.createElement('canvas');
      const mCtx = measureCanvas.getContext('2d')!;

      const wrapTextToWidth = (text: string, font: string, availWidth: number): string[] => {
        mCtx.font = font;
        const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
        const words = clean.split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];
        const lines: string[] = [];
        let current = words[0];
        for (let i = 1; i < words.length; i++) {
          const candidate = `${current} ${words[i]}`;
          if (mCtx.measureText(candidate).width <= availWidth) {
            current = candidate;
          } else {
            lines.push(current);
            current = words[i];
          }
        }
        if (current) lines.push(current);
        return lines;
      };

      const tocHeadings: Array<{ level: number; title: string }> = [];
      const blocks: RenderBlock[] = [];
      const rawLines = rawText.split('\n');

      for (const rl of rawLines) {
        const s = rl.trim();
        const hm = s.match(/^(#{1,3})\s+(.+)$/);
        if (hm) {
          tocHeadings.push({
            level: hm[1].length,
            title: hm[2].replace(/[*#]/g, '').trim()
          });
        } else if (/^(?:الفصل|الباب|المبحث|المحور)\s+[^:：]{1,35}/.test(s) && s.length < 85) {
          tocHeadings.push({ level: 1, title: s.replace(/[*#]/g, '').trim() });
        }
      }

      if (tocHeadings.length >= 3) {
        const cappedToc = tocHeadings.slice(0, 16);
        blocks.push({
          kind: 'toc',
          items: cappedToc,
          height: 72 + cappedToc.length * 34
        });
        blocks.push({ kind: 'spacer', height: 20 });
      }

      let idx = 0;
      let skippedDuplicateFirstHeading = false;
      while (idx < rawLines.length) {
        const line = rawLines[idx];
        const trimmed = line.trim();

        if (!trimmed || trimmed === '---' || trimmed === '***') {
          blocks.push({ kind: 'spacer', height: trimmed ? 24 : 14 });
          idx++;
          continue;
        }

        // Skip duplicate first H1 if it matches docTitle on Page 1
        if (!skippedDuplicateFirstHeading && /^#{1,2}\s+/.test(trimmed)) {
          const candidateHeading = trimmed.replace(/^#{1,2}\s+/, '').replace(/[*#]/g, '').trim();
          skippedDuplicateFirstHeading = true;
          if (docTitle && candidateHeading === docTitle) {
            idx++;
            continue;
          }
        }

        // 1. Creative Visual Blocks or Code Blocks ```lang ... ```
        if (trimmed.startsWith('```')) {
          const lang = trimmed.slice(3).trim().toLowerCase() || 'code';
          idx++;
          const blockLines: string[] = [];
          while (idx < rawLines.length && !rawLines[idx].trim().startsWith('```')) {
            blockLines.push(rawLines[idx].replace(/\t/g, '  '));
            idx++;
          }
          if (idx < rawLines.length) idx++;

          // 1A. Vector Flow / Concept Diagram Block (```diagram, ```flow, ```architecture)
          if (lang === 'diagram' || lang === 'flow' || lang === 'architecture' || lang === 'flowchart') {
            let diagTitle: string | undefined;
            const parsedNodes: Array<{ label: string; detailLines: string[] }> = [];
            for (const bl of blockLines) {
              const cleanBl = bl.trim();
              if (!cleanBl) continue;
              if (/^(?:عنوان|المخطط|title)\s*[:：]/i.test(cleanBl)) {
                diagTitle = cleanBl.split(/[:：]/).slice(1).join(':').trim();
                continue;
              }
              if (cleanBl.includes('->') || cleanBl.includes('→') || cleanBl.includes('⇐') || cleanBl.includes('⬅')) {
                const parts = cleanBl
                  .split(/->|→|⇐|⬅/)
                  .map(s => s.trim())
                  .filter(Boolean);
                for (const p of parts) {
                  const [lbl, det] = p.split(/[:：|]/).map(s => s.trim());
                  parsedNodes.push({
                    label: (lbl || p).slice(0, 34),
                    detailLines: det ? wrapTextToWidth(det, `16px ${themeSpec.fontFamily}`, 210).slice(0, 2) : []
                  });
                }
              } else {
                const [lbl, det] = cleanBl.split(/[:：|]/).map(s => s.trim());
                parsedNodes.push({
                  label: (lbl || cleanBl).replace(/^[-*•\d.)]+\s*/, '').slice(0, 34),
                  detailLines: det ? wrapTextToWidth(det, `16px ${themeSpec.fontFamily}`, 210).slice(0, 2) : []
                });
              }
            }
            if (parsedNodes.length >= 2) {
              const rowsOfNodes = Math.ceil(Math.min(parsedNodes.length, 8) / 4);
              blocks.push({
                kind: 'diagram',
                title: diagTitle,
                nodes: parsedNodes.slice(0, 8),
                height: (diagTitle ? 54 : 20) + rowsOfNodes * 124 + 16
              });
              blocks.push({ kind: 'spacer', height: 14 });
              continue;
            }
          }

          // 1B. Statistical / KPI Metric Cards & Progress Bars (```metrics, ```stats, ```chart, ```kpi)
          if (lang === 'metrics' || lang === 'stats' || lang === 'chart' || lang === 'kpi') {
            let metricsTitle: string | undefined;
            const parsedMetrics: Array<{ label: string; value: string; percent?: number; noteLines: string[] }> = [];
            for (const bl of blockLines) {
              const cleanBl = bl.trim();
              if (!cleanBl) continue;
              if (/^(?:عنوان|title)\s*[:：]/i.test(cleanBl)) {
                metricsTitle = cleanBl.split(/[:：]/).slice(1).join(':').trim();
                continue;
              }
              const parts = cleanBl.split('|').map(s => s.trim()).filter(Boolean);
              if (parts.length >= 2) {
                const label = parts[0].replace(/^[-*•]+\s*/, '');
                const val = parts[1];
                const pctMatch = cleanBl.match(/(\d+(?:\.\d+)?)\s*%/);
                const pct = pctMatch ? Math.min(100, Math.max(0, parseFloat(pctMatch[1]))) : undefined;
                const noteRaw = parts.slice(2).join(' — ');
                parsedMetrics.push({
                  label: label.slice(0, 38),
                  value: val.slice(0, 24),
                  percent: pct,
                  noteLines: noteRaw
                    ? wrapTextToWidth(noteRaw, `16.5px ${themeSpec.fontFamily}`, Math.floor((maxTextWidth - 28) / 2) - 36).slice(0, 2)
                    : []
                });
              }
            }
            if (parsedMetrics.length > 0) {
              const rowsCount = Math.ceil(parsedMetrics.length / 2);
              blocks.push({
                kind: 'metrics',
                title: metricsTitle,
                items: parsedMetrics.slice(0, 8),
                height: (metricsTitle ? 50 : 16) + rowsCount * 118 + 14
              });
              blocks.push({ kind: 'spacer', height: 14 });
              continue;
            }
          }

          // 1C. Chronological / Phase Timeline (```timeline, ```phases, ```roadmap)
          if (lang === 'timeline' || lang === 'phases' || lang === 'roadmap') {
            let timelineTitle: string | undefined;
            const steps: Array<{ phase: string; heading: string; detailLines: string[]; stepHeight: number }> = [];
            for (const bl of blockLines) {
              const cleanBl = bl.trim();
              if (!cleanBl) continue;
              if (/^(?:عنوان|title)\s*[:：]/i.test(cleanBl)) {
                timelineTitle = cleanBl.split(/[:：]/).slice(1).join(':').trim();
                continue;
              }
              const parts = cleanBl.split('|').map(s => s.trim()).filter(Boolean);
              const phase = parts.length >= 2 ? parts[0] : `${steps.length + 1}`;
              const heading = parts.length >= 2 ? parts[1] : parts[0];
              const detail = parts.length >= 3 ? parts.slice(2).join(' — ') : '';
              const dLines = detail
                ? wrapTextToWidth(detail, `18.5px ${themeSpec.fontFamily}`, maxTextWidth - 150).slice(0, 3)
                : [];
              steps.push({
                phase: phase.slice(0, 18),
                heading: heading.slice(0, 56),
                detailLines: dLines,
                stepHeight: Math.max(58, 38 + dLines.length * 27 + 12)
              });
            }
            if (steps.length > 0) {
              const totalH =
                (timelineTitle ? 52 : 16) + steps.reduce((acc, st) => acc + st.stepHeight + 10, 0) + 12;
              blocks.push({
                kind: 'timeline',
                title: timelineTitle,
                steps: steps.slice(0, 8),
                height: totalH
              });
              blocks.push({ kind: 'spacer', height: 14 });
              continue;
            }
          }

          // 1D. Explicit Side-by-Side Split Cards Block (```split or ```comparison)
          if (lang === 'split' || lang === 'comparison' || lang === 'compare') {
            const nonEmptySplit = blockLines.map(l => l.trim()).filter(Boolean);
            if (nonEmptySplit.length >= 2) {
              const headerParts = nonEmptySplit[0].split('|').map(s => s.trim());
              const rightH = headerParts[0] || 'المسار الأول';
              const leftH = headerParts[1] || 'المسار المقابل';
              const cardW = Math.floor((maxTextWidth - 28) / 2);
              const pairs: Array<{ rightLines: string[]; leftLines: string[]; cardHeight: number }> = [];
              for (const rowLine of nonEmptySplit.slice(1)) {
                const [rRaw, lRaw] = rowLine.split('|').map(s => s.trim());
                const rLines = wrapTextToWidth(rRaw || '-', `19px ${themeSpec.fontFamily}`, cardW - 40).slice(0, 5);
                const lLines = wrapTextToWidth(lRaw || '-', `19px ${themeSpec.fontFamily}`, cardW - 40).slice(0, 5);
                const maxL = Math.max(1, rLines.length, lLines.length);
                pairs.push({
                  rightLines: rLines,
                  leftLines: lLines,
                  cardHeight: maxL * 29 + 28
                });
              }
              if (pairs.length > 0) {
                const totalCardsH = 56 + pairs.reduce((acc, item) => acc + item.cardHeight + 12, 0) + 10;
                blocks.push({
                  kind: 'split_cards',
                  rightHeader: rightH,
                  leftHeader: leftH,
                  pairs,
                  height: totalCardsH
                });
                blocks.push({ kind: 'spacer', height: 14 });
                continue;
              }
            }
          }

          // 1E. 8x8 Tactical / Algebraic Board Block (```board, ```chess, ```grid)
          const isBoardBlock =
            lang === 'board' ||
            lang === 'chess' ||
            lang === 'grid' ||
            blockLines.some(cl => /[♔♕♖♗♘♙♚♛♜♝♞♟]/.test(cl));

          if (isBoardBlock) {
            const gridRows: string[][] = [];
            const captionRaw: string[] = [];
            let boardCustomTitle = '';
            for (const cl of blockLines) {
              const cleanCl = cl.trim();
              if (!cleanCl) continue;
              const cells = cleanCl.split(/\s+/).filter(Boolean);
              const pieceLikeCells = cells.filter(
                tok => tok.length <= 2 || /[♔♕♖♗♘♙♚♛♜♝♞♟.rnbqkRNBQK-]/.test(tok)
              );
              if (cells.length >= 6 && cells.length <= 10 && pieceLikeCells.length >= 6 && gridRows.length < 8) {
                const normalizedCells =
                  cells.length === 9 && /^[1-8]$/.test(cells[0]) ? cells.slice(1, 9) : cells.slice(0, 8);
                gridRows.push(normalizedCells);
              } else if (cleanCl.startsWith('عنوان:') || cleanCl.startsWith('الموقف:')) {
                boardCustomTitle = cleanCl.replace(/^(?:عنوان|الموقف)\s*[:：]\s*/, '').trim();
              } else {
                captionRaw.push(...wrapTextToWidth(cleanCl, `19px ${themeSpec.fontFamily}`, maxTextWidth - 390));
              }
            }
            if (gridRows.length >= 4) {
              blocks.push({
                kind: 'board',
                title: boardCustomTitle || 'تحليل الموقف على الرقعة (8×8)',
                gridRows,
                captionLines: captionRaw.slice(0, 8),
                height: 368
              });
              blocks.push({ kind: 'spacer', height: 16 });
              continue;
            }
          }

          // 1F. Standard Code Block
          const wrappedCodeLines: string[] = [];
          for (const rawCodeLine of blockLines) {
            if (rawCodeLine.length <= 82) {
              wrappedCodeLines.push(rawCodeLine);
            } else {
              for (let c = 0; c < rawCodeLine.length; c += 82) {
                wrappedCodeLines.push(rawCodeLine.slice(c, c + 82));
              }
            }
          }
          for (let chunkStart = 0; chunkStart < Math.max(1, wrappedCodeLines.length); chunkStart += 28) {
            const chunkLines = wrappedCodeLines.slice(chunkStart, chunkStart + 28);
            blocks.push({
              kind: 'code',
              lang: chunkStart === 0 ? lang : `${lang} (تابع)`,
              lines: chunkLines,
              height: 52 + chunkLines.length * 28 + 20
            });
            blocks.push({ kind: 'spacer', height: 12 });
          }
          continue;
        }

        // 2. Markdown Table | col1 | col2 |
        // Automatically renders 2-column comparison tables as Side-by-Side Comparison Cards
        if (
          trimmed.startsWith('|') &&
          trimmed.endsWith('|') &&
          idx + 1 < rawLines.length &&
          /^\|[\s:-]+\|/.test(rawLines[idx + 1].trim())
        ) {
          const headers = trimmed
            .slice(1, -1)
            .split('|')
            .map(c => c.replace(/\*\*/g, '').trim())
            .filter((_, i, arr) => i < 6 && arr.length > 0);
          idx += 2;
          const rows: string[][] = [];
          while (idx < rawLines.length && rawLines[idx].trim().startsWith('|') && rawLines[idx].trim().endsWith('|')) {
            const cells = rawLines[idx]
              .trim()
              .slice(1, -1)
              .split('|')
              .slice(0, headers.length)
              .map(c => c.replace(/\*\*/g, '').trim());
            rows.push(cells);
            idx++;
          }

          if (headers.length === 2 && rows.length > 0) {
            const cardW = Math.floor((maxTextWidth - 28) / 2);
            const pairs: Array<{ rightLines: string[]; leftLines: string[]; cardHeight: number }> = [];
            for (const r of rows) {
              const rLines = wrapTextToWidth(r[0] || '-', `19px ${themeSpec.fontFamily}`, cardW - 40).slice(0, 5);
              const lLines = wrapTextToWidth(r[1] || '-', `19px ${themeSpec.fontFamily}`, cardW - 40).slice(0, 5);
              const maxL = Math.max(1, rLines.length, lLines.length);
              pairs.push({
                rightLines: rLines,
                leftLines: lLines,
                cardHeight: maxL * 29 + 28
              });
            }
            for (let pStart = 0; pStart < pairs.length; pStart += 6) {
              const subPairs = pairs.slice(pStart, pStart + 6);
              const totalCardsH = 56 + subPairs.reduce((acc, item) => acc + item.cardHeight + 12, 0) + 10;
              blocks.push({
                kind: 'split_cards',
                rightHeader: headers[0] || '',
                leftHeader: headers[1] || '',
                pairs: subPairs,
                height: totalCardsH
              });
              blocks.push({ kind: 'spacer', height: 14 });
            }
            continue;
          }

          const colCount = Math.max(1, headers.length);
          const cellAvailW = Math.floor((maxTextWidth - 24) / colCount) - 20;
          const rowHeights: number[] = [];
          for (const r of rows) {
            let maxLinesInRow = 1;
            for (const cell of r) {
              const wrapped = wrapTextToWidth(cell || '-', `18px ${themeSpec.fontFamily}`, cellAvailW);
              maxLinesInRow = Math.max(maxLinesInRow, Math.min(4, wrapped.length));
            }
            rowHeights.push(Math.max(44, maxLinesInRow * 26 + 18));
          }

          for (let rStart = 0; rStart < Math.max(1, rows.length); rStart += 14) {
            const subRows = rows.slice(rStart, rStart + 14);
            const subHeights = rowHeights.slice(rStart, rStart + 14);
            const totalTableH = 52 + subHeights.reduce((a, b) => a + b, 0) + 16;
            blocks.push({
              kind: 'table',
              headers,
              rows: subRows,
              rowHeights: subHeights,
              height: totalTableH
            });
            blocks.push({ kind: 'spacer', height: 14 });
          }
          continue;
        }

        // 3. Headings (#, ##, ### or Arabic Chapter Titles)
        if (/^#\s+/.test(trimmed) || (/^(?:الفصل|الباب)\s+/.test(trimmed) && trimmed.length < 85)) {
          const clean = trimmed.replace(/^#\s+/, '').replace(/\*\*/g, '').trim();
          const wLines = wrapTextToWidth(clean, `bold 31px ${themeSpec.fontFamily}`, maxTextWidth - 36);
          const extraOrnamentH = activeLayout === 'literary_novel' ? 38 : 24;
          blocks.push({
            kind: 'h1',
            lines: wLines,
            rawTitle: clean,
            height: wLines.length * 46 + extraOrnamentH
          });
          idx++;
          continue;
        }
        if (/^##\s+/.test(trimmed)) {
          const clean = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '').trim();
          const wLines = wrapTextToWidth(clean, `bold 26.5px ${themeSpec.fontFamily}`, maxTextWidth - 28);
          blocks.push({
            kind: 'h2',
            lines: wLines,
            rawTitle: clean,
            height: wLines.length * 40 + 22
          });
          idx++;
          continue;
        }
        if (/^###\s+/.test(trimmed)) {
          const clean = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
          const wLines = wrapTextToWidth(clean, `bold 22.5px ${themeSpec.fontFamily}`, maxTextWidth - 20);
          blocks.push({
            kind: 'h3',
            lines: wLines,
            rawTitle: clean,
            height: wLines.length * 36 + 16
          });
          idx++;
          continue;
        }

        // 4. Callout / Blockquote / Rule (> ...)
        if (/^>\s*/.test(trimmed)) {
          const quoteLines: string[] = [];
          let calloutTitle: string | undefined;
          while (idx < rawLines.length && /^>\s*/.test(rawLines[idx].trim())) {
            const qClean = rawLines[idx].trim().replace(/^>\s*/, '').replace(/\*\*/g, '');
            if (!calloutTitle && /^[^:：]{2,38}[:：]/.test(qClean)) {
              const splitIdx = qClean.search(/[:：]/);
              calloutTitle = qClean.slice(0, splitIdx).trim();
              const rest = qClean.slice(splitIdx + 1).trim();
              if (rest) {
                quoteLines.push(...wrapTextToWidth(rest, `21px ${themeSpec.fontFamily}`, maxTextWidth - 68));
              }
            } else {
              quoteLines.push(...wrapTextToWidth(qClean, `21px ${themeSpec.fontFamily}`, maxTextWidth - 68));
            }
            idx++;
          }
          if (quoteLines.length > 0) {
            blocks.push({
              kind: 'callout',
              title: calloutTitle,
              lines: quoteLines,
              height: quoteLines.length * 34 + (calloutTitle ? 66 : 34)
            });
            blocks.push({ kind: 'spacer', height: 12 });
          }
          continue;
        }

        // 5. Bulleted or Numbered List (- , * , 1. )
        const listMatch = trimmed.match(/^([-*•]|\d+[.)])\s+(.+)$/);
        if (listMatch) {
          const rawMarker = listMatch[1];
          const marker = rawMarker === '-' || rawMarker === '*' ? '◆' : rawMarker;
          const itemLines = wrapTextToWidth(listMatch[2], `21.5px ${themeSpec.fontFamily}`, maxTextWidth - 48);
          blocks.push({
            kind: 'bullet',
            marker,
            lines: itemLines,
            height: itemLines.length * 35 + 8
          });
          idx++;
          continue;
        }

        // 6. Standard Paragraph
        const pLines = wrapTextToWidth(trimmed, `22px ${themeSpec.fontFamily}`, maxTextWidth);
        if (pLines.length > 0) {
          blocks.push({
            kind: 'paragraph',
            lines: pLines,
            height: pLines.length * 37 + 8
          });
        }
        idx++;
      }

      // First page cover header height adapts cleanly to whether a title/subtitle exists (zero telemetry lines!)
      const hasCoverHeader = Boolean(docTitle);
      const firstPageBannerHeight = !hasCoverHeader
        ? 0
        : activeLayout === 'literary_novel'
        ? docSubtitle
          ? 240
          : 190
        : docSubtitle
        ? 184
        : 144;
      const usableBottom = pageHeight - bottomMargin;
      const pages: RenderBlock[][] = [];
      let currentPage: RenderBlock[] = [];
      let currentY = topMargin + firstPageBannerHeight;

      for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
        const blk = blocks[bIdx];
        const isHeading = blk.kind === 'h1' || blk.kind === 'h2' || blk.kind === 'h3';
        const nextBlkHeight = bIdx + 1 < blocks.length ? blocks[bIdx + 1].height : 0;

        const wouldOrphanHeading =
          isHeading && currentPage.length > 0 && currentY + blk.height + Math.min(nextBlkHeight, 95) > usableBottom;

        if ((currentY + blk.height > usableBottom || wouldOrphanHeading) && currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [];
          currentY = topMargin;
        }
        currentPage.push(blk);
        currentY += blk.height;
      }
      if (currentPage.length > 0 || pages.length === 0) {
        pages.push(currentPage);
      }

      const jpegPages: Uint8Array[] = [];
      const dataUrlPages: string[] = [];
      const totalPages = Math.min(pages.length, 85);
      let activeRunningChapter = docSubtitle ? docSubtitle.slice(0, 54) : '';

      for (let pIdx = 0; pIdx < totalPages; pIdx++) {
        const pageH1 = pages[pIdx].find(b => b.kind === 'h1') as
          | { kind: 'h1'; rawTitle: string }
          | undefined;
        if (pageH1?.rawTitle) {
          activeRunningChapter = pageH1.rawTitle.slice(0, 56);
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = pageWidth;
        pageCanvas.height = pageHeight;
        const ctx = pageCanvas.getContext('2d')!;

        // 1. Page Background
        ctx.fillStyle = themeSpec.pageBg;
        ctx.fillRect(0, 0, pageWidth, pageHeight);

        // 2. Subtle Organic Frame
        if (activeLayout === 'literary_novel') {
          ctx.strokeStyle = themeSpec.outerBorder;
          ctx.lineWidth = 1.8;
          ctx.strokeRect(48, 48, pageWidth - 96, pageHeight - 96);
          ctx.strokeStyle = themeSpec.innerBorder;
          ctx.lineWidth = 0.9;
          ctx.strokeRect(56, 56, pageWidth - 112, pageHeight - 112);
        } else {
          ctx.fillStyle = themeSpec.accent;
          ctx.fillRect(0, 0, pageWidth, 6);
          ctx.strokeStyle = themeSpec.innerBorder;
          ctx.lineWidth = 1;
          ctx.strokeRect(46, 46, pageWidth - 92, pageHeight - 92);
        }

        // 3. Running Header on subsequent pages (pIdx > 0) — pure book title & chapter, zero system text
        if (pIdx > 0 && (docTitle || activeRunningChapter)) {
          ctx.direction = 'rtl';
          if (docTitle) {
            ctx.textAlign = 'right';
            ctx.fillStyle = themeSpec.h2Color;
            ctx.font = `bold 15.5px ${themeSpec.fontFamily}`;
            ctx.fillText(docTitle.slice(0, 58), pageWidth - marginX, 82);
          }
          if (activeRunningChapter && activeRunningChapter !== docTitle) {
            ctx.textAlign = 'left';
            ctx.fillStyle = themeSpec.mutedColor;
            ctx.font = `15px ${themeSpec.fontFamily}`;
            ctx.fillText(activeRunningChapter, marginX, 82);
          }
          ctx.strokeStyle = themeSpec.innerBorder;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(marginX, 96);
          ctx.lineTo(pageWidth - marginX, 96);
          ctx.stroke();
        }

        let cursorY = pIdx === 0 ? 86 : topMargin;

        // 4. First Page Organic Titlepiece (Pure Title + Optional Subtitle, ZERO forced kickers or word-count telemetry!)
        if (pIdx === 0 && hasCoverHeader) {
          if (activeLayout === 'literary_novel') {
            const plateH = firstPageBannerHeight - 24;
            ctx.fillStyle = isDarkPageBg ? '#131824' : '#F4ECE0';
            ctx.fillRect(marginX, cursorY, maxTextWidth, plateH);
            ctx.strokeStyle = themeSpec.outerBorder;
            ctx.lineWidth = 2.2;
            ctx.strokeRect(marginX, cursorY, maxTextWidth, plateH);
            ctx.strokeStyle = themeSpec.innerBorder;
            ctx.lineWidth = 1;
            ctx.strokeRect(marginX + 10, cursorY + 10, maxTextWidth - 20, plateH - 20);

            ctx.direction = 'rtl';
            ctx.textAlign = 'center';

            let tY = cursorY + (docSubtitle ? 74 : 92);
            if (themeSpec.customKicker) {
              ctx.fillStyle = themeSpec.accent;
              ctx.font = `bold 16.5px ${themeSpec.fontFamily}`;
              ctx.fillText(`❖  ${themeSpec.customKicker}  ❖`, pageWidth / 2, cursorY + 42);
              tY += 14;
            }

            ctx.fillStyle = themeSpec.h1Color;
            ctx.font = `bold 38px ${themeSpec.fontFamily}`;
            const titleLines = wrapTextToWidth(docTitle, `bold 38px ${themeSpec.fontFamily}`, maxTextWidth - 96).slice(0, 2);
            for (const tl of titleLines) {
              ctx.fillText(tl, pageWidth / 2, tY);
              tY += 48;
            }

            if (docSubtitle) {
              ctx.fillStyle = themeSpec.mutedColor;
              ctx.font = `italic 20.5px ${themeSpec.fontFamily}`;
              ctx.fillText(docSubtitle.slice(0, 92), pageWidth / 2, tY + 12);
            }

            cursorY += plateH + 28;
          } else {
            const bannerH = firstPageBannerHeight - 22;
            const grad = ctx.createLinearGradient(marginX, cursorY, pageWidth - marginX, cursorY + bannerH);
            grad.addColorStop(0, themeSpec.bannerStart);
            grad.addColorStop(1, themeSpec.bannerEnd);
            ctx.fillStyle = grad;
            ctx.fillRect(marginX, cursorY, maxTextWidth, bannerH);

            ctx.fillStyle = themeSpec.accent;
            ctx.fillRect(pageWidth - marginX - 10, cursorY, 10, bannerH);
            ctx.fillRect(marginX, cursorY + bannerH - 4, maxTextWidth, 4);

            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            let titleY = cursorY + (docSubtitle ? 62 : 76);

            if (themeSpec.customKicker) {
              ctx.fillStyle = '#FDE68A';
              ctx.font = `bold 15px ${themeSpec.fontFamily}`;
              ctx.fillText(themeSpec.customKicker, pageWidth - marginX - 28, cursorY + 34);
              titleY += 14;
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold 33px ${themeSpec.fontFamily}`;
            const coverTitleLines = wrapTextToWidth(docTitle, `bold 33px ${themeSpec.fontFamily}`, maxTextWidth - 64).slice(0, 2);
            for (const ctl of coverTitleLines) {
              ctx.fillText(ctl, pageWidth - marginX - 28, titleY);
              titleY += 42;
            }

            if (docSubtitle) {
              ctx.fillStyle = '#E2E8F0';
              ctx.font = `19px ${themeSpec.fontFamily}`;
              ctx.fillText(docSubtitle.slice(0, 94), pageWidth - marginX - 28, titleY + 10);
            }

            cursorY += bannerH + 24;
          }
        }

        // 5. Render Page Blocks
        for (const blk of pages[pIdx]) {
          if (blk.kind === 'spacer') {
            cursorY += blk.height;
            continue;
          }

          if (blk.kind === 'toc') {
            ctx.fillStyle = themeSpec.accentSoft;
            ctx.fillRect(marginX, cursorY, maxTextWidth, blk.height);
            ctx.strokeStyle = themeSpec.accent;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(pageWidth - marginX, cursorY);
            ctx.lineTo(pageWidth - marginX, cursorY + blk.height);
            ctx.stroke();

            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillStyle = themeSpec.h1Color;
            ctx.font = `bold 21.5px ${themeSpec.fontFamily}`;
            ctx.fillText(
              activeLayout === 'literary_novel' ? 'فهرس الفصول:' : 'فهرس المحتويات:',
              pageWidth - marginX - 24,
              cursorY + 38
            );

            let tocY = cursorY + 72;
            ctx.font = `19px ${themeSpec.fontFamily}`;
            blk.items.forEach((item, idxItem) => {
              const indent = (item.level - 1) * 24;
              ctx.fillStyle = item.level === 1 ? themeSpec.h1Color : themeSpec.bodyColor;
              ctx.fillText(`${idxItem + 1}. ${item.title.slice(0, 74)}`, pageWidth - marginX - 28 - indent, tocY);
              tocY += 34;
            });
            cursorY += blk.height;
            continue;
          }

          if (blk.kind === 'h1' || blk.kind === 'h2' || blk.kind === 'h3') {
            cursorY += 10;
            ctx.direction = 'rtl';
            if (blk.kind === 'h1') {
              if (activeLayout === 'literary_novel') {
                ctx.textAlign = 'center';
                ctx.fillStyle = themeSpec.accent;
                ctx.font = `16px ${themeSpec.fontFamily}`;
                ctx.fillText('❖ ─────── ✦ ─────── ❖', pageWidth / 2, cursorY + 14);
                cursorY += 24;
                ctx.fillStyle = themeSpec.h1Color;
                ctx.font = `bold 31px ${themeSpec.fontFamily}`;
                for (const l of blk.lines) {
                  ctx.fillText(l, pageWidth / 2, cursorY + 30);
                  cursorY += 46;
                }
                cursorY += 10;
              } else {
                ctx.textAlign = 'right';
                ctx.fillStyle = themeSpec.accentSoft;
                ctx.fillRect(marginX, cursorY - 6, maxTextWidth, blk.lines.length * 46 + 14);
                ctx.fillStyle = themeSpec.accent;
                ctx.fillRect(pageWidth - marginX - 6, cursorY - 6, 6, blk.lines.length * 46 + 14);
                ctx.fillStyle = themeSpec.h1Color;
                ctx.font = `bold 30.5px ${themeSpec.fontFamily}`;
                for (const l of blk.lines) {
                  ctx.fillText(l, pageWidth - marginX - 20, cursorY + 32);
                  cursorY += 46;
                }
                cursorY += 12;
              }
            } else if (blk.kind === 'h2') {
              ctx.textAlign = 'right';
              ctx.fillStyle = themeSpec.accent;
              ctx.fillRect(pageWidth - marginX - 5, cursorY, 5, blk.lines.length * 40);
              ctx.fillStyle = themeSpec.h2Color;
              ctx.font = `bold 26px ${themeSpec.fontFamily}`;
              for (const l of blk.lines) {
                ctx.fillText(l, pageWidth - marginX - 18, cursorY + 30);
                cursorY += 40;
              }
              cursorY += 8;
            } else {
              ctx.textAlign = 'right';
              ctx.fillStyle = themeSpec.h3Color;
              ctx.font = `bold 22.5px ${themeSpec.fontFamily}`;
              for (const l of blk.lines) {
                ctx.fillText(`▪ ${l}`, pageWidth - marginX, cursorY + 26);
                cursorY += 36;
              }
              cursorY += 4;
            }
            continue;
          }

          if (blk.kind === 'callout') {
            const boxH = blk.height - 6;
            ctx.fillStyle = themeSpec.accentSoft;
            ctx.fillRect(marginX + 12, cursorY, maxTextWidth - 12, boxH);
            ctx.fillStyle = themeSpec.accent;
            ctx.fillRect(pageWidth - marginX - 6, cursorY, 6, boxH);

            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            let qY = cursorY + 32;
            if (blk.title) {
              ctx.fillStyle = themeSpec.accent;
              ctx.font = `bold 20px ${themeSpec.fontFamily}`;
              ctx.fillText(`◈ ${blk.title}:`, pageWidth - marginX - 24, qY);
              qY += 32;
            }
            ctx.fillStyle = themeSpec.h1Color;
            ctx.font = `italic 21px ${themeSpec.fontFamily}`;
            for (const l of blk.lines) {
              ctx.fillText(l, pageWidth - marginX - 24, qY);
              qY += 34;
            }
            cursorY += blk.height;
            continue;
          }

          if (blk.kind === 'diagram') {
            let dY = cursorY;
            if (blk.title) {
              ctx.direction = 'rtl';
              ctx.textAlign = 'right';
              ctx.fillStyle = themeSpec.h2Color;
              ctx.font = `bold 20.5px ${themeSpec.fontFamily}`;
              ctx.fillText(`◈ ${blk.title}`, pageWidth - marginX, dY + 28);
              dY += 44;
            }
            const perRow = Math.min(4, blk.nodes.length);
            const gap = 22;
            const nodeW = Math.floor((maxTextWidth - (perRow - 1) * gap) / perRow);
            const nodeH = 104;

            for (let nIdx = 0; nIdx < blk.nodes.length; nIdx++) {
              const row = Math.floor(nIdx / perRow);
              const colInRow = nIdx % perRow;
              // RTL placement: node 0 on the right, moving left
              const nX = pageWidth - marginX - (colInRow + 1) * nodeW - colInRow * gap;
              const nY = dY + row * (nodeH + 20);
              const nd = blk.nodes[nIdx];

              ctx.fillStyle = isDarkPageBg ? '#131B2E' : '#F8FAFC';
              ctx.fillRect(nX, nY, nodeW, nodeH);
              ctx.strokeStyle = themeSpec.accent;
              ctx.lineWidth = 2;
              ctx.strokeRect(nX, nY, nodeW, nodeH);

              ctx.fillStyle = themeSpec.bannerStart;
              ctx.fillRect(nX, nY, nodeW, 34);

              ctx.direction = 'rtl';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#FFFFFF';
              ctx.font = `bold 16.5px ${themeSpec.fontFamily}`;
              ctx.fillText(nd.label, nX + nodeW / 2, nY + 23);

              ctx.fillStyle = themeSpec.bodyColor;
              ctx.font = `15.5px ${themeSpec.fontFamily}`;
              let detY = nY + 60;
              for (const dl of nd.detailLines) {
                ctx.fillText(dl, nX + nodeW / 2, detY);
                detY += 22;
              }

              // Draw connecting arrow to the next node in the same row
              if (colInRow < perRow - 1 && nIdx + 1 < blk.nodes.length) {
                const arrowStartX = nX;
                const arrowEndX = nX - gap;
                const arrowMidY = nY + nodeH / 2;
                ctx.strokeStyle = themeSpec.accent;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(arrowStartX - 2, arrowMidY);
                ctx.lineTo(arrowEndX + 4, arrowMidY);
                ctx.stroke();

                ctx.fillStyle = themeSpec.accent;
                ctx.beginPath();
                ctx.moveTo(arrowEndX + 2, arrowMidY);
                ctx.lineTo(arrowEndX + 10, arrowMidY - 6);
                ctx.lineTo(arrowEndX + 10, arrowMidY + 6);
                ctx.closePath();
                ctx.fill();
              }
            }
            cursorY += blk.height;
            continue;
          }

          if (blk.kind === 'metrics') {
            let mY = cursorY;
            if (blk.title) {
              ctx.direction = 'rtl';
              ctx.textAlign = 'right';
              ctx.fillStyle = themeSpec.h2Color;
              ctx.font = `bold 20.5px ${themeSpec.fontFamily}`;
              ctx.fillText(`◈ ${blk.title}`, pageWidth - marginX, mY + 28);
              mY += 42;
            }
            const cardW = Math.floor((maxTextWidth - 24) / 2);
            const cardH = 104;
            for (let i = 0; i < blk.items.length; i++) {
              const row = Math.floor(i / 2);
              const isRight = i % 2 === 0;
              const cX = isRight ? marginX + cardW + 24 : marginX;
              const cY = mY + row * (cardH + 14);
              const item = blk.items[i];

              ctx.fillStyle = isDarkPageBg ? '#131B2E' : '#F8FAFC';
              ctx.fillRect(cX, cY, cardW, cardH);
              ctx.strokeStyle = themeSpec.innerBorder;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(cX, cY, cardW, cardH);

              ctx.fillStyle = themeSpec.accent;
              ctx.fillRect(cX + cardW - 6, cY, 6, cardH);

              ctx.direction = 'rtl';
              ctx.textAlign = 'right';
              ctx.fillStyle = themeSpec.mutedColor;
              ctx.font = `bold 16.5px ${themeSpec.fontFamily}`;
              ctx.fillText(item.label, cX + cardW - 18, cY + 28);

              ctx.textAlign = 'left';
              ctx.fillStyle = themeSpec.h1Color;
              ctx.font = `bold 22px ${themeSpec.fontFamily}`;
              ctx.fillText(item.value, cX + 18, cY + 30);

              if (typeof item.percent === 'number') {
                const barW = cardW - 36;
                const barX = cX + 18;
                const barY = cY + 44;
                ctx.fillStyle = isDarkPageBg ? '#1E293B' : '#E2E8F0';
                ctx.fillRect(barX, barY, barW, 10);
                const fillW = Math.round((barW * item.percent) / 100);
                ctx.fillStyle = themeSpec.accent;
                ctx.fillRect(barX + (barW - fillW), barY, fillW, 10);
              }

              if (item.noteLines.length > 0) {
                ctx.textAlign = 'right';
                ctx.fillStyle = themeSpec.bodyColor;
                ctx.font = `16px ${themeSpec.fontFamily}`;
                ctx.fillText(item.noteLines[0], cX + cardW - 18, cY + 82);
              }
            }
            cursorY += blk.height;
            continue;
          }

          if (blk.kind === 'timeline') {
            let tY = cursorY;
            if (blk.title) {
              ctx.direction = 'rtl';
              ctx.textAlign = 'right';
              ctx.fillStyle = themeSpec.h2Color;
              ctx.font = `bold 20.5px ${themeSpec.fontFamily}`;
              ctx.fillText(`◈ ${blk.title}`, pageWidth - marginX, tY + 28);
              tY += 42;
            }
            const spineX = pageWidth - marginX - 54;
            for (let sIdx = 0; sIdx < blk.steps.length; sIdx++) {
              const st = blk.steps[sIdx];
              // Vertical connecting line
              if (sIdx < blk.steps.length - 1) {
                ctx.strokeStyle = themeSpec.accent;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(spineX, tY + 24);
                ctx.lineTo(spineX, tY + st.stepHeight + 14);
                ctx.stroke();
              }

              // Phase node badge
              ctx.fillStyle = themeSpec.bannerStart;
              ctx.fillRect(spineX - 46, tY + 4, 92, 32);
              ctx.strokeStyle = themeSpec.accent;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(spineX - 46, tY + 4, 92, 32);

              ctx.direction = 'rtl';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#FFFFFF';
              ctx.font = `bold 14.5px ${themeSpec.fontFamily}`;
              ctx.fillText(st.phase, spineX, tY + 25);

              // Step content card
              const contentRightX = spineX - 64;
              ctx.textAlign = 'right';
              ctx.fillStyle = themeSpec.h1Color;
              ctx.font = `bold 19.5px ${themeSpec.fontFamily}`;
              ctx.fillText(st.heading, contentRightX, tY + 26);

              ctx.fillStyle = themeSpec.bodyColor;
              ctx.font = `18px ${themeSpec.fontFamily}`;
              let dY = tY + 54;
              for (const dl of st.detailLines) {
                ctx.fillText(dl, contentRightX, dY);
                dY += 26;
              }
              tY += st.stepHeight + 10;
            }
            cursorY = tY + 6;
            continue;
          }

          if (blk.kind === 'split_cards') {
            const cardW = Math.floor((maxTextWidth - 28) / 2);
            const rightCardX = marginX + cardW + 28;
            const leftCardX = marginX;
            let sY = cursorY;

            ctx.fillStyle = themeSpec.bannerStart;
            ctx.fillRect(rightCardX, sY, cardW, 46);
            ctx.fillStyle = themeSpec.accent;
            ctx.fillRect(rightCardX + cardW - 6, sY, 6, 46);

            ctx.fillStyle = isDarkPageBg ? '#064E3B' : '#0F172A';
            ctx.fillRect(leftCardX, sY, cardW, 46);
            ctx.fillStyle = '#10B981';
            ctx.fillRect(leftCardX + cardW - 6, sY, 6, 46);

            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold 18.5px ${themeSpec.fontFamily}`;
            ctx.fillText(blk.rightHeader.slice(0, 34), rightCardX + cardW - 18, sY + 30);
            ctx.fillText(blk.leftHeader.slice(0, 34), leftCardX + cardW - 18, sY + 30);

            sY += 54;

            for (const pair of blk.pairs) {
              const cH = pair.cardHeight;
              ctx.fillStyle = isDarkPageBg ? '#131B2E' : '#FFFBEB';
              ctx.fillRect(rightCardX, sY, cardW, cH);
              ctx.strokeStyle = isDarkPageBg ? '#334155' : '#FDE68A';
              ctx.lineWidth = 1.2;
              ctx.strokeRect(rightCardX, sY, cardW, cH);

              ctx.fillStyle = isDarkPageBg ? '#0F1F1C' : '#F0FDF4';
              ctx.fillRect(leftCardX, sY, cardW, cH);
              ctx.strokeStyle = isDarkPageBg ? '#065F46' : '#BBF7D0';
              ctx.lineWidth = 1.2;
              ctx.strokeRect(leftCardX, sY, cardW, cH);

              ctx.fillStyle = isDarkPageBg ? '#F8FAFC' : '#1E293B';
              ctx.font = `18.5px ${themeSpec.fontFamily}`;
              let rLineY = sY + 30;
              for (const rl of pair.rightLines) {
                ctx.fillText(rl, rightCardX + cardW - 16, rLineY);
                rLineY += 29;
              }
              let lLineY = sY + 30;
              for (const ll of pair.leftLines) {
                ctx.fillText(ll, leftCardX + cardW - 16, lLineY);
                lLineY += 29;
              }

              sY += cH + 12;
            }
            cursorY = sY + 6;
            continue;
          }

          if (blk.kind === 'board') {
            const boxH = blk.height - 10;
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(marginX, cursorY, maxTextWidth, boxH);
            ctx.strokeStyle = themeSpec.accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(marginX, cursorY, maxTextWidth, boxH);

            const boardSize = 264;
            const sqSize = Math.floor(boardSize / 8);
            const boardX = marginX + 42;
            const boardY = cursorY + 32;
            const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

            for (let r = 0; r < 8; r++) {
              ctx.direction = 'ltr';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#94A3B8';
              ctx.font = 'bold 14px Consolas, monospace';
              ctx.fillText(String(8 - r), boardX - 16, boardY + r * sqSize + sqSize / 2 + 5);

              for (let c = 0; c < 8; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? '#E2E8F0' : '#64748B';
                ctx.fillRect(boardX + c * sqSize, boardY + r * sqSize, sqSize, sqSize);
                const piece = blk.gridRows[r]?.[c] || '';
                if (piece && piece !== '.' && piece !== '-') {
                  ctx.direction = 'ltr';
                  ctx.textAlign = 'center';
                  ctx.fillStyle = '#090D16';
                  ctx.font = 'bold 22px "Segoe UI Symbol", "Apple Symbols", Arial, sans-serif';
                  ctx.fillText(piece, boardX + c * sqSize + sqSize / 2, boardY + r * sqSize + sqSize - 7);
                }
              }
            }
            for (let c = 0; c < 8; c++) {
              ctx.direction = 'ltr';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#94A3B8';
              ctx.font = 'bold 14px Consolas, monospace';
              ctx.fillText(files[c], boardX + c * sqSize + sqSize / 2, boardY + boardSize + 20);
            }

            ctx.strokeStyle = themeSpec.accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(boardX, boardY, boardSize, boardSize);

            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FBBF24';
            ctx.font = `bold 21px ${themeSpec.fontFamily}`;
            ctx.fillText(`◈ ${blk.title}`, pageWidth - marginX - 24, cursorY + 50);

            ctx.fillStyle = '#F1F5F9';
            ctx.font = `19px ${themeSpec.fontFamily}`;
            let capY = cursorY + 92;
            for (const cl of blk.captionLines) {
              ctx.fillText(cl, pageWidth - marginX - 24, capY);
              capY += 32;
            }
            cursorY += blk.height;
            continue;
          }

          if (blk.kind === 'code') {
            const boxH = blk.height - 8;
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(marginX, cursorY, maxTextWidth, boxH);
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(marginX, cursorY, maxTextWidth, 38);

            ctx.direction = 'ltr';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#38BDF8';
            ctx.font = 'bold 15px Consolas, monospace';
            ctx.fillText(blk.lang.toUpperCase(), marginX + 18, cursorY + 25);

            ctx.fillStyle = '#E2E8F0';
            ctx.font = '16.5px Consolas, Monaco, monospace';
            let codeY = cursorY + 64;
            for (const cl of blk.lines) {
              ctx.fillText(cl, marginX + 20, codeY);
              codeY += 28;
            }
            cursorY += blk.height;
            continue;
          }

          if (blk.kind === 'table') {
            const colCount = Math.max(1, blk.headers.length);
            const colW = Math.floor(maxTextWidth / colCount);
            let tY = cursorY;

            ctx.fillStyle = themeSpec.bannerStart;
            ctx.fillRect(marginX, tY, maxTextWidth, 48);
            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold 19px ${themeSpec.fontFamily}`;
            for (let c = 0; c < colCount; c++) {
              const cellRightX = pageWidth - marginX - c * colW - 14;
              ctx.fillText((blk.headers[c] || '').slice(0, 32), cellRightX, tY + 31);
            }
            tY += 48;

            for (let r = 0; r < blk.rows.length; r++) {
              const rH = blk.rowHeights[r] || 44;
              ctx.fillStyle = isDarkPageBg
                ? r % 2 === 0
                  ? '#131B2E'
                  : '#0F172A'
                : r % 2 === 0
                ? '#F8FAFC'
                : '#FFFFFF';
              ctx.fillRect(marginX, tY, maxTextWidth, rH);
              ctx.strokeStyle = isDarkPageBg ? '#334155' : '#CBD5E1';
              ctx.lineWidth = 1;
              ctx.strokeRect(marginX, tY, maxTextWidth, rH);

              ctx.fillStyle = isDarkPageBg ? '#F8FAFC' : '#1E293B';
              ctx.font = `18px ${themeSpec.fontFamily}`;
              for (let c = 0; c < colCount; c++) {
                const cellRightX = pageWidth - marginX - c * colW - 14;
                const cellLines = wrapTextToWidth(blk.rows[r][c] || '-', `18px ${themeSpec.fontFamily}`, colW - 28).slice(0, 4);
                let cLineY = tY + 28;
                for (const cl of cellLines) {
                  ctx.fillText(cl, cellRightX, cLineY);
                  cLineY += 25;
                }
              }
              tY += rH;
            }
            cursorY = tY + 16;
            continue;
          }

          if (blk.kind === 'bullet') {
            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillStyle = themeSpec.accent;
            ctx.font = `bold 21px ${themeSpec.fontFamily}`;
            ctx.fillText(blk.marker, pageWidth - marginX - 4, cursorY + 28);

            ctx.fillStyle = themeSpec.bodyColor;
            ctx.font = `21.5px ${themeSpec.fontFamily}`;
            for (const l of blk.lines) {
              ctx.fillText(l, pageWidth - marginX - 38, cursorY + 28);
              cursorY += 35;
            }
            cursorY += 6;
            continue;
          }

          if (blk.kind === 'paragraph') {
            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillStyle = themeSpec.bodyColor;
            ctx.font = `22px ${themeSpec.fontFamily}`;
            for (const l of blk.lines) {
              ctx.fillText(l, pageWidth - marginX, cursorY + 29);
              cursorY += 37;
            }
            cursorY += 8;
          }
        }

        // 6. Clean Page Number Footer (Zero system branding!)
        ctx.strokeStyle = themeSpec.innerBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(marginX, pageHeight - 84);
        ctx.lineTo(pageWidth - marginX, pageHeight - 84);
        ctx.stroke();

        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        ctx.fillStyle = themeSpec.mutedColor;
        ctx.font = `16.5px ${themeSpec.fontFamily}`;
        ctx.fillText(`— ${pIdx + 1} —`, pageWidth / 2, pageHeight - 54);

        const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
        dataUrlPages.push(dataUrl);
        const b64 = dataUrl.split(',')[1];
        const binStr = atob(b64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        jpegPages.push(bytes);
      }

      if (dataUrlPages.length > 0) {
        setPdfPreviewPages(dataUrlPages);
      }

      // Pack JPEG pages into a standards-compliant %PDF-1.4 binary container (both in preview and download modes so server always holds the real High-DPI PDF)
      const encoder = new TextEncoder();
      const chunks: Uint8Array[] = [];
      let byteOffset = 0;
      const pushAscii = (str: string) => {
        const arr = encoder.encode(str);
        chunks.push(arr);
        byteOffset += arr.length;
      };
      const pushBytes = (arr: Uint8Array) => {
        chunks.push(arr);
        byteOffset += arr.length;
      };

      const numPages = jpegPages.length;
      const totalObjects = 2 + numPages * 3;
      const offsets: number[] = new Array(totalObjects + 1).fill(0);

      pushAscii('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

      offsets[1] = byteOffset;
      pushAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

      const kidsRefs: string[] = [];
      for (let i = 0; i < numPages; i++) {
        kidsRefs.push(`${3 + i * 3} 0 R`);
      }
      offsets[2] = byteOffset;
      pushAscii(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${numPages} >>\nendobj\n`);

      for (let i = 0; i < numPages; i++) {
        const pageObjId = 3 + i * 3;
        const contentObjId = 4 + i * 3;
        const imgObjId = 5 + i * 3;
        const imgBytes = jpegPages[i];

        offsets[pageObjId] = byteOffset;
        pushAscii(
          `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${i} ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
        );

        const contentStream = `q\n595.28 0 0 841.89 0 0 cm\n/Im${i} Do\nQ\n`;
        offsets[contentObjId] = byteOffset;
        pushAscii(
          `${contentObjId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
        );

        offsets[imgObjId] = byteOffset;
        pushAscii(
          `${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pageWidth} /Height ${pageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
        );
        pushBytes(imgBytes);
        pushAscii('\nendstream\nendobj\n');
      }

      const xrefOffset = byteOffset;
      pushAscii(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
      for (let objId = 1; objId <= totalObjects; objId++) {
        const padded = String(offsets[objId]).padStart(10, '0');
        pushAscii(`${padded} 00000 n \n`);
      }
      pushAscii(
        `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
      );

      const pdfBlob = new Blob(chunks, { type: 'application/pdf' });
      const rawFileName =
        customFilename ||
        fileArtifactEnvelope?.filename ||
        `${(docTitle || 'document').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '_').slice(0, 45) || 'document'}.pdf`;
      const finalPdfName = rawFileName.toLowerCase().endsWith('.pdf') ? rawFileName : `${rawFileName}.pdf`;

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64Str = typeof reader.result === 'string' ? reader.result : '';
          if (b64Str) {
            fetch('/api/agent-os/save-compiled-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: finalPdfName, pdfBase64: b64Str })
            }).catch(() => {});
          }
        };
        reader.readAsDataURL(pdfBlob);
      } catch {}

      if (previewOnly) {
        return;
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = finalPdfName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 4000);
    } catch (err) {
      console.error('Direct PDF binary generation error:', err);
      if (!previewOnly) {
        handleExportMessageAsFile('pdf_html');
      }
    } finally {
      if (!previewOnly) {
        setIsGeneratingPdfBinary(false);
      }
    }
  };

  const handleRunServerTerminalFileBuild = async (
    targetFormat: string = 'html',
    autoDownloadAfterBuild: boolean = false
  ) => {
    const rawText = getFullDocumentManuscript();
    if (!rawText || terminalBuildState.loading) return;
    setTerminalBuildState(prev => ({ ...prev, loading: true }));
    try {
      const firstHeadingMatch = rawText.match(/^#{1,3}\s+(.+)$/m);
      const docTitle =
        fileArtifactEnvelope?.title ||
        firstHeadingMatch?.[1]?.replace(/[*#]/g, '').trim() ||
        'مصنف نيكسوس السيادي';

      const res = await fetch('/api/agent-os/terminal-build-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          subtitle: fileArtifactEnvelope?.subtitle,
          theme: selectedPdfTheme || fileArtifactEnvelope?.theme,
          filename: fileArtifactEnvelope?.filename || docTitle,
          format: targetFormat,
          content: rawText,
          primaryColor: fileArtifactEnvelope?.primaryColor,
          accentColor: fileArtifactEnvelope?.accentColor,
          bgColor: fileArtifactEnvelope?.bgColor,
          coverStyle: fileArtifactEnvelope?.coverStyle,
          diagramNodes: fileArtifactEnvelope?.diagramNodes,
          customSeal: fileArtifactEnvelope?.customSeal
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.blueprint?.recommendedTheme && !fileArtifactEnvelope?.theme) {
          setSelectedPdfTheme(data.blueprint.recommendedTheme);
        }
        setTerminalBuildState({
          loading: false,
          terminalLog: data.terminalLog,
          downloadUrl: data.downloadUrl,
          filename: data.filename,
          blueprint: data.blueprint
        });
        if (autoDownloadAfterBuild && data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = data.filename || `nexus_work.${targetFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        setTerminalBuildState({ loading: false, terminalLog: '[NEXUS-TERMINAL] Ready for local direct download.' });
      }
    } catch {
      setTerminalBuildState({ loading: false, terminalLog: '[NEXUS-TERMINAL] Local PDF & File Compiler Ready.' });
    }
  };

  // Automatically trigger the server Python 3 bespoke blueprint & binary PDF compiler once streaming finishes when a file artifact is present
  useEffect(() => {
    if (!isUser && !message.isStreaming && fileArtifactEnvelope && !autoCompiledArtifactRef.current) {
      autoCompiledArtifactRef.current = true;
      handleRunServerTerminalFileBuild(fileArtifactEnvelope.format || 'pdf');
      // Pre-render the live Page-1 cover thumbnail and multi-page book preview in the background
      handleDirectDownloadRealPdf(fileArtifactEnvelope.title, fileArtifactEnvelope.filename, undefined, true);
    }
  }, [isUser, message.isStreaming, fileArtifactEnvelope]);

  const handleSaveToGoogleCloud = async (target: 'docs' | 'sheets' | 'drive') => {
    const cleanContent = sanitizedText || message.content || '';
    if (!cleanContent.trim()) return;
    setIsSavingWorkspace(true);
    try {
      const title = `نيكسوس — ${cleanContent.slice(0, 42).replace(/[#*\n]/g, ' ').trim() || 'مستند'}`;
      if (target === 'docs') {
        const res = await createGoogleDocInWorkspace(title, cleanContent);
        setWorkspaceLinkInfo({ label: `تم الإنشاء في Google Docs: ${res.name}`, url: res.webViewLink });
      } else if (target === 'sheets') {
        const rows = extractRowsFromTextForSheets(cleanContent);
        const res = await createGoogleSheetInWorkspace(title, rows);
        setWorkspaceLinkInfo({ label: `تم الإنشاء في Google Sheets: ${res.name}`, url: res.webViewLink });
      } else {
        const res = await uploadFileToGoogleDrive(
          `nexus_${message.id.slice(-5)}.md`,
          cleanContent,
          'text/markdown;charset=utf-8'
        );
        setWorkspaceLinkInfo({ label: `تم الرفع إلى Google Drive: ${res.name}`, url: res.webViewLink });
      }
      setShowExportMenu(false);
    } catch (err: any) {
      console.error('Google Workspace export error:', err);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleToggleThought = (scrollIfOpening = false) => {
    setShowThought(prev => {
      const next = !prev;
      if (next && scrollIfOpening) {
        setTimeout(() => {
          thoughtSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 60);
      }
      return next;
    });
  };

  const handleDownloadImage = async (imageData: string, filename: string) => {
    try {
      let sourceUrl = resolvedImageUrl || imageData;
      if (sourceUrl.startsWith('NEXUS_MULTI_MODEL_MIX|')) {
        sourceUrl = sourceUrl.split('|')[1] || sourceUrl;
      }

      let downloadHref = '';
      let createdObjectUrl = false;
      if (sourceUrl.startsWith('http') || sourceUrl.startsWith('data:image') || sourceUrl.startsWith('blob:')) {
        const res = await fetch(sourceUrl);
        const blob = await res.blob();
        downloadHref = URL.createObjectURL(blob);
        createdObjectUrl = true;
      } else {
        downloadHref = `data:image/png;base64,${sourceUrl}`;
      }
      const link = document.createElement('a');
      link.href = downloadHref;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (createdObjectUrl) {
        setTimeout(() => URL.revokeObjectURL(downloadHref), 1000);
      }
    } catch (e) {
      console.error('Failed to download image', e);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <FileImage size={14} />;
    if (mimeType.includes('pdf')) return <FileText size={14} />;
    if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('html')) return <FileCode size={14} />;
    return <Paperclip size={14} />;
  };

  const hasGrounding =
    message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0;

  // Hide legacy standalone thinking cards if any remain in old sessions
  if (!isUser && message.isThinking) {
    return null;
  }

  // Preserve pure thinking prose (كلام تفكير صافي) free of synthetic headers or leaked internal labels
  const activeThoughtText = useMemo(() => {
    if (isUser) return '';
    const inlineThinkMatches = Array.from((message.content || '').matchAll(/<(?:think|thought)>([\s\S]*?)(?:<\/(?:think|thought)>|$)/gi))
      .map(m => (m[1] || '').trim())
      .filter(Boolean);
    const combinedRaw = [message.thoughtProcess || '', ...inlineThinkMatches].filter(Boolean).join('\n\n');
    let rawThought = combinedRaw
      .replace(/^<think>|<\/think>$/gi, '')
      .replace(/(?:={2,6}|\*{2}|#{1,4})?\s*\[?\s*NEXUS\s+COGNITIVE\s+SYNTHESIS\s*\]?\s*(?:={2,6}|\*{2})?/gi, '')
      .replace(/\$\s*\\leftarrow\s*\$/g, ' ← ')
      .replace(/\$\s*\\rightarrow\s*\$/g, ' → ')
      .replace(/\\leftarrow/g, '←')
      .replace(/\\rightarrow/g, '→')
      .replace(/^\s*◈\s*\[[^\]]*\]\s*:?\s*\n?/gm, '')
      .replace(/^\s*[•\-]\s*\[(?:بروتوكول|التفكير الكمومي|اختبار التكذيب|الحفر العامودي|استحضار الأرشيف|حالة المهندس|بوابة الصدق|الفيض الصامت|الاتساع الأفقي|العناقيد|انسياب الأنظمة|تقسيم العمل|المحركات التجريبية|تمايز الأنسجة|العقد الرجعي|العمود الفقري)[^\]]*\]\s*:?\s*\n?/gm, '')
      .replace(/^\s*\d+\.\s*\[[^\]]+\]\s*:?\s*\n?/gm, '')
      .replace(/^\s*\[(?:الطبقة\s+[012]|المرساة|العنقود|هذا وقود داخلي)[^\]]*\]\s*:?\s*\n?/gm, '')
      .replace(/إليك المادة الفكرية والعيانية المستخلصة في نقاط مكثفة\s*:?\s*\n?/g, '')
      .replace(/إليك خطة البناء الصلبة المستخلصة في نقاط تقنية مكثفة\s*:?\s*\n?/g, '')
      .replace(/إليك المادة الحية المستخلصة\s*:?\s*\n?/g, '')
      .replace(/\b(?:gemini-4-hydrogen|gemini-4-argon|gemini-4-neon|gemini-4-carbon|gemini-3(?:\.1)?-(?:pro|flash)(?:-preview)?|gemini-2\.5-(?:flash|pro)|gemini-3\.1-flash-lite|SKILL-\d{1,2}|KHORA-01|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|OP-VEIL|CLEAR\s*\/\s*HAZY\s*\/\s*VOID)\b/gi, '')
      .replace(/^\*\*(?:Defining\s+(?:the\s+)?(?:Persona|Singularity|Identity)|Assessing\s+Initial\s+Input|Refining\s+(?:the\s+)?(?:Persona|Tone|Approach))\*\*\s*\n?/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (rawThought.includes('• [SUBCONSCIOUS CONTINENT') && rawThought.includes('• [9 ONTOLOGICAL STRATA')) {
      const splitAfterTelemetry = rawThought.split(/• \[9 ONTOLOGICAL STRATA[^\n]*\n?/);
      if (splitAfterTelemetry.length > 1 && splitAfterTelemetry[1].trim().length > 30) {
        rawThought = splitAfterTelemetry[1].trim();
      }
    }

    return rawThought || '';
  }, [isUser, message.thoughtProcess, message.content]);

  const hasThoughtSection = !isUser && (Boolean(activeThoughtText) || isActivelyThinking);

  // Filter tools to display in the real-time / completed tools badges row
  const displayedTools = useMemo(() => {
    if (isUser) return [];
    const raw = message.usedTools || [];
    return raw.filter(t => t && t !== 'تفكير حي بالوقت الحقيقي');
  }, [isUser, message.usedTools]);

  // Smart content-type detection (Tables -> Sheets, Messages/Text -> Docs, Code/Files -> Drive)
  const smartExportProfile = useMemo(
    () => detectSmartExportProfile(sanitizedText || message.content || ''),
    [sanitizedText, message.content]
  );

  const fontSizeClass =
    fontSize === 'large'
      ? 'text-base leading-8'
      : fontSize === 'small'
      ? 'text-xs leading-6'
      : 'text-sm leading-7';

  const displayedThinkingDuration = message.thinkingDuration || thinkingElapsedSec || 0.8;

  return (
    <div className="flex w-full mb-5 justify-start group">
      <div
        className={`
          flex max-w-4xl w-full gap-3.5
          ${isUser ? 'flex-row-reverse' : 'flex-row'}
        `}
      >
        {/* Clean Enterprise Avatar */}
        <div
          className={`
            flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-colors mt-0.5
            ${
              isUser
                ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
                : 'bg-emerald-950/35 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
            }
          `}
        >
          {isUser ? <User size={17} /> : <Bot size={18} />}
        </div>

        {/* Message Column */}
        <div className={`flex flex-col gap-2 w-full min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Subtle Enterprise Header */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={isUser ? 'text-zinc-300 font-semibold' : 'text-white font-bold tracking-tight'}>
              {isUser ? 'أنت' : 'نيكسوس'}
            </span>
            {!isUser && message.routedModel && (
              <span className="bg-zinc-900/90 text-zinc-400 border border-zinc-800/90 px-2 py-0.5 rounded-md text-[10px] font-medium">
                {getRoutedModelLimbLabel(message.routedModel)}
              </span>
            )}
            <span className="text-zinc-500 text-[10px] font-mono tabular-nums">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Attachments (If any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {message.attachments.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 max-w-[220px]"
                >
                  <span className="text-emerald-400">{getFileIcon(file.mimeType)}</span>
                  <span className="truncate font-mono text-[11px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* ACTIVE / COMPLETED TOOLS ROW WITH KINETIC ANIMATION (IN REAL-TIME) & GREEN CHECKMARK IN CIRCLE (ON COMPLETION) */}
          {!isUser && displayedTools.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 w-full">
              {displayedTools.map((toolName, idx) => (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all duration-300 ${
                    message.isStreaming
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                  }`}
                >
                  {message.isStreaming ? (
                    <KineticLiveSpinner size={13} />
                  ) : (
                    <CompletedGreenCheckCircle size={13} />
                  )}
                  <span>{toolName}</span>
                </div>
              ))}
            </div>
          )}

          {/* INTUITIVE COLLAPSIBLE THINKING ACCORDION (Real Measured Duration + Computational Telemetry) */}
          {hasThoughtSection && (
            <div
              ref={thoughtSectionRef}
              className="w-full rounded-xl border border-zinc-800/80 bg-[#0a0a0e] overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setShowThought(prev => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs bg-zinc-900/40 hover:bg-zinc-900/75 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 text-zinc-200">
                  {isActivelyThinking ? (
                    <KineticLiveSpinner size={14} />
                  ) : (
                    <CompletedGreenCheckCircle size={14} />
                  )}
                  <BrainCircuit size={13} className="text-emerald-400 shrink-0" />
                  <span className="font-medium text-zinc-200">
                    {isActivelyThinking
                      ? thinkingElapsedSec > 0
                        ? `يفكر ويحلل الآن... (${thinkingElapsedSec} ث)`
                        : 'يحلل السياق ويبني الاستنتاج...'
                      : `مسار التفكير التحليلي (${displayedThinkingDuration} ثانية)`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">
                    {showThought ? 'طي التفاصيل' : 'عرض التفكير'}
                  </span>
                  {showThought ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {showThought && (
                <div className="px-4 py-3.5 border-t border-zinc-800/80 bg-black/55 animate-in fade-in duration-150">
                  <div className="border-r-2 border-emerald-500/50 pr-3.5 text-xs md:text-[13px] text-zinc-300/95 leading-7 whitespace-pre-wrap font-arabic">
                    {activeThoughtText ? (
                      <div className="prose prose-invert prose-xs max-w-none text-zinc-300/95 leading-7">
                        <ReactMarkdown>{activeThoughtText}</ReactMarkdown>
                        {isActivelyThinking && (
                          <span className="inline-block w-1.5 h-3.5 align-middle bg-emerald-400 animate-pulse mr-1 rounded-sm" />
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 animate-pulse">
                        يتأمل ويفكر بعمق...
                      </span>
                    )}
                  </div>
                  {onViewMindMap && activeThoughtText && !isActivelyThinking && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onViewMindMap(activeThoughtText)}
                        className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-emerald-300 transition-colors"
                      >
                        <Network size={12} />
                        <span>استكشاف الخريطة الذهنية ومسارات التحليل</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RECURSIVE IMPROVEMENT LAB MULTI-PATH EVALUATION ACCORDION (Max Thinking Effort Mode) */}
          {!isUser && message.recursiveLabEvaluation && (
            <div className="w-full rounded-xl border border-amber-500/35 bg-amber-950/15 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowRecursiveLabDetails(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs bg-amber-950/25 hover:bg-amber-950/40 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 text-amber-200 flex-wrap">
                  <GitBranch size={14} className="text-amber-400 shrink-0" />
                  <span className="font-bold">
                    أقصى جهد للنموذج (32K TPU) · مختبر المسارات الثلاثة والتحقق الإمبريقي ({message.recursiveLabEvaluation.paths.length} مسارات مقيّمة إمبريقياً)
                  </span>
                  {(() => {
                    const winner =
                      message.recursiveLabEvaluation.paths.find(
                        p => p.id === message.recursiveLabEvaluation?.winningPathId
                      ) || message.recursiveLabEvaluation.paths[0];
                    return winner ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                        الفائز: {winner.branchNameAr} ({winner.totalScore}%)
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="flex items-center gap-1.5 text-amber-300">
                  <span className="text-[10px] hidden sm:inline">
                    {showRecursiveLabDetails ? 'إخفاء المسارات' : 'عرض تقييم المسارات الثلاثة والتحقق الإمبريقي'}
                  </span>
                  {showRecursiveLabDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </button>

              {showRecursiveLabDetails && (
                <div className="p-3.5 border-t border-amber-500/25 bg-black/60 space-y-3 animate-in fade-in duration-150">
                  {/* Criteria Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 font-bold">معايير النجاح الحاكمة:</span>
                    {message.recursiveLabEvaluation.successCriteria.map((crit, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]"
                      >
                        {idx + 1}. {crit}
                      </span>
                    ))}
                  </div>

                  {/* Synthesis Justification Banner */}
                  {message.recursiveLabEvaluation.synthesisJustificationAr && (
                    <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-100/90 leading-relaxed">
                      <span className="font-bold text-amber-300">تعليل الفوز والتحقق الإمبريقي: </span>
                      <span>{message.recursiveLabEvaluation.synthesisJustificationAr}</span>
                    </div>
                  )}

                  {/* 3 Sub-Thinking Paths Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {message.recursiveLabEvaluation.paths.map(path => {
                      const isWinner = path.id === message.recursiveLabEvaluation?.winningPathId || path.isWinner;
                      return (
                        <div
                          key={path.id}
                          className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                            isWinner
                              ? 'bg-emerald-950/20 border-emerald-500/50'
                              : 'bg-zinc-900/50 border-zinc-800/80'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-bold text-white flex items-center gap-1">
                                {isWinner && <Award size={13} className="text-emerald-400 shrink-0" />}
                                <span>{path.branchNameAr}</span>
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  isWinner
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {path.totalScore}/100
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{path.strategyAr}</p>
                            <div className="text-[11px] text-zinc-300 bg-black/40 border border-zinc-800/80 rounded-lg p-2 leading-relaxed">
                              {path.thoughtSummaryAr}
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-zinc-800/70 flex flex-wrap gap-1">
                            {path.usedTools.map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[9px] text-emerald-300"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Extracted Rule Merged into MemoryBank */}
                  {message.recursiveLabEvaluation.extractedCoreRuleAr && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/35 text-[11px] text-emerald-200 flex items-start gap-2">
                      <Sparkles size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-300">القاعدة المدمجة في الذاكرة الأساسية: </span>
                        <span>{message.recursiveLabEvaluation.extractedCoreRuleAr}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CALM INLINE IMAGE GENERATION PLACEHOLDER INSIDE MESSAGE BUBBLE */}
          {!isUser && !message.generatedImage && message.isStreaming && displayedTools.some(t => t.includes('توليد الصور')) && (
            <div className="w-full max-w-xl mb-2 rounded-xl border border-zinc-800/80 bg-zinc-950/90 px-4 py-5 flex items-center gap-3 text-xs text-zinc-300" dir="rtl">
              <KineticLiveSpinner size={18} />
              <span>جاري رسم اللوحة وتجسيد تفاصيلها...</span>
            </div>
          )}

          {/* SIMPLIFIED CLEAN VISUAL IMAGE CARD */}
          {message.generatedImage && (
            <div className="w-full max-w-2xl mb-2 relative group/image">
              <div className="relative bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-lg">
                <div className="h-9 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between px-3">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-200 font-medium">
                    <Aperture size={13} className="text-emerald-400" />
                    <span>
                      لوحة بصرية
                      {message.nanoVisualTelemetry?.aspectRatio ? ` · ${message.nanoVisualTelemetry.aspectRatio}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(message.nanoVisualTelemetry || (!message.generatedImage.startsWith('NEXUS_MULTI_MODEL_MIX|') && onRegenerateImage)) && (
                      <button
                        type="button"
                        onClick={() => setShowNanoTelemetry(prev => !prev)}
                        className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition cursor-pointer border ${
                          showNanoTelemetry
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                            : 'bg-zinc-800 hover:bg-zinc-700 border-transparent text-zinc-300'
                        }`}
                        title="خيارات العدسة وتفاصيل الرسم"
                      >
                        <ChevronDown size={11} className={showNanoTelemetry ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        <span>خيارات</span>
                      </button>
                    )}
                    {onRegenerateImage && (
                      <button
                        type="button"
                        onClick={() => onRegenerateImage(message.imagePrompt || message.content)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                        title="إعادة توليد الصورة"
                      >
                        <Sparkles size={11} />
                        <span>إعادة رسم</span>
                      </button>
                    )}
                    {onOpenImageInStudio && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenImageInStudio(
                            message.imagePrompt || message.content,
                            resolvedImageUrl || message.generatedImage || undefined
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-purple-300 flex items-center gap-1 transition cursor-pointer"
                        title="تعديل الصورة"
                      >
                        <Edit2 size={11} />
                        <span>تعديل</span>
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDownloadImage(message.generatedImage!, `nexus-image-${message.timestamp}.png`)
                      }
                      className="text-zinc-400 hover:text-emerald-400 transition-colors p-1 cursor-pointer"
                      title="تحميل الصورة"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  {message.generatedImage.startsWith('NEXUS_MULTI_MODEL_MIX|') ? (
                    <NexusMultiModelCanvas
                      urls={message.generatedImage.split('|').slice(1)}
                      prompt={message.imagePrompt}
                      onReady={url => setResolvedImageUrl(url)}
                      onRegenerateWithAngle={
                        onRegenerateImage
                          ? angle => onRegenerateImage(message.imagePrompt || message.content, { cameraAngle: angle })
                          : undefined
                      }
                      onRefineZone={
                        onRegenerateImage
                          ? (zoneLabel, coords, instruction) =>
                              onRegenerateImage(
                                `${message.imagePrompt || message.content} — [تعديل إضافي للغرض "${zoneLabel}" (${coords.x}, ${coords.y}): ${instruction}]`
                              )
                          : undefined
                      }
                    />
                  ) : (
                    <img
                      src={
                        message.generatedImage.startsWith('http') || message.generatedImage.startsWith('data:')
                          ? message.generatedImage
                          : `data:image/png;base64,${message.generatedImage}`
                      }
                      alt="Generated visual"
                      className="w-full h-full object-contain max-h-[540px] bg-black"
                    />
                  )}
                </div>

                {/* Collapsible Lens Angles & Optional Details Drawer (Hidden by Default) */}
                {showNanoTelemetry && (
                  <div className="bg-zinc-950/95 border-t border-zinc-800/80 px-3 py-2 flex flex-col gap-2 text-[11px] animate-in fade-in duration-150" dir="rtl">
                    {!message.generatedImage.startsWith('NEXUS_MULTI_MODEL_MIX|') && onRegenerateImage && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-400">زاوية بديلة:</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {[
                            { id: 'low_angle', label: 'منخفضة' },
                            { id: 'birds_eye', label: 'علوية' },
                            { id: 'macro_closeup', label: 'مقربة Macro' },
                            { id: 'wide_isometric', label: 'واسعة 3D' }
                          ].map(ang => (
                            <button
                              key={ang.id}
                              type="button"
                              onClick={() => onRegenerateImage(message.imagePrompt || message.content, { cameraAngle: ang.id })}
                              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/40 text-[10px] text-zinc-300 hover:text-emerald-300 transition cursor-pointer"
                            >
                              {ang.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.nanoVisualTelemetry && (
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span>{message.nanoVisualTelemetry.modelUsed}</span>
                        <span>{message.nanoVisualTelemetry.aspectRatio} · {message.nanoVisualTelemetry.resolution}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* One-Click Recovery Card for Historical Messages with Inline <nexus_visual_artifact> */}
          {!isUser && !message.generatedImage && !message.isStreaming && legacyVisualPrompt && onRegenerateImage && (
            <div className="w-full max-w-2xl mb-2 p-3.5 rounded-xl bg-gradient-to-l from-emerald-950/40 via-zinc-950 to-cyan-950/30 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 shadow-md" dir="rtl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-300 shrink-0">
                  <Aperture size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-emerald-200">
                    مخطط بصري جاهز للتجسيد (Nano-Banana 2.1 ➔ Nano-Banana Lite)
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate font-mono" dir="ltr">
                    {legacyVisualPrompt}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRegenerateImage(legacyVisualPrompt)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
              >
                <Sparkles size={13} />
                <span>تجسيد الصورة الآن (Nano-Banana 2.1)</span>
              </button>
            </div>
          )}

          {/* Top Standalone Book / File Showcase Chip with Live Cover Thumbnail & Multi-Page Reader Trigger */}
          {!isUser && !message.isStreaming && Boolean(fileArtifactEnvelope) && (() => {
            const fullManuscript = getFullDocumentManuscript();
            const totalWords = fullManuscript.split(/\s+/).filter(Boolean).length;
            const estPages = pdfPreviewPages.length || Math.max(1, Math.ceil(totalWords / 210));
            const fmtUpper = (fileArtifactEnvelope?.format || 'pdf').toUpperCase();
            const chipFilename =
              fileArtifactEnvelope?.filename ||
              `nexus_standalone_book.${(fileArtifactEnvelope?.format || 'pdf').toLowerCase()}`;
            const chipTitle = fileArtifactEnvelope?.title || chipFilename;
            return (
              <div
                className="w-full max-w-xl mb-3 p-3.5 rounded-2xl bg-[#11141c] hover:bg-[#151924] border border-zinc-800/90 hover:border-emerald-500/45 flex items-center justify-between gap-3.5 shadow-lg transition"
                dir="rtl"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {pdfPreviewPages[0] ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePdfPageIdx(0);
                        setShowPdfReaderModal(true);
                      }}
                      className="w-12 h-16 rounded-lg overflow-hidden border border-zinc-700 hover:border-emerald-400 shrink-0 shadow-md relative group/thumb cursor-pointer bg-zinc-900"
                      title="انقر لتصفح صفحات الكتاب المستقل حياً"
                    >
                      <img src={pdfPreviewPages[0]} alt="غلاف المصنف" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                        <Eye size={13} className="text-white" />
                      </span>
                    </button>
                  ) : (
                    <div className="w-11 h-14 rounded-xl bg-red-500/15 border border-red-500/35 flex flex-col items-center justify-center text-red-400 font-mono text-[10px] font-extrabold shrink-0">
                      <FileText size={15} className="mb-0.5" />
                      <span>{fmtUpper.slice(0, 4)}</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-xs md:text-sm font-bold text-zinc-100 truncate">
                      {chipTitle}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate font-mono mt-0.5" dir="ltr">
                      {chipFilename}
                    </div>
                    <div className="text-[11px] text-emerald-400/90 mt-0.5">
                      مصنف مستقل الكيان · {estPages} صفحات · {totalWords} كلمة
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {fmtUpper === 'PDF' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (pdfPreviewPages.length === 0) {
                          await handleDirectDownloadRealPdf(fileArtifactEnvelope?.title, chipFilename, undefined, true);
                        }
                        setActivePdfPageIdx(0);
                        setShowPdfReaderModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                      title="تصفح ومعاينة صفحات الكتاب المستقل قبل التحميل"
                    >
                      <Eye size={13} className="text-emerald-400" />
                      <span>معاينة الصفحات</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isGeneratingPdfBinary || terminalBuildState.loading}
                    onClick={() => {
                      if (fmtUpper === 'PDF') {
                        handleDirectDownloadRealPdf(fileArtifactEnvelope?.title, chipFilename);
                      } else {
                        handleRunServerTerminalFileBuild(fileArtifactEnvelope?.format || 'docx', true);
                      }
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={13} />
                    <span>{isGeneratingPdfBinary || terminalBuildState.loading ? 'جارٍ البناء...' : 'تحميل الملف'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Main Content Bubble */}
          {(Boolean(sanitizedText.trim()) || !message.isThinkingStreaming || isUser) && (
            <div
              className={`
                relative px-5 py-4 rounded-2xl ${fontSizeClass} break-words w-full overflow-hidden border transition-colors
                ${
                  isUser
                    ? 'bg-zinc-900/95 border-zinc-700/75 text-zinc-100 rounded-tr-sm shadow-sm'
                    : 'bg-[#0b0c10] border-zinc-800/85 hover:border-zinc-700/85 text-zinc-200 rounded-tl-sm shadow-[0_4px_24px_rgba(0,0,0,0.25)]'
                }
              `}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                {isQuotaExhausted ? (
                  <p className="text-zinc-300 text-sm leading-relaxed m-0">
                    تعذر إتمام الرد في تلك اللحظة بسبب ضغط مؤقت في الاتصال السحابي. يمكنك إرسال رسالتك الآن بشكل طبيعي.
                  </p>
                ) : (
                  <>
                    <ReactMarkdown
                      components={{
                        table({ children, ...props }: any) {
                          return (
                            <div className="my-4 rounded-xl border border-zinc-800 overflow-hidden bg-[#0a0c12]">
                              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-zinc-900/90 border-b border-zinc-800">
                                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                                  <span>جدول بيانات منظم</span>
                                </span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    disabled={isSavingWorkspace}
                                    onClick={() => handleSaveToGoogleCloud('sheets')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-[11px] text-emerald-200 font-bold flex items-center gap-1 transition cursor-pointer"
                                    title="تصدير هذا الجدول مباشرة إلى Google Sheets"
                                  >
                                    <span>تصدير الجدول إلى Google Sheets ↗</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExportMessageAsFile('csv')}
                                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1 transition cursor-pointer"
                                    title="تنزيل الجدول بصيغة Excel CSV"
                                  >
                                    <Download size={11} />
                                    <span>تنزيل (.csv)</span>
                                  </button>
                                </div>
                              </div>
                              <div className="overflow-x-auto p-2">
                                <table className="w-full text-xs border-collapse" {...props}>
                                  {children}
                                </table>
                              </div>
                            </div>
                          );
                        },
                        code({ node, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const lang = match ? match[1] : '';
                          const codeText = String(children).replace(/\n$/, '');
                          const isBlock = match || String(children).includes('\n');

                          if (isBlock) {
                            return (
                              <div className="my-4 rounded-xl border border-zinc-800 overflow-hidden bg-[#0c0c10]">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-zinc-900/90 border-b border-zinc-800">
                                  <span className="text-[11px] font-mono text-zinc-400 uppercase">
                                    {lang || 'code'}
                                  </span>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {onOpenInCanvasStudio && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenInCanvasStudio(codeText, undefined, 'code_project')}
                                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition font-medium cursor-pointer"
                                      >
                                        <Layers size={11} />
                                        <span>فتح في الكانفاس</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={isSavingWorkspace}
                                      onClick={async () => {
                                        setIsSavingWorkspace(true);
                                        try {
                                          const ext = lang === 'python' || lang === 'py' ? 'py' : lang === 'html' ? 'html' : lang === 'json' ? 'json' : 'ts';
                                          const res = await uploadFileToGoogleDrive(
                                            `nexus_code_${message.id.slice(-5)}.${ext}`,
                                            codeText,
                                            'text/plain;charset=utf-8'
                                          );
                                          setWorkspaceLinkInfo({ label: `تم رفع الملف إلى Google Drive: ${res.name}`, url: res.webViewLink });
                                        } finally {
                                          setIsSavingWorkspace(false);
                                        }
                                      }}
                                      className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 transition font-medium cursor-pointer"
                                      title="تصدير هذا الكود كملف برمجي إلى Google Drive"
                                    >
                                      <ExternalLink size={11} />
                                      <span>تصدير كملف إلى Drive</span>
                                    </button>
                                    {onRunInTerminal && (
                                      <button
                                        type="button"
                                        onClick={() => onRunInTerminal(codeText, lang)}
                                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition font-medium cursor-pointer"
                                      >
                                        <Play size={11} />
                                        <span>تشغيل في الطرفية</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(codeText)}
                                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition cursor-pointer"
                                    >
                                      <Copy size={11} />
                                      <span>نسخ الكود</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-zinc-300">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <code
                              {...props}
                              className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-xs border border-zinc-700/50"
                            >
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {sanitizedText || (message.isStreaming ? '...' : '')}
                    </ReactMarkdown>
                    {message.isStreaming && !message.isThinkingStreaming && (
                      <span className="inline-block w-2 h-4 align-middle bg-emerald-400 animate-pulse mr-1 rounded-sm" />
                    )}
                  </>
                )}
              </div>

              {/* Authentic Gemini Canvas Inline Artifact Card — Displays Dedicated <nexus_canvas> Vast Content or Explicit Canvas Artifact without Duplicating in Chat */}
              {!isUser &&
                onOpenInCanvasStudio &&
                (Boolean(canvasEnvelope) ||
                  (!message.isStreaming &&
                    sanitizedText.trim().split(/\s+/).length >= 180 &&
                    (message.usedTools || []).some(t => t.includes('كانفاس') || t.includes('Canvas')))) && (() => {
                  const targetCanvasBody = canvasEnvelope?.canvasBody || sanitizedText;
                  const nexusFileCount = Array.from(
                    targetCanvasBody.matchAll(/<nexus_file([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
                  ).length;
                  const codeBlockCount = Array.from(
                    targetCanvasBody.matchAll(/```(html|javascript|typescript|tsx|jsx|python|sql|css|json)/gi)
                  ).length;
                  const chapterHeadingCount = Array.from(targetCanvasBody.matchAll(/^#{1,2}\s+/gm)).length;
                  const resolvedItemCount =
                    nexusFileCount || codeBlockCount || (chapterHeadingCount >= 2 ? chapterHeadingCount : 1);

                  const isCodeArtifact =
                    canvasEnvelope?.type === 'code' ||
                    targetCanvasBody.includes('```html') ||
                    targetCanvasBody.includes('```javascript') ||
                    targetCanvasBody.includes('```typescript') ||
                    targetCanvasBody.includes('```python') ||
                    /language="(?:html|css|javascript|typescript|python|sql)"/i.test(targetCanvasBody);

                  const wordCount = targetCanvasBody.trim().split(/\s+/).filter(Boolean).length;
                  const lineCount = targetCanvasBody.split('\n').length;
                  const cardTitle =
                    canvasEnvelope?.title ||
                    (isCodeArtifact
                      ? 'مشروع ومرسم الوكيل السائل المتكامل (AI Studio Mode)'
                      : 'العمل الموسوعي / السردي الموسّع في مرسم نيكسوس');

                  return (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-l from-emerald-950/35 via-[#0b0d14] to-zinc-900/95 border border-emerald-500/40 hover:border-emerald-400/70 transition space-y-3 shadow-lg">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
                            {isCodeArtifact ? <FileCode size={18} /> : <Layers size={18} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs md:text-sm font-bold text-white truncate">
                                {cardTitle}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono shrink-0">
                                {message.isStreaming && canvasEnvelope && !canvasEnvelope.isClosed
                                  ? 'يبني العمل الآن في المرسم الحي...'
                                  : `${resolvedItemCount} ${isCodeArtifact ? 'ملفات برمجية' : 'فصول/أقسام'} · ${wordCount} كلمة · ${lineCount} سطر`}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {isCodeArtifact
                                ? 'بيئة AI Studio الحية: تصفح شجرة الملفات، شغل المعاينة التفاعلية المباشرة، نفذ بايثون بالتيرمنال، أو صدّر المشروع كحزمة (.ZIP)'
                                : 'مرسم الأعمال العظيمة: تصفح الفصول والأقسام، حرّر ووسّع البنيان كالماء، أو صدّره ككتاب وحزمة متكاملة'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onOpenInCanvasStudio(
                              targetCanvasBody,
                              resolvedImageUrl || message.generatedImage,
                              isCodeArtifact ? 'code_project' : 'notebook_guide'
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                          <Layers size={14} />
                          <span>فتح في مرسم الوكيل السائل (AI Studio)</span>
                        </button>
                      </div>

                      {/* Interactive Mode & Action Choices Strip */}
                      <div className="pt-2.5 border-t border-zinc-800/80 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-zinc-400 ml-1">إجراءات المرسم الحي:</span>
                        {isCodeArtifact && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenInCanvasStudio(
                                targetCanvasBody,
                                resolvedImageUrl || message.generatedImage,
                                'code_project'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Play size={11} />
                            <span>معاينة حية وشجرة ملفات المشروع</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInCanvasStudio(
                              targetCanvasBody,
                              resolvedImageUrl || message.generatedImage,
                              'notebook_guide'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-200 hover:text-white flex items-center gap-1 transition cursor-pointer"
                        >
                          <FileText size={11} className="text-emerald-400" />
                          <span>قراءة وتحرير وتوسيع الفصول</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInCanvasStudio(
                              targetCanvasBody,
                              resolvedImageUrl || message.generatedImage,
                              'quiz'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-200 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Award size={11} />
                          <span>إجراء اختبار (خيارات)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInCanvasStudio(
                              targetCanvasBody,
                              resolvedImageUrl || message.generatedImage,
                              'data_chart'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-200 hover:text-sky-300 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Sparkles size={11} className="text-sky-400" />
                          <span>مخطط بياني</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

              {/* Sovereign Universal Artifact Studio Card (Programmatic Videos .MP4/.WebM/.GIF, Audio .WAV/.MP3, Archives .ZIP, Databases .SQLite, 3D .OBJ/.STL, Images .SVG/.PNG) */}
              {!isUser && generatedArtifactsList && generatedArtifactsList.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-l from-emerald-950/45 via-[#080d14] to-cyan-950/35 border border-emerald-500/50 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-500/25">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                        <Terminal size={17} />
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                          <span>مصهر الوسائط والملفات السيادي لنيكسوس (Omni-Agent Live Forge)</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[10px] font-mono">
                            {generatedArtifactsList.length} {generatedArtifactsList.length === 1 ? 'ملف مولّد برمجياً' : 'ملفات مولّدة برمجياً'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          تم التوليد والتركيب حياً عبر التيرمنال السيادي (Python 3.10 · FFmpeg · Linux Kernel) — جاهز للمعاينة والتحميل المباشر
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {generatedArtifactsList.map((art, artIdx) => {
                      const sizeLabel =
                        art.sizeBytes >= 1024 * 1024
                          ? `${(art.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                          : `${Math.max(0.1, Number((art.sizeBytes / 1024).toFixed(1)))} KB`;
                      const cacheBustedStreamUrl = `${art.streamUrl}${art.streamUrl.includes('?') ? '&' : '?'}t=${message.timestamp || Date.now()}`;

                      return (
                        <div
                          key={`${art.filename}-${artIdx}`}
                          className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 hover:border-emerald-500/45 transition space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[10px] font-mono uppercase shrink-0">
                                {art.category}
                              </span>
                              <span className="text-xs font-bold text-zinc-100 font-mono truncate" dir="ltr">
                                {art.filename}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                                ({sizeLabel} · {art.mimeType})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={art.downloadUrl}
                                download={art.filename}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                                title={`تحميل الملف ${art.filename} مباشرة إلى جهازك`}
                              >
                                <Download size={13} />
                                <span>تحميل مباشر ({art.filename.split('.').pop()?.toUpperCase()})</span>
                              </a>
                              <a
                                href={cacheBustedStreamUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                                title="فتح الوسيط أو الملف في تبويب مستقل"
                              >
                                <ExternalLink size={12} />
                                <span>معاينة مستقلة</span>
                              </a>
                            </div>
                          </div>

                          {art.category === 'video' && (
                            <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black flex items-center justify-center">
                              <video
                                src={cacheBustedStreamUrl}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full max-h-[440px] object-contain bg-black"
                              >
                                متصفحك لا يدعم تشغيل الفيديو المدمج، يمكنك تحميله مباشرة من الزر أعلاه.
                              </video>
                            </div>
                          )}

                          {art.category === 'audio' && (
                            <div className="p-3 rounded-xl bg-zinc-900/90 border border-cyan-500/30">
                              <audio
                                src={cacheBustedStreamUrl}
                                controls
                                preload="metadata"
                                className="w-full"
                              />
                            </div>
                          )}

                          {art.category === 'image' && (
                            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black/60 flex items-center justify-center p-2">
                              <img
                                src={cacheBustedStreamUrl}
                                alt={art.filename}
                                className="max-h-[380px] w-auto object-contain rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Direct-Download & Interactive Multi-Page PDF / File Reader Card */}
              {!isUser &&
                !message.isStreaming &&
                Boolean(fileArtifactEnvelope) && (() => {
                  const fullWorkText = getFullDocumentManuscript();
                  const wordCount = fullWorkText.split(/\s+/).filter(Boolean).length;
                  const estPages = pdfPreviewPages.length || Math.max(1, Math.ceil(wordCount / 220));
                  const artifactTitle =
                    fileArtifactEnvelope.title ||
                    'المصنف المستقل';
                  const artifactFilename =
                    fileArtifactEnvelope.filename ||
                    `${(artifactTitle || 'document').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '_').slice(0, 36)}.pdf`;

                  return (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-l from-cyan-950/35 via-[#090d14] to-emerald-950/25 border border-cyan-500/40 hover:border-emerald-400/60 transition space-y-3.5 shadow-lg">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-300 shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs md:text-sm font-bold text-white truncate">
                                {artifactTitle}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-[10px] font-mono shrink-0">
                                {estPages} صفحات · {wordCount} كلمة
                              </span>
                            </div>
                            {fileArtifactEnvelope.subtitle && (
                              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                {fileArtifactEnvelope.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {pdfPreviewPages.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setActivePdfPageIdx(0);
                                setShowPdfReaderModal(true);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                              title="فتح القارئ البصري لتصفح صفحات الـ PDF"
                            >
                              <Eye size={14} />
                              <span>قراءة وتصفح ({pdfPreviewPages.length} ص)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isGeneratingPdfBinary}
                            onClick={() => handleDirectDownloadRealPdf(artifactTitle, artifactFilename)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                            title="توليد وتحميل ملف PDF متعدد الصفحات مباشرة إلى جهازك"
                          >
                            <Download size={14} />
                            <span>{isGeneratingPdfBinary ? 'جارٍ التحضير...' : 'تحميل (.PDF)'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={terminalBuildState.loading}
                            onClick={() => handleExportMessageAsFile('docx')}
                            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                            title="توليد وتحميل مباشر بصيغة Microsoft Word (.DOCX)"
                          >
                            <FileText size={13} className="text-sky-400" />
                            <span>.DOCX</span>
                          </button>

                          <button
                            type="button"
                            disabled={terminalBuildState.loading}
                            onClick={() => handleExportMessageAsFile('xlsx')}
                            className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-emerald-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="توليد وتحميل مباشر بصيغة Microsoft Excel (.XLSX)"
                          >
                            <span>.XLSX</span>
                          </button>

                          <button
                            type="button"
                            disabled={terminalBuildState.loading}
                            onClick={() => handleExportMessageAsFile('pptx')}
                            className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-amber-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="توليد وتحميل مباشر بصيغة PowerPoint (.PPTX)"
                          >
                            <span>.PPTX</span>
                          </button>

                          <button
                            type="button"
                            disabled={terminalBuildState.loading}
                            onClick={() => handleExportMessageAsFile('epub')}
                            className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-purple-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="توليد وتحميل ككتاب إلكتروني (.EPUB)"
                          >
                            <span>.EPUB</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportMessageAsFile('pdf_html')}
                            className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-amber-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="تحميل كصفحة ويب منسقة للطباعة (.HTML)"
                          >
                            <span>.HTML</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportMessageAsFile('md')}
                            className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-emerald-300 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                            title="تحميل بصيغة Markdown (.MD)"
                          >
                            <span>.MD</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Visual PDF Pages Strip */}
                      {pdfPreviewPages.length > 0 && (
                        <div className="pt-2 border-t border-cyan-500/20 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>معاينة حية لصفحات الملف (اضغط على أي صفحة لتكبيرها وتصفحها):</span>
                            <span className="font-mono text-emerald-300">{pdfPreviewPages.length} صفحات جاهزة</span>
                          </div>
                          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5">
                            {pdfPreviewPages.map((pgUrl, pgIdx) => (
                              <button
                                key={pgIdx}
                                type="button"
                                onClick={() => {
                                  setActivePdfPageIdx(pgIdx);
                                  setShowPdfReaderModal(true);
                                }}
                                className="group relative shrink-0 w-28 md:w-32 rounded-xl overflow-hidden border border-zinc-700 hover:border-emerald-400 transition shadow-md bg-black cursor-pointer"
                              >
                                <img
                                  src={pgUrl}
                                  alt={`صفحة ${pgIdx + 1}`}
                                  className="w-full h-40 md:h-44 object-cover object-top group-hover:scale-[1.03] transition-transform"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[10px] text-zinc-200 py-0.5 text-center font-mono">
                                  ص {pgIdx + 1}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Style & Typography Selector Bar */}
                      <div className="pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-zinc-400 text-[10px]">تبديل النمط البصري للـ PDF:</span>
                          {[
                            { id: 'sovereign_executive', label: 'تنفيذي حديث' },
                            { id: 'royal_literary', label: 'كتابي وأدبي' },
                            { id: 'scientific_academic', label: 'علمي وهندسي' }
                          ].map(th => (
                            <button
                              key={th.id}
                              type="button"
                              onClick={() => {
                                setSelectedPdfTheme(th.id as any);
                                handleDirectDownloadRealPdf(artifactTitle, artifactFilename, th.id as any, true);
                              }}
                              className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-medium transition cursor-pointer ${
                                selectedPdfTheme === th.id
                                  ? 'bg-emerald-950/70 border-emerald-400/60 text-emerald-200 shadow-sm'
                                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {th.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Full-Screen Interactive PDF Reader Modal */}
                      {showPdfReaderModal && pdfPreviewPages.length > 0 && (
                        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-between p-3 md:p-6 animate-in fade-in duration-150">
                          <div className="w-full max-w-4xl flex items-center justify-between gap-3 bg-zinc-900/95 border border-zinc-700 rounded-2xl px-4 py-2.5 shadow-xl">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={16} className="text-emerald-400 shrink-0" />
                              <span className="text-xs md:text-sm font-bold text-white truncate">{artifactTitle}</span>
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 text-[11px] font-mono shrink-0">
                                صفحة {activePdfPageIdx + 1} من {pdfPreviewPages.length}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDirectDownloadRealPdf(artifactTitle, artifactFilename)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download size={13} />
                                <span>تحميل (.PDF)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowPdfReaderModal(false)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer"
                              >
                                إغلاق ✕
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 w-full max-w-4xl my-3 overflow-y-auto flex items-start justify-center">
                            <img
                              src={pdfPreviewPages[activePdfPageIdx]}
                              alt={`صفحة ${activePdfPageIdx + 1}`}
                              className="max-h-full w-auto rounded-xl shadow-2xl border border-zinc-700 bg-white"
                            />
                          </div>

                          <div className="w-full max-w-4xl flex items-center justify-between gap-3 bg-zinc-900/95 border border-zinc-700 rounded-2xl px-4 py-2">
                            <button
                              type="button"
                              disabled={activePdfPageIdx <= 0}
                              onClick={() => setActivePdfPageIdx(p => Math.max(0, p - 1))}
                              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-bold cursor-pointer"
                            >
                              → الصفحة السابقة
                            </button>
                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
                              {pdfPreviewPages.map((_, idxP) => (
                                <button
                                  key={idxP}
                                  type="button"
                                  onClick={() => setActivePdfPageIdx(idxP)}
                                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                                    activePdfPageIdx === idxP
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {idxP + 1}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              disabled={activePdfPageIdx >= pdfPreviewPages.length - 1}
                              onClick={() => setActivePdfPageIdx(p => Math.min(pdfPreviewPages.length - 1, p + 1))}
                              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-bold cursor-pointer"
                            >
                              الصفحة التالية ←
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Grounding Sources (Google Search) */}
              {hasGrounding && (
                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                    <Globe size={12} className="text-sky-400" />
                    <span>المصادر المرجعية</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.groundingMetadata?.groundingChunks.map((chunk, idx) =>
                      chunk.web ? (
                        <a
                          key={idx}
                          href={chunk.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg text-[11px] text-zinc-300 hover:text-sky-300 transition-all"
                        >
                          <span className="max-w-[180px] truncate">{chunk.web.title}</span>
                          <ExternalLink size={10} className="opacity-60" />
                        </a>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Message Actions Footer: Copy + Listen + Mind Map + Memory Correction Outside + 3-Dots Menu */}
              {!message.isStreaming && (
                <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-2.5 border-t border-zinc-800/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* 1. Primary Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(sanitizedText || message.content)}
                      className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 text-[11px] font-medium cursor-pointer ${
                        copied
                          ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                          : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                      title="نسخ نص الرسالة"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>

                    {/* 2. Listen (Audio) Button Directly Next to Copy */}
                    {!isUser && onPlayAudio && (
                      <button
                        type="button"
                        onClick={() => onPlayAudio(message.id, sanitizedText || message.content, message.audioData)}
                        className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 text-[11px] font-medium cursor-pointer ${
                          isPlaying
                            ? 'bg-purple-950/50 border-purple-500/50 text-purple-200'
                            : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-purple-300'
                        }`}
                        title="الاستماع الصوتي للرد"
                      >
                        {isPlaying ? (
                          <Pause size={12} className="text-purple-400" />
                        ) : (
                          <Volume2 size={12} className="text-purple-400" />
                        )}
                        <span>{isPlaying ? 'إيقاف الصوت' : 'استماع'}</span>
                      </button>
                    )}

                    {/* 3. Mind Map Button Directly Next to Copy */}
                    {!isUser && onViewMindMap && (
                      <button
                        type="button"
                        onClick={() => onViewMindMap(sanitizedText || activeThoughtText || message.content)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-emerald-300 transition flex items-center gap-1.5 text-[11px] font-medium cursor-pointer"
                        title="عرض الخارطة الذهنية للأفكار"
                      >
                        <Network size={12} className="text-emerald-400" />
                        <span>خريطة الأفكار</span>
                      </button>
                    )}

                    {/* 4. Memory Correction / Teaching Button Directly Next to Copy */}
                    {!isUser && onCorrectMessage && (
                      <button
                        type="button"
                        onClick={() => setShowCorrectionInput(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 text-[11px] font-medium cursor-pointer ${
                          showCorrectionInput
                            ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
                            : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-amber-300'
                        }`}
                        title="تصحيح أو تعليم الذاكرة"
                      >
                        <MessageSquarePlus size={12} className="text-amber-400" />
                        <span>تصحيح / تعليم الذاكرة</span>
                      </button>
                    )}

                    {isUser && onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(message.content)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-emerald-300 transition flex items-center gap-1.5 text-[11px] cursor-pointer"
                      >
                        <Edit2 size={11} />
                        <span>تعديل</span>
                      </button>
                    )}

                    {correctionSavedBadge && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] flex items-center gap-1">
                        <Check size={11} />
                        <span>تم حفظ التصحيح بالذاكرة</span>
                      </span>
                    )}

                    {workspaceLinkInfo && (
                      <a
                        href={workspaceLinkInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-[11px] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{workspaceLinkInfo.label}</span>
                        <ExternalLink size={11} />
                      </a>
                    )}

                    {/* 5. 3-Dots More Options Drawer for Assistant Messages */}
                    {!isUser && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowExportMenu(prev => !prev)}
                          className={`p-1.5 rounded-lg border transition flex items-center justify-center cursor-pointer ${
                            showExportMenu
                              ? 'bg-zinc-800 border-zinc-600 text-white'
                              : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                          title="المزيد من الخيارات والتصدير"
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {showExportMenu && (
                          <div className="absolute right-0 bottom-full mb-2 p-2 rounded-2xl bg-[#0c0d12] border border-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.75)] flex flex-col gap-1 z-40 min-w-[255px] animate-in fade-in zoom-in-95 duration-150">
                            {onOpenInCanvasStudio && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenInCanvasStudio(sanitizedText, resolvedImageUrl || message.generatedImage);
                                  setShowExportMenu(false);
                                }}
                                className="w-full px-3 py-2 rounded-xl hover:bg-zinc-900 text-right flex items-center gap-2.5 text-xs text-zinc-200 hover:text-emerald-300 transition cursor-pointer"
                              >
                                <Layers size={14} className="text-emerald-400 shrink-0" />
                                <span>فتح في لوحة الكانفاس الجانبية</span>
                              </button>
                            )}

                            {onPlayAudio && (
                              <button
                                type="button"
                                onClick={() => {
                                  onPlayAudio(message.id, sanitizedText || message.content, message.audioData);
                                  setShowExportMenu(false);
                                }}
                                className="w-full px-3 py-2 rounded-xl hover:bg-zinc-900 text-right flex items-center gap-2.5 text-xs text-zinc-200 hover:text-purple-300 transition cursor-pointer"
                              >
                                {isPlaying ? (
                                  <Pause size={14} className="text-purple-400 shrink-0" />
                                ) : (
                                  <Volume2 size={14} className="text-purple-400 shrink-0" />
                                )}
                                <span>{isPlaying ? 'إيقاف القراءة الصوتية' : 'استماع صوتي للرد'}</span>
                              </button>
                            )}

                            {onViewMindMap && (
                              <button
                                type="button"
                                onClick={() => {
                                  onViewMindMap(sanitizedText || activeThoughtText || message.content);
                                  setShowExportMenu(false);
                                }}
                                className="w-full px-3 py-2 rounded-xl hover:bg-zinc-900 text-right flex items-center gap-2.5 text-xs text-zinc-200 hover:text-emerald-300 transition cursor-pointer"
                              >
                                <Network size={14} className="text-emerald-400 shrink-0" />
                                <span>الخارطة الذهنية للأفكار</span>
                              </button>
                            )}

                            {onCorrectMessage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCorrectionInput(prev => !prev);
                                  setShowExportMenu(false);
                                }}
                                className="w-full px-3 py-2 rounded-xl hover:bg-zinc-900 text-right flex items-center gap-2.5 text-xs text-zinc-200 hover:text-amber-300 transition cursor-pointer"
                              >
                                <MessageSquarePlus size={14} className="text-amber-400 shrink-0" />
                                <span>تصحيح أو تعليم الذاكرة</span>
                              </button>
                            )}

                            {Boolean(sanitizedText.trim()) && (
                              <>
                                <div className="my-1 border-t border-zinc-800/80" />
                                <div className="text-[10px] font-bold text-zinc-500 px-2 py-0.5">
                                  تنزيل حسب طبيعة المحتوى
                                </div>
                                <div className="flex flex-wrap items-center gap-1 px-1.5 pb-1">
                                  {[
                                    { id: 'pdf_html', label: 'PDF وثيقة', show: true },
                                    { id: 'doc', label: 'Word (.doc)', show: smartExportProfile.hasTextDocument },
                                    { id: 'csv', label: 'جدول Excel (.csv)', show: smartExportProfile.hasTable },
                                    { id: 'md', label: 'Markdown (.md)', show: true },
                                    { id: 'json', label: 'بيانات (.json)', show: smartExportProfile.hasCodeOrFiles || smartExportProfile.hasTable }
                                  ]
                                    .filter(fmt => fmt.show)
                                    .map(fmt => (
                                      <button
                                        key={fmt.id}
                                        type="button"
                                        onClick={() => handleExportMessageAsFile(fmt.id as any)}
                                        className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 hover:text-white font-mono transition cursor-pointer"
                                      >
                                        {fmt.label}
                                      </button>
                                    ))}
                                </div>

                                <div className="text-[10px] font-bold text-zinc-500 px-2 py-0.5 border-t border-zinc-800/80 pt-1.5">
                                  تصدير سحابي ذكي (حسب نوع المحتوى)
                                </div>
                                <div className="flex flex-col gap-1 px-1.5 pb-1">
                                  {/* الرسائل والنصوص تتصدر إلى Google Docs */}
                                  {smartExportProfile.hasTextDocument && (
                                    <button
                                      type="button"
                                      disabled={isSavingWorkspace}
                                      onClick={() => handleSaveToGoogleCloud('docs')}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-sky-950/50 border border-zinc-800 hover:border-sky-500/40 text-[11px] text-zinc-200 hover:text-sky-200 flex items-center justify-between transition disabled:opacity-50 cursor-pointer"
                                    >
                                      <span>تصدير الرسالة/النص إلى Google Docs</span>
                                      <span className="text-sky-400 font-bold">Docs ↗</span>
                                    </button>
                                  )}

                                  {/* الجداول فقط تتصدر إلى Google Sheets */}
                                  {smartExportProfile.hasTable && (
                                    <button
                                      type="button"
                                      disabled={isSavingWorkspace}
                                      onClick={() => handleSaveToGoogleCloud('sheets')}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-950/35 hover:bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center justify-between transition disabled:opacity-50 cursor-pointer"
                                    >
                                      <span>تصدير الجدول إلى Google Sheets</span>
                                      <span className="text-emerald-400 font-bold">Sheets ↗</span>
                                    </button>
                                  )}

                                  {/* الملفات والأكواد والمشاريع تتصدر كملف إلى Google Drive */}
                                  <button
                                    type="button"
                                    disabled={isSavingWorkspace}
                                    onClick={() => handleSaveToGoogleCloud('drive')}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-950/50 border border-zinc-800 hover:border-amber-500/40 text-[11px] text-zinc-200 hover:text-amber-200 flex items-center justify-between transition disabled:opacity-50 cursor-pointer"
                                  >
                                    <span>
                                      {smartExportProfile.hasCodeOrFiles
                                        ? 'تصدير الكود/المشروع كملف إلى Drive'
                                        : 'حفظ كملف مستقل في Google Drive'}
                                    </span>
                                    <span className="text-amber-400 font-bold">Drive ↗</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inline User Correction / Teaching Form */}
              {!isUser && showCorrectionInput && onCorrectMessage && (
                <div className="mt-3 p-3 rounded-xl bg-amber-950/20 border border-amber-500/35 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] text-amber-200">
                    <span className="font-bold flex items-center gap-1.5">
                      <MessageSquarePlus size={13} className="text-amber-400" />
                      <span>تصحيح مسار نيكسوس وترسيخ قاعدة دائمة في الذاكرة الأساسية:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCorrectionInput(false)}
                      className="text-zinc-400 hover:text-white text-[10px]"
                    >
                      إغلاق
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={correctionText}
                      onChange={e => setCorrectionText(e.target.value)}
                      placeholder="اكتب التصحيح أو القاعدة التي يجب أن يلتزم بها نيكسوس دائماً..."
                      className="flex-1 bg-zinc-950/90 border border-zinc-800 focus:border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!correctionText.trim()}
                      onClick={() => {
                        if (!correctionText.trim()) return;
                        onCorrectMessage(message.id, sanitizedText.slice(0, 220), correctionText.trim());
                        setCorrectionText('');
                        setShowCorrectionInput(false);
                        setCorrectionSavedBadge(true);
                        setTimeout(() => setCorrectionSavedBadge(false), 5000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                    >
                      <Send size={12} className="rtl:rotate-180" />
                      <span>ترسيخ بالذاكرة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
