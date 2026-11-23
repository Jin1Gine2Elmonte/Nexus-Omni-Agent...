import React, { useState } from 'react';
import { X, Cpu, Globe, Zap, Compass, Terminal, CheckCircle2, Play, RefreshCw, ShieldCheck, Activity, Server, Layers, Sparkles, Sliders, HardDrive, Download, FileText, Code } from 'lucide-react';

interface AgentSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAgentTask?: (agentName: string, prompt: string) => void;
}

interface AgentCoreInfo {
  id: string;
  originalName: string;
  nexusName: string;
  arabicName: string;
  icon: any;
  color: string;
  badge: string;
  description: string;
  presets: string[];
  capabilities: string[];
  status: 'active' | 'standby' | 'processing';
  planetarySpec: {
    threads: number;
    memoryBus: string;
    throughput: string;
    horizon: string;
  };
}

export const AgentSuiteModal: React.FC<AgentSuiteModalProps> = ({ isOpen, onClose, onExecuteAgentTask }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('claw-cortex');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [targetExternalUrl, setTargetExternalUrl] = useState<string>('');
  const [openClawMode, setOpenClawMode] = useState<'markdown' | 'json_schema' | 'headers' | 'links'>('markdown');
  const [crawledSiteInfo, setCrawledSiteInfo] = useState<{
    url: string;
    status: number;
    latencyMs?: number;
    title: string;
    linksCount: number;
    headingsCount?: number;
  } | null>(null);
  const [allocatedThreads, setAllocatedThreads] = useState<number>(1024);
  const [allocatedMemory, setAllocatedMemory] = useState<string>('1.0 TB Sovereign Matrix RAM');
  const [executionDepth, setExecutionDepth] = useState<string>('Planetary Deep Recursive Execution');
  const [isUnbounded, setIsUnbounded] = useState<boolean>(true);

  // Google Agentic Tools & Multi-Format File Studio State
  const [selectedFileFormat, setSelectedFileFormat] = useState<
    'word_doc' | 'excel_csv' | 'pdf_report' | 'html_app' | 'python_script' | 'sql_schema' | 'json_schema' | 'markdown_doc'
  >('word_doc');
  const [enableGoogleCodeExec, setEnableGoogleCodeExec] = useState<boolean>(true);
  const [enableGoogleSearchTool, setEnableGoogleSearchTool] = useState<boolean>(true);
  const [enableGoogleUrlContext, setEnableGoogleUrlContext] = useState<boolean>(true);
  const [enableGoogleMapsTool, setEnableGoogleMapsTool] = useState<boolean>(false);
  const [isGeneratingFile, setIsGeneratingFile] = useState<boolean>(false);
  const [generatedFileArtifact, setGeneratedFileArtifact] = useState<{
    fileName: string;
    fileLabelAr: string;
    mimeType: string;
    fileContent: string;
    rawAnalysisAr: string;
    executedPythonCode?: string | null;
    pythonSandboxOutput?: string | null;
    usedGoogleTools: string[];
  } | null>(null);

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [agentOutput, setAgentOutput] = useState<string>('');
  const [agentLogs, setAgentLogs] = useState<string[]>([
    "[NEXUS::ChironRuntime]: Sovereign Hydrogen Executive Arms & Matrix Bus ready.",
    "[NEXUS::WebCortex]: Live external web crawling & DOM/API extraction armed (Real-Time Active).",
    "[GOOGLE AGENTIC TOOLS]: Python Code Execution Sandbox + Search/Maps/URL Context ready.",
    "[NEXUS::HermesMemory]: Contextual memory loop & Pale Archive integration armed.",
    "[NEXUS::MCP Bridge]: STDIO/SSE external tool & API bridge active."
  ]);

  const AGENTS: AgentCoreInfo[] = [
    {
      id: 'claw-cortex',
      originalName: 'Sovereign Web Cortex',
      nexusName: 'NEXUS::WebCortex',
      arabicName: 'مستخلص المواقع الخارجية والتنقيب الشبكي المباشر',
      icon: Globe,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Live Web & API Cortex',
      description: 'ذراع الاستخلاص المباشر والتنقيب في المواقع الخارجية (يعمل أيضاً تلقائياً في الوقت الحقيقي أثناء تفكير نيكسوس). يتصل بالروابط والـ APIs الحية، يستخرج عناصر الـ DOM، الروابط، الترويسات، ويبني مخططات JSON Schema شاملة.',
      presets: [
        'استخرج الهيكل الكامل والروابط والبيانات الأساسية من الموقع المحدد مع بناء JSON Schema',
        'قم بالتنقيب عن أحدث المستجدات التقنية في مجال الذكاء الاصطناعي ونسقها في تقرير منظم',
        'تحليل هيكلية API ومسارات الوصول للخدمات الخارجية مع تفكيك الترويسات والبروتوكولات'
      ],
      capabilities: [
        'Live External Website Crawling & DOM Extraction',
        'Entity Extraction into Pale Archive Knowledge Graph',
        'HTTP Header, Status & Dynamic API Inspection',
        'Exhaustive JSON Schema Auto-Generation'
      ],
      status: 'active',
      planetarySpec: {
        threads: 1024,
        memoryBus: '1.0 TB Sovereign Matrix RAM',
        throughput: '124,000 Entities / sec',
        horizon: 'Live External DOM & API Crawl'
      }
    },
    {
      id: 'hermes-directive',
      originalName: 'Hermes Contextual Memory Organ',
      nexusName: 'NEXUS::HermesMemory',
      arabicName: 'عضو الذاكرة السياقية التراكمية والأرشيف الشاحب (هيرمز)',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      badge: 'Contextual Memory & Synthesis',
      description: 'عضو هيرمز للذاكرة السياقية التراكمية داخل نيكسوس. يدمج مخرجات المواقع الخارجية مع الأرشيف الشاحب والاستدلال السببي العميق.',
      presets: [
        'تشكيل حالة عمل سياقية من الأرشيف الشاحب لحل معضلة هندسية أو معمارية عميقة',
        'تفعيل التحليل المعماري الصارم وتوليد استدعاء وظائف متوازٍ (Parallel Function Calling)',
        'تحديث شجرة المهارات المعرفية بناءً على البيانات المستخلصة من الويب'
      ],
      capabilities: [
        'Hermes Contextual Memory Loop (Pale Archive ↔ Cognitive State)',
        'Persistent KV-Cache & System Prompt Pre-Baking',
        'Multi-Angle Causal Excavation & Gap Bridging',
        'External Memory Migration & Synthesis'
      ],
      status: 'active',
      planetarySpec: {
        threads: 2048,
        memoryBus: '2.5 TB Reasoning RAM + Adaptive KV-Memory',
        throughput: '85,000 Logical Tokens / sec',
        horizon: 'Continuous Cross-Session Growth'
      }
    },
    {
      id: 'odysseus-path',
      originalName: 'Odysseus Long-Horizon Organ',
      nexusName: 'NEXUS::OdysseusHorizon',
      arabicName: 'عضو تخطيط المسارات الاستراتيجية طويلة المدى (أوديسي)',
      icon: Compass,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Strategic Long-Horizon Planner',
      description: 'عضو أوديسي لتخطيط المسارات الاستراتيجية للمهام الكبرى داخل نيكسوس. يفكك الأهداف المعقدة والخطط طويلة المدى إلى مراحل تنفيذية قابلة للقياس.',
      presets: [
        'ابنِ خطة عمل استراتيجية طويلة المدى لتطوير منصة تقنية متكاملة',
        'تفكيك الهدف الكبير إلى مراحل متسلسلة مع تقييم متقدم للمخاطر والبدائل',
        'إنشاء مسار معالجة ذاتية ونقاط استعادة في حال تغير المعطيات'
      ],
      capabilities: [
        'Long-Horizon Multi-Step Task Decomposition',
        'Self-Healing Error Loops & Dynamic Vector Re-routing',
        'Exhaustive Goal Verification & Milestone Topologies',
        'Cross-Session Horizon Persistence'
      ],
      status: 'active',
      planetarySpec: {
        threads: 512,
        memoryBus: '512 GB Horizon Memory Bank',
        throughput: '45,000 Milestones / sec',
        horizon: 'Multi-Phase Strategic Vector'
      }
    },
    {
      id: 'agent-os-kernel',
      originalName: 'Chiron Sovereign Runtime',
      nexusName: 'NEXUS::ChironRuntime',
      arabicName: 'نواة شيرون التنفيذية لإدارة الأذرع والتيرمنال السيادي',
      icon: Cpu,
      color: 'from-purple-500 to-indigo-600',
      badge: 'Chiron Executive Runtime',
      description: 'نواة شيرون التنفيذية الأصيلة داخل نيكسوس. تنسق عمل أذرع الهيدروجين التنفيذية (gemini-4-hydrogen) والتيرمنال السيادي وفحص سلامة الأكواد والملفات.',
      presets: [
        'فحص حالة الأذرع التنفيذية والذاكرة المخصصة للمشروع',
        'جدولة مهام تنفيذية مفصلة عبر أذرع الهيدروجين المتوازية',
        'مزامنة ناقل الذاكرة مع الأرشيف الشاحب'
      ],
      capabilities: [
        'Parallel Hydrogen Executive Arm Orchestration',
        'Terminal & External Sandbox Execution Bridge',
        'AST Compiler Verification & Zero-Stub Enforcement',
        'Real-time Memory & High-Throughput Allocator'
      ],
      status: 'active',
      planetarySpec: {
        threads: 4096,
        memoryBus: 'Unified Nexus Sovereign Bus',
        throughput: '500,000 Ops / sec',
        horizon: 'Native Kernel Real-Time'
      }
    },
    {
      id: 'mcp-bridge',
      originalName: 'Model Context Protocol (MCP)',
      nexusName: 'NEXUS::MCP Bridge',
      arabicName: 'بروتوكول سياق النموذج وجسر الاتصال الخارجي (MCP)',
      icon: Server,
      color: 'from-pink-500 to-rose-600',
      badge: 'MCP External Protocol',
      description: 'جسر الربط والتشغيل البيني الديناميكي لربط الأدوات الخارجية، واجهات البرمجة (APIs)، وخوادم MCP بالنظام.',
      presets: [
        'إنشاء مواصفة خادم MCP لربط أدوات النظام والـ APIs الخارجية',
        'تحليل نقطة نهاية API خارجية وتوليد موصلات JSON-RPC جاهزة',
        'مزامنة أدوات التفتيش والتحليل عبر بروتوكول SSE Dynamic Transport'
      ],
      capabilities: [
        'STDIO & SSE/WebSocket Dual Transport Architecture',
        'Dynamic External API & Tool Schema Discovery',
        'MCP Server/Client Protocol Orchestration',
        'Zero-Latency Context Injection'
      ],
      status: 'active',
      planetarySpec: {
        threads: 1024,
        memoryBus: '512 GB Protocol Context Bus',
        throughput: '250,000 Messages / sec',
        horizon: 'STDIO / SSE Real-time Pipe'
      }
    }
  ];

  const selectedAgent = AGENTS.find(a => a.id === selectedAgentId) || AGENTS[0];

  const handleDirectOpenClawCrawl = async () => {
    if (!targetExternalUrl.trim()) return;
    setIsExecuting(true);
    setAgentOutput('');
    setCrawledSiteInfo(null);
    const timestamp = new Date().toLocaleTimeString();
    setAgentLogs(prev => [
      ...prev,
      `[${timestamp}] [OpenClaw External Crawler]: Connecting to ${targetExternalUrl.trim()} (mode=${openClawMode})...`
    ]);

    try {
      const response = await fetch('/api/agent-os/openclaw/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetExternalUrl.trim(),
          mode: openClawMode,
          analyzeWithAi: true,
          customDirective:
            customPrompt.trim() ||
            (openClawMode === 'json_schema'
              ? 'استخرج كافة الكيانات والبيانات من الموقع وابنِ JSON Schema شامل مع شرح الحقول.'
              : openClawMode === 'headers'
              ? 'حلل ترويسات HTTP وبنية الخادم والأمان ونقاط النهاية البرمجية للموقع.'
              : openClawMode === 'links'
              ? 'استخرج خريطة الروابط والمسارات الهيكلية للموقع وصنفها.'
              : 'استخرج المحتوى الكامل للموقع ولخص أهم أقسامه وبياناته التقنية بدقة.')
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل الاتصال بالموقع الخارجي');
      }

      const fr = data.fetchResult;
      setCrawledSiteInfo({
        url: fr.finalUrl || targetExternalUrl,
        status: fr.status,
        latencyMs: fr.latencyMs,
        title: fr.title,
        linksCount: (fr.links || []).length,
        headingsCount: (fr.headings || []).length
      });

      const headersText = Object.entries(fr.headers || {})
        .slice(0, 12)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n');

      const linksText = (fr.links || [])
        .slice(0, 15)
        .map((l: any) => `  • ${l.text} -> ${l.href}`)
        .join('\n');

      const combinedReport = [
        `=== [OPENCLAW LIVE EXTERNAL EXTRACTION REPORT] ===`,
        `الرابط النهائي: ${fr.finalUrl}`,
        `حالة الاتصال: HTTP ${fr.status} ${fr.statusText} (${fr.latencyMs}ms) | النوع: ${fr.contentType}`,
        `عنوان الصفحة: ${fr.title}`,
        fr.metaDescription ? `الوصف: ${fr.metaDescription}` : '',
        ``,
        openClawMode === 'headers' ? `--- ترويسات الخادم (HTTP Headers) ---\n${headersText}\n` : '',
        (fr.links || []).length > 0 ? `--- أبرز الروابط المستخرجة (${fr.links.length}) ---\n${linksText}\n` : '',
        data.aiSynthesis
          ? `--- التحليل الذكي والاستخلاص الهيكلي (NEXUS::ClawCortex) ---\n${data.aiSynthesis}`
          : `--- النص المستخرج من الموقع ---\n${(fr.cleanText || '').slice(0, 4000)}`
      ]
        .filter(Boolean)
        .join('\n');

      setAgentOutput(combinedReport);
      setAgentLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [OpenClaw]: Fetched ${fr.finalUrl} (HTTP ${fr.status} in ${fr.latencyMs}ms, ${(fr.links || []).length} links).`
      ]);
    } catch (err: any) {
      setAgentOutput(`[خطأ أثناء الوصول للموقع الخارجي]: ${err?.message || 'تعذر الجلب'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunTask = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || customPrompt || (targetExternalUrl ? `حلل الموقع الخارجي ${targetExternalUrl} واستخرج بياناته الكاملة` : '');
    if (!promptToUse.trim()) return;

    setIsExecuting(true);
    setAgentOutput('');
    
    const timestamp = new Date().toLocaleTimeString();
    setAgentLogs(prev => [...prev, `[${timestamp}] [${selectedAgent.nexusName}]: Executing task${targetExternalUrl ? ` with live URL ${targetExternalUrl}` : ''}...`]);

    try {
      const response = await fetch('/api/agent-os/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          prompt: promptToUse,
          targetUrl: targetExternalUrl.trim() || undefined,
          threads: allocatedThreads,
          memoryAlloc: allocatedMemory,
          depthLevel: executionDepth,
          unbounded: isUnbounded
        })
      });

      if (!response.ok) {
        throw new Error(`Execution error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.crawledSite) {
        setCrawledSiteInfo(data.crawledSite);
      }
      setAgentOutput(data.result || "Planetary execution completed successfully.");
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [${selectedAgent.nexusName}]: Task completed & memory bus updated.`]);
    } catch (err: any) {
      setAgentOutput(`[ERROR]: ${err?.message || "Failed to execute sub-agent task."}`);
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [${selectedAgent.nexusName}]: Execution error.`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSynthesizeMatrix = async () => {
    const promptToUse = customPrompt.trim() || (targetExternalUrl ? `تحليل شامل للموقع ${targetExternalUrl}` : '');
    if (!promptToUse) return;

    setIsSynthesizing(true);
    setAgentOutput('');
    
    const timestamp = new Date().toLocaleTimeString();
    setAgentLogs(prev => [...prev, `[${timestamp}] [PLANETARY MATRIX]: Launching simultaneous Multi-Core Synthesis...`]);

    try {
      const response = await fetch('/api/agent-os/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          targetUrl: targetExternalUrl.trim() || undefined,
          depthLevel: executionDepth
        })
      });

      if (!response.ok) {
        throw new Error(`Synthesis error: ${response.statusText}`);
      }

      const data = await response.json();
      setAgentOutput(data.synthesis || "Planetary synthesis completed.");
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [PLANETARY MATRIX]: All Cores synthesized.`]);
    } catch (err: any) {
      setAgentOutput(`[ERROR]: ${err?.message || "Failed to synthesize matrix."}`);
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [PLANETARY MATRIX]: Synthesis failed.`]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleGenerateGoogleAgenticFile = async () => {
    const promptToUse = customPrompt.trim() || (targetExternalUrl.trim() ? `قم بتحليل وتوثيق محتوى وبيانات الموقع ${targetExternalUrl.trim()} بشكل شامل` : '');
    if (!promptToUse) return;

    setIsGeneratingFile(true);
    setGeneratedFileArtifact(null);
    const timestamp = new Date().toLocaleTimeString();
    setAgentLogs(prev => [
      ...prev,
      `[${timestamp}] [GOOGLE AGENTIC FILE STUDIO]: Generating ${selectedFileFormat} with CodeExec=${enableGoogleCodeExec}, Search=${enableGoogleSearchTool}...`
    ]);

    try {
      const response = await fetch('/api/agent-os/google-agentic-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          fileFormat: selectedFileFormat,
          enableCodeExecution: enableGoogleCodeExec,
          enableGoogleSearch: enableGoogleSearchTool,
          enableUrlContext: enableGoogleUrlContext,
          enableGoogleMaps: enableGoogleMapsTool,
          targetUrl: targetExternalUrl.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل توليد الملف عبر أدوات جوجل الوكيلية');
      }

      setGeneratedFileArtifact({
        fileName: data.fileName,
        fileLabelAr: data.fileLabelAr,
        mimeType: data.mimeType,
        fileContent: data.fileContent,
        rawAnalysisAr: data.rawAnalysisAr,
        executedPythonCode: data.executedPythonCode,
        pythonSandboxOutput: data.pythonSandboxOutput,
        usedGoogleTools: data.usedGoogleTools || []
      });

      setAgentOutput(
        [
          `=== [تم إنشاء الملف بنجاح عبر أدوات جوجل الوكيلية] ===`,
          `• اسم الملف الجاهز للتنزيل: ${data.fileName} (${data.fileLabelAr})`,
          `• أدوات جوجل المستخدمة: ${(data.usedGoogleTools || []).join(' + ') || 'Gemini Core'}`,
          data.executedPythonCode
            ? `\n--- [كود Python الذي نفّذه جوجل في بيئة المعالجة المعزولة (Code Execution Sandbox)] ---\n${data.executedPythonCode}`
            : '',
          data.pythonSandboxOutput
            ? `\n--- [نتيجة تنفيذ الكود في بيئة جوجل] ---\n${data.pythonSandboxOutput}`
            : '',
          `\n--- [معاينة المحتوى والتحليل] ---\n${data.rawAnalysisAr}`
        ]
          .filter(Boolean)
          .join('\n')
      );

      setAgentLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [GOOGLE AGENTIC FILE STUDIO]: Ready -> ${data.fileName}`
      ]);
    } catch (err: any) {
      setAgentOutput(`[خطأ أثناء توليد الملف]: ${err?.message || 'تعذر إتمام العملية'}`);
    } finally {
      setIsGeneratingFile(false);
    }
  };

  const handleDownloadGeneratedFile = () => {
    if (!generatedFileArtifact) return;
    const blob = new Blob([generatedFileArtifact.fileContent], { type: generatedFileArtifact.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generatedFileArtifact.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#09090b] border border-cyan-500/30 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-950/50">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <Cpu size={22} className="text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-cyan-400 font-mono text-base uppercase tracking-widest font-bold">
                  NEXUS::SOVEREIGN EXECUTIVE ARMS (CHIRON · HERMES · ODYSSEUS)
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded font-bold uppercase">
                  NATIVE NEXUS ORGANS
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                الأذرع التنفيذية والأعضاء المعرفية الأصيلة داخل بنية نيكسوس الموحدة (شيرون · هيرمز · أوديسي · القشرة الشبكية)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          
          {/* Sidebar - Agent Cards List */}
          <div className="md:col-span-4 p-4 overflow-y-auto space-y-3 bg-zinc-950/40">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-1 flex items-center justify-between">
              <span>Sovereign Sub-Agent Cores</span>
              <span className="text-cyan-400 font-bold">4 Active Cores</span>
            </div>

            {AGENTS.map((agent) => {
              const IconComp = agent.icon;
              const isSelected = agent.id === selectedAgentId;
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    setAllocatedThreads(agent.planetarySpec.threads);
                    setAllocatedMemory(agent.planetarySpec.memoryBus);
                    setAgentOutput('');
                  }}
                  className={`w-full text-right p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-zinc-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                      : 'bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${agent.color} text-white`}>
                        <IconComp size={16} />
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-200 truncate">
                        {agent.nexusName}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                      {agent.planetarySpec.threads} Threads
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-mono line-clamp-1 leading-snug">
                    {agent.arabicName}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-[9px] font-mono text-zinc-500">
                    <span>الذاكرة: <span className="text-cyan-400/80">{agent.planetarySpec.memoryBus}</span></span>
                    <span className="text-amber-400 font-bold">{agent.planetarySpec.throughput}</span>
                  </div>
                </button>
              );
            })}

            {/* Quick Planet Scale Controls */}
            <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono font-bold">
                <Sliders size={14} className="text-cyan-400" />
                تكوين السعة الكوكبية (Capacity Config)
              </div>
              
              <div className="space-y-2 text-[10px] font-mono">
                <div>
                  <span className="text-zinc-400 block mb-1">الخيوط الافتراضية (Virtual Threads):</span>
                  <select 
                    value={allocatedThreads} 
                    onChange={(e) => setAllocatedThreads(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-cyan-300 p-1.5 rounded outline-none"
                  >
                    <option value={256}>256 Virtual Threads</option>
                    <option value={512}>512 Virtual Threads</option>
                    <option value={1024}>1024 Virtual Threads (Standard)</option>
                    <option value={2048}>2048 Virtual Threads (Planet Scale)</option>
                    <option value={4096}>4096 Virtual Threads (Tesseract Max)</option>
                  </select>
                </div>

                <div>
                  <span className="text-zinc-400 block mb-1">عمق التنفيذ (Execution Depth):</span>
                  <select 
                    value={executionDepth} 
                    onChange={(e) => setExecutionDepth(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-cyan-300 p-1.5 rounded outline-none"
                  >
                    <option value="Standard Deep Execution">Standard Deep Execution</option>
                    <option value="Planetary Deep Recursive Execution">Planetary Deep Recursive Execution</option>
                    <option value="Unconstrained Infinite Synthesis">Unconstrained Infinite Synthesis</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area - Agent Details & Direct Workspace */}
          <div className="md:col-span-8 p-5 overflow-y-auto flex flex-col space-y-5 bg-[#09090b]">
            
            {/* Top Details Card */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${selectedAgent.color} text-white shadow-md`}>
                    <selectedAgent.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-zinc-100 flex items-center gap-2">
                      {selectedAgent.nexusName}
                      <span className="text-xs font-normal text-zinc-500">
                        (المحرك الأصلي: {selectedAgent.originalName})
                      </span>
                    </h3>
                    <p className="text-xs text-cyan-400 font-mono">{selectedAgent.arabicName}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 rounded-lg">
                  {selectedAgent.badge}
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                {selectedAgent.description}
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60 text-[10px] font-mono">
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">الخيوط المخصصة:</span>
                  <span className="text-cyan-400 font-bold">{allocatedThreads} Threads</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">ناقل الذاكرة:</span>
                  <span className="text-emerald-400 font-bold truncate block">{allocatedMemory}</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">معدل المعالجة:</span>
                  <span className="text-amber-400 font-bold">{selectedAgent.planetarySpec.throughput}</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block">عمق الأفق:</span>
                  <span className="text-purple-400 font-bold">{selectedAgent.planetarySpec.horizon}</span>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider font-semibold">
                  نماذج توجيه كوكبية فورية (Presets):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCustomPrompt(preset);
                        handleRunTask(preset);
                      }}
                      className="text-[10px] font-mono text-zinc-300 bg-zinc-950 hover:bg-zinc-800 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 px-2.5 py-1 rounded-lg transition-colors text-right"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capabilities Grid */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider font-semibold">
                  قدرات النواة التنفيذية الكوكبية:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedAgent.capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Execution, Sovereign External URL Gateway & Planet Matrix Console */}
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Direct External URL & API Access Box */}
              <div className="p-3.5 rounded-xl bg-cyan-950/15 border border-cyan-500/30 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-cyan-300 flex items-center gap-2">
                    <Globe size={14} className="text-cyan-400" />
                    <span>بوابة الاستخلاص الشبكي المباشر للمواقع الخارجية والـ APIs (تعمل تلقائياً أيضاً أثناء تفكير نيكسوس)</span>
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { id: 'markdown', label: 'زحف المحتوى الكامل' },
                      { id: 'json_schema', label: 'استخراج JSON Schema' },
                      { id: 'links', label: 'خريطة الروابط' },
                      { id: 'headers', label: 'فحص الترويسات والـ API' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setOpenClawMode(m.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition ${
                          openClawMode === m.id
                            ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={targetExternalUrl}
                    onChange={e => setTargetExternalUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDirectOpenClawCrawl()}
                    placeholder="https://example.com أو رابط API خارجي..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/60 rounded-xl px-3.5 py-2 text-xs text-cyan-200 font-mono placeholder:text-zinc-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleDirectOpenClawCrawl}
                    disabled={isExecuting || isSynthesizing || !targetExternalUrl.trim()}
                    className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-40 shrink-0"
                  >
                    {isExecuting ? <RefreshCw size={13} className="animate-spin" /> : <Globe size={13} />}
                    <span>استخلاص الموقع الآن</span>
                  </button>
                </div>

                {crawledSiteInfo && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-zinc-300 border-t border-cyan-500/20">
                    <span className="truncate max-w-md font-mono text-emerald-300">
                      HTTP {crawledSiteInfo.status} · {crawledSiteInfo.latencyMs || 0}ms · {crawledSiteInfo.title}
                    </span>
                    <span className="text-zinc-400 font-mono">
                      الروابط المكتشفة: {crawledSiteInfo.linksCount} · العناوين: {crawledSiteInfo.headingsCount || 0}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-2">
                  <Terminal size={14} className="text-cyan-400" />
                  توجيه الذراع الوكيلي النشط [{selectedAgent.nexusName}]
                </span>
                <span className="text-[10px] text-zinc-500">يدعم الروابط الحية والبحث الشبكي</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunTask()}
                  placeholder={`أدخل المهمة أو الرابط الخارجي لـ ${selectedAgent.nexusName}...`}
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/60 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition-colors"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunTask()}
                    disabled={isExecuting || isSynthesizing || (!customPrompt.trim() && !targetExternalUrl.trim())}
                    className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isExecuting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    تشغيل الذراع
                  </button>

                  <button
                    onClick={handleSynthesizeMatrix}
                    disabled={isExecuting || isSynthesizing || (!customPrompt.trim() && !targetExternalUrl.trim())}
                    className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 border border-purple-400/30"
                    title="تشغيل كافة الأذرع الوكيلية في نفس الوقت وتوليف النتائج"
                  >
                    {isSynthesizing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    توليف الأذرع
                  </button>
                </div>
              </div>

              {/* Google Agentic Tools & Multi-Format File Studio */}
              <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <FileText size={14} className="text-amber-400" />
                    استوديو أدوات جوجل الوكيلية وتوليد الملفات (Google Agentic Tools & File Studio)
                  </span>
                  <span className="text-[10px] font-mono text-amber-200/80 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                    Python Sandbox + Search + URL Context + Maps
                  </span>
                </div>

                {/* Google Native Agentic Tools Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEnableGoogleCodeExec(!enableGoogleCodeExec)}
                    className={`px-2.5 py-1.5 rounded-lg border text-right flex items-center justify-between transition ${
                      enableGoogleCodeExec
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Code size={12} /> Python Sandbox</span>
                    <span className="text-[9px] font-mono">{enableGoogleCodeExec ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnableGoogleSearchTool(!enableGoogleSearchTool)}
                    className={`px-2.5 py-1.5 rounded-lg border text-right flex items-center justify-between transition ${
                      enableGoogleSearchTool
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Globe size={12} /> Google Search</span>
                    <span className="text-[9px] font-mono">{enableGoogleSearchTool ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnableGoogleUrlContext(!enableGoogleUrlContext)}
                    className={`px-2.5 py-1.5 rounded-lg border text-right flex items-center justify-between transition ${
                      enableGoogleUrlContext
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Compass size={12} /> URL Context</span>
                    <span className="text-[9px] font-mono">{enableGoogleUrlContext ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnableGoogleMapsTool(!enableGoogleMapsTool)}
                    className={`px-2.5 py-1.5 rounded-lg border text-right flex items-center justify-between transition ${
                      enableGoogleMapsTool
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Layers size={12} /> Google Maps</span>
                    <span className="text-[9px] font-mono">{enableGoogleMapsTool ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* File Format Selection & Generate Action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <select
                    value={selectedFileFormat}
                    onChange={(e) => setSelectedFileFormat(e.target.value as any)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500/60 rounded-xl px-3 py-2 text-xs text-amber-200 font-sans outline-none"
                  >
                    <option value="word_doc">مستند Microsoft Word احترافي (.doc)</option>
                    <option value="excel_csv">جدول بيانات Excel جاهز للتحليل (.csv)</option>
                    <option value="pdf_report">تقرير تنفيذي قابل للطباعة كـ PDF (.html)</option>
                    <option value="html_app">تطبيق ويب تفاعلي مستقل (.html)</option>
                    <option value="python_script">سكربت بايثون تنفيذي (.py)</option>
                    <option value="sql_schema">قاعدة بيانات وهيكلية جداول (.sql)</option>
                    <option value="json_schema">بيانات مهيكلة وواجهة برمجية (.json)</option>
                    <option value="markdown_doc">وثيقة تقنية شاملة (.md)</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateGoogleAgenticFile}
                    disabled={isGeneratingFile || isExecuting || isSynthesizing}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0"
                  >
                    {isGeneratingFile ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                    <span>إنشاء وتوليد الملف الآن</span>
                  </button>

                  {generatedFileArtifact && (
                    <button
                      type="button"
                      onClick={handleDownloadGeneratedFile}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 shadow-lg shadow-emerald-500/10"
                    >
                      <Download size={14} />
                      <span>تنزيل ({generatedFileArtifact.fileName})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Output Display */}
              {agentOutput && (
                <div className="p-3.5 bg-zinc-950 border border-cyan-500/30 rounded-xl font-mono text-xs text-zinc-300 space-y-2 max-h-60 overflow-y-auto">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="flex items-center gap-1.5"><Activity size={12} /> نتيجة تنفيذ الذراع الوكيلي والتيرمنال</span>
                    <div className="flex items-center gap-2">
                      {onExecuteAgentTask && (
                        <button
                          type="button"
                          onClick={() => {
                            onExecuteAgentTask(
                              selectedAgent.nexusName,
                              `قم بالبناء على مخرجات الذراع الوكيلي (${selectedAgent.nexusName})${targetExternalUrl ? ` للموقع ${targetExternalUrl}` : ''}:\n\n${agentOutput.slice(0, 2500)}`
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[10px] font-sans font-bold transition"
                        >
                          إرسال النتيجة للمحادثة الرئيسية
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-[11px] font-sans">
                    {agentOutput}
                  </pre>
                </div>
              )}

              {/* Live Kernel Console Logs */}
              <div className="p-3 bg-black/80 border border-zinc-800/80 rounded-xl font-mono text-[10px] space-y-1 overflow-y-auto max-h-28">
                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                  <Server size={11} className="text-emerald-400" /> سجل عمليات الأذرع الوكيلية والتيرمنال والوصول الخارجي
                </div>
                {agentLogs.map((log, i) => (
                  <div key={i} className="text-zinc-400 leading-tight">
                    {log}
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-[11px]">5 أذرع وكيلية وأدوات جوجل متصلة بالتيرمنال الداخلي وتعمل في الوقت الحقيقي أثناء تفكير نيكسوس</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

export default AgentSuiteModal;
