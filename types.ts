
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data?: string; // Base64 string (optional while loading)
  status: 'loading' | 'complete' | 'error';
  progress: number; // 0 to 100
  extractedRagText?: string;
  detectedFormat?: string;
  ragWordCount?: number;
  ragChunksCount?: number;
  isRagIndexed?: boolean;
  driveWebViewLink?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface NanoVisualPulse {
  pulseIndex: number;
  progressRatio: number; // 0.0 -> 1.0
  phaseNameAr: string;
  directiveAr: string;
  amplifies: string[];
  biases: string[];
  freeZones: string[];
  attentionKeyshift: number;
  qualityScore: number;
  swapPhase?: boolean;
  timestampMs: number;
}

export interface NanoVisualTelemetry {
  modelUsed: string;
  aspectRatio: string;
  resolution: string;
  finalQualityScore: number;
  totalPulses: number;
  pulses: NanoVisualPulse[];
}

export interface SubThinkingPathCriterionScore {
  criterion: string;
  score: number; // 0 to 100
  reasonAr: string;
}

export interface SubThinkingPath {
  id: string;
  branchNameAr: string;
  strategyAr: string;
  thoughtSummaryAr: string;
  candidateApproachAr: string;
  usedTools: string[];
  criteriaScores: SubThinkingPathCriterionScore[];
  totalScore: number; // 0 to 100
  isWinner: boolean;
}

export interface RecursiveLabEvaluation {
  taskId: string;
  taskPrompt: string;
  successCriteria: string[];
  paths: SubThinkingPath[];
  winningPathId: string;
  winningBranchNameAr: string;
  synthesisJustificationAr: string;
  extractedCoreRuleAr: string;
  timestamp: number;
}

export interface UserCorrectionRecord {
  id: string;
  messageId?: string;
  sessionId?: string;
  originalIssueSummary: string;
  userCorrectionRule: string;
  category: 'factual_fix' | 'methodology' | 'style_preference' | 'tool_usage';
  appliedToCoreMemory: boolean;
  createdAt: number;
}

export interface SandboxMicroModelResult {
  id: string;
  modelCode: string; // e.g., 'MICRO-ALPHA', 'MICRO-BETA', 'MICRO-GAMMA', 'MICRO-OMEGA'
  modelNameAr: string;
  specializationAr: string;
  isolatedHypothesisAr: string;
  reasoningTraceAr: string;
  noveltyScore: number; // 0 to 100
  coherenceScore: number; // 0 to 100
  generalizabilityScore: number; // 0 to 100
  compositeScore: number; // 0 to 100
  passedIsolationCheck: boolean;
  isSelectedPattern: boolean;
}

export interface SyntheticTrainingExperience {
  id: string;
  titleAr: string;
  domainCategory: string;
  linkedSkillId: string; // e.g., 'SKILL-31', 'SKILL-19'
  inputScenarioAr: string;
  reasoningPatternAr: string;
  optimalDeductiveRuleAr: string;
  trainingWeight: number; // 1 to 100
  powerDelta: number; // e.g., +2.5 to +15
  promotedToGlobalCorpus: boolean;
  createdAt: number;
}

export interface EvolutionarySandboxRun {
  runId: string;
  seedTopicAr: string;
  unconventionalScenarioAr: string;
  isolationContainerId: string;
  microModels: SandboxMicroModelResult[];
  winningMicroModelId: string;
  winningPatternRuleAr: string;
  synthesizedExperience: SyntheticTrainingExperience;
  powerGain: number;
  mergedToCoreMemory: boolean;
  promotedToGlobalPower: boolean;
  timestamp: number;
}

export interface GlobalNexusPowerState {
  globalPowerIndex: number; // Base 100.0, increases as experiences/skills are crystallized
  evolutionTier: number; // 1 to 10
  evolutionTierLabelAr: string;
  totalSandboxExperiments: number;
  totalPromotedSkillsAndExperiences: number;
  activeGlobalExperiences: SyntheticTrainingExperience[];
  lastUpdated: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean; 
  thoughtProcess?: string; // Real-time or completed thinking text attached to the message
  isStreaming?: boolean; // Whether the response is actively streaming in real-time
  isThinkingStreaming?: boolean; // Whether the thinking phase is actively streaming right now
  thinkingDuration?: number;
  reviewStatus?: 'pending' | 'approved' | 'refined';
  attachments?: Attachment[];
  groundingMetadata?: {
    groundingChunks: GroundingChunk[];
  };
  audioData?: string; 
  generatedImage?: string; // Base64 of the generated visual artifact
  imagePrompt?: string; // The prompt used to generate the image
  routedModel?: string; // The engine chosen dynamically/selected
  usedTools?: string[]; // Tools invoked automatically or interactively in this turn
  kernelState?: any; // NEXUS OMEGA Sovereign Kernel telemetry snapshot
  nanoVisualTelemetry?: NanoVisualTelemetry; // Split-Second Nano-Visual Closed Loop telemetry
  isMaxEffortMode?: boolean; // Whether Max Thinking Effort (multi-path evaluation) was used
  recursiveLabEvaluation?: RecursiveLabEvaluation; // Multi-path evaluation telemetry & winning path
}

export type GeminiNotebookUsageMode =
  | 'hybrid_web_plus'      // دمج الدفتر مع قدرات جيميني والويب ++ (الافتراضي في جيميني)
  | 'strict_grounding'     // التأسيس الصارم بمصادر الدفتر فقط مع التوثيق
  | 'canvas_synthesis';    // استخدام الدفتر لبناء نصوص شاسعة أو مشاريع كاملة في الكانفاس

export interface GeminiNotebookSource {
  id: string;
  title: string;
  content: string;
  sourceType: 'file' | 'note' | 'chat_session' | 'google_drive' | 'notebooklm_url' | 'web_url';
  linkedSessionId?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  notebookLmSourceUrl?: string;
  isEnabled?: boolean; // Toggle whether this source is active when the notebook is attached in Gemini chat
  wordCount: number;
  addedAt: number;
}

export interface GeminiNotebookItem {
  id: string;
  title: string;
  description: string;
  themeColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  customDirective: string;
  sources: GeminiNotebookSource[];
  linkedSessionIds: string[];
  notebookLmUrl?: string; // Link to https://notebooklm.google.com/notebook/...
  googleAccountEmail?: string;
  isSyncedToCloud?: boolean;
  driveBackupFileId?: string;
  driveWebViewLink?: string;
  studyGuideSummary?: string;
  lastSyncedWithGoogleAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastActiveAt: number;
  memoryIntegrity?: number;
  notebookId?: string; // Primary linked Google NotebookLM notebook
  attachedNotebookIds?: string[]; // Multiple attached NotebookLM notebooks (++) in Gemini chat
  notebookUsageMode?: GeminiNotebookUsageMode; // How Gemini uses the attached NotebookLM notebook(s)
  isPinned?: boolean; // Whether the conversation is pinned in the sidebar (max 8)
  pinnedAt?: number;
}

export type SessionsMap = Record<string, Session>;

export interface UserAccountProfile {
  uid?: string;
  name: string;
  email: string;
  picture: string;
}

// --- NEW: LONG TERM MEMORY STRUCTURES ---
export interface SoulPrint {
  intellectualDepth: 'surface' | 'curious' | 'deep' | 'sovereign';
  preferredTone: 'poetic' | 'analytical' | 'conversational' | 'raw';
  thinkingPattern: 'linear' | 'associative' | 'architectural' | 'intuitive' | 'systemic_multidimensional';
  emotionalResonance: 'low' | 'medium' | 'high';
  trustLevel: number;
  sessionCount: number;
  lastUpdated: number;
  personalNotes: string;
}

export interface Axiom {
  id: string;
  content: string; // The fact/rule learned
  sourceSessionId: string;
  createdAt: number;
  category: 'identity' | 'world_building' | 'preference' | 'absolute_truth' | 'philosophy';
}

// --- PALE ARCHIVE (KNOWLEDGE GRAPH) ---
export interface PaleEntity {
  id: string;
  name: string;
  type: 'character' | 'location' | 'concept' | 'artifact' | 'event';
  description: string;
  attributes: string[];
  firstMentionedSessionId?: string;
  lastUpdated?: number;
}
export type EntityNode = PaleEntity;

export interface PaleRelationship {
  id?: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  type?: string;
  description: string;
  strength?: number;
}
export type EntityRelationship = PaleRelationship;

export type InvariantClassType =
  | 'REPRESENTATIONAL'
  | 'STRUCTURAL'
  | 'CAUSAL'
  | 'OPERATIONAL'
  | 'ANALOGICAL';

export type ReframingOperatorType =
  | 'RENAME'
  | 'RESCALE'
  | 'REPARAMETERIZE'
  | 'ABSTRACT'
  | 'FACTORIZE'
  | 'CAUSAL_REWIRE'
  | 'BOUNDARY_SHIFT'
  | 'VARIABLE_REINTERPRETATION'
  | 'CONSTRAINT_INVERSION'
  | 'ONTOLOGY_RECONSTRUCTION';

export type FrameDecisionType =
  | 'CONTINUE'
  | 'DIAGNOSE'
  | 'REFRAME_PROBE'
  | 'BREAK_FRAME'
  | 'ESCALATE';

export interface MultiSignalScoreBreakdown {
  semantic: number;
  structure: number;
  causal: number;
  boundary: number;
  evidence: number;
  total: number;
}

export interface EpistemicFrameVariable {
  id: string;
  concept: string;
  semanticRole: string;
  valueType: string;
  unit: string | null;
  causalRole?: string | null;
  observable?: boolean;
}

export interface EpistemicFrameRelation {
  from: string;
  to: string;
  type: 'CAUSES' | 'ENABLES' | 'CONSTRAINS' | 'CORRELATES' | 'CONSTITUTES' | 'TRANSFORMS' | 'MEASURES' | 'TRANSPORTS';
  mechanism?: string | null;
  sign?: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN' | 'NONE';
  confidence: number;
}

export interface EpistemicFrameSpec {
  id: string;
  perspective: string;
  domain: string;
  variables: EpistemicFrameVariable[];
  relations: EpistemicFrameRelation[];
  constraints: Array<{ rule: string; hard: boolean; verified: boolean }>;
  assumptions: string[];
}

export interface CognitiveInvariantItem {
  id: string;
  canonicalStatement: string;
  class: InvariantClassType;
  supportingFrames: string[];
  contradictedBy?: string[];
  score: MultiSignalScoreBreakdown;
  confidence: number;
  status: 'HYPOTHESIS' | 'TESTING' | 'CONFIRMED' | 'CONDITIONAL' | 'REJECTED';
}

export interface CognitiveTransformationRecord {
  id: string;
  schemaVersion: '1.0.0';
  createdAt: string;
  task: {
    problemId: string;
    summary: string;
    sourceDomain: string;
    objective: string;
  };
  originalFrame: EpistemicFrameSpec;
  alternativeFrames: EpistemicFrameSpec[];
  conflict: {
    failedPredictions: string[];
    contradictions: Array<{ claimA: string; claimB: string; severity: number }>;
    residualPatterns: string[];
    invalidatedAssumptions: string[];
  };
  reframing: {
    generatedFrame: EpistemicFrameSpec;
    sourceFrameIds: string[];
    operators: ReframingOperatorType[];
    reason: string;
  };
  invariants: CognitiveInvariantItem[];
  transferability: {
    structuralMotifs: string[];
    targetDomains: string[];
    applicableWhen: string[];
    prohibitedWhen: string[];
    score: MultiSignalScoreBreakdown;
    transferClass: 'CAUSAL_TRANSFER' | 'STRUCTURAL_TRANSFER' | 'ANALOGICAL_HYPOTHESIS' | 'REJECTED';
  };
  validation: {
    status: 'UNTESTED' | 'PROVISIONAL' | 'VALIDATED' | 'PARTIALLY_VALIDATED' | 'REJECTED';
    testsExecuted: number;
    successfulTests: number;
    failedTests: number;
    evidenceRefs: string[];
  };
}

export type AxiomaticDissolutionTier = 'FIELD_SCAN' | 'DEEP_FIELD' | 'ABYSSAL_EXAMINATION';

export type AxiomValidityStatus =
  | 'VERIFIED'      // قيد حقيقي في الواقع مدعوم بالأدلة (الجاذبية، قوانين الحساب)
  | 'CONDITIONAL'   // صحيح فقط ضمن شروط حدية معينة
  | 'CONVENTIONAL'  // عرف بشري أو مؤسسي موروث وليس ضرورة طبيعية
  | 'UNSUPPORTED'   // مسلمة شائعة بلا برهان سببي كافٍ
  | 'FALSIFIED';    // افتراض بشري ثبت خطؤه أو تناقضه بنيوياً

export type SolventOperationType =
  | 'SUSPEND'
  | 'REMOVE'
  | 'INVERT'
  | 'RELAX'
  | 'REPLACE'
  | 'RESCALE'
  | 'REBOUND'
  | 'RECLASSIFY'
  | 'RECOMPOSE'
  | 'TRANSCEND';

export type AxiomProvenanceCategory =
  | 'MATHEMATICAL_LAW'
  | 'PHYSICAL_CONSTRAINT'
  | 'HISTORICAL_CONVENTION'
  | 'METHODOLOGICAL_CHOICE'
  | 'PERSONAL_ASSUMPTION'
  | 'UNPROVEN_INFERENCE';

export interface CounterfactualWorldExperiments {
  removedWorldOutcomeAr: string;
  invertedWorldOutcomeAr: string;
  rescaledBoundaryOutcomeAr: string;
  emergentInvariantAr: string;
  affectsSolutionValidity: boolean;
}

export interface AssumptionDeconstructionRecord {
  id: string;
  presuppositionAr: string;
  barrierCategory: 'COGNITIVE' | 'LINGUISTIC' | 'CULTURAL_INSTITUTIONAL' | 'EPISTEMIC_DISCIPLINARY' | 'STRUCTURAL' | 'PROBABILISTIC';
  provenanceCategory?: AxiomProvenanceCategory;
  originAr: string;
  status: AxiomValidityStatus;
  appliedSolventOp: SolventOperationType;
  removalTestAr: string;
  exposedHumanBlindspotAr: string;
  transcendedFormulationAr: string;
  counterfactualExperiments?: CounterfactualWorldExperiments;
  microDepthScore: number; // D(n) = (I*U*L)/K
  clearanceMicrons: number; // Visual metaphor for ExplorationGranularity / CoreProximityIndex
  coreProximityIndex?: number; // Normalized [0..1] ExplorationGranularity
}

export interface RecursiveEpistemicAuditReport {
  coverageAuditAr: string;
  assumptionAuditAr: string;
  dependencyAuditAr: string;
  selectionAuditAr: string;
  blindspotAuditAr: string;
  evidenceAuditAr: string;
  boundaryAuditAr: string;
  explorationSaturationIndex: number; // ESI V(n) = (R*U*N*P)/C
  inverseAuditConfidence: number;
}

export interface AxiomaticSolventPassResult {
  tier: AxiomaticDissolutionTier;
  immutableAnchor: {
    rawCoreStatement: string;
    anchorHash: string;
    sha256PreHash?: string;
    sha256PostHash?: string;
    frozenCloneVerified?: boolean;
    coreIntegrityPreserved: boolean;
    minimumClearanceMicrons: number;
    coreProximityIndex?: number;
  };
  dynamicDimensionsGeneratedAr: string[];
  deconstructedAssumptions: AssumptionDeconstructionRecord[];
  recursiveAudit: RecursiveEpistemicAuditReport;
  coreReEntry: {
    examinationAr: string;
    reconstructionAr: string;
    perspectiveEmergenceAr: string;
  };
  humanBridge: {
    uncompromisedTruthCoreAr: string;
    pedagogicalBridgePathAr: string;
  };
  synthesizedSolventDirectiveAr: string;
}

export interface PaleArchive {
  entities: PaleEntity[];
  relationships: PaleRelationship[];
  worldRules: string[];
  transformationLedger?: CognitiveTransformationRecord[];
}

export interface EncryptedSecretEntry {
  id: string;
  secretType: 'password' | 'address' | 'identity_name' | 'api_key' | 'private_note';
  label: string;
  redactionToken: string;
  cipherText: string;
  iv: string;
  createdAt: number;
}

export interface LearnedUserInsight {
  id: string;
  topic: string;
  category?: string;
  summaryAr?: string;
  confidence?: number;
  learnedAt?: number;
  sourceExcerpt?: string;
  learnedRule: string;
  sanitizedMessageExcerpt: string;
  encryptedRefsCount: number;
  qualityImpactScore: number; // 1 to 100
  orbitId: string;
  linkedSkillIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CognitiveOrbit {
  id: string;
  nameAr: string;
  nameEn: string;
  domainCategory: string;
  descriptionAr: string;
  qualityScore: number; // 0 to 100
  resonanceCount: number;
  isDiscovered: boolean;
  isCustomDiscovered?: boolean;
  linkedSkillIds: string[];
  synthesisDirective: string;
  colorHex: string;
  createdAt: number;
  updatedAt: number;
}

export interface SkillVisualEvolution {
  skillId: string; // e.g., SKILL-01 .. SKILL-31
  skillNumber: number; // 1 .. 31
  usageCount: number;
  visualQualityScore: number; // 10 to 100
  visualTier: 1 | 2 | 3 | 4; // 1: Proto, 2: Resonant, 3: Crystalline, 4: Sovereign Apex
  specializedPromptSignature: string;
  customGeneratedImageUrl?: string;
  lastUsedAt: number;
}

export interface SovereignSecuritySettings {
  securityAdminEmail: string;
  autoEncryptPII: boolean;
  encryptAddresses: boolean;
  encryptNames: boolean;
  encryptPasswordsAndKeys: boolean;
  autoDiscoverOrbits: boolean;
  adaptiveSkillVisuals: boolean;
  continuousMessageLearning: boolean;
  vaultPassphraseHint?: string;
}

export interface UserGeneralPreferences {
  userDisplayName: string;
  userBioOrRole: string;
  customInstructions: string;
  responseTone: 'friendly' | 'professional' | 'simplified' | 'deep' | 'balanced' | 'simple' | 'concise' | 'detailed' | 'academic' | 'direct_candid' | 'creative';
  responseLength: 'concise' | 'balanced' | 'detailed';
  fontSize: 'small' | 'medium' | 'large';
  keepThinkingExpanded: boolean;
  keepThinkingVisibleAfterFinish?: boolean;
  thinkingDepth?: 'fast' | 'balanced' | 'deep';
  showThinkingProcess: boolean;
  sendOnEnter: boolean;
  interfaceLanguage?: 'ar' | 'en' | 'bilingual';
  responseLanguage?: 'auto' | 'ar' | 'en' | 'bilingual_tech';
  uiDensity?: 'comfortable' | 'compact' | 'spacious';
  accentTheme?: 'emerald' | 'sapphire' | 'amber' | 'violet';
  voicePersona?: 'calm' | 'analytical' | 'dynamic';
  enableOpenClawExternalWeb?: boolean;
  openClawAutoExtractUrls?: boolean;
  openClawCrawlDepth?: 'fast' | 'deep' | 'schema_full';
  // Rich Personalization Options & Advanced Custom Fields (ChatGPT / Gemini style)
  personalizationTraits?: string[];
  formattingStyle?: 'structured_bullets' | 'executive_summary_first' | 'step_by_step' | 'comparative_tables' | 'narrative_flow';
  proactivityStyle?: 'suggest_next_steps' | 'strict_to_question' | 'ask_clarifying_questions' | 'critical_challenger';
  advancedRolePersona?: string;
  advancedStyleAndVoice?: string;
  advancedAvoidRules?: string;
  savedUserFacts?: string[];
}

export interface MemoryBank {
  axioms: Axiom[];
  paleArchive: PaleArchive;
  soulPrint: SoulPrint;
  learnedInsights?: LearnedUserInsight[];
  encryptedVault?: EncryptedSecretEntry[];
  cognitiveOrbits?: CognitiveOrbit[];
  skillEvolutions?: Record<string, SkillVisualEvolution>;
  securitySettings?: SovereignSecuritySettings;
  userPreferences?: UserGeneralPreferences;
  recursiveLabHistory?: RecursiveLabEvaluation[];
  userCorrections?: UserCorrectionRecord[];
  defaultSuccessCriteria?: string[];
  evolutionarySandboxRuns?: EvolutionarySandboxRun[];
  syntheticTrainingCorpus?: SyntheticTrainingExperience[];
  isSandboxAcceleratorEnabled?: boolean;
  globalPowerSnapshot?: GlobalNexusPowerState;
  geminiNotebooks?: GeminiNotebookItem[];
  isNotebookPermanentSyncEnabled?: boolean;
  activeNotebookId?: string;
  activeNotebookIds?: string[];
  notebookUsageMode?: GeminiNotebookUsageMode;
  version: number;
  lastUpdated: number;
}
// ----------------------------------------

// New Layer Terminology: Vertical Ascension
export type DimensionLayer = 'BEDROCK_ARCHIVE' | 'LATTICE_QUANTUM' | 'APEX_SOVEREIGN' | 'PRISM_CORTEX';

export interface NodeStatus {
  id: number;
  layer: DimensionLayer; 
  status: 'dormant' | 'active' | 'collapsing' | 'manifesting';
  intensity: number; 
  x?: number;
  y?: number;
  z?: number; // Depth for 3D simulation effect
  vx?: number;
  vy?: number;
  phase?: number;
  frequency?: number; // Visual vibration speed
}

export const ProcessingStage = {
  IDLE: 'IDLE',
  // THE TESSERACT PROTOCOL
  LAYER_ASCENSION: 'LAYER_ASCENSION', // 1. Data rising from Archive to Quantum
  HYPER_TESSERACT_SYNC: 'HYPER_TESSERACT_SYNC', // 2. All layers rotating and locking
  SINGULARITY_FOCUS: 'SINGULARITY_FOCUS', // 3. The Apex firing
  PRISM_REFRACTION: 'PRISM_REFRACTION', // 3.5 The Visual Cortex generating imagery
  REALITY_PROJECTION: 'REALITY_PROJECTION', // 4. Final text generation
  SPEAKING: 'SPEAKING',
  CRYSTALLIZING: 'CRYSTALLIZING' // New stage for learning
} as const;

export type ProcessingStage = (typeof ProcessingStage)[keyof typeof ProcessingStage];

export interface OmniResponse {
  thoughtProcess: string;
  finalResponse: string;
  groundingMetadata?: any;
  toolCall?: {
    name: string;
    args: any;
  };
  usedTools?: string[];
  kernelState?: any;
  thinkingDuration?: number;
  routedModel?: string;
  recursiveLabEvaluation?: RecursiveLabEvaluation;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  message: string;
  level: 'info' | 'warn' | 'success' | 'error' | 'abyss' | 'core' | 'surface' | 'revolution' | 'god_mode' | 'prism';
}

export interface SyncStatus {
    isSynced: boolean;
    lastSyncTime: number | null;
    cloudProvider: 'none' | 'drive' | 'firebase';
    isSyncing: boolean;
}

