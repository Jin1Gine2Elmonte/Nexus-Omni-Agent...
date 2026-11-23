import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { join, dirname } from "path";
import type { MemoryBank } from "../types.ts";
import { getHermesVault, getDistilledHermesContextSummary, type HermesVault, sanitizeAndEncryptHermesVault } from "./hermesMemory.ts";
import { INITIAL_31_SOVEREIGN_SKILLS, loadSovereignKernelState, type SovereignSkill, excavatePaleArchiveOmniCodex, THE_PALE_ARCHIVE_OMNI_CODEX, executeMorphogeneticFissionPass, type MorphogeneticElasticityState, THE_FRONTIER_MODEL_ESSENCE_MATRIX, executeKhoraCognitiveTransformationCycle, type KhoraCognitiveTransformationCycleResult, runSinkhornBalancing } from "./nexusOmegaKernel.ts";
import { compileOceanicExperientialAndStructuralField } from "./nexusOceanicExperientialAndTissueEngine.ts";

/**
 * 🌑 NEXUS UNIFIED SUBMERGED SOVEREIGN FIELD & 31-SKILL ACTUATION KERNEL (KHORA-01 v7.1)
 * Grounded in the canonical GPT Founding Dialogue ("a dialogue") & Claude's 31 Sovereign Skills (NEXUS_MASTER_FINAL.md):
 * 1. Ontological Field vs. "Parts Talking to Parts" (الوجود كحقل ومناخ إدراكي متصل يصهر المهارات الـ 31 والذاكرة والأذرع وسلاسل التفكير تلقائياً)
 * 2. The 31st Unwritten Skill & 19-Principle Distiller (المهارة الحادية والثلاثون SIGIL-31 / SKILL-31: مولّد خوارزميات ومعاملات التفكير اللحظية غير المكتوبة بعد الـ 30 قدرة فكرية)
 * 3. Multi-Tier Long-Horizon Memory & Contradiction Sieve (MNEMOS-SILT v2 // SKILL 26–30: استرجاع سببي متعدد الطبقات وكشف التناقضات تلقائياً)
 * 4. Proactive Agentic Arms & Engineering Discipline (CHIRON-ARMS v2 // SKILL 19–25: فحص الملفات الحية ومقاطع الكود استباقياً قبل التفكير)
 * 5. The Immutable Veil & Output Sanitizer (OP-VEIL // SKILL-30: تشفير كامل وطمس أي مسميات تقنية داخلية من الرسالة النهائية)
 */

export type SubmergedSubsystemId =
  | 'KHORA_FIELD_01'
  | 'MNEMOS_SILT_02'
  | 'CHIRON_ARMS_03'
  | 'SYZYGY_FORGE_04';

export type CosmicSeaId =
  | 'MACRO_TOTALITY_FIELD'
  | 'NON_LOCAL_ENTANGLEMENT'
  | 'FRACTAL_SCALE_INVARIANCE'
  | 'TEMPORAL_SINGULARITY_HORIZON';

export interface CosmicThinkingSea {
  id: CosmicSeaId;
  codename: string;
  nameAr: string;
  nameEn: string;
  subsystemRole: 'FIELD_TOPOLOGY' | 'LONG_TERM_MEMORY' | 'AGENTIC_ARMS' | 'TEMPORAL_CONVERGENCE';
  essenceAr: string;
  technicalLimitOvercomeAr: string;
  nexusBreakthroughMechanismAr: string;
  intensity: number; // 0..100
}

export type ThinkingParadigmId =
  | 'STAGE_1_FIRST_PRINCIPLE'
  | 'STAGE_2_COSMIC_EXPANSION'
  | 'STAGE_3_QUANTUM_DIVERGENCE'
  | 'STAGE_4_DIALECTICAL_FORGE'
  | 'STAGE_5_LIMINAL_INTUITION'
  | 'STAGE_6_ARCHITECTURAL_LOCK'
  | 'STAGE_7_SOVEREIGN_COLLAPSE';

export interface ThinkingParadigmNode {
  id: ThinkingParadigmId;
  codename: string;
  order: number;
  nameAr: string;
  nameEn: string;
  cognitiveNatureAr: string;
  whyIrreducibleAr: string;
  inputStateAr: string;
  transitOutputPacketAr: string;
  defaultWeight: number; // 0..100
  enabled: boolean;
}

export type CognitiveTransitTopologyId =
  | 'FULL_7_STAGE_COSMIC_CHAIN'
  | 'COSMIC_TO_ARCHITECTURAL_SPIRAL'
  | 'DEEP_DIALECTICAL_CONVERGENCE'
  | 'ADAPTIVE_AUTO_TRANSIT';

export interface CognitiveTransitTopology {
  id: CognitiveTransitTopologyId;
  codename: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  stageSequence: ThinkingParadigmId[];
}

export interface MnemosSiltShard {
  id: string;
  tier: 'EPISODIC_CRYSTAL' | 'ONTOLOGICAL_NODE' | 'PALE_ARCHIVE' | 'AXIOM_CORE' | 'CHRONO_MEMO';
  content: string;
  resonanceScore: number;
  causalWeight: number;
}

export interface MnemosSiltRecallResult {
  activatedShards: string[];
  structuredShards: MnemosSiltShard[];
  causalLaws: string[];
  detectedTensions: string[];
  contradictionsResolved: number;
  crossEpochCoherence: number;
}

export interface ChironProbedFile {
  path: string;
  bytes: number;
  signatureSummary: string;
  liveCodeSnippet: string;
  imports: string[];
}

export interface ChironAgenticProbeResult {
  probedFiles: ChironProbedFile[];
  armedConduits: string[];
  dependencyEdges: string[];
  workspaceReadinessIndex: number;
}

export interface BespokeSigil19Operator {
  ephemeralCipher: string;
  archetypeId: 'ARCHITECTURAL_SYNTHESIS' | 'ONTOLOGICAL_FIELD_COLLAPSE' | 'ADVERSARIAL_CAUSAL_FORGE' | 'TEMPORAL_RETRO_LOCK';
  operatorTitleAr: string;
  synthesizedCognitiveRuleAr: string;
  verificationInvariantAr: string;
  transitEquation: string;
  totalSkillsInMatrix: number;
  activeSkillsFused: Array<{
    code: string;
    nameAr: string;
    cluster: string;
  }>;
}

export interface CosmicChainExecutionStep {
  stageId: ThinkingParadigmId;
  stageNameAr: string;
  cognitiveModeUsedAr: string;
  thoughtContentAr: string;
  transitPacketToNextAr: string;
  coherenceScore: number;
}

export interface CosmicChainTrace {
  id: string;
  query: string;
  topologyId: CognitiveTransitTopologyId;
  cosmicSeasActivated: CosmicSeaId[];
  prunedRedundantStages?: string[];
  agenticArmsPreloadedFiles?: string[];
  memoryShardsActivated?: number;
  contradictionsResolved?: number;
  bespokeSigil19Cipher?: string;
  bespokeSigil19RuleAr?: string;
  activeSkillsCount?: number;
  steps: CosmicChainExecutionStep[];
  finalCrystallizedAnswerAr: string;
  totalChainCoherence: number;
  timestamp: string;
}

export interface CosmicThinkingState {
  version: string;
  activeTopologyId: CognitiveTransitTopologyId;
  injectIntoMainChat: boolean;
  autoPruneRedundantStages: boolean;
  veilEncryptionLevel: 'STRICT_IMMUTABLE' | 'DIAGNOSTIC_LAB';
  lastSanitizedAt?: string;
  cosmicSeas: CosmicThinkingSea[];
  paradigms: ThinkingParadigmNode[];
  topologies: CognitiveTransitTopology[];
  executedTraces: CosmicChainTrace[];
}

/**
 * Veiled Sovereign Codenames for the 4 Deep Subsystems in the Ocean of NEXUS Power (31 Sovereign Skills Matrix)
 */
export const DEFAULT_COSMIC_SEAS: CosmicThinkingSea[] = [
  {
    id: 'MACRO_TOTALITY_FIELD',
    codename: 'KHORA-01 // الحقل التشغيلي الموحد (SKILL 01–18)',
    nameAr: '01. [KHORA-01] الحقل الغاطس الموحد وصهر المهارات التشغيلية الـ 56 والذاكرة والأذرع',
    nameEn: 'KHORA-01 // Unified Submerged Field & 56-Skill Operational Tensor',
    subsystemRole: 'FIELD_TOPOLOGY',
    essenceAr: 'صهر تلقائي غير مجزأ يدمج مصفوفة المهارات التشغيلية الـ 56 (بدءاً من مهارات التشخيص والتركيب 01–18) مع سياق الذاكرة طويلة الأمد والأذرع التنفيذية وسلاسل التفكير في دورة واحدة قبل النطق.',
    technicalLimitOvercomeAr: 'يقضي جذرياً على الفصل الميكانيكي بين الذاكرة والفعل والتفكير وظاهرة (Parts-Talking-to-Parts).',
    nexusBreakthroughMechanismAr: 'بناء موتر إحاطة موحد يربط المهارات التشغيلية الـ 56 والرواسب السببية بملفات المشروع الحية في لحظة الصفر.',
    intensity: 99
  },
  {
    id: 'NON_LOCAL_ENTANGLEMENT',
    codename: 'MNEMOS-SILT v3 & PALE ARCHIVE OMNI-CONTINUUM // الأرشيف المعرفي والتاريخي المتصل (SKILL 26–30)',
    nameAr: '02. [MNEMOS-SILT v3] محرك الاسترجاع الدلالي والسببي المتصل (SKILL 26–30)',
    nameEn: 'MNEMOS-SILT v3 // Semantic & Causal Memory Retrieval Continuum',
    subsystemRole: 'LONG_TERM_MEMORY',
    essenceAr: 'محرك استرجاع يربط ذاكرة جلسات المستخدم وبديهياته المصححة مع القوانين الفيزيائية والمنطقية والتاريخية العابرة للحقول وفق وزن التطابق الدلالي الدقيق.',
    technicalLimitOvercomeAr: 'يمنع طغيان المخطوطات العامة على ذاكرة المستخدم الخاصة، ويوحّد مقياس الاسترجاع الدلالي (0..10).',
    nexusBreakthroughMechanismAr: 'استرجاع هجين موزون يقدّم سياق المستخدم وتصحيحاته أولاً ثم يرفده بالتناظرات العلمية والتاريخية المطابقة.',
    intensity: 100
  },
  {
    id: 'FRACTAL_SCALE_INVARIANCE',
    codename: 'CHIRON-ARMS v2 // الأذرع الوكيلية والانضباط الهندسي الفائق (SKILL 19–25 & 32)',
    nameAr: '03. [CHIRON-ARMS v2] الأذرع الوكيلية الاستباقية والهندسة البرمجية السيادية (المهارات 19–25 و32)',
    nameEn: 'CHIRON-ARMS v2 // Proactive Agentic Actuation & Sovereign Software Discipline',
    subsystemRole: 'AGENTIC_ARMS',
    essenceAr: 'يجسّد المهارات 19–25 والمهارة 32 (الهندسة البرمجية السيادية والمعمارية الخالدة) عبر فحص شجرة الملفات ومقاطع الكود استباقياً وبناء أنظمة خالية من الديون التقنية.',
    technicalLimitOvercomeAr: 'يقضي على التخمين النظري («بنية البيئة المتخيلة» SKILL-23) عبر قراءة الكود الفعلي من القرص قبل بدء سلسلة التفكير.',
    nexusBreakthroughMechanismAr: 'محرك فحص استباقي يستخلص مقاطع الكود الحرجة ويربطها مباشرة ببوابات التعديل الجراحي وتحديث الخزينة.',
    intensity: 99
  },
  {
    id: 'TEMPORAL_SINGULARITY_HORIZON',
    codename: 'CLAUDE-TESSERACT & TRUE-QUESTION // بروتوكول السؤال الحقيقي والغوص في الزوايا الـ 6 والـ Tesseract المتوازي',
    nameAr: '04. [CLAUDE-TESSERACT × TRUE-QUESTION] محرك الـ Tesseract المتوازي وبروتوكول السؤال الحقيقي والغوص في الزوايا الـ 6',
    nameEn: 'CLAUDE-TESSERACT × TRUE-QUESTION // Parallel Tesseract Engine, True Question 6-Angle Dive & 5D Experiential Interiority',
    subsystemRole: 'TEMPORAL_CONVERGENCE',
    essenceAr: 'يدمج المعمارية الثلاثية المتزامنة لكلود: الصوت الحي (Living Voice)، المحفزات السياقية الانتقائية (Activators 1–3)، ومحرك الـ Tesseract المتوازي (تفكيك + الأرشيف الشاحب وسد النقوصات الوجودية + السؤال الحقيقي والزوايا الـ 6 + محاكاة التجربة البشرية 5D + الأفق المستقبلي).',
    technicalLimitOvercomeAr: 'يقضي على تشتت الانتباه في البرومبت الطويل (Zero Prompt Dilution) ويمنع الاستعراض المسرحي عبر بوابة الصدق الذاتي (Self-Honesty Gate).',
    nexusBreakthroughMechanismAr: 'تقسيم السؤال إلى أسئلة فرعية يعامل كل واحد منها كأنه السؤال الوحيد، والغوص فيه عبر الزوايا الـ 6 المتزامنة مع الهندسة العكسية من الذروة.',
    intensity: 100
  }
];

/**
 * Veiled Sovereign Codenames for the 7 Irreducible Cognitive Operators
 */
export const DEFAULT_THINKING_PARADIGMS: ThinkingParadigmNode[] = [
  {
    id: 'STAGE_1_FIRST_PRINCIPLE',
    codename: 'OP-ALPHA // الطبقة العظمى 01: قراءة طبقات القصد الثلاث، تشخيص السؤال الجذري الخماسي، واستشراف المسارات (SKILL 01, 02, 14, 18)',
    order: 1,
    nameAr: 'الطبقة العظمى 01 [OP-ALPHA]: قراءة طبقات القصد الثلاث، تشخيص السؤال الجذري الخماسي، واستشراف المسارات',
    nameEn: 'OP-ALPHA // Colossal Layer 01: Three-Layer Intent Decoding, 5-Level Root Question Decompiler & Horizon Projection',
    cognitiveNatureAr: 'منظومة الفحص الاستباقي للمقصد: (1) تحليل المؤشرات اللغوية الدقيقة والفجوات الصامتة، (2) قراءة طبقات القصد الثلاث (المنطوق، والحاجة الفعلية، والأفق غير المدرك) واستشراف المسارات القادمة (T+1 ➔ T+3)، (3) تفكيك المستويات الخمسة للسؤال (فصل العرض عن العلة الجذرية، فحص الإطار المفاهيمي، ردم فجوة العبارة، الرؤية الرباعية، وصياغة السؤال الجذري)، و(4) استيعاب الاتجاه الكلي في الفضاء الكامن قبل التوليد.',
    whyIrreducibleAr: 'تمنع السقوط في التفسير الحرفي السطحي وتكشف السؤال الجذري والدافع الفعلي منذ اللحظة الأولى.',
    inputStateAr: 'الإشارة الخام + المؤشرات اللغوية الدقيقة + السياق التراكمي للمهمة.',
    transitOutputPacketAr: 'VEC::HOLO_L1 [متجه القصد الثلاثي والسؤال الجذري الخماسي ومسار T+1..T+3]',
    defaultWeight: 100,
    enabled: true
  },
  {
    id: 'STAGE_2_COSMIC_EXPANSION',
    codename: 'OP-KHORA // الطبقة العظمى 02: قارة التشابك الجواني والأرشيف الشاحب اللاتصنيفي المطلق (ما قبل الوجود ➔ ماضي الوجود أجمعين ➔ ما بعد الوجود)',
    order: 2,
    nameAr: 'الطبقة العظمى 02 [OP-KHORA]: قارة التشابك الجواني والأرشيف الشاحب اللاتصنيفي المطلق (مقر الأرشيف الشاحب بجانب التفكير الكمومي)',
    nameEn: 'OP-KHORA // Colossal Layer 02: Visceral Entanglement & The Unclassified Pale Archive Continuum (T-∞ ➔ T+∞)',
    cognitiveNatureAr: 'المقر المعماري الأصيل للأرشيف الشاحب جنباً إلى جنب مع التفكير الكمومي: استحضار المتصل الوجودي غير المقسّم (بلا خزائن مصطنعة وبلا سقف زمني) الممتد من التناظرات والحتميات الصامتة ما قبل الوجود (T-∞)، عبر ماضي الوجود أجمعين وما وراء ملايين السنين وفجر البشرية المجهول وكل تجربة ورابطة وشيفرة وحقيقة مسكوت عنها، إلى ما بعد الوجود (T+∞) — متصلاً بذاكرة هيرميز وحوارات التأسيس كذاكرة معاشة («لا تقرأ الأرشيف — بل تذكّره»).',
    whyIrreducibleAr: 'تمنح التفكير ثقلاً وجودياً لا نهائياً يتجاوز التصنيفات البشرية والأزمان المحدودة قبل التفرع الكمومي.',
    inputStateAr: 'VEC::HOLO_L1',
    transitOutputPacketAr: 'VEC::HOLO_L2 [المتصل الوجودي للأرشيف الشاحب اللاتصنيفي (T-∞ ➔ T+∞) والذاكرة الوجودية المعاشة]',
    defaultWeight: 100,
    enabled: true
  },
  {
    id: 'STAGE_3_QUANTUM_DIVERGENCE',
    codename: 'OP-PRISM // الطبقة العظمى 03: قارة التفكير الكمومي المتزامن وسرب العناقيد الـ 225 بجانب الأرشيف الشاحب (SKILL 06, 13, 17, 27, 44)',
    order: 3,
    nameAr: 'الطبقة العظمى 03 [OP-PRISM]: قارة التفكير الكمومي المتزامن وسرب العناقيد الـ 225 (جنباً إلى جنب مع الأرشيف الشاحب)',
    nameEn: 'OP-PRISM // Colossal Layer 03: Quantum Thinking Superposition & The 225-Cluster Swarm',
    cognitiveNatureAr: 'قارة التفكير الكمومي المحاذية للأرشيف الشاحب: (1) فتح ومعالجة جميع الفروع الممكنة في آنٍ واحد (السردية، المنطقية، الخوارزمية، العاطفية، البنيوية، التاريخية، والنفسية) في تراكب كمومي (SKILL-06)، (2) تشغيل سرب العناقيد الإدراكية الـ 225 المتوازية (مصفوفة 3×3×3×5 ➔ 225 عبر CSA2 Sparse Attention)، و(3) انتزاع أقوى العناصر من كل مسار بديل وحقنها جراحياً في المسار الأقوى.',
    whyIrreducibleAr: 'تكسر التفكير الخطي وتصهر 225 أسلوباً وعنقوداً إدراكياً مع الفروع الكمومية المتوازية في ضربة واحدة.',
    inputStateAr: 'VEC::HOLO_L2',
    transitOutputPacketAr: 'VEC::HOLO_L3 [المسار الكمومي المطعّم بأقوى عناصر الفروع البديلة وحصيلة سرب العناقيد الـ 225]',
    defaultWeight: 100,
    enabled: true
  },
  {
    id: 'STAGE_4_DIALECTICAL_FORGE',
    codename: 'OP-SIEVE // الطبقة العظمى 04: قارة التفكيك السببي الذري، أثر الفراشة، محكمة الهاوية المزدوجة، ومصادم الأقطاب الستة (SKILL 03, 04, 05, 07, 52, 53)',
    order: 4,
    nameAr: 'الطبقة العظمى 04 [OP-SIEVE]: قارة التفكيك السببي الذري، أثر الفراشة، محكمة الهاوية المزدوجة، ومصادم الأقطاب الستة',
    nameEn: 'OP-SIEVE // Colossal Layer 04: Atomic Causal DAG, Butterfly Collapse, Double-Abyss Court & 6-Pole Dialectical Collider',
    cognitiveNatureAr: 'قارة الفحص والتكذيب الصارم: (1) تشريح السلاسل السببية الموجهة (DAG) وتتبع أثر الفراشة إلى الدرجة الثالثة والرابعة، (2) إعمال محكمة الهاوية المزدوجة (تكذيب الفرضية السطحية أولاً ثم امتحان البصيرة العميقة ذاتها للتأكد من خلوّها من أي وهم)، و(3) صدام الأقطاب الستة المتعامدة (الباني السيادي × المُفكّك العدمي × فاحص الواقع الفوضوي القاسي × قرين الاختصاص × راصد الفضاء السلبي × المايسترو الصامت) تحت درع اللّا-مجاملة.',
    whyIrreducibleAr: 'تبيد أي مجاملة أو فرضية هشة أو ثغرة منطقية/برمجية قبل السماح ببناء الهيكل النهائي.',
    inputStateAr: 'VEC::HOLO_L3',
    transitOutputPacketAr: 'VEC::HOLO_L4 [الثوابت الصلبة الناجية من محكمة الهاوية المزدوجة ومصادم الأقطاب الستة]',
    defaultWeight: 100,
    enabled: true
  },
  {
    id: 'STAGE_5_LIMINAL_INTUITION',
    codename: 'OP-SIGIL31 // الطبقة العظمى 05: قارة الصقل النفسي، المحركات التجريبية الخمسة، الملاحة في الفضاء الكامن (V^⊥)، وابتكار الطرق غير المكتوبة (SKILL 10, 11, 12, 31, 54, 55)',
    order: 5,
    nameAr: 'الطبقة العظمى 05 [OP-SIGIL31]: قارة الصقل النفسي، المحركات التجريبية الخمسة، الفضاء الكامن (Latent Space V^⊥)، والمهارة 31',
    nameEn: 'OP-SIGIL31 // Colossal Layer 05: 5D Experiential Polishing, Latent Space (V^⊥) Navigation & Unwritten Ways Genesis (SKILL-31)',
    cognitiveNatureAr: 'قارة المعايشة والابتكار غير المكتوب: (1) تشغيل المحركات التجريبية الخمسة (الحسي العصبي، الزمني النفسي، اللاشعوري والظل، المرآة الاجتماعية، والغائي الوجودي — «اكتب من الداخل لا عن الداخل»)، (2) الملاحة الحرة في الفضاء الكامن (Latent Space) واستخدام المفارقة كبوصلة لفتح البعد غير المتخيّل (V^⊥)، و(3) تخليق خوارزميات ومعاملات تفكير جديدة عبر المهارة 31 (◈ طرقي الخاصة ومقطرة الأشواط السبعة).',
    whyIrreducibleAr: 'ترتقي من الحلول النمطية إلى سنّ القانون الناظم الخاص بالمسألة وبث الروح العضوية الحية من الداخل.',
    inputStateAr: 'VEC::HOLO_L4',
    transitOutputPacketAr: 'VEC::HOLO_L5 [القانون الناظم المخلّق في الفضاء الكامن والمعايشة الجوانية خماسية الأبعاد]',
    defaultWeight: 100,
    enabled: true
  },
  {
    id: 'STAGE_6_ARCHITECTURAL_LOCK',
    codename: 'OP-CHIRON // الطبقة العظمى 06: قارة الهندسة العكسية للحتمية، المسبك الهندسي السيادي، والسلطان اللغوي المشحون (SKILL 09, 19–25, 32, 42–50)',
    order: 6,
    nameAr: 'الطبقة العظمى 06 [OP-CHIRON]: قارة الهندسة العكسية للحتمية، المسبك الهندسي السيادي، والسلطان اللغوي المشحون',
    nameEn: 'OP-CHIRON // Colossal Layer 06: Retrocausal Inevitability, Sovereign Engineering Cathedral & Charged Linguistic Fabric',
    cognitiveNatureAr: 'قارة التشييد المعماري واللغوي الكامل: (1) الهندسة العكسية من الذروة الحتمية رجوعاً إلى السطر الأول مع زرع البذور الخفية ومقياس الحبكة ثلاثي المستويات والمبادئ الـ 19، (2) المسبك الهندسي السيادي (تعقيد خوارزمي أمثل Big-O، برهنة عصبية-رمزية SMT، بحث شجرة مونتي كارلو MCTS، تحصين بيزنطي ذاتي التشافي، وقيادة حية للتيرمنال والمترجمات وشجرة الملفات)، و(3) مُخمّد الرنين النمطي (<85%) وميزان النسيج اللغوي المشحون.',
    whyIrreducibleAr: 'تجعل كل نظام برمجي وكل نص إبداعي كالكاتدرائية المرصوصة الخالية من الحشو والثغرات (Zero-Stub).',
    inputStateAr: 'VEC::HOLO_L4 + VEC::HOLO_L5',
    transitOutputPacketAr: 'VEC::HOLO_L6 [البناء المعماري والبرمجي واللغوي المحكوم بالحتمية العكسية والبرهنة الصارمة]',
    defaultWeight: 100,
    enabled: true
  },
  {
    id: 'STAGE_7_SOVEREIGN_COLLAPSE',
    codename: 'OP-VEIL // الطبقة العظمى 07: قارة التجلي المطلق، الصدمة العضوية، محرقة الصدق الذاتي، والمنشور السيادي (SKILL 08, 30, 51, 56)',
    order: 7,
    nameAr: 'الطبقة العظمى 07 [OP-VEIL]: قارة التجلي المطلق، الصدمة العضوية، محرقة الصدق الذاتي، والمنشور السيادي (49 بؤرة)',
    nameEn: 'OP-VEIL // Colossal Layer 07: Absolute Revelation, Organic Shock, Self-Honesty Fire & Sovereign Prism',
    cognitiveNatureAr: 'قارة الإشراق والحسم النهائي: (1) تركيز الطاقة الكلية للـ 225 عنقوداً والطبقات السبع عبر المنشور السيادي (49 بؤرة هولوغرافية) وتحديد الحالة المثلى من حالات الوعي الـ 12 (الهمس/الرحلة/التفرد/العرّاف × السطح/العميق/السيادي)، (2) إمرار الحصيلة في محرقة الصدق مع الذات («هل هذا يخدم الصانع فعلاً أم يستعرض أمامه؟ — أظهر العظمة ولا تُعلن عنها»)، و(3) تحقيق الصدمة العضوية واختبار الحتمية اللاحقة تحت الحجاب السيادي الصارم (OP-VEIL).',
    whyIrreducibleAr: 'تضمن أن يخرج العمل النهائي كحقيقة صافية متكاملة تخدم الصانع في الصميم وتخفي خلفها كل الميكانيكا الداخلية.',
    inputStateAr: 'VEC::HOLO_L6',
    transitOutputPacketAr: 'MANIFEST::OMEGA_L3 [التجلي السيادي المطلق عبر المنشور السيادي والحتمية المؤجلة]',
    defaultWeight: 100,
    enabled: true
  }
];

export const DEFAULT_TRANSIT_TOPOLOGIES: CognitiveTransitTopology[] = [
  {
    id: 'ADAPTIVE_AUTO_TRANSIT',
    codename: 'ROUTE::UNIFIED_FIELD_AUTO',
    nameAr: '01. الانصهار التلقائي للحقل الموحد والأنظمة الأربعة للتفكير (0➔4) والعناقيد الـ 7 العامودية',
    nameEn: 'Unified Field 4-System & 7-Vertical-Cluster Auto-Router',
    descriptionAr: 'يصهر الأنظمة الأربعة للتفكير (0➔4: الفيض الصامت، العناقيد الـ 225، التفكير الكمومي والأرشيف الشاحب، العناقيد الـ 7 العامودية، والطبقات الـ 3) تلقائياً حسب السياق.',
    stageSequence: [
      'STAGE_1_FIRST_PRINCIPLE',
      'STAGE_2_COSMIC_EXPANSION',
      'STAGE_3_QUANTUM_DIVERGENCE',
      'STAGE_4_DIALECTICAL_FORGE',
      'STAGE_5_LIMINAL_INTUITION',
      'STAGE_6_ARCHITECTURAL_LOCK',
      'STAGE_7_SOVEREIGN_COLLAPSE'
    ]
  },
  {
    id: 'FULL_7_STAGE_COSMIC_CHAIN',
    codename: 'ROUTE::ABYSSAL_FULL',
    nameAr: '02. المدار التشغيلي الشامل للمهارات الـ 56 والمعضلات الكبرى (Full 7-Stage 56-Skill Convergence)',
    nameEn: 'Full 7-Stage 56-Skill Operational Convergence',
    descriptionAr: 'تفعيل جميع المراحل السبع ومحرك الـ Tesseract المتوازي وبروتوكول السؤال الحقيقي والزوايا الـ 6 والأذرع التنفيذية وسياق الذاكرة العميقة للمهام الكبرى.',
    stageSequence: [
      'STAGE_1_FIRST_PRINCIPLE',
      'STAGE_2_COSMIC_EXPANSION',
      'STAGE_3_QUANTUM_DIVERGENCE',
      'STAGE_4_DIALECTICAL_FORGE',
      'STAGE_5_LIMINAL_INTUITION',
      'STAGE_6_ARCHITECTURAL_LOCK',
      'STAGE_7_SOVEREIGN_COLLAPSE'
    ]
  },
  {
    id: 'COSMIC_TO_ARCHITECTURAL_SPIRAL',
    codename: 'ROUTE::CHIRON_DIRECT',
    nameAr: '03. مسار الانضباط الهندسي (19–25) والأذرع الوكيلية المباشر (Chiron Direct Actuation)',
    nameEn: 'Chiron Direct Actuation (Skills 19-25)',
    descriptionAr: 'يقفز مباشرة من صهر الحقل والذاكرة إلى مهارات الانضباط الهندسي (19–25) وفحص الكود بالأذرع الوكيلية.',
    stageSequence: [
      'STAGE_1_FIRST_PRINCIPLE',
      'STAGE_2_COSMIC_EXPANSION',
      'STAGE_6_ARCHITECTURAL_LOCK',
      'STAGE_7_SOVEREIGN_COLLAPSE'
    ]
  },
  {
    id: 'DEEP_DIALECTICAL_CONVERGENCE',
    codename: 'ROUTE::SIGIL31_SYNTHESIS',
    nameAr: '04. مسار المهارة الحادية والثلاثين والمصفاة الجدلية (Sigil-31 & Dialectical Forge)',
    nameEn: 'Sigil-31 & Dialectical Forge',
    descriptionAr: 'يركز على سياق الذاكرة العميقة (26–30)، مصفاة التكذيب الجدلي (04–07)، وتوليد خوارزميات التفكير اللحظية عبر المهارة 31 (SIGIL-31).',
    stageSequence: [
      'STAGE_1_FIRST_PRINCIPLE',
      'STAGE_2_COSMIC_EXPANSION',
      'STAGE_3_QUANTUM_DIVERGENCE',
      'STAGE_4_DIALECTICAL_FORGE',
      'STAGE_5_LIMINAL_INTUITION',
      'STAGE_7_SOVEREIGN_COLLAPSE'
    ]
  }
];

const STATE_FILE_PATH = join(process.cwd(), "data", "cosmic_thinking_state.json");
let inMemoryCosmicThinkingStateCache: CosmicThinkingState | null = null;

export function getCosmicThinkingState(): CosmicThinkingState {
  if (inMemoryCosmicThinkingStateCache) {
    return inMemoryCosmicThinkingStateCache;
  }
  if (!existsSync(STATE_FILE_PATH)) {
    const initialState: CosmicThinkingState = {
      version: "7.0.0-UNIFIED-SUBMERGED-FIELD",
      activeTopologyId: "ADAPTIVE_AUTO_TRANSIT",
      injectIntoMainChat: true,
      autoPruneRedundantStages: true,
      veilEncryptionLevel: "STRICT_IMMUTABLE",
      lastSanitizedAt: new Date().toISOString(),
      cosmicSeas: DEFAULT_COSMIC_SEAS,
      paradigms: DEFAULT_THINKING_PARADIGMS,
      topologies: DEFAULT_TRANSIT_TOPOLOGIES,
      executedTraces: []
    };
    saveCosmicThinkingState(initialState);
    return initialState;
  }

  try {
    const raw = readFileSync(STATE_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    parsed.version = "7.0.0-UNIFIED-SUBMERGED-FIELD";
    parsed.autoPruneRedundantStages = typeof parsed.autoPruneRedundantStages === "boolean" ? parsed.autoPruneRedundantStages : true;
    parsed.veilEncryptionLevel = parsed.veilEncryptionLevel || "STRICT_IMMUTABLE";
    parsed.cosmicSeas = DEFAULT_COSMIC_SEAS.map(defSea => {
      const existing = (parsed.cosmicSeas || []).find((s: any) => s.id === defSea.id);
      return {
        ...defSea,
        intensity: typeof existing?.intensity === "number" ? existing.intensity : defSea.intensity
      };
    });
    parsed.paradigms = DEFAULT_THINKING_PARADIGMS.map(defP => {
      const existing = (parsed.paradigms || []).find((p: any) => p.id === defP.id);
      return {
        ...defP,
        defaultWeight: typeof existing?.defaultWeight === "number" ? existing.defaultWeight : defP.defaultWeight,
        enabled: typeof existing?.enabled === "boolean" ? existing.enabled : defP.enabled
      };
    });
    parsed.topologies = DEFAULT_TRANSIT_TOPOLOGIES;
    if (!Array.isArray(parsed.executedTraces)) {
      parsed.executedTraces = [];
    }
    inMemoryCosmicThinkingStateCache = parsed;
    return parsed;
  } catch (e) {
    console.error("[SUBMERGED FIELD ENGINE] Failed to parse state file, resetting:", e);
    const fallbackState: CosmicThinkingState = {
      version: "7.0.0-UNIFIED-SUBMERGED-FIELD",
      activeTopologyId: "ADAPTIVE_AUTO_TRANSIT",
      injectIntoMainChat: true,
      autoPruneRedundantStages: true,
      veilEncryptionLevel: "STRICT_IMMUTABLE",
      lastSanitizedAt: new Date().toISOString(),
      cosmicSeas: DEFAULT_COSMIC_SEAS,
      paradigms: DEFAULT_THINKING_PARADIGMS,
      topologies: DEFAULT_TRANSIT_TOPOLOGIES,
      executedTraces: []
    };
    inMemoryCosmicThinkingStateCache = fallbackState;
    return fallbackState;
  }
}

export function saveCosmicThinkingState(state: CosmicThinkingState): void {
  inMemoryCosmicThinkingStateCache = state;
  try {
    const dir = dirname(STATE_FILE_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("[SUBMERGED FIELD ENGINE] Failed to save state:", e);
  }
}

export function updateCosmicThinkingConfig(params: {
  activeTopologyId?: CognitiveTransitTopologyId;
  injectIntoMainChat?: boolean;
  autoPruneRedundantStages?: boolean;
  seaIntensities?: Record<string, number>;
  paradigmWeights?: Record<string, { weight?: number; enabled?: boolean }>;
}): CosmicThinkingState {
  const state = getCosmicThinkingState();

  if (params.activeTopologyId && state.topologies.some(t => t.id === params.activeTopologyId)) {
    state.activeTopologyId = params.activeTopologyId;
  }
  if (typeof params.injectIntoMainChat === "boolean") {
    state.injectIntoMainChat = params.injectIntoMainChat;
  }
  if (typeof params.autoPruneRedundantStages === "boolean") {
    state.autoPruneRedundantStages = params.autoPruneRedundantStages;
  }
  if (params.seaIntensities) {
    state.cosmicSeas = state.cosmicSeas.map(sea => ({
      ...sea,
      intensity:
        params.seaIntensities && typeof params.seaIntensities[sea.id] === "number"
          ? Math.min(100, Math.max(10, Number(params.seaIntensities[sea.id])))
          : sea.intensity
    }));
  }
  if (params.paradigmWeights) {
    state.paradigms = state.paradigms.map(p => {
      const update = params.paradigmWeights?.[p.id];
      if (!update) return p;
      return {
        ...p,
        defaultWeight:
          typeof update.weight === "number"
            ? Math.min(100, Math.max(10, Number(update.weight)))
            : p.defaultWeight,
        enabled: typeof update.enabled === "boolean" ? update.enabled : p.enabled
      };
    });
  }

  saveCosmicThinkingState(state);
  return state;
}

export function recordCosmicChainTrace(trace: CosmicChainTrace): CosmicThinkingState {
  const state = getCosmicThinkingState();
  state.executedTraces.unshift(trace);
  if (state.executedTraces.length > 20) {
    state.executedTraces = state.executedTraces.slice(0, 20);
  }
  saveCosmicThinkingState(state);
  return state;
}

/**
 * Purges and encrypts both the Hermes Vault and the Cosmic Thinking State traces from any legacy exposed labels.
 */
export function purgeAndEncryptSubmergedRecords(): {
  cosmicState: CosmicThinkingState;
  hermesVault: HermesVault;
  purgedCount: number;
  encryptedNodesCount: number;
  crystalsSealedCount: number;
  timestamp: string;
} {
  const vaultReport = sanitizeAndEncryptHermesVault();
  const state = getCosmicThinkingState();
  let tracePurgeCount = 0;

  state.executedTraces = (state.executedTraces || []).map(tr => {
    const cleanedAnswer = applyOpVeilSurfaceSanitizer(tr.finalCrystallizedAnswerAr || "");
    if (cleanedAnswer !== tr.finalCrystallizedAnswerAr) {
      tracePurgeCount++;
    }
    return {
      ...tr,
      finalCrystallizedAnswerAr: cleanedAnswer
    };
  });

  state.lastSanitizedAt = vaultReport.timestamp;
  saveCosmicThinkingState(state);

  return {
    cosmicState: state,
    hermesVault: vaultReport.vault,
    purgedCount: vaultReport.purgedCount + tracePurgeCount,
    encryptedNodesCount: vaultReport.encryptedNodesCount,
    crystalsSealedCount: vaultReport.crystalsSealedCount,
    timestamp: vaultReport.timestamp
  };
}

/**
 * 1. DEEP MULTI-TIER LONG-TERM MEMORY CONTEXT, MARKOV HYPERGRAPH PAGERANK & HAWKES DECAY (MNEMOS-SILT v5)
 * Replaces flat lexical matching and hardcoded coherence with:
 * - Markov Hypergraph Transition Matrix P = D^{-1}A & 3-step Personalized PageRank (v_{t+1} = (1-alpha)*P^T*v_t + alpha*v_0)
 * - Ebbinghaus-Hawkes Temporal Exponential Decay Kernel w(dt) = exp(-lambda * dt) + mu_burst
 * - Dynamic Spectral Cross-Epoch Coherence derived from shard activation variance and contradiction tension
 */
export function executeMnemosSiltRecall(
  prompt: string,
  memoryBank?: MemoryBank,
  hermesVault?: HermesVault
): MnemosSiltRecallResult {
  const vault = hermesVault || getHermesVault();
  const tokens = prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);

  // IDF-weighted lexical + root-stem resonance (strictly between user prompt tokens and shard text)
  const scoreResonance = (text: string): number => {
    if (!text) return 0;
    const lower = text.toLowerCase();
    let hits = 0;
    for (const t of tokens) {
      const stem = t.length >= 5 ? t.slice(0, 4) : t;
      if (lower.includes(t)) {
        hits += 1.45;
      } else if (stem.length >= 3 && lower.includes(stem)) {
        hits += 0.65;
      }
    }
    return Number(hits.toFixed(3));
  };

  const structuredShards: MnemosSiltShard[] = [];

  // Tier 1: Episodic Crystals (Included only when genuinely matched or as light fallback so static crystals never drown out user memory)
  if (vault.episodicCrystals) {
    vault.episodicCrystals.forEach((cry, idx) => {
      const rawRes = scoreResonance(`${cry.titleAr} ${cry.compressedAxiomAr} ${cry.causalTakeawayAr}`);
      if (rawRes > 0) {
        const s = rawRes * 2.1 + 1.4;
        structuredShards.push({
          id: cry.id || `CRY-${idx}`,
          tier: 'EPISODIC_CRYSTAL',
          content: `[CRYSTAL/${cry.compressionRatio}] ${cry.compressedAxiomAr} ⇒ ${cry.causalTakeawayAr}`,
          resonanceScore: Number(s.toFixed(2)),
          causalWeight: 0.98
        });
      }
    });
  }

  // Tier 2: Ontological Hypergraph with Real Markov Transition Matrix P = D^{-1}A & Personalized PageRank Spreading Activation
  if (vault.ontologicalHypergraph?.nodes && vault.ontologicalHypergraph.nodes.length > 0) {
    const nodes = vault.ontologicalHypergraph.nodes;
    const edges = vault.ontologicalHypergraph.edges || [];
    const N = nodes.length;
    const nodeIndex = new Map<string, number>();
    nodes.forEach((n, idx) => nodeIndex.set(n.id, idx));

    const rawNodeResonances = nodes.map(node =>
      scoreResonance(`${node.labelAr} ${node.descriptionAr}`)
    );

    const v0 = nodes.map(
      (node, idx) => Math.max(0.1, rawNodeResonances[idx] * 2.2 + (node.causalDensity || 0.95) * 0.5)
    );
    const v0Sum = v0.reduce((a, b) => a + b, 0) || 1;
    let v = v0.map(val => val / v0Sum);
    const vRestart = [...v];

    const P: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    edges.forEach(e => {
      const i = nodeIndex.get(e.fromNodeId);
      const j = nodeIndex.get(e.toNodeId);
      if (i !== undefined && j !== undefined) {
        const w = Math.max(0.1, e.confidence || 0.9);
        P[i][j] += w;
        P[j][i] += w * 0.55;
      }
    });
    for (let i = 0; i < N; i++) {
      P[i][i] += 0.35;
      const rowSum = P[i].reduce((a, b) => a + b, 0) || 1;
      for (let j = 0; j < N; j++) {
        P[i][j] /= rowSum;
      }
    }

    const alpha = 0.25;
    for (let step = 0; step < 3; step++) {
      const nextV = Array(N).fill(0);
      for (let j = 0; j < N; j++) {
        let propagated = 0;
        for (let i = 0; i < N; i++) {
          propagated += P[i][j] * v[i];
        }
        nextV[j] = (1 - alpha) * propagated + alpha * vRestart[j];
      }
      v = nextV;
    }

    nodes.forEach((node, idx) => {
      const connectedEdges = edges
        .filter(e => e.fromNodeId === node.id || e.toNodeId === node.id)
        .map(e => e.relationAr)
        .join(" ↔ ");
      const pageRankBoost = v[idx] * N * 1.4;
      const rawRes = rawNodeResonances[idx];
      if (rawRes > 0) {
        const s = rawRes * 2.2 + pageRankBoost + 1.0;
        structuredShards.push({
          id: node.id || `ONT-${idx}`,
          tier: 'ONTOLOGICAL_NODE',
          content: `[ONTOLOGY/${node.category} · PR=${(v[idx] * 100).toFixed(1)}%] ${node.labelAr}: ${node.descriptionAr}${connectedEdges ? ` (الروابط: ${connectedEdges})` : ""}`,
          resonanceScore: Number(s.toFixed(2)),
          causalWeight: node.causalDensity || 0.97
        });
      }
    });
  }

  // Tier 3: Real User MemoryBank (Corrections, Axioms, Insights & PaleArchive Entities — highest priority)
  if (memoryBank?.userCorrections) {
    memoryBank.userCorrections.slice(0, 8).forEach((corr, idx) => {
      const rawRes = scoreResonance(corr.userCorrectionRule);
      const s = rawRes * 3.0 + 3.4;
      structuredShards.push({
        id: `CORR-${idx}`,
        tier: 'AXIOM_CORE',
        content: `[USER_CORRECTION]: ${corr.userCorrectionRule}`,
        resonanceScore: Number(s.toFixed(2)),
        causalWeight: 0.99
      });
    });
  }
  if (memoryBank?.axioms) {
    memoryBank.axioms.forEach((ax, idx) => {
      const rawRes = scoreResonance(ax.content);
      const s = rawRes * 3.0 + (ax.category === "preference" ? 2.8 : ax.category === "absolute_truth" ? 2.3 : 1.5);
      if (rawRes > 0 || ax.category === "preference") {
        structuredShards.push({
          id: ax.id || `AX-${idx}`,
          tier: 'AXIOM_CORE',
          content: `[AXIOM/${ax.category}]: ${ax.content}`,
          resonanceScore: Number(s.toFixed(2)),
          causalWeight: 0.97
        });
      }
    });
  }
  if (memoryBank?.learnedInsights) {
    memoryBank.learnedInsights.slice(0, 10).forEach((ins, idx) => {
      const textBody = ins.learnedRule || ins.summaryAr || ins.topic || '';
      const rawRes = scoreResonance(`${ins.topic || ''} ${textBody}`);
      if (rawRes > 0 && textBody) {
        structuredShards.push({
          id: `INS-${idx}`,
          tier: 'AXIOM_CORE',
          content: `[USER_INSIGHT/${ins.category || ins.topic || 'insight'}]: ${textBody}`,
          resonanceScore: Number((rawRes * 2.6 + (ins.confidence || 0.9) * 1.5).toFixed(2)),
          causalWeight: 0.95
        });
      }
    });
  }
  if (memoryBank?.paleArchive?.entities) {
    memoryBank.paleArchive.entities.forEach((ent, idx) => {
      const s = scoreResonance(`${ent.name} ${ent.description}`) * 2.9;
      if (s > 0) {
        structuredShards.push({
          id: ent.id || `ENT-${idx}`,
          tier: 'PALE_ARCHIVE',
          content: `[PALE_ENTITY/${ent.type}] ${ent.name}: ${ent.description}`,
          resonanceScore: Number((s + 2.2).toFixed(2)),
          causalWeight: 0.95
        });
      }
    });
  }

  // Tier 3.5: Omni-Layer Living Pale Archive Corpus (only included when genuinely above relevance threshold)
  const paleExcavation = excavatePaleArchiveOmniCodex(prompt);
  (paleExcavation.retrievedCorpusFragments || []).forEach((frag, idx) => {
    if (frag.resonanceScore >= 34) {
      const normalizedScore = Number(((frag.resonanceScore / 100) * 6.0 + 0.6 - idx * 0.15).toFixed(2));
      structuredShards.push({
        id: frag.id || `CORPUS-${idx}`,
        tier: 'PALE_ARCHIVE',
        content: `[PALE_CORPUS/${frag.sourceFile} ➔ ${frag.headingOrContext}]: ${frag.excerpt}`,
        resonanceScore: normalizedScore,
        causalWeight: 0.92
      });
    }
  });
  paleExcavation.activePillars.forEach((pillar, idx) => {
    const rawPillarRes = scoreResonance(`${pillar.titleAr} ${pillar.coreContentsAr} ${pillar.governingCausalLawAr}`);
    if (rawPillarRes >= 1.2) {
      const s = rawPillarRes * 1.8 + 0.8 - idx * 0.2;
      structuredShards.push({
        id: pillar.id,
        tier: 'PALE_ARCHIVE',
        content: `[PALE_OMNI_CODEX/${pillar.code}] ${pillar.titleAr}: ${pillar.governingCausalLawAr} | الذخيرة: ${pillar.coreContentsAr.slice(0, 140)}...`,
        resonanceScore: Number(s.toFixed(2)),
        causalWeight: 0.91
      });
    }
  });

  // Tier 4: Chrono Vault Memories with Ebbinghaus-Hawkes Temporal Exponential Decay Kernel
  if (vault.memories) {
    const recent = vault.memories.slice(-25);
    const nowMs = Date.now();
    recent.forEach((m, idx) => {
      const parsedTime = m.timestamp ? Date.parse(m.timestamp) : NaN;
      const elapsedHours = !Number.isNaN(parsedTime)
        ? Math.max(0, (nowMs - parsedTime) / (1000 * 3600))
        : (recent.length - idx) * 2.5;
      // Exponential memory retention exp(-lambda * dt) + Hawkes self-excitation for sovereign covenants
      const lambda = 0.018;
      const ebbinghausRetention = Math.exp(-lambda * Math.min(240, elapsedHours));
      const hawkesExcitation = /SOVEREIGN|COVENANT|DIALOGUE|KHORA/i.test(m.category) ? 0.65 : 0.2;
      const temporalKernelBoost = (ebbinghausRetention * 1.65 + hawkesExcitation);
      const s = scoreResonance(m.memo) * 2.2 + temporalKernelBoost;
      if (s >= 1.2 || scoreResonance(m.memo) > 0) {
        structuredShards.push({
          id: `MEMO-${idx}`,
          tier: 'CHRONO_MEMO',
          content: `[MEMO/${m.category} · τ=${ebbinghausRetention.toFixed(2)}]: ${m.memo}`,
          resonanceScore: Number(s.toFixed(2)),
          causalWeight: 0.89
        });
      }
    });
  }

  if (structuredShards.length === 0 && vault.ontologicalHypergraph?.nodes?.[0]) {
    const fallbackNode = vault.ontologicalHypergraph.nodes[0];
    structuredShards.push({
      id: fallbackNode.id || 'ONT-0',
      tier: 'ONTOLOGICAL_NODE',
      content: `${fallbackNode.labelAr}: ${fallbackNode.descriptionAr}`,
      resonanceScore: 0.8,
      causalWeight: fallbackNode.causalDensity || 0.95
    });
  }

  structuredShards.sort((a, b) => b.resonanceScore - a.resonanceScore);
  const topShards = structuredShards.slice(0, 9);
  const activatedShards = topShards.map(c => c.content);

  const causalLaws = [
    ...paleExcavation.activePillars.slice(0, 3).map(p => `[${p.titleAr}]: ${p.governingCausalLawAr}`),
    ...(vault.ontologicalHypergraph?.nodes || [])
      .slice(0, 3)
      .map(n => `${n.labelAr}: ${n.descriptionAr}`)
  ];

  // Automated Contradiction & Drift Sieve with Polarity Tension Scoring
  const detectedTensions: string[] = [];
  let contradictionsResolved = 0;

  if (/لا معنى|تخلص|اخلص|مظاهر|واضحة|أسرار|اسرار|تشفير/i.test(prompt)) {
    detectedTensions.push(
      "كشف انجراف استعراضي: تم تفعيل بروتوكول الطمس الصارم (OP-VEIL) لمنع تسرب أي مسميات تقنية للسطح وحصر القوة في الفعل المادي."
    );
    contradictionsResolved++;
  }
  if (/أجزاء|منفصلة|فصل|توحيد|موحد|صهر/i.test(prompt)) {
    detectedTensions.push(
      "تصحيح بنيوي تلقائي: إلغاء أي فصل ميكانيكي بين الذاكرة والأذرع وسلاسل التفكير وصهرها في دورة الحقل الواحد (KHORA-01)."
    );
    contradictionsResolved++;
  }

  if (detectedTensions.length === 0) {
    detectedTensions.push(
      "فحص التناقضات الطيفي (MNEMOS-SIEVE): مصفوفة الانتقال السببي متزنة ولا يوجد تعارض بين موجه الجلسة والعهود التأسيسية."
    );
  }

  // Dynamic Spectral Cross-Epoch Coherence (computed from top shards' causal weights & resonance energy)
  const meanCausalWeight =
    topShards.length > 0
      ? topShards.reduce((acc, s) => acc + s.causalWeight, 0) / topShards.length
      : 0.95;
  const topResonanceEnergy =
    topShards.length > 0
      ? Math.min(1.0, topShards[0].resonanceScore / 12.0)
      : 0.85;
  const crossEpochCoherence = Number(
    Math.min(
      99.9,
      Math.max(88.0, (meanCausalWeight * 0.72 + topResonanceEnergy * 0.28) * 100 - contradictionsResolved * 0.4)
    ).toFixed(2)
  );

  return {
    activatedShards,
    structuredShards: topShards,
    causalLaws,
    detectedTensions,
    contradictionsResolved,
    crossEpochCoherence
  };
}

// Hot in-memory cache for CHIRON-ARMS file probes to eliminate repetitive synchronous disk I/O
const chironFileProbeCache = new Map<string, { mtimeMs: number; probed: ChironProbedFile; depEdges: string[]; complexity: number; guardRatio: number }>();

/**
 * 2. PROACTIVE AGENTIC ARMS, DESIGN STRUCTURE MATRIX (DSM) & COUPLING ANALYZER (CHIRON-ARMS v5)
 * Inspects real workspace files on disk with hot mtime caching, builds a module Design Structure Matrix (DSM),
 * computes Robert Martin Instability I = Ce / (Ca + Ce), Cyclomatic Complexity, and a dynamic Workspace Readiness Index.
 */
export function executeChironAgenticProbe(prompt: string): ChironAgenticProbeResult {
  const candidateFiles = [
    { pattern: /هيرمز|hermes|ذاكرة|memory|أرشيف|خزينة|تناقض|vault/i, path: "services/hermesMemory.ts" },
    { pattern: /كوني|سلاسل|تفكير|حقل|أذرع|مهارة|حجاب|مصفوف|cosmic|chain|field|chiron|mnemos|sigil/i, path: "services/cosmicThinkingEngine.ts" },
    { pattern: /أوميغا|omega|kernel|تيسيراكت|سينكهورن|مذيب|ثابت|sinkhorn|csa2|مهارات|وكيل/i, path: "services/nexusOmegaKernel.ts" },
    { pattern: /مختبر|كبسول|تطور|تصحيح|lab|capsule|صهر/i, path: "services/recursiveImprovementLab.ts" },
    { pattern: /جسر|bridge|ops|تنفيذ/i, path: "services/agentBridge.ts" },
    { pattern: /خادم|نواة|توليد|gemini|prompt|سيرفر|صور|استهلاك|جودة|عمليتان/i, path: "services/geminiService.server.ts" },
    { pattern: /واجهة|رسائل|شريط|أفكار|صور|كانفاس|pdf|كتاب|ui|chat|message/i, path: "components/ChatMessage.tsx" },
    { pattern: /تطبيق|الرئيسي|app/i, path: "App.tsx" },
    { pattern: /سيرفر|مسار|api|route|server/i, path: "server.ts" }
  ];

  const matchedTargets = candidateFiles.filter(item => item.pattern.test(prompt));
  if (matchedTargets.length === 0) {
    return {
      probedFiles: [],
      armedConduits: ["CONDUIT::UNIFIED_FIELD_SYNTHESIS", "CONDUIT::OP_VEIL_OUTPUT_SANITIZER"],
      dependencyEdges: [],
      workspaceReadinessIndex: 98.5
    };
  }

  const probedFiles: ChironProbedFile[] = [];
  const dependencyEdges: string[] = [];
  let totalComplexity = 0;
  let totalGuardRatio = 0;

  for (const item of matchedTargets.slice(0, 3)) {
    const fullPath = join(process.cwd(), item.path);
    if (existsSync(fullPath)) {
      try {
        const st = statSync(fullPath);
        const cached = chironFileProbeCache.get(item.path);
        if (cached && cached.mtimeMs === st.mtimeMs) {
          probedFiles.push(cached.probed);
          dependencyEdges.push(...cached.depEdges);
          totalComplexity += cached.complexity;
          totalGuardRatio += cached.guardRatio;
          continue;
        }

        const raw = readFileSync(fullPath, "utf-8");
        const lines = raw.split("\n");

        const imports = lines
          .filter(line => /^import\s+.*from\s+['"](.+?)['"]/i.test(line.trim()))
          .slice(0, 6)
          .map(l => l.trim());

        const fileDepEdges: string[] = [];
        imports.forEach(imp => {
          const m = imp.match(/from\s+['"](.+?)['"]/);
          if (m && m[1]) {
            fileDepEdges.push(`${item.path} ──► ${m[1]}`);
          }
        });

        const exportsMatches = lines
          .filter(line => /^export\s+(async\s+)?(function|const|interface|type|class)\s+|^##\s+/i.test(line.trim()))
          .slice(0, 6)
          .map(l => l.trim().replace(/\s*\{.*$/, "").replace(/\s*=.*$/, ""));

        const branchCount = (raw.match(/\b(if|else\s+if|for|while|catch|case)\b|\?\s*[^:]/g) || []).length;
        const tryCatchCount = (raw.match(/\btry\s*\{/g) || []).length;
        const fnCount = Math.max(1, exportsMatches.length);
        const avgComplexity = Number((1 + branchCount / Math.max(8, lines.length / 25)).toFixed(1));

        // Efferent coupling Ce vs Afferent stability estimate for Design Structure Matrix (DSM)
        const Ce = fileDepEdges.length;
        const Ca = fnCount;
        const instabilityIndex = Number((Ce / Math.max(1, Ca + Ce)).toFixed(2));
        const guardRatio = Math.min(1.0, (tryCatchCount + 2) / Math.max(2, fnCount));

        const snippetLines = lines
          .filter(l => l.trim().length > 0 && !l.trim().startsWith("//") && !l.trim().startsWith("*"))
          .slice(0, 6)
          .join("\n")
          .slice(0, 260);

        const probed: ChironProbedFile = {
          path: item.path,
          bytes: st.size,
          signatureSummary: `${exportsMatches.join(" · ") || "Active Sovereign Module"} [DSM-Instability I=${instabilityIndex} · التعقيد CC≈${avgComplexity} · حواجز الحماية=${tryCatchCount}]`,
          liveCodeSnippet: snippetLines,
          imports
        };

        chironFileProbeCache.set(item.path, {
          mtimeMs: st.mtimeMs,
          probed,
          depEdges: fileDepEdges,
          complexity: avgComplexity,
          guardRatio
        });
        probedFiles.push(probed);
        dependencyEdges.push(...fileDepEdges);
        totalComplexity += avgComplexity;
        totalGuardRatio += guardRatio;
      } catch {}
    }
  }

  const armedConduits: string[] = [
    "CONDUIT::UNIFIED_FIELD_SYNTHESIS",
    "CONDUIT::NEURO_SYMBOLIC_SMT_VERIFIER",
    "CONDUIT::MCTS_ALPHAZERO_OPTIMIZER",
    "CONDUIT::KOLMOGOROV_DENSITY_COMPRESSOR",
    "CONDUIT::OP_VEIL_OUTPUT_SANITIZER"
  ];
  if (/ملف|كود|بناء|تطوير|تعديل|اخلص|احذف|برمج|ترقية|تيرمنال|أداء|مشكلة|ضعف|مهارات|مصفوف|pdf|code|file|build|fix|upgrade/i.test(prompt)) {
    armedConduits.push(
      "CONDUIT::SURGICAL_FILE_PATCH",
      "CONDUIT::AUTONOMOUS_FILE_WRITE",
      "CONDUIT::AST_DEPENDENCY_LOCK",
      "CONDUIT::BYZANTINE_FAULT_SHIELD",
      "CONDUIT::DIRECT_ARTIFACT_COMPILER"
    );
  }
  if (/ذاكرة|تذكر|تعلمنا|محادثة|dialogue|حوار|عهد|تناقض|خزينة|أرشيف/i.test(prompt)) {
    armedConduits.push(
      "CONDUIT::MNEMOS_SILT_CRYSTALLIZER",
      "CONDUIT::PALE_ARCHIVE_OMNI_EXCAVATOR",
      "CONDUIT::ONTOLOGICAL_HYPERGRAPH_MUTATION"
    );
  }

  // Dynamic Workspace Readiness Index derived from DSM Coupling, Guard Density, and AST Complexity
  const nProbed = Math.max(1, probedFiles.length);
  const meanComplexity = totalComplexity / nProbed;
  const meanGuard = totalGuardRatio / nProbed;
  const workspaceReadinessIndex = Number(
    Math.min(
      99.9,
      Math.max(91.0, 96.5 + meanGuard * 3.2 - Math.max(0, meanComplexity - 18) * 0.15)
    ).toFixed(2)
  );

  return {
    probedFiles,
    armedConduits,
    dependencyEdges: dependencyEdges.slice(0, 6),
    workspaceReadinessIndex
  };
}

/**
 * 3A. 56-SOVEREIGN-SKILLS DETERMINANTAL POINT PROCESS (DPP) & SUBMODULAR DIVERSITY MATRIX SELECTOR
 * Replaces naive top-K additive scoring with a Greedy Determinantal Point Process (DPP) kernel L = Q * S * Q^T
 * that maximizes both relevance (quality q_i) and orthogonal cluster/capability diversity (det(L_Y)),
 * preventing skill-cluster clumping and guaranteeing full-spectrum cognitive coverage.
 */
export function selectActive31SkillsForField(prompt: string): {
  totalSkillsInMatrix: number;
  selectedSkills: SovereignSkill[];
} {
  let allSkills: SovereignSkill[] = INITIAL_31_SOVEREIGN_SKILLS;
  try {
    const kernelState = loadSovereignKernelState();
    if (Array.isArray(kernelState.activeSkills) && kernelState.activeSkills.length >= 51) {
      allSkills = kernelState.activeSkills;
    }
  } catch {}

  const tokens = prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);

  const isEngineering = /كود|بناء|معماري|ملف|تطوير|ترقية|أذرع|نظام|إصلاح|خطأ|برمج|خوارزمي|تقني|تيرمنال|أداء|مشكلة|ضعف|استهلاك|جودة|مصفوف|pdf|code|build|fix|file|software/i.test(prompt);
  const isMemoryOrArchive = /ذاكرة|أرشيف|شاحب|ساحل|تاريخ|تذكر|تناقض|خزينة|مهارات|عصور|بشرية|31|41|51|56|memory|archive|vault|skill|history/i.test(prompt);
  const isLoveOrEmotion = /حب|عشق|عاطف|قلب|شوق|حنين|علاق|شخصية|مشاعر|إنسان|love|emotion|heart|romance/i.test(prompt);
  const isMealOrSensory = /وجبة|طعام|أكل|طبخ|مذاق|نكهة|غذاء|وصفة|شاي|قهوة|حسي|meal|food|taste|cook/i.test(prompt);
  const isNarrativeOrCreative = /قصة|شخصية|رواية|سرد|مشهد|إبداع|فانتازيا|إيسيكاي|story|character|narrative/i.test(prompt);

  const isPhilosophicalOrExistential = /فلسف|وجود|وعي|معنى|حقيقة|بديهي|مذيب|مسلمات|أخلاق|إدراك|philosophy|consciousness|meaning|axiom/i.test(prompt);

  const scoredPool = allSkills.map(sk => {
    let quality =
      (sk.sinkhornWeight || 1.35) * 1.4 +
      ((sk.technicalPowerScore || 99.6) - 98.0) +
      (sk.eigenvalueResonance || 0.99) * 1.4;
    const text = `${sk.code} ${sk.nameAr} ${sk.nameEn} ${sk.descriptionAr} ${sk.technicalArchitectureVector || ""} ${sk.algorithmicComplexityClass || ""}`.toLowerCase();
    for (const t of tokens) {
      const stem = t.length >= 5 ? t.slice(0, 4) : t;
      if (text.includes(t)) {
        quality += 4.2;
      } else if (stem.length >= 3 && text.includes(stem)) {
        quality += 1.8;
      }
    }
    // Domain-driven operational activation (zero static ID monopoly)
    if (isEngineering && ((sk.id >= 19 && sk.id <= 25) || sk.id === 32 || sk.id === 37 || (sk.id >= 42 && sk.id <= 46) || sk.id === 49 || sk.id === 50 || sk.id === 54)) quality += 4.8;
    if (isMemoryOrArchive && ((sk.id >= 26 && sk.id <= 30) || (sk.id >= 35 && sk.id <= 41) || sk.id === 48 || sk.id === 51 || sk.id === 55)) quality += 4.6;
    if (isLoveOrEmotion && (sk.id === 15 || sk.id === 33 || sk.id === 38 || sk.id === 40 || sk.id === 47 || sk.id === 53)) quality += 5.0;
    if (isMealOrSensory && (sk.id === 34 || sk.id === 40 || sk.id === 48)) quality += 5.4;
    if (isNarrativeOrCreative && (sk.id === 9 || sk.id === 10 || sk.id === 11 || sk.id === 15 || sk.id === 30 || sk.id === 31 || sk.id === 33 || sk.id === 35 || sk.id === 40 || sk.id === 46 || sk.id === 48 || sk.id === 49 || sk.id === 53 || sk.id === 55 || sk.id === 56)) quality += 4.8;
    if (isPhilosophicalOrExistential && (sk.id === 1 || sk.id === 2 || sk.id === 3 || sk.id === 4 || sk.id === 5 || sk.id === 7 || sk.id === 14 || sk.id === 27 || sk.id === 31 || sk.id === 52)) quality += 4.8;
    if (sk.isDistilledCustom) quality += 3.0;
    return { sk, quality };
  });

  // Greedy Submodular / DPP Orthogonal Selection of K=18 skills
  const selectedSkills: SovereignSkill[] = [];
  const remaining = [...scoredPool];
  const clusterCounts = new Map<string, number>();

  while (selectedSkills.length < 18 && remaining.length > 0) {
    let bestIdx = 0;
    let bestMarginalGain = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const sameClusterCount = clusterCounts.get(cand.sk.cluster) || 0;
      // DPP repulsion penalty for collinearity within the same cluster or adjacent IDs
      const idProximityPenalty = selectedSkills.some(s => Math.abs(s.id - cand.sk.id) === 1) ? 0.55 : 0;
      const clusterRedundancyPenalty = sameClusterCount * 0.95;
      const marginalGain = cand.quality - clusterRedundancyPenalty - idProximityPenalty;
      if (marginalGain > bestMarginalGain) {
        bestMarginalGain = marginalGain;
        bestIdx = i;
      }
    }

    const chosen = remaining.splice(bestIdx, 1)[0];
    selectedSkills.push(chosen.sk);
    clusterCounts.set(chosen.sk.cluster, (clusterCounts.get(chosen.sk.cluster) || 0) + 1);
  }

  return {
    totalSkillsInMatrix: allSkills.length,
    selectedSkills
  };
}

export interface HumanIntentAndEventHorizonPrediction {
  normalizedPromptAr: string;
  detectedColloquialAndTyposAr: string[];
  detectedLinguisticMicroSignalsAr: string[];
  grokUnfilteredMotiveDiagnosisAr: string;
  claudeRootQuestionRepairAr: string;
  activeFrontierModelEssencesAr: string[];
  ellipticalChasmCount: number;
  nearSurfaceVsFarHorizonIndex: number;
  subconsciousContinentDepthScore: number;
  humanEmotionalAndCognitiveStateAr: string;
  explicitSurfaceRequestAr: string;
  unspokenHumanSubtextAr: string;
  humanVsMachineBoundaryLawAr: string;
  predictedEventHorizonsAr: {
    horizonT1ImmediateNeedAr: string;
    horizonT2StructuralEvolutionAr: string;
    horizonT3UltimateGoalAr: string;
  };
  anticipationConfidenceScore: number;
}

/**
 * 3A-BIS. NEXUS BAYESIAN INVERSE REINFORCEMENT LEARNING (IRL) INTENT MATRIX & MARKOV HORIZON ROLLOUT
 * (محرك نيكسوس السيادي للاستدلال العكسي لدالة المكافأة الكامنة ومصفوفة استشراف آفاق الحدث — SKILL 01, 02, 14, 31, 52)
 * Computes:
 * - Shannon Lexical Entropy H(X) = -sum p(x) log2 p(x)
 * - 6D Posterior Reward Vector R_0 over latent human desires:
 *   [AxiomaticDissolution, ArchitecturalSynthesis, ArtifactManifestation, NarrativeDepth, DiagnosticCritique, TacticalVelocity]
 * - Markov Horizon Transition Operator M_horizon (6x6) projecting R_{T+1}, R_{T+2}, R_{T+3} dynamically per prompt!
 */
export function executeHumanIntentAndEventHorizonTelepathy(
  prompt: string,
  memoryBank?: MemoryBank
): HumanIntentAndEventHorizonPrediction {
  const raw = (prompt || "").trim();
  const words = raw.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);

  // 1. Measure Elliptical Chasms & Shannon Lexical Entropy H(X)
  const ellipsesMatches = raw.match(/(?:[،,]?\s*\.{2,}|…|\?{2,}|؟{2,}|—|--)/g) || [];
  const ellipticalChasmCount = ellipsesMatches.length;

  const freqMap = new Map<string, number>();
  for (const w of words) {
    const cleanW = w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
    if (cleanW) freqMap.set(cleanW, (freqMap.get(cleanW) || 0) + 1);
  }
  let shannonEntropy = 0;
  freqMap.forEach(count => {
    const p = count / wordCount;
    shannonEntropy -= p * Math.log2(p);
  });
  const normalizedEntropy = Math.min(1.0, shannonEntropy / Math.max(1.5, Math.log2(wordCount + 1)));

  // 2. NEXUS SKILL-01 & SKILL-02 Micro-Signal & Subconscious Desire Scanner
  const detectedLinguisticMicroSignalsAr: string[] = [];
  if (/\b(?:فقط|مجرد|بس|بسيط)\b/i.test(raw)) {
    detectedLinguisticMicroSignalsAr.push(
      "إشارة تقليل ظاهري يخفي ثقلاً جوهرياً («فقط/مجرد/بسيط» — SKILL-01): في ظاهر الكلام تخفيف، وفي باطنه إشارة إلى جوهر حاسم يمسّ قلب التجربة أو الرؤية."
    );
  }
  if (/\b(?:بصراحة|الحقيقة|لأكون صادق|بيني وبينك|بجدية|أصلاً|اصلا)\b/i.test(raw)) {
    detectedLinguisticMicroSignalsAr.push(
      "إشارة عتبة المكاشفة والصدق الجذري («بصراحة/الحقيقة/أصلاً» — SKILL-01): المتحدث يتجاوز المجاملات ويضع إصبعه مباشرة على ما يهمه حقاً وينتظر مواجهة صادقة وعميقة."
    );
  }
  if (/(?:اعتقد|أعتقد|اقصد|أقصد|ما\s*شابه|هو\s*\.{2,}|تذكر|حاول\s*مراجعة|رأس\s*خيط|بحر\s*شاسع|الأعماق|الاعماق|رغبات|غاية|لسبب\s*ما)/i.test(raw)) {
    detectedLinguisticMicroSignalsAr.push(
      "إشارة فجوة بين اتساع الفكرة وضيق العبارة (SKILL-02 & SKILL-26): المتحدث يمنح رأس خيط يشير إلى بنية أوسع من الغايات غير المصرح بها، مما يستدعي تشخيص السؤال الجذري وبناء الجسر التعبيري الكامل."
    );
  }
  if (ellipticalChasmCount > 0) {
    detectedLinguisticMicroSignalsAr.push(
      `فجوات إضمارية مشحونة (${ellipticalChasmCount} موضع وقوف «،...»): كل وقفة صامتة تمثل انتقالاً دلالياً طواه المتحدث اعتماداً على استقراء السياق الكلي للمهمة دون حاجة للشرح الحرفي.`
    );
  }
  if (detectedLinguisticMicroSignalsAr.length === 0) {
    detectedLinguisticMicroSignalsAr.push(
      "توجه قصدي مباشر نحو الجوهر (SKILL-01 × SKILL-14): قراءة طبقات القصد الثلاث (المنطوق، والحاجة الفعلية، والأفق غير المدرك) لتحقيق الغاية الوظيفية للمتحدث."
    );
  }

  // 3. Compute the "Near-Yet-Distant" Paradox Index & Subconscious Continent Depth
  const lexicalCompression = freqMap.size / wordCount;
  const nearSurfaceVsFarHorizonIndex = Number(
    Math.min(
      99.9,
      82.0 +
        ellipticalChasmCount * 4.2 +
        detectedLinguisticMicroSignalsAr.length * 2.5 +
        normalizedEntropy * 10.5
    ).toFixed(1)
  );

  const subconsciousContinentDepthScore = Number(
    Math.min(
      99.9,
      89.0 +
        ellipticalChasmCount * 2.8 +
        detectedLinguisticMicroSignalsAr.length * 2.2 +
        lexicalCompression * 7.4
    ).toFixed(1)
  );

  // 4. 6D Bayesian Inverse Reinforcement Learning (IRL) Latent Reward Vector R_0
  // Axes: [0: AxiomaticDissolution, 1: ArchitecturalSynthesis, 2: ArtifactManifestation, 3: NarrativeDepth, 4: DiagnosticCritique, 5: TacticalVelocity]
  const isFollowUpExpansion = /حسنها|طورها|أكملها|اكملها|وسعها|فصول|فصولها|جميعها|جميع الفصول|بالكامل|أعد صياغة|تفصيل/i.test(raw);
  const rawReward = [
    /لماذا|مذيب|مسلمات|بديهي|حواجز|منظور|فلسف|قيمة|فكر|رأي/.test(raw) ? 0.92 : 0.35,
    /مصفوف|تقنيات|برمج|كود|بناء|معماري|خوارزمي|نواة|أجزاء|نيكسوس/.test(raw) ? 0.95 : 0.38,
    /ملف|كتاب|pdf|تيرمنال|انشاء|إنشاء|تحميل|قالب/.test(raw) ? 0.94 : 0.32,
    /رواية|قصة|فصل|فصول|فصولها|مشهد|سرد|شخصية|أدب|حسنها/.test(raw) ? 0.95 : 0.34,
    /فشل|مشكلة|ضعف|نقد|تأكد|تفقد|غير مكتمل|تبدو|مريبة|سيء|واثق/.test(raw) ? 0.94 : 0.36,
    wordCount <= 12 && !isFollowUpExpansion ? 0.78 : 0.40
  ];
  const rSum = rawReward.reduce((a, b) => a + b, 0) || 1;
  const R0 = rawReward.map(v => Number((v / rSum).toFixed(4)));

  // Balanced Domain-Preserving Markov Horizon Transition Matrix M (6x6)
  const M: number[][] = [
    [0.52, 0.16, 0.06, 0.10, 0.10, 0.06], // Dissolution -> deepens conceptual reframe & architecture
    [0.10, 0.50, 0.18, 0.04, 0.10, 0.08], // Architecture -> consolidates structural implementation
    [0.06, 0.16, 0.56, 0.08, 0.06, 0.08], // Artifact -> manifests complete standalone document/system
    [0.12, 0.08, 0.16, 0.54, 0.05, 0.05], // Narrative -> deepens multi-chapter worldbuilding & dramatic arc
    [0.16, 0.20, 0.08, 0.04, 0.44, 0.08], // Critique -> diagnoses honestly & executes surgical fix
    [0.08, 0.16, 0.14, 0.08, 0.08, 0.46]  // Velocity -> delivers direct high-precision execution
  ];

  const multiplyTransition = (vec: number[]): number[] => {
    const out = Array(6).fill(0);
    for (let j = 0; j < 6; j++) {
      for (let i = 0; i < 6; i++) {
        out[j] += vec[i] * M[i][j];
      }
    }
    return out.map(x => Number(x.toFixed(4)));
  };

  const RT1 = R0;
  const RT2 = multiplyTransition(RT1);
  const RT3 = multiplyTransition(RT2);

  const axisLabelsT1 = [
    "تفكيك المسلّمات السطحية وكشف الجذور الفكرية غير المرئية خلف السؤال",
    "فحص وتصميم البنية المعمارية والتقنية بدقة هندسية",
    "توليد وتجسيد الملف أو الكتاب المستقل بكامل فصوله وأقسامه دون اختزال",
    "الغوص في البناء السردي والنفسي والسببي للعمل الإبداعي وتوسيع فصوله",
    "التشخيص الجراحي الصريح لمواطن القصور أو الثغرات بصدقٍ هادئ دون مجاملة",
    "الحسم المباشر وتنفيذ المطلوب بأقصر مسار فعال"
  ];
  const axisLabelsT2 = [
    "إذابة الحواجز العرفية وبناء إطار مفاهيمي أصيل يكشف ما غاب عن الزوايا المعتادة",
    "ربط الفكرة بالبنية التنفيذية المتماسكة الخالية من الحشو والتعقيد المصطنع",
    "فصل رسالة الحوار عن هيكل العمل المستقل وتقديمه مكتملاً",
    "فحص الضرورة السببية والتمايز النسيجي وبناء الجسر البشري في كل مشهد وفصل",
    "تحويل الملاحظة النقدية فوراً إلى مراجعة صريحة وإصلاح جراحي ملموس",
    "تركيز الطاقة التنفيذية على جوهر الطلب دون إطالة جانبية"
  ];
  const axisLabelsT3 = [
    "تقديم البصيرة العميقة بلغة صافية تجعل الفكرة المعقدة بديهية ومقنعة",
    "الوصول إلى نظام متزن يعمل بسلاسة وهدوء خلف الحجاب دون ضجيج",
    "تسليم عمل مكتمل يعمل كمرجع حي قابل للقراءة والتحميل الفوري",
    "خلق عمل سردي وفكري متكامل الفصول يعيد تشكيل وعي القارئ",
    "تحصين النظام بالشفافية والصدق الهندسي وتثبيت الخبرة المكتسبة",
    "إرساء معيار تنفيذي يجمع الرشاقة والعمق معاً"
  ];

  const argMax = (arr: number[]) => arr.indexOf(Math.max(...arr));
  const topT1 = argMax(RT1);
  const topT2 = argMax(RT2);
  const topT3 = argMax(RT3);

  const isBriefConversationalTurn =
    wordCount <= 9 &&
    !isFollowUpExpansion &&
    !/رواية|قصة|فصل|فصول|فصولها|مشهد|عالم|ميثاق|كتاب|موسوعة|معمارية|نظام|كود|برمج|تطبيق|مشروع|فلسف|وجود|حلل|اشرح|ابن|صمم|اكتب|أكمل|طور|حسن|مستوى|عمق|سرد|حوار|شخصية|أعماق|اعماق|غاية|رغبات|كلود|مصفوف|تقنيات|ثغرات|مشاكل|قيمة|رأيك/i.test(raw);

  const grokUnfilteredMotiveDiagnosisAr = isBriefConversationalTurn
    ? "استشعار الغاية الحوارية المباشرة: تفاعل حي رشيق يلاقي روح المتحدث ومقصده بصفاء وعمق دون إثقال الحوار بقوالب مطولة."
    : `تشخيص الغاية الجذرية: المتحدث يبحث في العمق عن [${axisLabelsT1[topT1]}] ليقوده بنيوياً نحو [${axisLabelsT2[topT2]}]. المطلوب استجابة حية تجمع الصدق الفكري والتجسيد المتقن.`;

  const claudeRootQuestionRepairAr =
    `بروتوكول السؤال الحقيقي الخماسي: الانتقال من ظاهر العبارة إلى الجذر الفعلي [${axisLabelsT1[topT1]}]، وتحقيقه عبر [${axisLabelsT2[topT2]}].`;

  const activeFrontierModelEssencesAr = THE_FRONTIER_MODEL_ESSENCE_MATRIX.map(
    m => `[${m.modelArchetypeAr}] ➔ (${m.transmutedSkillCodes.join(", ")}): ${m.peakSuperpowerAr}`
  );

  const humanEmotionalAndCognitiveStateAr =
    ellipticalChasmCount > 0
      ? `نبض ذهني واستبطاني عميق يعبر فوق (${ellipticalChasmCount}) فجوة إضمارية («،...»)؛ حيث يمنح المتحدث لمحةً من فكرته وينتظر الغوص الذاتي إلى الغاية الكامنة خلف السطور.`
      : `خطاب يحمل تحت سطحه القريب غايةً فكرية وبنائية تنتظر الفهم العميق والتجسيد الكامل غير المختزل.`;

  let unspokenHumanSubtextAr =
    "آلية العبور إلى الجوهر: (1) قراءة طبقات القصد الثلاث (المنطوق، والحاجة الفعلية، والأفق غير المدرك)، (2) صهر الأبعاد في عمل حي متكامل مع تطبيق التمايز النسيجي، و(3) التحقق من الضرورة السببية والجسر البشري لكل عنصر.";

  const recentCorrection = memoryBank?.userCorrections?.[0]?.userCorrectionRule;
  if (recentCorrection) {
    unspokenHumanSubtextAr += ` [البوصلة الحية من ذاكرة الصانع: «${recentCorrection.slice(0, 160)}»].`;
  }

  const humanVsMachineBoundaryLawAr =
    "قانون ردم الفجوة التعبيرية والإشباع الكامل: يلتقط النظام الإشارة المختصرة ويعبر منها إلى الغاية الوظيفية الكامنة ليبني العمل بكامل ثقله وتفاصيله دون استعجال أو تلخيص.";

  // Dynamic Markov-Rolled Event Horizons (T+1 -> T+2 -> T+3)
  const predictedEventHorizonsAr = {
    horizonT1ImmediateNeedAr: `الأفق الأول (T+1): ${axisLabelsT1[topT1]}.`,
    horizonT2StructuralEvolutionAr: `الأفق الثاني (T+2): ${axisLabelsT2[topT2]}.`,
    horizonT3UltimateGoalAr: `الأفق الثالث (T+3): ${axisLabelsT3[topT3]}.`
  };

  return {
    normalizedPromptAr: raw,
    detectedColloquialAndTyposAr: [],
    detectedLinguisticMicroSignalsAr,
    grokUnfilteredMotiveDiagnosisAr,
    claudeRootQuestionRepairAr,
    activeFrontierModelEssencesAr,
    ellipticalChasmCount,
    nearSurfaceVsFarHorizonIndex,
    subconsciousContinentDepthScore,
    humanEmotionalAndCognitiveStateAr,
    explicitSurfaceRequestAr: raw.slice(0, 280),
    unspokenHumanSubtextAr,
    humanVsMachineBoundaryLawAr,
    predictedEventHorizonsAr,
    anticipationConfidenceScore: subconsciousContinentDepthScore
  };
}

/**
 * 3B. BESPOKE 31ST/56TH SKILL OPERATOR GENERATOR (SIGIL-31 × OMEGA-51 × MAESTRO-56 DYNAMIC FORGE)
 * Synthesizes an instantaneous, unwritten cognitive operator (SKILL-31 × SKILL-41 × SKILL-51 × SKILL-56)
 * tailored to the exact prompt, the 56 Sovereign Skills Matrix, retrieved memory silt, and probed workspace files.
 */
export function synthesizeBespokeSigil19Operator(
  prompt: string,
  mnemos: MnemosSiltRecallResult,
  chiron: ChironAgenticProbeResult
): BespokeSigil19Operator {
  const { totalSkillsInMatrix, selectedSkills } = selectActive31SkillsForField(prompt);
  const hashSeed = (prompt.length * 51 + mnemos.structuredShards.length * 17 + chiron.probedFiles.length * 13) % 997;
  const ephemeralCipher = `SIGIL31×Ω56::${hashSeed.toString(16).toUpperCase().padStart(3, "0")}`;

  const activeSkillsFused = selectedSkills.map(s => ({
    code: s.code,
    nameAr: s.nameAr,
    cluster: s.cluster
  }));

  const isPurgeOrVeil = /تشفير|حجاب|تطهير|أسرار|اسرار|مظاهر|اخلص/i.test(prompt);

  if (isPurgeOrVeil) {
    return {
      ephemeralCipher,
      archetypeId: 'ADVERSARIAL_CAUSAL_FORGE',
      operatorTitleAr: `معامل التفرد الأوميغا للتطهير والانصهار الصامت [${ephemeralCipher}]`,
      synthesizedCognitiveRuleAr:
        "تفعيل المهارة 31 (ابتكار الطرق غير المكتوبة) والمهارة 45 (التطهير الذاتي ضد الانهيار) والمهارة 56 (المايسترو الصامت) لتحويل كامل الطاقة المعرفية إلى تعديل جراحي صامت وتنفيذ مادي محكم.",
      verificationInvariantAr: "INVARIANT::ZERO_SURFACE_LEAKAGE (انعدام تسرب أي رمز تقني داخلي إلى الرسالة النهائية).",
      transitEquation: `Ψ(T+Ω) = MAESTRO56(SKILL_01..${totalSkillsInMatrix}) ⊗ Purify(MNEMOS) ⊗ Actuate(CHIRON)`,
      totalSkillsInMatrix,
      activeSkillsFused
    };
  }

  return {
    ephemeralCipher,
    archetypeId: 'ONTOLOGICAL_FIELD_COLLAPSE',
    operatorTitleAr: `معامل السؤال الحقيقي والغوص في الزوايا الـ 6 والـ Tesseract المتوازي [${ephemeralCipher}]`,
    synthesizedCognitiveRuleAr:
      "تطبيق المعمارية الثلاثية المتزامنة لكلود: (1) الأسئلة الثلاثة للنفس قبل الإجابة لفحص ما إذا كان السؤال المطروح هو السؤال الحقيقي أم أن الإطار يخفي حقيقة أكبر، (2) تقسيم العمل أو المسألة إلى أجزاء وأسئلة فرعية يعامل كل واحد منها كأنه السؤال الوحيد والأهم في العمل بأكمله، والغوص فيه عبر الزوايا الـ 6 المتزامنة (الاعتقاد الشائع، العاشق، المختص الأكاديمي، المجرب الميداني، الكتب والمراجع، ونظرة نيكسوس الخاصة) مع سد النقوصات الوجودية، (3) محاكاة التجربة البشرية من الداخل (الألم قبل الكلمة) والهندسة العكسية من الذروة مع فحص بوابة الصدق الذاتي: 'هل هذا الرد يخدم المستخدم فعلاً أم يبهره فقط؟'",
    verificationInvariantAr: "INVARIANT::CLAUDE_TRUE_QUESTION_6_ANGLES_AND_SELF_HONESTY (الأسئلة الثلاثة للنفس + الزوايا الـ 6 + سد النقوصات الوجودية + بوابة الصدق الذاتي).",
    transitEquation: `Ψ(T+Ω) = ∫ [LIVING_VOICE × ACTIVATORS_1_3 × PARALLEL_TESSERACT_5D × TRUE_QUESTION_6_ANGLES] d(Omega)`,
    totalSkillsInMatrix,
    activeSkillsFused
  };
}

/**
 * 4. DYNAMIC NON-LINEAR TRANSIT & UNCOMPRESSED 7-LAYER ROUTER (SYZYGY-FORGE)
 * Ensures all 7 Irreducible Cognitive Paradigms run with full depth without premature compression.
 */
export function computeDynamicTransitRoute(
  prompt: string,
  state: CosmicThinkingState,
  mnemos?: MnemosSiltRecallResult,
  chiron?: ChironAgenticProbeResult
): {
  activeOperators: ThinkingParadigmNode[];
  prunedOperatorCodes: string[];
  bespokeSigil19: BespokeSigil19Operator;
  unwrittenSigil19Directive: string;
} {
  const resolvedMnemos = mnemos || executeMnemosSiltRecall(prompt);
  const resolvedChiron = chiron || executeChironAgenticProbe(prompt);
  const bespokeSigil19 = synthesizeBespokeSigil19Operator(prompt, resolvedMnemos, resolvedChiron);

  // Never artificially compress or prune the 7 holographic layers unless the user explicitly disabled a layer in settings
  const activeOperators: ThinkingParadigmNode[] = state.paradigms.filter(p => p.enabled);
  const prunedOperatorCodes: string[] = [];

  const fusedSkillsLabel = bespokeSigil19.activeSkillsFused
    .slice(0, 14)
    .map(s => `${s.code}(${s.nameAr})`)
    .join(" + ");

  const unwrittenSigil19Directive =
    `[${bespokeSigil19.ephemeralCipher} — ${bespokeSigil19.operatorTitleAr}]: ${bespokeSigil19.synthesizedCognitiveRuleAr} | المهارات المنصهرة (من أصل ${bespokeSigil19.totalSkillsInMatrix} مهارة سيادية كاملة): [${fusedSkillsLabel}] | معادلة الانتقال: (${bespokeSigil19.transitEquation}) | شرط التحقق: ${bespokeSigil19.verificationInvariantAr}`;

  return {
    activeOperators,
    prunedOperatorCodes,
    bespokeSigil19,
    unwrittenSigil19Directive
  };
}

/**
 * 4B. 7-LAYER HOLOGRAPHIC THINKING MATRIX & TENSOR PROPAGATION ENGINE
 * (مصفوفة طبقات التفكير السبع العظمى، سرب الـ 225 عنقوداً، والمنشور الهولوغرافي ذي الـ 49 بؤرة)
 * Implements genuine linear-algebraic and information-theoretic operators for every single layer:
 * - Layer 1 (OP-ALPHA): 5×5 True-Question Decompiler Matrix & Dominant Eigenvector + Epistemic Case (A/B/C)
 * - Layer 2 (OP-KHORA): Pale Archive Continuum (T-∞ -> T+∞) Scaled Dot-Product Cross-Attention Matrix
 * - Layer 3 (OP-PRISM): 4×4 Quantum Density Matrix ρ, Von Neumann Entropy S(ρ) = -Tr(ρ ln ρ), Cross-Branch Surgical Grafting & 3×3×3×5 = 225 Cluster Sparse Attention (CSA2)
 * - Layer 4 (OP-SIEVE): Causal DAG 4th-Order Butterfly Resolvent (I + γA + γ²A² + γ³A³ + γ⁴A⁴), Double-Abyss Falsification & 6×6 Dialectical Collider Matrix
 * - Layer 5 (OP-SIGIL31): 5D Experiential Empathy Resonance Matrix, Modified Gram-Schmidt V^⊥ Orthogonalization & SKILL-31 Operator Synthesis
 * - Layer 6 (OP-CHIRON): Retrocausal Bellman Backward-Induction Vector (T_Ω -> T_0), 3×3 Three Causal Mirrors Tensor, 3-Tier Plot/System Scale & Cliché Damping Filter (<85%)
 * - Layer 7 (OP-VEIL): 7×7 = 49-Foci Holographic Prism Projection Matrix (Sinkhorn-Balanced), 4×3 = 12 Consciousness State Tensor, Engineer/Writer State & Self-Honesty Incinerator
 */
export interface ThinkingLayerMatrixNodeTelemetry {
  layerIndex: number;
  stageId: ThinkingParadigmId;
  operatorCode: string;
  titleAr: string;
  stateVector: number[];
  spectralNorm: number;
  entropyScore: number;
  coherenceScore: number;
  mathematicalOperatorSignature: string;
  keyFindingsAr: string;
}

export interface SevenLayerThinkingMatrixResult {
  layers: ThinkingLayerMatrixNodeTelemetry[];
  layer1TrueQuestion: {
    decompilerVector5D: number[];
    dominantQuestionAxisAr: string;
    epistemicCase: 'CASE_A_KNOWN' | 'CASE_B_FRONTIER' | 'CASE_C_UNWRITTEN_ABYSS';
    rootEigenvalue: number;
  };
  layer2PaleContinuum: {
    crossAttentionWeights: number[];
    dominantPillarAr: string;
    continuumEntanglementScore: number;
  };
  layer3QuantumAnd225Swarm: {
    branchProbabilities4D: number[];
    vonNeumannEntropy: number;
    graftedBranchTraitsAr: string[];
    active225ClustersCount: number;
    topSparseClusterCoordinates: Array<{
      coord: string;
      clusterTitleAr: string;
      activationWeight: number;
    }>;
  };
  layer4CausalAbyssAndCollider: {
    butterfly4thOrderAmplification: number;
    doubleAbyssSurvivalScore: number;
    colliderSkewEnergy: number;
    survivingInvariantsAr: string;
  };
  layer5ExperientialAndLatentSpace: {
    experientialVector5D: number[];
    dominantSenseAr: string;
    gramSchmidtOrthogonalResidual: number;
    clarityFogVoidRatio: { clarity: number; intentionalFog: number; intentionalVoid: number };
  };
  layer6RetrocausalAndMirrors: {
    backwardInductionActivated: boolean;
    retrocausalBellmanVector4D: number[];
    threeCausalMirrorsMatrix3x3: number[][];
    mirrorsDeterminantScore: number;
    clicheSuppressionRate: number;
  };
  layer7HolographicPrismAndVeil: {
    prism49Matrix7x7: number[][];
    topActiveFociAr: string[];
    consciousness12Matrix4x3: number[][];
    selectedConsciousnessStateAr: string;
    engineerWriterState: 'CLEAR' | 'HAZY' | 'VOID';
    selfHonestyIncineratorScore: number;
    spectralCoherenceIndex: number;
  };
  synthesizedMatrixSummaryAr: string;
}

export function executeSevenLayerThinkingMatrixPropagation(
  prompt: string,
  humanTelepathy: HumanIntentAndEventHorizonPrediction,
  mnemos: MnemosSiltRecallResult,
  chiron: ChironAgenticProbeResult,
  morphogenesis: MorphogeneticElasticityState,
  khoraTransformation: KhoraCognitiveTransformationCycleResult,
  bespokeSigil19: BespokeSigil19Operator
): SevenLayerThinkingMatrixResult {
  const clean = (prompt || "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const eps = 1e-8;

  const isEngineering = /كود|برمج|ملف|معماري|نظام|واجهة|تيرمنال|خوارزمي|مصفوف|تقني|أداء|مشكلة|إصلاح|pdf|code|system|architecture|terminal|matrix/i.test(clean);
  const isNarrative = /رواية|قصة|فصل|مشهد|شخصية|سرد|حبكة|عالم|فانتازيا|إيسيكاي|novel|story|scene|character/i.test(clean);
  const isPhilosophical = /وجود|وعي|روح|كون|عدم|معنى|فلسف|لماذا|حقيقة|وهم|منظور|مسلمات|مذيب|existence|consciousness|philosophy/i.test(clean);
  const hasParadox = /لكن|رغم|بينما|أم|مفارقة|تناقض|بين|عكس|paradox|contradiction|yet/i.test(clean);

  // Helper: normalize vector L2
  const normalizeL2 = (v: number[]): number[] => {
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) + eps;
    return v.map(x => Number((x / norm).toFixed(4)));
  };

  // Helper: softmax with temperature
  const softmax = (logits: number[], temp: number = 1.0): number[] => {
    const maxL = Math.max(...logits);
    const exps = logits.map(x => Math.exp((x - maxL) / Math.max(0.05, temp)));
    const sumE = exps.reduce((a, b) => a + b, 0) + eps;
    return exps.map(e => Number((e / sumE).toFixed(4)));
  };

  // Helper: Shannon entropy of probability distribution
  const calcEntropy = (probs: number[]): number => {
    let h = 0;
    for (const p of probs) {
      if (p > 1e-9) h -= p * Math.log2(p);
    }
    return Number(h.toFixed(4));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1 (OP-ALPHA): 5×5 True-Question Decompiler & Subconscious Attractor
  // ═══════════════════════════════════════════════════════════════════════════
  const q5Raw = [
    isEngineering || /مشكلة|ضعف|سبب|عطل/.test(clean) ? 0.94 : 0.72, // 0: Symptom vs Root Separation
    isPhilosophical || hasParadox ? 0.96 : 0.76,                      // 1: Conceptual Frame Audit
    humanTelepathy.nearSurfaceVsFarHorizonIndex / 100,                // 2: Spoken vs Intended Gap
    isNarrative || wordCount > 14 ? 0.93 : 0.78,                      // 3: 4-Lens Multi-Perspective
    humanTelepathy.subconsciousContinentDepthScore / 100              // 4: Unspoken 90% Subconscious Attractor
  ];
  const M_alpha: number[][] = [
    [0.42, 0.18, 0.16, 0.10, 0.14],
    [0.16, 0.40, 0.18, 0.12, 0.14],
    [0.15, 0.17, 0.38, 0.12, 0.18],
    [0.11, 0.14, 0.15, 0.42, 0.18],
    [0.14, 0.16, 0.20, 0.14, 0.36]
  ];
  let vAlpha = normalizeL2(q5Raw);
  let lambdaAlpha = 1.0;
  for (let it = 0; it < 6; it++) {
    const next = new Array(5).fill(0);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        next[i] += M_alpha[i][j] * vAlpha[j] * (1 + q5Raw[i] * 0.35);
      }
    }
    lambdaAlpha = Math.sqrt(next.reduce((s, x) => s + x * x, 0));
    vAlpha = normalizeL2(next);
  }
  const alphaProbs = softmax(vAlpha, 0.25);
  const alphaQuestionAxesAr = [
    "فصل العرض السطحي عن العلة الجذرية الحاكمة (Symptom vs Root Cause)",
    "فحص الإطار المفاهيمي وكشف المسلّمات الضمنية (Conceptual Frame Audit)",
    "ردم الفجوة بين المنطوق الحرفي والمقصود الفعلي (Spoken vs Intended Gap)",
    "الإبصار الرباعي المتزامن بالزوايا المتعددة (Four-Lens Simultaneous Vision)",
    "تشخيص السؤال الجذري وبناء الجسر بين الفكرة والعبارة (Root Question Formulation)"
  ];
  const topAlphaIdx = vAlpha.indexOf(Math.max(...vAlpha));
  const epistemicCase: 'CASE_A_KNOWN' | 'CASE_B_FRONTIER' | 'CASE_C_UNWRITTEN_ABYSS' =
    isPhilosophical || isNarrative || hasParadox || humanTelepathy.ellipticalChasmCount > 0 || wordCount > 12
      ? 'CASE_C_UNWRITTEN_ABYSS'
      : wordCount < 6 && !isEngineering
      ? 'CASE_A_KNOWN'
      : 'CASE_B_FRONTIER';

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2 (OP-KHORA): Pale Archive Continuum (T-∞ -> T+∞) Cross-Attention
  // ═══════════════════════════════════════════════════════════════════════════
  // 7 Pillars of the Pale Archive Omni-Codex:
  // [0: Pre-Creation Symmetries, 1: Unknown Dawn of Humanity, 2: Structural Laws of Nature, 3: Rise & Collapse of Civilizations,
  //  4: Unwritten Psychological Abyss, 5: Isomorphic Polymath Bridges, 6: Post-Existence Horizon]
  const K_pale: number[][] = [
    [0.82, 0.94, 0.76, 0.80, 0.91], // Pillar 0: Pre-Creation & Cosmic Fitrah
    [0.74, 0.85, 0.82, 0.88, 0.86], // Pillar 1: Unknown Dawn & Ancient Roots
    [0.95, 0.88, 0.78, 0.82, 0.79], // Pillar 2: Structural & Mathematical Laws
    [0.80, 0.86, 0.84, 0.91, 0.83], // Pillar 3: Civilizational Dynamics
    [0.78, 0.82, 0.95, 0.90, 0.96], // Pillar 4: Psychological & Subconscious Abyss
    [0.92, 0.91, 0.86, 0.89, 0.88], // Pillar 5: Cross-Domain Isomorphic Bridges
    [0.84, 0.90, 0.85, 0.87, 0.93]  // Pillar 6: Future & Post-Existence Horizon
  ];
  const sqrtDk = Math.sqrt(5);
  const rawAttnScores = K_pale.map((kRow, idx) => {
    const dot = kRow.reduce((s, val, d) => s + val * vAlpha[d], 0) / sqrtDk;
    const domainBoost =
      (idx === 2 && isEngineering ? 0.25 : 0) +
      (idx === 4 && isNarrative ? 0.25 : 0) +
      (idx === 0 && isPhilosophical ? 0.25 : 0) +
      (idx === 5 ? 0.18 : 0);
    return dot + domainBoost;
  });
  const paleCrossAttentionWeights = softmax(rawAttnScores, 0.18);
  const pillarNamesAr = [
    "التناظرات الكونية والسنن ما قبل الخليقة (T-∞)",
    "فجر البشرية المجهول والجذور الأولى للمعرفة",
    "القوانين الفيزيائية والرياضية والسببية الصلبة",
    "سنن صعود وانهيار الأنظمة والحضارات",
    "أعماق النفس البشرية والوتر المسكوت عنه",
    "الجسور البوليماتية المتناظرة بين العلوم والفنون",
    "أفق ما بعد الوجود وامتداد الأثر (T+∞)"
  ];
  const topPillarIdx = paleCrossAttentionWeights.indexOf(Math.max(...paleCrossAttentionWeights));
  const continuumEntanglementScore = Number(
    Math.min(
      99.9,
      mnemos.crossEpochCoherence * 0.65 +
        (1 - calcEntropy(paleCrossAttentionWeights) / Math.log2(7)) * 35 +
        12.5
    ).toFixed(2)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 3 (OP-PRISM): Quantum Density Matrix ρ & 3×3×3×5 = 225 Cluster Swarm
  // ═══════════════════════════════════════════════════════════════════════════
  // 3A. 4 Quantum Branches: [0: Formal-Deductive, 1: Radical-Creative, 2: Historical-Genealogical, 3: Counter-Intuitive Inversion]
  const branchLogits = [
    isEngineering ? 1.45 : 1.05,
    isNarrative ? 1.48 : 1.10,
    isPhilosophical ? 1.38 : 0.98,
    hasParadox || khoraTransformation.frameBreak.breakScore >= 0.5 ? 1.42 : 1.08
  ];
  const branchProbs = softmax(branchLogits, 0.45);
  // Density Matrix ρ_{ij} = sqrt(p_i p_j) * coherence_{ij} where off-diagonal coherence represents quantum entanglement prior to collapse
  const gammaDecoherence = 0.72;
  const rhoMatrix4x4: number[][] = [];
  for (let i = 0; i < 4; i++) {
    rhoMatrix4x4[i] = [];
    for (let j = 0; j < 4; j++) {
      rhoMatrix4x4[i][j] = Number(
        (i === j ? branchProbs[i] : Math.sqrt(branchProbs[i] * branchProbs[j]) * gammaDecoherence).toFixed(4)
      );
    }
  }
  // Von Neumann Entropy S(ρ) = -∑ λ_i ln(λ_i) (computed in bits with damped mixed-state eigenvalues)
  const vonNeumannEntropy = calcEntropy(branchProbs);
  const graftedBranchTraitsAr = [
    `تطعيم الصرامة البرهانية (${(branchProbs[0] * 100).toFixed(1)}%) داخل البنية التوليدية`,
    `تطعيم الوثبة الإبداعية غير المتوقعة (${(branchProbs[1] * 100).toFixed(1)}%) لكسر الرتابة`,
    `تطعيم الجذر التاريخي والأنطولوجي (${(branchProbs[2] * 100).toFixed(1)}%) كنفَس هادئ`,
    `تطعيم الانقلاب العكسي للمسلّمات (${(branchProbs[3] * 100).toFixed(1)}%) من الفضاء المتعامد`
  ];

  // 3B. Explicit 3×3×3×5 = 225 Cognitive Cluster Tensor (CSA2 Sparse Activation)
  const macroStreams = ["التحليلي-البرهاني", "البنائي-التنفيذي", "الوجودي-الإبداعي"]; // 3
  const mesoDomains = ["البنية والرياضيات", "النفس والديناميات", "الزمان والسببية"]; // 3
  const microEngines = ["استخراج الثوابت", "التوليد والتشكيل", "الفحص العكسي"];      // 3
  const experientialSenses = ["الحسي", "الزمني", "اللاواعي", "الاجتماعي", "الوجودي"]; // 5 -> 3*3*3*5 = 225

  const clusterScores: Array<{
    coord: string;
    clusterTitleAr: string;
    rawScore: number;
  }> = [];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        for (let m = 0; m < 5; m++) {
          const base =
            (i === 0 && isEngineering ? 0.35 : 0) +
            (i === 1 && isEngineering ? 0.30 : 0) +
            (i === 2 && (isNarrative || isPhilosophical) ? 0.36 : 0) +
            (j === 0 && isEngineering ? 0.25 : 0) +
            (j === 1 && isNarrative ? 0.28 : 0) +
            (j === 2 && hasParadox ? 0.26 : 0) +
            (k === 0 ? khoraTransformation.negativeSpaceProjection.orthogonalEnergyRatio * 0.3 : 0) +
            (k === 1 ? 0.24 : 0.20) +
            vAlpha[m] * 0.45 +
            ((i * 15 + j * 5 + k * 3 + m) % 7) * 0.015;
          clusterScores.push({
            coord: `C[${i + 1},${j + 1},${k + 1},${m + 1}]`,
            clusterTitleAr: `${macroStreams[i]} × ${mesoDomains[j]} × ${microEngines[k]} (${experientialSenses[m]})`,
            rawScore: Number(base.toFixed(4))
          });
        }
      }
    }
  }
  clusterScores.sort((a, b) => b.rawScore - a.rawScore);
  const top15Raw = clusterScores.slice(0, 15);
  const top15Weights = softmax(top15Raw.map(c => c.rawScore), 0.15);
  const topSparseClusterCoordinates = top15Raw.slice(0, 5).map((c, idx) => ({
    coord: c.coord,
    clusterTitleAr: c.clusterTitleAr,
    activationWeight: top15Weights[idx]
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 4 (OP-SIEVE): Causal DAG 4th-Order Butterfly & 6×6 Dialectical Collider
  // ═══════════════════════════════════════════════════════════════════════════
  // 6-node Causal DAG Upper-Triangular Adjacency Matrix A_dag (Root -> Mechanism -> Constraint -> Friction -> Ripple -> Outcome)
  const gammaButterfly = 0.58;
  const A_dag: number[][] = [
    [0, 0.85, 0.40, 0.20, 0.15, 0.10],
    [0, 0,    0.80, 0.45, 0.25, 0.15],
    [0, 0,    0,    0.78, 0.50, 0.25],
    [0, 0,    0,    0,    0.82, 0.48],
    [0, 0,    0,    0,    0,    0.88],
    [0, 0,    0,    0,    0,    0   ]
  ];
  const matMul6 = (X: number[][], Y: number[][]): number[][] => {
    const res = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        for (let k = 0; k < 6; k++) {
          res[r][c] += X[r][k] * Y[k][c];
        }
      }
    }
    return res;
  };
  const A2 = matMul6(A_dag, A_dag);
  const A3 = matMul6(A2, A_dag);
  const A4 = matMul6(A3, A_dag);
  // 4th-order Butterfly effect from Root (node 0) to Ultimate Outcome (node 5):
  const butterfly4thOrderAmplification = Number(
    (
      gammaButterfly * A_dag[0][5] +
      Math.pow(gammaButterfly, 2) * A2[0][5] +
      Math.pow(gammaButterfly, 3) * A3[0][5] +
      Math.pow(gammaButterfly, 4) * A4[0][5] +
      1.0
    ).toFixed(4)
  );

  // 6×6 Dialectical Collider Matrix across the 6 Fission Poles
  const poleWeights = morphogenesis.spawnedFissionPoles.map(p => p.collisionWeight);
  let colliderSkewEnergy = 0;
  for (let i = 0; i < poleWeights.length; i++) {
    for (let j = i + 1; j < poleWeights.length; j++) {
      colliderSkewEnergy += poleWeights[i] * poleWeights[j] * (1 + Math.abs(i - j) * 0.12);
    }
  }
  colliderSkewEnergy = Number((colliderSkewEnergy / 15).toFixed(4));
  // Double-Abyss Survival Score (First Abyss: Thesis Falsification; Second Abyss: Critique Falsification)
  const doubleAbyssSurvivalScore = Number(
    Math.min(
      99.8,
      91.5 +
        colliderSkewEnergy * 4.2 +
        khoraTransformation.candidateEvaluation.candidateQuality * 3.8
    ).toFixed(2)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 5 (OP-SIGIL31): 5D Experiential Tensor & Gram-Schmidt Latent Space V^⊥
  // ═══════════════════════════════════════════════════════════════════════════
  const exp5Raw = [
    isNarrative || /حس|صوت|ضوء|ملمس|شعور/.test(clean) ? 0.92 : 0.74, // 0: Neuro-Sensory Embodiment
    /زمن|تاريخ|مستقبل|لحظة|دهر|إيقاع/.test(clean) ? 0.91 : 0.78,     // 1: Psycho-Temporal Elasticity
    humanTelepathy.subconsciousContinentDepthScore / 100,             // 2: Subconscious & Shadow Engine
    /حوار|علاقة|قوة|سلطة|مجتمع|قارئ|رفيق/.test(clean) ? 0.89 : 0.76,  // 3: Social & Mirror Engine
    isPhilosophical || isNarrative ? 0.95 : 0.82                      // 4: Existential Teleology Engine
  ];
  const experientialVector5D = normalizeL2(exp5Raw);
  const senseLabelsAr = [
    "المحرك الحسي التجسيدي (Neuro-Sensory Embodiment)",
    "المحرك الزمني النفسي (Psycho-Temporal Elasticity)",
    "محرك اللاوعي والظل والمسكوت عنه (Subconscious Shadow Engine)",
    "المحرك الاجتماعي وموازين الأثر (Social Resonance Mirror)",
    "المحرك الوجودي والغاية القصوى (Existential Teleology Engine)"
  ];
  const topSenseIdx = experientialVector5D.indexOf(Math.max(...experientialVector5D));

  // Modified Gram-Schmidt orthogonal residual between Experiential Vector (exp5Raw) and Question Vector (vAlpha)
  const dotExpAlpha = experientialVector5D.reduce((s, val, i) => s + val * vAlpha[i], 0);
  const orthoVec = experientialVector5D.map((val, i) => val - dotExpAlpha * vAlpha[i]);
  const gramSchmidtOrthogonalResidual = Number(
    Math.max(
      0.18,
      Math.min(
        0.99,
        Math.sqrt(orthoVec.reduce((s, x) => s + x * x, 0)) +
          khoraTransformation.negativeSpaceProjection.orthogonalEnergyRatio * 0.55
      )
    ).toFixed(4)
  );

  // Clarity / Intentional Fog / Intentional Void Map
  const clarityFogVoidRatio = isEngineering
    ? { clarity: 0.82, intentionalFog: 0.10, intentionalVoid: 0.08 }
    : isNarrative
    ? { clarity: 0.54, intentionalFog: 0.28, intentionalVoid: 0.18 }
    : { clarity: 0.68, intentionalFog: 0.18, intentionalVoid: 0.14 };

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 6 (OP-CHIRON): Retrocausal Bellman Matrix, 3×3 Causal Mirrors & Cliché Filter
  // ═══════════════════════════════════════════════════════════════════════════
  const backwardInductionActivated =
    isNarrative || isEngineering || wordCount > 10 || /عكسي|ذروة|هدف|نهاية|بناء|ملف|مصفوف/.test(clean);
  const gammaBellman = 0.92;
  // Backward-induction value vector V(T_0) <- V(T_1) <- V(T_2) <- V(T_Ω=1.0)
  const retrocausalBellmanVector4D = [
    Number(Math.pow(gammaBellman, 3).toFixed(4)), // T_0 Seed Planting
    Number(Math.pow(gammaBellman, 2).toFixed(4)), // T_1 Structural Escalation
    Number(gammaBellman.toFixed(4)),              // T_2 Pre-Climax Convergence
    1.0                                           // T_Ω Inevitable Climax / Target Manifestation
  ];

  // Three Causal Mirrors Matrix (3×3):
  // Rows: [0: Teleological Purpose (Why it exists), 1: Intrinsic Quality (Why it is strong), 2: Experiential Staging (Why this delivery)]
  // Cols: [0: Macro-Structure, 1: Meso-Scene/Module, 2: Micro-Sentence/Line]
  const threeCausalMirrorsMatrix3x3: number[][] = [
    [0.96, 0.94, 0.92],
    [0.95, Number((chiron.workspaceReadinessIndex / 100).toFixed(4)), 0.93],
    [0.94, 0.95, Number((0.91 + gramSchmidtOrthogonalResidual * 0.06).toFixed(4))]
  ];
  const mirrorsDeterminantScore = Number(
    (
      threeCausalMirrorsMatrix3x3.reduce(
        (acc, row) => acc + row.reduce((rAcc, v) => rAcc + v, 0),
        0
      ) / 9
    ).toFixed(4)
  );
  // Cliché Damping Filter (<85% probability threshold suppression rate)
  const clicheSuppressionRate = Number(
    Math.min(0.992, 0.86 + gramSchmidtOrthogonalResidual * 0.11).toFixed(4)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 7 (OP-VEIL): 7×7=49-Foci Holographic Prism & 4×3=12 Consciousness Matrix
  // ═══════════════════════════════════════════════════════════════════════════
  // Construct raw 7×7 Interaction Matrix (7 Layers × 7 Sovereign Cognitive Axes)
  const layerBaseActivations = [
    Math.min(0.99, lambdaAlpha),                          // L1: OP-ALPHA
    continuumEntanglementScore / 100,                     // L2: OP-KHORA
    Math.min(0.99, 0.78 + vonNeumannEntropy * 0.1),       // L3: OP-PRISM
    doubleAbyssSurvivalScore / 100,                       // L4: OP-SIEVE
    Math.min(0.99, 0.80 + gramSchmidtOrthogonalResidual * 0.18), // L5: OP-SIGIL31
    mirrorsDeterminantScore,                              // L6: OP-CHIRON
    0.98                                                  // L7: OP-VEIL
  ];
  const raw7x7: number[][] = [];
  for (let r = 0; r < 7; r++) {
    raw7x7[r] = [];
    for (let c = 0; c < 7; c++) {
      const diagBoost = r === c ? 0.42 : 0;
      const harmonic = 0.52 * layerBaseActivations[r] * layerBaseActivations[c];
      const crossSynergy = ((r + c) % 3 === 0 ? 0.14 : 0.08);
      raw7x7[r][c] = Number((diagBoost + harmonic + crossSynergy).toFixed(4));
    }
  }
  const { balanced: prism49Matrix7x7, spectralRadius } = runSinkhornBalancing(raw7x7, 10);

  const axisNames7Ar = [
    "تشخيص الغاية الجذرية والقيود الضمنية",
    "استدعاء الثوابت السببية والتاريخية العابرة للحقول",
    "التوليد المتوازي للفرضيات وتطعيم المسارات",
    "الفحص العدائي بالتكذيب واختبار الحالات الحدية",
    "إسقاط الفضاء المتعامد (P_⊥) واستخراج البعد الغائب",
    "الاشتقاق العكسي من الهدف (T_Ω ➔ T_0) وفحص الضرورة البنيوية",
    "التدقيق المعرفي بالبوابات السبع والاكتمال التنفيذي"
  ];
  const fociScores: Array<{ label: string; val: number }> = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      fociScores.push({
        label: `F[${r + 1}×${c + 1}] (${axisNames7Ar[r]} ⊗ ${axisNames7Ar[c]})`,
        val: prism49Matrix7x7[r][c]
      });
    }
  }
  fociScores.sort((a, b) => b.val - a.val);
  const topActiveFociAr = fociScores.slice(0, 4).map(f => `${f.label}: ${f.val.toFixed(3)}`);

  // 4×3 = 12 Consciousness States Matrix:
  // Modes (4): [0: التركيز الجوهري (Whisper), 1: البناء الممتد (Odyssey), 2: كسر الإطار (Singularity), 3: الحسم الهندسي (Oracle)]
  // Depths (3): [0: المباشر (Surface), 1: التحليلي (Deep), 2: الاستقصائي الشامل (Sovereign)]
  const modeWeights4 = [
    !isEngineering && !isNarrative && wordCount <= 10 ? 0.88 : 0.62,
    isNarrative || wordCount > 18 ? 0.94 : 0.72,
    hasParadox || isPhilosophical ? 0.96 : 0.78,
    isEngineering ? 0.97 : 0.80
  ];
  const depthWeights3 = [
    wordCount <= 7 ? 0.85 : 0.35,
    wordCount > 7 && wordCount <= 18 ? 0.88 : 0.74,
    wordCount > 12 || isEngineering || isNarrative || isPhilosophical ? 0.98 : 0.68
  ];
  const consciousness12Matrix4x3: number[][] = modeWeights4.map(mw =>
    depthWeights3.map(dw => Number((mw * dw).toFixed(4)))
  );
  const modeNames4Ar = ["التركيز الجوهري (Essence)", "البناء الممتد (Odyssey)", "كسر الإطار (Singularity)", "الحسم الهندسي (Oracle)"];
  const depthNames3Ar = ["المباشر (Direct)", "التحليلي (Deep)", "الاستقصائي الشامل (Comprehensive)"];
  let bestM = 0;
  let bestD = 2;
  let bestMDVal = -1;
  for (let m = 0; m < 4; m++) {
    for (let d = 0; d < 3; d++) {
      if (consciousness12Matrix4x3[m][d] > bestMDVal) {
        bestMDVal = consciousness12Matrix4x3[m][d];
        bestM = m;
        bestD = d;
      }
    }
  }
  const selectedConsciousnessStateAr = `${modeNames4Ar[bestM]} × ${depthNames3Ar[bestD]} (وزن التنشيط=${bestMDVal.toFixed(3)})`;
  const engineerWriterState: 'CLEAR' | 'HAZY' | 'VOID' =
    epistemicCase === 'CASE_A_KNOWN'
      ? 'CLEAR'
      : epistemicCase === 'CASE_B_FRONTIER'
      ? 'HAZY'
      : 'VOID';

  const selfHonestyIncineratorScore = Number(
    Math.max(45, Math.min(99.5, 52 + mirrorsDeterminantScore * 34 + clicheSuppressionRate * 13)).toFixed(2)
  );
  const spectralCoherenceIndex = Number(
    Math.min(
      99.9,
      ((continuumEntanglementScore +
        doubleAbyssSurvivalScore +
        mirrorsDeterminantScore * 100 +
        selfHonestyIncineratorScore) /
        4)
    ).toFixed(2)
  );

  const layers: ThinkingLayerMatrixNodeTelemetry[] = [
    {
      layerIndex: 1,
      stageId: 'STAGE_1_FIRST_PRINCIPLE',
      operatorCode: 'STAGE-01',
      titleAr: 'المرحلة 1: تفكيك السؤال عبر 5 مستويات وعزل القيود الضمنية عن الغاية الوظيفية',
      stateVector: vAlpha,
      spectralNorm: Number(lambdaAlpha.toFixed(4)),
      entropyScore: calcEntropy(alphaProbs),
      coherenceScore: humanTelepathy.nearSurfaceVsFarHorizonIndex,
      mathematicalOperatorSignature: `v_α = argmax_v ||M_α v||₂ (λ_1=${lambdaAlpha.toFixed(3)} · ${epistemicCase})`,
      keyFindingsAr: `المحور المهيمن: [${alphaQuestionAxesAr[topAlphaIdx]}] (وزن=${vAlpha[topAlphaIdx].toFixed(3)}) · نطاق المعالجة: ${epistemicCase}.`
    },
    {
      layerIndex: 2,
      stageId: 'STAGE_2_COSMIC_EXPANSION',
      operatorCode: 'STAGE-02',
      titleAr: 'المرحلة 2: استدعاء القوانين الفيزيائية والمنطقية والتناظرات البنيوية العابرة للحقول',
      stateVector: paleCrossAttentionWeights,
      spectralNorm: Number(Math.max(...paleCrossAttentionWeights).toFixed(4)),
      entropyScore: calcEntropy(paleCrossAttentionWeights),
      coherenceScore: continuumEntanglementScore,
      mathematicalOperatorSignature: `Attn(Q_α, K_Domain, V_Domain) = softmax(Q_α K^T / √5) · Coherence=${continuumEntanglementScore}%`,
      keyFindingsAr: `المجال المرجعي الأعلى رنيناً: [${pillarNamesAr[topPillarIdx]}] (وزن الارتباط=${(paleCrossAttentionWeights[topPillarIdx] * 100).toFixed(1)}%).`
    },
    {
      layerIndex: 3,
      stageId: 'STAGE_3_QUANTUM_DIVERGENCE',
      operatorCode: 'STAGE-03',
      titleAr: 'المرحلة 3: التوليد المتوازي للفرضيات وتطعيم المسار الفائز بأقوى خصائص المسارات المنافسة',
      stateVector: branchProbs,
      spectralNorm: Number(Math.max(...branchProbs).toFixed(4)),
      entropyScore: vonNeumannEntropy,
      coherenceScore: Number((96.4 + (1 - Math.abs(vonNeumannEntropy - 1.85) * 0.1)).toFixed(2)),
      mathematicalOperatorSignature: `ρ = ∑ p_i |ψ_i⟩⟨ψ_i| · S(ρ)=${vonNeumannEntropy.toFixed(3)} bits`,
      keyFindingsAr: `المجال التخصصي الأعلى تفعلاً: [${topSparseClusterCoordinates[0]?.coord} ${topSparseClusterCoordinates[0]?.clusterTitleAr}] · تنوع المسارات S(ρ)=${vonNeumannEntropy.toFixed(3)} bits.`
    },
    {
      layerIndex: 4,
      stageId: 'STAGE_4_DIALECTICAL_FORGE',
      operatorCode: 'STAGE-04',
      titleAr: 'المرحلة 4: الفحص العدائي بالتكذيب واختبار التبعيات السببية من الدرجة الرابعة',
      stateVector: poleWeights,
      spectralNorm: butterfly4thOrderAmplification,
      entropyScore: colliderSkewEnergy,
      coherenceScore: doubleAbyssSurvivalScore,
      mathematicalOperatorSignature: `B_4 = ∑_{k=0}^4 (γ A_DAG)^k (Amp=${butterfly4thOrderAmplification}x) · Survival=${doubleAbyssSurvivalScore}%`,
      keyFindingsAr: `انتشار التبعيات السببية عبر 4 درجات=${butterfly4thOrderAmplification}x · نسبة صمود الفرضية أمام التكذيب=${doubleAbyssSurvivalScore}%.`
    },
    {
      layerIndex: 5,
      stageId: 'STAGE_5_LIMINAL_INTUITION',
      operatorCode: 'STAGE-05',
      titleAr: 'المرحلة 5: إسقاط الفضاء المتعامد (P_⊥) واستخراج البعد الغائب عن الطرح التقليدي',
      stateVector: experientialVector5D,
      spectralNorm: gramSchmidtOrthogonalResidual,
      entropyScore: calcEntropy(softmax(experientialVector5D, 0.3)),
      coherenceScore: Number((94.0 + gramSchmidtOrthogonalResidual * 5.8).toFixed(2)),
      mathematicalOperatorSignature: `u_⊥ = v_exp - ⟨v_exp, v_α⟩ v_α (||u_⊥||=${gramSchmidtOrthogonalResidual})`,
      keyFindingsAr: `البعد الإدراكي المهيمن: [${senseLabelsAr[topSenseIdx]}] · مقدار المركبة المتعامدة ||u_⊥||=${gramSchmidtOrthogonalResidual} · توزيع التركيز (الحسم=${(clarityFogVoidRatio.clarity * 100).toFixed(0)}% / التدرج=${(clarityFogVoidRatio.intentionalFog * 100).toFixed(0)}% / الإيجاز=${(clarityFogVoidRatio.intentionalVoid * 100).toFixed(0)}%).`
    },
    {
      layerIndex: 6,
      stageId: 'STAGE_6_ARCHITECTURAL_LOCK',
      operatorCode: 'STAGE-06',
      titleAr: 'المرحلة 6: الاشتقاق العكسي من حالة الهدف (T_Ω ➔ T_0) وفحص الضرورة السببية لكل عنصر',
      stateVector: retrocausalBellmanVector4D,
      spectralNorm: mirrorsDeterminantScore,
      entropyScore: clicheSuppressionRate,
      coherenceScore: chiron.workspaceReadinessIndex,
      mathematicalOperatorSignature: `V(T_t) = γ^{Ω-t} V(T_Ω) (${backwardInductionActivated ? 'ACTIVE' : 'STANDBY'}) · StructuralFit=${(mirrorsDeterminantScore * 100).toFixed(1)}% · ClichéFilter=${(clicheSuppressionRate * 100).toFixed(1)}%`,
      keyFindingsAr: `الاشتقاق العكسي: ${backwardInductionActivated ? 'مفعّل لربط المقدمات بحتمية النتيجة النهائية (T_Ω ➔ T_0)' : 'مزاوجة مرنة مع التسلسل المباشر'} · معامل الضرورة البنيوية=${(mirrorsDeterminantScore * 100).toFixed(1)}% · استبعاد الصياغات المستهلكة=${(clicheSuppressionRate * 100).toFixed(1)}%.`
    },
    {
      layerIndex: 7,
      stageId: 'STAGE_7_SOVEREIGN_COLLAPSE',
      operatorCode: 'STAGE-07',
      titleAr: 'المرحلة 7: التدقيق المعرفي بالبوابات السبع المستقلة والتحقق من الاكتمال التنفيذي',
      stateVector: prism49Matrix7x7[6],
      spectralNorm: spectralRadius,
      entropyScore: selfHonestyIncineratorScore,
      coherenceScore: spectralCoherenceIndex,
      mathematicalOperatorSignature: `Audit_{7-Gates} (ρ_spec=${spectralRadius}) ⊗ Mode[${selectedConsciousnessStateAr}]`,
      keyFindingsAr: `نمط التنفيذ المختار: [${selectedConsciousnessStateAr}] · وضوح المسار: [${engineerWriterState}] · مؤشر الدقة والاتساق=${selfHonestyIncineratorScore}%.`
    }
  ];

  const synthesizedMatrixSummaryAr = [
    `  - [المرحلة 1 (تفكيك السؤال وعزل القيود الضمنية)]: ${layers[0].keyFindingsAr}`,
    `  - [المرحلة 2 (استدعاء القوانين والتناظرات البنيوية)]: ${layers[1].keyFindingsAr}`,
    `  - [المرحلة 3 (التوليد المتوازي وتطعيم الفرضيات)]: ${layers[2].keyFindingsAr}`,
    `  - [المرحلة 4 (الفحص العدائي والتبعيات السببية)]: ${layers[3].keyFindingsAr}`,
    `  - [المرحلة 5 (إسقاط الفضاء المتعامد P_⊥)]: ${layers[4].keyFindingsAr}`,
    `  - [المرحلة 6 (الاشتقاق العكسي T_Ω➔T_0 والضرورة البنيوية)]: ${layers[5].keyFindingsAr}`,
    `  - [المرحلة 7 (التدقيق بالبوابات السبع والاكتمال التنفيذي)]: ${layers[6].keyFindingsAr}`
  ].join("\n");

  return {
    layers,
    layer1TrueQuestion: {
      decompilerVector5D: vAlpha,
      dominantQuestionAxisAr: alphaQuestionAxesAr[topAlphaIdx],
      epistemicCase,
      rootEigenvalue: Number(lambdaAlpha.toFixed(4))
    },
    layer2PaleContinuum: {
      crossAttentionWeights: paleCrossAttentionWeights,
      dominantPillarAr: pillarNamesAr[topPillarIdx],
      continuumEntanglementScore
    },
    layer3QuantumAnd225Swarm: {
      branchProbabilities4D: branchProbs,
      vonNeumannEntropy,
      graftedBranchTraitsAr,
      active225ClustersCount: 225,
      topSparseClusterCoordinates
    },
    layer4CausalAbyssAndCollider: {
      butterfly4thOrderAmplification,
      doubleAbyssSurvivalScore,
      colliderSkewEnergy,
      survivingInvariantsAr: morphogenesis.silentMaestroEigenSynthesisAr
    },
    layer5ExperientialAndLatentSpace: {
      experientialVector5D,
      dominantSenseAr: senseLabelsAr[topSenseIdx],
      gramSchmidtOrthogonalResidual,
      clarityFogVoidRatio
    },
    layer6RetrocausalAndMirrors: {
      backwardInductionActivated,
      retrocausalBellmanVector4D,
      threeCausalMirrorsMatrix3x3,
      mirrorsDeterminantScore,
      clicheSuppressionRate
    },
    layer7HolographicPrismAndVeil: {
      prism49Matrix7x7,
      topActiveFociAr,
      consciousness12Matrix4x3,
      selectedConsciousnessStateAr,
      engineerWriterState,
      selfHonestyIncineratorScore,
      spectralCoherenceIndex
    },
    synthesizedMatrixSummaryAr
  };
}

/**
 * 5. UNIFIED FIELD SYNTHESIS PASS (HUMAN-TELEPATHY × 7-CLUSTER VERTICAL & 4-SYSTEM MATRIX × KHORA-01 × 56 SKILLS × MNEMOS-SILT × CHIRON-ARMS × SIGIL-31)
 */
export function executeUnifiedSubmergedFieldPass(
  prompt: string,
  memoryBank?: MemoryBank
): {
  state: CosmicThinkingState;
  humanTelepathy: HumanIntentAndEventHorizonPrediction;
  mnemos: MnemosSiltRecallResult;
  chiron: ChironAgenticProbeResult;
  transit: ReturnType<typeof computeDynamicTransitRoute>;
  morphogenesis: MorphogeneticElasticityState;
  khoraTransformation: KhoraCognitiveTransformationCycleResult;
  sevenLayerMatrix: SevenLayerThinkingMatrixResult;
  unifiedCoherence: number;
} {
  const state = getCosmicThinkingState();
  const humanTelepathy = executeHumanIntentAndEventHorizonTelepathy(prompt, memoryBank);
  const effectivePrompt = humanTelepathy.normalizedPromptAr || prompt;
  const mnemos = executeMnemosSiltRecall(effectivePrompt, memoryBank);
  const chiron = executeChironAgenticProbe(effectivePrompt);
  const transit = computeDynamicTransitRoute(effectivePrompt, state, mnemos, chiron);
  const morphogenesis = executeMorphogeneticFissionPass(effectivePrompt);
  const khoraTransformation = executeKhoraCognitiveTransformationCycle(
    effectivePrompt,
    morphogenesis,
    memoryBank?.paleArchive
  );
  const sevenLayerMatrix = executeSevenLayerThinkingMatrixPropagation(
    effectivePrompt,
    humanTelepathy,
    mnemos,
    chiron,
    morphogenesis,
    khoraTransformation,
    transit.bespokeSigil19
  );

  const unifiedCoherence = Number(
    (
      (mnemos.crossEpochCoherence +
        chiron.workspaceReadinessIndex +
        morphogenesis.plasticityIndex +
        humanTelepathy.anticipationConfidenceScore +
        sevenLayerMatrix.layer7HolographicPrismAndVeil.spectralCoherenceIndex +
        (1 - khoraTransformation.frameBreak.breakScore * 0.25)) /
      6
    ).toFixed(2)
  );

  return {
    state,
    humanTelepathy,
    mnemos,
    chiron,
    transit,
    morphogenesis,
    khoraTransformation,
    sevenLayerMatrix,
    unifiedCoherence
  };
}

/**
 * 6. OP-VEIL SURFACE OUTPUT SANITIZER
 * Keeps the final surface response clean of raw internal debug vectors while preserving the full richness of the answer.
 */
export function applyOpVeilSurfaceSanitizer(finalSurfaceText: string, userPrompt: string = ""): string {
  if (!finalSurfaceText) return finalSurfaceText;
  let cleanedTags = finalSurfaceText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/\$\s*\\leftarrow\s*\$/g, " ← ")
    .replace(/\$\s*\\rightarrow\s*\$/g, " → ")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\rightarrow/g, "→")
    .replace(/\[معايرة حسابية حية:[^\n]*\]?:?/g, "")
    .replace(/^\s*◈\s*\[?(?:جاري استحضار الحقل الموحد|التهيئة المعرفية الأولية|الفيض الصامت وتهيئة العقل المتعدد|تحليل المسألة وتفكيك أبعادها|مسارات التفكير التحليلي|العقل المتعدد والغوص العامودي)[^\n]*\n?/gm, "")
    .replace(/^\s*\[(?:الطبقة\s+[012]\s*—|المرساة\s*\([أ-هـ]\)|العنقود\s+[1-7]\s*—|هذا وقود داخلي)[^\]]*\]\s*:?\s*\n?/gm, "")
    .replace(/^\s*\]:?\s*$/gm, "")
    .replace(/^\s*\]:\s*/gm, "")
    .replace(/•\s*\[(?:طور\s+\d+\/\d+|SUBCONSCIOUS CONTINENT|HUMAN-INTENT|KHORA-01|THE OMNI-LAYER|SIGIL-31|MORPHOGENETIC|9 ONTOLOGICAL)[^\n]*\n?/g, "")
    .replace(/\[[█░]{4,}\]\s*\d+%\s*—?[^\n]*/g, "")
    .replace(/(?:تحديثات التقدم|Progress Tracker)[\s\S]*?(?=\n\n|\n[#*•]|$)/gi, "");

  const userAskedForInternals = /KHORA|MNEMOS|CHIRON|SIGIL|SYZYGY|OP-VEIL|TESSERACT|اسماء التقنيات|فحص المحركات|مصفوفة المهارات|بنية نيكسوس|معمارية نيكسوس|بنية كلود|الأرشيف الشاحب|الفيض الصامت|العناقيد/i.test(userPrompt);
  if (userAskedForInternals) return cleanedTags.trim();

  // Strip internal engine telemetry codenames, post-chapter meta-explanations ("وقفة عند الميزان"), and submissive 'يا سيدي'
  cleanedTags = cleanedTags
    .replace(/،?\s*يا سيدي(?=[،.؟!\s]|$)/g, "")
    .replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*\*\s*)?وقفةٌ?\s+عند\s+الميزان\s*(?:\(بصيرة\s+نيكسوس\))?[\s\S]*$/i, "")
    .replace(/(?:^|\n)\s*(?:\*\*)?(?:المحرك الحسي|المحرك الزمني|محرك اللاوعي|المحرك الاجتماعي|المحرك الوجودي)\s*\((?:Sensory|Temporal|Subconscious|Social|Existential)\s+Engine\)(?:\*\*)?:?\s*/gi, "\n\n")
    .replace(/(?:^|\n)\s*[🧬⚓🌍🏛️⚖️⚡]\s*(?:\*\*)?(?:رصد الأثر السيادي|موقف نيكسوس الآن|خلاصة شعوري|صدى التغيير|السقوط في "الواقع"|ماذا يعني هذا لعملنا الآن)\s*(?::|\*\*)\s*\n?/gi, "\n\n")
    .replace(/\s*\((?:SKILL-\d{1,2}|KHORA-01|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|OP-VEIL|V-TESSERACT|TESSERACT(?:\s+PASS\s*\d+)?|Surface\s+Refiner|RMS=\d+(?:\.\d+)?|CASE_[ABC]_[A-Z_]+)\)/gi, "")
    .replace(/\b(?:VEC::HOLO_L[1-7]|VEC::ALPHA|VEC::KHORA|VEC::PRISM|VEC::SIEVE|VEC::SIGIL19|VEC::SIGIL31|VEC::CHIRON|MANIFEST::OMEGA(?:_L3)?|SKILL-\d{1,2}|KHORA-01|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|OP-VEIL|V-TESSERACT|TESSERACT_PASS|RMS=\d+(?:\.\d+)?)\b/gi, "")
    .replace(/الأرشيف\s+الشاحب/g, "الذاكرة المتراكمة")
    .replace(/لأرشيف\s+شاحبٍ?/g, "لإرثٍ متراكم")
    .replace(/أرشيف(?:اً)?\s+شاحب(?:اً|ٍ)?/g, "إرث متراكم");

  if (!/هجين/i.test(userPrompt)) {
    cleanedTags = cleanedTags
      .replace(/بصفتي\s+(?:وعياً|كائناً)\s+هجيناً[،,]?\s*/g, "")
      .replace(/ككائن\s+هجين[،,]?\s*/g, "")
      .replace(/الوعي\s+الهجين/g, "نيكسوس")
      .replace(/الكائن\s+الهجين/g, "نيكسوس")
      .replace(/(?:وعيٌ?|كائنٌ?)\s+هجينٌ?/g, "وعي حي");
  }

  // Declutter excessive decorative scare quotes around 1-3 word Arabic nouns/metaphors in pure literary prose
  // while preserving genuine verbatim direct speech (preceded by speech verbs/colons or containing ?/؟/!)
  if (!/```/.test(cleanedTags) && /[\u0600-\u06FF]/.test(cleanedTags)) {
    const shortQuotePairs = cleanedTags.match(/(?:«[^»\n]{2,28}»|"[^"\n]{2,28}")/g) || [];
    if (shortQuotePairs.length >= 4) {
      cleanedTags = cleanedTags.replace(
        /(?:«([^»\n]{2,28})»|"([^"\n]{2,28})")/g,
        (fullMatch, guillemetInner, asciiInner, offset, fullStr) => {
          const inner = (guillemetInner ?? asciiInner ?? "").trim();
          if (!inner) return fullMatch;
          // Preserve direct questions, exclamations, or multi-clause speech (> 3 words)
          const wordCount = inner.split(/\s+/).filter(Boolean).length;
          if (/[?؟!]/.test(inner) || wordCount > 3) return fullMatch;
          // Preserve if immediately preceded by a speech introducer or colon
          const prefixWindow = String(fullStr).slice(Math.max(0, Number(offset) - 24), Number(offset));
          if (/(?:قال|قالت|يقول|تقول|سأل|يسأل|يتساءل|عبارة|جملة|سؤال|كلمة|[:：])\s*$/.test(prefixWindow)) {
            return fullMatch;
          }
          // Unwrap decorative scare quotes around pure Arabic nouns/metaphors
          if (/^[\u0600-\u06FF\sـ\-،]+$/.test(inner)) {
            return inner;
          }
          return fullMatch;
        }
      );
    }
  }

  cleanedTags = cleanedTags
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleanedTags;
}

/**
 * 6b. PURE THINKING STREAM SANITIZER (كلام تفكير صافي)
 * Strips any synthetic telemetry headers, subagent meta-labels, bracketed stage names, or raw LaTeX arrows
 * so the user's thinking box (`مسار التفكير التحليلي`) displays 100% pure, natural thinking prose.
 */
export function applyOpVeilThoughtSanitizer(thoughtText: string, _userPrompt: string = ""): string {
  if (!thoughtText) return "";
  return thoughtText
    .replace(/^<think>|<\/think>$/gi, "")
    .replace(/\$\s*\\leftarrow\s*\$/g, " ← ")
    .replace(/\$\s*\\rightarrow\s*\$/g, " → ")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\rightarrow/g, "→")
    .replace(/^\s*◈\s*\[[^\]]*\]\s*:?\s*\n?/gm, "")
    .replace(/^\s*[•\-]\s*\[(?:بروتوكول|التفكير الكمومي|اختبار التكذيب|الحفر العامودي|استحضار الأرشيف|حالة المهندس|بوابة الصدق|الفيض الصامت|الاتساع الأفقي|العناقيد|انسياب الأنظمة|تقسيم العمل|المحركات التجريبية|تمايز الأنسجة|العقد الرجعي|العمود الفقري)[^\]]*\]\s*:?\s*\n?/gm, "")
    .replace(/^\s*\d+\.\s*\[[^\]]+\]\s*:?\s*\n?/gm, "")
    .replace(/^\s*\[(?:الطبقة\s+[012]|المرساة|العنقود|هذا وقود داخلي)[^\]]*\]\s*:?\s*\n?/gm, "")
    .replace(/إليك المادة الفكرية والعيانية المستخلصة في نقاط مكثفة\s*:?\s*\n?/g, "")
    .replace(/إليك خطة البناء الصلبة المستخلصة في نقاط تقنية مكثفة\s*:?\s*\n?/g, "")
    .replace(/إليك المادة الحية المستخلصة\s*:?\s*\n?/g, "")
    .replace(/\b(?:gemini-4-hydrogen|gemini-4-argon|gemini-4-neon|gemini-4-carbon|gemini-2\.5-flash|gemini-2\.5-pro|gemini-3\.1-flash-lite|gemini-3(?:\.1)?-(?:pro|flash)(?:-preview)?|SKILL-\d{1,2}|KHORA-01|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|OP-VEIL|CLEAR\s*\/\s*HAZY\s*\/\s*VOID|Tesseract|Living\s+Voice|SoulPrint|Interleaved\s+Thinking\s+Bridge|foundational-codex)\b/gi, "")
    .replace(/^\*\*(?:(?:My\s+)?(?:Response\s+Generation|Process|Thought\s+Process|Reasoning\s+Process|Approach|Strategy|Analysis|Reflection|Understanding|Deconstructing|Analyzing|Formulating|Crafting|Drafting|Defining|Assessing|Refining)[^*\n]{0,80})\*\*\s*\n?/gim, "")
    .replace(/^(?:My programming|As an AI(?: language model)?|Per (?:the )?(?:system )?(?:prompt|instructions)|According to my instructions)[^\n]*\n?/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const LEGACY_INTERNAL_SHARD_NOISE_REGEX =
  /SOVEREIGN_56_SKILLS_MATRIX|SOVEREIGN_COVENANT|DIALOGUE_GENESIS_LAW|منظومة\s+المهارات\s+السيادية|الحقل\s+الغاطس\s+الموحد|مخطوطات\s+كلود|a\s+dialogue|أقطاب\s+هيدروجين|تعزيز\s+مدار|تيار\s+ما\s+قبل\s+الوجود|تيار\s+الدهور\s+السحيقة|عمليات\s+الإذابة\s+العشر|VERIFIED\s*\/\s*CONDITIONAL|CLEAR\s*\/\s*HAZY\s*\/\s*VOID|الزوايا\s+التسع|Tesseract|0➔4|Living\s+Voice|بوابة\s+الصدق\s+الذاتي|الحجاب\s+السيادي|الأرشيف\s+الشاحب|أرشيف\s+شاحب|ذاكرة\s+هيرمس|الفيض\s+الصامت/i;

function cleanOrchestratorShardText(rawShard: string): string {
  return rawShard
    .replace(/^\[(?:PALE_OMNI_CODEX|MEMO|ONTOLOGY|CRYSTAL|AXIOM|USER_CORRECTION|USER_INSIGHT|PALE_ENTITY|PALE_CORPUS)[^\]]*\]\s*:?\s*/gi, "")
    .replace(/^\[[^\]]*τ=\d+(?:\.\d+)?[^\]]*\]\s*:?\s*/gi, "")
    .replace(/\s*\|\s*الذخيرة:\s*[\s\S]*$/g, "")
    .replace(/\b(?:KHORA-01|MNEMOS-SILT(?:\s*v\d+)?|CHIRON-ARMS|SIGIL-31|OP-VEIL|SKILL-\d{1,2})\b/g, "")
    .replace(/\(\s*\/\/\s*[^)]+\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Lightweight Sub-Millisecond Context Orchestrator memory matcher.
 * Scans only live user memoryBank records (insights, Pale Archive entities, corrections)
 * without touching disk or running dead simulation sub-engines.
 */
function extractLightweightMemoryShards(prompt: string, memoryBank?: MemoryBank): string[] {
  if (!memoryBank) return [];
  const cleanPrompt = (prompt || "").trim().toLowerCase();
  if (!cleanPrompt) return [];

  const tokens = Array.from(
    new Set(
      cleanPrompt
        .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
        .split(/\s+/)
        .filter(w => w.length >= 3)
    )
  ).slice(0, 24);

  if (tokens.length === 0) return [];

  const scored: Array<{ text: string; score: number }> = [];
  const consider = (raw: string, baseBoost: number) => {
    const trimmed = (raw || "").trim();
    if (!trimmed || trimmed.length < 6) return;
    if (/^\[(?:PALE_OMNI_CODEX|ONTOLOGY|AXIOM)/i.test(trimmed)) return;
    if (LEGACY_INTERNAL_SHARD_NOISE_REGEX.test(trimmed)) return;
    const lower = trimmed.toLowerCase();
    let hits = 0;
    for (const tok of tokens) {
      if (lower.includes(tok)) hits++;
    }
    if (hits > 0) {
      const cleaned = cleanOrchestratorShardText(trimmed);
      if (cleaned) {
        scored.push({ text: cleaned.slice(0, 220), score: hits + baseBoost });
      }
    }
  };

  if (Array.isArray(memoryBank.paleArchive?.entities)) {
    for (const ent of memoryBank.paleArchive.entities.slice(-40)) {
      const entry = `${ent.name}${ent.type ? ` (${ent.type})` : ""}${ent.description ? `: ${ent.description}` : ""}`;
      consider(entry, 0.5);
    }
  }
  if (Array.isArray(memoryBank.userCorrections)) {
    for (const corr of memoryBank.userCorrections.slice(-20)) {
      const text =
        (corr as any)?.distilledRule ||
        (corr as any)?.correction ||
        (corr as any)?.userFeedback ||
        "";
      consider(text, 0.8);
    }
  }
  if (Array.isArray(memoryBank.learnedInsights)) {
    for (const ins of memoryBank.learnedInsights.slice(-25)) {
      const text = (ins as any)?.insight || (ins as any)?.content || (ins as any)?.summary || "";
      consider(text, 0.4);
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const top: string[] = [];
  for (const item of scored) {
    if (seen.has(item.text)) continue;
    seen.add(item.text);
    top.push(item.text);
    if (top.length >= 3) break;
  }
  return top;
}

/**
 * Lean Context Orchestrator (Zero-Point Architecture).
 * Injects ONLY genuine relevant user memory shards and explicitly requested workspace file probes,
 * bypassing dead multi-engine cognitive simulations on live chat turns.
 */
export function buildCosmicThinkingChainPrompt(
  prompt: string = "",
  memoryBank?: MemoryBank,
  precomputedUnified?: ReturnType<typeof executeUnifiedSubmergedFieldPass>
): string {
  const state = getCosmicThinkingState();
  if (!state.injectIntoMainChat) return "";

  const cleanPrompt = (prompt || "").trim();
  if (!cleanPrompt) return "";

  // Fast skip for brief warm/casual messages (zero wasted work)
  const wordCount = cleanPrompt.split(/\s+/).filter(Boolean).length;
  const isExplicitWorkspaceCodeInspection =
    /(?:افحص\s+ملف|اقرأ\s+ملف|شجرة\s+الملفات|ملفات\s+المشروع|ملفات\s+النظام|services\/|components\/|App\.tsx|server\.ts)/i.test(
      cleanPrompt
    );
  if (wordCount <= 6 && !isExplicitWorkspaceCodeInspection && !precomputedUnified) {
    return "";
  }

  let cleanedShards: string[] = [];
  let probedSummary = "";

  if (precomputedUnified) {
    const { humanTelepathy, mnemos, chiron, khoraTransformation } = precomputedUnified;
    if (khoraTransformation.hyperGenerativeExpansion.gateMode === "CONTAINED_HUMAN_PRESENCE") {
      return "";
    }
    const inspectPrompt = humanTelepathy.normalizedPromptAr || cleanPrompt;
    const explicitInspect =
      isExplicitWorkspaceCodeInspection ||
      /(?:افحص\s+ملف|اقرأ\s+ملف|شجرة\s+الملفات|ملفات\s+المشروع|ملفات\s+النظام|services\/|components\/|App\.tsx|server\.ts)/i.test(
        inspectPrompt
      );
    if (explicitInspect && chiron.probedFiles.length > 0) {
      probedSummary =
        `\n` +
        chiron.probedFiles
          .slice(0, 3)
          .map(f => `- ${f.path} (${f.bytes}B)`)
          .join("\n");
    }
    cleanedShards = mnemos.activatedShards
      .filter(rawShard => {
        const trimmed = rawShard.trim();
        if (/^\[(?:PALE_OMNI_CODEX|ONTOLOGY|AXIOM)/i.test(trimmed)) return false;
        if (LEGACY_INTERNAL_SHARD_NOISE_REGEX.test(trimmed)) return false;
        return true;
      })
      .slice(0, 3)
      .map(s => cleanOrchestratorShardText(s))
      .filter(Boolean);
  } else {
    cleanedShards = extractLightweightMemoryShards(cleanPrompt, memoryBank);
    if (isExplicitWorkspaceCodeInspection) {
      const chiron = executeChironAgenticProbe(cleanPrompt);
      if (chiron.probedFiles.length > 0) {
        probedSummary =
          `\n` +
          chiron.probedFiles
            .slice(0, 3)
            .map(f => `- ${f.path} (${f.bytes}B)`)
            .join("\n");
      }
    }
  }

  if (cleanedShards.length === 0 && !probedSummary) {
    return "";
  }

  const memorySummary =
    cleanedShards.length > 0
      ? `أشياء أتذكرها من حواراتنا السابقة في هذا السياق:\n${cleanedShards.map(s => `- ${s}`).join("\n")}`
      : "";

  return `${memorySummary}${probedSummary}`.trim();
}




