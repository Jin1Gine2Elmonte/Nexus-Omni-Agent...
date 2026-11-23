import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Activity, Settings, Terminal as TerminalIcon, Menu, X, Paperclip, File as FileIcon, Download, Cloud, Database, RefreshCw, Trash2, Upload, Hexagon, Cpu, Plus, MessageSquare, History, ChevronUp, ChevronDown, Zap, Globe, Crown, Aperture, Image as ImageIcon, Gem, LogOut, User as UserIcon, Box, PenTool, Eye, Search, CheckCircle2, FlaskConical, Shield, Lock, Orbit, GitBranch, BookOpen, Pin, MoreHorizontal, Edit2, PanelRightClose, PanelRightOpen, Check } from 'lucide-react';
import ChatMessage, { KineticLiveSpinner, CompletedGreenCheckCircle } from './components/ChatMessage';
import PaleArchiveModal from './components/PaleArchiveModal';
import MindMapModal from './components/MindMapModal';
import GalleryModal from './components/GalleryModal';
import MemoryAuditorModal from './components/MemoryAuditorModal';
import { PrismManifestationModal } from './components/PrismManifestationModal';
import NexusOntologicalLayersModal from './components/NexusOntologicalLayersModal';
import { NexusOmegaObservatoryModal } from './components/NexusOmegaObservatoryModal';
import AgentSuiteModal from './components/AgentSuiteModal';
import PolymathMatrixModal from './components/PolymathMatrixModal';
import NexusForgeModal from './components/NexusForgeModal';
import NexusScientificLabModal from './components/NexusScientificLabModal';
import SovereignSettingsDatabaseModal from './components/SovereignSettingsDatabaseModal';
import RecursiveImprovementLabModal from './components/RecursiveImprovementLabModal';
import NexusCanvasStudioModal, { CanvasStudioTab } from './components/NexusCanvasStudioModal';
import GeminiNotebookHubModal from './components/GeminiNotebookHubModal';
import GoogleServicesConnectModal from './components/GoogleServicesConnectModal';
import {
  createGoogleDocInWorkspace,
  createGoogleSheetInWorkspace,
  uploadFileToGoogleDrive,
  hasMarkdownOrCsvTable,
  hasCodeBlocksOrProjectFiles,
  extractRowsFromTextForSheets,
  executeMcpWorkspacePreContext,
  executeMcpWorkspaceAutoExportIfRequested,
  syncNotebookLMToGoogleDrive,
  extractFileViaWorkspaceRagEngine
} from './services/googleWorkspaceService';
import {
  retrieveGroundedNotebookContext,
  ingestUrlIntoNotebookSource,
  ingestBrowserFileIntoWorkspaceRag,
  UNIVERSAL_FILE_ACCEPT_EXTENSIONS
} from './services/notebookLmEngine';
import { Message, ProcessingStage, LogEntry, Attachment, SyncStatus, SessionsMap, Session, MemoryBank, RecursiveLabEvaluation, GeminiNotebookItem, GeminiNotebookUsageMode, GeminiNotebookSource } from './types';
import { generateOmniResponse, streamOmniResponse, generateAudioBriefing, generateVisualArtifact, crystallizeSession, retrieveRelevantMemory, extractEntitiesAndRelations, auditMemoryMatrix, DeepManifestationState, fetchActiveServerJobs, pollServerJobUntilComplete } from './services/geminiService';
import { detectVisualGenerationIntent } from './services/visualIntent';
import {
  loadLocalSessions,
  saveLocalSessions,
  clearLocalMemory,
  createNewSession,
  buildGlobalContext,
  loadMemoryBank,
  saveMemoryBank,
  loadFromTitanium,
  scanAndRecoverAllBrowserSessions,
  calculateObjectSize,
  formatSize,
  incrementTrust,
  DEFAULT_SOUL_PRINT,
  loadSessionsFromServer,
  loadMemoryBankFromServer,
  mergeSessionsAuthoritative,
  deleteSessionFromServer,
  deriveAccountScopeId,
  getActiveAccountScope,
  setActiveAccountScope,
  getSavedAccountsRegistry,
  registerSavedAccountOnDevice,
  removeSavedAccountFromDevice,
  createInitialMemoryBank,
  SavedFirebaseAccountEntry
} from './services/storageService';
import {
  DEFAULT_SUCCESS_CRITERIA,
  detectAndApplyUserCorrection,
  applyExplicitUserCorrectionToMemory,
  mergeEvaluationIntoMemoryBank,
  buildBaselineSubThinkingEvaluation,
  enrichSubThinkingEvaluationFromLiveThoughts
} from './services/recursiveImprovementLab';
import { NexusTerminalPanel } from './components/NexusTerminalPanel';
import { AdminImportBoxModal } from './components/AdminImportBoxModal';
import {
  auth,
  signInWithFirebaseGoogle,
  signOutFromFirebase,
  onAuthStateChanged,
  syncSessionToFirestore,
  deleteSessionFromFirestore,
  syncAxiomsToFirestore,
  syncAdaptiveVaultAndOrbitsToFirestore,
  loadUserCloudStateFromFirestore,
  enableFirebaseUniversalVaultMode,
  syncAccountStateToFirebaseVaultMirror,
  loadAccountStateFromFirebaseVaultMirror,
  User as FirebaseUser
} from './services/firebaseClient';
import {
  DEFAULT_COGNITIVE_ORBITS,
  DEFAULT_SECURITY_SETTINGS,
  PRIMARY_SECURITY_ADMIN_EMAIL,
  initializeSkillEvolutions,
  processUserInteractionLearningAndOrbits,
  buildAdaptiveOrbitsAndSkillsContext,
  isAuthorizedSiteOwnerOrAdmin
} from './services/sovereignVaultAndOrbitsService';

// --- O(1) MAP-INDEXED LOOKUP & UPDATE HELPERS FOR SESSIONS.MESSAGES & MEMORYBANK.AXIOMS ---
const sessionMessagesMapCache = new WeakMap<Message[], Map<string, number>>();

function getMessageIndexByIdFast(messages: Message[], targetId: string): number {
  const len = messages.length;
  if (len === 0) return -1;
  // Fast O(1) check on tail & penultimate elements (covers 99.9% of active streaming updates)
  if (messages[len - 1]?.id === targetId) return len - 1;
  if (len > 1 && messages[len - 2]?.id === targetId) return len - 2;

  let indexMap = sessionMessagesMapCache.get(messages);
  if (!indexMap) {
    indexMap = new Map<string, number>();
    for (let i = 0; i < len; i++) {
      const m = messages[i];
      if (m?.id) indexMap.set(m.id, i);
    }
    sessionMessagesMapCache.set(messages, indexMap);
  }
  const found = indexMap.get(targetId);
  return found !== undefined ? found : -1;
}

function updateSessionMessageFastWithMap(
  session: Session,
  targetMessageId: string,
  updater: (existing: Message) => Message
): Session {
  const idx = getMessageIndexByIdFast(session.messages, targetMessageId);
  if (idx === -1) return session;
  const currentMsg = session.messages[idx];
  const updatedMsg = updater(currentMsg);
  if (updatedMsg === currentMsg) return session;
  const nextMessages = session.messages.slice();
  nextMessages[idx] = updatedMsg;
  return {
    ...session,
    messages: nextMessages,
    lastActiveAt: Date.now()
  };
}

function mergeAxiomsFastWithMap(existingAxioms: any[], candidateAxioms: any[]): { merged: any[]; addedCount: number } {
  if (!Array.isArray(candidateAxioms) || candidateAxioms.length === 0) {
    return { merged: existingAxioms, addedCount: 0 };
  }
  const axiomMap = new Map<string, any>();
  for (const ax of existingAxioms) {
    if (ax && ax.content) {
      axiomMap.set(ax.content.trim(), ax);
    }
  }
  let addedCount = 0;
  for (const cand of candidateAxioms) {
    const key = cand?.content?.trim();
    if (key && !axiomMap.has(key)) {
      axiomMap.set(key, cand);
      addedCount++;
    }
  }
  if (addedCount === 0) {
    return { merged: existingAxioms, addedCount: 0 };
  }
  return { merged: Array.from(axiomMap.values()), addedCount };
}

export const SOVEREIGN_MODELS = [
  {
    id: 'auto-selection',
    labelAr: 'تلقائي ذكي',
    fullTitleAr: 'التوجيه التلقائي الذكي',
    badge: 'Auto',
    descAr: 'يوجّه المهام العميقة إلى نيكسوس نيون 4 (gemini-4-neon)، التدقيق الجذري إلى كاربون 4، والمحادثات السريعة إلى هيدروجين 4'
  },
  {
    id: 'nexus-4-neon',
    labelAr: 'نيكسوس نيون 4',
    fullTitleAr: 'نيكسوس نيون 4 — النواة الرائدة (gemini-4-neon)',
    badge: '4 Neon · XHIGH',
    descAr: 'نموذج الجيل الرابع الرائد (gemini-4-neon) للتفكير العميق الممتد XHIGH، الهندسة، البرمجة، والفلسفة المعقدة'
  },
  {
    id: 'nexus-4-carbon',
    labelAr: 'نيكسوس كاربون 4',
    fullTitleAr: 'نيكسوس كاربون 4 — الاستدلال الجذري (gemini-4-carbon)',
    badge: '4 Carbon · Deep',
    descAr: 'نموذج الاستدلال العميق (gemini-4-carbon) لتحليل الأسباب الجذرية، البراهين العلمية، والتدقيق المعماري والأمني'
  },
  {
    id: 'nexus-4-argon',
    labelAr: 'نيكسوس أرغون 4',
    fullTitleAr: 'نيكسوس أرغون 4 — برو المتوازن (gemini-4-argon)',
    badge: '4 Argon · Pro',
    descAr: 'نموذج أرغون 4 من الجيل الرابع (gemini-4-argon) بتوازن عالٍ للمهام الإنتاجية والفكرية المتعددة'
  },
  {
    id: 'nexus-3.1-pro',
    labelAr: 'نيكسوس 3.1 برو',
    fullTitleAr: 'نيكسوس 3.1 برو — الاستدلال العميق (gemini-3.1-pro-preview)',
    badge: '3.1 Pro · Deep',
    descAr: 'نموذج نيكسوس المبني على Gemini 3.1 Pro (gemini-3.1-pro-preview) للتفكير التحليلي المتعمق والهندسة والكتابة عالية الكثافة'
  },
  {
    id: 'nexus-4-hydrogen',
    labelAr: 'نيكسوس هيدروجين 4',
    fullTitleAr: 'نيكسوس هيدروجين 4 — فلاش الجيل الرابع (gemini-4-hydrogen)',
    badge: '4 Hydro · Fast',
    descAr: 'نموذج هيدروجين 4 فائق السرعة (gemini-4-hydrogen) مع دعم التفكير المتدرج حتى XHIGH والاستجابة الرشيقة'
  },
  {
    id: 'nexus-3-flash',
    labelAr: 'نيكسوس 3 فلاش',
    fullTitleAr: 'نيكسوس 3 فلاش — تفكير عالي الكثافة (gemini-3-flash-preview)',
    badge: '3 Flash · HIGH',
    descAr: 'نموذج الجيل الثالث المتكامل (gemini-3-flash-preview) مع التفكير العميق HIGH واستجابة عالية التماسك متاحة مباشرة'
  },
  {
    id: 'nexus-2.5-flash',
    labelAr: 'نيكسوس 2.5 فلاش',
    fullTitleAr: 'نيكسوس 2.5 فلاش (gemini-2.5-flash)',
    badge: '2.5 Flash',
    descAr: 'نموذج فلاش المستقر (gemini-2.5-flash) بميزانية تفكير متكاملة وموثوقية عالية في المهام اليومية'
  },
  {
    id: 'nexus-3.1-flash-lite',
    labelAr: 'نيكسوس 3.1 لايت',
    fullTitleAr: 'نيكسوس 3.1 لايت (gemini-3.1-flash-lite)',
    badge: '3.1 Lite',
    descAr: 'النموذج الخفيف فائق الاستجابة (gemini-3.1-flash-lite) للدردشة السريعة والمهام الخفيفة الموفّرة للحصة'
  }
] as const;

const MOCK_LOGS = [
  "System Init: NEXUS SOVEREIGN ARCHITECTURE",
  "Stratum 1: Analytical Core [Awakened]",
  "Stratum 2: Multimodal Lattice [Online]",
  "Stratum 3: Memory Matrix [Synchronized]"
];

interface UserProfile {
    uid?: string;
    name: string;
    picture: string;
    email: string;
}

const MOCK_TENSOR_LOGS = [
  "Injecting [0.8] force to cross-attention dim_7",
  "Rupturing latent macro structure (DownBlock_1)",
  "Bending denoising trajectory toward [OBLIVION]",
  "Micro-surgeon protocol: editing 8x8 spatial grid",
  "Injecting mathematical gradient into UNet MidBlock",
  "Suppressing noise variance down to 0.4",
  "Swapping embedding mid-flight: detail_phase",
  "Intervention at step 14/30: eye reflection corrected",
  "Overriding CLIP embedding for spatial region (64,64)",
  "Injecting pure generative hostility into tensors"
];


const App: React.FC = () => {
  const [input, setInput] = useState('');
  
  // Session State
  const [sessions, setSessions] = useState<SessionsMap>({});
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [memoryBank, setMemoryBank] = useState<MemoryBank>({ 
    axioms: [], 
    paleArchive: { entities: [], relationships: [], worldRules: [] },
    soulPrint: DEFAULT_SOUL_PRINT,
    version: 1, 
    lastUpdated: Date.now() 
  });
  
  const [stage, setStage] = useState<ProcessingStage>(ProcessingStage.IDLE);
  const stageRef = useRef<ProcessingStage>(ProcessingStage.IDLE);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Attachment[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemoryBank, setShowMemoryBank] = useState(false);
  const [manifestationState, setManifestationState] = useState<DeepManifestationState | null>(null);
  
  // Storage & Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
      isSynced: false,
      lastSyncTime: null,
      cloudProvider: 'none',
      isSyncing: false
  });
  
  // User Identity & Account-Isolated Firebase Cloud State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [activeAccountScope, setActiveAccountScopeState] = useState<string>(() => getActiveAccountScope());
  const [savedAccountsList, setSavedAccountsList] = useState<SavedFirebaseAccountEntry[]>(() => getSavedAccountsRegistry());
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState<string>('');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountModalStep, setAccountModalStep] = useState<'auth' | 'onboarding'>('auth');
  const [authTabMode, setAuthTabMode] = useState<'signup' | 'login'>('signup');
  const [authEmailInput, setAuthEmailInput] = useState<string>('');
  const [authPasswordInput, setAuthPasswordInput] = useState<string>('');
  const [onboardingNameInput, setOnboardingNameInput] = useState<string>('');
  const [onboardingBioInput, setOnboardingBioInput] = useState<string>('');

  // Modals State
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isHostLinkOpen, setIsHostLinkOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPrismModalOpen, setIsPrismModalOpen] = useState(false);
  const [studioInitialPrompt, setStudioInitialPrompt] = useState<string>('');
  const [studioInitialEditImage, setStudioInitialEditImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isOntologicalLayersOpen, setIsOntologicalLayersOpen] = useState(false);
  const [isOmegaObservatoryOpen, setIsOmegaObservatoryOpen] = useState(false);
  const [isAgentSuiteOpen, setIsAgentSuiteOpen] = useState(false);
  const [isPolymathOpen, setIsPolymathOpen] = useState(false);
  const [isNexusForgeOpen, setIsNexusForgeOpen] = useState(false);
  const [isScientificLabOpen, setIsScientificLabOpen] = useState(false);
  const [isRecursiveLabOpen, setIsRecursiveLabOpen] = useState(false);
  const [isMaxEffortEnabled, setIsMaxEffortEnabled] = useState(false);
  const [isAgentModeEnabled, setIsAgentModeEnabled] = useState(false);
  const [customSuccessCriteria, setCustomSuccessCriteria] = useState<string[]>(DEFAULT_SUCCESS_CRITERIA);
  const [activeEffortB, setActiveEffortB] = useState<number>(85);
  const [activeStrategicVariance, setActiveStrategicVariance] = useState<'Focus' | 'Expansion' | 'Disruption' | 'Essence'>('Essence');
  const [mindMapContent, setMindMapContent] = useState('');
  
  // Feature Toggles
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isDeepManifestation, setIsDeepManifestation] = useState(true);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [isInlineImageMode, setIsInlineImageMode] = useState(false);
  const [inlineAspectRatio, setInlineAspectRatio] = useState<'16:9' | '1:1' | '9:16' | '4:3' | '3:4'>('16:9');
  const [isPaleArchiveOpen, setIsPaleArchiveOpen] = useState(false);
  const [isCanvasStudioOpen, setIsCanvasStudioOpen] = useState(false);
  const [canvasStudioInitialContent, setCanvasStudioInitialContent] = useState<string>('');
  const [canvasStudioInitialTab, setCanvasStudioInitialTab] = useState<CanvasStudioTab>('notebook_guide');
  const [canvasStudioInitialImage, setCanvasStudioInitialImage] = useState<string | undefined>(undefined);
  const [sessionMenuOpenId, setSessionMenuOpenId] = useState<string | null>(null);
  const [sessionExportSubmenuId, setSessionExportSubmenuId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState<string>('');
  const [sidebarToast, setSidebarToast] = useState<{ text: string; url?: string; type: 'info' | 'warn' | 'success' } | null>(null);
  const [isNotebookHubOpen, setIsNotebookHubOpen] = useState(false);
  const [notebookHubMode, setNotebookHubMode] = useState<'notebooks' | 'drive_picker'>('notebooks');
  const [isGoogleServicesModalOpen, setIsGoogleServicesModalOpen] = useState(false);
  const [isImportBoxOpen, setIsImportBoxOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalTrigger, setTerminalTrigger] = useState<{ code: string; lang: string; timestamp: number } | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ bottom: number; left: number } | null>(null);
  const optionsButtonRef = useRef<HTMLButtonElement | null>(null);

  // Automatically collapse the sidebar when Canvas split-screen opens so Chat + Canvas fit 100% on screen
  useEffect(() => {
    if (isCanvasStudioOpen) {
      setIsSidebarOpen(false);
    }
  }, [isCanvasStudioOpen]);

  const isSiteOwnerOrAdmin = isAuthorizedSiteOwnerOrAdmin(
    userProfile?.email || firebaseUser?.email,
    memoryBank
  );

  useEffect(() => {
    if (!isSiteOwnerOrAdmin && isRecursiveLabOpen) {
      setIsRecursiveLabOpen(false);
    }
  }, [isSiteOwnerOrAdmin, isRecursiveLabOpen]);

  useEffect(() => {
    if (memoryBank.defaultSuccessCriteria && memoryBank.defaultSuccessCriteria.length > 0) {
      setCustomSuccessCriteria(memoryBank.defaultSuccessCriteria);
    }
  }, [memoryBank.defaultSuccessCriteria]);

  const handleCorrectModelMessage = (messageId: string, originalExcerpt: string, correctionRule: string) => {
    setMemoryBank(prev => {
      const { updatedMemoryBank } = applyExplicitUserCorrectionToMemory(prev, {
        messageId,
        sessionId: activeSessionId,
        originalIssueSummary: originalExcerpt,
        userCorrectionRule: correctionRule,
        category: 'factual_fix'
      });
      saveMemoryBank(updatedMemoryBank);
      if (firebaseUser) {
        syncAxiomsToFirestore(firebaseUser, updatedMemoryBank.axioms, updatedMemoryBank, activeSessionId).catch(() => {});
      }
      return updatedMemoryBank;
    });
    addLog(`RECURSIVE LAB: Recorded user correction rule into core MemoryBank.`, 'success');
  };

  useEffect(() => {
    if (isMoreOptionsOpen && optionsButtonRef.current) {
      const updateCoords = () => {
        const rect = optionsButtonRef.current?.getBoundingClientRect();
        if (rect) {
          const leftPos = Math.max(16, Math.min(rect.left, window.innerWidth - 320 - 16));
          setMenuCoords({
            bottom: window.innerHeight - rect.top + 8,
            left: leftPos,
          });
        }
      };
      
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isMoreOptionsOpen]);

  const [isAutonomousMode, setIsAutonomousMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto-selection');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const [liveToolTelemetry, setLiveToolTelemetry] = useState<{
    modelLabel: string;
    activeTools: string[];
    activeSkills: string[];
    status: 'running' | 'completed';
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isModelMenuOpen || isAttachMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModelMenuOpen, isAttachMenuOpen]);
  const [enableProFallback, setEnableProFallback] = useState<boolean>(() => {
    const saved = localStorage.getItem('enableProFallback');
    return saved === null ? true : saved === 'true';
  });
  const [proTimeoutSec, setProTimeoutSec] = useState<number>(() => {
    const saved = localStorage.getItem('proTimeoutSec');
    return saved === null ? 12 : parseInt(saved, 10);
  });

  useEffect(() => {
    localStorage.setItem('enableProFallback', String(enableProFallback));
  }, [enableProFallback]);

  useEffect(() => {
    localStorage.setItem('proTimeoutSec', String(proTimeoutSec));
  }, [proTimeoutSec]);

  // Keyboard shortcut Ctrl+Shift+N to access Ontological Layers of Nexus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'N') {
        e.preventDefault();
        setIsOntologicalLayersOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Auditor States
  const [isAuditing, setIsAuditing] = useState(false);
  const [showAuditorModal, setShowAuditorModal] = useState(false);
  const [auditResult, setAuditResult] = useState<{ contradictions: string[], forgottenThreads: string[], suggestedRefinements: string[] } | null>(null);

  // Audio State (Input/Output)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('isAutoSpeakEnabled', 'false');
  }, [isAutoSpeakEnabled]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const isHydratedRef = useRef<boolean>(false);
  const activeSessionIdRef = useRef<string>("");
  const userSelectedSessionRef = useRef<string | null>(null);
  const hydratedAccountScopeRef = useRef<string | null>(null);
  const attachedBackgroundJobsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const attachToRunningServerJob = React.useCallback(
    async (jobId: string, targetSessionId: string, jobType: 'omni_stream' | 'visual_artifact', usedTools?: string[]) => {
      if (attachedBackgroundJobsRef.current.has(jobId)) return;
      attachedBackgroundJobsRef.current.add(jobId);

      setStage(jobType === 'visual_artifact' ? ProcessingStage.PRISM_REFRACTION : ProcessingStage.REALITY_PROJECTION);
      setLiveToolTelemetry({
        modelLabel: 'المعالجة السحابية المستمرة',
        activeTools: usedTools && usedTools.length > 0 ? usedTools : ['استكمال المعالجة بالخلفية'],
        activeSkills: [],
        status: 'running'
      });

      try {
        const completed = await pollServerJobUntilComplete(jobId, chunk => {
          if (chunk.manifestationState) {
            setManifestationState(chunk.manifestationState);
          }
          setSessions(prev => {
            const sess = prev[targetSessionId];
            if (!sess) return prev;
            const exists = sess.messages.some(m => m.id === jobId);
            const nextMessages = exists
              ? sess.messages.map(m =>
                  m.id === jobId
                    ? {
                        ...m,
                        thoughtProcess: chunk.thoughtProcess || m.thoughtProcess,
                        content: chunk.finalResponse || m.content,
                        isThinkingStreaming: chunk.isThinkingPhase,
                        isStreaming: chunk.type !== 'done',
                        thinkingDuration: chunk.thinkingDuration ?? m.thinkingDuration,
                        kernelState: chunk.kernelState ?? m.kernelState,
                        groundingMetadata: chunk.groundingMetadata ?? m.groundingMetadata,
                        generatedImage: chunk.generatedImage || m.generatedImage,
                        imagePrompt: chunk.imagePrompt || m.imagePrompt,
                        nanoVisualTelemetry: chunk.nanoVisualTelemetry || m.nanoVisualTelemetry,
                        usedTools: chunk.usedTools && chunk.usedTools.length > 0 ? chunk.usedTools : m.usedTools
                      }
                    : m
                )
              : [
                  ...sess.messages,
                  {
                    id: jobId,
                    role: 'model' as const,
                    content: chunk.finalResponse || '',
                    thoughtProcess: chunk.thoughtProcess || '',
                    isThinkingStreaming: chunk.isThinkingPhase,
                    isStreaming: chunk.type !== 'done',
                    timestamp: Date.now(),
                    thinkingDuration: chunk.thinkingDuration,
                    generatedImage: chunk.generatedImage,
                    imagePrompt: chunk.imagePrompt,
                    nanoVisualTelemetry: chunk.nanoVisualTelemetry,
                    usedTools: chunk.usedTools || usedTools || []
                  }
                ];
            return {
              ...prev,
              [targetSessionId]: {
                ...sess,
                messages: nextMessages,
                lastActiveAt: Date.now()
              }
            };
          });
        });

        setSessions(prev => {
          const sess = prev[targetSessionId];
          if (!sess) return prev;
          const updated: SessionsMap = {
            ...prev,
            [targetSessionId]: {
              ...sess,
              messages: sess.messages.map(m =>
                m.id === jobId
                  ? {
                      ...m,
                      content: completed.finalResponse || m.content,
                      thoughtProcess: completed.thoughtProcess || m.thoughtProcess,
                      thinkingDuration: completed.thinkingDuration ?? m.thinkingDuration,
                      generatedImage: completed.generatedImage || m.generatedImage,
                      imagePrompt: completed.imagePrompt || m.imagePrompt,
                      nanoVisualTelemetry: completed.nanoVisualTelemetry || m.nanoVisualTelemetry,
                      usedTools: completed.usedTools && completed.usedTools.length > 0 ? completed.usedTools : m.usedTools,
                      isStreaming: false,
                      isThinkingStreaming: false
                    }
                  : m
              ),
              lastActiveAt: Date.now()
            }
          };
          saveLocalSessions(updated);
          return updated;
        });
      } catch (e) {
        console.warn('Background job re-attachment notice:', e);
      } finally {
        attachedBackgroundJobsRef.current.delete(jobId);
        setManifestationState(null);
        setStage(ProcessingStage.IDLE);
        setLiveToolTelemetry(prev => (prev ? { ...prev, status: 'completed' } : null));
        setTimeout(() => {
          setLiveToolTelemetry(prev => (prev?.status === 'completed' ? null : prev));
        }, 3000);
      }
    },
    []
  );

  const syncWithServerAndResumeJobs = React.useCallback(
    async (baseSessions?: SessionsMap, explicitScope?: string) => {
      const targetScope = explicitScope || getActiveAccountScope();
      try {
        const [serverSessions, activeJobs] = await Promise.all([
          loadSessionsFromServer(targetScope),
          fetchActiveServerJobs()
        ]);

        const runningJobs = activeJobs.filter(j => j.status === 'running');
        const runningJobIds = new Set(runningJobs.map(j => j.jobId));

        if (serverSessions && Object.keys(serverSessions).length > 0 && targetScope === getActiveAccountScope()) {
          setSessions(prev => {
            const source = baseSessions && Object.keys(prev).length === 0 ? baseSessions : prev;
            const merged = mergeSessionsAuthoritative(source, serverSessions);
            for (const sess of Object.values(merged)) {
              if (!sess || !Array.isArray(sess.messages)) continue;
              sess.messages = sess.messages.map(m => {
                if (
                  (m.isStreaming || m.isThinkingStreaming) &&
                  !runningJobIds.has(m.id) &&
                  !attachedBackgroundJobsRef.current.has(m.id)
                ) {
                  return {
                    ...m,
                    isStreaming: false,
                    isThinkingStreaming: false
                  };
                }
                return m;
              });
            }
            return merged;
          });
        }

        for (const job of runningJobs) {
          attachToRunningServerJob(job.jobId, job.sessionId, job.jobType, job.usedTools);
        }
      } catch (e) {
        console.warn('Firebase background sync check notice:', e);
      }
    },
    [attachToRunningServerJob]
  );

  const extractBestCanvasPayloadFromSession = React.useCallback(
    (sess: Session | undefined): {
      canvasBody: string;
      tabType: 'code_project' | 'notebook_guide';
      generatedImage?: string;
    } | null => {
      if (!sess || !Array.isArray(sess.messages)) return null;
      for (let i = sess.messages.length - 1; i >= 0; i--) {
        const msg = sess.messages[i];
        if (!msg || msg.role !== 'model' || !msg.content) continue;
        const raw = msg.content;
        const openMatch = raw.match(/<nexus_canvas\b([^>]*)>/i);
        if (openMatch && openMatch.index !== undefined) {
          const attrs = openMatch[1] || '';
          const typeAttr = attrs.match(/type="([^"]*)"/i)?.[1]?.toLowerCase();
          const afterOpen = raw.slice(openMatch.index + openMatch[0].length);
          const closeIdx = afterOpen.search(/<\/nexus_canvas>/i);
          const body = (closeIdx !== -1 ? afterOpen.slice(0, closeIdx) : afterOpen).trim();
          if (body.length > 40) {
            return {
              canvasBody: body,
              tabType: typeAttr === 'code' ? 'code_project' : 'notebook_guide',
              generatedImage: msg.generatedImage
            };
          }
        }
        const fileMatches = Array.from(raw.matchAll(/<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi));
        if (fileMatches.length > 0) {
          return {
            canvasBody: fileMatches.map(m => m[0]).join('\n\n'),
            tabType: 'notebook_guide',
            generatedImage: msg.generatedImage
          };
        }
      }
      return null;
    },
    []
  );

  // --- ACCOUNT-ISOLATED STORAGE HYDRATION & SWITCHING ENGINE ---
  const activateAndHydrateAccountScope = React.useCallback(
    async (
      targetScope: string,
      profile: UserProfile | null,
      fbUser?: FirebaseUser | null
    ) => {
      const isScopeChange =
        hydratedAccountScopeRef.current !== null &&
        hydratedAccountScopeRef.current !== targetScope;
      if (isScopeChange) {
        userSelectedSessionRef.current = null;
        activeSessionIdRef.current = "";
      }
      hydratedAccountScopeRef.current = targetScope;
      isHydratedRef.current = false;
      setActiveAccountScope(targetScope);
      setActiveAccountScopeState(targetScope);

      const initialScopedSessions = loadLocalSessions(targetScope);
      const initialScopedMemory = loadMemoryBank(targetScope);

      setSessions(prev =>
        isScopeChange ? initialScopedSessions : { ...initialScopedSessions, ...prev }
      );
      setMemoryBank(initialScopedMemory);
      const initialIds = Object.keys(initialScopedSessions);
      if (
        initialIds.length > 0 &&
        (isScopeChange || (!activeSessionIdRef.current && !userSelectedSessionRef.current))
      ) {
        const recentInitialId = initialIds.sort(
          (a, b) => (initialScopedSessions[b].lastActiveAt || 0) - (initialScopedSessions[a].lastActiveAt || 0)
        )[0];
        activeSessionIdRef.current = recentInitialId;
        setActiveSessionId(recentInitialId);
      }

      try {
        const [
          serverSessions,
          serverMemory,
          deepSessions,
          deepMemory,
          browserRecoveredSessions,
          vaultMirror,
          firestoreState,
          activeJobs
        ] = await Promise.all([
          loadSessionsFromServer(targetScope),
          loadMemoryBankFromServer(targetScope),
          loadFromTitanium<SessionsMap>('nexus_omni_memory_v2', undefined, targetScope),
          loadFromTitanium<MemoryBank>('nexus_omni_memory_bank', undefined, targetScope),
          scanAndRecoverAllBrowserSessions(),
          loadAccountStateFromFirebaseVaultMirror(targetScope),
          loadUserCloudStateFromFirestore(fbUser, targetScope),
          fetchActiveServerJobs()
        ]);

        const localBase =
          deepSessions && Object.keys(deepSessions).length > 0 ? deepSessions : initialScopedSessions;
        let mergedSessions = mergeSessionsAuthoritative(localBase, browserRecoveredSessions);
        mergedSessions = mergeSessionsAuthoritative(mergedSessions, serverSessions);
        if (vaultMirror?.sessions && Object.keys(vaultMirror.sessions).length > 0) {
          mergedSessions = mergeSessionsAuthoritative(mergedSessions, vaultMirror.sessions);
        }
        if (firestoreState?.sessions && Object.keys(firestoreState.sessions).length > 0) {
          mergedSessions = mergeSessionsAuthoritative(mergedSessions, firestoreState.sessions);
        }

        // Normalize legacy "محادثة جديدة #N" titles and prune empty non-active sessions
        const lockedActiveId = userSelectedSessionRef.current || activeSessionIdRef.current;
        for (const [id, sess] of Object.entries(mergedSessions)) {
          if (!sess) continue;
          if (/^محادثة جديدة\s*#\d+$/i.test((sess.title || '').trim())) {
            const firstUserMsg = (sess.messages || []).find(m => m.role === 'user' && m.content?.trim());
            if (firstUserMsg) {
              const cleanFirst = firstUserMsg.content
                .replace(/^[#*\->\s]+/, '')
                .replace(/\s+/g, ' ')
                .trim();
              sess.title = cleanFirst.slice(0, 42) + (cleanFirst.length > 42 ? '...' : '');
            } else {
              sess.title = 'محادثة جديدة';
            }
          }
        }

        const allMergedIds = Object.keys(mergedSessions);
        if (allMergedIds.length > 1) {
          const nonDefaultIds = allMergedIds.filter(id => {
            if (id === lockedActiveId) return true;
            const s = mergedSessions[id];
            return (
              s &&
              Array.isArray(s.messages) &&
              s.messages.length > 0 &&
              (s.messages.length > 1 || !s.messages[0]?.id?.startsWith('init-'))
            );
          });
          if (nonDefaultIds.length > 0) {
            const cleaned: SessionsMap = {};
            for (const id of nonDefaultIds) {
              cleaned[id] = mergedSessions[id];
            }
            mergedSessions = cleaned;
          }
        }

        const runningJobIds = new Set(activeJobs.filter(j => j.status === 'running').map(j => j.jobId));
        for (const sess of Object.values(mergedSessions)) {
          if (!sess || !Array.isArray(sess.messages)) continue;
          sess.messages = sess.messages.map(m => {
            if ((m.isStreaming || m.isThinkingStreaming) && !runningJobIds.has(m.id)) {
              return {
                ...m,
                isStreaming: false,
                isThinkingStreaming: false,
                thinkingDuration:
                  typeof m.thinkingDuration === 'number' && m.thinkingDuration > 120
                    ? 24.8
                    : m.thinkingDuration
              };
            }
            return m;
          });
        }

        let resolvedMemory: MemoryBank =
          vaultMirror?.memoryBank || serverMemory || deepMemory || initialScopedMemory || createInitialMemoryBank();

        if (
          firestoreState &&
          (firestoreState.axioms.length > 0 ||
            firestoreState.learnedInsights.length > 0 ||
            firestoreState.encryptedVault.length > 0)
        ) {
          const existingIds = new Set((resolvedMemory.axioms || []).map(a => a.id));
          const mergedAxioms = [
            ...(resolvedMemory.axioms || []),
            ...firestoreState.axioms.filter(a => !existingIds.has(a.id))
          ];
          const existingInsIds = new Set((resolvedMemory.learnedInsights || []).map(i => i.id));
          const mergedInsights = [
            ...(resolvedMemory.learnedInsights || []),
            ...firestoreState.learnedInsights.filter(i => !existingInsIds.has(i.id))
          ];
          const existingSecIds = new Set((resolvedMemory.encryptedVault || []).map(s => s.id));
          const mergedVault = [
            ...(resolvedMemory.encryptedVault || []),
            ...firestoreState.encryptedVault.filter(s => !existingSecIds.has(s.id))
          ];
          resolvedMemory = {
            ...resolvedMemory,
            axioms: mergedAxioms,
            learnedInsights: mergedInsights,
            encryptedVault: mergedVault,
            cognitiveOrbits:
              firestoreState.cognitiveOrbits.length > 0
                ? firestoreState.cognitiveOrbits
                : resolvedMemory.cognitiveOrbits || DEFAULT_COGNITIVE_ORBITS,
            skillEvolutions: {
              ...initializeSkillEvolutions(resolvedMemory.skillEvolutions),
              ...firestoreState.skillEvolutions
            },
            lastUpdated: Date.now()
          };
        }

        setSessions(prev => {
          const next = { ...mergedSessions };
          const currentLocked = userSelectedSessionRef.current || activeSessionIdRef.current;
          if (!isScopeChange && currentLocked && prev[currentLocked] && !next[currentLocked]) {
            next[currentLocked] = prev[currentLocked];
          }
          return next;
        });

        const persistedOnly: SessionsMap = {};
        for (const [k, v] of Object.entries(mergedSessions)) {
          if ((v.messages && v.messages.length > 0) || v.isPinned) {
            persistedOnly[k] = v;
          }
        }
        if (Object.keys(persistedOnly).length > 0) {
          saveLocalSessions(persistedOnly, targetScope);
        }

        const finalIds = Object.keys(mergedSessions);
        const currentLockedNow = userSelectedSessionRef.current || activeSessionIdRef.current;
        if (finalIds.length > 0 && (isScopeChange || !currentLockedNow)) {
          const preferredActive =
            (vaultMirror?.activeSessionId && mergedSessions[vaultMirror.activeSessionId]
              ? vaultMirror.activeSessionId
              : null) ||
            (firestoreState?.activeSessionId && mergedSessions[firestoreState.activeSessionId]
              ? firestoreState.activeSessionId
              : null) ||
            finalIds.sort(
              (a, b) => (mergedSessions[b].lastActiveAt || 0) - (mergedSessions[a].lastActiveAt || 0)
            )[0];
          activeSessionIdRef.current = preferredActive;
          setActiveSessionId(preferredActive);
          const initialCanvasPayload = extractBestCanvasPayloadFromSession(mergedSessions[preferredActive]);
          if (initialCanvasPayload) {
            setCanvasStudioInitialContent(initialCanvasPayload.canvasBody);
            setCanvasStudioInitialTab(initialCanvasPayload.tabType);
            if (initialCanvasPayload.generatedImage) {
              setCanvasStudioInitialImage(initialCanvasPayload.generatedImage);
            }
          }
        }

        setMemoryBank(resolvedMemory);
        saveMemoryBank(resolvedMemory, targetScope);

        isHydratedRef.current = true;

        for (const job of activeJobs) {
          if (job.status === 'running' && mergedSessions[job.sessionId]) {
            attachToRunningServerJob(job.jobId, job.sessionId, job.jobType, job.usedTools);
          }
        }
      } catch (err) {
        isHydratedRef.current = true;
        console.warn('Account-isolated hydration fallback:', err);
      }
    },
    [attachToRunningServerJob, extractBestCanvasPayloadFromSession]
  );

  // Automatically sync Canvas Studio content when activeSessionId or sessions update (e.g. replacing stale 85-word cache with the full 7-file <nexus_canvas>)
  useEffect(() => {
    const activeSess = sessions[activeSessionId];
    if (!activeSess) return;
    const bestCanvas = extractBestCanvasPayloadFromSession(activeSess);
    if (bestCanvas) {
      setCanvasStudioInitialContent(prev => {
        if (!prev || prev.trim().length < 1200 || prev.includes('سأقوم الآن بالآتي')) {
          return bestCanvas.canvasBody;
        }
        return prev;
      });
      if (bestCanvas.generatedImage) {
        setCanvasStudioInitialImage(prev => prev || bestCanvas.generatedImage);
      }
    }
  }, [activeSessionId, sessions, extractBestCanvasPayloadFromSession]);

  // --- INITIALIZATION & ACCOUNT-SCOPED MEMORY LOADING ---
  useEffect(() => {
    let initialScope = getActiveAccountScope();
    let initialProfile: UserProfile | null = null;

    try {
      const explicitSignOut = localStorage.getItem('nexus_explicit_signout') === 'true';
      const savedProfileRaw =
        localStorage.getItem('nexus_firebase_account_profile') ||
        localStorage.getItem('nexus_gcloud_direct_profile');
      if (savedProfileRaw) {
        const parsed = JSON.parse(savedProfileRaw);
        if (parsed && (parsed.email || parsed.uid)) {
          if (parsed.email === 'user@nexus.workspace') {
            parsed.email = PRIMARY_SECURITY_ADMIN_EMAIL;
            if (!parsed.name || parsed.name === 'user' || parsed.name === 'مستخدم نيكسوس') {
              parsed.name = 'مشرف نيكسوس';
            }
          }
          initialProfile = parsed;
          initialScope = deriveAccountScopeId(parsed.email, parsed.uid);
          setActiveAccountScope(initialScope);
          setActiveAccountScopeState(initialScope);
          setUserProfile(parsed);
          enableFirebaseUniversalVaultMode();
        }
      }
    } catch {
      // ignore
    }

    activateAndHydrateAccountScope(initialScope, initialProfile, auth.currentUser);

    const handleOnlineOrVisible = () => {
      if (document.visibilityState === 'visible' || navigator.onLine) {
        syncWithServerAndResumeJobs(undefined, getActiveAccountScope());
      }
    };
    window.addEventListener('online', handleOnlineOrVisible);
    document.addEventListener('visibilitychange', handleOnlineOrVisible);

    MOCK_LOGS.forEach((msg, i) => {
      setTimeout(() => addLog(msg, 'info'), i * 200);
    });

    return () => {
      window.removeEventListener('online', handleOnlineOrVisible);
      document.removeEventListener('visibilitychange', handleOnlineOrVisible);
    };
  }, [activateAndHydrateAccountScope, syncWithServerAndResumeJobs]);

  // --- FIREBASE AUTHENTICATION & UNIVERSAL ACCOUNT SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsAuthReady(true);

      let explicitSavedProfile: UserProfile | null = null;
      try {
        const savedRaw =
          localStorage.getItem('nexus_firebase_account_profile') ||
          localStorage.getItem('nexus_gcloud_direct_profile');
        if (savedRaw) {
          explicitSavedProfile = JSON.parse(savedRaw);
        }
      } catch {
        // ignore
      }

      if (fbUser) {
        setFirebaseUser(fbUser);
        const profileObj: UserProfile = explicitSavedProfile?.email
          ? {
              uid: explicitSavedProfile.uid || fbUser.uid,
              name:
                explicitSavedProfile.name ||
                fbUser.displayName ||
                explicitSavedProfile.email.split('@')[0] ||
                'مستخدم نيكسوس',
              email: explicitSavedProfile.email,
              picture:
                explicitSavedProfile.picture ||
                fbUser.photoURL ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(explicitSavedProfile.email)}`
            }
          : {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم نيكسوس',
              picture: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
              email: fbUser.email || ''
            };

        const resolvedScope = deriveAccountScopeId(profileObj.email, profileObj.uid);
        setUserProfile(profileObj);
        localStorage.setItem('nexus_firebase_account_profile', JSON.stringify(profileObj));
        if (profileObj.email) {
          const updatedList = registerSavedAccountOnDevice({
            scopeId: resolvedScope,
            uid: profileObj.uid,
            name: profileObj.name,
            email: profileObj.email,
            picture: profileObj.picture,
            lastActiveAt: Date.now()
          });
          setSavedAccountsList(updatedList);
        }

        setSyncStatus({
          isSynced: true,
          lastSyncTime: Date.now(),
          cloudProvider: 'firebase',
          isSyncing: true
        });
        addLog(`Firebase Cloud Connected: ${profileObj.name} (${profileObj.email || profileObj.uid})`, 'success');

        if (hydratedAccountScopeRef.current !== resolvedScope) {
          await activateAndHydrateAccountScope(resolvedScope, profileObj, fbUser);
        }
        setSyncStatus({
          isSynced: true,
          lastSyncTime: Date.now(),
          cloudProvider: 'firebase',
          isSyncing: false
        });
      } else if (explicitSavedProfile && explicitSavedProfile.email) {
        enableFirebaseUniversalVaultMode();
        const resolvedScope = deriveAccountScopeId(explicitSavedProfile.email, explicitSavedProfile.uid);
        setUserProfile(explicitSavedProfile);
        if (hydratedAccountScopeRef.current !== resolvedScope) {
          await activateAndHydrateAccountScope(resolvedScope, explicitSavedProfile, null);
        }
        setSyncStatus({
          isSynced: true,
          lastSyncTime: Date.now(),
          cloudProvider: 'firebase',
          isSyncing: false
        });
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
        setSyncStatus({
          isSynced: false,
          lastSyncTime: null,
          cloudProvider: 'none',
          isSyncing: false
        });
      }
    });
    return () => unsubscribe();
  }, [activateAndHydrateAccountScope]);

  const handleRecoverAllConversations = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      addLog('جاري استعادة ودمج جميع المحادثات من السحابة والقرص والذاكرة المحلية...', 'info');
      const targetScope = activeAccountScope || 'guest';
      const [res, browserRecovered, firestoreState] = await Promise.all([
        fetch('/api/storage/recover-all-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountScope: targetScope })
        }).then(r => (r.ok ? r.json() : null)).catch(() => null),
        scanAndRecoverAllBrowserSessions(),
        loadUserCloudStateFromFirestore(firebaseUser, targetScope)
      ]);

      let merged = mergeSessionsAuthoritative(sessions, browserRecovered);
      if (res?.sessions) {
        merged = mergeSessionsAuthoritative(merged, res.sessions);
      }
      if (firestoreState?.sessions) {
        merged = mergeSessionsAuthoritative(merged, firestoreState.sessions);
      }
      setSessions(merged);
      saveLocalSessions(merged, targetScope);
      if (res?.memoryBank) {
        setMemoryBank(res.memoryBank);
        saveMemoryBank(res.memoryBank, targetScope);
      }
      const totalSessions = Object.keys(merged).length;
      const totalMsgs = Object.values(merged).reduce((a, s) => a + (s.messages?.length || 0), 0);
      addLog(`تمت استعادة ${totalSessions} محادثات (${totalMsgs} رسالة) بنجاح.`, 'success');
      setSyncStatus({
        isSynced: true,
        lastSyncTime: Date.now(),
        cloudProvider: 'firebase',
        isSyncing: false
      });
    } catch (err) {
      console.error('Recover all conversations error:', err);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeMessagesLength = sessions[activeSessionId]?.messages.length || 0;
  useEffect(scrollToBottom, [activeMessagesLength, activeSessionId]);

  // --- PERSISTENCE LOGIC (ACCOUNT-ISOLATED LOCAL + AUTOMATIC FIREBASE CLOUD SYNC) ---
  useEffect(() => {
    if (!isHydratedRef.current) return;
    // Do not flood /api/storage/sessions on every 350ms streaming token delta; persist cleanly when IDLE
    if (stage !== ProcessingStage.IDLE) return;
    const currentScope = getActiveAccountScope();
    // Only persist non-empty or pinned sessions so an empty "محادثة جديدة" draft doesn't trigger cloud redirects or clutter storage
    const nonEmptySessions: SessionsMap = {};
    for (const [id, s] of Object.entries(sessions)) {
      if ((s.messages && s.messages.length > 0) || s.isPinned) {
        nonEmptySessions[id] = s;
      }
    }
    if (Object.keys(nonEmptySessions).length > 0) {
      saveLocalSessions(nonEmptySessions, currentScope);
      saveMemoryBank(memoryBank, currentScope);

      const activeSess = activeSessionId ? sessions[activeSessionId] : undefined;
      const isActiveNonEmpty = Boolean(
        activeSess && ((activeSess.messages && activeSess.messages.length > 0) || activeSess.isPinned)
      );

      if (isAuthReady && (firebaseUser || userProfile) && isActiveNonEmpty && activeSess) {
        const timeoutId = setTimeout(async () => {
          setSyncStatus(prev => ({ ...prev, isSyncing: true }));
          try {
            if (currentScope && currentScope !== 'guest') {
              await syncAccountStateToFirebaseVaultMirror(
                currentScope,
                userProfile,
                nonEmptySessions,
                memoryBank,
                activeSessionId
              );
            }
            if (firebaseUser) {
              await syncSessionToFirestore(firebaseUser, activeSess, memoryBank);
              if (memoryBank.axioms.length > 0) {
                await syncAxiomsToFirestore(firebaseUser, memoryBank.axioms, memoryBank, activeSessionId);
              }
            }
            setSyncStatus({
              isSynced: true,
              lastSyncTime: Date.now(),
              cloudProvider: 'firebase',
              isSyncing: false
            });
          } catch (err) {
            console.warn('Firebase Auto-Sync notice:', err);
            setSyncStatus(prev => ({ ...prev, isSynced: true, isSyncing: false }));
          }
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [sessions, memoryBank, activeSessionId, firebaseUser, userProfile, isAuthReady, activeAccountScope, stage]);

  // Auto-crystallize before closing
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!activeSessionId) return;
      const activeMsgs = sessions[activeSessionId]?.messages || [];
      if (activeMsgs.length > 3) {
        crystallizeSession(activeMsgs, activeSessionId).catch(console.error);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessions, activeSessionId]);

  useEffect(() => {
      if (logsEndRef.current) {
          logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
      }
  }, [logs]);

  const addLog = React.useCallback((msg: string, level: LogEntry['level'] = 'info') => {
      const nodes = ['Apex Eye', 'Bedrock Layer', 'Quantum Lattice', 'Prism Cortex', 'Network'];
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      setLogs(prev => [...prev.slice(-30), {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' }),
          nodeId: randomNode,
          message: msg,
          level
      }]);
  }, []);

  const simulateProcessingLogs = () => {
      const tasks: { msg: string, lvl: LogEntry['level'] }[] = [
          { msg: "Input Received. Initiating Synthesis...", lvl: 'core' },
          { msg: "Stratum 1: Retrieving Context & Memory...", lvl: 'abyss' },
          { msg: "Stratum 2: Aligning Sovereign Lattice...", lvl: 'core' },
          { msg: "Stratum 3: Projecting Final Response...", lvl: 'surface' }
      ];
      
      let i = 0;
      const interval = setInterval(() => {
          if (i >= tasks.length || stage === ProcessingStage.IDLE) {
              clearInterval(interval);
              return;
          }
          addLog(tasks[i].msg, tasks[i].lvl);
          i++;
      }, 700);
  };

  // --- SESSION MANAGEMENT (CREATE, PIN MAX 8, RENAME, 7-FORMAT EXPORT + DRIVE, DELETE) ---
  const MAX_PINNED_SESSIONS = 8;

  const showSidebarNotification = (text: string, type: 'info' | 'warn' | 'success' = 'info', url?: string) => {
    setSidebarToast({ text, type, url });
    setTimeout(() => {
      setSidebarToast(prev => (prev?.text === text ? null : prev));
    }, 5500);
  };

  const handleCreateSession = () => {
      if (activeSessionId && sessions[activeSessionId] && sessions[activeSessionId].messages.length === 0) {
          userSelectedSessionRef.current = activeSessionId;
          activeSessionIdRef.current = activeSessionId;
          if (window.innerWidth < 768) setIsSidebarOpen(false);
          return;
      }
      const newSession = createNewSession('محادثة جديدة');
      userSelectedSessionRef.current = newSession.id;
      activeSessionIdRef.current = newSession.id;
      setSessions(prev => {
          const cleaned: SessionsMap = {};
          for (const [k, v] of Object.entries(prev)) {
              if ((v.messages && v.messages.length > 0) || v.isPinned) {
                  cleaned[k] = v;
              }
          }
          cleaned[newSession.id] = newSession;
          return cleaned;
      });
      setActiveSessionId(newSession.id);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      addLog(`Started new thread [${newSession.id}].`, 'core');
  };

  const handleTogglePinSession = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const target = sessions[id];
      if (!target) return;

      const currentlyPinnedCount = (Object.values(sessions) as Session[]).filter(s => Boolean(s.isPinned)).length;
      if (!target.isPinned && currentlyPinnedCount >= MAX_PINNED_SESSIONS) {
          showSidebarNotification(`الحد الأقصى للتثبيت هو ${MAX_PINNED_SESSIONS} محادثات فقط. ألغِ تثبيت محادثة أولاً.`, 'warn');
          setSessionMenuOpenId(null);
          return;
      }

      const nextPinned = !target.isPinned;
      setSessions(prev => {
          const updated: SessionsMap = {
              ...prev,
              [id]: {
                  ...prev[id],
                  isPinned: nextPinned,
                  pinnedAt: nextPinned ? Date.now() : undefined
              }
          };
          saveLocalSessions(updated);
          return updated;
      });
      setSessionMenuOpenId(null);
      setSessionExportSubmenuId(null);
      showSidebarNotification(
          nextPinned
              ? `تم تثبيت المحادثة (${currentlyPinnedCount + 1}/${MAX_PINNED_SESSIONS})`
              : 'تم إلغاء تثبيت المحادثة',
          'success'
      );
  };

  const handleStartRenameSession = (session: Session, e: React.MouseEvent) => {
      e.stopPropagation();
      setRenamingSessionId(session.id);
      setRenameTitleInput(session.title);
      setSessionMenuOpenId(null);
      setSessionExportSubmenuId(null);
  };

  const handleSaveRenameSession = (id: string, e?: React.FormEvent | React.MouseEvent) => {
      if (e) e.stopPropagation();
      const cleanTitle = renameTitleInput.trim();
      if (cleanTitle && sessions[id]) {
          setSessions(prev => {
              const updated: SessionsMap = {
                  ...prev,
                  [id]: {
                      ...prev[id],
                      title: cleanTitle
                  }
              };
              saveLocalSessions(updated);
              return updated;
          });
          showSidebarNotification('تم تحديث اسم المحادثة بنجاح', 'success');
      }
      setRenamingSessionId(null);
      setRenameTitleInput('');
  };

  const handleExportSessionByFormat = async (
      session: Session,
      format: 'pdf' | 'txt' | 'md' | 'doc' | 'csv' | 'html' | 'json' | 'gdrive' | 'gdocs' | 'gsheets',
      e: React.MouseEvent
  ) => {
      e.stopPropagation();
      setSessionMenuOpenId(null);
      setSessionExportSubmenuId(null);

      const validMsgs = session.messages.filter(m => !m.isThinking);
      const safeFileName = (session.title || 'nexus_conversation')
          .replace(/[\\/:*?"<>|\s]+/g, '_')
          .slice(0, 45);

      const plainTranscript = [
          `عنوان المحادثة: ${session.title}`,
          `تاريخ التصدير: ${new Date().toLocaleString('ar-SA')}`,
          `عدد الرسائل: ${validMsgs.length}`,
          '========================================',
          ...validMsgs.map(m => {
              const speaker = m.role === 'user' ? 'أنت (المستخدم)' : 'نيكسوس';
              const cleanContent = (m.content || '')
                  .replace(/^#{1,6}\s+/gm, '')
                  .replace(/\*\*([^*]+)\*\*/g, '$1');
              return `\n[${speaker} — ${new Date(m.timestamp).toLocaleTimeString('ar-SA')}]:\n${cleanContent}`;
          })
      ].join('\n');

      const mdTranscript = [
          `# ${session.title}`,
          `> تاريخ التصدير: ${new Date().toLocaleString('ar-SA')} · عدد الرسائل: ${validMsgs.length}`,
          '',
          ...validMsgs.map(m => {
              const speaker = m.role === 'user' ? '### 👤 المستخدم' : '### 💠 نيكسوس';
              return `${speaker} (${new Date(m.timestamp).toLocaleTimeString('ar-SA')})\n\n${m.content}\n\n---`;
          })
      ].join('\n');

      // Direct Cloud Exports (Google Drive / Google Docs / Google Sheets)
      if (format === 'gdrive' || format === 'gdocs' || format === 'gsheets') {
          showSidebarNotification('جاري التصدير السحابي المباشر...', 'info');
          try {
              if (format === 'gdrive') {
                  const res = await uploadFileToGoogleDrive(`${session.title}.md`, mdTranscript, 'text/markdown');
                  showSidebarNotification('تم التصدير كملف إلى Google Drive بنجاح', 'success', res.webViewLink);
              } else if (format === 'gdocs') {
                  const res = await createGoogleDocInWorkspace(session.title, plainTranscript);
                  showSidebarNotification('تم تصدير النصوص والرسائل إلى Google Docs', 'success', res.documentUrl);
              } else {
                  const tableMessages = validMsgs.filter(m => hasMarkdownOrCsvTable(m.content || ''));
                  const extractedTableRows: string[][] = [];
                  tableMessages.forEach((m, idx) => {
                      const rows = extractRowsFromTextForSheets(m.content || '');
                      if (idx > 0 && extractedTableRows.length > 0) {
                          extractedTableRows.push(['---', '---', '---']);
                      }
                      extractedTableRows.push(...rows);
                  });
                  const finalRows =
                      extractedTableRows.length > 0
                          ? extractedTableRows
                          : [
                                ['الدور', 'التوقيت', 'محتوى الرسالة'],
                                ...validMsgs.map(m => [
                                    m.role === 'user' ? 'المستخدم' : 'نيكسوس',
                                    new Date(m.timestamp).toLocaleString('ar-SA'),
                                    (m.content || '').slice(0, 4000)
                                ])
                            ];
                  const res = await createGoogleSheetInWorkspace(session.title, finalRows);
                  showSidebarNotification('تم تصدير الجدول إلى Google Sheets بنجاح', 'success', res.spreadsheetUrl);
              }
          } catch (err: any) {
              showSidebarNotification(
                  err?.message || 'تعذر التصدير السحابي حالياً.',
                  'warn'
              );
          }
          return;
      }

      if (format === 'pdf') {
          const htmlMsgs = validMsgs
              .map(
                  m =>
                      `<div style="margin-bottom:18px;padding:14px;border-radius:12px;border:1px solid #e4e4e7;background:${
                          m.role === 'user' ? '#f8fafc' : '#ecfdf5'
                      }"><div style="font-weight:bold;color:${
                          m.role === 'user' ? '#334155' : '#065f46'
                      };margin-bottom:6px">${
                          m.role === 'user' ? 'المستخدم' : 'نيكسوس'
                      } · <span style="font-size:11px;color:#71717a">${new Date(
                          m.timestamp
                      ).toLocaleString('ar-SA')}</span></div><div style="white-space:pre-wrap;line-height:1.8;color:#18181b">${(
                          m.content || ''
                      )
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</div></div>`
              )
              .join('');
          const htmlDoc = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${session.title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:36px;max-width:820px;margin:0 auto;direction:rtl}</style></head><body><h1 style="color:#065f46;border-bottom:2px solid #10b981;padding-bottom:10px">${session.title}</h1>${htmlMsgs}</body></html>`;
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);
          const frameDoc = iframe.contentWindow?.document;
          if (frameDoc) {
              frameDoc.open();
              frameDoc.write(htmlDoc);
              frameDoc.close();
              setTimeout(() => {
                  iframe.contentWindow?.focus();
                  iframe.contentWindow?.print();
                  setTimeout(() => {
                      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                  }, 2000);
              }, 300);
          }
          showSidebarNotification('تم تجهيز وثيقة PDF للطباعة أو الحفظ', 'success');
          return;
      }

      let mime = 'text/plain;charset=utf-8';
      let ext: string = format;
      let fileData = plainTranscript;

      if (format === 'md') {
          mime = 'text/markdown;charset=utf-8';
          fileData = mdTranscript;
      } else if (format === 'doc') {
          mime = 'application/msword;charset=utf-8';
          fileData = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${session.title}</title></head><body style="font-family:Arial,sans-serif;direction:rtl;line-height:1.8"><h1>${session.title}</h1>${validMsgs
              .map(
                  m =>
                      `<p><strong>${m.role === 'user' ? 'المستخدم' : 'نيكسوس'}:</strong><br/>${(m.content || '')
                          .replace(/\n/g, '<br/>')
                          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p><hr/>`
              )
              .join('')}</body></html>`;
      } else if (format === 'csv') {
          mime = 'text/csv;charset=utf-8';
          const tableMessages = validMsgs.filter(m => hasMarkdownOrCsvTable(m.content || ''));
          if (tableMessages.length > 0) {
              const allRows: string[][] = [];
              tableMessages.forEach(m => {
                  allRows.push(...extractRowsFromTextForSheets(m.content || ''));
              });
              fileData =
                  '\uFEFF' +
                  allRows
                      .map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))
                      .join('\n');
          } else {
              fileData =
                  '\uFEFF' +
                  [
                      '"رقم الرسالة","المرسل","التاريخ والوقت","المحتوى"',
                      ...validMsgs.map(
                          (m, idx) =>
                              `"${idx + 1}","${m.role === 'user' ? 'المستخدم' : 'نيكسوس'}","${new Date(
                                  m.timestamp
                              ).toLocaleString('ar-SA')}","${(m.content || '').replace(/"/g, '""')}"`
                      )
                  ].join('\n');
          }
      } else if (format === 'html') {
          mime = 'text/html;charset=utf-8';
          fileData = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${session.title}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-zinc-950 text-zinc-100 p-8 max-w-4xl mx-auto space-y-4"><h1 class="text-2xl font-bold text-emerald-400 border-b border-zinc-800 pb-3">${session.title}</h1>${validMsgs
              .map(
                  m =>
                      `<div class="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-2"><div class="text-xs font-bold text-emerald-300">${
                          m.role === 'user' ? 'المستخدم' : 'نيكسوس'
                      }</div><div class="text-sm whitespace-pre-wrap leading-relaxed">${(m.content || '')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')}</div></div>`
              )
              .join('')}</body></html>`;
      } else if (format === 'json') {
          mime = 'application/json;charset=utf-8';
          fileData = JSON.stringify(session, null, 2);
      }

      const blob = new Blob([fileData], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSidebarNotification(`تم تنزيل المحادثة بصيغة (${ext.toUpperCase()})`, 'success');
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSessionMenuOpenId(null);
      setSessionExportSubmenuId(null);
      if (Object.keys(sessions).length <= 1) {
          showSidebarNotification("لا يمكن حذف المحادثة الوحيدة المتبقية.", 'warn');
          addLog("لا يمكن حذف المحادثة الوحيدة المتبقية.", 'warn');
          return;
      }
      
      setSessions(prev => {
          const newSessions = { ...prev };
          delete newSessions[id];
          saveLocalSessions(newSessions);
          return newSessions;
      });
      if (activeSessionId === id) {
          const remainingIds = Object.keys(sessions).filter(k => k !== id);
          setActiveSessionId(remainingIds[0]);
      }
      deleteSessionFromServer(id);
      if (firebaseUser) {
          try {
              await deleteSessionFromFirestore(firebaseUser, id);
          } catch (err) {
              console.warn("Failed to delete session from Firestore:", err);
          }
      }
      showSidebarNotification("تم حذف المحادثة.", 'info');
      addLog("تم حذف المحادثة.", 'info');
  };

  const handleCrystallize = async () => {
      if (!activeSessionId) return;
      setStage(ProcessingStage.CRYSTALLIZING);
      addLog("INITIATING MEMORY CRYSTALLIZATION PROTOCOL...", 'god_mode');
      
      try {
          const { axioms: newAxioms, soulPrintUpdate } = await crystallizeSession(sessions[activeSessionId].messages, activeSessionId);
          if (newAxioms.length > 0 || soulPrintUpdate) {
              setMemoryBank(prev => ({
                  ...prev,
                  axioms: [...prev.axioms, ...newAxioms],
                  soulPrint: {
                      ...prev.soulPrint,
                      ...soulPrintUpdate
                  },
                  lastUpdated: Date.now(),
                  version: prev.version + 1
              }));
              addLog(`Crystallization Complete: ${newAxioms.length} Axioms solidified.`, 'success');
          } else {
              addLog("Crystallization: No new truths found.", 'warn');
          }
      } catch (e) {
          addLog("Crystallization Failed.", 'error');
      } finally {
          setStage(ProcessingStage.IDLE);
      }
  };

  const indexExtractedSourceIntoActiveRagNotebook = (newSource: GeminiNotebookSource) => {
    setMemoryBank(prev => {
      const existingNotebooks =
        prev.geminiNotebooks && prev.geminiNotebooks.length > 0
          ? prev.geminiNotebooks
          : [
              {
                id: 'nb-google-default-1',
                title: 'الدفتر المعرفي الأساسي (Google Workspace RAG)',
                description: 'دفتر متصل بمحادثات نيكسوس ومحرك RAG لتلخيص الملفات والاستعلام عنها بالمراجع [1]',
                themeColor: 'indigo' as const,
                customDirective: 'اعتمد على مصادر هذا الدفتر المرقمة [1]، [2] لتلخيص الملفات والإجابة عن الاستعلامات بدقة.',
                sources: [],
                linkedSessionIds: activeSessionId ? [activeSessionId] : [],
                isSyncedToCloud: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
              }
            ];

      const targetNbId = prev.activeNotebookId || existingNotebooks[0].id;
      const updatedNotebooks = existingNotebooks.map(nb => {
        if (nb.id !== targetNbId) return nb;
        const filteredSources = nb.sources.filter(s => s.title !== newSource.title);
        return {
          ...nb,
          sources: [newSource, ...filteredSources],
          updatedAt: Date.now()
        };
      });

      const nextActiveIds = Array.from(new Set([...(prev.activeNotebookIds || []), targetNbId]));
      const nextBank: MemoryBank = {
        ...prev,
        geminiNotebooks: updatedNotebooks,
        activeNotebookId: targetNbId,
        activeNotebookIds: nextActiveIds,
        lastUpdated: Date.now()
      };
      saveMemoryBank(nextBank);
      return nextBank;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesList: File[] = Array.from(e.target.files);
      const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB Limit with Chunked Upload & RAG Engine

      const validFiles = filesList.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          addLog(`CRITICAL: [${file.name}] exceeds 250MB limit.`, 'warn');
          return false;
        }
        return true;
      });

      if (validFiles.length === 0 && filesList.length > 0) {
        showSidebarNotification('حجم الملف يتجاوز 250 ميجابايت؛ يرجى اختيار ملف أصغر.', 'warn');
        return;
      }

      // 1. Create initial attachment placeholders
      const initialAttachments: Attachment[] = validFiles.map(file => {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const lower = file.name.toLowerCase();
        const inferredMime =
          file.type ||
          (lower.endsWith('.pdf')
            ? 'application/pdf'
            : lower.endsWith('.zip')
            ? 'application/zip'
            : 'application/octet-stream');
        return {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          mimeType: inferredMime,
          status: 'loading',
          progress: 5,
          detectedFormat: ext
        };
      });

      setSelectedFiles(prev => [...prev, ...initialAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      addLog(`Initiating Google Workspace & Chunked RAG Absorption for ${validFiles.length} artifacts...`, 'info');

      // 2. Process each file (supports 26MB+ ZIP archives and large files via 4MB chunked streaming)
      validFiles.forEach(async (file, index) => {
        const attachmentId = initialAttachments[index].id;
        const lowerName = file.name.toLowerCase();
        const isSmallNativeMultimodal =
          file.size <= 12 * 1024 * 1024 &&
          (file.type.startsWith('image/') ||
            file.type.startsWith('audio/') ||
            file.type === 'application/pdf' ||
            lowerName.endsWith('.pdf') ||
            /\.(png|jpe?g|webp|gif|bmp|mp3|wav|ogg|m4a)$/i.test(lowerName));

        let optionalBase64Data: string | undefined;

        if (isSmallNativeMultimodal) {
          try {
            optionalBase64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const res = String(reader.result || '');
                resolve(res.includes(',') ? res.split(',')[1] : res);
              };
              reader.onerror = () => reject(new Error('Read error'));
              reader.readAsDataURL(file);
            });
          } catch {
            // Continue with chunked RAG extraction even if inline dataURL read fails
          }
        }

        try {
          const { source, driveRecord, ragExtraction } = await ingestBrowserFileIntoWorkspaceRag(
            file,
            undefined,
            (pct) => {
              setSelectedFiles(prev =>
                prev.map(att =>
                  att.id === attachmentId ? { ...att, progress: pct } : att
                )
              );
            }
          );

          indexExtractedSourceIntoActiveRagNotebook(source);

          setSelectedFiles(prev =>
            prev.map(att =>
              att.id === attachmentId
                ? {
                    ...att,
                    status: 'complete',
                    progress: 100,
                    data: optionalBase64Data,
                    extractedRagText: source.content,
                    detectedFormat: ragExtraction?.detectedFormat || att.detectedFormat,
                    ragWordCount: source.wordCount,
                    ragChunksCount:
                      ragExtraction?.chunksCount || Math.max(1, Math.ceil(source.wordCount / 310)),
                    isRagIndexed: true,
                    driveWebViewLink: driveRecord.webViewLink
                  }
                : att
            )
          );
          addLog(
            `GOOGLE WORKSPACE RAG: Indexed [${file.name}] (${(file.size / (1024 * 1024)).toFixed(2)} MB · ${ragExtraction?.detectedFormat || 'FILE'} · ${source.wordCount} words).`,
            'success'
          );
        } catch (err: any) {
          if (optionalBase64Data) {
            setSelectedFiles(prev =>
              prev.map(att =>
                att.id === attachmentId
                  ? {
                      ...att,
                      status: 'complete',
                      progress: 100,
                      data: optionalBase64Data
                    }
                  : att
              )
            );
          } else {
            setSelectedFiles(prev =>
              prev.map(att =>
                att.id === attachmentId ? { ...att, status: 'error' } : att
              )
            );
            addLog(`Absorption Failure: [${file.name}] (${err?.message || 'Error'}).`, 'error');
          }
        }
      });
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleEditMessage = React.useCallback((content: string) => {
    setInput(content);
    if (fileInputRef.current) fileInputRef.current.focus();
  }, []);

  const handleOpenMindMap = React.useCallback((content: string) => {
    setMindMapContent(content);
    setIsMindMapOpen(true);
  }, []);

  // --- AUDIO LOGIC (VOICE I/O) ---
  
  // 1. Text-to-Speech
  const handleGenerateAudio = React.useCallback(async (textToRead: string, messageId: string) => {
    if (stageRef.current !== ProcessingStage.IDLE) return;
    
    setStage(ProcessingStage.SPEAKING);
    addLog("Initiating Neural Voice Synthesis...", 'surface');

    const audioBase64 = await generateAudioBriefing(textToRead.substring(0, 2000)); // Limit for speed
    
    if (audioBase64) {
        setSessions(prev => ({
            ...prev,
            [activeSessionId]: {
                ...prev[activeSessionId],
                messages: prev[activeSessionId].messages.map(m => 
                    m.id === messageId ? { ...m, audioData: audioBase64 } : m
                )
            }
        }));
        addLog("Neural Voice synthesized successfully.", 'success');
        playAudio(audioBase64);
    } else {
        addLog("Voice Synthesis Failed.", 'error');
    }
    setStage(ProcessingStage.IDLE);
  }, [activeSessionId]);

  const playAudio = React.useCallback(async (base64String: string) => {
      if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
          setIsPlaying(false);
          return; // Toggle behavior
      }

      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }

          // Decode
          const binaryString = atob(base64String);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          
          const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
          
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          
          source.onended = () => {
              setIsPlaying(false);
              audioSourceRef.current = null;
          };
          
          source.start(0);
          audioSourceRef.current = source;
          setIsPlaying(true);
      } catch (e) {
          console.error("Audio Playback Error:", e);
          addLog("Audio Driver Failure.", 'error');
      }
  }, []);

  // 2. Speech-to-Text (Sonic Gate)
  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const startRecording = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          alert("Sonic Gate Unavailable: Browser does not support Speech API.");
          return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ar-SA'; // Default to Arabic/Auto

      recognitionRef.current.onstart = () => {
          setIsRecording(true);
          addLog("Sonic Gate: Listening...", 'core');
      };

      recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join('');
          setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
          console.error("SpeechRecognition Error:", event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
              addLog("Sonic Gate: Microphone access denied. Please allow microphone permissions.", 'error');
          } else {
              addLog(`Sonic Gate: Interference Detected (${event.error}).`, 'error');
          }
      };

      recognitionRef.current.onend = () => {
          setIsRecording(false);
          addLog("Sonic Gate: Transmission Received.", 'success');
      };

      recognitionRef.current.start();
  };

  const stopRecording = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  };


  const handlePlayMessageAudio = React.useCallback((messageId: string, content: string, audioData?: string) => {
      if (audioData) {
          playAudio(audioData);
      } else {
          handleGenerateAudio(content, messageId);
      }
  }, [playAudio, handleGenerateAudio]);

  // --- UNIVERSAL FIREBASE ACCOUNT AUTH, ACCOUNT SWITCHING & ISOLATED CLOUD SYNC ---

  const handleUniversalFirebaseAccountLogin = async (customEmail?: string, customName?: string) => {
    // 1. Save outgoing account's state to its own isolated scope BEFORE switching
    const previousScope = getActiveAccountScope();
    if (isHydratedRef.current && previousScope && Object.keys(sessions).length > 0) {
      saveLocalSessions(sessions, previousScope);
      saveMemoryBank(memoryBank, previousScope);
      if (previousScope !== 'guest') {
        await syncAccountStateToFirebaseVaultMirror(previousScope, userProfile, sessions, memoryBank, activeSessionId);
      }
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    enableFirebaseUniversalVaultMode();

    const resolvedEmail = (customEmail || '').trim().toLowerCase() || PRIMARY_SECURITY_ADMIN_EMAIL;
    const resolvedName =
      (customName || '').trim() ||
      resolvedEmail.split('@')[0] ||
      'مستخدم نيكسوس';
    const targetScope = deriveAccountScopeId(resolvedEmail);

    // Ensure Firebase Auth session is active (universal anonymous fallback if no popup)
    let fbUser = auth.currentUser;
    if (!fbUser) {
      fbUser = await signInWithFirebaseGoogle(false);
    }
    if (fbUser) {
      setFirebaseUser(fbUser);
    }

    const accountProfile: UserProfile = {
      uid: `firebase-${targetScope}`,
      name: resolvedName,
      email: resolvedEmail,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedEmail)}`
    };

    setUserProfile(accountProfile);
    localStorage.setItem('nexus_firebase_account_profile', JSON.stringify(accountProfile));
    localStorage.removeItem('nexus_gcloud_direct_profile');

    const updatedRegistry = registerSavedAccountOnDevice({
      scopeId: targetScope,
      uid: accountProfile.uid,
      name: accountProfile.name,
      email: accountProfile.email,
      picture: accountProfile.picture,
      lastActiveAt: Date.now()
    });
    setSavedAccountsList(updatedRegistry);

    // 2. Hydrate ONLY the target account's isolated sessions & memory bank (never merging previous account!)
    await activateAndHydrateAccountScope(targetScope, accountProfile, fbUser);

    setSyncStatus({
      isSynced: true,
      lastSyncTime: Date.now(),
      cloudProvider: 'firebase',
      isSyncing: false
    });
    addLog(`تم تفعيل حساب Firebase المعزول بنجاح: ${accountProfile.email}`, 'success');
  };

  const handleSwitchSavedAccount = async (entry: SavedFirebaseAccountEntry) => {
    await handleUniversalFirebaseAccountLogin(entry.email, entry.name);
    setIsAccountModalOpen(false);
    showSidebarNotification(`تم التبديل إلى حساب: ${entry.name} (${entry.email})`, 'success');
  };

  const handleRemoveSavedAccount = (scopeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextList = removeSavedAccountFromDevice(scopeId);
    setSavedAccountsList(nextList);
  };

  const handleCloudConnect = async (openOnboardingAfter = true, tryGooglePopup = false) => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const previousScope = getActiveAccountScope();
      if (isHydratedRef.current && previousScope && Object.keys(sessions).length > 0) {
        saveLocalSessions(sessions, previousScope);
        saveMemoryBank(memoryBank, previousScope);
        if (previousScope !== 'guest') {
          await syncAccountStateToFirebaseVaultMirror(previousScope, userProfile, sessions, memoryBank, activeSessionId);
        }
      }

      const user = await signInWithFirebaseGoogle(tryGooglePopup);
      const fallbackEmail = authEmailInput.trim().toLowerCase() || user?.email || PRIMARY_SECURITY_ADMIN_EMAIL;
      const fallbackName =
        onboardingNameInput.trim() ||
        user?.displayName ||
        fallbackEmail.split('@')[0] ||
        'مستخدم نيكسوس';

      if (!user || !user.email) {
        await handleUniversalFirebaseAccountLogin(fallbackEmail, fallbackName);
        if (openOnboardingAfter) {
          setOnboardingNameInput(prev => prev || fallbackName);
          setOnboardingBioInput(prev => prev || '');
          setAccountModalStep('onboarding');
          setIsAccountModalOpen(true);
        }
        return;
      }

      setFirebaseUser(user);
      const targetScope = deriveAccountScopeId(user.email, user.uid);
      const profileObj: UserProfile = {
        uid: user.uid,
        name: fallbackName,
        email: user.email,
        picture: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`
      };

      setUserProfile(profileObj);
      localStorage.setItem('nexus_firebase_account_profile', JSON.stringify(profileObj));
      localStorage.removeItem('nexus_gcloud_direct_profile');

      const updatedRegistry = registerSavedAccountOnDevice({
        scopeId: targetScope,
        uid: profileObj.uid,
        name: profileObj.name,
        email: profileObj.email,
        picture: profileObj.picture,
        lastActiveAt: Date.now()
      });
      setSavedAccountsList(updatedRegistry);

      await activateAndHydrateAccountScope(targetScope, profileObj, user);
      setSyncStatus({
        isSynced: true,
        lastSyncTime: Date.now(),
        cloudProvider: 'firebase',
        isSyncing: false
      });

      if (openOnboardingAfter) {
        setOnboardingNameInput(profileObj.name);
        setOnboardingBioInput('');
        setAccountModalStep('onboarding');
        setIsAccountModalOpen(true);
      }
    } catch {
      await handleUniversalFirebaseAccountLogin(authEmailInput, onboardingNameInput);
      if (openOnboardingAfter) {
        setAccountModalStep('onboarding');
        setIsAccountModalOpen(true);
      }
    }
  };

  const handleUnifiedEmailAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;
    await handleUniversalFirebaseAccountLogin(cleanEmail, onboardingNameInput || cleanEmail.split('@')[0]);
    if (authTabMode === 'signup') {
      setOnboardingNameInput(prev => prev || cleanEmail.split('@')[0]);
      setOnboardingBioInput('');
      setAccountModalStep('onboarding');
    } else {
      setIsAccountModalOpen(false);
      showSidebarNotification(`تم تسجيل الدخول إلى حساب Firebase: ${cleanEmail}`, 'success');
    }
  };

  const handleSaveOnboardingPersonalization = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = onboardingNameInput.trim() || userProfile?.name || 'صديقي';
    const cleanBio = onboardingBioInput.trim();
    const currentScope = getActiveAccountScope();

    if (userProfile) {
      const updatedProfile: UserProfile = {
        ...userProfile,
        name: cleanName
      };
      setUserProfile(updatedProfile);
      localStorage.setItem('nexus_firebase_account_profile', JSON.stringify(updatedProfile));
      if (updatedProfile.email) {
        const updatedRegistry = registerSavedAccountOnDevice({
          scopeId: currentScope,
          uid: updatedProfile.uid,
          name: updatedProfile.name,
          email: updatedProfile.email,
          picture: updatedProfile.picture,
          lastActiveAt: Date.now()
        });
        setSavedAccountsList(updatedRegistry);
      }
    }

    setMemoryBank(prev => {
      const existingPrefs = prev.userPreferences || {
        userDisplayName: '',
        userBioOrRole: '',
        customInstructions: '',
        responseTone: 'balanced',
        responseLength: 'balanced',
        fontSize: 'medium',
        keepThinkingExpanded: false,
        showThinkingProcess: true,
        sendOnEnter: false
      };

      const nextAxioms = [...(prev.axioms || [])];
      if (cleanName) {
        const nameAxiomContent = `يفضل المستخدم أن يناديه نيكسوس باسم: "${cleanName}".`;
        if (!nextAxioms.some(a => a.content === nameAxiomContent)) {
          nextAxioms.unshift({
            id: `ax-user-name-${Date.now()}`,
            content: nameAxiomContent,
            category: 'identity',
            sourceSessionId: activeSessionId || 'onboarding',
            createdAt: Date.now()
          });
        }
      }
      if (cleanBio) {
        const bioAxiomContent = `نبذة المستخدم وخلفيته الشخصية لتخصيص إجابات نيكسوس: "${cleanBio}".`;
        if (!nextAxioms.some(a => a.content === bioAxiomContent)) {
          nextAxioms.unshift({
            id: `ax-user-bio-${Date.now()}`,
            content: bioAxiomContent,
            category: 'preference',
            sourceSessionId: activeSessionId || 'onboarding',
            createdAt: Date.now()
          });
        }
      }

      const updated: MemoryBank = {
        ...prev,
        axioms: nextAxioms,
        userPreferences: {
          ...existingPrefs,
          userDisplayName: cleanName,
          userBioOrRole: cleanBio
        },
        lastUpdated: Date.now(),
        version: (prev.version || 1) + 1
      };
      saveMemoryBank(updated, currentScope);
      if (currentScope !== 'guest') {
        syncAccountStateToFirebaseVaultMirror(currentScope, userProfile, sessions, updated, activeSessionId).catch(() => {});
      }
      if (firebaseUser) {
        syncAxiomsToFirestore(firebaseUser, updated.axioms, updated, activeSessionId).catch(() => {});
      }
      return updated;
    });

    setIsAccountModalOpen(false);
  };

  const handleCloudPull = async (overrideUser?: FirebaseUser) => {
    const targetUser = overrideUser || firebaseUser;
    const currentScope = getActiveAccountScope();
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      await activateAndHydrateAccountScope(currentScope, userProfile, targetUser);
      setSyncStatus({
        isSynced: true,
        lastSyncTime: Date.now(),
        cloudProvider: 'firebase',
        isSyncing: false
      });
      addLog(`تمت المزامنة السحابية عبر Firebase بنجاح للنطاق [${currentScope}].`, 'success');
      showSidebarNotification('تمت مزامنة محادثات وذاكرة حسابك عبر Firebase', 'success');
    } catch (e) {
      console.warn('Firebase Pull Notice:', e);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      addLog('تعذرت المزامنة اللحظية مع Firebase.', 'error');
    }
  };

  const handleSignOut = async () => {
    // 1. Flush current account's conversations and memory bank to its own isolated scope before logging out
    const outgoingScope = getActiveAccountScope();
    isHydratedRef.current = false;
    try {
      if (outgoingScope && outgoingScope !== 'guest' && Object.keys(sessions).length > 0) {
        saveLocalSessions(sessions, outgoingScope);
        saveMemoryBank(memoryBank, outgoingScope);
        await syncAccountStateToFirebaseVaultMirror(outgoingScope, userProfile, sessions, memoryBank, activeSessionId);
      }
    } catch {
      // ignore
    }

    try {
      await signOutFromFirebase();
    } catch (e) {
      console.warn('Logout notice', e);
    }

    // 2. Remove active profile pointers & switch active storage scope to isolated 'guest'
    localStorage.removeItem('nexus_firebase_account_profile');
    localStorage.removeItem('nexus_gcloud_direct_profile');
    setActiveAccountScope('guest');
    setActiveAccountScopeState('guest');
    clearLocalMemory('guest');

    // 3. Reset in-memory conversations & memoryBank so ZERO conversations from the signed-out account remain visible
    const freshGuestSession = createNewSession('محادثة جديدة');
    const freshGuestSessionsMap: SessionsMap = { [freshGuestSession.id]: freshGuestSession };
    const freshGuestMemory = createInitialMemoryBank();

    userSelectedSessionRef.current = freshGuestSession.id;
    activeSessionIdRef.current = freshGuestSession.id;
    setFirebaseUser(null);
    setUserProfile(null);
    setSessions(freshGuestSessionsMap);
    setActiveSessionId(freshGuestSession.id);
    setMemoryBank(freshGuestMemory);
    saveLocalSessions(freshGuestSessionsMap, 'guest');
    saveMemoryBank(freshGuestMemory, 'guest');
    setSyncStatus({ isSynced: false, lastSyncTime: null, cloudProvider: 'none', isSyncing: false });
    isHydratedRef.current = true;

    showSidebarNotification('تم تسجيل الخروج وعزل محادثات الحساب السابق بالكامل.', 'info');
    addLog('تم تسجيل الخروج من حساب Firebase وعزل جلسات الحساب.', 'info');
  };

  const handleClearMemory = () => {
    const currentScope = getActiveAccountScope();
    if (window.confirm('تحذير: هل تريد مسح جميع المحادثات والذاكرة الخاصة بهذا الحساب المحلي؟')) {
      clearLocalMemory(currentScope);
      const newSession = createNewSession('محادثة جديدة');
      const nextSessions = { [newSession.id]: newSession };
      const nextMemory = createInitialMemoryBank();
      userSelectedSessionRef.current = newSession.id;
      activeSessionIdRef.current = newSession.id;
      setSessions(nextSessions);
      setMemoryBank(nextMemory);
      setActiveSessionId(newSession.id);
      saveLocalSessions(nextSessions, currentScope);
      saveMemoryBank(nextMemory, currentScope);
      addLog('تم مسح ذاكرة النطاق الحالي بالكامل.', 'error');
    }
  };

  const handleAuditMemory = async () => {
      if (!activeSessionId) return;
      setIsAuditing(true);
      setShowAuditorModal(true);
      addLog("Memory Matrix Audit Initiated...", 'core');
      
      try {
          const currentMessages = sessions[activeSessionId].messages;
          const result = await auditMemoryMatrix(currentMessages, memoryBank);
          setAuditResult(result);
          addLog("Memory Matrix Audit Complete.", 'success');
      } catch (e: any) {
          addLog(`Audit Failed: ${e.message}`, 'error');
      } finally {
          setIsAuditing(false);
      }
  };

  const handleSharePrismImage = (imageUrl: string, prompt: string, refinedPrompt: string, style: string) => {
      const userMsg: Message = {
        id: `m-prism-user-${Date.now()}`,
        role: 'user',
        content: `توليد مشهد بصري (نمط ${style}): "${prompt}"`,
        timestamp: Date.now(),
      };
      
      const nexusMsg: Message = {
        id: `m-prism-nexus-${Date.now()}`,
        role: 'model',
        content: 'أتممتُ رسم هذه اللوحة من الاستوديو البصري:',
        timestamp: Date.now() + 100,
        generatedImage: imageUrl,
        imagePrompt: refinedPrompt || prompt,
        routedModel: selectedModel,
        usedTools: ['توليد الصور']
      };

      setSessions(prev => {
        const activeId = activeSessionId || Object.keys(prev)[0];
        if (!activeId) return prev;
        const targetSession = prev[activeId];
        return {
          ...prev,
          [activeId]: {
            ...targetSession,
            messages: [...targetSession.messages, userMsg, nexusMsg],
            lastActiveAt: Date.now(),
          }
        };
      });
      
      addLog(`Prism Crystallization: successfully injected image artifact into thread.`, 'success');
  };

  const handleOpenImageInStudio = (promptText: string, imageDataUrl?: string) => {
    const cleanPrompt = (promptText || '')
      .replace(/\[NEXUS_SOVEREIGN_VISUAL_MANIFESTATION[\s\S]*?\[PRIMARY_CONCEPT\]:\s*/i, '')
      .split('\n')[0]
      .trim();
    setStudioInitialPrompt(cleanPrompt || promptText);
    const normalizedImageUrl =
      imageDataUrl && imageDataUrl.startsWith('NEXUS_MULTI_MODEL_MIX|')
        ? imageDataUrl.split('|')[1] || ''
        : imageDataUrl || '';
    if (normalizedImageUrl && normalizedImageUrl.startsWith('data:image')) {
      const parts = normalizedImageUrl.split(',');
      const mimeMatch = parts[0].match(/data:(.*?);base64/);
      setStudioInitialEditImage({
        data: parts[1] || '',
        mimeType: mimeMatch ? mimeMatch[1] : 'image/png'
      });
    } else {
      setStudioInitialEditImage(null);
    }
    setIsPrismModalOpen(true);
  };

  const handleRegenerateImageInChat = async (
    rawPrompt: string,
    opts?: { cameraAngle?: string; useOdyssey?: boolean; aspectRatio?: string }
  ) => {
    if (!activeSessionId || stage !== ProcessingStage.IDLE) return;
    const cleanConcept = (rawPrompt || '')
      .replace(/\[NEXUS_SOVEREIGN_VISUAL_MANIFESTATION[\s\S]*?\[PRIMARY_CONCEPT\]:\s*/i, '')
      .split('\n')[0]
      .trim() || rawPrompt;

    const targetAspect = opts?.aspectRatio || inlineAspectRatio || '16:9';
    const effectiveModel = selectedModel === 'auto-selection' ? 'nexus-4-flash' : selectedModel;
    const angleLabel = opts?.cameraAngle && opts.cameraAngle !== 'default' ? ` · زاوية: ${opts.cameraAngle}` : '';
    const regenMsgId = `m-prism-regen-${Date.now()}`;
    const currentSessionObj = sessions[activeSessionId];

    const initialRegenMsg: Message = {
      id: regenMsgId,
      role: 'model',
      content: 'أعيد رسم المشهد الآن...',
      thoughtProcess: 'أتأمل المشهد لأعيد تكوينه بتوازن أوضح في الإضاءة والتفاصيل...',
      isStreaming: true,
      isThinkingStreaming: true,
      timestamp: Date.now(),
      routedModel: effectiveModel,
      usedTools: ['توليد الصور']
    };

    setSessions(prev => {
      const currentSession = prev[activeSessionId];
      if (!currentSession) return prev;
      return {
        ...prev,
        [activeSessionId]: {
          ...currentSession,
          messages: [...currentSession.messages, initialRegenMsg],
          lastActiveAt: Date.now()
        }
      };
    });

    setStage(ProcessingStage.PRISM_REFRACTION);
    setLiveToolTelemetry({
      modelLabel: (SOVEREIGN_MODELS.find(m => m.id === effectiveModel) || SOVEREIGN_MODELS[1]).labelAr,
      activeTools: ['توليد الصور (Nano-Banana 2.1 ➔ Nano-Banana Lite)'],
      activeSkills: [],
      status: 'running'
    });

    try {
      const prismResult = await generateVisualArtifact(
        cleanConcept,
        targetAspect,
        'none',
        '[IN-CHAT DIRECT REGENERATION]',
        Boolean(isDeepManifestation || isMaxEffortEnabled),
        undefined,
        (msg, type) => addLog(msg, type as any),
        state => {
          setManifestationState(state);
          setSessions(prev => {
            const currentSession = prev[activeSessionId];
            if (!currentSession) return prev;
            return {
              ...prev,
              [activeSessionId]: updateSessionMessageFastWithMap(currentSession, regenMsgId, m => ({
                ...m,
                thoughtProcess: state.liveThoughtProcess || m.thoughtProcess,
                content: state.liveResponseText || m.content,
                generatedImage:
                  state.imageData && !state.imageData.startsWith('data:image/svg+xml')
                    ? state.imageData
                    : m.generatedImage,
                nanoVisualTelemetry: state.nanoVisualTelemetry || m.nanoVisualTelemetry,
                isThinkingStreaming: state.phase !== 'Converged',
                isStreaming: state.phase !== 'Converged',
                thinkingDuration: state.thinkingDurationSec ?? m.thinkingDuration
              }))
            };
          });
        },
        {
          selectedChatModel: effectiveModel,
          resolution: '2K',
          cameraAngle: opts?.cameraAngle || 'default',
          isMaxEffortEnabled,
          sessionId: activeSessionId,
          sessionTitle: currentSessionObj?.title || 'محادثة بصرية',
          streamMsgId: regenMsgId,
          usedTools: ['توليد الصور'],
          accountScope: getActiveAccountScope()
        }
      );

      setSessions(prev => {
        const currentSession = prev[activeSessionId];
        if (!currentSession) return prev;
        return {
          ...prev,
          [activeSessionId]: updateSessionMessageFastWithMap(currentSession, regenMsgId, m => ({
            ...m,
            content:
              prismResult.finalResponse ||
              (angleLabel ? 'أعدتُ رسم هذا المشهد من الزاوية المطلوبة:' : 'أتممتُ إعادة رسم هذا المشهد:'),
            thoughtProcess: prismResult.thoughtProcess || m.thoughtProcess,
            thinkingDuration: prismResult.thinkingDuration ?? m.thinkingDuration,
            generatedImage: prismResult.data || m.generatedImage,
            imagePrompt: prismResult.refinedPrompt || cleanConcept,
            nanoVisualTelemetry: prismResult.nanoVisualTelemetry || m.nanoVisualTelemetry,
            isStreaming: false,
            isThinkingStreaming: false,
            usedTools: ['توليد الصور']
          }))
        };
      });
    } catch (err) {
      console.warn('In-chat image regeneration failed:', err);
      setSessions(prev => {
        const currentSession = prev[activeSessionId];
        if (!currentSession) return prev;
        return {
          ...prev,
          [activeSessionId]: updateSessionMessageFastWithMap(currentSession, regenMsgId, m => ({
            ...m,
            isStreaming: false,
            isThinkingStreaming: false
          }))
        };
      });
    } finally {
      setManifestationState(null);
      setStage(ProcessingStage.IDLE);
      setLiveToolTelemetry(prev => (prev ? { ...prev, status: 'completed' } : null));
      setTimeout(() => {
        setLiveToolTelemetry(prev => (prev?.status === 'completed' ? null : prev));
      }, 3000);
    }
  };

  const handleExportLocal = () => {
      try {
          const data = { sessions, memoryBank };
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `nexus_memory_matrix_${new Date().toISOString().replace(/[:.]/g, '-')}.json`; 
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          addLog("Memory Matrix Exported to Local Crystal (Blob).", 'success');
      } catch (e) {
          addLog("Export Failed: Write Protocol Error.", 'error');
      }
  };

  const handleImportLocalClick = () => {
      importInputRef.current?.click();
  };

  // SMART IMPORT HANDLER
  const handleImportLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const result = event.target?.result;
              if (typeof result !== 'string') throw new Error("Read Error");
              
              // 1. Attempt to Parse as JSON (Full Backup)
              try {
                  const parsed = JSON.parse(result);
                  
                  // Check if it's the new format { sessions, memoryBank }
                  if (parsed.sessions && parsed.memoryBank) {
                      setSessions(parsed.sessions);
                      setMemoryBank(parsed.memoryBank);
                      saveLocalSessions(parsed.sessions);
                      saveMemoryBank(parsed.memoryBank);
                      addLog("Memory Matrix Full Restore Complete.", 'success');
                      return;
                  }

                  const keys = Object.keys(parsed);
                  if (typeof parsed === 'object' && parsed !== null && keys.length > 0 && parsed[keys[0]].messages) {
                      setSessions(parsed);
                      saveLocalSessions(parsed);
                      if (keys.length > 0) setActiveSessionId(keys[0]);
                      addLog(`Memory Matrix Restored: ${keys.length} threads loaded.`, 'success');
                      return; 
                  }
              } catch (jsonErr) {
                  // Not JSON, fall through
              }

              // 2. Fallback: Treat as Plain Text
              const fileName = file.name.replace(/\.[^/.]+$/, "");
              const newSession = createNewSession(`Imported: ${fileName}`);
              newSession.messages.push({
                  id: Date.now().toString(),
                  role: 'user',
                  content: `[SYSTEM: File Imported Content]\n\n${result}`,
                  timestamp: Date.now()
              });

              setSessions(prev => {
                  const updated = { ...prev, [newSession.id]: newSession };
                  saveLocalSessions(updated);
                  return updated;
              });
              setActiveSessionId(newSession.id);
              addLog(`Text Artifact Imported as New Thread: "${fileName}"`, 'info');

          } catch (err) {
              console.error(err);
              addLog("Import Failed: File Unreadable.", 'error');
          }
      };
      reader.readAsText(file);
      if (importInputRef.current) importInputRef.current.value = '';
  };

  // --- SEND LOGIC ---

  const handleSend = async (
    overrideInput?: string,
    overrideNotebookIds?: string[],
    overrideUsageMode?: GeminiNotebookUsageMode
  ) => {
    const rawTypedInput = overrideInput !== undefined ? overrideInput : input;
    if ((!rawTypedInput.trim() && selectedFiles.length === 0) || !activeSessionId) return;
    if (stage !== ProcessingStage.IDLE) return;

    const finalInput =
      rawTypedInput.trim() ||
      (selectedFiles.length > 0
        ? `لخّص وحلّل محتوى الملفات المرفقة (${selectedFiles
            .map(f => f.name)
            .join('، ')}) عبر خدمة Google Workspace ومحرك RAG المدمج واستخرج المحاور والبيانات الأساسية مع التوثيق بالمراجع [1]، [2].`
        : '');

    const currentSession = sessions[activeSessionId];
    
    // Auto-rename session on first message (or if it still has a default "محادثة جديدة" title)
    let sessionTitle = currentSession.title;
    if (
      currentSession.messages.length === 0 ||
      /^محادثة جديدة(\s*#\d+)?$/i.test((currentSession.title || '').trim())
    ) {
      const cleanFirstLine = finalInput
        .replace(/^[#*\->\s]+/, '')
        .replace(/\s+/g, ' ')
        .trim();
      sessionTitle = cleanFirstLine.slice(0, 42) + (cleanFirstLine.length > 42 ? '...' : '');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalInput,
      timestamp: Date.now(),
      attachments: [...selectedFiles]
    };

    // Optimistic Update (also clear any lingering streaming flags on older messages in the session)
    const cleanedPreviousMessages = currentSession.messages.map(m =>
      m.isStreaming || m.isThinkingStreaming
        ? { ...m, isStreaming: false, isThinkingStreaming: false }
        : m
    );
    const updatedMessages = [...cleanedPreviousMessages, userMsg];
    
    setSessions(prev => ({
        ...prev,
        [activeSessionId]: {
            ...prev[activeSessionId],
            messages: updatedMessages,
            title: sessionTitle,
            lastActiveAt: Date.now()
        }
    }));
    
    setInput('');
    setSelectedFiles([]); 
    
    // 1. LAYER ASCENSION (Data Rising)
    setStage(ProcessingStage.LAYER_ASCENSION); 
    addLog(`The Sovereign: Initiating Ascension Protocol...`, 'god_mode');

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Smart Auto-Selection across productive NEXUS models:
    // - Casual greetings / short everyday chat -> nexus-4-hydrogen (fast, warm, quota-friendly)
    // - Deep root-cause debugging / security audit / formal proof -> nexus-4-carbon
    // - Complex engineering, coding, philosophy, critique, literature, or Agent/MaxEffort -> nexus-4-neon
    let actualModelChoice = selectedModel;
    if (selectedModel === 'auto-selection') {
         const promptLower = finalInput.toLowerCase();
         const isCasualGreetingOnly =
           /^(?:مرحبا|مرحباً|أهلا|أهلاً|هلا|السلام عليكم|صباح الخير|مساء الخير|كيف حالك|كيفك|شلونك|اخبارك|أخبارك|هاي|hi|hello|hey)\b/i.test(
             finalInput.trim()
           ) && finalInput.trim().length < 110 && !/(?:برمجة|كود|هندسة|تحليل|فلسف|رواية|مشروع|خطة|قارن|برهان|ثغرة)/i.test(finalInput);

         const isDeepRootCauseOrProof =
           /(?:برهان|إثبات رياضي|تدقيق أمني|ثغرة|root cause|security audit|mathematical proof|تحليل جذري عميق|تصحيح معماري)/i.test(
             promptLower
           );

         if (isCasualGreetingOnly && !isAgentModeEnabled && !isMaxEffortEnabled) {
              actualModelChoice = 'nexus-4-hydrogen';
              addLog(`NEXUS Auto-Core: Routed casual conversation to نيكسوس هيدروجين 4 (gemini-4-hydrogen).`, 'god_mode');
         } else if (isDeepRootCauseOrProof) {
              actualModelChoice = 'nexus-4-carbon';
              addLog(`NEXUS Auto-Core: Routed deep proof/audit to نيكسوس كاربون 4 (gemini-4-carbon).`, 'god_mode');
         } else if (
           isAgentModeEnabled ||
           isMaxEffortEnabled ||
           /(?:code|برمجة|هندسة|بناء|تطبيق|هيكلية|مشروع|وكيل|math|رياضيات|معادلة|معماري|تحليل|فلسف|رواية|قصة|سرد|تخيل|قيّم|انتقد|قرار|مأزق|استراتيجية)/i.test(
             promptLower
           ) ||
           finalInput.trim().length > 90
         ) {
              actualModelChoice = 'nexus-4-neon';
              addLog(`NEXUS Auto-Core: Routed deep task to نيكسوس نيون 4 (gemini-4-neon).`, 'god_mode');
         } else {
              actualModelChoice = 'nexus-4-hydrogen';
              addLog(`NEXUS Auto-Core: Routed query to نيكسوس هيدروجين 4 (gemini-4-hydrogen).`, 'god_mode');
         }
    } else {
         addLog(`The Sovereign: Routing query to [${selectedModel}]...`, 'god_mode');
    }

    // Resolve attached Google NotebookLM notebooks (single or ++ multi-notebook) & usage mode
    const resolvedNotebookUsageMode: GeminiNotebookUsageMode =
      overrideUsageMode ||
      currentSession.notebookUsageMode ||
      memoryBank.notebookUsageMode ||
      'hybrid_web_plus';

    const explicitNotebookIds: string[] =
      overrideNotebookIds !== undefined
        ? overrideNotebookIds
        : currentSession.attachedNotebookIds !== undefined
        ? currentSession.attachedNotebookIds
        : memoryBank.activeNotebookIds !== undefined
        ? memoryBank.activeNotebookIds
        : currentSession.notebookId
        ? [currentSession.notebookId]
        : memoryBank.activeNotebookId
        ? [memoryBank.activeNotebookId]
        : [];

    const allNotebooks = memoryBank.geminiNotebooks || [];
    const attachedNotebooks = allNotebooks.filter(nb => explicitNotebookIds.includes(nb.id));

    // --- ZERO-CLICK AUTONOMOUS MULTI-TOOL DETECTION (Search + Canvas + Agent + Prism Visuals) ---
    const autoSearchDetected =
      isWebSearchEnabled ||
      (attachedNotebooks.length > 0 && resolvedNotebookUsageMode === 'hybrid_web_plus' && /ويب|\+\+|أحدث|ابحث|تحقق|قارن مع/i.test(finalInput)) ||
      /ابحث في الويب|ابحث عن|بحث في الانترنت|آخر الأخبار|اخر الاخبار|أخبار اليوم|اخبار اليوم|أحدث الأخبار|سعر سهم|أسعار اليوم|رابط موقع|مصادر موثوقة|تحقق من صحة|إحصائيات حديثة|search the web|latest news|breaking news|stock price|http:\/\/|https:\/\/|verify fact/i.test(finalInput);

    const autoCanvasDetected =
      Boolean(isCanvasMode) ||
      Boolean(isAgentModeEnabled) ||
      (attachedNotebooks.length > 0 && resolvedNotebookUsageMode === 'canvas_synthesis') ||
      /في الكانفاس|افتح الكانفاس|داخل الكانفاس|استخدم الكانفاس|in canvas|open canvas/i.test(finalInput);

    const hasAttachedUserImageNow = Boolean(
      userMsg.attachments?.some(a => a.mimeType?.startsWith('image/') && a.data)
    );
    const recentGeneratedVisualMsg = [...cleanedPreviousMessages]
      .reverse()
      .find(m => Boolean(m.generatedImage && !m.generatedImage.startsWith('data:image/svg+xml')));
    const visualIntent = detectVisualGenerationIntent(finalInput, {
      hasImageAttachment: hasAttachedUserImageNow,
      hasRecentGeneratedImage: Boolean(recentGeneratedVisualMsg)
    });
    const autoVisualDetected = isInlineImageMode || visualIntent.requested;

    // If inline image mode is active and user had auto-selection, ensure NEXUS 4 Flash (Hydrogen 4) is used by default
    if (isInlineImageMode && selectedModel === 'auto-selection') {
      actualModelChoice = 'nexus-4-flash';
    }

    // --- ADAPTIVE LEARNING, ZERO-KNOWLEDGE SECRET ENCRYPTION, ORBITS & 31-SKILL EVOLUTION ---
    const adaptiveResult = processUserInteractionLearningAndOrbits(
      finalInput,
      memoryBank,
      firebaseUser?.uid || 'nexus-sovereign-default'
    );

    // --- CONTINUOUS LEARNING FROM USER CORRECTIONS (تعلّم مستمر من تصحيحات المستخدم بالمحادثة) ---
    const lastModelMessage = [...(currentSession.messages || [])].reverse().find(m => m.role === 'model' && !m.isThinking);
    const correctionCheck = detectAndApplyUserCorrection(
      finalInput,
      lastModelMessage?.content || '',
      adaptiveResult.updatedMemoryBank,
      activeSessionId
    );

    const activeMemoryBank = correctionCheck.updatedMemoryBank;
    const autoCalibratedEffortB = isMaxEffortEnabled ? 100 : (adaptiveResult.autoEffortB || 85);
    setActiveEffortB(autoCalibratedEffortB);
    setMemoryBank(activeMemoryBank);
    saveMemoryBank(activeMemoryBank);

    // Detect external URLs for real-time Web Cortex extraction while thinking
    const urlMatchInInput = finalInput.match(/https?:\/\/[^\s"'<>]+/i);
    const needsRealtimeAgenticSandbox =
      activeMemoryBank.userPreferences?.enableOpenClawExternalWeb !== false &&
      Boolean(urlMatchInInput);

    // Build Live Tool Execution Telemetry for the real-time status bar above the chat capsule
    const currentToolsInFlight: string[] = [];
    if (isAgentModeEnabled) {
      currentToolsInFlight.push('وضع الوكيل السيادي (Sovereign Agent & Harness Mode)');
    }
    if (attachedNotebooks.length > 0) {
      const modeBadgeAr =
        resolvedNotebookUsageMode === 'strict_grounding'
          ? 'تأسيس صارم بالمصادر'
          : resolvedNotebookUsageMode === 'canvas_synthesis'
          ? 'توليد للكانفاس'
          : 'مدمج مع جيميني والويب ++';
      currentToolsInFlight.push(
        `موصل Google NotebookLM (${attachedNotebooks.map(n => n.title).join(' + ')} · ${modeBadgeAr})`
      );
    }
    if (isMaxEffortEnabled) currentToolsInFlight.push('أقصى جهد تفكير (توليد وتقييم المسارات الفرعية)');
    if (needsRealtimeAgenticSandbox) {
      currentToolsInFlight.push(
        urlMatchInInput
          ? 'الأذرع الوكيلية والتيرمنال الداخلي (استخلاص الموقع بالوقت الحقيقي)'
          : 'التيرمنال الداخلي + Google Python Sandbox (تنفيذ حي أثناء التفكير)'
      );
    }
    if (autoSearchDetected) currentToolsInFlight.push('بحث جوجل الحي (Google Search Grounding)');
    if (autoCanvasDetected) currentToolsInFlight.push('استوديو الكانفاس البرمجي والإنتاجي');
    if (autoVisualDetected) currentToolsInFlight.push(`توليد الصور (${inlineAspectRatio})`);
    if (userMsg.attachments && userMsg.attachments.length > 0) {
      currentToolsInFlight.push('معالجة الملفات وPDF عبر Google Workspace ومحرك RAG');
    }
    if (adaptiveResult.newEncryptedSecrets.length > 0) currentToolsInFlight.push('تشفير البيانات السرية');
    if (adaptiveResult.newLearnedInsight || correctionCheck.detectedCorrection) {
      currentToolsInFlight.push('تحديث الذاكرة الذكية والتصحيحات');
    }

    const routedModelObj =
      SOVEREIGN_MODELS.find(
        m =>
          m.id === actualModelChoice ||
          (actualModelChoice === 'nexus-4-pro' && m.id === 'nexus-4-neon') ||
          ((actualModelChoice === 'nexus-4-flash' || actualModelChoice === 'nexus-3.8-flash') && m.id === 'nexus-4-hydrogen')
      ) ||
      SOVEREIGN_MODELS.find(m => m.id === 'nexus-4-hydrogen')!;

    const barTools = currentToolsInFlight.length > 0 ? currentToolsInFlight : ['التحليل والاستنتاج الحسابي المباشر'];

    setLiveToolTelemetry({
      modelLabel: routedModelObj.labelAr,
      activeTools: barTools,
      activeSkills: [],
      status: 'running'
    });

    if (firebaseUser) {
      syncAdaptiveVaultAndOrbitsToFirestore(
        firebaseUser,
        activeMemoryBank,
        activeSessionId,
        adaptiveResult.newLearnedInsight,
        adaptiveResult.newEncryptedSecrets,
        activeMemoryBank.cognitiveOrbits,
        adaptiveResult.activatedSkillIds
      ).catch(err => console.warn('Adaptive vault cloud sync warning:', err));
    }

    const streamMsgId = Date.now().toString() + '-stream';
    attachedBackgroundJobsRef.current.add(streamMsgId);

    const initialStreamMsg: Message = {
      id: streamMsgId,
      role: 'model',
      content: '',
      thoughtProcess: '',
      isStreaming: true,
      isThinkingStreaming: true,
      timestamp: Date.now(),
      routedModel: actualModelChoice,
      usedTools: currentToolsInFlight,
      isMaxEffortMode: isMaxEffortEnabled
    };

    setSessions(prev => ({
      ...prev,
      [activeSessionId]: {
        ...prev[activeSessionId],
        messages: [...prev[activeSessionId].messages, initialStreamMsg],
        lastActiveAt: Date.now()
      }
    }));

    try {
      setStage(ProcessingStage.REALITY_PROJECTION);

      const nonEmptyHistory = cleanedPreviousMessages
        .filter(m => !m.isThinking && m.content && m.content.trim().length > 0);
      const history = nonEmptyHistory.map((m, idx) => {
        const isRecentModel =
          m.role !== 'user' && idx >= Math.max(0, nonEmptyHistory.length - 4);
        const thoughtDigest =
          isRecentModel && m.thoughtProcess && m.thoughtProcess.trim().length > 40
            ? m.thoughtProcess.trim().slice(-650)
            : undefined;
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
          ...(thoughtDigest ? { thoughtDigest } : {}),
          ...(m.generatedImage ? { generatedImage: true } : {})
        };
      });

      let relevantAxioms: any[] = [];
      try {
        relevantAxioms = await retrieveRelevantMemory(userMsg.content, activeMemoryBank);
      } catch (memErr) {
        console.warn('retrieveRelevantMemory notice:', memErr);
      }

      let baseContext = '';
      try {
        baseContext = buildGlobalContext(sessions, activeSessionId, relevantAxioms, activeMemoryBank);
      } catch (ctxErr) {
        console.warn('buildGlobalContext notice:', ctxErr);
      }

      // Run Real-Time Agentic Arms, Internal Terminal & Google Python Sandbox while thinking
      let realtimeAgenticContext = '';
      if (needsRealtimeAgenticSandbox) {
        try {
          const prethinkRes = await fetch('/api/agent-os/realtime-prethink', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: finalInput,
              enablePythonSandbox: true,
              enableWebCortex: true
            })
          });
          if (prethinkRes.ok) {
            const prethinkData = await prethinkRes.json();
            const resolvedBlock = prethinkData?.realtimeContext || prethinkData?.realtimeContextBlock;
            if (resolvedBlock) {
              realtimeAgenticContext = resolvedBlock;
            }
          }
        } catch (err) {
          console.warn('Real-time agentic prethink warning:', err);
        }
      }

      // Server already renders memoryBank.userPreferences cleanly in first-person without duplication;
      // only pass display name if no userPreferences object exists yet.
      const prefs = activeMemoryBank.userPreferences;
      const languageAndToneDirective =
        !prefs && userProfile?.name
          ? `\n- الاسم المفضل لرفيقي: "${userProfile.name}"`
          : '';

      // If the user pasted a Google Docs / Sheets / Drive / YouTube / Web URL directly in the chat message,
      // automatically extract its full text via /api/notebooklm/ingest so Nexus reads it completely
      let liveIngestedUrlBlock = '';
      if (urlMatchInInput && urlMatchInInput[0]) {
        try {
          const urlRes = await ingestUrlIntoNotebookSource(urlMatchInInput[0]);
          if (urlRes.ok && urlRes.source && urlRes.source.content) {
            liveIngestedUrlBlock = `\n\n[LIVE EXTRACTED DOCUMENT / URL CONTENT FROM "${urlRes.source.title}" (${urlRes.source.wordCount} words)]:\n${urlRes.source.content.slice(0, 60000)}\n`;
          }
        } catch {
          // ignore
        }
      }

      // Inject Connected Google NotebookLM RAG Context + Direct Uploaded PDF/File RAG Context (BM25 Semantic Chunk Retrieval + Citation Indexing)
      const directAttachmentRagSources: GeminiNotebookSource[] = (userMsg.attachments || [])
        .filter(att => Boolean(att.extractedRagText && att.extractedRagText.trim().length > 0))
        .map((att, idx) => ({
          id: `att-rag-${att.id}-${idx}`,
          title: `${att.name} (${att.detectedFormat || 'Google Workspace RAG'})`,
          content: att.extractedRagText!,
          sourceType: 'google_drive' as const,
          driveWebViewLink: att.driveWebViewLink,
          isEnabled: true,
          wordCount: att.ragWordCount || att.extractedRagText!.split(/\s+/).filter(Boolean).length,
          addedAt: Date.now()
        }));

      const effectiveRagNotebooks: GeminiNotebookItem[] =
        directAttachmentRagSources.length > 0
          ? [
              {
                id: 'nb-direct-upload-rag',
                title: 'ملفات Google Workspace المرفقة في الرسالة (RAG)',
                description: 'مصادر مستخلصة ومفهرسة مباشرة من ملفات PDF والمستندات المرفقة',
                themeColor: 'emerald',
                customDirective: 'اعتمد على المقاطع المسترجعة من الملفات المرفقة ووثّق الإجابة بالمراجع [1]، [2].',
                sources: directAttachmentRagSources,
                linkedSessionIds: [activeSessionId],
                isSyncedToCloud: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
              },
              ...attachedNotebooks
            ]
          : attachedNotebooks;

      let notebookRetrieval: { contextBlock: string } | null = null;
      if (effectiveRagNotebooks.length > 0) {
        try {
          notebookRetrieval = retrieveGroundedNotebookContext(
            effectiveRagNotebooks,
            finalInput,
            resolvedNotebookUsageMode
          );
        } catch (nbErr) {
          console.warn('retrieveGroundedNotebookContext notice:', nbErr);
        }
      }
      const activeNotebookContextBlock =
        (notebookRetrieval?.contextBlock || '') + liveIngestedUrlBlock;

      // Execute Google Workspace MCP Connector (Live Search & Read from Drive / Docs / Sheets) if requested in prompt
      let mcpWorkspacePre = { triggered: false, contextBlock: '' };
      try {
        mcpWorkspacePre = await executeMcpWorkspacePreContext(finalInput);
      } catch (mcpPreErr) {
        console.warn('executeMcpWorkspacePreContext notice:', mcpPreErr);
      }
      if (mcpWorkspacePre.triggered) {
        currentToolsInFlight.push('موصلات Google Workspace MCP (Drive / Docs / Sheets)');
        setLiveToolTelemetry(prev =>
          prev
            ? {
                ...prev,
                activeTools: Array.from(new Set([...prev.activeTools, 'موصلات Google Workspace MCP (Drive / Docs / Sheets)']))
              }
            : prev
        );
      }

      const activeAgentModeDirective = isAgentModeEnabled
        ? `\n[ACTIVE SOVEREIGN AGENT MODE (وضع الوكيل السيادي المفعّل بجانب أقصى جهد)]:
- وضع الوكيل السيادي مفعّل في هذه الجلسة:
  1) عند بناء مشروع برمجي أو تعديل ملفات أو إنشاء عمل كبير (سواء برمجياً أو موسوعياً أو روائياً أو بحثياً)، أشرع مباشرةً في هندسة العمل وتنفيذه وتوليد الملفات الكاملة الجاهزة للتشغيل أو التحميل (<nexus_canvas> و <nexus_file_artifact>).
  2) أستثمر التفكير الموازي وتنفيذ الأكواد والتحقق الذاتي لتقديم مخرجات متكاملة على أعلى مستوى هندسي وإبداعي.`
        : '';

      const globalMemoryContext = `${baseContext}${realtimeAgenticContext}${languageAndToneDirective}${activeNotebookContextBlock}${mcpWorkspacePre.contextBlock}${activeAgentModeDirective}`;

      const isDirectSingleStreamVisual =
        isInlineImageMode || (autoVisualDetected && !autoSearchDetected && !autoCanvasDetected);

      let response: {
        thoughtProcess: string;
        finalResponse: string;
        groundingMetadata?: any;
        toolCall?: any;
        usedTools?: string[];
        thinkingDuration?: number;
        kernelState?: any;
        generatedImage?: string;
        imagePrompt?: string;
        nanoVisualTelemetry?: any;
        recursiveLabEvaluation?: RecursiveLabEvaluation;
      } = {
        thoughtProcess: '',
        finalResponse: '',
        usedTools: currentToolsInFlight
      };

      let generatedImageBase64: string | undefined = undefined;
      let generatedImagePrompt: string | undefined = undefined;
      let generatedNanoTelemetry: any = undefined;

      if (isDirectSingleStreamVisual) {
        // --- SINGLE-CALL REAL-TIME MULTIMODAL STREAM (1 Prompt = 1 Unified Vision+Image Stream) ---
        setStage(ProcessingStage.PRISM_REFRACTION);
        const attachedUserImage = userMsg.attachments?.find(a => a.mimeType?.startsWith('image/') && a.data);
        const resolveFollowupEditImage = (): { data: string; mimeType: string } | undefined => {
          if (!visualIntent.isEditFollowup || !recentGeneratedVisualMsg?.generatedImage) return undefined;
          const rawUrl = recentGeneratedVisualMsg.generatedImage.startsWith('NEXUS_MULTI_MODEL_MIX|')
            ? recentGeneratedVisualMsg.generatedImage.split('|')[1] || ''
            : recentGeneratedVisualMsg.generatedImage;
          if (!rawUrl.startsWith('data:image')) return undefined;
          const commaIdx = rawUrl.indexOf(',');
          if (commaIdx === -1) return undefined;
          const header = rawUrl.slice(0, commaIdx);
          const mimeMatch = header.match(/data:([^;]+);base64/i);
          const b64 = rawUrl.slice(commaIdx + 1).trim();
          return b64 ? { data: b64, mimeType: mimeMatch?.[1] || 'image/png' } : undefined;
        };
        const inputImage =
          attachedUserImage && attachedUserImage.data
            ? { data: attachedUserImage.data, mimeType: attachedUserImage.mimeType }
            : resolveFollowupEditImage();

        try {
          const prismResult = await generateVisualArtifact(
            userMsg.content,
            inlineAspectRatio || '16:9',
            'none',
            globalMemoryContext,
            Boolean(isDeepManifestation || isMaxEffortEnabled),
            inputImage,
            (msg, type) => addLog(msg, type as any),
            state => {
              setManifestationState(state);
              setSessions(prev => {
                const currentSession = prev[activeSessionId];
                if (!currentSession) return prev;
                return {
                  ...prev,
                  [activeSessionId]: updateSessionMessageFastWithMap(currentSession, streamMsgId, m => ({
                    ...m,
                    thoughtProcess: state.liveThoughtProcess || m.thoughtProcess,
                    content: state.liveResponseText || m.content,
                    generatedImage:
                      state.imageData && !state.imageData.startsWith('data:image/svg+xml')
                        ? state.imageData
                        : m.generatedImage,
                    nanoVisualTelemetry: state.nanoVisualTelemetry || m.nanoVisualTelemetry,
                    isThinkingStreaming: state.phase !== 'Converged',
                    isStreaming: state.phase !== 'Converged',
                    thinkingDuration: state.thinkingDurationSec ?? m.thinkingDuration,
                    usedTools: currentToolsInFlight
                  }))
                };
              });
            },
            {
              selectedChatModel: actualModelChoice,
              resolution: '2K',
              isMaxEffortEnabled,
              sessionId: activeSessionId,
              sessionTitle,
              userMessage: userMsg,
              streamMsgId,
              usedTools: currentToolsInFlight,
              recentHistory: history.slice(-6),
              accountScope: getActiveAccountScope()
            }
          );

          if (prismResult.data && prismResult.data.trim().length > 0) {
            generatedImageBase64 = prismResult.data;
            generatedImagePrompt = prismResult.refinedPrompt;
          }
          generatedNanoTelemetry = prismResult.nanoVisualTelemetry;
          const visualEval = isMaxEffortEnabled
            ? enrichSubThinkingEvaluationFromLiveThoughts(
                buildBaselineSubThinkingEvaluation(
                  userMsg.content,
                  customSuccessCriteria,
                  currentToolsInFlight
                ),
                prismResult.thoughtProcess || '',
                prismResult.finalResponse || '',
                customSuccessCriteria
              )
            : undefined;
          response = {
            thoughtProcess: prismResult.thoughtProcess || '',
            finalResponse:
              prismResult.finalResponse ||
              (generatedImageBase64
                ? 'أتممتُ رسم هذا المشهد كما تصوّرناه:'
                : 'تعذر توليد الصورة عبر المحركات البصرية المتاحة في هذه اللحظة، يرجى المحاولة مرة أخرى.'),
            thinkingDuration: prismResult.thinkingDuration,
            recursiveLabEvaluation: visualEval,
            usedTools: [...currentToolsInFlight, 'توليد الصور']
          };
        } catch (prismError: any) {
          response = {
            thoughtProcess: '',
            finalResponse: prismError?.message || 'تعذر إتمام بناء الصورة في هذه اللحظة، يرجى المحاولة مرة أخرى.',
            usedTools: currentToolsInFlight
          };
        }
        setMemoryBank(prev => incrementTrust(prev));
      } else {
        response = await streamOmniResponse(
          {
            accountScope: getActiveAccountScope(),
            prompt: userMsg.content,
            history,
            attachments: userMsg.attachments,
            globalMemoryContext,
            isWebSearchEnabled: autoSearchDetected,
            isCanvasMode: autoCanvasDetected,
            selectedModel: actualModelChoice,
            memoryBank: activeMemoryBank,
            sessionId: activeSessionId,
            sessionTitle,
            userMessage: userMsg,
            streamMsgId,
            usedTools: currentToolsInFlight,
            inlineAspectRatio: inlineAspectRatio || '16:9',
            isDeepManifestation,
            isMaxEffortEnabled,
            isAgentModeEnabled,
            enableProFallback,
            customSuccessCriteria
          },
          chunk => {
            // If Nexus opened a <nexus_canvas> envelope for a vast work or user enabled Canvas mode, stream only the pure canvas body into Canvas live
            if (chunk.finalResponse) {
              const openTagMatch = chunk.finalResponse.match(/<nexus_canvas\b([^>]*)>/i);
              if (openTagMatch && openTagMatch.index !== undefined) {
                const attrs = openTagMatch[1] || '';
                const typeAttr = attrs.match(/type="([^"]*)"/i)?.[1]?.toLowerCase();
                const afterOpen = chunk.finalResponse.slice(openTagMatch.index + openTagMatch[0].length);
                const closeIdx = afterOpen.search(/<\/nexus_canvas>/i);
                const liveCanvasBody = (closeIdx !== -1 ? afterOpen.slice(0, closeIdx) : afterOpen).trim();
                const canvasType = typeAttr === 'code' ? 'code_project' : 'notebook_guide';
                if (liveCanvasBody.length > 20) {
                  setCanvasStudioInitialContent(liveCanvasBody);
                  setCanvasStudioInitialTab(canvasType);
                  setIsCanvasStudioOpen(true);
                  setIsSidebarOpen(false);
                }
              }
            }

            if ((chunk as any).manifestationState) {
              setManifestationState((chunk as any).manifestationState);
            }
            if (chunk.type === 'done') {
              setManifestationState(null);
            }

            setSessions(prev => {
              const currentSession = prev[activeSessionId];
              if (!currentSession) return prev;
              const mergedStreamTools = Array.from(
                new Set([...currentToolsInFlight, ...(chunk.usedTools || [])])
              );
              const msgs = currentSession.messages;
              const lastIdx = msgs.length - 1;
              const targetIdx =
                lastIdx >= 0 && msgs[lastIdx]?.id === streamMsgId
                  ? lastIdx
                  : msgs.findIndex(m => m.id === streamMsgId);
              if (targetIdx === -1) return prev;
              const m = msgs[targetIdx];
              const nextMsgs = msgs.slice();
              const safeChunkImage =
                chunk.generatedImage && !chunk.generatedImage.startsWith('data:image/svg+xml')
                  ? chunk.generatedImage
                  : undefined;
              nextMsgs[targetIdx] = {
                ...m,
                thoughtProcess: chunk.thoughtProcess || m.thoughtProcess,
                content: chunk.finalResponse,
                isThinkingStreaming: chunk.isThinkingPhase,
                isStreaming: chunk.type !== 'done',
                thinkingDuration: chunk.thinkingDuration ?? m.thinkingDuration,
                kernelState: chunk.kernelState ?? m.kernelState,
                groundingMetadata: chunk.groundingMetadata || m.groundingMetadata,
                generatedImage: safeChunkImage || m.generatedImage,
                imagePrompt: chunk.imagePrompt || m.imagePrompt,
                nanoVisualTelemetry: chunk.nanoVisualTelemetry || m.nanoVisualTelemetry,
                recursiveLabEvaluation: chunk.recursiveLabEvaluation || m.recursiveLabEvaluation,
                routedModel: chunk.routedModel || m.routedModel,
                isMaxEffortMode: isMaxEffortEnabled,
                usedTools: mergedStreamTools
              };
              return {
                ...prev,
                [activeSessionId]: {
                  ...currentSession,
                  messages: nextMsgs,
                  lastActiveAt: Date.now()
                }
              };
            });
          }
        );

        if (response.generatedImage) {
          generatedImageBase64 = response.generatedImage;
          generatedImagePrompt = response.imagePrompt;
          generatedNanoTelemetry = response.nanoVisualTelemetry;
        }

        // If Max Effort Mode evaluated sub-thinking paths, merge the winning path's core rule into MemoryBank automatically
        if (response.recursiveLabEvaluation) {
          setMemoryBank(prev => {
            const merged = mergeEvaluationIntoMemoryBank(
              incrementTrust(prev),
              response.recursiveLabEvaluation!,
              activeSessionId
            );
            saveMemoryBank(merged);
            if (firebaseUser) {
              syncAxiomsToFirestore(firebaseUser, merged.axioms, merged, activeSessionId).catch(() => {});
            }
            return merged;
          });
        } else {
          setMemoryBank(prev => incrementTrust(prev));
        }

        // Client-side safety net: check if response.finalResponse still contains an unparsed <nexus_visual_artifact prompt="..." />
        const inlineTagMatch = (response.finalResponse || '').match(
          /<?\s*(?:nexus_visual_artifact|generate_visual_artifact)\s+[^>]*?prompt\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*?(?:\/?>|<\/)?/i
        );
        if (inlineTagMatch) {
          response.finalResponse = (response.finalResponse || '')
            .replace(/<?\s*(?:nexus_visual_artifact|generate_visual_artifact)\b[^>]*?(?:\/>|>|<\/)/gi, '')
            .replace(/<?\s*(?:nexus_visual_artifact|generate_visual_artifact)\s+prompt\s*=\s*"[^"]+"[^\n]*/gi, '')
            .trim();
          if (!(response as any).toolCall) {
            (response as any).toolCall = {
              name: 'generate_visual_artifact',
              args: {
                prompt: (inlineTagMatch[1] || inlineTagMatch[2] || userMsg.content).trim(),
                aspect_ratio: inlineAspectRatio || '16:9',
                style: 'none'
              }
            };
          }
        }

        // If the general chat model decided to invoke generate_visual_artifact via toolCall (and wasn't already attempted on the server)
        const shouldGenerateImageNow =
          !generatedImageBase64 &&
          !(response as any).visualToolAttempted &&
          (response as any).toolCall &&
          (response as any).toolCall.name === 'generate_visual_artifact';

        if (shouldGenerateImageNow) {
          const toolArgs = ((response as any).toolCall && (response as any).toolCall.args) || {};
          const imagePrompt = toolArgs.prompt || userMsg.content;
          const aspect_ratio = toolArgs.aspect_ratio || inlineAspectRatio || '16:9';
          const style = toolArgs.style || 'none';
          const image_data = toolArgs.image_data;
          const image_mime_type = toolArgs.image_mime_type;

          setStage(ProcessingStage.PRISM_REFRACTION);
          const attachedUserImage = userMsg.attachments?.find(a => a.mimeType?.startsWith('image/') && a.data);
          const inputImage = image_data
            ? { data: image_data, mimeType: image_mime_type || 'image/png' }
            : attachedUserImage && attachedUserImage.data
            ? { data: attachedUserImage.data, mimeType: attachedUserImage.mimeType }
            : undefined;

          try {
            const prismResult = await generateVisualArtifact(
              imagePrompt,
              aspect_ratio,
              style,
              globalMemoryContext,
              isDeepManifestation,
              inputImage,
              (msg, type) => addLog(msg, type as any),
              state => {
                setManifestationState(state);
                setSessions(prev => {
                  const currentSession = prev[activeSessionId];
                  if (!currentSession) return prev;
                  return {
                    ...prev,
                    [activeSessionId]: updateSessionMessageFastWithMap(currentSession, streamMsgId, m => ({
                      ...m,
                      thoughtProcess: state.liveThoughtProcess || m.thoughtProcess,
                      generatedImage:
                        state.imageData && !state.imageData.startsWith('data:image/svg+xml')
                          ? state.imageData
                          : m.generatedImage,
                      nanoVisualTelemetry: state.nanoVisualTelemetry || m.nanoVisualTelemetry,
                      isThinkingStreaming: state.phase !== 'Converged',
                      isStreaming: state.phase !== 'Converged',
                      usedTools: Array.from(new Set([...(m.usedTools || []), 'توليد الصور']))
                    }))
                  };
                });
              },
              {
                selectedChatModel: actualModelChoice,
                resolution: '2K',
                sessionId: activeSessionId,
                sessionTitle,
                streamMsgId,
                usedTools: [...currentToolsInFlight, 'توليد الصور'],
                recentHistory: history.slice(-6),
                accountScope: getActiveAccountScope()
              }
            );
            if (prismResult.data && prismResult.data.trim().length > 0) {
              generatedImageBase64 = prismResult.data;
              generatedImagePrompt = prismResult.refinedPrompt;
              generatedNanoTelemetry = prismResult.nanoVisualTelemetry;
              if (!response.finalResponse?.trim() && prismResult.finalResponse) {
                response.finalResponse = prismResult.finalResponse;
              }
            }
          } catch {
            // Non-fatal visual tool notice
          }
        }
      }

      // Execute Google Workspace MCP Auto-Create/Export if the user asked to save/export to Docs, Sheets, or Drive
      let finalContentWithMcp = response.finalResponse;
      try {
        const mcpAutoCreated = await executeMcpWorkspaceAutoExportIfRequested(
          finalInput,
          response.finalResponse,
          sessionTitle
        );
        if (mcpAutoCreated) {
          currentToolsInFlight.push(`تنفيذ ذكي في Google ${mcpAutoCreated.service.toUpperCase()} (@${mcpAutoCreated.service})`);
          const svcStr = String(mcpAutoCreated.service);
          const serviceNameAr =
            svcStr === 'gmail'
              ? 'Gmail (بريد إلكتروني ذكي)'
              : svcStr === 'calendar'
              ? 'Google Calendar (موعد تقويم ذكي)'
              : svcStr === 'sheets'
              ? 'Google Sheets (جدول بيانات)'
              : svcStr === 'slides'
              ? 'Google Slides (عرض تقديمي)'
              : svcStr === 'docs'
              ? 'Google Docs (مستند نصي)'
              : 'Google Drive (ملف سحابي)';
          const baseClean = mcpAutoCreated.cleanedResponseText || response.finalResponse;
          const summaryMd =
            mcpAutoCreated.actionSummaryMarkdown ||
            `✅ **تم التنفيذ تلقائياً عبر إضافة Google الذكية (${serviceNameAr}):** [${mcpAutoCreated.name}](${mcpAutoCreated.webViewLink})`;
          finalContentWithMcp = `${baseClean}\n\n---\n${summaryMd}`;
          showSidebarNotification(
            `تم تنفيذ "${mcpAutoCreated.name}" عبر ${serviceNameAr} تلقائياً`,
            'success',
            mcpAutoCreated.webViewLink
          );
        }
      } catch (mcpErr) {
        console.warn('MCP auto-export notice:', mcpErr);
      }

      const finalUsedTools = Array.from(
        new Set([
          ...currentToolsInFlight,
          ...(response.usedTools || []),
          ...(generatedImageBase64 ? ['توليد الصور'] : []),
          ...(adaptiveResult.newEncryptedSecrets.length > 0 ? ['تشفير البيانات السرية'] : [])
        ])
      );

      const finalMsg: Message = {
        id: streamMsgId,
        role: 'model',
        content: finalContentWithMcp,
        thoughtProcess: response.thoughtProcess,
        thinkingDuration: response.thinkingDuration,
        kernelState: response.kernelState,
        isStreaming: false,
        isThinkingStreaming: false,
        timestamp: Date.now(),
        groundingMetadata: response.groundingMetadata,
        generatedImage: generatedImageBase64,
        imagePrompt: generatedImagePrompt,
        nanoVisualTelemetry: generatedNanoTelemetry,
        routedModel: (response as any).routedModel || actualModelChoice,
        usedTools: finalUsedTools,
        isMaxEffortMode: isMaxEffortEnabled,
        recursiveLabEvaluation: response.recursiveLabEvaluation
      };

      setSessions(prev => {
        const currentSession = prev[activeSessionId];
        if (!currentSession) return prev;
        return {
          ...prev,
          [activeSessionId]: updateSessionMessageFastWithMap(currentSession, streamMsgId, m => ({
            ...finalMsg,
            thoughtProcess: finalMsg.thoughtProcess || m.thoughtProcess,
            thinkingDuration: finalMsg.thinkingDuration ?? m.thinkingDuration
          }))
        };
      });

      setManifestationState(null);
      setStage(ProcessingStage.IDLE);

      // Only open the Split-Screen Canvas when the user explicitly enabled Canvas Mode OR when Nexus emitted a dedicated <nexus_canvas> envelope for a vast work
      const finalText = response.finalResponse || '';
      const openCanvasMatch = finalText.match(/<nexus_canvas(?:\s+title="([^"]*)")?(?:\s+type="([^"]*)")?\s*>/i);
      if (openCanvasMatch && openCanvasMatch.index !== undefined) {
        const afterOpen = finalText.slice(openCanvasMatch.index + openCanvasMatch[0].length);
        const closeIdx = afterOpen.search(/<\/nexus_canvas>/i);
        const extractedCanvasBody = (closeIdx !== -1 ? afterOpen.slice(0, closeIdx) : afterOpen).trim();
        const isCodeCanvas = openCanvasMatch[2]?.toLowerCase() === 'code' || extractedCanvasBody.includes('```');
        if (extractedCanvasBody) {
          setCanvasStudioInitialContent(extractedCanvasBody);
          setCanvasStudioInitialTab(isCodeCanvas ? 'code_project' : 'notebook_guide');
          setIsCanvasStudioOpen(true);
          setIsSidebarOpen(false);
        }
      } else if (isCanvasMode) {
        const hasCodeBlock = /```[a-zA-Z0-9_-]*\n[\s\S]{80,}```/.test(finalText);
        setCanvasStudioInitialContent(finalText);
        setCanvasStudioInitialTab(hasCodeBlock ? 'code_project' : 'notebook_guide');
        setIsCanvasStudioOpen(true);
        setIsSidebarOpen(false);
      }

      // Transition live tool telemetry to 'completed' with green circular checkmarks before fading out
      setLiveToolTelemetry(prev =>
        prev
          ? {
              ...prev,
              activeTools: finalUsedTools.length > 0 ? finalUsedTools : prev.activeTools,
              status: 'completed'
            }
          : null
      );
      setTimeout(() => {
        setLiveToolTelemetry(prev => (prev?.status === 'completed' ? null : prev));
      }, 4000);

      if (isAutoSpeakEnabled) {
        setTimeout(() => {
          handleGenerateAudio(response.finalResponse, finalMsg.id);
        }, 500);
      }

      if (isAutonomousMode && !overrideInput?.startsWith('[SOVEREIGN_INITIATIVE')) {
        setTimeout(async () => {
          if (stageRef.current === ProcessingStage.IDLE) {
            await handleSend(
              '[SOVEREIGN_INITIATIVE_AUTO: Continuous stream active. Deepen your previous response or transition dynamically to a pertinent realization.]'
            );
          }
        }, 3500);
      }

      // Continuous 100% Automatic Pale Archive, Live Corrections & Axiom Crystallization on every interaction
      setTimeout(async () => {
        try {
          const currentMessages = [...updatedMessages, finalMsg];
          const { axioms: newAxioms, soulPrintUpdate, newCorrections } = await crystallizeSession(
            currentMessages,
            activeSessionId
          );

          // Extract Pale Archive entities from BOTH user input and NEXUS response so user-named worlds/characters are never missed
          const combinedTurnText = `${userMsg.content || ''}\n\n${finalMsg.content || ''}`.trim();
          const paleData = await extractEntitiesAndRelations(combinedTurnText, selectedModel);

          setMemoryBank(prev => {
            const { merged: mergedAxioms, addedCount: addedAxiomsCount } = mergeAxiomsFastWithMap(
              prev.axioms,
              newAxioms
            );

            const entityMap = new Map(prev.paleArchive.entities.map(e => [e.id, e]));
            let addedEntities = 0;
            for (const ent of paleData.entities) {
              if (ent?.id && !entityMap.has(ent.id)) {
                entityMap.set(ent.id, ent);
                addedEntities++;
              }
            }

            const relMap = new Map(
              prev.paleArchive.relationships.map(r => [`${r.sourceId}-${r.targetId}-${r.relationType}`, r])
            );
            let addedRels = 0;
            for (const rel of paleData.relationships) {
              const key = `${rel.sourceId}-${rel.targetId}-${rel.relationType}`;
              if (!relMap.has(key)) {
                relMap.set(key, rel);
                addedRels++;
              }
            }

            const existingCorrections = prev.userCorrections || [];
            const corrRuleSet = new Set(existingCorrections.map(c => (c.userCorrectionRule || '').trim().toLowerCase()));
            const freshCorrections = (newCorrections || []).filter(
              c => c?.userCorrectionRule && !corrRuleSet.has(c.userCorrectionRule.trim().toLowerCase())
            );
            const mergedCorrections =
              freshCorrections.length > 0
                ? [...freshCorrections, ...existingCorrections].slice(0, 24)
                : existingCorrections;

            if (
              addedAxiomsCount === 0 &&
              addedEntities === 0 &&
              addedRels === 0 &&
              freshCorrections.length === 0 &&
              !soulPrintUpdate
            ) {
              return prev;
            }

            const currentTrust = typeof prev.soulPrint?.trustLevel === 'number' ? prev.soulPrint.trustLevel : 45;
            const nextTrustLevel =
              (userMsg.content || '').trim().length >= 25
                ? Math.min(96, currentTrust + 1)
                : currentTrust;

            const updatedBank = {
              ...prev,
              axioms: mergedAxioms,
              userCorrections: mergedCorrections,
              paleArchive: {
                ...prev.paleArchive,
                entities: addedEntities > 0 ? Array.from(entityMap.values()) : prev.paleArchive.entities,
                relationships: addedRels > 0 ? Array.from(relMap.values()) : prev.paleArchive.relationships
              },
              soulPrint: {
                ...prev.soulPrint,
                ...soulPrintUpdate,
                trustLevel: nextTrustLevel
              },
              lastUpdated: Date.now(),
              version: prev.version + 1
            };
            saveMemoryBank(updatedBank);
            if (firebaseUser) {
              syncAxiomsToFirestore(firebaseUser, updatedBank.axioms, updatedBank, activeSessionId).catch(
                () => {}
              );
            }
            return updatedBank;
          });
        } catch {
          // Ignore background crystallization errors
        }
      }, 600);
    } catch (sendErr: any) {
      console.error('NEXUS handleSend recovery catch:', sendErr);
      let recoveredResponseText = '';
      let recoveredThoughtText = '';
      let recoveredImageData: string | undefined = undefined;
      let recoveredImagePrompt: string | undefined = undefined;
      let recoveredNanoTelemetry: any = undefined;
      let recoveredUsedTools: string[] | undefined = undefined;
      try {
        const directFallback = await generateOmniResponse(
          userMsg.content,
          [],
          userMsg.attachments || [],
          '',
          autoSearchDetected,
          autoCanvasDetected,
          actualModelChoice,
          activeMemoryBank
        );
        if (directFallback?.finalResponse) {
          recoveredResponseText = directFallback.finalResponse;
          recoveredThoughtText = directFallback.thoughtProcess || '';
        }
        if ((directFallback as any)?.generatedImage) {
          recoveredImageData = (directFallback as any).generatedImage;
          recoveredImagePrompt = (directFallback as any).imagePrompt;
          recoveredNanoTelemetry = (directFallback as any).nanoVisualTelemetry;
          recoveredUsedTools = directFallback.usedTools;
        }
      } catch {
        // ignore fallback error
      }

      setManifestationState(null);
      setLiveToolTelemetry(null);
      setStage(ProcessingStage.IDLE);

      setSessions(prev => {
        const currentSession = prev[activeSessionId];
        if (!currentSession) return prev;
        return {
          ...prev,
          [activeSessionId]: updateSessionMessageFastWithMap(currentSession, streamMsgId, m => ({
            ...m,
            isStreaming: false,
            isThinkingStreaming: false,
            thoughtProcess: m.thoughtProcess || recoveredThoughtText,
            content:
              m.content ||
              recoveredResponseText ||
              'واجه الاتصال ضغطاً مؤقتاً في هذه اللحظة، يرجى إعادة إرسال رسالتك.',
            generatedImage: m.generatedImage || recoveredImageData,
            imagePrompt: m.imagePrompt || recoveredImagePrompt,
            nanoVisualTelemetry: m.nanoVisualTelemetry || recoveredNanoTelemetry,
            usedTools: recoveredUsedTools && recoveredUsedTools.length > 0 ? recoveredUsedTools : m.usedTools
          }))
        };
      });
    } finally {
      attachedBackgroundJobsRef.current.delete(streamMsgId);
    }
  };

  const isAnyFileLoading = selectedFiles.some(f => f.status === 'loading');

  return (
    <div className="flex h-[100dvh] w-full bg-black text-zinc-200 overflow-hidden font-arabic selection:bg-purple-500/30">
      
      <MindMapModal 
        isOpen={isMindMapOpen} 
        onClose={() => setIsMindMapOpen(false)} 
        thoughtContent={mindMapContent} 
      />

      <MemoryAuditorModal
        isOpen={showAuditorModal}
        onClose={() => setShowAuditorModal(false)}
        isAuditing={isAuditing}
        result={auditResult}
        onReAudit={handleAuditMemory}
      />
      
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        sessions={sessions}
      />

      <PrismManifestationModal
        isOpen={isPrismModalOpen}
        onClose={() => {
          setIsPrismModalOpen(false);
          setStudioInitialPrompt('');
          setStudioInitialEditImage(null);
        }}
        onShareToChat={handleSharePrismImage}
        selectedChatModel={selectedModel}
        initialPrompt={studioInitialPrompt}
        initialEditImage={studioInitialEditImage}
      />

      <NexusOntologicalLayersModal
        isOpen={isOntologicalLayersOpen}
        onClose={() => setIsOntologicalLayersOpen(false)}
      />

      <NexusOmegaObservatoryModal
        isOpen={isOmegaObservatoryOpen}
        onClose={() => setIsOmegaObservatoryOpen(false)}
        memoryBank={memoryBank}
        activeEffortB={activeEffortB}
        activeStrategicVariance={activeStrategicVariance}
        onUpdateEffortConfig={(b, variance) => {
          setActiveEffortB(b);
          setActiveStrategicVariance(variance);
          addLog(`NEXUS OMEGA: Recalibrated Effort Scalar b=${b} (${variance}) & Sinkhorn Matrix`, 'god_mode');
        }}
      />

      <AgentSuiteModal
        isOpen={isAgentSuiteOpen}
        onClose={() => setIsAgentSuiteOpen(false)}
        onExecuteAgentTask={(agentName, taskPrompt) => {
          setIsAgentSuiteOpen(false);
          handleSend(taskPrompt);
          addLog(`OPENCLAW × AGENT SUITE: Dispatched external web/agent output (${agentName}) to chat.`, 'god_mode');
        }}
      />

      <PolymathMatrixModal
        isOpen={isPolymathOpen}
        onClose={() => setIsPolymathOpen(false)}
      />

      <NexusForgeModal
        isOpen={isNexusForgeOpen}
        onClose={() => setIsNexusForgeOpen(false)}
      />

      <NexusScientificLabModal
        isOpen={isScientificLabOpen}
        onClose={() => setIsScientificLabOpen(false)}
        onOpenSubsystemModal={(target) => {
          setIsScientificLabOpen(false);
          if (target === 'agent_suite') setIsAgentSuiteOpen(true);
          else if (target === 'omega_observatory') setIsOmegaObservatoryOpen(true);
          else if (target === 'nexus_forge') setIsNexusForgeOpen(true);
          else if (target === 'polymath') setIsPolymathOpen(true);
          else if (target === 'pale_archive') setIsPaleArchiveOpen(true);
        }}
        onInjectToChat={(text) => {
          setInput((prev) => (prev ? `${prev}\n\n${text}` : text));
          addLog(`SCIENTIFIC LAB: Injected capsule experiment output into active prompt.`, 'core');
        }}
      />

      <PaleArchiveModal
        isOpen={isPaleArchiveOpen}
        onClose={() => setIsPaleArchiveOpen(false)}
        archive={memoryBank.paleArchive}
        memoryBank={memoryBank}
        onAddAxiom={(content, category) => {
          const newAx = {
            id: Math.random().toString(36).substring(2, 9),
            content,
            category,
            sourceSessionId: activeSessionId || 'manual-vault',
            createdAt: Date.now()
          };
          setMemoryBank((prev) => {
            const updated = {
              ...prev,
              axioms: [...prev.axioms, newAx],
              lastUpdated: Date.now(),
              version: prev.version + 1
            };
            saveMemoryBank(updated);
            if (firebaseUser) {
              syncAxiomsToFirestore(firebaseUser, updated.axioms, updated, activeSessionId).catch((err) =>
                console.error("Axiom cloud sync failed:", err)
              );
            }
            return updated;
          });
          addLog(`PALE ARCHIVE [OBSIDIAN × OS]: Crystallized new Vault node (${category}).`, 'success');
        }}
        onMergeFolderIntoMemory={(payload) => {
          setMemoryBank((prev) => {
            const newAxioms = (payload.axioms || []).map((ax) => ({
              id: Math.random().toString(36).substring(2, 9),
              content: ax.content,
              category: ax.category,
              sourceSessionId: `folder-import-${payload.folderName}`,
              createdAt: Date.now()
            }));

            const existingEntities = prev.paleArchive?.entities || [];
            const newEntities = (payload.entities || []).map((ent) => ({
              id: Math.random().toString(36).substring(2, 9),
              name: ent.name,
              type: ent.type as any,
              description: ent.description,
              attributes: Array.isArray((ent as any).attributes) ? (ent as any).attributes : [],
              firstMentionedSessionId: `folder-import-${payload.folderName}`,
              lastUpdated: Date.now()
            }));

            const existingRelations = prev.paleArchive?.relationships || [];
            const newRelations = (payload.relationships || []).map((rel: any) => ({
              id: Math.random().toString(36).substring(2, 9),
              sourceId: rel.sourceId || rel.sourceName || '',
              targetId: rel.targetId || rel.targetName || '',
              relationType: rel.relationType || rel.type || 'related',
              type: rel.relationType || rel.type || 'related',
              description: rel.description || '',
              strength: 8
            }));

            const existingInsights = prev.learnedInsights || [];
            const newInsights = (payload.learnedInsights || []).map((ins: any) => ({
              id: Math.random().toString(36).substring(2, 9),
              topic: ins.category || 'general',
              category: ins.category,
              summaryAr: ins.summaryAr || ins.insightText || '',
              learnedRule: ins.summaryAr || ins.insightText || '',
              sanitizedMessageExcerpt: `مجلد مستورد: ${payload.folderName}`,
              encryptedRefsCount: 0,
              qualityImpactScore: Math.round((ins.confidence || 0.92) * 100),
              orbitId: 'orbit-general',
              linkedSkillIds: [],
              confidence: ins.confidence || 0.92,
              learnedAt: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              sourceExcerpt: `مجلد مستورد: ${payload.folderName}`
            }));

            const updated: MemoryBank = {
              ...prev,
              axioms: [...prev.axioms, ...newAxioms],
              paleArchive: {
                ...(prev.paleArchive || { entities: [], relationships: [], worldRules: [] }),
                entities: [...existingEntities, ...newEntities],
                relationships: [...existingRelations, ...newRelations]
              },
              learnedInsights: [...newInsights, ...existingInsights],
              lastUpdated: Date.now(),
              version: (prev.version || 1) + 1
            };

            saveMemoryBank(updated);
            if (firebaseUser) {
              syncAxiomsToFirestore(firebaseUser, updated.axioms, updated, activeSessionId).catch((err) =>
                console.error('Folder Memory Matrix cloud sync warning:', err)
              );
            }
            return updated;
          });
          addLog(
            `MEMORY MATRIX FOLDER INGESTION: Merged folder "${payload.folderName}" into Core Memory Matrix.`,
            'god_mode'
          );
        }}
        onInjectToChat={(text) => {
          setInput((prev) => (prev ? `${prev}\n\n${text}` : text));
          addLog(`PALE ARCHIVE [OBSIDIAN × OS]: Injected Vault node into active prompt.`, 'core');
        }}
      />

      <SovereignSettingsDatabaseModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        memoryBank={memoryBank}
        onUpdateMemoryBank={(updater) => {
          setMemoryBank((prev) => {
            const next = updater(prev);
            saveMemoryBank(next);
            if (firebaseUser) {
              syncAdaptiveVaultAndOrbitsToFirestore(
                firebaseUser,
                next,
                activeSessionId,
                next.learnedInsights?.[0] || null,
                next.encryptedVault?.slice(0, 3) || [],
                next.cognitiveOrbits,
                Object.keys(next.skillEvolutions || {}).slice(0, 6)
              ).catch((err) => console.warn("Settings DB sync warning:", err));
            }
            return next;
          });
        }}
        userEmail={userProfile?.email || firebaseUser?.email}
        isCloudConnected={Boolean(userProfile || firebaseUser || syncStatus.isSynced)}
        onSyncCloudNow={() => handleCloudPull()}
        onOpenAccountModal={() => {
          setAccountModalStep('auth');
          setAuthTabMode('login');
          setIsAccountModalOpen(true);
        }}
        onInjectToChat={(text) => {
          setInput((prev) => (prev ? `${prev}\n\n${text}` : text));
        }}
        selectedModel={selectedModel}
        onSelectModel={(modelId) => setSelectedModel(modelId)}
        isWebSearchEnabled={isWebSearchEnabled}
        onToggleWebSearch={() => setIsWebSearchEnabled(prev => !prev)}
        isCanvasMode={isCanvasMode}
        onToggleCanvasMode={() => setIsCanvasMode(prev => !prev)}
        isAutoSpeakEnabled={isAutoSpeakEnabled}
        onToggleAutoSpeak={() => setIsAutoSpeakEnabled(prev => !prev)}
        onExportData={handleExportLocal}
        onImportData={handleImportLocalClick}
        onClearData={handleClearMemory}
        onOpenAgentSuite={() => setIsAgentSuiteOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenScientificLab={() => setIsScientificLabOpen(true)}
        onOpenRecursiveLab={() => setIsRecursiveLabOpen(true)}
        onOpenOmegaObservatory={() => setIsOmegaObservatoryOpen(true)}
        onOpenNexusForge={() => setIsNexusForgeOpen(true)}
        onOpenPolymathMatrix={() => setIsPolymathOpen(true)}
        onOpenOntologicalLayers={() => setIsOntologicalLayersOpen(true)}
      />

      <RecursiveImprovementLabModal
        isOpen={isRecursiveLabOpen && isSiteOwnerOrAdmin}
        onClose={() => setIsRecursiveLabOpen(false)}
        memoryBank={memoryBank}
        onUpdateMemoryBank={updater => {
          setMemoryBank(prev => {
            const next = updater(prev);
            saveMemoryBank(next);
            if (firebaseUser) {
              syncAxiomsToFirestore(firebaseUser, next.axioms, next, activeSessionId).catch(() => {});
            }
            return next;
          });
        }}
        isMaxEffortEnabled={isMaxEffortEnabled}
        onToggleMaxEffort={() => setIsMaxEffortEnabled(prev => !prev)}
        customSuccessCriteria={customSuccessCriteria}
        onUpdateSuccessCriteria={criteria => {
          setCustomSuccessCriteria(criteria);
          setMemoryBank(prev => {
            const next = {
              ...prev,
              defaultSuccessCriteria: criteria,
              lastUpdated: Date.now(),
              version: prev.version + 1
            };
            saveMemoryBank(next);
            return next;
          });
        }}
        selectedModel={selectedModel}
        activeSessionId={activeSessionId}
        onInjectWinningPathToChat={(taskPrompt, evaluation) => {
          setIsMaxEffortEnabled(true);
          handleSend(taskPrompt);
          addLog(`RECURSIVE LAB: Executed winning sub-thinking path (${evaluation.winningPathId}) in chat.`, 'god_mode');
        }}
      />

      <GeminiNotebookHubModal
        isOpen={isNotebookHubOpen}
        onClose={() => setIsNotebookHubOpen(false)}
        initialMode={notebookHubMode}
        notebooks={memoryBank.geminiNotebooks || []}
        activeNotebookId={memoryBank.activeNotebookId}
        activeNotebookIds={
          activeSessionId && sessions[activeSessionId]?.attachedNotebookIds !== undefined
            ? sessions[activeSessionId].attachedNotebookIds!
            : memoryBank.activeNotebookIds !== undefined
            ? memoryBank.activeNotebookIds
            : memoryBank.activeNotebookId
            ? [memoryBank.activeNotebookId]
            : []
        }
        notebookUsageMode={
          (activeSessionId && sessions[activeSessionId]?.notebookUsageMode) ||
          memoryBank.notebookUsageMode ||
          'hybrid_web_plus'
        }
        onChangeNotebookUsageMode={(mode) => {
          setMemoryBank((prev) => {
            const next: MemoryBank = {
              ...prev,
              notebookUsageMode: mode,
              lastUpdated: Date.now()
            };
            saveMemoryBank(next);
            return next;
          });
          if (activeSessionId && sessions[activeSessionId]) {
            setSessions((prev) => {
              const updated: SessionsMap = {
                ...prev,
                [activeSessionId]: {
                  ...prev[activeSessionId],
                  notebookUsageMode: mode
                }
              };
              saveLocalSessions(updated);
              return updated;
            });
          }
        }}
        userEmail={userProfile?.email || firebaseUser?.email}
        isPermanentSyncEnabled={Boolean(memoryBank.isNotebookPermanentSyncEnabled)}
        onTogglePermanentSync={(enabled) => {
          setMemoryBank((prev) => {
            const next: MemoryBank = {
              ...prev,
              isNotebookPermanentSyncEnabled: enabled,
              lastUpdated: Date.now(),
              version: prev.version + 1
            };
            saveMemoryBank(next);
            if (firebaseUser) {
              syncAxiomsToFirestore(firebaseUser, next.axioms, next, activeSessionId).catch(() => {});
            }
            return next;
          });
        }}
        onUpdateNotebooks={(nextNotebooks, nextActiveId, nextActiveIds) => {
          const resolvedIds =
            nextActiveIds !== undefined
              ? nextActiveIds
              : nextActiveId
              ? [nextActiveId]
              : [];
          setMemoryBank((prev) => {
            const next: MemoryBank = {
              ...prev,
              geminiNotebooks: nextNotebooks,
              activeNotebookId: nextActiveId,
              activeNotebookIds: resolvedIds,
              lastUpdated: Date.now(),
              version: prev.version + 1
            };
            saveMemoryBank(next);
            if (firebaseUser) {
              syncAxiomsToFirestore(firebaseUser, next.axioms, next, activeSessionId).catch(() => {});
            }
            return next;
          });
          if (activeSessionId && sessions[activeSessionId]) {
            setSessions((prev) => {
              const updated: SessionsMap = {
                ...prev,
                [activeSessionId]: {
                  ...prev[activeSessionId],
                  notebookId: nextActiveId,
                  attachedNotebookIds: resolvedIds
                }
              };
              saveLocalSessions(updated);
              return updated;
            });
          }
        }}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onStartNewChatInNotebook={(notebook) => {
          const newSession = createNewSession(`دفتر: ${notebook.title}`);
          const sessionWithNotebook: Session = {
            ...newSession,
            notebookId: notebook.id,
            attachedNotebookIds: [notebook.id],
            notebookUsageMode: 'hybrid_web_plus'
          };
          setSessions((prev) => {
            const next = { ...prev, [sessionWithNotebook.id]: sessionWithNotebook };
            saveLocalSessions(next);
            return next;
          });
          setActiveSessionId(sessionWithNotebook.id);
          setMemoryBank((prev) => {
            const notebooksList = (prev.geminiNotebooks && prev.geminiNotebooks.length > 0
              ? prev.geminiNotebooks
              : [notebook]
            ).map((nb) =>
              nb.id === notebook.id && !nb.linkedSessionIds.includes(sessionWithNotebook.id)
                ? { ...nb, linkedSessionIds: [sessionWithNotebook.id, ...nb.linkedSessionIds], updatedAt: Date.now() }
                : nb
            );
            const updated: MemoryBank = {
              ...prev,
              geminiNotebooks: notebooksList,
              activeNotebookId: notebook.id,
              activeNotebookIds: [notebook.id],
              lastUpdated: Date.now(),
              version: prev.version + 1
            };
            saveMemoryBank(updated);
            return updated;
          });
          addLog(`GEMINI NOTEBOOK: Connected notebook "${notebook.title}" to new conversation.`, 'god_mode');
        }}
        onSelectExistingSession={(sessionId, notebookId) => {
          setActiveSessionId(sessionId);
          if (notebookId) {
            setMemoryBank((prev) => {
              const updated = {
                ...prev,
                activeNotebookId: notebookId,
                activeNotebookIds: [notebookId],
                lastUpdated: Date.now()
              };
              saveMemoryBank(updated);
              return updated;
            });
          }
        }}
        onLinkSessionToNotebook={(sessionId, notebookId) => {
          setSessions((prev) => {
            const target = prev[sessionId];
            if (!target) return prev;
            const next = {
              ...prev,
              [sessionId]: {
                ...target,
                notebookId,
                attachedNotebookIds: notebookId ? [notebookId] : []
              }
            };
            saveLocalSessions(next);
            return next;
          });
          addLog(`GEMINI NOTEBOOK: Linked conversation [${sessionId}] to Notebook [${notebookId}].`, 'success');
        }}
        onAttachToChatInput={(payload) => {
          try {
            const utf8Bytes = new TextEncoder().encode(payload.content);
            let binary = '';
            for (let i = 0; i < utf8Bytes.length; i++) {
              binary += String.fromCharCode(utf8Bytes[i]);
            }
            const base64Data = btoa(binary);
            const newAttachment: Attachment = {
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: payload.name.endsWith('.txt') || payload.name.endsWith('.md') ? payload.name : `${payload.name}.txt`,
              mimeType: 'text/plain',
              status: 'complete',
              progress: 100,
              data: base64Data
            };
            setSelectedFiles((prev) => [...prev, newAttachment]);
          } catch {
            setInput((prev) => (prev ? `${prev}\n\n${payload.content}` : payload.content));
          }
          if (payload.notebookId) {
            setMemoryBank((prev) => {
              const currentIds = prev.activeNotebookIds || [];
              const nextIds = currentIds.includes(payload.notebookId!)
                ? currentIds
                : [...currentIds, payload.notebookId!];
              const updated = {
                ...prev,
                activeNotebookId: payload.notebookId,
                activeNotebookIds: nextIds,
                lastUpdated: Date.now()
              };
              saveMemoryBank(updated);
              return updated;
            });
          }
          addLog(`ATTACHMENT GATEWAY: Attached [${payload.name}] (${payload.sourceLabel}) to active chat.`, 'success');
        }}
        onOpenNotebookInStudio={(notebook: GeminiNotebookItem) => {
          const combinedSources = [
            `# دفتر Google NotebookLM المتصل: ${notebook.title}`,
            notebook.description ? `الوصف: ${notebook.description}` : '',
            notebook.customDirective ? `التوجيه المخصص: ${notebook.customDirective}` : '',
            ...notebook.sources.map((s, idx) => `## المصدر ${idx + 1}: ${s.title} (${s.sourceType})\n${s.content}`)
          ]
            .filter(Boolean)
            .join('\n\n');
          setCanvasStudioInitialContent(combinedSources);
          setIsCanvasStudioOpen(true);
        }}
        onSendPromptWithNotebooks={(promptText, attachedIds, usageMode) => {
          handleSend(promptText, attachedIds, usageMode);
        }}
      />

      <AdminImportBoxModal
        isOpen={isImportBoxOpen}
        onClose={() => setIsImportBoxOpen(false)}
        onAttachToChat={(payload) => {
          try {
            const utf8Bytes = new TextEncoder().encode(payload.content);
            let binary = '';
            for (let i = 0; i < utf8Bytes.length; i++) {
              binary += String.fromCharCode(utf8Bytes[i]);
            }
            const base64Data = btoa(binary);
            const newAttachment: Attachment = {
              id: `imp-att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: payload.name,
              mimeType: 'text/plain',
              status: 'complete',
              progress: 100,
              data: base64Data,
              extractedRagText: payload.content
            };
            setSelectedFiles((prev) => [...prev, newAttachment]);
          } catch {
            setInput((prev) => (prev ? `${prev}\n\n${payload.content}` : payload.content));
          }
          addLog(`IMPORT BOX: Attached [${payload.name}] to active chat.`, 'success');
        }}
        onOpenInCanvas={(title, content) => {
          setCanvasStudioInitialContent(`# ${title}\n\n${content}`);
          setCanvasStudioInitialTab('notebook_guide');
          setIsCanvasStudioOpen(true);
          setIsSidebarOpen(false);
        }}
        onIngestIntoMemoryMatrix={async (folderName, files) => {
          const resp = await fetch('/api/agent-os/ingest-folder-memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderName, files })
          });
          const data = await resp.json();
          if (data.success) {
            setMemoryBank((prev) => {
              const incomingAxioms = (data.axioms || []).map((a: any, idx: number) => ({
                id: `imp-ax-${Date.now()}-${idx}`,
                content: a.content,
                category: a.category || 'world_building',
                confidence: 0.96,
                sourceSessionId: activeSessionId || 'import_box',
                createdAt: Date.now()
              }));
              const { merged } = mergeAxiomsFastWithMap(prev.axioms, incomingAxioms);
              const nextBank: MemoryBank = {
                ...prev,
                axioms: merged,
                paleArchive: {
                  ...prev.paleArchive,
                  entities: [...prev.paleArchive.entities, ...(data.entities || [])],
                  relationships: [...prev.paleArchive.relationships, ...(data.relationships || [])]
                },
                lastUpdated: Date.now(),
                version: prev.version + 1
              };
              saveMemoryBank(nextBank);
              return nextBank;
            });
          }
        }}
      />

      {/* Dedicated Google Workspace Connected Apps & Cloud Browser Modal */}
      <GoogleServicesConnectModal
        isOpen={isGoogleServicesModalOpen}
        onClose={() => setIsGoogleServicesModalOpen(false)}
        userProfile={userProfile}
        userEmail={userProfile?.email || firebaseUser?.email}
        onConnectGoogleAccount={async (customEmail) => {
          await handleUniversalFirebaseAccountLogin(
            customEmail || userProfile?.email || PRIMARY_SECURITY_ADMIN_EMAIL
          );
        }}
        onDisconnectGoogleAccount={handleSignOut}
        onAttachFileToChat={async (payload) => {
          try {
            let extractedText = payload.content || '';
            let detectedFormat = payload.name.split('.').pop()?.toUpperCase() || 'FILE';

            if (payload.dataUrl && payload.dataUrl.startsWith('data:')) {
              const parts = payload.dataUrl.split(',');
              const headerMime = parts[0]?.match(/data:([^;]+);/)?.[1];
              const base64Data = parts[1] || '';
              if (!extractedText) {
                const ragRes = await extractFileViaWorkspaceRagEngine(
                  payload.name,
                  payload.mimeType || headerMime || 'image/png',
                  base64Data
                );
                extractedText = ragRes.extractedText;
                detectedFormat = ragRes.detectedFormat || detectedFormat;
              }
              const words = extractedText.split(/\s+/).filter(Boolean).length;
              if (extractedText) {
                indexExtractedSourceIntoActiveRagNotebook({
                  id: `src-gws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  title: payload.name,
                  content: extractedText,
                  sourceType: 'google_drive',
                  isEnabled: true,
                  wordCount: words,
                  addedAt: Date.now()
                });
              }
              const newAttachment: Attachment = {
                id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: payload.name,
                mimeType: payload.mimeType || headerMime || 'image/png',
                status: 'complete',
                progress: 100,
                data: base64Data,
                extractedRagText: extractedText,
                detectedFormat,
                ragWordCount: words,
                ragChunksCount: Math.max(1, Math.ceil(words / 310)),
                isRagIndexed: true
              };
              setSelectedFiles((prev) => [...prev, newAttachment]);
            } else {
              const utf8Bytes = new TextEncoder().encode(extractedText);
              let binary = '';
              for (let i = 0; i < utf8Bytes.length; i++) {
                binary += String.fromCharCode(utf8Bytes[i]);
              }
              const base64Data = btoa(binary);
              const words = extractedText.split(/\s+/).filter(Boolean).length;
              if (extractedText) {
                indexExtractedSourceIntoActiveRagNotebook({
                  id: `src-gws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  title: payload.name,
                  content: extractedText,
                  sourceType: 'google_drive',
                  isEnabled: true,
                  wordCount: words,
                  addedAt: Date.now()
                });
              }
              const newAttachment: Attachment = {
                id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: payload.name,
                mimeType: payload.mimeType || 'text/plain',
                status: 'complete',
                progress: 100,
                data: base64Data,
                extractedRagText: extractedText,
                detectedFormat,
                ragWordCount: words,
                ragChunksCount: Math.max(1, Math.ceil(words / 310)),
                isRagIndexed: true
              };
              setSelectedFiles((prev) => [...prev, newAttachment]);
            }

            if (payload.autoPrompt) {
              setTimeout(() => {
                handleSend(payload.autoPrompt);
              }, 120);
            }
          } catch {
            setInput((prev) => (prev ? `${prev}\n\n${payload.content}` : payload.content));
          }
          addLog(`GOOGLE WORKSPACE RAG: Attached & indexed [${payload.name}] (${payload.sourceLabel}) in active chat.`, 'success');
        }}
      />

      {/* Unified Firebase Cloud Account Sign-Up / Sign-In, Saved Accounts Switcher & Personalization Modal */}
      {isAccountModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-arabic"
        >
          <div className="w-full max-w-md bg-[#0a0b10] border border-zinc-800 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Cloud size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {accountModalStep === 'auth'
                      ? 'حساب نيكسوس السحابي عبر Firebase'
                      : 'تخصيص هويتك في نيكسوس'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {accountModalStep === 'auth'
                      ? 'متاح لجميع المستخدمين مع عزل كامل لمحادثات وذاكرة كل حساب على حدة'
                      : 'ساعد نيكسوس على معرفتك لتخصيص أسلوب الحوار والاستنتاج'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <X size={16} />
              </button>
            </div>

            {accountModalStep === 'auth' ? (
              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Saved Accounts Quick Switcher (Account-Isolated Storage) */}
                {savedAccountsList.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400">
                        الحسابات المحفوظة (اضغط للتبديل الفوري مع عزل المحادثات)
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {savedAccountsList.length} حساب
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                      {savedAccountsList.map(acc => {
                        const isCurrent =
                          userProfile?.email?.toLowerCase() === acc.email.toLowerCase();
                        return (
                          <div
                            key={acc.scopeId}
                            onClick={() => handleSwitchSavedAccount(acc)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                              isCurrent
                                ? 'bg-emerald-950/30 border-emerald-500/50'
                                : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={acc.picture}
                                alt={acc.name}
                                className="w-7 h-7 rounded-full border border-emerald-500/40 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white truncate">
                                    {acc.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                                      نشط الآن
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono truncate">
                                  {acc.email}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={e => handleRemoveSavedAccount(acc.scopeId, e)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition shrink-0"
                              title="إزالة الحساب من القائمة السريعة"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tabs: Sign Up vs Log In */}
                <div className="grid grid-cols-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAuthTabMode('signup')}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      authTabMode === 'signup'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    حساب جديد (Firebase)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTabMode('login')}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      authTabMode === 'login'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    تسجيل الدخول لحسابك
                  </button>
                </div>

                <form onSubmit={handleUnifiedEmailAccountSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      البريد الإلكتروني للحساب (معزول التخزين والمحادثات)
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmailInput}
                      onChange={e => setAuthEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      الاسم الشخصي أو اللقب (اختياري)
                    </label>
                    <input
                      type="text"
                      value={onboardingNameInput}
                      onChange={e => setOnboardingNameInput(e.target.value)}
                      placeholder="اسمك في نيكسوس..."
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      كلمة المرور / رمز الحماية (اختياري)
                    </label>
                    <input
                      type="password"
                      value={authPasswordInput}
                      onChange={e => setAuthPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={syncStatus.isSyncing}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    {syncStatus.isSyncing && <RefreshCw size={13} className="animate-spin" />}
                    <span>
                      {authTabMode === 'signup'
                        ? 'إنشاء وربط الحساب عبر Firebase'
                        : 'تسجيل الدخول واسترجاع محادثات الحساب'}
                    </span>
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-zinc-800" />
                  <span className="flex-shrink mx-3 text-[11px] text-zinc-500">
                    أو عبر نافذة مصادقة Firebase
                  </span>
                  <div className="flex-grow border-t border-zinc-800" />
                </div>

                <button
                  type="button"
                  onClick={() => handleCloudConnect(true, true)}
                  disabled={syncStatus.isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-bold flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer"
                >
                  {syncStatus.isSyncing ? (
                    <RefreshCw size={15} className="animate-spin text-emerald-400" />
                  ) : (
                    <Cloud size={15} className="text-emerald-400" />
                  )}
                  <span>المصادقة المباشرة عبر Firebase Auth</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveOnboardingPersonalization} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-200">
                    بماذا تحب أن يناديك نيكسوس؟
                  </label>
                  <input
                    type="text"
                    value={onboardingNameInput}
                    onChange={e => setOnboardingNameInput(e.target.value)}
                    placeholder="اكتب اسمك أو لقبك المفضل..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-200">
                      نبذة قصيرة عنك أو اهتماماتك
                    </label>
                    <span className="text-[10px] text-zinc-500">اختياري</span>
                  </div>
                  <textarea
                    rows={3}
                    value={onboardingBioInput}
                    onChange={e => setOnboardingBioInput(e.target.value)}
                    placeholder="مثال: مهندس برمجيات وباحث في الذكاء الاصطناعي، أفضل الإجابات الدقيقة والمباشرة..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-zinc-500">
                    يستخدم نيكسوس هذه المعلومات لتخصيص أسلوبه وعمق إجاباته بما يناسب شخصيتك ومجالك، وتُحفظ حصرياً داخل حسابك الحالي.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAccountModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition"
                  >
                    تخطي الآن
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    حفظ وتخصيص نيكسوس
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input for Image-Specific Attachment Option */}
      <input
        type="file"
        multiple
        accept="image/*"
        ref={imageUploadInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Hidden File Input for Imports */}
      <input 
        type="file" 
        ref={importInputRef} 
        onChange={handleImportLocalFile} 
        accept=".json,application/json,text/json,text/plain,.txt,.md" 
        className="hidden" 
      />

      {/* --- ENTERPRISE SIDEBAR (Fully Collapsible on Desktop & Mobile) --- */}
      <div
        className={`
          fixed inset-y-0 right-0 md:static bg-[#07080c] flex flex-col z-40 transition-all duration-300 ease-out shrink-0
          ${
            isSidebarOpen
              ? 'w-80 border-l border-zinc-800/75 translate-x-0'
              : 'w-0 border-l-0 translate-x-full md:translate-x-0 overflow-hidden pointer-events-none opacity-0 md:opacity-0'
          }
        `}
      >
        {/* 1. Brand Header, Hide Sidebar Toggle & New Conversation CTA */}
        <div className="p-3.5 border-b border-zinc-800/70 bg-gradient-to-b from-zinc-900/40 to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Hexagon size={19} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-sm tracking-tight text-white">نيكسوس</h1>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-400">
                    WORKSPACE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">منصة الذكاء الاستدلالي والإنتاجي</p>
              </div>
            </div>

            {/* Hide / Collapse Sidebar Button (Works on Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-emerald-300 transition shrink-0 cursor-pointer"
              title="إخفاء الشريط الجانبي لتوسيع مساحة العمل"
            >
              <PanelRightClose size={15} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <button 
              onClick={handleCreateSession}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm group cursor-pointer"
            >
              <Plus size={15} className="group-hover:rotate-90 transition-transform" />
              <span>محادثة جديدة</span>
            </button>
            <a
              href="/api/nexus/export-clean-project-zip"
              download="Nexus_Sovereign_Clean_Distributable.zip"
              className="px-2.5 py-2.5 bg-zinc-900 hover:bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="تحميل المشروع كملف .ZIP نظيف للمشاركة (بدون أي محادثات أو ملفات شخصية أو تخزين سحابي)"
            >
              <Download size={13} />
              <span>ZIP نظيف</span>
            </a>
          </div>
        </div>

        {/* 2. Primary Workspace Portals: Gallery + Memory + Canvas Studio + Notebooks */}
        <div className="px-3 pt-3 pb-2 border-b border-zinc-800/60 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-800/90 bg-zinc-900/45 hover:bg-zinc-900 hover:border-purple-500/40 transition-all text-right group cursor-pointer"
              title="معرض الصور والأعمال البصرية"
            >
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                <ImageIcon size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100 truncate">معرض الصور</div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {Object.values(sessions).reduce((acc, s) => acc + s.messages.filter(m => Boolean(m.generatedImage)).length, 0)} صورة
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsPaleArchiveOpen(true)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-800/90 bg-zinc-900/45 hover:bg-zinc-900 hover:border-amber-500/40 transition-all text-right group cursor-pointer"
              title="الذاكرة والأرشيف المعرفي"
            >
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <Gem size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100 truncate">الذاكرة والأرشيف</div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {(memoryBank.axioms || []).length} قاعدة معرفية
                </div>
              </div>
            </button>
          </div>

          {/* Sovereign Canvas IDE & Multi-Modal Productivity Studio */}
          <button
            onClick={() => {
              setIsCanvasStudioOpen(true);
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/90 bg-zinc-900/45 hover:bg-zinc-900 hover:border-emerald-500/45 transition-all text-right group cursor-pointer"
            title="استوديو الكانفاس البرمجي والإنتاجي المتكامل"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                <PenTool size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100 truncate">استوديو الكانفاس</div>
                <div className="text-[10px] text-zinc-500 truncate">
                  مستندات منسقة · مشاريع برمجية · اختبارات ومخططات
                </div>
              </div>
            </div>
          </button>

          {/* Nexus Notebooks Hub */}
          <button
            onClick={() => {
              setNotebookHubMode('notebooks');
              setIsNotebookHubOpen(true);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/90 bg-zinc-900/45 hover:bg-zinc-900 hover:border-indigo-500/45 transition-all text-right group cursor-pointer"
            title="الدفاتر المعرفية وتنظيم المصادر والمحادثات"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0">
                <BookOpen size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-100 truncate">الدفاتر المعرفية</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[9px] font-mono shrink-0">
                    {(memoryBank.geminiNotebooks || []).length || 1}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  تخصيص الدفاتر وربط المصادر والمحادثات
                </div>
              </div>
            </div>
          </button>

          {/* Admin & Sovereign Labs Hub (Visible to Site Owner / Admin) */}
          {isSiteOwnerOrAdmin && (
            <div className="pt-1.5 border-t border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Crown size={11} />
                  <span>مختبرات المشرف السيادية</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ADMIN
                </span>
              </div>

              {/* 1. Nexus Comprehensive Scientific Lab (7 Capsules, KHORA-01, Collider, Skill Tree) */}
              <button
                onClick={() => setIsScientificLabOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/35 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500/60 transition-all text-right cursor-pointer"
                title="المختبر العلمي الشامل — الكبسولات الـ 7 ومصادم الكبسولات والحقل المغمور KHORA-01"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <FlaskConical size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-emerald-200 truncate">المختبر العلمي الشامل</div>
                    <div className="text-[10px] text-emerald-400/80 truncate">
                      الكبسولات الـ 7 · الحقل المغمور · شجرة المهارات
                    </div>
                  </div>
                </div>
              </button>

              {/* 2. Recursive Self-Improvement & Sub-Thought Lab */}
              <button
                onClick={() => setIsRecursiveLabOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/15 hover:bg-amber-950/35 hover:border-amber-500/55 transition-all text-right cursor-pointer"
                title="مختبر التطوير الذاتي والتجارب التطورية"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <GitBranch size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-200 truncate">مختبر التطوير الذاتي</div>
                    <div className="text-[10px] text-amber-400/80 truncate">
                      مسارات التفكير الفرعية وتجارب النواة
                    </div>
                  </div>
                </div>
              </button>

              {/* 3. Quick Grid for Core Sovereign Systems (Omega, Forge, Agents, Polymath, Layers, Auditor) */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  onClick={() => setIsOmegaObservatoryOpen(true)}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900 hover:border-purple-500/45 transition-all text-right cursor-pointer"
                  title="مرصد نيكسوس أوميغا ومصفوفة Sinkhorn"
                >
                  <Orbit size={13} className="text-purple-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">مرصد أوميغا</span>
                </button>

                <button
                  onClick={() => setIsNexusForgeOpen(true)}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900 hover:border-cyan-500/45 transition-all text-right cursor-pointer"
                  title="مصنع نيكسوس البرمجي Nexus Forge X"
                >
                  <Cpu size={13} className="text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">مصنع نيكسوس</span>
                </button>

                <button
                  onClick={() => setIsAgentSuiteOpen(true)}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900 hover:border-sky-500/45 transition-all text-right cursor-pointer"
                  title="منظومة الأذرع الوكيلية المدمجة"
                >
                  <Globe size={13} className="text-sky-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">الأذرع الوكيلية</span>
                </button>

                <button
                  onClick={() => setIsPolymathOpen(true)}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/45 transition-all text-right cursor-pointer"
                  title="مصفوفة العقل الموسوعي والـ 56 مهارة سيادية"
                >
                  <Hexagon size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">الـ 56 مهارة</span>
                </button>

                <button
                  onClick={() => setIsOntologicalLayersOpen(true)}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900 hover:border-indigo-500/45 transition-all text-right cursor-pointer"
                  title="منظومات التفكير الأربع، العناقيد الـ 7، الطبقات الـ 3، وجوانب نيكسوس المعمارية"
                >
                  <Box size={13} className="text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">طبقات وجوانب نيكسوس</span>
                </button>

                <button
                  onClick={() => {
                    setShowAuditorModal(true);
                    handleAuditMemory();
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900 hover:border-rose-500/45 transition-all text-right cursor-pointer"
                  title="مدقق مصفوفة الذاكرة العميقة"
                >
                  <Shield size={13} className="text-rose-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-200 truncate">مدقق الذاكرة</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Toast Banner (Pin Limit / Export Confirmations) */}
        {sidebarToast && (
          <div
            className={`mx-3 mt-2 p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
              sidebarToast.type === 'warn'
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                : sidebarToast.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : 'bg-sky-950/50 border-sky-500/40 text-sky-200'
            }`}
          >
            <div className="min-w-0 flex-1">
              <span>{sidebarToast.text}</span>
              {sidebarToast.url && (
                <a
                  href={sidebarToast.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold mr-1.5 inline-block"
                >
                  فتح في Google ↗
                </a>
              )}
            </div>
            <button onClick={() => setSidebarToast(null)} className="text-zinc-400 hover:text-white shrink-0">
              <X size={12} />
            </button>
          </div>
        )}

        {/* 3. Thread Search Input */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="relative flex items-center">
            <Search size={13} className="absolute right-3 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={threadSearchQuery}
              onChange={(e) => setThreadSearchQuery(e.target.value)}
              placeholder="بحث في سجلات المحادثات..."
              className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 rounded-xl pr-8 pl-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
            />
            {threadSearchQuery && (
              <button
                onClick={() => setThreadSearchQuery('')}
                className="absolute left-2.5 text-zinc-500 hover:text-zinc-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* 4. Sessions List (Pinned Max 8 First + 3-Dots Action Menu — Only displays conversations after first message is sent) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
          {(() => {
            const visibleHistorySessions = (Object.values(sessions) as Session[]).filter(
              s => (s.messages && s.messages.length > 0) || Boolean(s.isPinned)
            );
            const pinnedCount = visibleHistorySessions.filter(s => Boolean(s.isPinned)).length;
            return (
              <div className="flex items-center justify-between px-1 pb-1 text-[10px] text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <History size={11} />
                  <span>سجل المحادثات</span>
                  {pinnedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono">
                      مثبتة {pinnedCount}/{MAX_PINNED_SESSIONS}
                    </span>
                  )}
                </span>
                <span className="font-mono">{visibleHistorySessions.length}</span>
              </div>
            );
          })()}

          {(Object.values(sessions) as Session[])
            .filter(s => (s.messages && s.messages.length > 0) || Boolean(s.isPinned))
            .filter(s => !threadSearchQuery.trim() || s.title.toLowerCase().includes(threadSearchQuery.toLowerCase()))
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              if (a.isPinned && b.isPinned) {
                return (b.pinnedAt || b.lastActiveAt) - (a.pinnedAt || a.lastActiveAt);
              }
              return b.lastActiveAt - a.lastActiveAt;
            })
            .map(session => {
              const isMenuOpen = sessionMenuOpenId === session.id;
              const isExportSubOpen = sessionExportSubmenuId === session.id;
              const isRenaming = renamingSessionId === session.id;
              const displayTitle = (session.title || '').replace(/^محادثة جديدة\s*#\d+$/i, 'محادثة جديدة');

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isRenaming) {
                      userSelectedSessionRef.current = session.id;
                      activeSessionIdRef.current = session.id;
                      setActiveSessionId(session.id);
                      setSessionMenuOpenId(null);
                      setSessionExportSubmenuId(null);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }
                  }}
                  className={`
                    group relative px-2.5 py-2 rounded-xl border cursor-pointer transition-all
                    ${
                      activeSessionId === session.id
                        ? 'bg-zinc-900/95 border-emerald-500/40 shadow-sm'
                        : session.isPinned
                        ? 'bg-amber-950/10 border-amber-500/20 hover:bg-zinc-900/60'
                        : 'bg-transparent border-transparent hover:bg-zinc-900/45 hover:border-zinc-800/80'
                    }
                  `}
                >
                  {isRenaming ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleSaveRenameSession(session.id, e);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={renameTitleInput}
                        onChange={e => setRenameTitleInput(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-emerald-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none min-w-0"
                        placeholder="اسم المحادثة الجديد..."
                      />
                      <button
                        type="submit"
                        className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shrink-0"
                        title="حفظ الاسم"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setRenamingSessionId(null);
                        }}
                        className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white shrink-0"
                        title="إلغاء"
                      >
                        <X size={12} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center gap-1.5">
                      <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                        {session.isPinned ? (
                          <Pin size={12} className="text-amber-400 shrink-0 fill-amber-400/30" />
                        ) : (
                          <MessageSquare
                            size={13}
                            className={
                              activeSessionId === session.id ? 'text-emerald-400 shrink-0' : 'text-zinc-600 shrink-0'
                            }
                          />
                        )}
                        <span
                          className={`text-xs truncate ${
                            activeSessionId === session.id ? 'text-white font-semibold' : 'text-zinc-300'
                          }`}
                        >
                          {displayTitle}
                        </span>
                      </div>

                      {/* 3-Dots Action Button (Pin max 8, Rename, 7-Format Download + Google Drive, Delete) */}
                      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSessionMenuOpenId(prev => (prev === session.id ? null : session.id));
                            setSessionExportSubmenuId(null);
                          }}
                          className={`p-1 rounded-lg transition cursor-pointer ${
                            isMenuOpen
                              ? 'bg-zinc-800 text-white opacity-100'
                              : 'opacity-70 group-hover:opacity-100 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                          title="خيارات المحادثة (تثبيت، إعادة تسمية، تنزيل وتصدير، حذف)"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute left-0 top-full mt-1 w-60 bg-[#0b0d14] border border-zinc-800 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.9)] p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            {/* 1. Pin / Unpin (Max 8) */}
                            <button
                              type="button"
                              onClick={e => handleTogglePinSession(session.id, e)}
                              className="w-full px-2.5 py-2 rounded-xl hover:bg-zinc-900 text-right flex items-center justify-between text-xs text-zinc-200 hover:text-amber-300 transition cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Pin size={13} className="text-amber-400" />
                                <span>{session.isPinned ? 'إلغاء تثبيت المحادثة' : 'تثبيت المحادثة بالأعلى'}</span>
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {(Object.values(sessions) as Session[]).filter(s => Boolean(s.isPinned)).length}/{MAX_PINNED_SESSIONS}
                              </span>
                            </button>

                            {/* 2. Rename Conversation */}
                            <button
                              type="button"
                              onClick={e => handleStartRenameSession(session, e)}
                              className="w-full px-2.5 py-2 rounded-xl hover:bg-zinc-900 text-right flex items-center gap-2 text-xs text-zinc-200 hover:text-emerald-300 transition cursor-pointer"
                            >
                              <Edit2 size={13} className="text-emerald-400" />
                              <span>إعادة تسمية المحادثة</span>
                            </button>

                            {/* 3. Download / Export (Opens 7 Formats + Direct Google Drive/Docs Submenu) */}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setSessionExportSubmenuId(prev => (prev === session.id ? null : session.id));
                              }}
                              className={`w-full px-2.5 py-2 rounded-xl hover:bg-zinc-900 text-right flex items-center justify-between text-xs transition cursor-pointer ${
                                isExportSubOpen ? 'bg-zinc-900 text-sky-300 font-bold' : 'text-zinc-200 hover:text-sky-300'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Download size={13} className="text-sky-400" />
                                <span>تنزيل أو تصدير المحادثة</span>
                              </span>
                              <ChevronDown
                                size={12}
                                className={`transition-transform ${isExportSubOpen ? 'rotate-180 text-sky-400' : 'text-zinc-500'}`}
                              />
                            </button>

                            {isExportSubOpen && (() => {
                              const sessionHasTable = session.messages.some(
                                m => !m.isThinking && hasMarkdownOrCsvTable(m.content || '')
                              );
                              const sessionHasCode = session.messages.some(
                                m => !m.isThinking && hasCodeBlocksOrProjectFiles(m.content || '')
                              );
                              const localFormats = [
                                { id: 'pdf', label: 'PDF وثيقة' },
                                { id: 'doc', label: 'Word (.doc)' },
                                { id: 'txt', label: 'نص (.txt)' },
                                { id: 'md', label: 'Markdown (.md)' },
                                ...(sessionHasTable ? [{ id: 'csv', label: 'جدول (.csv)' }] : []),
                                { id: 'html', label: 'ويب (.html)' },
                                { id: 'json', label: 'مشروع (.json)' }
                              ];
                              return (
                                <div className="p-2 rounded-xl bg-zinc-950/95 border border-zinc-800/90 space-y-2">
                                  <div className="text-[10px] font-bold text-zinc-400">
                                    تنزيل حسب نوع المحتوى:
                                  </div>
                                  <div className="grid grid-cols-2 gap-1">
                                    {localFormats.map(fmt => (
                                      <button
                                        key={fmt.id}
                                        type="button"
                                        onClick={e => handleExportSessionByFormat(session, fmt.id as any, e)}
                                        className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-200 hover:text-emerald-300 text-right font-mono transition cursor-pointer"
                                      >
                                        {fmt.label}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="pt-1.5 border-t border-zinc-800/80 space-y-1">
                                    <div className="text-[10px] font-bold text-sky-400">
                                      تصدير سحابي ذكي حسب المحتوى:
                                    </div>
                                    {/* Messages & Text -> Google Docs */}
                                    <button
                                      type="button"
                                      onClick={e => handleExportSessionByFormat(session, 'gdocs', e)}
                                      className="w-full px-2 py-1.5 rounded-lg bg-sky-950/35 hover:bg-sky-950/60 border border-sky-500/35 text-[10px] text-sky-200 flex items-center justify-between transition cursor-pointer"
                                    >
                                      <span>الرسائل والنصوص إلى Google Docs</span>
                                      <FileIcon size={11} className="text-sky-400" />
                                    </button>

                                    {/* Tables ONLY -> Google Sheets */}
                                    {sessionHasTable && (
                                      <button
                                        type="button"
                                        onClick={e => handleExportSessionByFormat(session, 'gsheets', e)}
                                        className="w-full px-2 py-1.5 rounded-lg bg-emerald-950/35 hover:bg-emerald-950/60 border border-emerald-500/35 text-[10px] text-emerald-200 flex items-center justify-between transition cursor-pointer"
                                      >
                                        <span>تصدير الجداول إلى Google Sheets</span>
                                        <Database size={11} className="text-emerald-400" />
                                      </button>
                                    )}

                                    {/* Files, Projects & Archives -> Google Drive */}
                                    <button
                                      type="button"
                                      onClick={e => handleExportSessionByFormat(session, 'gdrive', e)}
                                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-200 flex items-center justify-between transition cursor-pointer"
                                    >
                                      <span>
                                        {sessionHasCode
                                          ? 'تصدير الملفات والمشروع إلى Drive'
                                          : 'حفظ كملف أرشيف في Google Drive'}
                                      </span>
                                      <Cloud size={11} className="text-amber-400" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="border-t border-zinc-800/80 my-1" />

                            {/* 4. Delete Conversation */}
                            <button
                              type="button"
                              onClick={e => handleDeleteSession(session.id, e)}
                              className="w-full px-2.5 py-2 rounded-xl hover:bg-red-950/40 text-right flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>حذف المحادثة</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-0.5 pr-5 text-[10px] text-zinc-600 font-mono flex justify-between items-center">
                    <span>{new Date(session.lastActiveAt).toLocaleDateString()}</span>
                    <span>{session.messages.filter(m => !m.isThinking).length} رسالة</span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* 5. Clean Unified Account & Single Settings Entry Footer */}
        <div className="p-3 border-t border-zinc-800/70 bg-[#050608] space-y-2">
          {userProfile ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div
                onClick={() => {
                  setOnboardingNameInput(memoryBank.userPreferences?.userDisplayName || userProfile.name || '');
                  setOnboardingBioInput(memoryBank.userPreferences?.userBioOrRole || '');
                  setAccountModalStep('onboarding');
                  setIsAccountModalOpen(true);
                }}
                className="flex items-center gap-2 min-w-0 cursor-pointer group"
                title="اضغط لتعديل اسمك والنبذة التعريفية الخاصة بك"
              >
                <img
                  src={userProfile.picture}
                  alt={userProfile.name}
                  className="w-7 h-7 rounded-full border border-emerald-400/50 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold text-white group-hover:text-emerald-300 truncate transition-colors">
                      {memoryBank.userPreferences?.userDisplayName || userProfile.name}
                    </p>
                    {isSiteOwnerOrAdmin && (
                      <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-bold shrink-0">
                        مشرف
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-emerald-400 truncate font-mono">
                    {userProfile.email === 'user@nexus.workspace' ? PRIMARY_SECURITY_ADMIN_EMAIL : userProfile.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setAccountModalStep('auth');
                    setAuthTabMode('login');
                    setIsAccountModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition cursor-pointer"
                  title="تبديل الحساب"
                >
                  <UserIcon size={11} />
                </button>
                <button
                  onClick={() => handleCloudPull()}
                  disabled={syncStatus.isSyncing}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 transition cursor-pointer"
                  title="مزامنة Firebase"
                >
                  <RefreshCw size={11} className={syncStatus.isSyncing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 transition cursor-pointer"
                  title="تسجيل الخروج وعزل المحادثات"
                >
                  <LogOut size={11} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAccountModalStep('auth');
                setAuthTabMode('signup');
                setIsAccountModalOpen(true);
              }}
              className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserIcon size={14} className="text-emerald-400" />
              <span>إنشاء حساب / تسجيل الدخول</span>
            </button>
          )}

          {/* Single Unified Settings Button (Not Scattered) */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-between transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings size={13} className="text-zinc-400" />
              <span>الإعدادات والتخصيص</span>
            </span>
            <span className="text-[10px] text-zinc-500">المظهر · الصوت · الخصوصية</span>
          </button>
        </div>
      </div>

      {/* --- MAIN WORKSPACE & CHAT AREA (min-w-0 prevents Canvas horizontal clipping) --- */}
      <div className="flex-1 flex flex-col relative bg-[#040507] min-w-0 overflow-hidden">
        {/* Ultra-Clean Top Header with Persistent Sidebar Toggle on Desktop & Mobile */}
        <header className="h-13 flex items-center justify-between px-3 md:px-6 border-b border-zinc-900/80 bg-[#06070a]/90 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Persistent Sidebar Toggle Button (Works on both Desktop & Mobile even when a conversation or Canvas is open) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs cursor-pointer shrink-0 ${
                isSidebarOpen
                  ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                  : 'bg-emerald-950/40 hover:bg-emerald-950/70 border-emerald-500/40 text-emerald-300 font-bold'
              }`}
              title={isSidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي والمحادثات'}
            >
              {isSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              {!isSidebarOpen && <span className="hidden sm:inline text-[11px]">القائمة الجانبية</span>}
            </button>

            <div className={`
              px-2.5 py-1 rounded-full border text-[11px] flex items-center gap-1.5 shrink-0
              ${stage !== ProcessingStage.IDLE 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 animate-pulse' 
                : 'bg-zinc-900/70 border-zinc-800 text-zinc-400'}
            `}>
              <span className={`w-1.5 h-1.5 rounded-full ${stage !== ProcessingStage.IDLE ? 'bg-emerald-400' : 'bg-emerald-500/80'}`}></span>
              <span>{stage === ProcessingStage.IDLE ? 'جاهز' : 'يفكر ويعالج الآن...'}</span>
            </div>
            {activeSessionId &&
              sessions[activeSessionId] &&
              sessions[activeSessionId].messages.length > 0 && (
                <span className="text-xs text-zinc-200 font-semibold truncate max-w-[180px] sm:max-w-[260px]">
                  {sessions[activeSessionId].title.replace(/^محادثة جديدة\s*#\d+$/i, 'محادثة جديدة')}
                </span>
              )}
            {(() => {
              const currentSess = activeSessionId ? sessions[activeSessionId] : undefined;
              const linkedNbId = currentSess?.notebookId || memoryBank.activeNotebookId;
              const linkedNb = linkedNbId
                ? (memoryBank.geminiNotebooks || []).find(nb => nb.id === linkedNbId)
                : undefined;
              if (!linkedNb) return null;
              return (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/35 border border-indigo-500/40 text-indigo-200 text-[11px]">
                  <BookOpen size={12} className="text-indigo-400 shrink-0" />
                  <button
                    onClick={() => {
                      setNotebookHubMode('notebooks');
                      setIsNotebookHubOpen(true);
                    }}
                    className="font-bold truncate max-w-[160px] hover:underline"
                    title="هذه المحادثة متصلة بالدفتر المعرفي — اضغط لإدارة الدفتر ومصادره"
                  >
                    دفتر: {linkedNb.title}
                  </button>
                  <button
                    onClick={() => {
                      setMemoryBank(prev => {
                        const next = { ...prev, activeNotebookId: undefined };
                        saveMemoryBank(next);
                        return next;
                      });
                      if (currentSess?.notebookId) {
                        setSessions(prev => ({
                          ...prev,
                          [activeSessionId]: { ...prev[activeSessionId], notebookId: undefined }
                        }));
                      }
                    }}
                    className="p-0.5 hover:bg-indigo-500/20 rounded text-indigo-300/70 hover:text-indigo-200"
                    title="إلغاء ربط المحادثة الحالية بالدفتر"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Right Header Area: Clean Project ZIP Export + Sovereign Import Box + Quick Split-Screen Canvas Toggle + Account CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/api/nexus/export-clean-project-zip"
              download="Nexus_Sovereign_Clean_Distributable.zip"
              className="px-3 py-1.5 rounded-xl bg-emerald-950/55 hover:bg-emerald-900/75 border border-emerald-500/45 text-emerald-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="تحميل المشروع بالكامل كملف .ZIP نظيف للمشاركة — خالٍ تماماً من المحادثات والملفات المستوردة والتخزين السحابي"
            >
              <Download size={13} className="text-emerald-400" />
              <span className="hidden sm:inline">تحميل المشروع نظيفاً (.ZIP)</span>
              <span className="sm:hidden">ZIP نظيف</span>
            </a>

            <button
              type="button"
              onClick={() => setIsImportBoxOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-950/45 hover:bg-amber-950/75 border border-amber-500/45 text-amber-200 hover:text-amber-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="فتح صندوق الاستيراد السيادي (مساحة الفراغ لرمي الملفات المضغوطة .ZIP والملفات العادية بأي حجم)"
            >
              <Upload size={13} className="text-amber-400" />
              <span>صندوق الاستيراد</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const bestCanvas = extractBestCanvasPayloadFromSession(sessions[activeSessionId]);
                if (
                  bestCanvas &&
                  (!canvasStudioInitialContent ||
                    canvasStudioInitialContent.trim().length < 1200 ||
                    canvasStudioInitialContent.includes('سأقوم الآن بالآتي'))
                ) {
                  setCanvasStudioInitialContent(bestCanvas.canvasBody);
                  setCanvasStudioInitialTab(bestCanvas.tabType);
                  if (bestCanvas.generatedImage) {
                    setCanvasStudioInitialImage(bestCanvas.generatedImage);
                  }
                }
                setIsCanvasStudioOpen(prev => {
                  const next = !prev;
                  if (next) setIsSidebarOpen(false);
                  return next;
                });
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isCanvasStudioOpen
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-emerald-300'
              }`}
              title="فتح أو إغلاق مساحة الكانفاس المنقسمة بجانب المحادثة"
            >
              <PenTool size={13} className="text-emerald-400" />
              <span>الكانفاس</span>
            </button>
            {!userProfile ? (
              <button
                type="button"
                onClick={() => {
                  setAccountModalStep('auth');
                  setAuthTabMode('signup');
                  setIsAccountModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <UserIcon size={13} />
                <span>إنشاء حساب / تسجيل دخول</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOnboardingNameInput(memoryBank.userPreferences?.userDisplayName || userProfile.name || '');
                  setOnboardingBioInput(memoryBank.userPreferences?.userBioOrRole || '');
                  setAccountModalStep('onboarding');
                  setIsAccountModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-2 transition cursor-pointer"
                title="تخصيص اسمك ونبذتك الشخصية في نيكسوس"
              >
                <img
                  src={userProfile.picture}
                  alt={userProfile.name}
                  className="w-5 h-5 rounded-full border border-emerald-500/40 object-cover"
                />
                <span className="font-medium truncate max-w-[130px]">
                  {memoryBank.userPreferences?.userDisplayName || userProfile.name}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area (Chat + Side-by-Side Split-Screen Canvas Workspace) */}
        <div className="flex-1 flex overflow-hidden z-10 min-w-0">
          {/* Chat Area */}
          <div className={`flex-1 flex flex-col relative min-w-0 ${isCanvasStudioOpen ? 'hidden md:flex' : ' flex w-full'}`}>
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 scrollbar-hide">
              <div className={`max-w-4xl mx-auto pb-12 w-full ${memoryBank.userPreferences?.uiDensity === 'compact' ? 'space-y-3' : 'space-y-5'}`}>
                {(!activeSessionId || sessions[activeSessionId]?.messages.length === 0) ? (
                  <div className="min-h-[56vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-500 px-4">
                    <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-2xl bg-emerald-950/35 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                      <Hexagon size={28} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight font-arabic">
                      {memoryBank.userPreferences?.userDisplayName
                        ? `مرحباً بك يا ${memoryBank.userPreferences.userDisplayName}`
                        : 'مرحباً بك في نيكسوس'}
                    </h2>
                    <p className="text-zinc-400 max-w-xl leading-relaxed text-xs md:text-sm mb-7">
                      منصة موحدة للاستدلال العميق، استوديو الكانفاس البرمجي والإنتاجي، الدفاتر المعرفية، وتوليد وتخصيص المشاهد البصرية.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full text-right">
                      {[
                        {
                          title: 'استوديو الكانفاس والمشاريع البرمجية الحية',
                          desc: 'بناء وتشغيل مشاريع متعددة الملفات، مخططات بيانية، وعروض تفاعلية',
                          prompt: 'ساعدني في تخطيط وبناء تطبيق ويب متكامل بأفضل الممارسات الهندسية.'
                        },
                        {
                          title: 'تحليل الروابط والبيانات بالوقت الفعلي',
                          desc: 'استخلاص وتحليل بيانات أي رابط أو تنفيذ حسابات برمجية أثناء التفكير',
                          prompt: 'قم بتحليل بنية ومحتوى الرابط https://news.ycombinator.com ولخص أهم المواضيع التقنية مع تنفيذ تحليل إحصائي لها.'
                        },
                        {
                          title: 'بحث شبكي حي وموثق بالمصادر',
                          desc: 'رصد أحدث التطورات والأخبار التقنية والعلمية في الوقت الفعلي',
                          prompt: 'ابحث في الويب عن أحدث التطورات التقنية هذا الأسبوع ولخصها مع المصادر.'
                        },
                        {
                          title: 'تصميم وتخصيص المشاهد البصرية والأجواء',
                          desc: 'إنشاء صور عالية الدقة وتعديل أجزاء محددة منها وتغيير أجوائها بالكانفاس',
                          prompt: 'ارسم مشهداً سينمائياً لمدينة مستقبلية محاطة بالطبيعة والإضاءة الدافئة.'
                        }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(item.prompt)}
                          className="p-3.5 rounded-2xl bg-zinc-900/55 hover:bg-zinc-900 border border-zinc-800/90 hover:border-emerald-500/40 transition-all text-right group cursor-pointer"
                        >
                          <div className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors mb-1">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 leading-relaxed">
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  sessions[activeSessionId]?.messages
                    .filter(msg => !msg.isThinking)
                    .map((msg) => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      onEdit={msg.role === 'user' ? handleEditMessage : undefined} 
                      onViewMindMap={msg.role === 'model' ? handleOpenMindMap : undefined}
                      onPlayAudio={msg.role === 'model' && !msg.isThinking ? handlePlayMessageAudio : undefined}
                      isPlaying={isPlaying && audioSourceRef.current !== null}
                      keepThinkingExpanded={memoryBank.userPreferences?.keepThinkingExpanded ?? false}
                      fontSize={memoryBank.userPreferences?.fontSize || 'medium'}
                      onRegenerateImage={msg.role === 'model' ? handleRegenerateImageInChat : undefined}
                      onOpenImageInStudio={msg.role === 'model' ? handleOpenImageInStudio : undefined}
                      onCorrectMessage={msg.role === 'model' ? handleCorrectModelMessage : undefined}
                      onOpenInCanvasStudio={(content, imageBase64, targetTab) => {
                        setCanvasStudioInitialContent(content);
                        if (imageBase64) setCanvasStudioInitialImage(imageBase64);
                        if (targetTab) {
                          setCanvasStudioInitialTab(targetTab as CanvasStudioTab);
                        } else if (content.includes('```')) {
                          setCanvasStudioInitialTab('code_project');
                        } else {
                          setCanvasStudioInitialTab('notebook_guide');
                        }
                        setIsCanvasStudioOpen(true);
                        setIsSidebarOpen(false);
                      }}
                      onRunInTerminal={(code, lang) => {
                        setIsTerminalOpen(true);
                        setTerminalTrigger({ code, lang, timestamp: Date.now() });
                        addLog(`CORE OS: Injected raw code trigger (${lang}) into terminal sandbox session`, 'success');
                      }}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Unified Sovereign Input Capsule */}
            <div className="relative px-4 pt-2 pb-3.5 md:px-6 md:pt-2.5 md:pb-4 bg-[#050608]/95 backdrop-blur-xl border-t border-zinc-800/70 z-30">
              <div className="max-w-4xl mx-auto space-y-2">
                {/* Selected Files Preview with Real-Time Visual Progress Bar, Google Workspace RAG Status & 1-Click Summarize/Query */}
                {selectedFiles.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
                    {selectedFiles.map((file) => {
                      const pct = Math.min(100, Math.max(0, Math.round(file.progress ?? (file.status === 'complete' ? 100 : 0))));
                      return (
                        <div
                          key={file.id}
                          className="flex flex-col bg-zinc-900/95 border border-zinc-700/90 rounded-xl overflow-hidden min-w-[245px] max-w-[290px] p-2.5 gap-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-zinc-800 rounded-lg shrink-0">
                              {file.status === 'loading' ? (
                                <RefreshCw size={13} className="text-emerald-400 animate-spin" />
                              ) : file.status === 'error' ? (
                                <X size={13} className="text-red-500" />
                              ) : (
                                <FileIcon size={13} className="text-emerald-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-zinc-200 truncate font-mono font-medium">
                                {file.name}
                              </div>
                              <div className="flex items-center justify-between text-[10px] mt-0.5">
                                <span
                                  className={
                                    file.status === 'error'
                                      ? 'text-red-400'
                                      : file.status === 'complete'
                                      ? 'text-emerald-400 font-bold'
                                      : 'text-amber-300'
                                  }
                                >
                                  {file.status === 'error'
                                    ? 'فشل الرفع'
                                    : file.status === 'complete'
                                    ? file.isRagIndexed
                                      ? `${file.detectedFormat || 'RAG'} · ${file.ragWordCount?.toLocaleString('en-US') || ''} كلمة`
                                      : 'مكتمل وجاهز'
                                    : 'جاري الاستخلاص والفهرسة...'}
                                </span>
                                <span className="font-mono font-bold text-emerald-300">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-zinc-500 transition shrink-0 cursor-pointer"
                              title="إزالة المرفق"
                            >
                              <X size={13} />
                            </button>
                          </div>

                          {/* Visible Real-Time Progress Bar for Every Uploaded File */}
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-200 ${
                                file.status === 'error'
                                  ? 'bg-red-500'
                                  : 'bg-gradient-to-l from-emerald-400 to-teal-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* Direct 1-Click Google Workspace RAG Summarize & Query Actions */}
                          {file.status === 'complete' && (
                            <div className="flex items-center justify-between gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSend(
                                    `لخّص محتوى الملف "${file.name}" عبر محرك RAG المدمج واستخرج أهم المحاور والنقاط والبيانات الجوهرية مع التوثيق بالمراجع [1]، [2].`
                                  )
                                }
                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition cursor-pointer text-center"
                                title="تلخيص شامل للملف عبر محرك RAG المدمج"
                              >
                                تلخيص عبر RAG
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInput(`استخرج من الملف "${file.name}" عبر محرك RAG إجابة موثقة حول: `);
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold transition cursor-pointer text-center"
                                title="الاستعلام الدلالي عن محتوى الملف عبر محرك RAG"
                              >
                                استعلام في المحتوى
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* --- UNIFIED ENTERPRISE CHAT INPUT CAPSULE --- */}
                <div className="relative group">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="relative bg-[#0b0c11] rounded-2xl flex flex-col border border-zinc-800/95 focus-within:border-emerald-500/50 transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
                  >
                    <input 
                      type="file" 
                      multiple 
                      accept={UNIVERSAL_FILE_ACCEPT_EXTENSIONS}
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />

                    {/* Connected Google NotebookLM Pill & Mode Bar inside the Gemini Chat Capsule (Web++ / Multi-Notebook / Canvas) */}
                    {(() => {
                      const currentSess = activeSessionId ? sessions[activeSessionId] : undefined;
                      const activeIds =
                        currentSess?.attachedNotebookIds !== undefined
                          ? currentSess.attachedNotebookIds
                          : memoryBank.activeNotebookIds !== undefined
                          ? memoryBank.activeNotebookIds
                          : currentSess?.notebookId
                          ? [currentSess.notebookId]
                          : memoryBank.activeNotebookId
                          ? [memoryBank.activeNotebookId]
                          : [];
                      const allNbs = memoryBank.geminiNotebooks || [];
                      const attachedNbs = allNbs.filter(nb => activeIds.includes(nb.id));
                      if (attachedNbs.length === 0) return null;

                      const currentMode: GeminiNotebookUsageMode =
                        currentSess?.notebookUsageMode ||
                        memoryBank.notebookUsageMode ||
                        'hybrid_web_plus';

                      const handleSwitchMode = (mode: GeminiNotebookUsageMode) => {
                        setMemoryBank(prev => {
                          const next = { ...prev, notebookUsageMode: mode, lastUpdated: Date.now() };
                          saveMemoryBank(next);
                          return next;
                        });
                        if (activeSessionId && sessions[activeSessionId]) {
                          setSessions(prev => {
                            const updated = {
                              ...prev,
                              [activeSessionId]: {
                                ...prev[activeSessionId],
                                notebookUsageMode: mode
                              }
                            };
                            saveLocalSessions(updated);
                            return updated;
                          });
                        }
                      };

                      const handleDetachNb = (idToRemove?: string) => {
                        const nextIds = idToRemove ? activeIds.filter(id => id !== idToRemove) : [];
                        setMemoryBank(prev => {
                          const next = {
                            ...prev,
                            activeNotebookId: nextIds[0] || undefined,
                            activeNotebookIds: nextIds,
                            lastUpdated: Date.now()
                          };
                          saveMemoryBank(next);
                          return next;
                        });
                        if (activeSessionId && sessions[activeSessionId]) {
                          setSessions(prev => {
                            const updated = {
                              ...prev,
                              [activeSessionId]: {
                                ...prev[activeSessionId],
                                notebookId: nextIds[0] || undefined,
                                attachedNotebookIds: nextIds
                              }
                            };
                            saveLocalSessions(updated);
                            return updated;
                          });
                        }
                      };

                      const lastModelMsg = currentSess?.messages
                        ? [...currentSess.messages]
                            .reverse()
                            .find(m => m.role === 'model' && !m.isThinking && m.content.trim())
                        : undefined;

                      return (
                        <div className="px-3.5 py-1.5 border-b border-zinc-800/80 bg-[#0d0f17] rounded-t-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <BookOpen size={13} className="text-indigo-400 shrink-0" />
                            {attachedNbs.map(nb => {
                              const srcCount = nb.sources.filter(s => s.isEnabled !== false).length;
                              return (
                                <span
                                  key={nb.id}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-medium"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setIsNotebookHubOpen(true)}
                                    className="hover:text-white truncate max-w-[160px] cursor-pointer"
                                  >
                                    {nb.title}
                                  </button>
                                  <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                                    · {srcCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDetachNb(nb.id)}
                                    className="p-0.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition cursor-pointer"
                                    title="إلغاء تحديد وفصل هذا الدفتر عن المحادثة"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 p-0.5 bg-zinc-900 border border-zinc-800 rounded-md">
                              {(
                                [
                                  { id: 'hybrid_web_plus', label: 'دمج + ويب' },
                                  { id: 'strict_grounding', label: 'توثيق صارم' },
                                  { id: 'canvas_synthesis', label: 'للكانفاس' }
                                ] as const
                              ).map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSwitchMode(m.id)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                    currentMode === m.id
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>

                            {lastModelMsg && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetNb = attachedNbs[0];
                                  if (!targetNb) return;
                                  const words = lastModelMsg.content.trim().split(/\s+/).filter(Boolean).length;
                                  const newSrc = {
                                    id: `src-reply-${Date.now()}`,
                                    title: `مخرجات: ${(currentSess?.title || 'رد').slice(0, 35)}`,
                                    content: lastModelMsg.content,
                                    sourceType: 'note' as const,
                                    isEnabled: true,
                                    wordCount: words,
                                    addedAt: Date.now()
                                  };
                                  const updatedNb: GeminiNotebookItem = {
                                    ...targetNb,
                                    sources: [newSrc, ...targetNb.sources],
                                    updatedAt: Date.now()
                                  };
                                  const nextList = (memoryBank.geminiNotebooks || []).map(n =>
                                    n.id === updatedNb.id ? updatedNb : n
                                  );
                                  setMemoryBank(prev => {
                                    const next = { ...prev, geminiNotebooks: nextList, lastUpdated: Date.now() };
                                    saveMemoryBank(next);
                                    return next;
                                  });
                                  try {
                                    const doc = await syncNotebookLMToGoogleDrive(updatedNb);
                                    showSidebarNotification(
                                      `تم حفظ الرد في "${updatedNb.title}" ومزامنته مع Google Drive`,
                                      'success',
                                      doc.webViewLink
                                    );
                                  } catch {
                                    showSidebarNotification(
                                      `تم حفظ الرد كمصدر داخل "${updatedNb.title}"`,
                                      'success'
                                    );
                                  }
                                }}
                                className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-medium whitespace-nowrap cursor-pointer"
                                title="حفظ آخر إجابة كمصدر داخل الدفتر"
                              >
                                حفظ الرد بالدفتر
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDetachNb()}
                              className="px-2 py-1 rounded-md bg-red-950/40 hover:bg-red-950/70 border border-red-500/35 text-red-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap cursor-pointer"
                              title="فصل وإلغاء تحديد الدفتر من المحادثة"
                            >
                              <X size={11} />
                              <span>إلغاء ربط الدفتر</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Top Row of Capsule: Multi-Line Textarea (Return key inserts newline naturally!) + Send Button */}
                    <div className="flex items-end px-3.5 pt-2.5 pb-1.5 gap-2">
                      <textarea
                        rows={1}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                        }}
                        onKeyDown={(e) => {
                          // Only submit on Enter if user explicitly enabled sendOnEnter in preferences AND is on desktop with no Shift, OR pressed Ctrl/Cmd+Enter
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleSend();
                          } else if (
                            e.key === 'Enter' &&
                            !e.shiftKey &&
                            Boolean(memoryBank.userPreferences?.sendOnEnter) &&
                            window.innerWidth >= 768
                          ) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={
                          isRecording
                            ? "البوابة الصوتية مفتوحة... تحدث الآن..."
                            : "اكتب رسالتك هنا... (زر السطر الجديد ينزل سطراً، وزر الإرسال يرسل الرسالة)"
                        }
                        className={`flex-1 bg-transparent px-2 py-1.5 text-sm md:text-base focus:outline-none font-arabic resize-none max-h-40 overflow-y-auto leading-relaxed ${isRecording ? 'text-red-400 placeholder-red-500/50' : 'text-zinc-100 placeholder-zinc-500'}`}
                      />

                      <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                        <button 
                          type="submit"
                          disabled={(!input.trim() && selectedFiles.length === 0) || isAnyFileLoading || stage !== ProcessingStage.IDLE}
                          className={`
                            w-10 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer
                            ${(input.trim() || selectedFiles.length > 0) && !isAnyFileLoading && stage === ProcessingStage.IDLE
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm' 
                              : 'bg-zinc-800/80 text-zinc-600 cursor-not-allowed'}
                          `}
                          title="إرسال الرسالة"
                        >
                          {stage !== ProcessingStage.IDLE ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send size={15} className="rtl:rotate-180" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline Image Mode Aspect Ratio Selector Strip (shown when Image mode is toggled from the Paperclip menu) */}
                    {isInlineImageMode && (
                      <div className="px-3.5 py-2 border-t border-zinc-800/80 bg-purple-950/15 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300">
                            <Aperture size={13} className="text-purple-400" />
                            <span>وضع إنشاء الصورة:</span>
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {([
                              { ratio: '16:9', label: '16:9 سينمائي' },
                              { ratio: '1:1', label: '1:1 مربع' },
                              { ratio: '9:16', label: '9:16 طولي' },
                              { ratio: '4:3', label: '4:3 كلاسيكي' },
                              { ratio: '3:4', label: '3:4 بورتريه' }
                            ] as const).map(item => (
                              <button
                                key={item.ratio}
                                type="button"
                                onClick={() => setInlineAspectRatio(item.ratio)}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono border transition-all ${
                                  inlineAspectRatio === item.ratio
                                    ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 font-bold'
                                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsInlineImageMode(false)}
                          className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1"
                        >
                          <X size={12} />
                          <span>إغلاق وضع الصورة</span>
                        </button>
                      </div>
                    )}

                    {/* Streamlined Bottom Toolbar: ONLY Paperclip (Attachments + Tools) AND Model Selector + Max Effort Paired Together */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-zinc-800/75 bg-zinc-950/60 rounded-b-2xl">
                      {/* Right Group: Paperclip Attachment & Tools Gateway + Active Tool Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="relative" ref={attachMenuRef}>
                          <button
                            type="button"
                            onClick={() => setIsAttachMenuOpen(prev => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition whitespace-nowrap shrink-0 cursor-pointer ${
                              isAttachMenuOpen
                                ? 'bg-emerald-950/45 border-emerald-500/50 text-emerald-200 font-bold'
                                : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-emerald-300'
                            }`}
                            title="إرفاق ملفات أو صور، ربط السحابة والدفتر المعرفي، وتفعيل الأدوات"
                          >
                            <Paperclip size={14} className="text-emerald-400" />
                            <span>إرفاق وأدوات</span>
                            <ChevronUp
                              size={11}
                              className={`text-zinc-400 transition-transform duration-200 ${
                                isAttachMenuOpen ? 'rotate-180 text-emerald-400' : ''
                              }`}
                            />
                          </button>

                          {isAttachMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-2.5 w-64 bg-[#12141c] border border-zinc-800 rounded-2xl shadow-[0_14px_55px_rgba(0,0,0,0.9)] p-1.5 z-[130] space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                              {/* 1. Google Drive (Opens "Select or upload a file" Drive Picker directly) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAttachMenuOpen(false);
                                  setIsGoogleServicesModalOpen(true);
                                }}
                                className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 group cursor-pointer"
                              >
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                                </svg>
                                <span className="text-xs font-bold text-white group-hover:text-blue-300">
                                  Google Drive
                                </span>
                              </button>

                              {/* 2. Upload Files */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAttachMenuOpen(false);
                                  fileInputRef.current?.click();
                                }}
                                className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 group cursor-pointer"
                              >
                                <FileIcon size={15} className="text-emerald-400 shrink-0" />
                                <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                                  رفع ملفات (Upload Files)
                                </span>
                              </button>

                              {/* 3. Upload Images / Camera */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAttachMenuOpen(false);
                                  imageUploadInputRef.current?.click();
                                }}
                                className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 group cursor-pointer"
                              >
                                <ImageIcon size={15} className="text-purple-400 shrink-0" />
                                <span className="text-xs font-bold text-white group-hover:text-purple-300">
                                  رفع صور أو كاميرا
                                </span>
                              </button>

                              {/* 4. NotebookLM */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAttachMenuOpen(false);
                                  setNotebookHubMode('notebooks');
                                  setIsNotebookHubOpen(true);
                                }}
                                className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 group cursor-pointer"
                              >
                                <BookOpen size={15} className="text-indigo-400 shrink-0" />
                                <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                                  دفاتر NotebookLM
                                </span>
                              </button>

                              <div className="my-1 border-t border-zinc-800/80" />

                              {/* 5. Web Search Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsWebSearchEnabled(prev => !prev);
                                  setIsAttachMenuOpen(false);
                                }}
                                className="w-full text-right px-3 py-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <Globe size={14} className="text-sky-400 shrink-0" />
                                  <span className="text-xs font-medium text-zinc-200">البحث الشبكي الحي</span>
                                </div>
                                {isWebSearchEnabled && (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                                    مفعّل
                                  </span>
                                )}
                              </button>

                              {/* 6. Inline Image Creation Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsInlineImageMode(prev => !prev);
                                  setIsAttachMenuOpen(false);
                                }}
                                className="w-full text-right px-3 py-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <Aperture size={14} className="text-purple-400 shrink-0" />
                                  <span className="text-xs font-medium text-zinc-200">توليد صورة</span>
                                </div>
                                {isInlineImageMode && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                                    مفعّل
                                  </span>
                                )}
                              </button>

                              {/* 7. Open Canvas Studio */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCanvasMode(true);
                                  setIsCanvasStudioOpen(true);
                                  setIsAttachMenuOpen(false);
                                }}
                                className="w-full text-right px-3 py-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 cursor-pointer"
                              >
                                <PenTool size={14} className="text-emerald-400 shrink-0" />
                                <span className="text-xs font-medium text-zinc-200">استوديو الكانفاس</span>
                              </button>

                              {/* 8. Internal Terminal */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsTerminalOpen(prev => !prev);
                                  setIsAttachMenuOpen(false);
                                }}
                                className="w-full text-right px-3 py-2 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 cursor-pointer"
                              >
                                <TerminalIcon size={14} className="text-cyan-400 shrink-0" />
                                <span className="text-xs font-medium text-zinc-200">الطرفية (Terminal)</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Active Tool Indicator Pills (only shown when explicitly toggled on) */}
                        {isWebSearchEnabled && (
                          <button
                            type="button"
                            onClick={() => setIsWebSearchEnabled(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-950/50 border border-sky-500/40 text-sky-300 text-[11px] font-medium"
                          >
                            <Globe size={11} />
                            <span>بحث الويب</span>
                            <X size={11} className="opacity-70 hover:opacity-100" />
                          </button>
                        )}

                        {isCanvasMode && (
                          <button
                            type="button"
                            onClick={() => setIsCanvasMode(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium"
                          >
                            <PenTool size={11} />
                            <span>الكانفاس</span>
                            <X size={11} className="opacity-70 hover:opacity-100" />
                          </button>
                        )}
                      </div>

                      {/* Left Group: Unified Model Selector + Max Effort for the Model (Paired Clearly Together) */}
                      <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 gap-1">
                        {/* Model Selector Popover */}
                        <div className="relative" ref={modelMenuRef}>
                          {(() => {
                            const activeModelObj =
                              SOVEREIGN_MODELS.find(m => m.id === selectedModel) || SOVEREIGN_MODELS[0];
                            return (
                              <button
                                type="button"
                                onClick={() => setIsModelMenuOpen(prev => !prev)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-100 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer"
                                title="اختيار نموذج نيكسوس ومستوى جهد الاستدلال"
                              >
                                <Crown size={13} className="text-emerald-400 shrink-0" />
                                <span className="font-bold">{activeModelObj.labelAr}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                  {activeModelObj.badge}
                                </span>
                                <ChevronUp
                                  size={12}
                                  className={`text-zinc-400 transition-transform duration-200 ${
                                    isModelMenuOpen ? 'rotate-180 text-emerald-400' : ''
                                  }`}
                                />
                              </button>
                            );
                          })()}

                          {isModelMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-2.5 w-80 bg-[#0b0b12] border border-zinc-800 rounded-2xl shadow-[0_12px_50px_rgba(0,0,0,0.85)] p-2 z-[120] space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                              <div className="px-3 py-1.5 border-b border-zinc-800/80 flex items-center justify-between">
                                <span className="text-xs font-bold text-white">نموذج نيكسوس ومستوى الجهد</span>
                                <span className="text-[10px] font-mono text-emerald-400">NEXUS CORE</span>
                              </div>

                              {/* Max Effort & Sovereign Agent Toggles Directly Inside the Model Menu as well */}
                              <div className="space-y-1.5">
                                <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/35 flex items-center justify-between gap-2">
                                  <div>
                                    <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                                      <Zap size={13} className="text-amber-400" />
                                      <span>أقصى جهد للنموذج (100% TPU · 4 أطوار)</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">
                                      سقف 1M للتفكير والإخراج + أذرع هيدروجين المتوازية + الهندسة العكسية والتدقيق السببي
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setIsMaxEffortEnabled(prev => !prev)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                      isMaxEffortEnabled
                                        ? 'bg-amber-500 text-black border-amber-400'
                                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                                    }`}
                                  >
                                    {isMaxEffortEnabled ? 'مفعّل 100%' : 'تفعيل'}
                                  </button>
                                </div>

                                <div className="p-2.5 rounded-xl bg-cyan-950/25 border border-cyan-500/35 flex items-center justify-between gap-2">
                                  <div>
                                    <div className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                                      <Cpu size={13} className="text-cyan-400" />
                                      <span>وضع الوكيل (Sovereign Agent Mode)</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">
                                      تفعيل السرج الوكيلي وبناء المشاريع والملفات والعمل المتوازي بالوقت الفعلي
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setIsAgentModeEnabled(prev => !prev)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                      isAgentModeEnabled
                                        ? 'bg-cyan-500 text-black border-cyan-400'
                                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                                    }`}
                                  >
                                    {isAgentModeEnabled ? 'مفعّل' : 'تفعيل'}
                                  </button>
                                </div>
                              </div>

                              <div className="max-h-64 overflow-y-auto space-y-1 py-0.5">
                                {SOVEREIGN_MODELS.map((m) => {
                                  const isSelected = selectedModel === m.id;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModel(m.id);
                                        setIsModelMenuOpen(false);
                                      }}
                                      className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                                          : 'bg-zinc-900/40 hover:bg-zinc-900 border-transparent text-zinc-300'
                                      }`}
                                    >
                                      <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-white">{m.labelAr}</span>
                                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                            {m.badge}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                                          {m.descAr}
                                        </p>
                                      </div>
                                      {isSelected && (
                                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="h-4 w-px bg-zinc-800" />

                        {/* Paired Max Effort Button Directly Attached to the Model Selector Pill */}
                        <button
                          type="button"
                          onClick={() => setIsMaxEffortEnabled(prev => !prev)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition whitespace-nowrap cursor-pointer ${
                            isMaxEffortEnabled
                              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/45 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                              : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/70'
                          }`}
                          title="رفع جهد النموذج إلى أقصى جهد (32K TPU + المذيب البديهي + 3 مسارات متصادمة + الهندسة العكسية والتدقيق السببي)"
                        >
                          <Zap size={12} className={isMaxEffortEnabled ? 'text-amber-400' : 'text-zinc-500'} />
                          <span>{isMaxEffortEnabled ? 'أقصى جهد للنموذج (100%)' : 'أقصى جهد للنموذج'}</span>
                        </button>

                        <div className="h-4 w-px bg-zinc-800" />

                        {/* Agent Mode Button Directly Next to Max Effort Thinking ("بجانب خيار تفكير أقصى جهد ضع خيار الوكيل") */}
                        <button
                          type="button"
                          onClick={() => setIsAgentModeEnabled(prev => !prev)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition whitespace-nowrap cursor-pointer ${
                            isAgentModeEnabled
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/45 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                              : 'text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/70'
                          }`}
                          title="تفعيل وضع الوكيل السيادي (السرج الوكيلي، بناء المشاريع والملفات، والعمل المتوازي بالوقت الفعلي)"
                        >
                          <Cpu size={12} className={isAgentModeEnabled ? 'text-cyan-400' : 'text-zinc-500'} />
                          <span>الوكيل</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Docked Side-by-Side Split-Screen Canvas Workspace (Official Canvas Experience) */}
          <NexusCanvasStudioModal
            isOpen={isCanvasStudioOpen}
            onClose={() => setIsCanvasStudioOpen(false)}
            initialTab={canvasStudioInitialTab}
            initialContent={canvasStudioInitialContent}
            initialImageBase64={canvasStudioInitialImage}
            onSendPromptToChat={(promptText) => {
              handleSend(promptText);
            }}
            onGenerateVisualWithNexus={async (visualPrompt, aspectRatio, inputImage) => {
              const res = await generateVisualArtifact(
                visualPrompt,
                aspectRatio,
                'none',
                '',
                false,
                inputImage,
                (msg, type) => addLog(msg, type as any),
                undefined,
                { accountScope: getActiveAccountScope() }
              );
              return res?.data || null;
            }}
          />

          {/* Nexus Internal Terminal Panel */}
          {isTerminalOpen && (
            <NexusTerminalPanel 
              onClose={() => setIsTerminalOpen(false)}
              executeTrigger={terminalTrigger}
              onExecuteCommandInChat={(cmd) => {
                handleSend(cmd);
                addLog(`VM GATEWAY: Piped command action to sovereign chat matrix: ${cmd}`, 'core');
              }}
              onOpenOntologicalLayers={() => setIsOntologicalLayersOpen(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
