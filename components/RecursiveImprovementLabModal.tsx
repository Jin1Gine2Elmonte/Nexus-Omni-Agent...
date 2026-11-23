import React, { useState, useEffect } from 'react';
import {
  X,
  FlaskConical,
  CheckCircle2,
  Plus,
  Trash2,
  Zap,
  Award,
  GitBranch,
  Sparkles,
  BookOpen,
  Send,
  RefreshCw,
  ShieldCheck,
  Edit3,
  Cpu,
  Flame,
  Layers,
  Lock,
  TrendingUp,
  Database
} from 'lucide-react';
import {
  MemoryBank,
  RecursiveLabEvaluation,
  UserCorrectionRecord,
  EvolutionarySandboxRun,
  SyntheticTrainingExperience,
  GlobalNexusPowerState
} from '../types';
import {
  DEFAULT_SUCCESS_CRITERIA,
  mergeEvaluationIntoMemoryBank,
  applyExplicitUserCorrectionToMemory,
  mergeSandboxRunAndExperienceIntoMemoryBank,
  createInitialGlobalPowerState
} from '../services/recursiveImprovementLab';
import {
  evaluateTaskInRecursiveLab,
  runEvolutionarySandboxExperiment,
  fetchGlobalNexusPowerState,
  promoteExperienceToGlobalPower
} from '../services/geminiService';

interface RecursiveImprovementLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryBank: MemoryBank;
  onUpdateMemoryBank: (updater: (prev: MemoryBank) => MemoryBank) => void;
  isMaxEffortEnabled: boolean;
  onToggleMaxEffort: (val?: boolean) => void;
  customSuccessCriteria: string[];
  onUpdateSuccessCriteria: (criteria: string[]) => void;
  selectedModel?: string;
  activeSessionId?: string;
  onInjectWinningPathToChat?: (taskPrompt: string, evaluation: RecursiveLabEvaluation) => void;
}

const UNCONVENTIONAL_SEEDS_AR = [
  'بناء معمارية برمجية تعيد هيكلة ذاتها تلقائياً عند تغير كثافة البيانات دون توقف الخدمة',
  'تصميم خوارزمية استنتاج عكسي تكتشف الفجوات المنطقية الخفية قبل كتابة الكود التنفيذي',
  'دمج التفكير الطوبولوجي مع قواعد البيانات الموزعة لمنع التضارب الزمني في الأنظمة الفورية',
  'ابتكار بروتوكول ضغط معرفي يحول آلاف التجارب الطويلة إلى بديهيات رياضية فائقة الكثافة'
];

export const RecursiveImprovementLabModal: React.FC<RecursiveImprovementLabModalProps> = ({
  isOpen,
  onClose,
  memoryBank,
  onUpdateMemoryBank,
  isMaxEffortEnabled,
  onToggleMaxEffort,
  customSuccessCriteria,
  onUpdateSuccessCriteria,
  onInjectWinningPathToChat
}) => {
  const [activeTab, setActiveTab] = useState<
    'sandbox' | 'corpus' | 'lab' | 'criteria' | 'corrections' | 'history'
  >('sandbox');

  // Multi-Path Lab State
  const [taskInput, setTaskInput] = useState('');
  const [newCriterionInput, setNewCriterionInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<RecursiveLabEvaluation | null>(
    memoryBank.recursiveLabHistory?.[0] || null
  );

  // Evolutionary Sandboxing State
  const [sandboxSeedInput, setSandboxSeedInput] = useState('');
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);
  const [autoPromoteSandbox, setAutoPromoteSandbox] = useState(true);
  const [currentSandboxRun, setCurrentSandboxRun] = useState<EvolutionarySandboxRun | null>(
    memoryBank.evolutionarySandboxRuns?.[0] || null
  );
  const [globalPowerState, setGlobalPowerState] = useState<GlobalNexusPowerState>(
    memoryBank.globalPowerSnapshot || createInitialGlobalPowerState()
  );
  const [isPromotingId, setIsPromotingId] = useState<string | null>(null);

  // User Correction Form State
  const [issueSummaryInput, setIssueSummaryInput] = useState('');
  const [correctionRuleInput, setCorrectionRuleInput] = useState('');
  const [correctionCategory, setCorrectionCategory] =
    useState<UserCorrectionRecord['category']>('factual_fix');

  const isSandboxAcceleratorEnabled = Boolean(memoryBank.isSandboxAcceleratorEnabled);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    fetchGlobalNexusPowerState().then(gp => {
      if (mounted && gp) {
        setGlobalPowerState(gp);
      }
    });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!currentSandboxRun && memoryBank.evolutionarySandboxRuns?.length) {
      setCurrentSandboxRun(memoryBank.evolutionarySandboxRuns[0]);
    }
  }, [memoryBank.evolutionarySandboxRuns, currentSandboxRun]);

  if (!isOpen) return null;

  const activeCriteria =
    customSuccessCriteria && customSuccessCriteria.length > 0
      ? customSuccessCriteria
      : DEFAULT_SUCCESS_CRITERIA;

  const handleToggleSandboxAccelerator = async () => {
    const nextEnabled = !isSandboxAcceleratorEnabled;
    onUpdateMemoryBank(prev => ({
      ...prev,
      isSandboxAcceleratorEnabled: nextEnabled,
      lastUpdated: Date.now(),
      version: (Number.isFinite(prev.version) ? prev.version : 1) + 1
    }));

    // When enabling the experimental accelerator for the first time with no prior runs, automatically launch an initial isolated sandbox cycle
    if (
      nextEnabled &&
      (!memoryBank.evolutionarySandboxRuns || memoryBank.evolutionarySandboxRuns.length === 0) &&
      !isRunningSandbox
    ) {
      await handleExecuteEvolutionarySandbox(
        sandboxSeedInput.trim() || UNCONVENTIONAL_SEEDS_AR[0]
      );
    }
  };

  const handleExecuteEvolutionarySandbox = async (overrideSeed?: string) => {
    if (isRunningSandbox) return;
    const targetSeed =
      (overrideSeed !== undefined ? overrideSeed : sandboxSeedInput).trim() ||
      UNCONVENTIONAL_SEEDS_AR[Math.floor(Math.random() * UNCONVENTIONAL_SEEDS_AR.length)];

    setIsRunningSandbox(true);
    try {
      const result = await runEvolutionarySandboxExperiment(
        targetSeed,
        memoryBank,
        autoPromoteSandbox
      );
      if (result) {
        setCurrentSandboxRun(result.sandboxRun);
        setGlobalPowerState(result.globalPower);
        onUpdateMemoryBank(prev => {
          const merged = mergeSandboxRunAndExperienceIntoMemoryBank(
            prev,
            result.sandboxRun,
            autoPromoteSandbox
          );
          return {
            ...merged,
            globalPowerSnapshot: result.globalPower
          };
        });
      }
    } finally {
      setIsRunningSandbox(false);
    }
  };

  const handlePromoteExperience = async (exp: SyntheticTrainingExperience) => {
    if (isPromotingId) return;
    setIsPromotingId(exp.id);
    try {
      const updatedGlobal = await promoteExperienceToGlobalPower(exp, 0);
      if (updatedGlobal) {
        setGlobalPowerState(updatedGlobal);
        const promotedExp: SyntheticTrainingExperience = { ...exp, promotedToGlobalCorpus: true };
        onUpdateMemoryBank(prev => {
          const existingCorpus = prev.syntheticTrainingCorpus || [];
          const nextCorpus = existingCorpus.some(e => e.id === promotedExp.id)
            ? existingCorpus.map(e => (e.id === promotedExp.id ? promotedExp : e))
            : [promotedExp, ...existingCorpus];
          return {
            ...prev,
            syntheticTrainingCorpus: nextCorpus,
            globalPowerSnapshot: updatedGlobal,
            lastUpdated: Date.now(),
            version: (Number.isFinite(prev.version) ? prev.version : 1) + 1
          };
        });
      }
    } finally {
      setIsPromotingId(null);
    }
  };

  const handleAddCriterion = () => {
    const trimmed = newCriterionInput.trim();
    if (!trimmed) return;
    if (!activeCriteria.includes(trimmed)) {
      onUpdateSuccessCriteria([...activeCriteria, trimmed]);
    }
    setNewCriterionInput('');
  };

  const handleRemoveCriterion = (idx: number) => {
    if (activeCriteria.length <= 1) return;
    const next = activeCriteria.filter((_, i) => i !== idx);
    onUpdateSuccessCriteria(next);
  };

  const handleResetCriteria = () => {
    onUpdateSuccessCriteria([...DEFAULT_SUCCESS_CRITERIA]);
  };

  const handleRunMultiPathEvaluation = async () => {
    const cleanPrompt = taskInput.trim();
    if (!cleanPrompt || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const evalResult = await evaluateTaskInRecursiveLab(
        cleanPrompt,
        activeCriteria,
        ['مختبر المسارات الفرعية', 'بروتوكول السؤال الصحيح والتفكير الكمومي', 'الكانفاس البرمجي', 'محرك الـ Tesseract المتوازي'],
        memoryBank
      );
      if (evalResult) {
        setCurrentEvaluation(evalResult);
        onUpdateMemoryBank(prev => mergeEvaluationIntoMemoryBank(prev, evalResult));
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleLaunchInChatWithMaxEffort = () => {
    const cleanPrompt = taskInput.trim();
    if (!cleanPrompt) return;
    if (!isMaxEffortEnabled) {
      onToggleMaxEffort(true);
    }
    onClose();
    if (onInjectWinningPathToChat && currentEvaluation) {
      onInjectWinningPathToChat(cleanPrompt, currentEvaluation);
    }
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionRuleInput.trim()) return;
    onUpdateMemoryBank(
      prev =>
        applyExplicitUserCorrectionToMemory(prev, {
          originalIssueSummary: issueSummaryInput.trim() || 'ملاحظة تصحيحية مباشرة من المستخدم',
          userCorrectionRule: correctionRuleInput.trim(),
          category: correctionCategory
        }).updatedMemoryBank
    );
    setIssueSummaryInput('');
    setCorrectionRuleInput('');
  };

  const labHistory = memoryBank.recursiveLabHistory || [];
  const correctionsList = memoryBank.userCorrections || [];
  const sandboxRunsList = memoryBank.evolutionarySandboxRuns || [];

  // Combine local syntheticTrainingCorpus and global activeGlobalExperiences without duplicates
  const allExperiencesMap = new Map<string, SyntheticTrainingExperience>();
  for (const exp of memoryBank.syntheticTrainingCorpus || []) {
    if (exp && exp.id) {
      allExperiencesMap.set(exp.id, exp);
    }
  }
  for (const exp of globalPowerState.activeGlobalExperiences || []) {
    if (!exp || !exp.id) continue;
    if (!allExperiencesMap.has(exp.id)) {
      allExperiencesMap.set(exp.id, exp);
    } else {
      allExperiencesMap.set(exp.id, {
        ...allExperiencesMap.get(exp.id)!,
        promotedToGlobalCorpus: true
      });
    }
  }
  const allTrainingExperiences = Array.from(allExperiencesMap.values()).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  const safePowerIndex = Number.isFinite(Number(globalPowerState.globalPowerIndex))
    ? Number(globalPowerState.globalPowerIndex)
    : 112.0;
  const powerMultiplier = (safePowerIndex / 100).toFixed(2);
  const totalSandboxCount = Math.max(
    Number.isFinite(Number(globalPowerState.totalSandboxExperiments))
      ? Number(globalPowerState.totalSandboxExperiments)
      : 0,
    sandboxRunsList.length
  );
  const tierProgressPercent = Math.min(
    100,
    Math.max(8, Math.round(((safePowerIndex - 100) / 200) * 100))
  );

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 md:p-5 font-arabic animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#07070c] border border-emerald-500/35 rounded-2xl shadow-[0_0_80px_rgba(16,185,129,0.22)] overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-800/90 bg-gradient-to-l from-emerald-950/35 via-zinc-950 to-purple-950/25">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400">
              <FlaskConical size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-bold text-white">
                  مختبر التطوير الذاتي والمحاكاة التطورية (Recursive Improvement & Sandboxing Lab)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/35 text-purple-300">
                  EVOLUTIONARY SANDBOXING ENGINE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تشغيل نماذج تفكير فرعية (Micro-Models) في بيئة معزولة، توليد سيناريوهات غير تقليدية، وتحويلها لخبرات تدريب داخلية ترفع القوة العامة لنيكسوس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Special Activation Button for Experimental Evolutionary Sandboxing Accelerator */}
            <button
              type="button"
              onClick={handleToggleSandboxAccelerator}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isSandboxAcceleratorEnabled
                  ? 'bg-purple-950/70 border-purple-400/70 text-purple-200 shadow-[0_0_22px_rgba(168,85,247,0.35)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-purple-500/50 hover:text-purple-200'
              }`}
              title="زر التفعيل الخاص لتشغيل مسرّع المحاكاة التطورية التجريبي (Evolutionary Sandboxing Accelerator) وربط نماذج التفكير المعزولة بالذاكرة الأساسية ونظام القوة العام"
            >
              <Flame
                size={14}
                className={
                  isSandboxAcceleratorEnabled
                    ? 'text-purple-400 fill-purple-400 animate-pulse'
                    : 'text-zinc-400'
                }
              />
              <span>
                مسرّع المحاكاة التطورية:{' '}
                {isSandboxAcceleratorEnabled ? 'نشط (بيئة معزولة مفعّلة)' : 'تفعيل المسرّع التجريبي'}
              </span>
            </button>

            {/* Global Toggle for Max Thinking Effort */}
            <button
              type="button"
              onClick={() => onToggleMaxEffort(!isMaxEffortEnabled)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isMaxEffortEnabled
                  ? 'bg-amber-950/60 border-amber-400/60 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <Zap
                size={14}
                className={isMaxEffortEnabled ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}
              />
              <span>
                أقصى جهد تفكير: {isMaxEffortEnabled ? 'مفعّل' : 'الوضع الطبيعي'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
              title="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* General Power System Bar (نظام القوة العام لنيكسوس والخبرات المتولدة) */}
        <div className="px-5 py-3 bg-gradient-to-r from-purple-950/30 via-zinc-950 to-emerald-950/30 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">
                  نظام القوة العام لنيكسوس (General Power System):
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {globalPowerState.evolutionTierLabelAr || 'الطور الثاني: التكيف الاستنتاجي وتصحيح المسارات'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                  معامل القوة: {powerMultiplier}x
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="w-44 sm:w-64 h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-emerald-400 via-teal-400 to-purple-500 transition-all duration-500"
                    style={{ width: `${tierProgressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-300">
                  {safePowerIndex.toFixed(1)} XP
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2">
              <Database size={13} className="text-purple-400" />
              <span className="text-zinc-400">بيانات التدريب والخبرات النشطة:</span>
              <span className="font-mono font-bold text-purple-300">
                {allTrainingExperiences.length}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2">
              <Cpu size={13} className="text-emerald-400" />
              <span className="text-zinc-400">تجارب Micro-Models المعزولة:</span>
              <span className="font-mono font-bold text-emerald-300">
                {totalSandboxCount}
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/35 border border-emerald-500/30 text-[11px] text-emerald-300">
              تأثير القوة العام مفعّل على جميع الجلسات والمستخدمين ✓
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-zinc-800/80 bg-zinc-950/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-zinc-900/50 border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu size={14} className="text-purple-400" />
            <span>محرك المحاكاة التطورية المعزول (Evolutionary Sandboxing)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('corpus')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap ${
              activeTab === 'corpus'
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-200 font-bold'
                : 'bg-zinc-900/50 border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers size={14} className="text-amber-400" />
            <span>الخبرات والمهارات المتولدة ({allTrainingExperiences.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lab')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap ${
              activeTab === 'lab'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-bold'
                : 'bg-zinc-900/50 border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitBranch size={14} className="text-emerald-400" />
            <span>تقييم المسارات الفرعية للمهام</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap ${
              activeTab === 'criteria'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-bold'
                : 'bg-zinc-900/50 border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>معايير النجاح ({activeCriteria.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('corrections')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap ${
              activeTab === 'corrections'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-bold'
                : 'bg-zinc-900/50 border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Edit3 size={14} />
            <span>سجل التصحيحات والتعلم ({correctionsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-bold'
                : 'bg-zinc-900/50 border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen size={14} />
            <span>سجل المسارات ({labHistory.length})</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: EVOLUTIONARY SANDBOXING ENGINE (محرك المحاكاة التطورية المعزول) */}
          {activeTab === 'sandbox' && (
            <div className="space-y-5">
              {/* Sandbox Control Panel */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/20 to-zinc-900/70 border border-purple-500/35 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-purple-400" />
                    <span className="text-xs md:text-sm font-bold text-purple-200">
                      بيئة المحاكاة التطورية المعزولة (Isolated Micro-Models Sandbox)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-[10px] font-mono text-purple-300">
                      ZERO-SIDE-EFFECT ISOLATION
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoPromoteSandbox}
                      onChange={e => setAutoPromoteSandbox(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-purple-500 focus:ring-0"
                    />
                    <span>تحويل النتائج تلقائياً لخبرات تدريب داخلية في نظام القوة العام</span>
                  </label>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  يقوم هذا المحرك بتشغيل 4 نماذج تفكير فرعية مستقلة (<span className="text-purple-300 font-mono">MICRO-ALPHA α</span>، <span className="text-purple-300 font-mono">MICRO-BETA β</span>، <span className="text-purple-300 font-mono">MICRO-GAMMA γ</span>، <span className="text-purple-300 font-mono">MICRO-OMEGA Ω</span>) داخل حاوية معزولة تماماً لتوليد سيناريوهات إبداعية غير تقليدية وتقييمها فورياً من حيث (الأصالة، التماسك المنطقي، وقابلية التعميم)، ثم يدمج النمط الاستنتاجي الفائز في الذاكرة الأساسية ويحوله إلى خبرة تزيد من قوة نيكسوس العامة.
                </p>

                {/* Preset Unconventional Scenario Seeds */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-zinc-400 block">
                    بذور سيناريوهات غير تقليدية جاهزة للاختبار الفوري (أو اكتب سيناريو خاصاً بك أدناه):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {UNCONVENTIONAL_SEEDS_AR.map((seed, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSandboxSeedInput(seed)}
                        className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-500/40 text-[11px] text-zinc-300 hover:text-purple-200 transition text-right"
                      >
                        ⚡ {seed}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2.5">
                  <input
                    type="text"
                    value={sandboxSeedInput}
                    onChange={e => setSandboxSeedInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleExecuteEvolutionarySandbox();
                      }
                    }}
                    placeholder="أدخل موضوعاً أو معضلة معمارية/معرفية لتوليد سيناريو غير تقليدي ومحاكاته عبر نماذج Micro-Models..."
                    className="flex-1 rounded-xl bg-black/75 border border-zinc-800 focus:border-purple-500/60 px-3.5 py-2.5 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleExecuteEvolutionarySandbox()}
                    disabled={isRunningSandbox}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.35)] transition disabled:opacity-40 shrink-0 cursor-pointer"
                  >
                    {isRunningSandbox ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Flame size={15} />
                    )}
                    <span>
                      {isRunningSandbox
                        ? 'جارٍ تشغيل نماذج Micro-Models في البيئة المعزولة...'
                        : 'تشغيل دورة المحاكاة التطورية الآن'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Sandbox Run Display */}
              {currentSandboxRun && currentSandboxRun.synthesizedExperience ? (
                <div className="space-y-4">
                  {/* Scenario Banner */}
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-purple-500/40 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-mono font-bold">
                          {currentSandboxRun.isolationContainerId}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {currentSandboxRun.seedTopicAr}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                        +{currentSandboxRun.powerGain ?? currentSandboxRun.synthesizedExperience.powerDelta} XP قوة عامة مكتسبة
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <span className="text-purple-300 font-bold">تحدي السيناريو غير التقليدي: </span>
                      {currentSandboxRun.unconventionalScenarioAr}
                    </p>
                  </div>

                  {/* 4 Isolated Micro-Models Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {(currentSandboxRun.microModels || []).map(mm => (
                      <div
                        key={mm.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                          mm.isSelectedPattern
                            ? 'bg-purple-950/25 border-purple-400/70 shadow-[0_0_30px_rgba(168,85,247,0.18)]'
                            : 'bg-zinc-900/50 border-zinc-800/90'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                {mm.isSelectedPattern && (
                                  <Award size={14} className="text-amber-400 shrink-0" />
                                )}
                                <span className="text-xs font-bold text-white">
                                  {mm.modelNameAr}
                                </span>
                              </div>
                              <span className="text-[11px] text-purple-300 block mt-0.5">
                                التخصص المعرفي: {mm.specializationAr}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 ${
                                mm.isSelectedPattern
                                  ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {mm.compositeScore}/100
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-300 bg-black/50 p-2.5 rounded-xl border border-zinc-800/80 leading-relaxed">
                            <span className="text-purple-300 font-bold block mb-0.5">
                              الفرضية المعزولة غير التقليدية:
                            </span>
                            {mm.isolatedHypothesisAr}
                          </div>

                          <div className="text-[11px] text-emerald-200 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/30 leading-relaxed">
                            <span className="text-emerald-400 font-bold block mb-0.5">
                              مسار الاستنتاج والنمط المستخلص:
                            </span>
                            {mm.reasoningTraceAr}
                          </div>
                        </div>

                        {/* Immediate Evaluation Metrics */}
                        <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center">
                          <div className="bg-black/40 rounded-lg p-1.5 border border-zinc-800/60">
                            <span className="text-[10px] text-zinc-400 block">الأصالة الإبداعية</span>
                            <span className="text-xs font-mono font-bold text-purple-300">
                              {mm.noveltyScore}%
                            </span>
                          </div>
                          <div className="bg-black/40 rounded-lg p-1.5 border border-zinc-800/60">
                            <span className="text-[10px] text-zinc-400 block">التماسك المنطقي</span>
                            <span className="text-xs font-mono font-bold text-emerald-300">
                              {mm.coherenceScore}%
                            </span>
                          </div>
                          <div className="bg-black/40 rounded-lg p-1.5 border border-zinc-800/60">
                            <span className="text-[10px] text-zinc-400 block">قابلية التعميم</span>
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {mm.generalizabilityScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Distilled Internal Training Experience Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-950/30 via-zinc-900 to-purple-950/30 border border-emerald-500/45 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span className="text-xs md:text-sm font-bold text-white">
                          الخبرة والمهارة المتولدة (بيانات التدريب الداخلية المدمجة):
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                          {currentSandboxRun.synthesizedExperience.linkedSkillId} ·{' '}
                          {currentSandboxRun.synthesizedExperience.domainCategory}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentSandboxRun.synthesizedExperience.promotedToGlobalCorpus ? (
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                            مدمجة في نظام القوة العام لجميع المستخدمين ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handlePromoteExperience(currentSandboxRun.synthesizedExperience)
                            }
                            disabled={
                              isPromotingId === currentSandboxRun.synthesizedExperience.id
                            }
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer"
                          >
                            ترقية ودمج في نظام القوة العام (+
                            {currentSandboxRun.synthesizedExperience.powerDelta} XP)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1">
                        <span className="text-amber-300 font-bold block">
                          القاعدة الاستنتاجية المدمجة في الذاكرة الأساسية:
                        </span>
                        <p className="text-zinc-200 leading-relaxed">
                          {currentSandboxRun.synthesizedExperience.optimalDeductiveRuleAr}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1">
                        <span className="text-purple-300 font-bold block">
                          النمط الاستنتاجي لبيانات التدريب الداخلية:
                        </span>
                        <p className="text-zinc-200 leading-relaxed">
                          {currentSandboxRun.synthesizedExperience.reasoningPatternAr}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Previous Sandbox Runs Strip */}
                  {sandboxRunsList.length > 1 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-zinc-400 block">
                        التجارب المعزولة السابقة ({sandboxRunsList.length}):
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {sandboxRunsList.map(run => (
                          <button
                            key={run.runId}
                            type="button"
                            onClick={() => setCurrentSandboxRun(run)}
                            className={`px-3 py-2 rounded-xl border text-right shrink-0 max-w-xs transition ${
                              currentSandboxRun.runId === run.runId
                                ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className="text-xs font-bold truncate">{run.seedTopicAr}</div>
                            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                              {run.isolationContainerId} · +{run.powerGain ?? 7.5} XP
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 space-y-2">
                  <Cpu size={28} className="mx-auto text-purple-400/80" />
                  <p className="text-xs md:text-sm font-bold text-zinc-200">
                    محرك المحاكاة التطورية المعزول جاهز للتشغيل
                  </p>
                  <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                    اضغط على &quot;تشغيل دورة المحاكاة التطورية الآن&quot; أو فعّل زر &quot;مسرّع المحاكاة التطورية&quot; في أعلى المختبر لتشغيل نماذج Micro-Models الأربعة في بيئة معزولة واستخلاص خبرات ومهارات جديدة ترفع قوة نيكسوس العامة.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERNAL TRAINING CORPUS & GENERATED SKILLS (الخبرات والمهارات المتولدة) */}
          {activeTab === 'corpus' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" />
                    <span>
                      مصفوفة الخبرات والمهارات المتولدة (Synthetic Internal Training Data)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    جميع التجارب الناجحة التي تم تحويلها إلى خبرات ومهارات دائمة تُحقن كبيانات تدريب داخلية وتزيد من قوة نيكسوس بشكل عام.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-mono font-bold">
                    إجمالي القوة العامة: {safePowerIndex.toFixed(1)} XP ({powerMultiplier}x)
                  </span>
                </div>
              </div>

              {allTrainingExperiences.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800/70 space-y-3">
                  <Layers size={26} className="mx-auto text-amber-400/70" />
                  <p className="text-xs text-zinc-400">
                    لا توجد خبرات تدريب داخلية متولدة بعد. قم بتشغيل تجربة في تبويب &quot;محرك المحاكاة التطورية المعزول&quot; لتوليد أول خبرة ومهارة.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sandbox')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
                  >
                    الانتقال إلى محرك المحاكاة التطورية
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {allTrainingExperiences.map(exp => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-amber-500/40 transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {exp.titleAr}
                            </span>
                            <span className="text-[10px] font-mono text-purple-300">
                              {exp.linkedSkillId} · {exp.domainCategory} · وزن تدريبي: {exp.trainingWeight}%
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-mono font-bold shrink-0">
                            +{exp.powerDelta} XP
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400">
                          <span className="text-zinc-300 font-bold">السيناريو: </span>
                          {exp.inputScenarioAr}
                        </p>

                        <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800/80 text-[11px] text-zinc-200 leading-relaxed">
                          <span className="text-amber-300 font-bold block mb-0.5">
                            القاعدة الاستنتاجية المكتسبة:
                          </span>
                          {exp.optimalDeductiveRuleAr}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(exp.createdAt || Date.now()).toLocaleString()}
                        </span>

                        {exp.promotedToGlobalCorpus ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                            مفعّلة في نظام القوة العام ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePromoteExperience(exp)}
                            disabled={isPromotingId === exp.id}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold transition cursor-pointer"
                          >
                            تحويل ودمج في نظام القوة العام
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MULTI-PATH GENERATOR & EVALUATOR */}
          {activeTab === 'lab' && (
            <div className="space-y-5">
              {/* Task Input Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <Sparkles size={14} />
                    <span>اختبار مهمة وتوليد مسارات تفكير فرعية</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    يتم تقييم كل مسار مقابل ({activeCriteria.length}) معايير نجاح ثم دمج الأفضل في الذاكرة الأساسية
                  </span>
                </div>

                <textarea
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  rows={3}
                  placeholder="اكتب المهمة أو المشكلة التي تريد توليد مسارات تفكير فرعية لها وتقييمها وفق معايير النجاح..."
                  className="w-full rounded-xl bg-black/70 border border-zinc-800 focus:border-emerald-500/50 p-3 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400">المعايير النشطة:</span>
                    {activeCriteria.slice(0, 3).map((crit, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 max-w-[220px] truncate"
                      >
                        {crit}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunMultiPathEvaluation}
                      disabled={!taskInput.trim() || isEvaluating}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/50 text-emerald-200 text-xs font-bold transition disabled:opacity-40"
                    >
                      {isEvaluating ? (
                        <RefreshCw size={14} className="animate-spin text-emerald-400" />
                      ) : (
                        <GitBranch size={14} className="text-emerald-400" />
                      )}
                      <span>
                        {isEvaluating ? 'جارٍ توليد وتقييم المسارات...' : 'توليد وتقييم المسارات هنا'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLaunchInChatWithMaxEffort}
                      disabled={!taskInput.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition disabled:opacity-40"
                    >
                      <Send size={13} className="rtl:rotate-180" />
                      <span>تنفيذ شامل في المحادثة بأقصى جهد</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Evaluation Results */}
              {currentEvaluation ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-950/25 border border-emerald-500/35">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <Award size={15} className="text-amber-400" />
                        <span>المسار الفائز: {currentEvaluation.winningBranchNameAr}</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        {currentEvaluation.synthesisJustificationAr}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      تم دمج الخلاصة في المعرفة الأساسية ✓
                    </span>
                  </div>

                  {/* 3 Sub-Thinking Paths Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {(currentEvaluation.paths || []).map(path => (
                      <div
                        key={path.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                          path.isWinner
                            ? 'bg-emerald-950/25 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                            : 'bg-zinc-900/50 border-zinc-800/90'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-white leading-snug">
                              {path.branchNameAr}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold shrink-0 ${
                                path.isWinner
                                  ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {path.totalScore}/100
                            </span>
                          </div>

                          {path.isWinner && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                              <Award size={11} />
                              <span>المسار الأعلى تقييماً والمعتمد للدمج</span>
                            </div>
                          )}

                          <div className="text-[11px] text-zinc-300 bg-black/50 p-2.5 rounded-xl border border-zinc-800/80">
                            <span className="text-emerald-400 font-bold block mb-0.5">
                              الاستراتيجية:
                            </span>
                            {path.strategyAr}
                          </div>

                          <div className="text-[11px] text-zinc-400 leading-relaxed">
                            <span className="text-zinc-200 font-bold">خلاصة التفكير: </span>
                            {path.thoughtSummaryAr}
                          </div>

                          {/* Criteria Scores Breakdown */}
                          <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                            <span className="text-[10px] font-bold text-zinc-400 block">
                              التقييم مقابل معايير النجاح:
                            </span>
                            {(path.criteriaScores || []).map((cs, i) => (
                              <div
                                key={i}
                                className="text-[10px] bg-black/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/60 space-y-0.5"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-zinc-300 truncate">{cs.criterion}</span>
                                  <span className="font-mono text-emerald-400 font-bold">
                                    {cs.score}%
                                  </span>
                                </div>
                                <p className="text-zinc-500 text-[10px]">{cs.reasonAr}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/70 flex flex-wrap gap-1">
                          {(path.usedTools || []).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Extracted Rule Card */}
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/35 space-y-1.5">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                      <ShieldCheck size={15} />
                      <span>القاعدة المنهجية المستخلصة والمدمجة في المعرفة الأساسية للنظام:</span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {currentEvaluation.extractedCoreRuleAr}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 space-y-2">
                  <GitBranch size={28} className="mx-auto text-emerald-400/70" />
                  <p className="text-xs md:text-sm font-bold text-zinc-200">
                    لا توجد تجربة مسارات نشطة حالياً
                  </p>
                  <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                    أدخل أي مهمة في الحقل أعلاه لتوليد 3 مسارات تفكير فرعية وتقييمها، أو قم بتفعيل زر &quot;أقصى جهد تفكير&quot; في شريط المحادثة ليقوم النظام بذلك تلقائياً مع رسائلك.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUCCESS CRITERIA MANAGEMENT */}
          {activeTab === 'criteria' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      معايير النجاح لتقييم المسارات الفرعية
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      حدد المعايير التي يستخدمها النظام للمفاضلة بين مسارات التفكير الفرعية واختيار المسار الفائز.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCriteria}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                  >
                    استعادة الافتراضي
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCriterionInput}
                    onChange={e => setNewCriterionInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCriterion();
                      }
                    }}
                    placeholder="أضف معيار نجاح جديد (مثال: الكفاءة الحسابية واختصار الكود بدون تكرار)..."
                    className="flex-1 rounded-xl bg-black/70 border border-zinc-800 focus:border-emerald-500/50 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                  >
                    <Plus size={14} />
                    <span>إضافة معيار</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {activeCriteria.map((criterion, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/60 border border-zinc-800/90"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-zinc-200 font-medium">{criterion}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(idx)}
                        disabled={activeCriteria.length <= 1}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30"
                        title="حذف المعيار"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: USER CORRECTIONS & CONTINUOUS LEARNING */}
          {activeTab === 'corrections' && (
            <div className="space-y-4">
              <form
                onSubmit={handleSubmitCorrection}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3"
              >
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 size={15} className="text-emerald-400" />
                  <span>إضافة تصحيح أو توجيه دائم للنظام</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  يتعلم النظام تلقائياً عندما تصحح له في المحادثة أو عند الضغط على زر &quot;تصحيح&quot; أسفل أي رسالة، ويمكنك أيضاً تسجيل قاعدة تصحيحية مباشرة هنا ليتم تطبيقها في كل الأوضاع (الوضع الطبيعي ووضع أقصى جهد).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      الخطأ السابق أو السياق المراد تصحيحه (اختياري):
                    </label>
                    <input
                      type="text"
                      value={issueSummaryInput}
                      onChange={e => setIssueSummaryInput(e.target.value)}
                      placeholder="مثال: الإطالة في المقدمات النظرية قبل كتابة الكود..."
                      className="w-full rounded-xl bg-black/70 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">تصنيف التصحيح:</label>
                    <select
                      value={correctionCategory}
                      onChange={e =>
                        setCorrectionCategory(e.target.value as UserCorrectionRecord['category'])
                      }
                      className="w-full rounded-xl bg-black/70 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="factual_fix">تصحيح معلوماتي أو منطقي</option>
                      <option value="methodology">تعديل في منهجية التفكير والحل</option>
                      <option value="style_preference">تفضيل في أسلوب العرض والصياغة</option>
                      <option value="tool_usage">توجيه في استخدام الأدوات والبرمجة</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    القاعدة الصحيحة الواجب التزام النظام بها دائماً:
                  </label>
                  <textarea
                    value={correctionRuleInput}
                    onChange={e => setCorrectionRuleInput(e.target.value)}
                    rows={2}
                    placeholder="اكتب التصحيح أو السلوك المطلوب ليدمجه النظام في ذاكرته الأساسية..."
                    className="w-full rounded-xl bg-black/70 border border-zinc-800 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!correctionRuleInput.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} />
                    <span>حفظ التصحيح في المعرفة الأساسية</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-300">
                  سجل التصحيحات المعتمدة ({correctionsList.length}):
                </h4>
                {correctionsList.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-zinc-900/30 border border-zinc-800/70 text-xs text-zinc-500">
                    لم يتم تسجيل تصحيحات بعد. أي تصحيح تكتبه في المحادثة أو عبر زر &quot;تصحيح&quot; سيظهر هنا تلقائياً.
                  </div>
                ) : (
                  correctionsList.map(corr => (
                    <div
                      key={corr.id}
                      className="p-3.5 rounded-xl bg-black/60 border border-zinc-800/90 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                          {corr.category === 'factual_fix'
                            ? 'تصحيح معلوماتي/منطقي'
                            : corr.category === 'methodology'
                            ? 'منهجية التفكير'
                            : corr.category === 'style_preference'
                            ? 'أسلوب العرض'
                            : 'استخدام الأدوات'}
                        </span>
                        <span className="text-zinc-500 font-mono">
                          {new Date(corr.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">{corr.userCorrectionRule}</p>
                      <p className="text-[11px] text-zinc-400">
                        السياق السابق: {corr.originalIssueSummary}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MERGED EVALUATIONS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {labHistory.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800/70 text-xs text-zinc-500">
                  لا توجد عمليات تقييم مسارات سابقة محفوظة بعد.
                </div>
              ) : (
                labHistory.map(item => (
                  <div
                    key={item.taskId}
                    onClick={() => {
                      setCurrentEvaluation(item);
                      setActiveTab('lab');
                    }}
                    className="p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-300">
                        🏆 {item.winningBranchNameAr}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium line-clamp-2">
                      المهمة: {item.taskPrompt}
                    </p>
                    <p className="text-[11px] text-indigo-300 bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-500/25">
                      القاعدة المستخلصة: {item.extractedCoreRuleAr}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecursiveImprovementLabModal;
