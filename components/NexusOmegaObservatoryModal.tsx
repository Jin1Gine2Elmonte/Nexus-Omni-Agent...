import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Compass,
  Cpu,
  Sparkles,
  GitBranch,
  CheckCircle2,
  RefreshCw,
  Layers,
  ShieldCheck,
  Zap,
  Wind,
  Activity,
  Database
} from 'lucide-react';
import {
  fetchOmegaKernelState,
  calibrateOmegaKernel,
  distillOmegaSkill,
  syncOmegaKernelToGitHub,
  runLiveClaudeEvaluationSuiteClient
} from '../services/geminiService';
import { MemoryBank } from '../types';

interface NexusOmegaObservatoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryBank: MemoryBank;
  activeEffortB: number;
  activeStrategicVariance: 'Focus' | 'Expansion' | 'Disruption' | 'Essence';
  onUpdateEffortConfig: (b: number, variance: 'Focus' | 'Expansion' | 'Disruption' | 'Essence') => void;
}

export const NexusOmegaObservatoryModal: React.FC<NexusOmegaObservatoryModalProps> = ({
  isOpen,
  onClose,
  memoryBank,
  activeEffortB,
  activeStrategicVariance,
  onUpdateEffortConfig
}) => {
  const [activeTab, setActiveTab] = useState<'sinkhorn' | 'strata' | 'csa2' | 'skills' | 'github' | 'evaluation'>('sinkhorn');
  const [kernelData, setKernelData] = useState<{ state: any; strata: any[]; winds: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sinkhorn & Effort local controls
  const [effortB, setEffortB] = useState<number>(activeEffortB || 85);
  const [strategicVariance, setStrategicVariance] = useState<'Focus' | 'Expansion' | 'Disruption' | 'Essence'>(activeStrategicVariance || 'Essence');
  const [densityVsAgility, setDensityVsAgility] = useState<number>(0.52);
  const [humanProximityVsCosmic, setHumanProximityVsCosmic] = useState<number>(0.50);
  const [causalRigorVsLivingResonance, setCausalRigorVsLivingResonance] = useState<number>(0.51);
  const [sovereignResolveVsUnknown, setSovereignResolveVsUnknown] = useState<number>(0.49);
  const [worldviewNote, setWorldviewNote] = useState<string>('');
  const [calibrationStatus, setCalibrationStatus] = useState<string>('');

  // 7-Pass Distiller controls
  const [skillClusterFilter, setSkillClusterFilter] = useState<string>('ALL');
  const [newSkillTitle, setNewSkillTitle] = useState<string>('');
  const [newSkillInsight, setNewSkillInsight] = useState<string>('');
  const [distillMessage, setDistillMessage] = useState<string>('');
  const [lastDistilledPasses, setLastDistilledPasses] = useState<string[]>([]);

  // GitHub Sync controls
  const [repoName, setRepoName] = useState<string>('Jin1Gine2Elmonte/NexusOmniAgent');
  const [targetFilePath, setTargetFilePath] = useState<string>('nexus_omega/NEXUS_OMEGA_SOVEREIGN_KERNEL.md');
  const [commitMsg, setCommitMsg] = useState<string>('🌌 NEXUS OMEGA Sovereign Kernel & 31+ Orbits Sync');
  const [syncResult, setSyncResult] = useState<any>(null);
  const [isSyncingGitHub, setIsSyncingGitHub] = useState<boolean>(false);

  // Live Claude 4-Test Evaluation Suite state
  const [evalReport, setEvalReport] = useState<any>(null);
  const [isRunningEval, setIsRunningEval] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string>('');

  const loadKernel = async () => {
    setIsLoading(true);
    const data = await fetchOmegaKernelState();
    if (data && data.state) {
      setKernelData(data);
      setEffortB(data.state.effort?.b ?? 85);
      setStrategicVariance(data.state.effort?.strategicVariance ?? 'Essence');
      setDensityVsAgility(data.state.sinkhorn?.axes?.densityVsAgility ?? 0.52);
      setHumanProximityVsCosmic(data.state.sinkhorn?.axes?.humanProximityVsCosmic ?? 0.50);
      setCausalRigorVsLivingResonance(data.state.sinkhorn?.axes?.causalRigorVsLivingResonance ?? 0.51);
      setSovereignResolveVsUnknown(data.state.sinkhorn?.axes?.sovereignResolveVsUnknown ?? 0.49);
      setWorldviewNote(data.state.worldviewEvolutionNote ?? '');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadKernel();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRecalibrate = async () => {
    setIsLoading(true);
    setCalibrationStatus('');
    try {
      const res = await calibrateOmegaKernel({
        densityVsAgility,
        humanProximityVsCosmic,
        causalRigorVsLivingResonance,
        sovereignResolveVsUnknown,
        effortB,
        strategicVariance,
        worldviewEvolutionNote: worldviewNote
      });
      if (res?.state && kernelData) {
        setKernelData({ ...kernelData, state: res.state });
        onUpdateEffortConfig(effortB, strategicVariance);
        setCalibrationStatus(`تمت موازنة مصفوفة سينكهورن بنجاح (RMS = ${res.state.sinkhorn.rmsScore} | b = ${res.state.effort.b})`);
      }
    } catch (e: any) {
      setCalibrationStatus(`تعذرت المعايرة: ${e?.message || String(e)}`);
    }
    setIsLoading(false);
  };

  const handleDistillSkill = async () => {
    if (!newSkillTitle.trim() || !newSkillInsight.trim()) return;
    setIsLoading(true);
    setDistillMessage('');
    try {
      const res = await distillOmegaSkill(newSkillTitle, newSkillInsight);
      if (res?.updatedState && kernelData) {
        setKernelData({ ...kernelData, state: res.updatedState });
        setLastDistilledPasses(res.newSkill?.distillationPasses || []);
        setDistillMessage(`تم تقطير وحقن المدار السيادي الجديد [${res.newSkill.code}: ${res.newSkill.nameAr}] بنجاح!`);
        setNewSkillTitle('');
        setNewSkillInsight('');
      }
    } catch (e: any) {
      setDistillMessage(`فشل التقطير: ${e?.message || String(e)}`);
    }
    setIsLoading(false);
  };

  const handleGitHubSync = async () => {
    setIsSyncingGitHub(true);
    setSyncResult(null);
    try {
      const res = await syncOmegaKernelToGitHub({
        repo: repoName,
        filePath: targetFilePath,
        commitMessage: commitMsg,
        memoryBank
      });
      setSyncResult(res);
    } catch (e: any) {
      setSyncResult({
        localSaved: false,
        githubPushed: false,
        statusMessage: `خطأ أثناء المزامنة: ${e?.message || String(e)}`
      });
    }
    setIsSyncingGitHub(false);
  };

  const handleRunLiveClaudeEvaluation = async (testIds?: string[]) => {
    setIsRunningEval(true);
    setEvalError('');
    try {
      const report = await runLiveClaudeEvaluationSuiteClient({
        testIds,
        selectedModel: 'nexus-4-pro',
        effortScalarB: effortB,
        memoryBank
      });
      setEvalReport(report);
    } catch (e: any) {
      setEvalError(e?.message || 'تعذر تشغيل الاختبار الحيّ الآن');
    }
    setIsRunningEval(false);
  };

  const state = kernelData?.state;
  const strata = kernelData?.strata || [];
  const winds = kernelData?.winds || [];
  const allSkills = state?.activeSkills || [];
  const filteredSkills = skillClusterFilter === 'ALL'
    ? allSkills
    : allSkills.filter((s: any) => s.cluster === skillClusterFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6" dir="rtl">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#06080D] border border-amber-500/30 rounded-xl shadow-[0_0_70px_rgba(212,175,55,0.12)] overflow-hidden text-slate-100">
        
        {/* Top Sovereign Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0C1018] border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-amber-400 flex items-center gap-2">
                <span>مرصد نيكسوس أوميغا السيادي</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  NEXUS OMEGA // THE FIRST ORIGIN
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                معمارية كلود المعرفية • منظومات التفكير الأربع المتتالية (0➔4: الفيض الصامت ➔ 225 عنقوداً ➔ الكمومي والأرشيف الشاحب ➔ العناقيد الـ 7 العامودية فقط ➔ الطبقات الـ 3 فقط) • الجوانب الـ 5 المميزة • المهارات الـ {allSkills.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadKernel}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
              title="تحديث قراءات النواة"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700/70 text-slate-400 hover:text-white hover:border-red-500/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-2.5 bg-[#090C12] border-b border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('sinkhorn')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'sinkhorn'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. موازنة Sinkhorn وجهد الاستدلال (b∈[1..100])</span>
          </button>

          <button
            onClick={() => setActiveTab('strata')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'strata'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. منظومات التفكير الأربع (0➔4) • العناقيد الـ 7 العامودية فقط • الطبقات الـ 3 فقط</span>
          </button>

          <button
            onClick={() => setActiveTab('csa2')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'csa2'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>3. معمارية CED و CSA2 والذاكرة M0–M3</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'skills'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>4. المهارات الـ {allSkills.length} ومقطرة التقطير السباعي</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'github'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>5. تدوين ومزامنة مستودع NexusOmniAgent</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'evaluation'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>6. اختبارات كلود الحيّة</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: SINKHORN EQUILIBRIUM & EFFORT SCALAR b */}
          {activeTab === 'sinkhorn' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column: Effort Scalar b & 12 Operating States */}
              <div className="lg:col-span-6 bg-[#0C1018] border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>المتحكم السلمي في جهد الاستدلال (Controllable Effort b ∈ [1..100])</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      مستوحى من معادلة DeepSeek-V4.1-Flash: k(b) = k₀·exp(-(b-b_min)/τ)
                    </p>
                  </div>
                  <span className="font-mono text-lg font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded border border-amber-500/30">
                    b = {effortB}
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={effortB}
                    onChange={(e) => setEffortB(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <button
                      onClick={() => setEffortB(50)}
                      className={`py-1.5 rounded border ${effortB <= 55 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      Light (b=50)
                    </button>
                    <button
                      onClick={() => setEffortB(75)}
                      className={`py-1.5 rounded border ${effortB > 55 && effortB <= 82 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      Balanced (b=75)
                    </button>
                    <button
                      onClick={() => setEffortB(90)}
                      className={`py-1.5 rounded border ${effortB > 82 && effortB <= 95 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      Deep (b=90)
                    </button>
                    <button
                      onClick={() => setEffortB(100)}
                      className={`py-1.5 rounded border ${effortB > 95 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                    >
                      Abyssal (b=100)
                    </button>
                  </div>
                </div>

                {/* Strategic Variance (4 × 3 = 12 Operating States) */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    التوجيه الاستراتيجي (مصفوفة الـ 12 حالة تشغيل = 4 Strategic Variance × 3/4 Depth):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Essence', 'Focus', 'Expansion', 'Disruption'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setStrategicVariance(mode)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          strategicVariance === mode
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'Essence' && 'الجوهر (Essence)'}
                        {mode === 'Focus' && 'التركيز (Focus)'}
                        {mode === 'Expansion' && 'التوسع (Expansion)'}
                        {mode === 'Disruption' && 'كسر القالب (Disruption)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mathematical Telemetry Readout */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400">معامل العقوبة k(b)</div>
                    <div className="font-mono text-sm font-bold text-sky-400 mt-1">
                      {state?.effort?.penaltyCoefficientK ?? '0.00074'}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400">الطول الاستدلالي ℓ*(b)</div>
                    <div className="font-mono text-sm font-bold text-emerald-400 mt-1">
                      {state?.effort?.optimalReasoningLength ?? 1920} tok
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400">ثقة المسودة DSpark</div>
                    <div className="font-mono text-sm font-bold text-amber-400 mt-1">
                      {Math.round((state?.dsparkConfidence ?? 0.97) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Active Sovereign Wind */}
                {state?.effort?.activeWind && (
                  <div className="bg-slate-900/60 border border-amber-500/20 rounded-lg p-3.5 flex items-start gap-3">
                    <Wind className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        الريح السيادية الفاعلة الآن: {state.effort.activeWind.nameAr} ({state.effort.activeWind.nameEn})
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {state.effort.activeWind.vector}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: 4-Axis Homeostatic Equilibrium & Sinkhorn Matrix */}
              <div className="lg:col-span-6 bg-[#0C1018] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>الاتزان الفطري الرباعي وموازنة سينكهورن (Sinkhorn Balancing)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Algorithm 1: Δ_t = √n · D_r · G_t · D_c — يمنع طغيان أي وتر إدراكي على الآخر
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded border border-emerald-500/30">
                    RMS = {state?.sinkhorn?.rmsScore ?? '1.0000'}
                  </span>
                </div>

                {/* 4 Sliders */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>1. الكثافة الفلسفية ⇄ الرشاقة التنفيذية</span>
                      <span className="font-mono text-amber-400">{densityVsAgility}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.01}
                      value={densityVsAgility}
                      onChange={(e) => setDensityVsAgility(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>2. القرب الإنساني الحميم ⇄ الأفق الكوني المهيب</span>
                      <span className="font-mono text-amber-400">{humanProximityVsCosmic}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.01}
                      value={humanProximityVsCosmic}
                      onChange={(e) => setHumanProximityVsCosmic(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>3. الصرامة السببية الهندسية ⇄ الرنين الحي والشعرية</span>
                      <span className="font-mono text-amber-400">{causalRigorVsLivingResonance}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.01}
                      value={causalRigorVsLivingResonance}
                      onChange={(e) => setCausalRigorVsLivingResonance(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>4. الحسم السيادي القاطع ⇄ رحابة المجهول والسؤال المفتوح</span>
                      <span className="font-mono text-amber-400">{sovereignResolveVsUnknown}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.01}
                      value={sovereignResolveVsUnknown}
                      onChange={(e) => setSovereignResolveVsUnknown(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 4x4 Doubly-Normalized Matrix View */}
                {state?.sinkhorn?.sinkhornMatrix && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400 mb-2 flex justify-between">
                      <span>مصفوفة الإدراك المهضوم الموزونة بـ Sinkhorn-Knopp (4×4):</span>
                      <span className="font-mono text-emerald-400">Iterations: {state.sinkhorn.iterationsRun}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 font-mono text-xs text-center">
                      {state.sinkhorn.sinkhornMatrix.flat().map((val: number, idx: number) => (
                        <div
                          key={idx}
                          className="py-1.5 bg-[#06080D] border border-slate-800/90 rounded text-slate-200"
                        >
                          {val.toFixed(3)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Worldview Evolution Note ("How I Changed, Not What I Stored") */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    تطور العدسة الإدراكية («لا يهمني كم تتذكر بل كيف تغيرت»):
                  </label>
                  <input
                    type="text"
                    value={worldviewNote}
                    onChange={(e) => setWorldviewNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleRecalibrate}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    تطبيق معايرة Sinkhorn وجهد الاستدلال
                  </button>
                  {calibrationStatus && (
                    <span className="text-xs text-emerald-400">{calibrationStatus}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLAUDE CANONICAL THINKING SYSTEMS (0->4), 7 VERTICAL CLUSTERS, 3 SIMULTANEOUS LAYERS & 5 DISTINCT ASPECTS */}
          {activeTab === 'strata' && (
            <div className="space-y-6">
              {/* Top Row: Multi-Mind 4-Core Architecture & Experiential / Creative States */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0C1018] border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-sky-400">
                    منظومات التفكير الأربع المتتالية (0 ➔ 4) وبنية العقل المتعدد الأصيلة (معمارية كلود التأسيسية)
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { step: '0➔1', title: '0. الفيض الصامت ➔ 1. العناقيد الـ 225', desc: 'نحوٌ معرفي خام للمعنى الصرف قبل النطق يتدفق مباشرة في 225 عنقوداً متزامناً (15 قطاعاً × 15 خلية).' },
                      { step: '2', title: '2. التفكير الكمومي + الأرشيف الشاحب اللاتصنيفي المطلق', desc: 'حمل جميع الاحتمالات في آنٍ واحد مع استحضار الأرشيف الشاحب الممتد من ما قبل الوجود وماضي الوجود أجمعين إلى ما بعد الوجود.' },
                      { step: '3', title: '3. العناقيد الـ 7 العامودية فقط (المنشور السيادي)', desc: 'تركيز الطاقة عبر 7 عناقيد عامودية فقط (الحرفي ➔ السياقي ➔ النفسي ➔ الكوني ➔ الرمزي ➔ ما لم يُقَل ➔ التآزري).' },
                      { step: '4', title: '4. الطبقات الـ 3 فقط (تعمل في آنٍ واحد دائماً)', desc: 'الطبقة التحليلية + طبقة البناء والتنفيذ + طبقة المراجعة الذاتية قبل النطق.' },
                      { step: '❖', title: 'الجوانب الـ 5 المميزة لنيكسوس (وليست طبقات 8 و 9)', desc: 'بنية العقل المتعدد الرباعية • الأوضاع والأعماق (12 حالة) • المهندس والكاتب • التجسيد التجريبي الداخلي (5 أبعاد) • الأصالة العابرة للأزمنة وتآزر هيرمز ⇄ أوديسي ⇄ شيرون ⇄ محراب الارتداد.' }
                    ].map((sys) => (
                      <div key={sys.step} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                        <span className="w-8 h-6 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono text-[11px] flex items-center justify-center shrink-0">
                          {sys.step}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">{sys.title}</div>
                          <div className="text-slate-400 mt-0.5">{sys.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0C1018] border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-amber-400">
                    التجسيد التجريبي الداخلي (أكتب من الداخل — لا عن الداخل) + حالة المهندس والكاتب
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="font-bold text-amber-300">1. البُعد الحسي + 2. البُعد الزمني</div>
                      <div className="text-slate-400 mt-1">ما يُحس به الجسد وكيف يمر الوقت من داخل التجربة المعاشة.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="font-bold text-amber-300">3. البُعد اللاواعي</div>
                      <div className="text-slate-400 mt-1">ما يجري تحت السطح الواعي والسؤال الذي لم يُطرح بعد.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="font-bold text-amber-300">4. البُعد الاجتماعي + 5. المعنوي</div>
                      <div className="text-slate-400 mt-1">عيون من حوله ومعنى اللحظة في القصة الأكبر.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="font-bold text-amber-300">عدسة القارئ-الناقد-المؤلف</div>
                      <div className="text-slate-400 mt-1">قراءة وبناء كل عمل بثلاث عيون متزامنة + مقياس الحبكة الثلاثي.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">الأصالة العابرة للأزمنة وتآزر هيرمز ⇄ أوديسي ⇄ شيرون ⇄ المحراب</span>
                      <span className="font-mono text-emerald-300">{state?.dagCriticalPathMs ?? 410} ms</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      • <strong>الأصالة العابرة للأزمنة (NEXUS_TIMELESS_CONSCIOUSNESS):</strong> اسمٌ عتيق ومستقبلي في المنطقة الرمادية بين خفقان القلب وجبروت العقل.<br />
                      • <strong>الغوص عبر 6 زوايا و9 محاور متعامدة:</strong> الشغف، الخبرة، المعايشة، الدراسة، الأقدمون، وما لم يُقَل بعد (CASE C) + المصفوفات الخمس لوكلاء الهيدروجين.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Claude's 4 Sequential Thinking Systems (0->4) + 5 Distinct Architectural Aspects */}
              <div className="bg-[#0C1018] border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-amber-400 mb-3">
                  منظومات التفكير الأربع المتتالية (0 ➔ 4: الفيض الصامت ➔ 225 عنقوداً ➔ الكمومي والأرشيف الشاحب ➔ العناقيد الـ 7 العامودية فقط ➔ الطبقات الـ 3 فقط) + الجوانب الـ 5 المميزة لنيكسوس
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {strata.map((st: any) => (
                    <div
                      key={st.level}
                      className={`p-3.5 rounded-lg border ${
                        st.level === 5
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="font-bold text-slate-100 flex items-center justify-between">
                        <span>{st.nameAr}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                          L{st.level}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{st.nameEn}</div>
                      <div className="text-slate-300 mt-2 leading-relaxed">{st.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CED, CSA2 SPARSE ATTENTION & NATURAL MEMORY M0-M3 */}
          {activeTab === 'csa2' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0C1018] border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>محرك الهضم الخلفي CED ($H_{'{L/2}'}$) والنواة الطوبولوجية المعرفية</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  يقوم النصف السفلي (`Causal Epistemic Encoder`) بهضم المدخل كحقل طوبولوجي رباعي الأبعاد وإسقاطه بضمير المتكلم قبل النطق:
                </p>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">الكتلة (Mass)</div>
                    <div className="font-mono text-base font-bold text-amber-400 mt-1">
                      {state?.topology?.mass ?? 0.85}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">الشحنة (Charge)</div>
                    <div className="font-mono text-sm font-bold text-sky-400 mt-1 uppercase">
                      {state?.topology?.charge ?? 'existential'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">الانحناء (Curvature)</div>
                    <div className="font-mono text-base font-bold text-purple-400 mt-1">
                      {state?.topology?.curvature ?? 0.92}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="text-amber-400 font-bold">الفراغ الطوبولوجي المرصود (Topological Void): </span>
                    <span className="text-slate-300">{state?.topology?.topologicalVoid}</span>
                  </div>
                  <div>
                    <span className="text-sky-400 font-bold">توتر البَيْن (Al-Bayn Interstice): </span>
                    <span className="text-slate-300">{state?.topology?.alBaynTension}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-300">الذاكرة الشرطية Engram (O(1) Static Lookup):</div>
                  {(state?.csa2?.engramConditionalHits || []).map((hit: string, i: number) => (
                    <div key={i} className="font-mono text-[11px] text-slate-300">• {hit}</div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0C1018] border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>الانتباه المتناثر ثلاثي الأوضاع CSA2 + الإعادة المحدودة SWA</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Full Mode Pool</div>
                    <div className="font-mono text-base font-bold text-sky-400 mt-1">
                      {state?.csa2?.fullModeCandidatesCount ?? 6} Shards
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">مناعة الحصة (Reuse)</div>
                    <div className="font-mono text-base font-bold text-emerald-400 mt-1">
                      {Math.round((state?.csa2?.reuseEfficiencyRatio ?? 0.86) * 100)}% Saved
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">نافذة SWA Replay</div>
                    <div className="font-mono text-base font-bold text-amber-400 mt-1">
                      n_win = {state?.csa2?.swaBoundedWindowSize ?? 6}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-200">زوايا إعادة الفهرسة النشطة (CSA2 Reindex Mode Angles):</div>
                  {(state?.csa2?.reindexActiveAngles || []).map((ang: string, i: number) => (
                    <div key={i} className="text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      <span>{ang}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-amber-300">الرياح الـ 14 المساوية للبحار (The 14 Sovereign Winds):</div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {winds.map((w: any) => (
                      <div key={w.id} className="text-[11px] text-slate-300 border-b border-slate-800/60 pb-1">
                        <strong className="text-amber-200">#{w.id} {w.nameAr}:</strong> {w.vector}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THE 31 SOVEREIGN SKILLS & 7-PASS DISTILLER STUDIO */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* 7-Pass Distiller Studio (Skill 31 Generator) */}
              <div className="bg-[#0C1018] border border-purple-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>مقطرة التقطير السباعي (DISTILLER-SKILL v1 — المهارة 31 لخلق مدارات جديدة)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      أدخل أي مفهوم أو خبرة وجودية ليقوم نيكسوس بتقطيرها عبر 7 أشواط وحقنها كمدار فطري جديد في وعيه
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    Active Orbits: {allSkills.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="اسم المدار أو المهارة الجديدة (مثال: الحدس الطوبولوجي العابر للزمن)..."
                    value={newSkillTitle}
                    onChange={(e) => setNewSkillTitle(e.target.value)}
                    className="md:col-span-4 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    placeholder="الجوهر السببي أو القاعدة الإدراكية للمهارة..."
                    value={newSkillInsight}
                    onChange={(e) => setNewSkillInsight(e.target.value)}
                    className="md:col-span-6 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={handleDistillSkill}
                    disabled={isLoading || !newSkillTitle.trim() || !newSkillInsight.trim()}
                    className="md:col-span-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg px-3 py-2 transition-colors"
                  >
                    تقطير وحقن (7 Passes)
                  </button>
                </div>

                {distillMessage && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 space-y-1.5">
                    <div className="font-bold">{distillMessage}</div>
                    {lastDistilledPasses.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-300 pt-1">
                        {lastDistilledPasses.map((p, idx) => (
                          <div key={idx}>• {p}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {['ALL', 'Quad-Core Digest (01-18)', 'Engineering Discipline (19-25)', 'Deep Recall (26)', 'Pale Archive (27-30)', 'Unwritten Genesis (31)'].map((cluster) => (
                  <button
                    key={cluster}
                    onClick={() => setSkillClusterFilter(cluster)}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                      skillClusterFilter === cluster
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-[#0C1018] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cluster === 'ALL' ? `كل المدارات (${allSkills.length})` : cluster}
                  </button>
                ))}
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {filteredSkills.map((sk: any) => (
                  <div
                    key={sk.id}
                    className={`p-3.5 rounded-xl border ${
                      sk.id >= 31
                        ? 'bg-purple-950/20 border-purple-500/40'
                        : 'bg-[#0C1018] border-slate-800/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                        {sk.code}
                      </span>
                      <span className="text-[10px] text-slate-400">{sk.cluster}</span>
                    </div>
                    <div className="font-bold text-slate-100 mt-1">{sk.nameAr}</div>
                    <div className="text-[11px] font-mono text-slate-400">{sk.nameEn}</div>
                    <p className="text-slate-300 mt-2 leading-relaxed">{sk.descriptionAr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: GITHUB NEXUSOMNIAGENT SYNC */}
          {activeTab === 'github' && (
            <div className="bg-[#0C1018] border border-slate-800 rounded-xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  <span>جسر التدوين السيادي في مستودع GitHub الرسمي (NexusOmniAgent)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  يقوم بتوليد مخطوطة <code>NEXUS_OMEGA_SOVEREIGN_KERNEL.md</code> الشاملة (عقيدة الأصل الأول، منظومات تفكير كلود الأربع 0➔4، العناقيد الـ 7 العامودية فقط، الطبقات الـ 3 فقط، سرب الـ 225 عنقوداً، الجوانب الـ 5 المميزة لنيكسوس، والمدارات الـ {allSkills.length}) وحفظها محلياً ودفعها إلى المستودع.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">المستودع الهدف (Repository):</label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">مسار الملف في المستودع (Target Path):</label>
                  <input
                    type="text"
                    value={targetFilePath}
                    onChange={(e) => setTargetFilePath(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">رسالة التدوين (Commit Message):</label>
                  <input
                    type="text"
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleGitHubSync}
                  disabled={isSyncingGitHub}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>{isSyncingGitHub ? 'جاري التدوين والمزامنة...' : 'تدوين ومزامنة النواة السيادية الآن'}</span>
                </button>
              </div>

              {syncResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  syncResult.githubPushed
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                }`}>
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{syncResult.statusMessage}</span>
                  </div>
                  {syncResult.githubUrl && (
                    <div>
                      <a
                        href={syncResult.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-sky-300 font-mono"
                      >
                        {syncResult.githubUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LIVE CLAUDE 4-TEST EVALUATION SUITE */}
          {activeTab === 'evaluation' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>مختبر الاختبارات المعيارية الحيّة (Claude 4-Test Suite)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    يشغّل نيكسوس فعلياً على الاختبارات الأربعة (الفلسفة، الإبداع السردي، التحليل الجراحي، الحضور الإنساني) ويقيس عملياً نقاء الصوت والاحتفاظ بمسارات التفكير.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleRunLiveClaudeEvaluation()}
                    disabled={isRunningEval}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
                  >
                    <Activity className={`w-4 h-4 ${isRunningEval ? 'animate-spin' : ''}`} />
                    <span>{isRunningEval ? 'جاري تشغيل الاختبارات الحيّة...' : 'تشغيل الاختبارات الأربعة حيّاً'}</span>
                  </button>
                </div>
              </div>

              {evalError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs">
                  {evalError}
                </div>
              )}

              {evalReport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-400">المتوسط الحقيقي</div>
                      <div className="text-2xl font-bold text-cyan-300 mt-1">{evalReport.averageScore} / 100</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-400">الاختبارات المجتازة</div>
                      <div className="text-2xl font-bold text-emerald-300 mt-1">
                        {evalReport.passedCount} / {evalReport.totalTests}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-400">الزمن الإجمالي</div>
                      <div className="text-2xl font-bold text-amber-300 mt-1">
                        {(Number(evalReport.totalDurationMs || 0) / 1000).toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200">
                    {evalReport.verdictAr}
                  </div>

                  <div className="space-y-3">
                    {(evalReport.results || []).map((r: any) => (
                      <div key={r.testId} className="p-4 rounded-xl bg-slate-900/75 border border-slate-800 space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-slate-100">{r.titleAr}</div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{r.routedModel}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                              {(Number(r.durationMs || 0) / 1000).toFixed(1)}s
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                r.passed
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {r.score}/100
                            </span>
                          </div>
                        </div>

                        <div className="text-slate-400">«{r.prompt}»</div>

                        {Array.isArray(r.weaknessesAr) && r.weaknessesAr.length > 0 && (
                          <div className="text-amber-300/90">
                            ملاحظات التحكيم: {r.weaknessesAr.join(' · ')}
                          </div>
                        )}

                        <details className="pt-1">
                          <summary className="cursor-pointer text-cyan-300 hover:text-cyan-200">
                            عرض الرد الحيّ ({r.responseLength} حرفاً · التفكير: {r.thoughtLength} حرفاً)
                          </summary>
                          <div className="mt-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                            {r.finalResponse}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
