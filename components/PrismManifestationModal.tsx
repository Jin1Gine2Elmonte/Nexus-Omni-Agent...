import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Aperture, Download, Image, Terminal, Share2, Loader2, Upload, RefreshCw, Type as TypeIcon, Camera, Layers, Cpu, Zap, Globe } from 'lucide-react';
import { generateVisualArtifact, DeepManifestationState, VisualGenerationOptions } from '../services/geminiService';
import { NexusMultiModelCanvas } from './ChatMessage';

interface PrismManifestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToChat: (imageUrl: string, prompt: string, refinedPrompt: string, style: string) => void;
  selectedChatModel?: string;
  initialPrompt?: string;
  initialEditImage?: { data: string; mimeType: string; previewUrl?: string } | null;
}

export const PrismManifestationModal: React.FC<PrismManifestationModalProps> = ({
  isOpen,
  onClose,
  onShareToChat,
  selectedChatModel = 'nexus-4-pro',
  initialPrompt = '',
  initialEditImage = null
}) => {
  const [prompt, setPrompt] = useState('');
  const [embeddedText, setEmbeddedText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('cosmic_obsidian');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K');
  const [cameraAngle, setCameraAngle] = useState<string>('default');
  const [useOdyssey, setUseOdyssey] = useState<boolean>(false);
  const [enableVisualSearch, setEnableVisualSearch] = useState<boolean>(false);
  const [imageModelFamily, setImageModelFamily] = useState<NonNullable<VisualGenerationOptions['imageModelFamily']>>('nano-banana-2.1');
  const [uploadedImage, setUploadedImage] = useState<{ data: string; mimeType: string; name?: string } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);
  const [progressState, setProgressState] = useState<DeepManifestationState | null>(null);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [resolvedBase64, setResolvedBase64] = useState<string | null>(null);
  const [refinedPrompt, setRefinedPrompt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Sync default image model family to Nano-Banana 2.1 Autonomous Layered Painter
  useEffect(() => {
    setImageModelFamily('nano-banana-2.1');
  }, [selectedChatModel]);

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) setPrompt(initialPrompt);
      if (initialEditImage) {
        setUploadedImage({
          data: initialEditImage.data,
          mimeType: initialEditImage.mimeType || 'image/png',
          name: 'صورة مرجعية للتعديل'
        });
      }
    }
  }, [isOpen, initialPrompt, initialEditImage]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  const modelFamilies = [
    {
      id: 'nano-banana-2.1' as const,
      label: 'Google Nano-Banana 2.1 (الرائد الشامل)',
      badge: 'gemini-nano-banana-2.1',
      desc: 'المحرك الرائد من جوجل بدقة 1K/2K/4K، النسب البانورامية الممتدة (4:1 · 8:1 · 1:4 · 1:8)، ودعم بحث جوجل للويب والصور'
    },
    {
      id: 'gemini-3-pro-image' as const,
      label: 'Google Nano-Banana Pro (دقة الاستوديو 4K)',
      badge: 'gemini-3-pro-image',
      desc: 'نموذج الاستوديو الاحترافي من جوجل للتكوينات الهندسية المعقدة، النصوص الدقيقة، ودقة 2K/4K مع بحث الويب'
    },
    {
      id: 'nano-banana-lite' as const,
      label: 'Google Nano-Banana Lite (توليد وتعديل فائق السرعة)',
      badge: 'gemini-3.1-flash-lite-image',
      desc: 'النموذج السريع الافتراضي من جوجل للتوليد والتعديل اليومي المباشر بالنسب القياسية (1:1 · 16:9 · 9:16 · 4:3 · 3:4)'
    },
    {
      id: 'google-grounded' as const,
      label: 'Google Visual Search Grounding (المعالم والواقع الحي)',
      badge: 'Web + Image Search',
      desc: 'يشغّل gemini-nano-banana-2.1 مع بحث جوجل للويب والصور الحية لتجسيد المعالم والمنتجات والأحداث بدقة واقعية'
    },
    {
      id: 'ideogram-4' as const,
      label: 'وضع النصوص والشعارات الدقيقة (Google Typography)',
      badge: 'Typography 4K',
      desc: 'إعداد مخصّص للنصوص العربية والإنجليزية والملصقات والشعارات عبر Nano-Banana 2.1 و Nano-Banana Pro'
    },
    {
      id: 'qwen-image-2.1' as const,
      label: 'خيار مفتوح المصدر بديل (Qwen-Image-2.1)',
      badge: 'Open-Source Optional',
      desc: 'مسار خارجي اختياري بديل عبر HuggingFace عند الرغبة في تجربة نموذج مفتوح المصدر خارج جوجل'
    }
  ];

  const cameraAngles = [
    { id: 'default', label: 'منظور متوازن (Standard)' },
    { id: 'low_angle', label: 'زاوية منخفضة ملحمية (Low Angle)' },
    { id: 'birds_eye', label: 'رؤية علوية شاملة (Bird’s-Eye)' },
    { id: 'macro_closeup', label: 'لقطة مقربة مجهرية (Macro)' },
    { id: 'wide_isometric', label: 'منظور هندسي واسع (Isometric)' },
    { id: 'dutch_cinematic', label: 'زاوية سينمائية درامية (Dutch)' }
  ];

  const stylePresets = [
    { id: 'cosmic_obsidian', label: 'الظلام الكوني الزمردي (Cosmic Obsidian)', desc: 'سبج كوني عميق مع عروق زمردية ذهبية وهندسة سيادية.' },
    { id: 'hyper_realistic_cinematic', label: 'الواقعية السينمائية (8K IMAX Reality)', desc: 'إضاءة سينمائية حجمية وتفاصيل فيزيائية فائقة الواقعية.' },
    { id: 'tesseract_blueprint', label: 'مخطط القالب الرباعي (Tesseract Blueprint)', desc: 'مخططات هندسية ثلاثية الأبعاد وإحداثيات ضوئية دقيقة.' },
    { id: 'biomechanical', label: 'الماتريكس العضوي السيبراني (Biomechanical)', desc: 'انصهار الأنسجة الحيوية مع ألياف الكربون والتيتانيوم.' },
    { id: 'cyber_alchemical', label: 'الخيمياء الرقمية (Cyber Alchemical)', desc: 'هندسة مقدسة ذهبية ومخطوطات تلتقي بالدوائر الضوئية.' },
    { id: 'surrealist_dream', label: 'البرية السريالية الحالمة (Surrealist Wilderness)', desc: 'فضاءات حالمة متعددة الأبعاد وتفاصيل عضوية حرة.' },
    { id: 'photorealistic', label: 'تصوير فوتوغرافي احترافي (Photorealistic)', desc: 'محاكاة عدسات احترافية وملمس طبيعي غير مصطنع.' },
    { id: 'anime', label: 'أنمي سينمائي فائق (Anime Masterpiece)', desc: 'رسوم فنية غنية بالتفاصيل والإضاءة الدرامية.' }
  ];

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result;
      if (typeof res === 'string') {
        const base64Clean = res.includes(',') ? res.split(',')[1] : res;
        setUploadedImage({
          data: base64Clean,
          mimeType: file.type || 'image/png',
          name: file.name
        });
      }
    };
    reader.readAsDataURL(file);
    if (imageUploadRef.current) imageUploadRef.current.value = '';
  };

  const handleGenerate = async (overrideAngle?: string, overrideOdyssey?: boolean) => {
    if (!prompt.trim() && !uploadedImage) return;
    const activeAngle = overrideAngle || cameraAngle;
    const activeOdyssey = overrideOdyssey !== undefined ? overrideOdyssey : useOdyssey;

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedImg(null);
    setRefinedPrompt('');
    setLogs([
      {
        msg: `🔄 [PRISM CORTEX]: بدء منظومة القالب الهيكلي والبرية البصرية (${imageModelFamily} · ${resolution} · أوديسي: ${activeOdyssey ? 'مفعّل' : 'متوقف'})...`,
        type: 'info'
      }
    ]);
    setProgressState(null);

    try {
      const options: VisualGenerationOptions = {
        imageModelFamily: embeddedText.trim() && imageModelFamily === 'nano-banana-lite' ? 'nano-banana-2.1' : imageModelFamily,
        resolution,
        enableVisualSearch: enableVisualSearch || imageModelFamily === 'google-grounded',
        useOdyssey: activeOdyssey,
        cameraAngle: activeAngle,
        embeddedText: embeddedText.trim() || undefined,
        selectedChatModel
      };

      const result = await generateVisualArtifact(
        prompt.trim() || 'تحسين وإعادة صياغة بصرية للصورة المرفوعة بأعلى دقة',
        aspectRatio,
        selectedStyle,
        '[GOOGLE NANO-BANANA STUDIO MANIFESTATION]',
        activeOdyssey,
        uploadedImage ? { data: uploadedImage.data, mimeType: uploadedImage.mimeType } : undefined,
        (msg, type) => {
          setLogs(prev => [...prev, { msg, type: type || 'info' }]);
        },
        state => {
          setProgressState(state);
        },
        options
      );

      if (result.data && result.data.trim().length > 0) {
        setGeneratedImg(result.data);
        setRefinedPrompt(result.refinedPrompt);
        setLogs(prev => [...prev, { msg: '✅ [GOOGLE IMAGE STUDIO]: اكتمل التجسيد البصري بنجاح بدقة جوجل الأصلية!', type: 'success' }]);
      } else {
        const notice =
          result.finalResponse ||
          'تعذر توليد الصورة عبر نماذج جوجل البصرية (Nano-Banana 2.1 ➔ Nano-Banana Pro ➔ Nano-Banana Lite) في هذه اللحظة.';
        setErrorMsg(notice);
        setLogs(prev => [...prev, { msg: `ℹ️ ${notice}`, type: 'warning' }]);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'تعذر إتمام التوليد في هذه اللحظة.');
      setLogs(prev => [...prev, { msg: `❌ خطأ: ${e?.message || 'انقطاع مؤقت'}`, type: 'error' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareImgToChat = () => {
    if (generatedImg) {
      onShareToChat(generatedImg, prompt, refinedPrompt, selectedStyle);
      onClose();
    }
  };

  const getAspectClass = () => {
    if (aspectRatio === '1:1') return 'aspect-square';
    if (aspectRatio === '9:16') return 'aspect-[9/16]';
    if (aspectRatio === '4:3') return 'aspect-[4/3]';
    if (aspectRatio === '3:4') return 'aspect-[3/4]';
    if (aspectRatio === '4:1') return 'aspect-[4/1]';
    if (aspectRatio === '8:1') return 'aspect-[8/1]';
    if (aspectRatio === '1:4') return 'aspect-[1/4]';
    if (aspectRatio === '1:8') return 'aspect-[1/8]';
    return 'aspect-video';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-arabic" dir="rtl">
      <div className="relative w-full max-w-6xl h-[92vh] bg-zinc-950 border border-emerald-500/35 rounded-2xl shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)] flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Aperture className="animate-spin-slow" size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-emerald-400">
                استوديو الصور الأصلي — Google Nano-Banana Suite (1K / 2K / 4K)
              </h2>
              <p className="text-[11px] text-zinc-400">
                gemini-nano-banana-2.1 · gemini-3-pro-image · gemini-3.1-flash-lite-image · بحث جوجل البصري والنسب البانورامية الممتدة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Google Web + Image Search Grounding Toggle */}
            <button
              type="button"
              onClick={() => setEnableVisualSearch(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                enableVisualSearch || imageModelFamily === 'google-grounded'
                  ? 'bg-sky-950/60 border-sky-500/60 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title="تفعيل بحث جوجل للويب والصور الحية (Web + Image Search) عبر gemini-nano-banana-2.1"
            >
              <Globe size={13} className={enableVisualSearch || imageModelFamily === 'google-grounded' ? 'text-sky-400' : 'text-zinc-500'} />
              <span>بحث جوجل البصري: {enableVisualSearch || imageModelFamily === 'google-grounded' ? 'مفعّل' : 'تلقائي'}</span>
            </button>

            {/* Vision Critic Polish Toggle */}
            <button
              type="button"
              onClick={() => setUseOdyssey(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                useOdyssey
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title="تفعيل المراجعة البصرية الذاتية (Vision Critic) لصقل الصورة تلقائياً فقط عند اكتشاف عيوب"
            >
              <Layers size={13} className={useOdyssey ? 'text-emerald-400' : 'text-zinc-500'} />
              <span>المراجعة البصرية: {useOdyssey ? 'مفعّلة' : 'مباشر (أسرع)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 px-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Studio Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Right/Left Controls Sidebar */}
          <div className="w-full lg:w-[46%] border-l border-zinc-800/80 p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            
            {/* 1. Model Family Selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
                <Cpu size={13} className="text-emerald-400" />
                <span>1. محرك التوليد وتدرج عائلة النموذج</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {modelFamilies.map(mf => (
                  <button
                    key={mf.id}
                    type="button"
                    onClick={() => setImageModelFamily(mf.id)}
                    disabled={isGenerating}
                    className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      imageModelFamily === mf.id
                        ? 'bg-emerald-950/35 border-emerald-500 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.12)]'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white">{mf.label}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        {mf.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 leading-relaxed">{mf.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Resolution & Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">2. دقة التجسيد (Resolution)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['1K', '2K', '4K'] as const).map(res => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      disabled={isGenerating}
                      className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                        resolution === res
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  3. نسبة الأبعاد (9 نسب معتمدة من جوجل)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['16:9', '1:1', '9:16', '4:3', '3:4', '4:1', '8:1', '1:4', '1:8'] as const).map(r => {
                    const isExtended = ['4:1', '8:1', '1:4', '1:8'].includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAspectRatio(r)}
                        disabled={isGenerating}
                        title={isExtended ? 'نسبة ممتدة — تُفعّل Nano-Banana 2.1 / Pro تلقائياً' : 'نسبة قياسية مدعومة على جميع نماذج جوجل'}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                          aspectRatio === r
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                            : isExtended
                            ? 'bg-zinc-900/80 border-zinc-800/80 text-sky-300/80 hover:border-sky-700'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Camera Angle & Perspective */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Camera size={13} className="text-emerald-400" />
                <span>4. زاوية الكاميرا والمنظور الإحداثي</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {cameraAngles.map(cam => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => setCameraAngle(cam.id)}
                    disabled={isGenerating}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] transition-all truncate ${
                      cameraAngle === cam.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Style Presets */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">5. نمط القالب والبرية البصرية</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {stylePresets.map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    disabled={isGenerating}
                    className={`p-2 rounded-xl border text-right transition-all flex flex-col gap-0.5 ${
                      selectedStyle === st.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-zinc-200">{st.label}</span>
                    <span className="text-[10px] text-zinc-400 leading-relaxed">{st.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Image Upload (Image-to-Image Editing) & Embedded Typography Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Upload size={12} className="text-emerald-400" />
                    <span>تعديل صورة مرفوعة</span>
                  </span>
                  {uploadedImage && (
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      إزالة
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={imageUploadRef}
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                {uploadedImage ? (
                  <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-lg border border-emerald-500/30">
                    <img
                      src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`}
                      alt="Uploaded reference"
                      className="w-9 h-9 rounded object-cover border border-zinc-700"
                    />
                    <span className="text-[10px] text-emerald-300 truncate">
                      {uploadedImage.name || 'صورة جاهزة للتعديل'}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageUploadRef.current?.click()}
                    className="py-1.5 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload size={12} />
                    <span>ارفع صورة لتعديلها</span>
                  </button>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-1.5">
                <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                  <TypeIcon size={12} className="text-emerald-400" />
                  <span>نص دقيق داخل الصورة (Nano-Banana Typography)</span>
                </label>
                <input
                  type="text"
                  value={embeddedText}
                  onChange={e => setEmbeddedText(e.target.value)}
                  placeholder="مثال: NEXUS SOVEREIGN أو عنوان عربي..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-zinc-800 focus:border-emerald-500/50 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 7. Main Conceptual Prompt */}
            <div className="flex-1 flex flex-col min-h-[100px]">
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                وصف المشهد أو التعديل المطلوب (القالب الهيكلي + البرية البصرية)
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="صف المشهد أو التعديل المطلوب بالتفصيل... سيقوم النموذج بتفكيك القالب الهيكلي وتوزيع الإحداثيات الحية والبرية البصرية تلقائياً."
                disabled={isGenerating}
                className="w-full flex-1 min-h-[84px] p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-emerald-500/50 text-right resize-none placeholder-zinc-500"
              />
            </div>

            {/* Generate Action Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || (!prompt.trim() && !uploadedImage)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>جاري بناء القالب الإحداثي وتوليد الصورة ({resolution})...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>
                    {uploadedImage ? `تعديل الصورة وتطبيق القالب (${resolution})` : `توليد الصورة بالقالب والبرية البصرية (${resolution})`}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Left Visualization Stage & Live Logs */}
          <div className="flex-1 bg-zinc-950 p-5 flex flex-col gap-4 overflow-y-auto">
            
            {/* Canvas Display Area */}
            <div className="flex-1 relative bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
              {!generatedImg && !isGenerating && !errorMsg && (
                <div className="text-center p-8 text-zinc-500 space-y-3 select-none">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-500/50">
                    <Image size={42} />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-300">استوديو صور جوجل جاهز للتجسيد</h3>
                  <p className="text-[11px] max-w-md mx-auto leading-relaxed text-zinc-400">
                    اختر محرك جوجل المناسب (Nano-Banana 2.1 أو Pro 4K أو Lite السريع)، وحدد الدقة والنسبة بين 9 أبعاد معتمدة، وفعّل البحث البصري الحي أو المراجعة الذاتية عند الحاجة.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center p-6 text-center text-zinc-300">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 animate-spin mb-4 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                    <Aperture size={30} />
                  </div>
                  <p className="text-xs font-bold text-emerald-400 animate-pulse">
                    جاري صهر القالب الهيكلي والبرية البصرية ({resolution})...
                  </p>
                  <p className="text-[11px] mt-2 max-w-md text-zinc-400 leading-relaxed">
                    {progressState?.critique || progressState?.currentPrompt || 'توزيع الإحداثيات المكانية والطبقات الضوئية...'}
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="text-center p-8 text-red-400 space-y-3">
                  <p className="text-xs font-bold">تعذر إتمام التوليد</p>
                  <p className="text-[11px] max-w-md mx-auto leading-relaxed bg-red-950/20 border border-red-900/30 p-3 rounded-xl text-red-300">
                    {errorMsg}
                  </p>
                </div>
              )}

              {generatedImg && (
                <div className="w-full h-full flex flex-col justify-between items-center relative p-3 z-20 gap-3">
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                    {generatedImg.startsWith('NEXUS_MULTI_MODEL_MIX|') ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <NexusMultiModelCanvas
                          urls={generatedImg.split('|').slice(1)}
                          prompt={prompt}
                          onReady={flatB64 => setResolvedBase64(flatB64)}
                          onRegenerateWithAngle={newAngle => {
                            setCameraAngle(newAngle);
                            handleGenerate(newAngle, useOdyssey);
                          }}
                          onToggleOdyssey={() => {
                            const nextOdyssey = !useOdyssey;
                            setUseOdyssey(nextOdyssey);
                            handleGenerate(cameraAngle, nextOdyssey);
                          }}
                          useOdyssey={useOdyssey}
                        />
                      </div>
                    ) : (
                      <img
                        src={generatedImg.startsWith('http') || generatedImg.startsWith('data:') ? generatedImg : `data:image/png;base64,${generatedImg}`}
                        alt="Prism Manifestation"
                        referrerPolicy="no-referrer"
                        className={`max-w-full max-h-full object-contain rounded-xl shadow-2xl bg-black ${getAspectClass()}`}
                        onLoad={() =>
                          setResolvedBase64(
                            generatedImg.startsWith('http') || generatedImg.startsWith('data:')
                              ? generatedImg
                              : `data:image/png;base64,${generatedImg}`
                          )
                        }
                      />
                    )}
                  </div>

                  {/* Quick Post-Generation Action Bar */}
                  <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-2 rounded-xl">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleGenerate()}
                        disabled={isGenerating}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1.5 transition"
                      >
                        <RefreshCw size={12} className="text-emerald-400" />
                        <span>إعادة توليد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextOdyssey = !useOdyssey;
                          setUseOdyssey(nextOdyssey);
                          handleGenerate(cameraAngle, nextOdyssey);
                        }}
                        disabled={isGenerating}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] flex items-center gap-1.5 transition"
                      >
                        <Zap size={12} />
                        <span>{useOdyssey ? 'جرب بدون أوديسي' : 'جرب مع أوديسي'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={
                          resolvedBase64 ||
                          (generatedImg.startsWith('http') || generatedImg.startsWith('data:')
                            ? generatedImg
                            : `data:image/png;base64,${generatedImg}`)
                        }
                        download={`nexus-4k-artifact-${Date.now()}.png`}
                        className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1.5 transition"
                      >
                        <Download size={13} />
                        <span>تحميل ({resolution})</span>
                      </a>

                      <button
                        type="button"
                        onClick={shareImgToChat}
                        className="px-3.5 py-1.5 flex items-center gap-1.5 border border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold rounded-lg text-[11px] transition"
                      >
                        <Share2 size={13} />
                        <span>إدراج في المحادثة</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Coordinate & Mold Stream Logs */}
            <div className="h-36 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col font-mono text-[11px] text-zinc-400">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-900 bg-zinc-900/40 text-zinc-400">
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-emerald-400" />
                  <span>سجل القالب الهيكلي والإحداثيات الحية (Live Coordinate & Mold Telemetry)</span>
                </div>
                <span className="text-[10px] text-emerald-400">
                  {useOdyssey ? 'ODYSSEY + MOLD ACTIVE' : 'DIRECT MOLD ACTIVE'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar bg-black/40">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-1.5 leading-relaxed ${
                      log.type === 'error'
                        ? 'text-red-400 font-bold'
                        : log.type === 'success'
                        ? 'text-emerald-400 font-bold'
                        : log.type === 'warning'
                        ? 'text-amber-400'
                        : log.type === 'info'
                        ? 'text-sky-400'
                        : 'text-zinc-300'
                    }`}
                  >
                    <span className="text-emerald-500 select-none">❯</span>
                    <span className="whitespace-pre-wrap">{log.msg}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
