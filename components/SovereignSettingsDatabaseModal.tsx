import React, { useState, useMemo } from 'react';
import {
  X,
  Shield,
  Database,
  Lock,
  Orbit,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
  MapPin,
  UserCheck,
  FileText,
  Aperture,
  Cloud,
  Settings,
  Globe,
  PenTool,
  Volume2,
  Download,
  Upload,
  Trash2,
  BrainCircuit,
  Sliders,
  Plus,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import {
  CognitiveOrbit,
  EncryptedSecretEntry,
  LearnedUserInsight,
  MemoryBank,
  SkillVisualEvolution
} from '../types';
import {
  CANONICAL_31_SKILLS,
  CanonicalSkillDefinition,
  DEFAULT_COGNITIVE_ORBITS,
  PRIMARY_SECURITY_ADMIN_EMAIL,
  AUTHORIZED_SECURITY_EMAILS,
  buildSpecializedSkillPrompt,
  decryptVaultSecretEntry,
  initializeSkillEvolutions,
  isAuthorizedSiteOwnerOrAdmin
} from '../services/sovereignVaultAndOrbitsService';
import { generateVisualArtifact } from '../services/geminiService';

interface SovereignSettingsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryBank: MemoryBank;
  onUpdateMemoryBank: (updater: (prev: MemoryBank) => MemoryBank) => void;
  userEmail?: string | null;
  isCloudConnected: boolean;
  onSyncCloudNow: () => void;
  onOpenAccountModal?: () => void;
  onInjectToChat?: (text: string) => void;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  isWebSearchEnabled?: boolean;
  onToggleWebSearch?: () => void;
  isCanvasMode?: boolean;
  onToggleCanvasMode?: () => void;
  isAutoSpeakEnabled?: boolean;
  onToggleAutoSpeak?: () => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onClearData?: () => void;
  onOpenAgentSuite?: () => void;
  onOpenTerminal?: () => void;
  onOpenGallery?: () => void;
  onOpenScientificLab?: () => void;
  onOpenRecursiveLab?: () => void;
  onOpenOmegaObservatory?: () => void;
  onOpenNexusForge?: () => void;
  onOpenPolymathMatrix?: () => void;
  onOpenOntologicalLayers?: () => void;
}

const AVAILABLE_MODELS = [
  {
    id: 'auto-selection',
    name: 'نيكسوس تلقائي ذكي (موصى به)',
    badge: 'Auto',
    desc: 'يوجّه المهام العميقة إلى نيكسوس نيون 4 (gemini-4-neon)، التدقيق الجذري إلى كاربون 4، والمحادثات السريعة إلى هيدروجين 4'
  },
  {
    id: 'nexus-4-neon',
    name: 'نيكسوس نيون 4 (Neon 4)',
    badge: '4 Neon · XHIGH',
    desc: 'نموذج الجيل الرابع الرائد (gemini-4-neon) للتفكير العميق الممتد XHIGH، الهندسة، البرمجة، والفلسفة المعقدة'
  },
  {
    id: 'nexus-4-carbon',
    name: 'نيكسوس كاربون 4 (Carbon 4)',
    badge: '4 Carbon · Deep',
    desc: 'نموذج الاستدلال الجذري الأعمق (gemini-4-carbon) لتحليل الأسباب الجذرية، البراهين العلمية، والتدقيق المعماري'
  },
  {
    id: 'nexus-4-argon',
    name: 'نيكسوس أرغون 4 (Argon 4)',
    badge: '4 Argon · Pro',
    desc: 'نموذج أرغون 4 من الجيل الرابع (gemini-4-argon) بتوازن عالٍ للمهام الإنتاجية والفكرية المتعددة'
  },
  {
    id: 'nexus-3.1-pro',
    name: 'نيكسوس 3.1 برو (Gemini 3.1 Pro)',
    badge: '3.1 Pro · Deep',
    desc: 'نموذج نيكسوس المبني على Gemini 3.1 Pro (gemini-3.1-pro-preview) للاستدلال العميق والهندسة والكتابة عالية الكثافة'
  },
  {
    id: 'nexus-4-hydrogen',
    name: 'نيكسوس هيدروجين 4 (Hydrogen 4)',
    badge: '4 Hydro · Fast',
    desc: 'نموذج هيدروجين 4 فائق السرعة (gemini-4-hydrogen) مع دعم التفكير المتدرج حتى XHIGH والاستجابة الرشيقة'
  },
  {
    id: 'nexus-3-flash',
    name: 'نيكسوس 3 فلاش (Gemini 3 Flash)',
    badge: '3 Flash · HIGH',
    desc: 'نموذج الجيل الثالث المتكامل (gemini-3-flash-preview) مع التفكير العميق HIGH وتماسك تحليلي عالٍ'
  },
  {
    id: 'nexus-2.5-flash',
    name: 'نيكسوس 2.5 فلاش (Flash 2.5)',
    badge: '2.5 Flash',
    desc: 'نموذج فلاش المستقر (gemini-2.5-flash) بميزانية تفكير متكاملة وموثوقية عالية في المهام اليومية'
  },
  {
    id: 'nexus-3.1-flash-lite',
    name: 'نيكسوس 3.1 لايت (Flash Lite)',
    badge: '3.1 Lite',
    desc: 'النموذج الخفيف فائق الاستجابة (gemini-3.1-flash-lite) للدردشة السريعة والمهام الموفّرة للحصة'
  }
];

const QUICK_PERSONALIZATION_TRAITS = [
  'البدء بالخلاصة التنفيذية أولاً',
  'دعم الإجابات بأمثلة عملية وتطبيقية',
  'استخدام الجداول والمقارنات المنظمة',
  'نقد الأفكار وكشف الثغرات المنطقية',
  'اقتراح خطوات تالية ذكية بعد كل إجابة',
  'تجنب المقدمات الطويلة والحشو اللغوي',
  'شرح المفاهيم المعقدة بتدرج واضح',
  'كتابة أكواد كاملة جاهزة للإنتاج بدون اختصار'
];

export const SkillSpecializedEmblemSVG: React.FC<{
  skill: CanonicalSkillDefinition;
  evolution: SkillVisualEvolution;
  size?: number;
}> = ({ skill, evolution, size = 68 }) => {
  const tier = evolution.visualTier || 1;
  const quality = evolution.visualQualityScore || 56;
  const sides = skill.polygonSides || 6;
  const rings = Math.min(5, skill.orbitalRings + (tier - 1));
  const center = 50;

  const buildPolygonPoints = (radius: number, rotationDeg = 0, count = sides) => {
    const pts: string[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (rotationDeg * Math.PI) / 180;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const gradId = `skill_grad_${skill.id}`;

  return (
    <div
      className="relative flex items-center justify-center rounded-xl overflow-hidden border border-zinc-800 bg-[#07070c] shrink-0"
      style={{ width: size, height: size }}
    >
      {evolution.customGeneratedImageUrl ? (
        <img
          src={
            evolution.customGeneratedImageUrl.startsWith('data:') ||
            evolution.customGeneratedImageUrl.startsWith('http')
              ? evolution.customGeneratedImageUrl
              : `data:image/jpeg;base64,${evolution.customGeneratedImageUrl}`
          }
          alt={skill.nameAr}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={skill.primaryColor} stopOpacity={0.35} />
              <stop offset="65%" stopColor={skill.secondaryColor} stopOpacity={0.12} />
              <stop offset="100%" stopColor="#07070c" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill={`url(#${gradId})`} />
          {Array.from({ length: rings }).map((_, rIdx) => {
            const radius = 16 + rIdx * (26 / Math.max(1, rings - 1));
            return (
              <circle
                key={rIdx}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={rIdx % 2 === 0 ? skill.primaryColor : skill.secondaryColor}
                strokeWidth="0.7"
                opacity={0.45}
              />
            );
          })}
          <polygon
            points={buildPolygonPoints(26, skill.number * 11)}
            fill="none"
            stroke={skill.primaryColor}
            strokeWidth="1.2"
            opacity="0.85"
          />
          <circle cx="50" cy="50" r="4.5" fill={skill.primaryColor} />
        </svg>
      )}
      <div
        className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none"
        style={{
          backgroundColor: `${skill.primaryColor}20`,
          color: skill.primaryColor
        }}
      >
        {quality}%
      </div>
    </div>
  );
};

export const SovereignSettingsDatabaseModal: React.FC<SovereignSettingsDatabaseModalProps> = ({
  isOpen,
  onClose,
  memoryBank,
  onUpdateMemoryBank,
  userEmail,
  isCloudConnected,
  onSyncCloudNow,
  onOpenAccountModal,
  selectedModel = 'auto-selection',
  onSelectModel,
  isWebSearchEnabled = false,
  onToggleWebSearch,
  isCanvasMode = false,
  onToggleCanvasMode,
  isAutoSpeakEnabled = false,
  onToggleAutoSpeak,
  onExportData,
  onImportData,
  onClearData,
  onOpenAgentSuite,
  onOpenTerminal,
  onOpenScientificLab,
  onOpenRecursiveLab,
  onOpenOmegaObservatory,
  onOpenNexusForge,
  onOpenPolymathMatrix,
  onOpenOntologicalLayers
}) => {
  const [activeTab, setActiveTab] = useState<
    'personalization' | 'appearance' | 'models' | 'agents' | 'memory' | 'capabilities' | 'data'
  >('personalization');
  const [showAdvancedPersonalization, setShowAdvancedPersonalization] = useState<boolean>(false);
  const [newFactInput, setNewFactInput] = useState<string>('');
  const [revealedSecretIds, setRevealedSecretIds] = useState<Record<string, boolean>>({});
  const [generatingSkillId, setGeneratingSkillId] = useState<string | null>(null);

  const userPreferences = {
    userDisplayName: '',
    userBioOrRole: '',
    responseTone: 'balanced' as const,
    responseLength: 'balanced' as const,
    thinkingDepth: 'balanced' as const,
    keepThinkingExpanded: false,
    keepThinkingVisibleAfterFinish: false,
    showThinkingProcess: true,
    sendOnEnter: false,
    fontSize: 'medium' as const,
    customInstructions: '',
    interfaceLanguage: 'ar' as const,
    responseLanguage: 'auto' as const,
    uiDensity: 'comfortable' as const,
    accentTheme: 'emerald' as const,
    voicePersona: 'calm' as const,
    enableOpenClawExternalWeb: true,
    openClawAutoExtractUrls: true,
    openClawCrawlDepth: 'deep' as const,
    personalizationTraits: [] as string[],
    formattingStyle: 'structured_bullets' as const,
    proactivityStyle: 'suggest_next_steps' as const,
    advancedRolePersona: '',
    advancedStyleAndVoice: '',
    advancedAvoidRules: '',
    savedUserFacts: [] as string[],
    ...(memoryBank.userPreferences || {})
  };

  const updatePreferences = (patch: Partial<typeof userPreferences>) => {
    onUpdateMemoryBank(prev => ({
      ...prev,
      userPreferences: {
        ...userPreferences,
        ...(prev.userPreferences || {}),
        ...patch
      },
      lastUpdated: Date.now()
    }));
  };

  const toggleTrait = (trait: string) => {
    const current = userPreferences.personalizationTraits || [];
    const exists = current.includes(trait);
    const next = exists ? current.filter(t => t !== trait) : [...current, trait];
    updatePreferences({ personalizationTraits: next });
  };

  const handleAddSavedFact = () => {
    const clean = newFactInput.trim();
    if (!clean) return;
    const current = userPreferences.savedUserFacts || [];
    if (!current.includes(clean)) {
      updatePreferences({ savedUserFacts: [clean, ...current] });
    }
    setNewFactInput('');
  };

  const handleRemoveSavedFact = (factToRemove: string) => {
    const current = userPreferences.savedUserFacts || [];
    updatePreferences({ savedUserFacts: current.filter(f => f !== factToRemove) });
  };

  const learnedInsights: LearnedUserInsight[] = memoryBank.learnedInsights || [];
  const encryptedVault: EncryptedSecretEntry[] = memoryBank.encryptedVault || [];
  const cognitiveOrbits: CognitiveOrbit[] =
    memoryBank.cognitiveOrbits && memoryBank.cognitiveOrbits.length > 0
      ? memoryBank.cognitiveOrbits
      : DEFAULT_COGNITIVE_ORBITS;
  const skillEvolutions = useMemo(
    () => initializeSkillEvolutions(memoryBank.skillEvolutions),
    [memoryBank.skillEvolutions]
  );

  const isSecurityAdmin = isAuthorizedSiteOwnerOrAdmin(userEmail, memoryBank);

  if (!isOpen) return null;

  const handleGenerateSpecializedSkillImage = async (skill: CanonicalSkillDefinition) => {
    if (generatingSkillId) return;
    setGeneratingSkillId(skill.id);
    try {
      const evo = skillEvolutions[skill.id];
      const nextUsage = (evo?.usageCount || 1) + 1;
      const nextScore = Math.min(100, (evo?.visualQualityScore || 60) + 5);
      const enrichedPrompt = buildSpecializedSkillPrompt(skill, nextUsage, nextScore);
      const result = await generateVisualArtifact(
        enrichedPrompt,
        '1:1',
        'cybernetic-sacred',
        `Domain Specialization ${skill.nameAr}: ${skill.descriptionAr}`,
        false
      );
      if (result && result.data) {
        onUpdateMemoryBank(prev => {
          const map = initializeSkillEvolutions(prev.skillEvolutions);
          const nextTier: 1 | 2 | 3 | 4 =
            nextScore >= 85 ? 4 : nextScore >= 72 ? 3 : nextScore >= 60 ? 2 : 1;
          map[skill.id] = {
            ...map[skill.id],
            usageCount: nextUsage,
            visualQualityScore: nextScore,
            visualTier: nextTier,
            specializedPromptSignature: enrichedPrompt,
            customGeneratedImageUrl: result.data,
            lastUsedAt: Date.now()
          };
          return {
            ...prev,
            skillEvolutions: map,
            lastUpdated: Date.now()
          };
        });
      }
    } catch (err) {
      console.error('Failed to synthesize specialized skill emblem:', err);
    } finally {
      setGeneratingSkillId(null);
    }
  };

  const SECTIONS = [
    {
      id: 'personalization',
      label: 'تخصيص نيكسوس والأسلوب',
      subtitle: 'الهوية، النبرة، والخيارات المتقدمة',
      icon: Sliders
    },
    {
      id: 'appearance',
      label: 'المظهر والصوت واللغات',
      subtitle: 'الخط، السمة اللونية، والنطق الصوتي',
      icon: Settings
    },
    {
      id: 'models',
      label: 'النماذج وعمق التفكير',
      subtitle: 'المحرك الافتراضي ورؤية خطوات التفكير',
      icon: BrainCircuit
    },
    {
      id: 'agents',
      label: 'الأذرع الوكيلية والتيرمنال',
      subtitle: 'الأدوات الحية والتشغيل أثناء التفكير',
      icon: Sparkles
    },
    {
      id: 'memory',
      label: 'الذاكرة والخصوصية',
      subtitle: 'التعلم التلقائي والبيانات المشفرة',
      icon: Shield,
      badge: `${learnedInsights.length + encryptedVault.length}`
    },
    {
      id: 'capabilities',
      label: 'المدارات والقدرات الـ 56',
      subtitle: 'مدار التنبؤ المسبق للأفكار والقدرات السيادية الـ 56',
      icon: Orbit
    },
    {
      id: 'data',
      label: 'الحساب والمزامنة السحابية',
      subtitle: 'المزامنة التلقائية والنسخ الاحتياطي',
      icon: Cloud
    }
  ] as const;

  return (
    <div dir="rtl" className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 md:p-6 font-arabic">
      <div className="w-full max-w-5xl h-[88vh] bg-[#090a0f] border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-[#06070b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">الإعدادات والتخصيص الشخصي</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                خصص أسلوب نيكسوس ونبرته، تفضيلاتك الشخصية، النماذج، والذاكرة المتزامنة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Split View: Sidebar Navigation + Section Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Right Sidebar Navigation (RTL) */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-l border-zinc-800/80 bg-[#07080d] p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0">
            {SECTIONS.map(sec => {
              const Icon = sec.icon;
              const active = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id as any)}
                  className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-right transition-all border shrink-0 md:w-full cursor-pointer ${
                    active
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                      : 'bg-transparent hover:bg-zinc-900/60 border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-900 text-zinc-500'}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${active ? 'text-white' : 'text-zinc-300'}`}>
                        {sec.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate hidden md:block">
                        {sec.subtitle}
                      </div>
                    </div>
                  </div>
                  {'badge' in sec && sec.badge && (
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Main Section Body */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-[#090a0f]">
            {/* SECTION 1: PERSONALIZATION & CUSTOM INSTRUCTIONS STUDIO */}
            {activeTab === 'personalization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">تخصيص نيكسوس وتوجيه أسلوبه (Personalization)</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    اختر التخصيصات الجاهزة بنقرة واحدة، أو افتح خيارات التخصيص المتقدمة لضبط النبرة والأسلوب والقواعد الخاصة بك بالتفصيل
                  </p>
                </div>

                {/* 1. Identity & What Nexus Should Know About You */}
                <div className="p-4 rounded-xl bg-zinc-900/45 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                      <User size={14} className="text-emerald-400" />
                      <span>هويتك وما يجب أن يعرفه نيكسوس عنك</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-300 block font-medium">بماذا تحب أن يناديك نيكسوس؟</label>
                      <input
                        type="text"
                        value={userPreferences.userDisplayName}
                        onChange={e => updatePreferences({ userDisplayName: e.target.value })}
                        placeholder="مثال: أحمد، سارة، المهندس..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/55 border border-zinc-800 focus:border-emerald-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-300 block font-medium">مجال عملك أو تخصصك واهتماماتك</label>
                      <input
                        type="text"
                        value={userPreferences.userBioOrRole}
                        onChange={e => updatePreferences({ userBioOrRole: e.target.value })}
                        placeholder="مثال: مهندس برمجيات، باحث أكاديمي، رائد أعمال..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/55 border border-zinc-800 focus:border-emerald-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Saved Personal Facts (مثل ميزة المعلومات المحفوظة في المنصات العالمية) */}
                  <div className="pt-2 border-t border-zinc-800/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-200">
                        معلومات وحقائق محفوظة يتذكرها نيكسوس دائماً عنك
                      </label>
                      <span className="text-[10px] text-zinc-500">
                        {(userPreferences.savedUserFacts || []).length} معلومة محفوظة
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFactInput}
                        onChange={e => setNewFactInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSavedFact();
                          }
                        }}
                        placeholder="أضف معلومة يتذكرها نيكسوس دائماً (مثال: أبرمج بلغة TypeScript و Python، أفضل الشرح بالمعادلات والأمثلة)..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-black/55 border border-zinc-800 focus:border-emerald-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSavedFact}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>إضافة</span>
                      </button>
                    </div>

                    {(userPreferences.savedUserFacts || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(userPreferences.savedUserFacts || []).map((fact, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-200"
                          >
                            <span>{fact}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSavedFact(fact)}
                              className="text-zinc-500 hover:text-red-400 transition"
                              title="حذف"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Quick Personalization Options: Tone, Traits & Formatting */}
                <div className="p-4 rounded-xl bg-zinc-900/45 border border-zinc-800/80 space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-zinc-100 block">
                      1. النبرة والشخصية العامة لنيكسوس (Tone & Persona)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {[
                        { id: 'balanced', label: 'متوازن وطبيعي', desc: 'واضح، رصين، ومناسب لجميع المهام' },
                        { id: 'professional', label: 'احترافي وتنفيذي', desc: 'رسمي، منظم، ومركز على النتائج' },
                        { id: 'friendly', label: 'ودود ومحفز', desc: 'أسلوب تفاعلي دافئ ومشجع' },
                        { id: 'direct_candid', label: 'صريح وحاسم', desc: 'مباشر جداً وبدون أي مقدمات أو مجاملات' },
                        { id: 'academic', label: 'أكاديمي وبحثي عميق', desc: 'تحليل منهجي معمق ومصطلحات دقيقة' },
                        { id: 'simple', label: 'مبسط وسلس', desc: 'يشرح أعقد الأفكار بأبسط عبارة ممكنة' }
                      ].map(tone => {
                        const active = userPreferences.responseTone === tone.id;
                        return (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() => updatePreferences({ responseTone: tone.id as any })}
                            className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                              active
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                                : 'bg-black/40 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="text-xs font-bold flex items-center justify-between">
                              <span>{tone.label}</span>
                              {active && <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1">{tone.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Selectable Behavioral Traits */}
                  <div className="space-y-2.5 pt-3 border-t border-zinc-800/70">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-100 block">
                        2. سمات الأسلوب المفضلة (يمكنك اختيار أكثر من خيار)
                      </label>
                      <span className="text-[10px] text-emerald-400">
                        {(userPreferences.personalizationTraits || []).length} مفعّل
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PERSONALIZATION_TRAITS.map(trait => {
                        const isSelected = (userPreferences.personalizationTraits || []).includes(trait);
                        return (
                          <button
                            key={trait}
                            type="button"
                            onClick={() => toggleTrait(trait)}
                            className={`px-3 py-2 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/45 border-emerald-500/50 text-emerald-200 font-bold'
                                : 'bg-black/45 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            {isSelected && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                            <span>{trait}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Formatting & Proactivity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-800/70">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-200 block">3. هيكلة وطريقة عرض الإجابات</label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'structured_bullets', label: 'نقاط منظمة وعناوين فرعية واضحة' },
                          { id: 'executive_summary_first', label: 'الخلاصة التنفيذية أولاً ثم التفاصيل' },
                          { id: 'step_by_step', label: 'شرح متسلسل خطوة بخطوة' },
                          { id: 'comparative_tables', label: 'التركيز على الجداول والمقارنات' }
                        ].map(fmt => {
                          const active = (userPreferences.formattingStyle || 'structured_bullets') === fmt.id;
                          return (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => updatePreferences({ formattingStyle: fmt.id as any })}
                              className={`w-full px-3 py-2 rounded-xl border text-right text-xs flex items-center justify-between transition cursor-pointer ${
                                active
                                  ? 'bg-emerald-950/35 border-emerald-500/50 text-white font-bold'
                                  : 'bg-black/40 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                              }`}
                            >
                              <span>{fmt.label}</span>
                              {active && <CheckCircle2 size={13} className="text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-200 block">4. مستوى المبادرة والتفاعل</label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'suggest_next_steps', label: 'اقتراح خطوات تالية وأفكار تطويرية' },
                          { id: 'strict_to_question', label: 'الالتزام الصارم بحدود السؤال فقط' },
                          { id: 'ask_clarifying_questions', label: 'طرح أسئلة توضيحية في المهام المعقدة' },
                          { id: 'critical_challenger', label: 'مناقشة الفرضيات وتحدي الأفكار علمياً' }
                        ].map(pr => {
                          const active = (userPreferences.proactivityStyle || 'suggest_next_steps') === pr.id;
                          return (
                            <button
                              key={pr.id}
                              type="button"
                              onClick={() => updatePreferences({ proactivityStyle: pr.id as any })}
                              className={`w-full px-3 py-2 rounded-xl border text-right text-xs flex items-center justify-between transition cursor-pointer ${
                                active
                                  ? 'bg-emerald-950/35 border-emerald-500/50 text-white font-bold'
                                  : 'bg-black/40 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                              }`}
                            >
                              <span>{pr.label}</span>
                              {active && <CheckCircle2 size={13} className="text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Expandable Advanced Personalization Drawer (خيارات التخصيص المتقدمة) */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPersonalization(prev => !prev)}
                    className="w-full p-4 flex items-center justify-between text-right hover:bg-emerald-950/20 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <Sliders size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          خيارات التخصيص المتقدمة (تخصيص يدوي شامل للأسلوب والنبرة والقواعد)
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          اضغط هنا لفتح الحقول المتقدمة وكتابة توصيف دقيق للأسلوب، الدور المهني، والممنوعات الخاصة بك
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-emerald-300 flex items-center gap-1.5 shrink-0">
                      <span>{showAdvancedPersonalization ? 'إخفاء الخيارات المتقدمة' : 'فتح الخيارات المتقدمة'}</span>
                      {showAdvancedPersonalization ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>

                  {showAdvancedPersonalization && (
                    <div className="p-4 pt-2 border-t border-emerald-500/20 space-y-4 bg-[#08090e]">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-200 block">
                          1. الدور المهني أو التخصص الافتراضي لنيكسوس معك
                        </label>
                        <input
                          type="text"
                          value={userPreferences.advancedRolePersona}
                          onChange={e => updatePreferences({ advancedRolePersona: e.target.value })}
                          placeholder="مثال: تصرف ككبير مهندسي برمجيات ومحلل نظم خبير، أو شريك بحثي أكاديمي..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-zinc-800 focus:border-emerald-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-200 block">
                          2. كيف تريد أن يصوغ نيكسوس ردوده ونبرته بالتفصيل؟ (الأسلوب، المفردات، وطريقة الشرح)
                        </label>
                        <textarea
                          rows={3}
                          value={userPreferences.advancedStyleAndVoice}
                          onChange={e => updatePreferences({ advancedStyleAndVoice: e.target.value })}
                          placeholder="اكتب بحرية كيف تريد أسلوب الحديث (مثال: استخدم لغة عربية فصيحة وواضحة، ادخل في صلب الموضوع مباشرة، اشرح السبب الهندسي وراء كل قرار برمجي، واستخدم أمثلة واقعية)..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-zinc-800 focus:border-emerald-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-200 block">
                          3. القواعد الصارمة والممنوعات (ما الذي يجب أن يتجنبه نيكسوس دائماً؟)
                        </label>
                        <textarea
                          rows={2}
                          value={userPreferences.advancedAvoidRules}
                          onChange={e => updatePreferences({ advancedAvoidRules: e.target.value })}
                          placeholder="مثال: لا تكتب مقدمات إنشائية طويلة، لا تختصر الأكواد البرمجية بـ TODO، لا تكرر السؤال قبل الإجابة..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-zinc-800 focus:border-emerald-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-200 block">
                          4. توجيهات وتعليمات إضافية دائمة في جميع المحادثات
                        </label>
                        <textarea
                          rows={3}
                          value={userPreferences.customInstructions}
                          onChange={e => updatePreferences({ customInstructions: e.target.value })}
                          placeholder="أي تعليمات إضافية تود تطبيقها بشكل دائم على جميع ردود ومشاريع نيكسوس..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-zinc-800 focus:border-emerald-500/50 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: APPEARANCE, AUDIO & LANGUAGES */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">المظهر، الصوت، واللغات</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    تحكم في حجم الخط، كثافة عرض المحادثة، السمة اللونية، والنطق الصوتي
                  </p>
                </div>

                {/* Typography & UI Density */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                  <div className="text-xs font-bold text-zinc-200">المظهر، حجم الخط، وكثافة الواجهة</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 block">حجم خط الرسائل والقراءة</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'small', label: 'صغير' },
                          { id: 'medium', label: 'متوسط (قياسي)' },
                          { id: 'large', label: 'كبير وواضح' }
                        ].map(size => {
                          const active = userPreferences.fontSize === size.id;
                          return (
                            <button
                              key={size.id}
                              type="button"
                              onClick={() => updatePreferences({ fontSize: size.id as any })}
                              className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                                active
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                  : 'bg-black/40 hover:bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}
                            >
                              {size.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 block">كثافة تخطيط المحادثة</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'compact', label: 'مدمج ومكثف' },
                          { id: 'comfortable', label: 'مريح ومتوازن' },
                          { id: 'spacious', label: 'واسع وهادئ' }
                        ].map(d => {
                          const active = (userPreferences.uiDensity || 'comfortable') === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => updatePreferences({ uiDensity: d.id as any })}
                              className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                                active
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                  : 'bg-black/40 hover:bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Accent Theme Selection */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs text-zinc-400 block">السمة اللونية للواجهة</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { id: 'emerald', label: 'زمردي سيادي', dot: '#10b981' },
                        { id: 'sapphire', label: 'أزرق ياقوتي', dot: '#0ea5e9' },
                        { id: 'amber', label: 'كهرماني ذهبي', dot: '#f59e0b' },
                        { id: 'violet', label: 'بنفسجي طيفي', dot: '#8b5cf6' }
                      ].map(theme => {
                        const active = (userPreferences.accentTheme || 'emerald') === theme.id;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => updatePreferences({ accentTheme: theme.id as any })}
                            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                              active
                                ? 'bg-zinc-900 border-emerald-500/50 text-white'
                                : 'bg-black/40 hover:bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.dot }} />
                            <span>{theme.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Language & Audio Settings */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-200 block">لغة الردود المفضلة</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {[
                        { id: 'auto', label: 'تلقائي ذكي حسب لغة رسالتك', desc: 'يتحدث بنفس اللغة التي تخاطبه بها' },
                        { id: 'ar', label: 'العربية الفصحى الاحترافية دائماً', desc: 'صياغة عربية واضحة لجميع المواضيع' },
                        { id: 'bilingual_tech', label: 'عربية مع إبقاء المصطلحات التقنية بالإنجليزية', desc: 'مناسب للبرمجة والهندسة والعلوم' },
                        { id: 'en', label: 'English Always', desc: 'الرد باللغة الإنجليزية دائماً' }
                      ].map(rl => {
                        const active = (userPreferences.responseLanguage || 'auto') === rl.id;
                        return (
                          <button
                            key={rl.id}
                            type="button"
                            onClick={() => updatePreferences({ responseLanguage: rl.id as any })}
                            className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                              active
                                ? 'bg-emerald-950/35 border-emerald-500/50 text-white'
                                : 'bg-black/40 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="text-xs font-bold">{rl.label}</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">{rl.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Audio / TTS Settings */}
                  <div className="pt-3 border-t border-zinc-800/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 mt-0.5">
                        <Volume2 size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">القراءة الصوتية التلقائية للردود</div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          تشغيل النطق الصوتي تلقائياً فور اكتمال الإجابة
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleAutoSpeak}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 cursor-pointer ${
                        isAutoSpeakEnabled
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isAutoSpeakEnabled ? 'مفعّل تلقائياً' : 'يدوي عند الطلب'}
                    </button>
                  </div>

                  {/* Chat Enter Key Behavior */}
                  <div className="pt-3 border-t border-zinc-800/70 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white">وظيفة زر السطر الجديد (Enter) في حقل الكتابة</div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        افتراضياً، الضغط على زر السطر ينزل سطراً جديداً لكتابة مريحة، وزر الإرسال يرسل الرسالة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePreferences({ sendOnEnter: !userPreferences.sendOnEnter })}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 cursor-pointer ${
                        userPreferences.sendOnEnter
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {userPreferences.sendOnEnter ? 'إرسال بزر Enter' : 'نزول سطر جديد (موصى به)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: MODELS & THINKING DEPTH */}
            {activeTab === 'models' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">نماذج نيكسوس وعمق التفكير</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    اختر النموذج الافتراضي وتحكم في سلوك عرض التفكير التحليلي
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {AVAILABLE_MODELS.map(model => {
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => onSelectModel && onSelectModel(model.id)}
                        className={`p-3.5 rounded-xl border text-right transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/35 border-emerald-500/50 text-white'
                            : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800/90 text-zinc-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{model.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{model.desc}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Thinking Controls */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white">إبقاء قسم «رؤية التفكير» مفتوحاً بعد انتهاء الرد</div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        يمكنك دائماً فتح أو طي خطوات التفكير من الرسالة، أو إبقائها مفتوحة تلقائياً هنا
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updatePreferences({
                          keepThinkingExpanded: !userPreferences.keepThinkingExpanded,
                          keepThinkingVisibleAfterFinish: !userPreferences.keepThinkingVisibleAfterFinish
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 cursor-pointer ${
                        userPreferences.keepThinkingExpanded || userPreferences.keepThinkingVisibleAfterFinish
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {userPreferences.keepThinkingExpanded || userPreferences.keepThinkingVisibleAfterFinish
                        ? 'مفتوح دائماً'
                        : 'مطوي (يُفتح بالضغط)'}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">مستوى عمق التفكير التحليلي</div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        حدد مقدار التحليل المنطقي قبل كتابة الرد النهائي
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'fast', label: 'سريع' },
                        { id: 'balanced', label: 'متوازن' },
                        { id: 'deep', label: 'عميق جداً' }
                      ].map(depth => {
                        const active = (userPreferences.thinkingDepth || 'balanced') === depth.id;
                        return (
                          <button
                            key={depth.id}
                            type="button"
                            onClick={() => updatePreferences({ thinkingDepth: depth.id as any })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              active
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {depth.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: AGENTIC ARMS, INTERNAL TERMINAL & EXTERNAL WEB TOOLS */}
            {activeTab === 'agents' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">الأذرع الوكيلية المدمجة والتيرمنال الداخلي</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    تعمل الأذرع الوكيلية والتيرمنال الداخلي تلقائياً ضمن عقل النموذج أثناء التفكير، ويمكنك ضبط إعداداتها هنا
                  </p>
                </div>

                {/* Quick Launch Portals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                        <Globe size={15} className="text-cyan-400" />
                        <span>منظومة الأذرع الوكيلية المدمجة</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        تعمل الأذرع الوكيلية تلقائياً في الوقت الحقيقي أثناء تفكير نيكسوس للوصول للمواقع الخارجية واستخراج البيانات والهياكل البرمجية.
                      </p>
                    </div>
                    {onOpenAgentSuite && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAgentSuite();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-cyan-600/25 hover:bg-cyan-600/35 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition cursor-pointer"
                      >
                        استعراض لوحة الأذرع الوكيلية
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <PenTool size={15} className="text-emerald-400" />
                        <span>التيرمنال الداخلي لنيكسوس</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        تنفيذ أوامر الشبكة والبرمجة (<code className="font-mono text-emerald-300">curl</code>، <code className="font-mono text-emerald-300">python3</code>، <code className="font-mono text-emerald-300">node</code>) وفحص الروابط والـ APIs الخارجية.
                      </p>
                    </div>
                    {onOpenTerminal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenTerminal();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition cursor-pointer"
                      >
                        فتح التيرمنال الداخلي
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin & Sovereign Labs Launchpad inside Settings */}
                {isSecurityAdmin && (
                  <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/35 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-amber-300">بوابات المشرف والمختبرات السيادية</div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          وصول مباشر لجميع كبسولات المختبر العلمي، مختبر التطوير الذاتي، مرصد أوميغا، ومصنع نيكسوس
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-mono">
                        ADMIN ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {onOpenScientificLab && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenScientificLab();
                          }}
                          className="p-2.5 rounded-xl bg-emerald-950/35 hover:bg-emerald-950/55 border border-emerald-500/40 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-emerald-200">المختبر العلمي الشامل</div>
                          <div className="text-[10px] text-emerald-400/80 mt-0.5">الكبسولات الـ 7 والحقل المغمور</div>
                        </button>
                      )}

                      {onOpenRecursiveLab && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenRecursiveLab();
                          }}
                          className="p-2.5 rounded-xl bg-amber-950/35 hover:bg-amber-950/55 border border-amber-500/40 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-amber-200">مختبر التطوير الذاتي</div>
                          <div className="text-[10px] text-amber-400/80 mt-0.5">مسارات التفكير الفرعية</div>
                        </button>
                      )}

                      {onOpenOmegaObservatory && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenOmegaObservatory();
                          }}
                          className="p-2.5 rounded-xl bg-purple-950/35 hover:bg-purple-950/55 border border-purple-500/40 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-purple-200">مرصد نيكسوس أوميغا</div>
                          <div className="text-[10px] text-purple-400/80 mt-0.5">مصفوفة Sinkhorn والطبقات</div>
                        </button>
                      )}

                      {onOpenNexusForge && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenNexusForge();
                          }}
                          className="p-2.5 rounded-xl bg-cyan-950/35 hover:bg-cyan-950/55 border border-cyan-500/40 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-cyan-200">مصنع نيكسوس البرمجي</div>
                          <div className="text-[10px] text-cyan-400/80 mt-0.5">Nexus Forge X</div>
                        </button>
                      )}

                      {onOpenPolymathMatrix && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenPolymathMatrix();
                          }}
                          className="p-2.5 rounded-xl bg-teal-950/35 hover:bg-teal-950/55 border border-teal-500/40 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-teal-200">مصفوفة الـ 56 مهارة سيادية</div>
                          <div className="text-[10px] text-teal-400/80 mt-0.5">العقل الموسوعي المتكامل</div>
                        </button>
                      )}

                      {onOpenOntologicalLayers && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenOntologicalLayers();
                          }}
                          className="p-2.5 rounded-xl bg-indigo-950/35 hover:bg-indigo-950/55 border border-indigo-500/40 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-indigo-200">الطبقات الأنطولوجية التسع</div>
                          <div className="text-[10px] text-indigo-400/80 mt-0.5">هندسة النواة الكاملة</div>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Real-Time External Access Settings */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white">التشغيل اللحظي للأذرع الوكيلية والتيرمنال أثناء تفكير نيكسوس</div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        يسمح لنيكسوس باستدعاء الأذرع الوكيلية والتيرمنال الداخلي وبيئة بايثون تلقائياً في الوقت الحقيقي أثناء التفكير
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updatePreferences({
                          enableOpenClawExternalWeb: !userPreferences.enableOpenClawExternalWeb
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 cursor-pointer ${
                        userPreferences.enableOpenClawExternalWeb
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {userPreferences.enableOpenClawExternalWeb ? 'مفعّل تلقائياً' : 'متوقف'}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">مستوى استخلاص بيانات المواقع والأدوات الحية</div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        اختر عمق استخراج عناصر الصفحة والروابط عند فحص موقع خارجي أثناء التفكير
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'fast', label: 'ملخص سريع' },
                        { id: 'deep', label: 'زحف عميق + روابط' },
                        { id: 'schema_full', label: 'DOM + JSON Schema' }
                      ].map(m => {
                        const active = (userPreferences.openClawCrawlDepth || 'deep') === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => updatePreferences({ openClawCrawlDepth: m.id as any })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              active
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Core Conversational Tools */}
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 mt-0.5">
                        <Globe size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">البحث الشبكي الحي</div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          يعمل تلقائياً عند السؤال عن معلومات حديثة، أو يمكنك تثبيته ليعمل في كل الرسائل
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleWebSearch}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 cursor-pointer ${
                        isWebSearchEnabled
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {isWebSearchEnabled ? 'مثبّت دائماً' : 'تلقائي ذكي'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 mt-0.5">
                        <PenTool size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">مساحة الكانفاس التفاعلية (Canvas)</div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          تفتح لوحة الكانفاس الجانبية تلقائياً للمشاريع البرمجية والمستندات والبطاقات التعليمية
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleCanvasMode}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 cursor-pointer ${
                        isCanvasMode
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {isCanvasMode ? 'مفعّل' : 'تلقائي ذكي'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: MEMORY & PRIVACY VAULT */}
            {activeTab === 'memory' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <Shield size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">بريد الأمان المعتمد:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                          {PRIMARY_SECURITY_ADMIN_EMAIL}
                        </span>
                        {isSecurityAdmin && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                            موثق
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        يتم تشفير البيانات الحساسة (العناوين، الأسماء، كلمات المرور) وحفظ ما يتعلمه النظام من تفضيلاتك تلقائياً.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-zinc-800 text-center">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {learnedInsights.length}
                      </div>
                      <div className="text-[10px] text-zinc-500">تفضيل متعلّم</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-zinc-800 text-center">
                      <div className="text-xs font-bold text-cyan-400 font-mono">
                        {encryptedVault.length}
                      </div>
                      <div className="text-[10px] text-zinc-500">بيانات مشفرة</div>
                    </div>
                  </div>
                </div>

                {/* Encrypted Secrets */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <Lock size={14} className="text-cyan-400" />
                    <span>البيانات السرية المشفرة تلقائياً</span>
                  </h3>
                  {encryptedVault.length === 0 ? (
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400">
                      لا توجد بيانات سرية محفوظة حالياً — أي عنوان أو كلمة سر تذكرها في الحوار يتم تشفيرها تلقائياً هنا.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {encryptedVault.slice(0, 12).map(sec => {
                        const isRevealed = Boolean(revealedSecretIds[sec.id]);
                        const decryptedText = isRevealed
                          ? decryptVaultSecretEntry(sec, 'nexus-sovereign-default')
                          : `•••••••••••• (${sec.redactionToken})`;
                        return (
                          <div
                            key={sec.id}
                            className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                                {sec.secretType === 'address' && <MapPin size={12} className="text-emerald-400" />}
                                {sec.secretType === 'password' && <Key size={12} className="text-amber-400" />}
                                {sec.secretType === 'identity_name' && (
                                  <UserCheck size={12} className="text-purple-400" />
                                )}
                                {(sec.secretType === 'api_key' || sec.secretType === 'private_note') && (
                                  <FileText size={12} className="text-cyan-400" />
                                )}
                                <span className="truncate">{sec.label}</span>
                              </div>
                              <div className="text-[11px] font-mono text-zinc-400 truncate">
                                {decryptedText}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedSecretIds(prev => ({ ...prev, [sec.id]: !prev[sec.id] }))
                              }
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                              title={isRevealed ? 'إخفاء' : 'إظهار'}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Learned User Preferences */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <Database size={14} className="text-emerald-400" />
                    <span>ما تعلمه النظام تلقائياً من أسلوبك ورسائلك</span>
                  </h3>
                  {learnedInsights.length === 0 ? (
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400">
                      يتعلم النظام تلقائياً من تفضيلاتك واهتماماتك مع استمرار المحادثات لتحسين دقة الردود.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {learnedInsights.slice(0, 10).map(item => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-300">{item.topic}</span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              تحسين الجودة +{item.qualityImpactScore}%
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300">{item.learnedRule}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 6: ORBITS & SPECIALIZED CAPABILITIES */}
            {activeTab === 'capabilities' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">المدارات المعرفية المكتشفة حسب اهتماماتك</h3>
                    <p className="text-xs text-zinc-400">
                      تتطور جودة هذه المدارات تلقائياً مع استخدامك في البرمجة، التحليل، التصميم، والكتابة
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cognitiveOrbits.map(orbit => (
                      <div
                        key={orbit.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                          orbit.isDiscovered
                            ? 'bg-zinc-900/60 border-zinc-700'
                            : 'bg-zinc-950/50 border-zinc-800/60 opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: orbit.colorHex || '#10b981' }}
                            />
                            <h4 className="text-xs font-bold text-white">{orbit.nameAr}</h4>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {orbit.isDiscovered ? `${orbit.qualityScore}%` : 'تلقائي'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{orbit.descriptionAr}</p>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${orbit.qualityScore}%`,
                              backgroundColor: orbit.colorHex || '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specialized Visual & Cognitive Capabilities */}
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-white">الأيقونات والقدرات التخصصية السيادية المتطورة (56 قدرة كاملة)</h3>
                    <p className="text-xs text-zinc-400">
                      تتضمن قراءة طبقات القصد الثلاث (SKILL-01)، بروتوكول السؤال الصحيح والتفكير الكمومي المتزامن، محرك الـ Tesseract المتوازي، وجميع القدرات الإجرائية الـ 56
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CANONICAL_31_SKILLS.map(skill => {
                      const evo = skillEvolutions[skill.id];
                      const isGenerating = generatingSkillId === skill.id;
                      return (
                        <div
                          key={skill.id}
                          className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/90 flex items-center gap-3"
                        >
                          <SkillSpecializedEmblemSVG skill={skill} evolution={evo} size={64} />
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-xs font-bold text-white truncate">{skill.nameAr}</h4>
                            <p className="text-[11px] text-zinc-400 line-clamp-1">{skill.descriptionAr}</p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-zinc-500">
                                الاستخدام: {evo.usageCount}
                              </span>
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() => handleGenerateSpecializedSkillImage(skill)}
                                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 transition"
                              >
                                {isGenerating ? (
                                  <RefreshCw size={10} className="animate-spin" />
                                ) : (
                                  <Aperture size={10} />
                                )}
                                <span>{isGenerating ? 'جارٍ التوليد...' : 'تحديث الصورة'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 7: UNIFIED FIREBASE CLOUD ACCOUNT & ACCOUNT-ISOLATED SYNCHRONIZATION */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Cloud size={15} className="text-emerald-400" />
                      <span>التخزين السحابي المعزول عبر Firebase</span>
                      {isCloudConnected && (
                        <span className="text-[10px] text-emerald-400 font-normal">
                          · متصل ومعزول للحساب الحالي
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {isCloudConnected
                        ? `حسابك المتصل (${userEmail || userPreferences.userDisplayName || 'نشط'}) يحفظ ويزامن جميع المحادثات والدفاتر المعرفية والتخصيصات تلقائياً عبر Firebase بمعزل تام عن أي حساب آخر على نفس المتصفح.`
                        : 'قم بتسجيل الدخول عبر Firebase (متاح لجميع الحسابات) لحفظ ومزامنة محادثاتك بمعزل تام لكل حساب.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCloudConnected ? (
                      <>
                        {onOpenAccountModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenAccountModal();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <User size={13} />
                            <span>تبديل الحساب</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onSyncCloudNow}
                          className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>مزامنة Firebase الآن</span>
                        </button>
                      </>
                    ) : (
                      onOpenAccountModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAccountModal();
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <User size={13} />
                          <span>تسجيل الدخول عبر Firebase</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Zero-Leakage Clean Project ZIP Export Banner */}
                <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                      <Shield size={14} className="text-emerald-400" />
                      <span>تصدير نسخة نظيفة من المشروع للمشاركة (.ZIP) — بدون أي تسريب</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      يحزم الكود المصدري الكامل لنيكسوس مع استبعاد جميع المحادثات، الذاكرة الشخصية، الملفات المستوردة، ومفاتيح التخزين السحابي (Firebase/Firestore) ليعمل لدى الطرف الآخر بوضع محلي معزول 100%.
                    </p>
                  </div>
                  <a
                    href="/api/nexus/export-clean-project-zip"
                    download="Nexus_Sovereign_Clean_Distributable.zip"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shrink-0 transition cursor-pointer shadow-sm"
                  >
                    <Download size={14} />
                    <span>تنزيل المشروع النظيف (.ZIP)</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {onExportData && (
                    <button
                      type="button"
                      onClick={onExportData}
                      className="p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-right space-y-1 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <Download size={14} />
                        <span>تصدير نسخة احتياطية</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        تنزيل ملف JSON يحتوي على محادثاتك وذاكرة النظام
                      </p>
                    </button>
                  )}

                  {onImportData && (
                    <button
                      type="button"
                      onClick={onImportData}
                      className="p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-right space-y-1 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                        <Upload size={14} />
                        <span>استيراد نسخة احتياطية</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        استعادة محادثاتك وإعداداتك من ملف محفوظ مسبقاً
                      </p>
                    </button>
                  )}

                  {onClearData && (
                    <button
                      type="button"
                      onClick={onClearData}
                      className="p-4 rounded-xl bg-red-950/20 hover:bg-red-950/35 border border-red-900/40 text-right space-y-1 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                        <Trash2 size={14} />
                        <span>مسح الذاكرة المحلية</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        إعادة ضبط البيانات المحلية المحفوظة على هذا المتصفح
                      </p>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignSettingsDatabaseModal;
