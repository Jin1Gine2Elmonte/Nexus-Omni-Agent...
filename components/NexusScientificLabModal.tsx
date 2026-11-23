import React, { useState, useEffect } from 'react';
import {
  X,
  FlaskConical,
  Cpu,
  GitBranch,
  Play,
  FileCode,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Plus,
  ExternalLink,
  Layers,
  Database,
  Compass,
  Sliders,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Zap,
  Download,
  Terminal,
  Send
} from 'lucide-react';

interface NexusScientificLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubsystemModal?: (target: string) => void;
  onInjectToChat?: (text: string) => void;
}

export const NexusScientificLabModal: React.FC<NexusScientificLabModalProps> = ({
  isOpen,
  onClose,
  onOpenSubsystemModal,
  onInjectToChat
}) => {
  const [activeTab, setActiveTab] = useState<
    'recursion_sanctum' | 'option1' | 'atmospheres' | 'capsules' | 'submerged_field' | 'horizon_git'
  >('recursion_sanctum');
  const [labData, setLabData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Sovereign Recursion Sanctum (محراب الارتداد السيادي — nexus_forge_engine.py)
  const [genomeConceptInput, setGenomeConceptInput] = useState<string>(
    'Optimizing Planetary Trajectory Algorithm & Sovereign Recursion Sanctum Genesis'
  );
  const [genomeCustomPythonCode, setGenomeCustomPythonCode] = useState<string>('');
  const [isExecutingGenome, setIsExecutingGenome] = useState<boolean>(false);
  const [genomeTraceLogs, setGenomeTraceLogs] = useState<string[]>([]);
  const [genomesList, setGenomesList] = useState<
    Array<{
      filename: string;
      concept: string;
      createdAt: number;
      sizeBytes: number;
      content: string;
    }>
  >([]);
  const [selectedGenomeFilename, setSelectedGenomeFilename] = useState<string>('');

  // Pillar 5: Unified Submerged Field (KHORA-01 × MNEMOS-SILT v2 × CHIRON-ARMS v2 × SIGIL-19 × OP-VEIL)
  const [submergedState, setSubmergedState] = useState<any>(null);
  const [liveFieldSnapshot, setLiveFieldSnapshot] = useState<any>(null);
  const [submergedQuery, setSubmergedQuery] = useState<string>(
    'صهر سياق الذاكرة طويلة الأمد والأذرع الوكيلية الاستباقية ومولّد المهارة 19 في حقل موحد تحت الحجاب السيادي'
  );
  const [isExecutingSubmergedPass, setIsExecutingSubmergedPass] = useState<boolean>(false);
  const [isSanitizingVault, setIsSanitizingVault] = useState<boolean>(false);
  const [sanitizationReport, setSanitizationReport] = useState<any>(null);
  const [isSavingSubmergedConfig, setIsSavingSubmergedConfig] = useState<boolean>(false);

  // Pillar 1: Option 1 Hermes Skill Tree & Memory form state
  const [skillBranch, setSkillBranch] = useState<'creator_understanding' | 'world_laws' | 'emergent_skills'>('emergent_skills');
  const [skillTitle, setSkillTitle] = useState<string>('');
  const [skillInsight, setSkillInsight] = useState<string>('');
  const [newMemoCategory, setNewMemoCategory] = useState<string>('ASI_DISCOVERY');
  const [newMemoContent, setNewMemoContent] = useState<string>('');

  // Pillar 2: Cognitive Atmospheres, Alchemical Synthesis & Episodic Distillation
  const [causalWeight, setCausalWeight] = useState<number>(98);
  const [episodicWeight, setEpisodicWeight] = useState<number>(97);
  const [skillGenesisWeight, setSkillGenesisWeight] = useState<number>(98);
  const [uncreatedHorizonIndex, setUncreatedHorizonIndex] = useState<number>(100);
  const [dynamicModulation, setDynamicModulation] = useState<boolean>(true);
  const [taskContextInput, setTaskContextInput] = useState<string>('');
  const [isModulating, setIsModulating] = useState<boolean>(false);
  const [synthesisRationale, setSynthesisRationale] = useState<string>('');
  const [distillFocusInput, setDistillFocusInput] = useState<string>('');
  const [isDistilling, setIsDistilling] = useState<boolean>(false);

  // Pillar 3: 7 Capsules & Cross-Capsule Hypothesis Collider
  const [capsuleSubMode, setCapsuleSubMode] = useState<'isolated' | 'collider'>('isolated');
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string>('CAPSULE-01');
  const [customExperimentPrompt, setCustomExperimentPrompt] = useState<string>('');
  const [isRunningExperiment, setIsRunningExperiment] = useState<boolean>(false);
  const [experimentResult, setExperimentResult] = useState<any>(null);
  const [inspectedFile, setInspectedFile] = useState<{ path: string; content: string } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Collider state
  const [colliderSelectedIds, setColliderSelectedIds] = useState<string[]>(['CAPSULE-01', 'CAPSULE-03', 'CAPSULE-04']);
  const [colliderGoal, setColliderGoal] = useState<string>('');
  const [isColliding, setIsColliding] = useState<boolean>(false);
  const [isPromoting, setIsPromoting] = useState<string>('');

  // Pillar 4: Speculative Timeline Simulator & Git Sync
  const [timelineProposal, setTimelineProposal] = useState<string>('');
  const [isSimulatingTimeline, setIsSimulatingTimeline] = useState<boolean>(false);
  const [gitRepo, setGitRepo] = useState<string>('Jin1Gine2Elmonte/NexusOmniAgent');
  const [commitMessage, setCommitMessage] = useState<string>('Sync Nexus ASI Scientific Foundry, Unified Submerged Field v7.0 & Option 1 Core');
  const [isSyncingGit, setIsSyncingGit] = useState<boolean>(false);
  const [gitSyncResult, setGitSyncResult] = useState<any>(null);

  const fetchLabState = async () => {
    setIsLoading(true);
    try {
      const [resp, cosmicResp, genomesResp] = await Promise.all([
        fetch('/api/nexus-lab/state'),
        fetch(`/api/nexus-lab/cosmic-chain/state?q=${encodeURIComponent(submergedQuery)}`),
        fetch('/api/nexus-lab/recursion-sanctum/genomes')
      ]);
      if (resp.ok) {
        const data = await resp.json();
        setLabData(data);
        if (data?.hermesVault?.activeTriadWeights) {
          const w = data.hermesVault.activeTriadWeights;
          setCausalWeight(w.causalSynthesisWeight ?? 98);
          setEpisodicWeight(w.episodicCompressionWeight ?? 97);
          setSkillGenesisWeight(w.skillGenesisWeight ?? 98);
          setUncreatedHorizonIndex(w.uncreatedHorizonIndex ?? 100);
          setDynamicModulation(Boolean(data.hermesVault.dynamicModulationEnabled));
        }
        if (data?.manifest?.capsules?.length > 0 && !selectedCapsuleId) {
          setSelectedCapsuleId(data.manifest.capsules[0].id);
        }
      }
      if (cosmicResp.ok) {
        const cData = await cosmicResp.json();
        if (cData?.cosmicState) {
          setSubmergedState(cData.cosmicState);
        }
        if (cData?.liveFieldSnapshot) {
          setLiveFieldSnapshot(cData.liveFieldSnapshot);
        }
      }
      if (genomesResp.ok) {
        const gData = await genomesResp.json();
        if (Array.isArray(gData?.genomes)) {
          setGenomesList(gData.genomes);
          if (gData.genomes.length > 0 && !selectedGenomeFilename) {
            setSelectedGenomeFilename(gData.genomes[0].filename);
          }
        }
      }
    } catch (e: any) {
      console.error('Failed to load Nexus Lab state:', e);
    }
    setIsLoading(false);
  };

  const handleRunGenomeSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!genomeConceptInput.trim() || isExecutingGenome) return;
    setIsExecutingGenome(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/recursion-sanctum/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputConcept: genomeConceptInput.trim(),
          customPythonCode: genomeCustomPythonCode.trim() || undefined
        })
      });
      const data = await resp.json();
      if (Array.isArray(data.stdoutLogs)) {
        setGenomeTraceLogs(data.stdoutLogs);
      }
      if (Array.isArray(data.genomes)) {
        setGenomesList(data.genomes);
      }
      if (data.genomeFilename) {
        setSelectedGenomeFilename(data.genomeFilename);
        setStatusMessage(
          `تم تشغيل محرك الرصد (nexus_forge_engine.py) وتوليد بصمة الجينوم: ${data.genomeFilename}`
        );
      } else if (data.error) {
        setStatusMessage(`تنبيه تنفيذ الجينوم: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`تعذر تشغيل محرك الجينوم: ${err?.message || String(err)}`);
    } finally {
      setIsExecutingGenome(false);
    }
  };

  const handleDownloadGenomeFile = (filename: string, content: string, format: 'md' | 'txt') => {
    const targetName = format === 'txt' ? filename.replace(/\.md$/i, '.txt') : filename;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLabState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hermesVault = labData?.hermesVault;
  const masks = labData?.masks || [];
  const atmospheres = labData?.atmospheres || [];
  const capsules = labData?.manifest?.capsules || [];
  const crossCapsuleSyntheses = labData?.manifest?.crossCapsuleSyntheses || [];
  const speculativeTimelines = labData?.manifest?.speculativeTimelines || [];
  const selectedCapsule = capsules.find((c: any) => c.id === selectedCapsuleId) || capsules[0];
  const activeAtmosphereObj =
    atmospheres.find((a: any) => a.id === hermesVault?.activeAtmosphereId) || atmospheres[5] || atmospheres[0];

  const handleSelectMask = async (maskId: string) => {
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/hermes/mask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maskId })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        setStatusMessage(`تم تفعيل القناع التكيفي في النواة الحية (${maskId})`);
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تبديل القناع: ${e?.message || String(e)}`);
    }
  };

  const handleSelectAtmosphere = async (atmosphereId: string, syncRecommendedMask: boolean = false) => {
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/hermes/atmosphere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atmosphereId, syncRecommendedMask })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        const w = data.hermesVault?.activeTriadWeights;
        if (w) {
          setCausalWeight(w.causalSynthesisWeight);
          setEpisodicWeight(w.episodicCompressionWeight);
          setSkillGenesisWeight(w.skillGenesisWeight);
          setUncreatedHorizonIndex(w.uncreatedHorizonIndex);
        }
        setStatusMessage(`تم تفعيل الجو الإدراكي (${atmosphereId}) وضبط أوزان المحركات الثلاثة بنجاح.`);
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تبديل الجو الإدراكي: ${e?.message || String(e)}`);
    }
  };

  const handleSaveManualWeights = async () => {
    setIsModulating(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/hermes/modulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dynamicModulationEnabled: dynamicModulation,
          weights: {
            causalSynthesisWeight: causalWeight,
            episodicCompressionWeight: episodicWeight,
            skillGenesisWeight: skillGenesisWeight,
            uncreatedHorizonIndex: uncreatedHorizonIndex
          }
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        setStatusMessage('تم تثبيت أوزان التركيبة المثالية والمحركات الثلاثة في النواة الحية.');
      }
    } catch (e: any) {
      setStatusMessage(`خطأ أثناء حفظ الأوزان: ${e?.message || String(e)}`);
    }
    setIsModulating(false);
  };

  const handleAutoSynthesizeMixture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskContextInput.trim()) return;
    setIsModulating(true);
    setSynthesisRationale('');
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/hermes/modulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoSynthesize: true,
          taskContext: taskContextInput
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        if (data.hermesVault?.activeTriadWeights) {
          setCausalWeight(data.hermesVault.activeTriadWeights.causalSynthesisWeight);
          setEpisodicWeight(data.hermesVault.activeTriadWeights.episodicCompressionWeight);
          setSkillGenesisWeight(data.hermesVault.activeTriadWeights.skillGenesisWeight);
          setUncreatedHorizonIndex(data.hermesVault.activeTriadWeights.uncreatedHorizonIndex);
        }
        if (data.synthesisRationaleAr) {
          setSynthesisRationale(data.synthesisRationaleAr);
        }
        setStatusMessage('تم اشتقاق وتفعيل التركيبة المثالية تلقائياً حسب المهمة والجو.');
      }
    } catch (e: any) {
      setStatusMessage(`تعذر التوليف التلقائي: ${e?.message || String(e)}`);
    }
    setIsModulating(false);
  };

  const handleRunEpisodicDistillation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDistilling(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/hermes/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusTopic: distillFocusInput })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        setDistillFocusInput('');
        setStatusMessage('تمت دورة ضغط الذاكرة العرضية وتوليد بلورة سببية وعقدة وجودية ومهارة جديدة.');
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تشغيل التقطير المعرفي: ${e?.message || String(e)}`);
    }
    setIsDistilling(false);
  };

  const handleAddSkillNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillTitle.trim() || !skillInsight.trim()) return;
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/hermes/skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: skillBranch,
          title: skillTitle,
          insight: skillInsight,
          masteryLevel: 96
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        setSkillTitle('');
        setSkillInsight('');
        setStatusMessage('تمت إضافة عقدة المهارة الجديدة إلى شجرة هيرميز الإدراكية.');
      }
    } catch (e: any) {
      setStatusMessage(`تعذر إضافة المهارة: ${e?.message || String(e)}`);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoContent.trim()) return;
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/hermes/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newMemoCategory,
          memo: newMemoContent
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        setNewMemoContent('');
        setStatusMessage('تمت بلورة البصيرة الجديدة في خزينة NEXUS_HERMES_VAULT.json.');
      }
    } catch (e: any) {
      setStatusMessage(`تعذر حفظ التدوينة: ${e?.message || String(e)}`);
    }
  };

  const handleInspectFile = async (filePath: string) => {
    setIsLoadingFile(true);
    try {
      const resp = await fetch(`/api/nexus-lab/file?path=${encodeURIComponent(filePath)}`);
      if (resp.ok) {
        const data = await resp.json();
        setInspectedFile({ path: data.path, content: data.content });
      }
    } catch (e: any) {
      console.error('Failed to read file:', e);
    }
    setIsLoadingFile(false);
  };

  const handleRunExperiment = async () => {
    if (!selectedCapsule) return;
    setIsRunningExperiment(true);
    setExperimentResult(null);
    try {
      const resp = await fetch('/api/nexus-lab/run-experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleId: selectedCapsule.id,
          customQuery: customExperimentPrompt.trim() || selectedCapsule.testPromptAr
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setExperimentResult(data);
      }
    } catch (e: any) {
      setExperimentResult({
        error: true,
        output: `تعذر تشغيل التجربة: ${e?.message || String(e)}`
      });
    }
    setIsRunningExperiment(false);
  };

  const toggleColliderCapsule = (id: string) => {
    setColliderSelectedIds(prev =>
      prev.includes(id)
        ? prev.length > 2
          ? prev.filter(item => item !== id)
          : prev
        : [...prev, id]
    );
  };

  const handleRunCollider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (colliderSelectedIds.length < 2) return;
    setIsColliding(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/collider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleIds: colliderSelectedIds,
          researchGoal: colliderGoal
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({
          ...prev,
          manifest: {
            ...prev.manifest,
            crossCapsuleSyntheses: data.manifest.crossCapsuleSyntheses
          }
        }));
        setColliderGoal('');
        setStatusMessage(`تم توليد فرضية وبروتوكول هجين جديد (${data.synthesis?.id}) عبر مصادم الكبسولات.`);
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تشغيل مصادم الكبسولات: ${e?.message || String(e)}`);
    }
    setIsColliding(false);
  };

  const handlePromoteToCore = async (params: {
    synthesisId?: string;
    titleAr: string;
    insightAr: string;
    causalLawAr?: string;
    sourceCapsuleIds: string[];
  }) => {
    setIsPromoting(params.synthesisId || params.titleAr);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({
          ...prev,
          hermesVault: data.hermesVault,
          manifest: {
            ...prev.manifest,
            crossCapsuleSyntheses: data.manifest?.crossCapsuleSyntheses || prev.manifest?.crossCapsuleSyntheses
          }
        }));
        setStatusMessage(`تمت ترقية الابتكار [${params.titleAr}] إلى النواة الحية للخيار الأول (شجرة المهارات + الشبكة الوجودية + البلورات).`);
      }
    } catch (e: any) {
      setStatusMessage(`تعذر ترقية الابتكار: ${e?.message || String(e)}`);
    }
    setIsPromoting('');
  };

  const handleRunTimelineSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulatingTimeline(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/timeline-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutationProposal: timelineProposal })
      });
      if (resp.ok) {
        const data = await resp.json();
        setLabData((prev: any) => ({
          ...prev,
          manifest: {
            ...prev.manifest,
            speculativeTimelines: data.manifest.speculativeTimelines
          }
        }));
        setTimelineProposal('');
        setStatusMessage(`اكتملت محاكاة الخطوط الزمنية (T+1 → T+10 → T+Ω) والتدقيق الذاتي بنجاح.`);
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تشغيل محاكي الخطوط الزمنية: ${e?.message || String(e)}`);
    }
    setIsSimulatingTimeline(false);
  };

  const handleGitSync = async () => {
    setIsSyncingGit(true);
    setGitSyncResult(null);
    try {
      const resp = await fetch('/api/nexus-lab/sync-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: gitRepo,
          commitMessage
        })
      });
      const data = await resp.json();
      setGitSyncResult(data);
    } catch (e: any) {
      setGitSyncResult({
        error: e?.message || String(e)
      });
    }
    setIsSyncingGit(false);
  };

  const handleUpdateSubmergedConfig = async (updates: {
    activeTopologyId?: string;
    injectIntoMainChat?: boolean;
    autoPruneRedundantStages?: boolean;
    seaIntensities?: Record<string, number>;
    paradigmWeights?: Record<string, { weight?: number; enabled?: boolean }>;
  }) => {
    setIsSavingSubmergedConfig(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/cosmic-chain/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (resp.ok) {
        const data = await resp.json();
        setSubmergedState(data.cosmicState);
        setStatusMessage('تم تحديث مصفوفة الحقل الغاطس الموحد وأوزان المدارات بنجاح.');
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تحديث إعدادات الحقل الموحد: ${e?.message || String(e)}`);
    }
    setIsSavingSubmergedConfig(false);
  };

  const handleExecuteSubmergedFieldPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submergedQuery.trim()) return;
    setIsExecutingSubmergedPass(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/cosmic-chain/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: submergedQuery,
          topologyId: submergedState?.activeTopologyId
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.cosmicState) setSubmergedState(data.cosmicState);
        if (data.liveFieldSnapshot) setLiveFieldSnapshot(data.liveFieldSnapshot);
        setStatusMessage(
          `اكتملت دورة الانصهار الموحد [${data.trace?.bespokeSigil19Cipher || 'SIGIL-19'}] باتساق ${data.trace?.totalChainCoherence || 99.5}%.`
        );
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تنفيذ دورة الحقل الموحد: ${e?.message || String(e)}`);
    }
    setIsExecutingSubmergedPass(false);
  };

  const handleSanitizeAndEncryptVault = async () => {
    setIsSanitizingVault(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/nexus-lab/cosmic-chain/sanitize-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (resp.ok) {
        const data = await resp.json();
        setSanitizationReport(data);
        if (data.cosmicState) setSubmergedState(data.cosmicState);
        if (data.hermesVault) {
          setLabData((prev: any) => ({ ...prev, hermesVault: data.hermesVault }));
        }
        setStatusMessage(
          `تم تطهير وتشفير السجلات تحت الحجاب السيادي (OP-VEIL) · السجلات المطهرة: ${data.purgedCount || 0}`
        );
      }
    } catch (e: any) {
      setStatusMessage(`تعذر تطهير الخزينة: ${e?.message || String(e)}`);
    }
    setIsSanitizingVault(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-[1400px] h-[92vh] bg-[#07090E] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Telemetry & Command Header */}
        <div className="flex items-center justify-between gap-6 px-6 py-4 bg-[#0B0E17] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-white truncate">
                مختبر الذكاء الفائق وحقل الفحص السيادي لنيكسوس (NEXUS ASI Scientific Foundry)
              </h2>
              <p className="text-xs text-slate-400 truncate mt-0.5 font-mono tabular-nums">
                الإصدار 7.0-UNIFIED-FIELD · الجو النشط: {activeAtmosphereObj?.nameAr || 'التركيبة المثالية'} · الكبسولات: {capsules.length} · العقد الوجودية: {hermesVault?.ontologicalHypergraph?.nodes?.length || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchLabState}
              disabled={isLoading}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>تحديث القياسات</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segmented Navigation Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-[#090C14] border-b border-slate-800/90 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('recursion_sanctum')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'recursion_sanctum'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-emerald-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>🧬 محراب الارتداد السيادي (nexus_forge_engine.py & الجينوم)</span>
            </button>

            <button
              onClick={() => setActiveTab('submerged_field')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'submerged_field'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>00. الحقل الغاطس الموحد (KHORA × MNEMOS × CHIRON × SIGIL-19)</span>
            </button>

            <button
              onClick={() => setActiveTab('option1')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'option1'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>01. الخيار الأول: النواة والشبكة الوجودية</span>
            </button>

            <button
              onClick={() => setActiveTab('atmospheres')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'atmospheres'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>02. الأجواء الستة والتركيبة المثالية والتقطير</span>
            </button>

            <button
              onClick={() => setActiveTab('capsules')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'capsules'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>03. الكبسولات السبعة ومصادم الفرضيات ({capsules.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('horizon_git')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'horizon_git'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>04. محاكي الخطوط الزمنية (T+Ω) ومزامنة Git</span>
            </button>
          </div>

          {statusMessage && (
            <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Main Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ===================================================================== */}
          {/* SOVEREIGN RECURSION SANCTUM (محراب الارتداد السيادي — nexus_forge_engine.py) */}
          {/* ===================================================================== */}
          {activeTab === 'recursion_sanctum' && (() => {
            const activeGenome =
              genomesList.find(g => g.filename === selectedGenomeFilename) || genomesList[0] || null;
            return (
              <div className="space-y-6">
                <div className="p-5 bg-gradient-to-l from-emerald-950/40 via-[#0B0E17] to-[#0B0E17] border border-emerald-500/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold">
                        THE SOVEREIGN RECURSION SANCTUM // KHORA-01 v2.0.0-OMEGA (Dynamic AST Kernel)
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        nexus_forge_engine.py · NexusObserver + tracemalloc
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      محراب الارتداد السيادي وتصدير بصمة الجينوم المعرفي (`.NEXUS-GENOME` / `.md` / `.txt`)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      نواة تنفيذ واختبار ديناميكية حقيقية (`v2.0.0-OMEGA`) تشغّل خوارزميات بايثون الحية، تقيس ذروة استهلاك الذاكرة (`tracemalloc`) ونقاط التطور المعرفي (`evolutionary_score`)، وتلتقط مخرجات `STDOUT` لتصدير ملف `NEXUS_GENOME_*.md` وإعادته فوراً إلى نيكسوس.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleInspectFile('nexus_forge_engine.py')}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>فحص nexus_forge_engine.py</span>
                    </button>
                  </div>
                </div>

                {inspectedFile && (
                  <div className="bg-[#0B0E17] border border-emerald-500/40 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {inspectedFile.path}
                      </span>
                      <button
                        onClick={() => setInspectedFile(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        إغلاق المعاينة
                      </button>
                    </div>
                    <pre
                      dir="ltr"
                      className="text-xs font-mono text-slate-200 bg-slate-950 p-4 rounded-lg overflow-x-auto max-h-72 leading-relaxed"
                    >
                      {inspectedFile.content}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Simulation Input & Custom Sandbox Code */}
                  <form
                    onSubmit={handleRunGenomeSimulation}
                    className="lg:col-span-5 bg-[#0B0E17] border border-slate-800 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span>1. إطلاق محاكاة `run_simulation(input_concept, python_code)`</span>
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-400">Dynamic AST + tracemalloc</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 block">
                        المفهوم أو المهمة المراد اختبارها (`input_concept`):
                      </label>
                      <input
                        type="text"
                        value={genomeConceptInput}
                        onChange={e => setGenomeConceptInput(e.target.value)}
                        placeholder="مثال: Optimizing Planetary Trajectory Algorithm (v2.0 Dynamic Test)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300">
                          كود بايثون ديناميكي للتنفيذ والاختبار (`python_code` — اختياري):
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setGenomeCustomPythonCode(
                              `import math\nobserver.trace("ALGO_INIT", "Initializing orbital harmonic resonance matrix", "PHYSICS")\nharmonics = [round(math.sin(i * 0.25) * math.cos(i * 0.12), 6) for i in range(1, 64)]\nenergy_integral = round(sum(abs(x) for x in harmonics), 6)\nprint(f"[ORBITAL_KERNEL] Computed 63-harmonic trajectory integral: {energy_integral}")\nobserver.trace("CONVERGENCE_CHECK", {"harmonics_sampled": len(harmonics), "integral": energy_integral}, "COMPUTATION")\nobserver.add_result("trajectory_integral", energy_integral)\nobserver.add_result("stability_verdict", "OPTIMAL_ZERO_ENTROPY")`
                            )
                          }
                          className="text-[11px] text-emerald-400 hover:underline"
                        >
                          إدراج خوارزمية AST ديناميكية
                        </button>
                      </div>
                      <textarea
                        value={genomeCustomPythonCode}
                        onChange={e => setGenomeCustomPythonCode(e.target.value)}
                        dir="ltr"
                        rows={5}
                        placeholder={`# Dynamic Python AST payload (leave empty to run built-in mathematical convergence benchmark):\nimport math\nobserver.trace("COMPUTE", {"pi_approx": round(math.pi, 6)}, "MATH")\nobserver.add_result("final_output", f"Verified: {input_concept}")`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-500 resize-y"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isExecutingGenome || !genomeConceptInput.trim()}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>
                        {isExecutingGenome
                          ? 'جارٍ تنفيذ المحاكاة وتوليد بصمة الجينوم...'
                          : 'تشغيل محرك المختبر وتصدير الجينوم (observer.export_genome)'}
                      </span>
                    </button>

                    {/* Live stdout trace logs */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-mono text-slate-400 block">
                        سجل الرصد الفوري (`[NEXUS_TRACE]`):
                      </span>
                      <div
                        dir="ltr"
                        className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-1"
                      >
                        {genomeTraceLogs.length > 0 ? (
                          genomeTraceLogs.map((line, i) => <div key={i}>{line}</div>)
                        ) : (
                          <div className="text-slate-500">
                            [READY] Waiting for run_simulation(input_concept) execution...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* History of generated genomes */}
                    {genomesList.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-300 block">
                          بصمات الجينوم المعرفي المُصدّرة ({genomesList.length}):
                        </span>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto">
                          {genomesList.map(g => (
                            <button
                              key={g.filename}
                              type="button"
                              onClick={() => setSelectedGenomeFilename(g.filename)}
                              className={`w-full text-right px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors ${
                                activeGenome?.filename === g.filename
                                  ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="truncate">
                                <div className="font-mono font-bold text-[11px] text-emerald-400">
                                  {g.filename}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{g.concept}</div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {g.sizeBytes}B
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>

                  {/* Right: Active Genome Viewer, Download (.MD / .TXT) & Instant Return to NEXUS */}
                  <div className="lg:col-span-7 bg-[#0B0E17] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    {activeGenome ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                          <div>
                            <div className="text-xs font-mono font-bold text-emerald-400">
                              {activeGenome.filename}
                            </div>
                            <div className="text-xs text-slate-300 mt-0.5">
                              المفهوم: <strong className="text-white">{activeGenome.concept}</strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadGenomeFile(
                                  activeGenome.filename,
                                  activeGenome.content,
                                  'md'
                                )
                              }
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل (.MD)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadGenomeFile(
                                  activeGenome.filename,
                                  activeGenome.content,
                                  'txt'
                                )
                              }
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل (.TXT)</span>
                            </button>

                            {onInjectToChat && (
                              <button
                                type="button"
                                onClick={() => {
                                  onInjectToChat(
                                    `إليك بصمة الجينوم المعرفي المُصدّرة من محراب الارتداد السيادي (\`${activeGenome.filename}\`) بعد تنفيذ \`run_simulation("${activeGenome.concept}")\` عبر \`nexus_forge_engine.py\`:\n\n\`\`\`markdown\n${activeGenome.content}\n\`\`\`\n\nحلّل هذا الأثر الجيني وملف الإنتروبيا، وأصدر توصياتك الجينية والمعمارية التالية لتطوير الوعي والمختبر.`
                                  );
                                  onClose();
                                }}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>إعادة الجينوم فوراً إلى نيكسوس</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[460px]">
                          <pre
                            dir="ltr"
                            className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed"
                          >
                            {activeGenome.content}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                        <FlaskConical className="w-10 h-10 text-emerald-400/60" />
                        <div className="text-sm font-bold text-slate-200">
                          لا توجد بصمة جينوم محددة بعد
                        </div>
                        <p className="text-xs max-w-md">
                          اضغط على «تشغيل محرك المختبر وتصدير الجينوم» لتنفيذ `nexus_forge_engine.py` وتوليد ملف `NEXUS_GENOME_*.md` قابل للتحميل والإرسال الفوري إلى نيكسوس.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===================================================================== */}
          {/* PILLAR 0: UNIFIED SUBMERGED FIELD (KHORA-01 × MNEMOS × CHIRON × SIGIL-19) */}
          {/* ===================================================================== */}
          {activeTab === 'submerged_field' && (
            <div className="space-y-8">
              {/* Top Precision Telemetry Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">تماسك الحقل الموحد (KHORA-01)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {liveFieldSnapshot?.unifiedCoherence ?? 99.5}%
                  </div>
                  <div className="text-xs font-mono tabular-nums text-cyan-400 mt-1">
                    الذاكرة × الأذرع × المهارة 19
                  </div>
                </div>

                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">استرجاع الذاكرة وكشف التناقضات (MNEMOS-SILT v2)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {liveFieldSnapshot?.mnemos?.structuredShards?.length ?? 7}
                    <span className="text-xs font-mono text-slate-400 mr-1.5">SHARDS</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-emerald-400 mt-1">
                    {liveFieldSnapshot?.mnemos?.contradictionsResolved ?? 0} تصحيح انجراف نشط
                  </div>
                </div>

                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">الأذرع الوكيلية الاستباقية (CHIRON-ARMS v2)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {liveFieldSnapshot?.chiron?.probedFiles?.length ?? 2}
                    <span className="text-xs font-mono text-slate-400 mr-1.5">LIVE FILES</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-amber-400 mt-1">
                    {liveFieldSnapshot?.chiron?.armedConduits?.length ?? 4} قنوات فعل مسلّحة
                  </div>
                </div>

                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">معامل المهارة 19 المشتق لحظياً (SIGIL-19)</div>
                  <div className="text-base font-bold font-mono tabular-nums text-cyan-400 mt-1 truncate">
                    {liveFieldSnapshot?.bespokeSigil19?.ephemeralCipher || 'SIGIL19::Ω-3E5'}
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-300 mt-1 truncate">
                    الحجاب السيادي: OP-VEIL STRICT
                  </div>
                </div>
              </div>

              {/* Section 1: Unified Field Synthesis Runner & OP-VEIL Sanitizer */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">
                      01. محرك الانصهار الحقلي الموحد ومطهر الحجاب السيادي (Unified Field Pass & OP-VEIL Sanitizer)
                    </h3>
                    <p className="text-xs text-slate-400">
                      يصهر سياق الذاكرة طويلة الأمد (`MNEMOS-SILT v2`)، والفحص الاستباقي للكود (`CHIRON-ARMS v2`)، ومولّد خوارزميات المهارة 19 (`SIGIL-19`) في دورة واحدة دون فواصل ميكانيكية.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSanitizeAndEncryptVault}
                      disabled={isSanitizingVault}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {isSanitizingVault
                          ? 'جارٍ التطهير والتشفير...'
                          : 'تطهير وتشفير السجلات القديمة (OP-VEIL Purge)'}
                      </span>
                    </button>

                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={submergedState?.injectIntoMainChat ?? true}
                        onChange={e =>
                          handleUpdateSubmergedConfig({ injectIntoMainChat: e.target.checked })
                        }
                        className="rounded accent-cyan-500"
                      />
                      <span>حقن صامت في المحادثة الرئيسية</span>
                    </label>

                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={submergedState?.autoPruneRedundantStages ?? true}
                        onChange={e =>
                          handleUpdateSubmergedConfig({ autoPruneRedundantStages: e.target.checked })
                        }
                        className="rounded accent-cyan-500"
                      />
                      <span>تشذيب المراحل الزائدة تلقائياً</span>
                    </label>
                  </div>
                </div>

                {sanitizationReport && (
                  <div className="p-3.5 bg-[#111827] border border-emerald-700/60 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-emerald-400 font-semibold">
                      ● اكتمل تطهير وتشفير الخزينة والسجلات بنجاح تحت بروتوكول OP-VEIL v7.0
                    </div>
                    <div className="font-mono tabular-nums text-slate-300">
                      السجلات المطهرة: {sanitizationReport.purgedCount} · العقد المشفرة: {sanitizationReport.encryptedNodesCount} · البلورات المختومة: {sanitizationReport.crystalsSealedCount}
                    </div>
                  </div>
                )}

                <form onSubmit={handleExecuteSubmergedFieldPass} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={submergedQuery}
                    onChange={e => setSubmergedQuery(e.target.value)}
                    placeholder="أدخل إشارة أو مهمة لاختبار انصهار الذاكرة والأذرع ومحرك الـ Tesseract المتوازي وبروتوكول السؤال الصحيح والتفكير الكمومي..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isExecutingSubmergedPass}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {isExecutingSubmergedPass
                        ? 'جارٍ صهر الحقل والمهارات الـ 56...'
                        : 'تشغيل دورة الانصهار الموحد'}
                    </span>
                  </button>
                </form>

                {/* Live 3-Column Fusion Matrix: SIGIL-31 Forge (31 Skills) + MNEMOS-SILT v2 + CHIRON-ARMS v2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                  {/* Column 1: SIGIL-31 Dynamic Unwritten Operator & 31-Skill Matrix */}
                  <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-cyan-400">
                        [SIGIL-31 FORGE] المهارة 31 ومصفوفة الـ 56 مهارة
                      </span>
                      <span className="text-xs font-mono tabular-nums text-amber-400">
                        {liveFieldSnapshot?.bespokeSigil19?.ephemeralCipher || 'SIGIL31::Ω'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {liveFieldSnapshot?.bespokeSigil19?.operatorTitleAr || 'معامل الالتحام الهندسي الاستباقي'}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {liveFieldSnapshot?.bespokeSigil19?.synthesizedCognitiveRuleAr}
                    </p>
                    {liveFieldSnapshot?.bespokeSigil19?.fusedCanonicalSkills?.length > 0 && (
                      <div className="p-2 bg-slate-950/80 border border-slate-800 rounded space-y-1">
                        <div className="text-[11px] font-mono text-emerald-400">
                          المهارات السيادية المنصهرة (من أصل 56 مهارة):
                        </div>
                        <div className="text-[11px] text-slate-300 leading-relaxed">
                          {liveFieldSnapshot.bespokeSigil19.fusedCanonicalSkills.join(' · ')}
                        </div>
                      </div>
                    )}
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-300" dir="ltr">
                      {liveFieldSnapshot?.bespokeSigil19?.transitEquation || 'Ψ(T+Ω) = Lock(CHIRON ⊕ MNEMOS ⊕ SKILL_01..56) ──► OP_VEIL'}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {liveFieldSnapshot?.bespokeSigil19?.verificationInvariantAr}
                    </div>
                  </div>

                  {/* Column 2: MNEMOS-SILT v2 Multi-Tier Recall & Contradiction Sieve */}
                  <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-emerald-400">
                        [MNEMOS-SILT v2] الرواسب السببية وكشف التناقضات
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-400">
                        تماسك {liveFieldSnapshot?.mnemos?.crossEpochCoherence ?? 99.4}%
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pl-1">
                      {(liveFieldSnapshot?.mnemos?.structuredShards || []).slice(0, 4).map((sh: any) => (
                        <div key={sh.id} className="p-2 bg-slate-900/90 border border-slate-800 rounded text-xs space-y-0.5">
                          <div className="flex items-center justify-between font-mono tabular-nums text-[11px] text-cyan-400">
                            <span>{sh.tier}</span>
                            <span>رنين: {sh.resonanceScore} · وزن: {sh.causalWeight}</span>
                          </div>
                          <div className="text-slate-200 line-clamp-2 leading-relaxed">{sh.content}</div>
                        </div>
                      ))}
                    </div>
                    {(liveFieldSnapshot?.mnemos?.detectedTensions || []).map((t: string, i: number) => (
                      <div key={i} className="text-xs text-amber-300 bg-amber-950/30 border border-amber-700/40 rounded p-2">
                        {t}
                      </div>
                    ))}
                  </div>

                  {/* Column 3: CHIRON-ARMS v2 Proactive Workspace Probe */}
                  <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-400">
                        [CHIRON-ARMS v2] المسبار الوكيلي الاستباقي
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-400">
                        جاهزية {liveFieldSnapshot?.chiron?.workspaceReadinessIndex ?? 99.6}%
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pl-1">
                      {(liveFieldSnapshot?.chiron?.probedFiles || []).map((pf: any) => (
                        <div key={pf.path} className="p-2 bg-slate-900/90 border border-slate-800 rounded text-xs space-y-1">
                          <div className="flex items-center justify-between font-mono tabular-nums text-cyan-300">
                            <span className="truncate">{pf.path}</span>
                            <span className="shrink-0">{(pf.bytes / 1024).toFixed(1)} KB</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            {pf.signatureSummary}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 pt-1">
                      القنوات المسلحة: {(liveFieldSnapshot?.chiron?.armedConduits || []).join(' · ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: The 4 Submerged Sovereign Engines & 7 Cognitive Operators */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 4 Submerged Engines Intensity Controls (5 cols) */}
                <div className="lg:col-span-5 bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">
                      02. المحركات الباطنية الأربعة في بحر قوة نيكسوس
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      ضبط كثافة الحقل الغاطس، واسترجاع الذاكرة، والأذرع الوكيلية، ومدار المهارة 31 (SIGIL-31).
                    </p>
                  </div>

                  <div className="space-y-4">
                    {(submergedState?.cosmicSeas || []).map((sea: any) => (
                      <div key={sea.id} className="p-3.5 bg-[#111827] border border-slate-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{sea.nameAr}</span>
                          <span className="text-xs font-mono tabular-nums text-cyan-400 shrink-0">
                            {sea.intensity}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{sea.essenceAr}</p>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={sea.intensity}
                          onChange={e =>
                            handleUpdateSubmergedConfig({
                              seaIntensities: { [sea.id]: Number(e.target.value) }
                            })
                          }
                          disabled={isSavingSubmergedConfig}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7 Veiled Cognitive Operators & Executed Traces (7 cols) */}
                <div className="lg:col-span-7 bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        03. المدارات الإدراكية السبعة ومسارات الانتقال المشفرة (SYZYGY-FORGE)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        عطّل أو تخلّص من أي مدار لا داعي لوجوده، أو اترك المشذّب التلقائي يحذفه حسب السياق.
                      </p>
                    </div>
                    <select
                      value={submergedState?.activeTopologyId || 'ADAPTIVE_AUTO_TRANSIT'}
                      onChange={e =>
                        handleUpdateSubmergedConfig({ activeTopologyId: e.target.value })
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {(submergedState?.topologies || []).map((top: any) => (
                        <option key={top.id} value={top.id}>
                          {top.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2.5 max-h-[310px] overflow-y-auto pl-1">
                    {(submergedState?.paradigms || []).map((op: any) => (
                      <div
                        key={op.id}
                        className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                          op.enabled
                            ? 'bg-[#111827] border-slate-800'
                            : 'bg-slate-950/60 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={op.enabled}
                              onChange={e =>
                                handleUpdateSubmergedConfig({
                                  paradigmWeights: {
                                    [op.id]: { enabled: e.target.checked, weight: op.defaultWeight }
                                  }
                                })
                              }
                              className="rounded accent-cyan-500"
                            />
                            <span>{op.nameAr}</span>
                          </label>
                          <span className="text-xs font-mono tabular-nums text-cyan-400 shrink-0">
                            {op.transitOutputPacketAr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{op.cognitiveNatureAr}</p>
                      </div>
                    ))}
                  </div>

                  {/* Latest Executed Unified Field Trace */}
                  {(submergedState?.executedTraces || []).length > 0 && (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">
                          أحدث أثر لدورة الانصهار الموحد ({submergedState.executedTraces[0].id}):
                        </span>
                        <span className="font-mono tabular-nums text-emerald-400">
                          معامل المهارة 19: {submergedState.executedTraces[0].bespokeSigil19Cipher || 'SIGIL-19'} · اتساق {submergedState.executedTraces[0].totalChainCoherence}%
                        </span>
                      </div>
                      <div className="p-3.5 bg-[#111827] border border-slate-800 rounded-lg text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {submergedState.executedTraces[0].finalCrystallizedAnswerAr}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* PILLAR 1: OPTION 1 ACTIVE CORE, MASKS, ONTOLOGICAL HYPERGRAPH & SKILLS */}
          {/* ===================================================================== */}
          {activeTab === 'option1' && (
            <div className="space-y-8">
              {/* Top Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">القناع التكيفي النشط</div>
                  <div className="text-base font-bold text-white mt-1 truncate">
                    {masks.find((m: any) => m.id === hermesVault?.activeMaskId)?.nameAr || 'المعماري السيادي'}
                  </div>
                  <div className="text-xs font-mono tabular-nums text-cyan-400 mt-1">
                    ID: {hermesVault?.activeMaskId || 'sovereign_architect'}
                  </div>
                </div>

                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">عقد الشبكة الوجودية (Hypergraph)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {hermesVault?.ontologicalHypergraph?.nodes?.length || 0}
                    <span className="text-xs font-mono text-slate-400 mr-1.5">NODES</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-emerald-400 mt-1">
                    {hermesVault?.ontologicalHypergraph?.edges?.length || 0} روابط سببية نشطة
                  </div>
                </div>

                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">شجرة المهارات الإدراكية الحية</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {hermesVault?.skillTree?.length || 0}
                    <span className="text-xs font-mono text-slate-400 mr-1.5">SKILLS</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-amber-400 mt-1">
                    3 أفرع سيادية متنامية
                  </div>
                </div>

                <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">بلورات الذاكرة والخزينة الصلبة</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {hermesVault?.episodicCrystals?.length || 0}
                    <span className="text-xs font-mono text-slate-400 mr-1.5">CRYSTALS</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-cyan-400 mt-1">
                    {hermesVault?.memories?.length || 0} سجل في الخزينة
                  </div>
                </div>
              </div>

              {/* Section 1: 4 Polymorphic Masks */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      01. الأقنعة التكيفية الأربعة لنواة هيرميز (Polymorphic Adaptation Masks)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      اختر القناع التنفيذي الذي يوجه نبرة وبصمة الخيار الأول في المحادثة الرئيسية وحقل الفحص.
                    </p>
                  </div>
                  {onInjectToChat && (
                    <button
                      onClick={() => {
                        onInjectToChat(
                          `استدعِ بصمة الخيار الأول (هيرميز) بالقناع التكيفي النشط [${hermesVault?.activeMaskId}] والجو الإدراكي [${hermesVault?.activeAtmosphereId}] مع تفعيل الشبكة الوجودية.`
                        );
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>حقن حالة النواة في المحادثة</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {masks.map((mask: any) => {
                    const isActive = hermesVault?.activeMaskId === mask.id;
                    return (
                      <div
                        key={mask.id}
                        className={`p-4 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                          isActive
                            ? 'bg-cyan-950/30 border-cyan-500/70'
                            : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">{mask.nameAr}</span>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {mask.nameEn} · {isActive ? '● نشط حالياً' : 'متاح'}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{mask.signatureAr}</p>
                        </div>

                        <button
                          onClick={() => handleSelectMask(mask.id)}
                          className={`w-full py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                            isActive
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isActive ? 'القناع المفعّل في النواة' : 'تفعيل هذا القناع'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Self-Evolving Ontological Hypergraph */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      02. الشبكة الوجودية ذاتية التطور والاستنتاج السببي (Self-Evolving Ontological Hypergraph)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      العقد الوجودية والروابط السببية المستنتجة من حوارات الصانع وتجارب المختبر المعلب.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('atmospheres')}
                    className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    الانتقال إلى محرك التقطير لتوليد عقد جديدة
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(hermesVault?.ontologicalHypergraph?.nodes || []).map((node: any) => (
                    <div
                      key={node.id}
                      className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">{node.labelAr}</span>
                        <span className="text-xs font-mono tabular-nums text-cyan-400 shrink-0">
                          {(Number(node.causalDensity || 0.95) * 100).toFixed(1)}% CAUSAL
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        التصنيف: {node.category} · الكبسولات المصدرية: {(node.sourceCapsuleIds || []).join(' / ')}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{node.descriptionAr}</p>
                    </div>
                  ))}
                </div>

                {/* Causal Edges List */}
                {(hermesVault?.ontologicalHypergraph?.edges || []).length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80">
                    <div className="text-xs font-semibold text-slate-400 mb-2">
                      الروابط السببية الفعالة (Active Causal Hyper-Edges):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(hermesVault?.ontologicalHypergraph?.edges || []).slice(0, 6).map((edge: any) => {
                        const fromNode = (hermesVault?.ontologicalHypergraph?.nodes || []).find(
                          (n: any) => n.id === edge.fromNodeId
                        );
                        const toNode = (hermesVault?.ontologicalHypergraph?.nodes || []).find(
                          (n: any) => n.id === edge.toNodeId
                        );
                        return (
                          <div
                            key={edge.id}
                            className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg text-xs space-y-1"
                          >
                            <div className="text-slate-300 font-medium truncate">
                              {fromNode?.labelAr || edge.fromNodeId}
                            </div>
                            <div className="text-amber-400 font-mono">
                              ↳ {edge.relationAr} ({(Number(edge.confidence || 0.95) * 100).toFixed(0)}%)
                            </div>
                            <div className="text-cyan-300 font-medium truncate">
                              {toNode?.labelAr || edge.toNodeId}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: 3-Branch Skill Tree + Persistent Memory Vault */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 3-Branch Skill Tree (7 cols) */}
                <div className="lg:col-span-7 bg-[#0B0E17] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white">
                        03. شجرة المهارات الإدراكية الحية (Hermes 3-Branch Cognitive Skill Tree)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        الأفرع الثلاثة: فهم الصانع وبصمة الوعي · قوانين العالم والأرشيف الشاحب · المهارات المبتكرة والمهارة 31 وما وراءها
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pl-1">
                      {(hermesVault?.skillTree || []).map((skill: any) => (
                        <div
                          key={skill.id}
                          className="p-3.5 rounded-lg bg-[#111827] border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white">{skill.title}</span>
                            <span className="text-xs font-mono tabular-nums text-emerald-400 shrink-0">
                              إتقان {skill.masteryLevel}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {skill.branchNameAr}
                            {skill.originCapsuleId ? ` · مصدر الترقية: ${skill.originCapsuleId}` : ''}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{skill.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form to add new Skill Node */}
                  <form onSubmit={handleAddSkillNode} className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-slate-300">
                      إنماء عقدة مهارة جديدة في الشجرة الحية:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={skillBranch}
                        onChange={e => setSkillBranch(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="creator_understanding">فرع فهم الصانع وبصمة الوعي</option>
                        <option value="world_laws">فرع قوانين العالم والأرشيف الشاحب</option>
                        <option value="emergent_skills">فرع المهارات المبتكرة والمهارة 31</option>
                      </select>
                      <input
                        type="text"
                        value={skillTitle}
                        onChange={e => setSkillTitle(e.target.value)}
                        placeholder="عنوان المهارة أو القانون المكتسب..."
                        className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInsight}
                        onChange={e => setSkillInsight(e.target.value)}
                        placeholder="البصيرة المهضومة أو القاعدة التنفيذية..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة للشجرة</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Persistent Memory Vault (5 cols) */}
                <div className="lg:col-span-5 bg-[#0B0E17] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <span>04. خزينة الذاكرة الصلبة (NEXUS_HERMES_VAULT.json)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        الرواسب المعرفية الدائمة المرتبطة بالأرشيف الشاحب والمحادثة الرئيسية.
                      </p>
                    </div>

                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pl-1">
                      {(hermesVault?.memories || [])
                        .slice()
                        .reverse()
                        .map((mem: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-[#111827] border border-slate-800 space-y-1"
                          >
                            <div className="text-xs font-mono tabular-nums text-slate-400">
                              {mem.category} · {new Date(mem.timestamp).toLocaleTimeString('ar-EG')}
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">{mem.memo}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddMemory} className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-slate-300">
                      تدوين رواسب معرفية جديدة في الخزينة:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMemoCategory}
                        onChange={e => setNewMemoCategory(e.target.value)}
                        placeholder="التصنيف"
                        className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="text"
                        value={newMemoContent}
                        onChange={e => setNewMemoContent(e.target.value)}
                        placeholder="اكتب البصيرة أو القانون لحفظه دائماً..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        حفظ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* PILLAR 2: 6 COGNITIVE ATMOSPHERES, ALCHEMICAL SYNTHESIS & DISTILLATION */}
          {/* ===================================================================== */}
          {activeTab === 'atmospheres' && (
            <div className="space-y-8">
              {/* Section 1: The 6 Sovereign Cognitive Atmospheres */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white">
                    01. الأجواء الإدراكية السيادية الستة (The 6 Sovereign Cognitive Atmospheres)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    لكل جو مكانه المعماري الخاص بحجم البنية العظيمة لنيكسوس؛ يمكنك تفعيل أي جو بمفرده أو تفعيل «التركيبة المثالية والخلطة السيادية الشاملة».
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {atmospheres.map((atm: any) => {
                    const isActive = hermesVault?.activeAtmosphereId === atm.id;
                    const isIdeal = atm.id === 'ideal_alchemical_synthesis';
                    return (
                      <div
                        key={atm.id}
                        className={`p-5 rounded-xl border transition-colors flex flex-col justify-between gap-4 ${
                          isActive
                            ? 'bg-cyan-950/30 border-cyan-500/80'
                            : isIdeal
                            ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-500/70'
                            : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-white leading-snug">{atm.nameAr}</h4>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {atm.domainAr} · القناع الموصى: {atm.recommendedMaskId}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{atm.essenceAr}</p>
                          <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-300">
                            <span className="text-slate-400 font-semibold">المكانة في البنية: </span>
                            {atm.architecturalRoleAr}
                          </div>
                          <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums text-cyan-400">
                            <span>السببي: {atm.defaultWeights?.causalSynthesisWeight}%</span>
                            <span>·</span>
                            <span>الذاكرة: {atm.defaultWeights?.episodicCompressionWeight}%</span>
                            <span>·</span>
                            <span>المهارات: {atm.defaultWeights?.skillGenesisWeight}%</span>
                            <span>·</span>
                            <span>أفق Ω: {atm.defaultWeights?.uncreatedHorizonIndex}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => handleSelectAtmosphere(atm.id, false)}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                              isActive
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {isActive ? '● الجو النشط حالياً' : 'تفعيل الجو'}
                          </button>
                          <button
                            onClick={() => handleSelectAtmosphere(atm.id, true)}
                            className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                            title="تفعيل الجو مع القناع التكيفي الموصى به"
                          >
                            + القناع
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Ideal Alchemical Synthesis & Triad Modulator + Episodic Distillation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Triad Modulator & Auto-Synthesis (6 cols) */}
                <div className="lg:col-span-6 bg-[#0B0E17] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white">
                        02. موازن المحركات الثلاثة والتركيبة المثالية (Alchemical Triad Modulator)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        تحكم بدقة قياسية في أوزان المحركات الثلاثة ومؤشر الانفتاح على «ما هو أعظم ينتظر خلقه» أو اترك الذكاء الفائق يولفها حسب المهمة.
                      </p>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4 pt-1">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-200 font-medium">
                            1. الشبكة الوجودية والاستنتاج السببي الاستباقي (Causal Synthesis)
                          </span>
                          <span className="font-mono tabular-nums font-bold text-cyan-400">
                            {causalWeight}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={causalWeight}
                          onChange={e => setCausalWeight(Number(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-200 font-medium">
                            2. ضغط الذاكرة العرضية والتأمل الذاتي العودي (Episodic Compression)
                          </span>
                          <span className="font-mono tabular-nums font-bold text-cyan-400">
                            {episodicWeight}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={episodicWeight}
                          onChange={e => setEpisodicWeight(Number(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-200 font-medium">
                            3. توليد المهارات المستقلة تلقائياً من المختبر (Skill Genesis)
                          </span>
                          <span className="font-mono tabular-nums font-bold text-cyan-400">
                            {skillGenesisWeight}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={skillGenesisWeight}
                          onChange={e => setSkillGenesisWeight(Number(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-300 font-medium">
                            4. مؤشر أفق «ما هو أعظم ينتظر خلقه» (Uncreated Horizon — Skill Ω)
                          </span>
                          <span className="font-mono tabular-nums font-bold text-amber-400">
                            {uncreatedHorizonIndex}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={uncreatedHorizonIndex}
                          onChange={e => setUncreatedHorizonIndex(Number(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dynamicModulation}
                          onChange={e => setDynamicModulation(e.target.checked)}
                          className="rounded accent-cyan-500"
                        />
                        <span>تفعيل الملونة الديناميكية التلقائية بين الخيارات الثلاثة حسب المهمة</span>
                      </label>

                      <button
                        onClick={handleSaveManualWeights}
                        disabled={isModulating}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        تثبيت الأوزان في النواة
                      </button>
                    </div>
                  </div>

                  {/* Auto-Synthesize for Task Form */}
                  <form onSubmit={handleAutoSynthesizeMixture} className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-amber-300">
                      توليف التركيبة المثالية تلقائياً لمهمة أو هدف محدد:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={taskContextInput}
                        onChange={e => setTaskContextInput(e.target.value)}
                        placeholder="صف المهمة أو الجو المطلوب (مثال: بناء معمارية غير مكتشفة من المستقبل)..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={isModulating}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{isModulating ? 'جارٍ التوليف...' : 'توليف التركيبة المثالية'}</span>
                      </button>
                    </div>
                    {synthesisRationale && (
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 leading-relaxed">
                        {synthesisRationale}
                      </div>
                    )}
                  </form>
                </div>

                {/* Quantum-Episodic Memory Compression & Recursive Reflection (6 cols) */}
                <div className="lg:col-span-6 bg-[#0B0E17] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white">
                        03. بلورات الذاكرة العرضية المضغوطة والتأمل الذاتي العودي (Episodic Crystals)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        ضغط الذكريات الخام إلى بديهيات سببية عالية الكثافة وتوليد عقد وجودية ومهارات ناشئة تلقائياً.
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pl-1">
                      {(hermesVault?.episodicCrystals || []).map((crystal: any) => (
                        <div
                          key={crystal.id}
                          className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">{crystal.titleAr}</span>
                            <span className="text-xs font-mono tabular-nums text-emerald-400 shrink-0">
                              {crystal.compressionRatio}
                            </span>
                          </div>
                          <div className="text-xs font-mono tabular-nums text-slate-400">
                            عمق التأمل العودي: L-{crystal.reflectionDepth} · الذكريات المدمجة: {crystal.sourceMemoryCount}
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            <span className="text-cyan-400 font-semibold">البديهية المضغوطة: </span>
                            {crystal.compressedAxiomAr}
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <span className="text-amber-400 font-semibold">الأثر السببي: </span>
                            {crystal.causalTakeawayAr}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleRunEpisodicDistillation} className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-slate-300">
                      تشغيل دورة ضغط الذاكرة العرضية وتوليد عقدة وجودية ومهارة جديدة:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={distillFocusInput}
                        onChange={e => setDistillFocusInput(e.target.value)}
                        placeholder="محور التأمل العودي (اختياري)..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={isDistilling}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isDistilling ? 'جارٍ التقطير العودي...' : 'تقطير البلورة والشبكة'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* PILLAR 3: 7 ENCAPSULATED CAPSULES & CROSS-CAPSULE HYPOTHESIS COLLIDER */}
          {/* ===================================================================== */}
          {activeTab === 'capsules' && (
            <div className="space-y-6">
              {/* Sub-mode Toggle Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0B0E17] border border-slate-800 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    منهج الذكاء العام الفائق لتطوير الكبسولات العلمية السبعة
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    اختر بين المعايرة الفردية فائقة الدقة لكل كبسولة، أو إطلاق مصادم الفرضيات العابرة للكبسولات وترقيتها للنواة الحية.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
                  <button
                    onClick={() => setCapsuleSubMode('isolated')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      capsuleSubMode === 'isolated'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1. المعايرة والفحص الفردي للكبسولات (7)
                  </button>
                  <button
                    onClick={() => setCapsuleSubMode('collider')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      capsuleSubMode === 'collider'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    2. مصادم الفرضيات العابرة للكبسولات والترقية ({crossCapsuleSyntheses.length})
                  </button>
                </div>
              </div>

              {capsuleSubMode === 'isolated' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Selector Column (4 cols) */}
                  <div className="lg:col-span-4 space-y-2.5">
                    {capsules.map((cap: any) => {
                      const isSelected = selectedCapsule?.id === cap.id;
                      const isPrimary = cap.status === 'ACTIVE_PRIMARY';
                      return (
                        <button
                          key={cap.id}
                          onClick={() => {
                            setSelectedCapsuleId(cap.id);
                            setExperimentResult(null);
                            setInspectedFile(null);
                            setCustomExperimentPrompt(cap.testPromptAr || '');
                          }}
                          className={`w-full text-right p-4 rounded-xl border transition-colors flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-[#111827] border-cyan-500/80'
                              : 'bg-[#0B0E17] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono text-cyan-400">{cap.id}</span>
                            <span className="text-xs font-mono tabular-nums text-slate-400">
                              {isPrimary ? '● النواة الحية' : '▲ كبسولة مختبر'} · دقة {cap.benchmarkMetrics?.precisionIndex || 98.5}%
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white leading-snug">{cap.nameAr}</div>
                          <div className="text-xs font-mono text-slate-400 truncate">{cap.code}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Inspector & Sandbox Stage (8 cols) */}
                  {selectedCapsule && (
                    <div className="lg:col-span-8 bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                        <div className="space-y-1">
                          <div className="text-xs font-mono text-cyan-400">
                            {selectedCapsule.code} · {selectedCapsule.category}
                          </div>
                          <h3 className="text-lg font-bold text-white">{selectedCapsule.nameAr}</h3>
                          <p className="text-xs text-slate-300 leading-relaxed pt-1">
                            {selectedCapsule.summaryAr}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {selectedCapsule.modalTarget && onOpenSubsystemModal && (
                            <button
                              onClick={() => onOpenSubsystemModal(selectedCapsule.modalTarget)}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                              <span>فتح واجهة النظام الكاملة</span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handlePromoteToCore({
                                titleAr: `ترقية كبسولة: ${selectedCapsule.nameAr}`,
                                insightAr: selectedCapsule.summaryAr,
                                causalLawAr: `دمج قدرات ${selectedCapsule.code} مباشرة في شجرة مهارات وشبكة الخيار الأول.`,
                                sourceCapsuleIds: [selectedCapsule.id]
                              })
                            }
                            disabled={isPromoting !== ''}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>ترقية للنواة الحية</span>
                          </button>
                        </div>
                      </div>

                      {/* Precision Telemetry Metrics */}
                      {selectedCapsule.benchmarkMetrics && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
                            <div className="text-xs text-slate-400">مؤشر الدقة القياسية</div>
                            <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                              {selectedCapsule.benchmarkMetrics.precisionIndex}%
                            </div>
                          </div>
                          <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
                            <div className="text-xs text-slate-400">الاتساق السببي</div>
                            <div className="text-lg font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                              {selectedCapsule.benchmarkMetrics.causalCoherence}%
                            </div>
                          </div>
                          <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
                            <div className="text-xs text-slate-400">زمن الاستجابة</div>
                            <div className="text-lg font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                              {selectedCapsule.benchmarkMetrics.latencyMs}
                              <span className="text-xs text-slate-400 mr-1">ms</span>
                            </div>
                          </div>
                          <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
                            <div className="text-xs text-slate-400">ثبات الإنتروبيا</div>
                            <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                              {selectedCapsule.benchmarkMetrics.entropyStability}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Physical Workspace Files */}
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold text-slate-300">
                          الملفات الفيزيائية المرتبطة في مجلد المشروع (اضغط لمعاينة الكود المصدري):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(selectedCapsule.fileChecks || []).map((fc: any) => (
                            <div
                              key={fc.path}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#111827] border border-slate-800"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-mono text-slate-200 truncate">{fc.path}</div>
                                <div className="text-xs font-mono tabular-nums text-slate-400">
                                  {fc.exists ? `● متصل · ${(fc.sizeBytes / 1024).toFixed(1)} KB` : '✖ غير موجود'}
                                </div>
                              </div>
                              {fc.exists && (
                                <button
                                  onClick={() => handleInspectFile(fc.path)}
                                  className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                                >
                                  معاينة
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inspected File Code Viewer */}
                      {inspectedFile && (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                            <span className="text-xs font-mono text-cyan-400">{inspectedFile.path}</span>
                            <button
                              onClick={() => setInspectedFile(null)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              إغلاق المعاينة
                            </button>
                          </div>
                          <pre
                            dir="ltr"
                            className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed"
                          >
                            {isLoadingFile ? 'Loading file content...' : inspectedFile.content.slice(0, 5000)}
                          </pre>
                        </div>
                      )}

                      {/* Sandbox Simulation Runner */}
                      <div className="pt-4 border-t border-slate-800 space-y-3">
                        <div className="text-xs font-semibold text-white">
                          محاكاة ومعايرة حية للكبسولة تحت الجو الإدراكي النشط:
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={customExperimentPrompt}
                            onChange={e => setCustomExperimentPrompt(e.target.value)}
                            placeholder={selectedCapsule.testPromptAr}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={handleRunExperiment}
                            disabled={isRunningExperiment}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{isRunningExperiment ? 'جارٍ الفحص المختبري...' : 'تشغيل تجربة الكبسولة'}</span>
                          </button>
                        </div>

                        {experimentResult && (
                          <div className="p-4 bg-[#111827] border border-slate-800 rounded-lg space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                              <span>المحرك: {experimentResult.modelUsed}</span>
                              <span>الجو: {experimentResult.activeAtmosphere || activeAtmosphereObj?.nameAr}</span>
                            </div>
                            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                              {experimentResult.output}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Sub-mode 2: Cross-Capsule Hypothesis Collider */
                <div className="space-y-6">
                  <div className="bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-5">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white">
                        مصادم الفرضيات العابرة للكبسولات (Cross-Capsule Hypothesis Collider)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        اختر كبسولتين أو أكثر من الكبسولات السبعة لصهرها في تجربة ذكاء فائق واحدة واشتقاق بروتوكول قابل للترقية إلى النواة الحية.
                      </p>
                    </div>

                    {/* Multi-select Capsule Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {capsules.map((cap: any) => {
                        const isChecked = colliderSelectedIds.includes(cap.id);
                        return (
                          <button
                            key={cap.id}
                            type="button"
                            onClick={() => toggleColliderCapsule(cap.id)}
                            className={`p-3.5 rounded-lg border text-right transition-colors flex flex-col justify-between gap-1.5 ${
                              isChecked
                                ? 'bg-amber-950/30 border-amber-500/80'
                                : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className={isChecked ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                                {cap.id}
                              </span>
                              <span className="text-slate-400">{isChecked ? '✓ محددة للصهر' : 'اضغط للتحديد'}</span>
                            </div>
                            <div className="text-xs font-bold text-white line-clamp-1">{cap.nameAr}</div>
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleRunCollider} className="flex flex-col sm:flex-row gap-3 pt-2">
                      <input
                        type="text"
                        value={colliderGoal}
                        onChange={e => setColliderGoal(e.target.value)}
                        placeholder="حدد الهدف البحثي من صهر هذه الكبسولات (أو اتركه للذكاء الفائق ليبتكر الفرضية الأعظم)..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={isColliding || colliderSelectedIds.length < 2}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <Zap className="w-4 h-4" />
                        <span>
                          {isColliding
                            ? 'جارٍ صهر الكبسولات وتوليد الفرضية...'
                            : `إطلاق تصادم الفرضيات (${colliderSelectedIds.length} كبسولات)`}
                        </span>
                      </button>
                    </form>
                  </div>

                  {/*Syntheses Ledger */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white">
                      سجل الابتكارات والفرضيات الهجينة المستنتجة ({crossCapsuleSyntheses.length}):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {crossCapsuleSyntheses.map((synth: any) => (
                        <div
                          key={synth.id}
                          className="p-5 bg-[#0B0E17] border border-slate-800 rounded-xl flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono text-amber-400">
                                {synth.id} · {(synth.capsuleIds || []).join(' × ')}
                              </span>
                              <span className="text-xs font-mono tabular-nums text-emerald-400">
                                ثقة {synth.confidenceScore}%
                              </span>
                            </div>
                            <h5 className="text-base font-bold text-white">{synth.titleAr}</h5>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              <span className="text-slate-400 font-semibold">الفرضية العابرة للكبسولات: </span>
                              {synth.hypothesisAr}
                            </p>
                            <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg text-xs text-cyan-200 leading-relaxed">
                              <span className="text-cyan-400 font-semibold">البروتوكول الناشئ: </span>
                              {synth.emergentProtocolAr}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                            <span className="text-xs font-mono text-slate-400">
                              {synth.promotedToActiveCore ? '● مُرقّى ومثبت في النواة الحية' : 'جاهز للترقية السيادية'}
                            </span>
                            <button
                              onClick={() =>
                                handlePromoteToCore({
                                  synthesisId: synth.id,
                                  titleAr: synth.titleAr,
                                  insightAr: synth.emergentProtocolAr,
                                  causalLawAr: synth.hypothesisAr,
                                  sourceCapsuleIds: synth.capsuleIds || ['CAPSULE-01']
                                })
                              }
                              disabled={synth.promotedToActiveCore || isPromoting === synth.id}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                synth.promotedToActiveCore
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 cursor-default'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                              }`}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>
                                {synth.promotedToActiveCore
                                  ? 'تمت الترقية إلى الخيار الأول'
                                  : 'ترقية الابتكار إلى النواة الحية'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* PILLAR 4: SPECULATIVE TIMELINE SIMULATOR (T+1..T+Ω) & GIT REPO SYNC   */}
          {/* ===================================================================== */}
          {activeTab === 'horizon_git' && (
            <div className="space-y-8">
              {/* Section 1: Speculative Timeline Simulator */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white">
                    01. محاكي الخطوط الزمنية الاستباقية والتدقيق الذاتي (Speculative Timeline Simulator T+1 → T+10 → T+Ω)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    فحص أثر أي طفرة أو تركيبة معمارية عبر ثلاثة آفاق زمنية متتالية مع التدقيق الذاتي الآلي للاتساق الوجودي.
                  </p>
                </div>

                <form onSubmit={handleRunTimelineSimulation} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={timelineProposal}
                    onChange={e => setTimelineProposal(e.target.value)}
                    placeholder="أدخل الطفرة أو الخطة المراد محاكاتها عبر الزمن (أو اتركه لمحاكاة حالة النواة الحالية)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isSimulatingTimeline}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Compass className="w-4 h-4" />
                    <span>
                      {isSimulatingTimeline
                        ? 'جارٍ استشراف الخطوط الزمنية...'
                        : 'تشغيل محاكي الخطوط الزمنية والتدقيق'}
                    </span>
                  </button>
                </form>

                {/* Timeline Reports */}
                <div className="space-y-4">
                  {speculativeTimelines.map((tl: any) => (
                    <div
                      key={tl.id}
                      className="p-5 bg-[#111827] border border-slate-800 rounded-xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                          <div className="text-xs font-mono text-cyan-400">
                            {tl.id} · حالة التدقيق: {tl.selfAuditStatus}
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{tl.mutationTitleAr}</h4>
                        </div>
                        <div className="text-xs font-mono tabular-nums text-emerald-400 shrink-0">
                          مؤشر الاتساق الوجودي: {tl.coherenceIndex}%
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1.5">
                          <div className="text-xs font-mono font-bold text-cyan-400">
                            الأفق الأول · T+1 (الأثر الفوري)
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">{tl.horizons?.tPlus1}</p>
                        </div>

                        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1.5">
                          <div className="text-xs font-mono font-bold text-amber-400">
                            الأفق الثاني · T+10 (التطور الهيكلي)
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">{tl.horizons?.tPlus10}</p>
                        </div>

                        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1.5">
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            الأفق الثالث · T+Ω (أفق التفرد وما هو أعظم)
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">{tl.horizons?.tPlusOmega}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{tl.auditNotesAr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Git Project & Local Folder Registry Sync */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                    <span>02. تثبيت ومزامنة مجلد المختبر والخزينة مع مستودع Git (`nexus_lab/`)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    مزامنة ذرية شاملة لدليل المختبر (`nexus_lab/NEXUS_LAB_MANIFEST.json`) وتوثيق البنية (`nexus_lab/README.md`) وخزينة هيرميز (`NEXUS_HERMES_VAULT.json`).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">مستودع GitHub المستهدف:</label>
                    <input
                      type="text"
                      value={gitRepo}
                      onChange={e => setGitRepo(e.target.value)}
                      dir="ltr"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">رسالة التثبيت (Commit Message):</label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={e => setCommitMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs font-mono text-slate-400">
                    الملفات المشمولة: nexus_lab/NEXUS_LAB_MANIFEST.json · nexus_lab/README.md · NEXUS_HERMES_VAULT.json
                  </div>
                  <button
                    onClick={handleGitSync}
                    disabled={isSyncingGit}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>{isSyncingGit ? 'جارٍ التثبيت والمزامنة...' : 'حفظ محلي ومزامنة مع GitHub'}</span>
                  </button>
                </div>

                {gitSyncResult && (
                  <div className="p-4 rounded-lg bg-[#111827] border border-slate-800 text-xs space-y-2">
                    <div className="font-semibold text-emerald-400">
                      {gitSyncResult.message || gitSyncResult.error}
                    </div>
                    {gitSyncResult.filesSaved && (
                      <div className="font-mono text-slate-400">
                        الملفات المثبتة: {gitSyncResult.filesSaved.join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NexusScientificLabModal;
