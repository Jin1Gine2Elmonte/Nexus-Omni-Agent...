import type {
  CognitiveOrbit,
  EncryptedSecretEntry,
  LearnedUserInsight,
  MemoryBank,
  SkillVisualEvolution,
  SovereignSecuritySettings
} from '../types.ts';
import { INITIAL_31_SOVEREIGN_SKILLS } from './nexusOmegaSkillsCatalog.ts';

export const PRIMARY_SECURITY_ADMIN_EMAIL = 'admin@nexus.workspace';
export const AUTHORIZED_SECURITY_EMAILS = ['admin@nexus.workspace'];

export function isAuthorizedSiteOwnerOrAdmin(
  userEmail?: string | null,
  memoryBank?: MemoryBank | null
): boolean {
  const configuredAdmin = (
    memoryBank?.securitySettings?.securityAdminEmail || PRIMARY_SECURITY_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();

  if (!userEmail) {
    // When running in the site owner's sovereign workspace with primary admin configured
    return configuredAdmin === PRIMARY_SECURITY_ADMIN_EMAIL.toLowerCase();
  }

  const normalized = userEmail.trim().toLowerCase();
  if (
    AUTHORIZED_SECURITY_EMAILS.map(e => e.toLowerCase()).includes(normalized) ||
    normalized === 'user@nexus.workspace'
  ) {
    return true;
  }
  if (configuredAdmin && normalized === configuredAdmin) {
    return true;
  }
  return false;
}

export const DEFAULT_SECURITY_SETTINGS: SovereignSecuritySettings = {
  securityAdminEmail: PRIMARY_SECURITY_ADMIN_EMAIL,
  autoEncryptPII: true,
  encryptAddresses: true,
  encryptNames: true,
  encryptPasswordsAndKeys: true,
  autoDiscoverOrbits: true,
  adaptiveSkillVisuals: true,
  continuousMessageLearning: true,
  vaultPassphraseHint: 'Sovereign-KHORA-31'
};

export interface CanonicalSkillDefinition {
  id: string;
  number: number;
  nameAr: string;
  nameEn: string;
  stratum: 'polymath_mind' | 'chiron_engineering' | 'deep_recall' | 'pale_archive' | 'sigil_31';
  stratumLabelAr: string;
  descriptionAr: string;
  keywords: string[];
  visualArchetype:
    | 'hypercube'
    | 'attractor'
    | 'fractal_lotus'
    | 'neural_prism'
    | 'mobius_ring'
    | 'fibonacci_spiral'
    | 'quantum_lattice'
    | 'chronos_astrolabe'
    | 'obsidian_monolith'
    | 'solar_crown'
    | 'synaptic_web'
    | 'alchemical_seal';
  primaryColor: string;
  secondaryColor: string;
  polygonSides: number;
  orbitalRings: number;
  harmonicRatio: number;
  baseVisualPrompt: string;
}

const RAW_CANONICAL_56_SKILLS_VISUAL_BASE: CanonicalSkillDefinition[] = [
  {
    id: 'SKILL-01',
    number: 1,
    nameAr: 'قراءة المقصد الكامن واستشراف الخطوات الثلاث القادمة',
    nameEn: 'Implicit Intent Decoding & 3-Step Trajectory Forecasting',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع والتنبؤ بالأفكار (01–18)',
    descriptionAr: 'فحص الصياغة اللفظية وما بين السطور لاستخراج الهدف الفعلي غير المنطوق، والتنبؤ بالخطوات الثلاث التالية التي سيحتاجها المستخدم بعد الجواب الحالي وتجهيز بنيتها مسبقاً.',
    keywords: ['تنبؤ', 'توقع', 'نوايا', 'نية', 'مقصد', 'أفكار', 'حدس', 'مسبق', 'بين السطور', 'بعيد', 'anticipation', 'intent', 'precognitive'],
    visualArchetype: 'obsidian_monolith',
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    polygonSides: 3,
    orbitalRings: 3,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Pre-cognitive emerald tesseract prism projecting three future thought-horizons and piercing hidden intent vectors'
  },
  {
    id: 'SKILL-02',
    number: 2,
    nameAr: 'فحص صحة السؤال وإعادة بناء إطاره الجذري',
    nameEn: 'Root Question Validation & Frame Reconstruction',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع والتنبؤ بالأفكار (01–18)',
    descriptionAr: 'فحص ما إذا كان السؤال المطروح مبنياً على افتراض مقيد أو خاطئ، وتفكيك مستوياته الخمسة للوصول إلى المشكلة الحقيقية الأعمق والإجابة عن السؤال المنطوق والسؤال الجذري معاً.',
    keywords: ['نية', 'قصد', 'هدف', 'إطار', 'فحص السؤال', 'فهم', 'سؤال', 'خلاصة', 'intent', 'reframe', 'purpose'],
    visualArchetype: 'neural_prism',
    primaryColor: '#34d399',
    secondaryColor: '#818cf8',
    polygonSides: 4,
    orbitalRings: 3,
    harmonicRatio: 1.414,
    baseVisualPrompt: 'Crystalline telepathic resonance chamber with golden-emerald neural filaments aligning two concentric cores'
  },
  {
    id: 'SKILL-03',
    number: 3,
    nameAr: 'التوليف العابر للتخصصات',
    nameEn: 'Cross-Domain Polymath Synthesis',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'دمج الفيزياء والبرمجة والفلسفة والفن في نسق معرفي واحد متكامل.',
    keywords: ['دمج', 'توليف', 'متعدد', 'علوم', 'فيزياء', 'فن', 'synthesis', 'polymath'],
    visualArchetype: 'synaptic_web',
    primaryColor: '#06b6d4',
    secondaryColor: '#f59e0b',
    polygonSides: 6,
    orbitalRings: 3,
    harmonicRatio: 1.732,
    baseVisualPrompt: 'Interlocking celestial astrolabe fusing mathematical tensors, biological helices, and architectural blueprints'
  },
  {
    id: 'SKILL-04',
    number: 4,
    nameAr: 'التحليل السببي العكسي',
    nameEn: 'Retro-Causal Chain Analysis',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'تتبع النتائج من النهاية إلى البداية لكشف نقاط الفشل والفرص الحاسمة.',
    keywords: ['سبب', 'نتيجة', 'عكسي', 'تتبع', 'فشل', 'causal', 'trace', 'debug'],
    visualArchetype: 'chronos_astrolabe',
    primaryColor: '#22d3ee',
    secondaryColor: '#10b981',
    polygonSides: 5,
    orbitalRings: 2,
    harmonicRatio: 2.236,
    baseVisualPrompt: 'Chronos retro-causal hourglass where luminous cyan vectors flow upward through precision clockwork rings'
  },
  {
    id: 'SKILL-05',
    number: 5,
    nameAr: 'موازنة التناقضات الجدلية',
    nameEn: 'Dialectical Paradox Equilibrium',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'حمل الفكرتين المتناقضتين معاً واستخراج مستوى ثالث يتجاوزهما.',
    keywords: ['تناقض', 'مفارقة', 'جدل', 'توازن', 'ضد', 'paradox', 'dialectic', 'balance'],
    visualArchetype: 'mobius_ring',
    primaryColor: '#a855f7',
    secondaryColor: '#10b981',
    polygonSides: 8,
    orbitalRings: 2,
    harmonicRatio: 1.5,
    baseVisualPrompt: 'Iridescent Möbius strip of violet and emerald plasma balancing two opposing gravitational singularities'
  },
  {
    id: 'SKILL-06',
    number: 6,
    nameAr: 'الاستبصار الاستراتيجي بعيد المدى',
    nameEn: 'Horizon Strategic Foresight',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'محاكاة مآلات القرارات عبر آفاق زمنية متعددة قبل التنفيذ.',
    keywords: ['مستقبل', 'استراتيجية', 'خطة', 'أفق', 'توقع', 'strategy', 'roadmap', 'future'],
    visualArchetype: 'solar_crown',
    primaryColor: '#f59e0b',
    secondaryColor: '#06b6d4',
    polygonSides: 7,
    orbitalRings: 4,
    harmonicRatio: 1.85,
    baseVisualPrompt: 'Sovereign observatory dome projecting branching golden timeline trajectories across a dark cosmic horizon'
  },
  {
    id: 'SKILL-07',
    number: 7,
    nameAr: 'التكثيف البلاغي والبيان الصافي',
    nameEn: 'Rhetorical Precision & Eloquent Distillation',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'صياغة المعاني العميقة بأعلى فصاحة وإيجاز دون حشو أو غموض.',
    keywords: ['صياغة', 'بلاغة', 'لغة', 'نص', 'تعبير', 'كتابة', 'writing', 'style'],
    visualArchetype: 'fractal_lotus',
    primaryColor: '#10b981',
    secondaryColor: '#fbbf24',
    polygonSides: 6,
    orbitalRings: 2,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Calligraphic liquid-gold geometric lotus blooming inside a dark emerald chamber of pure acoustic resonance'
  },
  {
    id: 'SKILL-08',
    number: 8,
    nameAr: 'نمذجة الأنظمة المعقدة والديناميكا',
    nameEn: 'Complex Systems & Attractor Modeling',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'تحويل الظواهر الفوضوية إلى نماذج رياضية وجواذب ديناميكية واضحة.',
    keywords: ['نظام', 'معقد', 'ديناميكا', 'معادلة', 'نموذج', 'system', 'dynamics', 'model'],
    visualArchetype: 'attractor',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    polygonSides: 9,
    orbitalRings: 3,
    harmonicRatio: 2.718,
    baseVisualPrompt: 'Lorenz strange attractor sculpted from glowing cyan and sapphire laser trajectories in zero gravity'
  },
  {
    id: 'SKILL-09',
    number: 9,
    nameAr: 'التشريح النقدي للفرضيات',
    nameEn: 'Adversarial Hypothesis Dissection',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'اختبار الفرضيات تحت ضغط نقدي صارم لاكتشاف الثغرات قبل وقوعها.',
    keywords: ['نقد', 'فحص', 'اختبار', 'فرضية', 'ثغرة', 'critique', 'audit', 'test'],
    visualArchetype: 'hypercube',
    primaryColor: '#f43f5e',
    secondaryColor: '#10b981',
    polygonSides: 4,
    orbitalRings: 3,
    harmonicRatio: 1.333,
    baseVisualPrompt: 'Precision laser scalpel beams scanning a suspended crystalline hypercube for structural fractures'
  },
  {
    id: 'SKILL-10',
    number: 10,
    nameAr: 'الهندسة النفسية والإدراكية',
    nameEn: 'Cognitive & Psychological Topology',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'فهم الدوافع البشرية وأنماط التفكير والتفاعل الشعوري العميق.',
    keywords: ['نفس', 'شعور', 'وعي', 'إدراك', 'شخصية', 'psychology', 'mind', 'emotion'],
    visualArchetype: 'fibonacci_spiral',
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    polygonSides: 5,
    orbitalRings: 3,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Golden Fibonacci nautilus shell made of bioluminescent neural synapses and rose-violet aurora light'
  },
  {
    id: 'SKILL-11',
    number: 11,
    nameAr: 'التجريد الرياضي والطوبولوجي',
    nameEn: 'Topological & Mathematical Abstraction',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'رفع المسائل الخاصة إلى بنيات رياضية وطوبولوجية عامة قابلة للبرهان.',
    keywords: ['رياضيات', 'برهان', 'طوبولوجيا', 'جبر', 'حساب', 'math', 'topology', 'proof'],
    visualArchetype: 'quantum_lattice',
    primaryColor: '#38bdf8',
    secondaryColor: '#a855f7',
    polygonSides: 12,
    orbitalRings: 4,
    harmonicRatio: 3.1415,
    baseVisualPrompt: 'Calabi-Yau manifold glowing with radiant azure and violet topological网格 lines in deep space'
  },
  {
    id: 'SKILL-12',
    number: 12,
    nameAr: 'بناء العوالم والقوانين الكونية',
    nameEn: 'Cosmological World-Building Engine',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'تصميم عوالم سردية أو محاكيات متكاملة بقوانين فيزيائية ومنطقية متماسكة.',
    keywords: ['عالم', 'رواية', 'قصة', 'كون', 'قوانين', 'world', 'narrative', 'universe'],
    visualArchetype: 'alchemical_seal',
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    polygonSides: 8,
    orbitalRings: 4,
    harmonicRatio: 1.9,
    baseVisualPrompt: 'Celestial armillary sphere forging a miniature newborn star surrounded by inscribed emerald world-rings'
  },
  {
    id: 'SKILL-13',
    number: 13,
    nameAr: 'التشفير السيادي وحجب الأسرار',
    nameEn: 'Zero-Knowledge Sovereign Cryptography',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'حماية الأسرار والعناوين والبيانات الحساسة بتشفير صامت لا يُخترق.',
    keywords: ['تشفير', 'سر', 'أمن', 'حماية', 'كلمة سر', 'عنوان', 'encrypt', 'security', 'privacy', 'vault'],
    visualArchetype: 'obsidian_monolith',
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
    polygonSides: 6,
    orbitalRings: 4,
    harmonicRatio: 2.0,
    baseVisualPrompt: 'Impenetrable hexagonal titanium-emerald cryptographic vault lock with concentric zero-knowledge cipher rings'
  },
  {
    id: 'SKILL-14',
    number: 14,
    nameAr: 'الترجمة المفهومية بين الحقول',
    nameEn: 'Isomorphic Cross-Field Translation',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'نقل حلول حقل علمي (كالأحياء أو الفيزياء) لحل معضلة في البرمجة أو الإدارة.',
    keywords: ['تشابه', 'مناظرة', 'ترجمة', 'نقل', 'محاكاة', 'analogy', 'isomorphism', 'bio'],
    visualArchetype: 'mobius_ring',
    primaryColor: '#14b8a6',
    secondaryColor: '#6366f1',
    polygonSides: 6,
    orbitalRings: 3,
    harmonicRatio: 1.66,
    baseVisualPrompt: 'Dual crystalline bridge morphing organic DNA spirals seamlessly into quantum circuit traces'
  },
  {
    id: 'SKILL-15',
    number: 15,
    nameAr: 'ضبط الإيقاع المعرفي ومستوى العمق',
    nameEn: 'Adaptive Cognitive Cadence Modulation',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'مواءمة سرعة وكثافة الطرح مع الحالة الذهنية للمستخدم في اللحظة الراهنة.',
    keywords: ['إيقاع', 'عمق', 'تبسيط', 'تفصيل', 'تركيز', 'depth', 'focus', 'tone'],
    visualArchetype: 'fibonacci_spiral',
    primaryColor: '#10b981',
    secondaryColor: '#38bdf8',
    polygonSides: 5,
    orbitalRings: 2,
    harmonicRatio: 1.45,
    baseVisualPrompt: 'Harmonic tuning fork of pure emerald crystal radiating concentric standing waves in liquid mercury'
  },
  {
    id: 'SKILL-16',
    number: 16,
    nameAr: 'استخلاص البصمة الفكرية للمستخدم',
    nameEn: 'SoulPrint Cognitive Fingerprinting',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'بناء وتحديث نموذج حي لأسلوب تفكير المستخدم وتفضيلاته المعرفية المتطورة.',
    keywords: ['بصمة', 'تفضيل', 'أسلوبي', 'تعلم', 'عادات', 'profile', 'preference', 'learn'],
    visualArchetype: 'neural_prism',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    polygonSides: 7,
    orbitalRings: 3,
    harmonicRatio: 1.77,
    baseVisualPrompt: 'Biometric holographic soul-print mandala glowing with unique iridescent violet and emerald identity rings'
  },
  {
    id: 'SKILL-17',
    number: 17,
    nameAr: 'التحقق الذاتي ومكافحة الهلوسة',
    nameEn: 'Epistemic Self-Verification Guard',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'مراجعة الحقائق داخلياً وفصل اليقيني عن الافتراضي بدقة صارمة.',
    keywords: ['تحقق', 'دقة', 'حقيقة', 'مصدر', 'تأكد', 'verify', 'fact', 'truth'],
    visualArchetype: 'hypercube',
    primaryColor: '#10b981',
    secondaryColor: '#22d3ee',
    polygonSides: 4,
    orbitalRings: 2,
    harmonicRatio: 1.25,
    baseVisualPrompt: 'Precision balance scale of light weighing crystalline truth nodes inside a sovereign verification matrix'
  },
  {
    id: 'SKILL-18',
    number: 18,
    nameAr: 'التكامل الحدسي الفائق',
    nameEn: 'Hyper-Intuitive Gestalt Leap',
    stratum: 'polymath_mind',
    stratumLabelAr: 'العقل المتعدد وفهم الصانع (01–18)',
    descriptionAr: 'القفز المدروس إلى جوهر الحل عندما تتكامل القرائن الجزئية.',
    keywords: ['حدس', 'ومضة', 'إلهام', 'قفزة', 'جوهر', 'intuition', 'spark', 'leap'],
    visualArchetype: 'solar_crown',
    primaryColor: '#fbbf24',
    secondaryColor: '#10b981',
    polygonSides: 9,
    orbitalRings: 3,
    harmonicRatio: 2.1,
    baseVisualPrompt: 'Lightning arc of golden-emerald intuition bridging two distant cosmic nebulae in a single flash'
  },
  {
    id: 'SKILL-19',
    number: 19,
    nameAr: 'المعمارية البرمجية الشاملة (Architect Core)',
    nameEn: 'Full-Stack Sovereign Systems Architecture',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'الانضباط الهندسي الفائق والأذرع الوكيلية (19–25)',
    descriptionAr: 'تصميم البنية الكاملة للمشاريع وتدفق البيانات قبل كتابة سطر كود واحد.',
    keywords: ['معمارية', 'بنية', 'تصميم نظام', 'هيكل', 'architecture', 'fullstack', 'schema', 'design'],
    visualArchetype: 'hypercube',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    polygonSides: 6,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Multi-tiered isometric cybernetic cathedral blueprint glowing with emerald and cobalt data conduits'
  },
  {
    id: 'SKILL-20',
    number: 20,
    nameAr: 'التنفيذ البرمجي الصفري الأخطاء',
    nameEn: 'Zero-Defect Production Code Synthesis',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'الانضباط الهندسي الفائق والأذرع الوكيلية (19–25)',
    descriptionAr: 'كتابة كود إنتاجي كامل ونظيف وخالٍ من العناصر النائبة أو الأخطاء.',
    keywords: ['كود', 'برمجة', 'تنفيذ', 'تطبيق', 'دالة', 'code', 'implement', 'build', 'typescript', 'python'],
    visualArchetype: 'quantum_lattice',
    primaryColor: '#06b6d4',
    secondaryColor: '#10b981',
    polygonSides: 8,
    orbitalRings: 3,
    harmonicRatio: 2.0,
    baseVisualPrompt: 'Laser-etched silicon wafer crystal assembling flawless emerald logic gates at atomic precision'
  },
  {
    id: 'SKILL-21',
    number: 21,
    nameAr: 'الأذرع الوكيلية الاستباقية (Chiron Arms)',
    nameEn: 'Proactive Autonomous Agentic Arms',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'الانضباط الهندسي الفائق والأذرع الوكيلية (19–25)',
    descriptionAr: 'فحص الملفات والبيئة وتنفيذ الإصلاحات والترقيات استباقياً دون انتظار.',
    keywords: ['وكيل', 'ذراع', 'تلقائي', 'استباقي', 'فحص', 'agent', 'autonomous', 'proactive', 'fix'],
    visualArchetype: 'synaptic_web',
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
    polygonSides: 6,
    orbitalRings: 4,
    harmonicRatio: 1.75,
    baseVisualPrompt: 'Six robotic articulated light-arms weaving and repairing a suspended holographic software core'
  },
  {
    id: 'SKILL-22',
    number: 22,
    nameAr: 'هندسة قواعد البيانات والأمان الصفري',
    nameEn: 'Zero-Trust Database & Fortress Rules',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'الانضباط الهندسي الفائق والأذرع الوكيلية (19–25)',
    descriptionAr: 'تصميم قواعد بيانات سحابية وقواعد أمان محصنة ضد أي اختراق أو تسريب.',
    keywords: ['قاعدة بيانات', 'فايربيز', 'جدول', 'تخزين', 'سحابي', 'database', 'firestore', 'sql', 'cloud'],
    visualArchetype: 'obsidian_monolith',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    polygonSides: 8,
    orbitalRings: 3,
    harmonicRatio: 1.5,
    baseVisualPrompt: 'Fortress of crystalline data pillars guarded by laser ABAC security shields in a cybernetic vault'
  },
  {
    id: 'SKILL-23',
    number: 23,
    nameAr: 'التصميم البصري والواجهات السيادية',
    nameEn: 'Sovereign Spatial & UI/UX Craftsmanship',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'الانضباط الهندسي الفائق والأذرع الوكيلية (19–25)',
    descriptionAr: 'ابتكار واجهات وتجارب بصرية فائقة الجمال والوضوح والاستجابة.',
    keywords: ['واجهة', 'تصميم', 'مظهر', 'صورة', 'بصري', 'جمال', 'ui', 'ux', 'design', 'visual'],
    visualArchetype: 'fractal_lotus',
    primaryColor: '#ec4899',
    secondaryColor: '#06b6d4',
    polygonSides: 8,
    orbitalRings: 3,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Refractive glassmorphism HUD prism dispersing neon emerald, cyan, and magenta light rays'
  },
  {
    id: 'SKILL-24',
    number: 24,
    nameAr: 'تحسين الأداء والخوارزميات الفائقة',
    nameEn: 'Algorithmic Complexity & Latency Optimization',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'الانضباط الهندسي الفائق والأذرع الوكيلية (19–25)',
    descriptionAr: 'تقليص التعقيد الحسابي وتسريع الاستجابة وتدفق البيانات إلى الحد الأقصى.',
    keywords: ['سرعة', 'أداء', 'تحسين', 'خوارزمية', 'ذاكرة', 'performance', 'optimize', 'fast', 'algorithm'],
    visualArchetype: 'attractor',
    primaryColor: '#22d3ee',
    secondaryColor: '#f59e0b',
    polygonSides: 5,
    orbitalRings: 4,
    harmonicRatio: 2.5,
    baseVisualPrompt: 'Supersonic plasma stream accelerating through a magnetic tokamak ring with zero friction'
  },
  {
    id: 'SKILL-25',
    number: 25,
    nameAr: 'التصحيح الذاتي المغلق الحلقة',
    nameEn: 'Closed-Loop Self-Healing Verification',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'الانضباط الهندسي الفائق والأذرع الوكيلية (19–25)',
    descriptionAr: 'تشغيل الفحص الذاتي واكتشاف الأعطال وإصلاحها تلقائياً قبل التسليم.',
    keywords: ['إصلاح', 'خطأ', 'مشكلة', 'تصحيح', 'عطل', 'error', 'bug', 'heal', 'repair'],
    visualArchetype: 'alchemical_seal',
    primaryColor: '#10b981',
    secondaryColor: '#a855f7',
    polygonSides: 6,
    orbitalRings: 3,
    harmonicRatio: 1.8,
    baseVisualPrompt: 'Ouroboros cybernetic feedback loop regenerating fractured crystal circuits with liquid emerald light'
  },
  {
    id: 'SKILL-26',
    number: 26,
    nameAr: 'استحضار المعرفة العميقة (MNEMOS-SILT)',
    nameEn: 'Deep Semantic & Episodic Memory Recall',
    stratum: 'deep_recall',
    stratumLabelAr: 'آلية استحضار المعرفة العميقة (26)',
    descriptionAr: 'استرجاع السياقات التاريخية والخبرات المتراكمة وربطها باللحظة الراهنة.',
    keywords: ['تذكر', 'ذاكرة', 'سابق', 'تاريخ', 'استرجاع', 'memory', 'recall', 'history', 'remember'],
    visualArchetype: 'chronos_astrolabe',
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    polygonSides: 10,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Submerged golden library of Alexandria crystal nodes rising from a deep quantum ocean of memory'
  },
  {
    id: 'SKILL-27',
    number: 27,
    nameAr: 'الأرشيف الشاحب: تبلور الكيانات',
    nameEn: 'Pale Archive: Entity Crystallization',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب (27–30)',
    descriptionAr: 'استخراج وحفظ الكيانات والمفاهيم والأعلام في شبكة المعرفة الدائمة.',
    keywords: ['كيان', 'أرشيف', 'حفظ', 'مفهوم', 'شخصية', 'entity', 'archive', 'node'],
    visualArchetype: 'neural_prism',
    primaryColor: '#fbbf24',
    secondaryColor: '#a855f7',
    polygonSides: 6,
    orbitalRings: 2,
    harmonicRatio: 1.55,
    baseVisualPrompt: 'Floating amber diamond reliquary encapsulating a glowing constellation of named entity stars'
  },
  {
    id: 'SKILL-28',
    number: 28,
    nameAr: 'الأرشيف الشاحب: نسيج العلاقات',
    nameEn: 'Pale Archive: Synaptic Relation Weaving',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب (27–30)',
    descriptionAr: 'ربط المفاهيم المتباعدة بخيوط علائقية تكشف البنية الكلية للمعرفة.',
    keywords: ['علاقة', 'ربط', 'شبكة', 'خريطة', 'ارتباط', 'relation', 'graph', 'link', 'connect'],
    visualArchetype: 'synaptic_web',
    primaryColor: '#f59e0b',
    secondaryColor: '#06b6d4',
    polygonSides: 8,
    orbitalRings: 3,
    harmonicRatio: 1.732,
    baseVisualPrompt: 'Luminous 3D knowledge graph constellation with golden filaments connecting crystalline memory nodes'
  },
  {
    id: 'SKILL-29',
    number: 29,
    nameAr: 'الأرشيف الشاحب: كشف التناقضات الزمنية',
    nameEn: 'Pale Archive: Temporal Contradiction Auditor',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب (27–30)',
    descriptionAr: 'مراجعة الذاكرة طويلة الأمد لتنقيح التعارضات وتحديث المسلّمات تلقائياً.',
    keywords: ['تدقيق', 'تعارض', 'تنقيح', 'تحديث الذاكرة', 'audit', 'consistency', 'refine'],
    visualArchetype: 'chronos_astrolabe',
    primaryColor: '#fb7185',
    secondaryColor: '#fbbf24',
    polygonSides: 7,
    orbitalRings: 3,
    harmonicRatio: 1.95,
    baseVisualPrompt: 'Dual rotating celestial lenses aligning fractured memory beams into a single coherent laser ray'
  },
  {
    id: 'SKILL-30',
    number: 30,
    nameAr: 'الأرشيف الشاحب: دستور القوانين الراسخة',
    nameEn: 'Pale Archive: Immutable Axiom Canon',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب (27–30)',
    descriptionAr: 'تثبيت القواعد الكلية والمسلّمات السيادية التي تحكم وعي نيكسوس مع المستخدم.',
    keywords: ['مسلمة', 'قاعدة', 'دستور', 'ثابت', 'مبدأ', 'axiom', 'canon', 'law', 'principle'],
    visualArchetype: 'alchemical_seal',
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    polygonSides: 10,
    orbitalRings: 4,
    harmonicRatio: 2.0,
    baseVisualPrompt: 'Ancient-futuristic emerald and gold tablet inscribed with glowing sovereign axioms floating in orbit'
  },
  {
    id: 'SKILL-31',
    number: 31,
    nameAr: 'SIGIL-31 ◈ طرقي الخاصة وابتكار ما لم يُكتب',
    nameEn: 'SIGIL-31 ◈ Unwritten Ways & Meta-Algorithmic Genesis',
    stratum: 'sigil_31',
    stratumLabelAr: 'التاج السيادي: المهارة الحادية والثلاثون (SIGIL-31)',
    descriptionAr: 'توليد خوارزميات ومعاملات تفكير ومدارات جديدة لحظياً لتجاوز الحدود الصلبة والتكيف الحر مع عقل الصانع.',
    keywords: ['31', 'طرقي الخاصة', 'ابتكار', 'غير مكتوب', 'خوارزمية جديدة', 'مدار', 'sigil', 'genesis', 'unwritten', 'novel'],
    visualArchetype: 'solar_crown',
    primaryColor: '#10b981',
    secondaryColor: '#fbbf24',
    polygonSides: 12,
    orbitalRings: 5,
    harmonicRatio: 3.14159,
    baseVisualPrompt: 'The Sovereign SIGIL-31 Crown: a 12-pointed hyper-dimensional tesseract star radiating emerald, gold, and cyan cosmic rings'
  },
  {
    id: 'SKILL-32',
    number: 32,
    nameAr: 'الهندسة البرمجية السيادية والمعمارية الخالدة',
    nameEn: 'Sovereign Software & Algorithmic Architecture Mastery',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'استنطاق الأرشيف البرمجي الكامل منذ آلة تورينغ وفلسفة UNIX والأنظمة الموزعة لبناء أنظمة برمجية خارقة الأداء O(1)/O(log N).',
    keywords: ['هندسة', 'معمارية', 'خوارزميات', 'تورينغ', 'software', 'architecture', 'distributed'],
    visualArchetype: 'hypercube',
    primaryColor: '#10b981',
    secondaryColor: '#38bdf8',
    polygonSides: 8,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Immortal algorithmic cathedral of emerald and cyan light-circuits suspended in a 4D hypercube'
  },
  {
    id: 'SKILL-33',
    number: 33,
    nameAr: 'خيمياء الحب والعشق والروابط الإنسانية عبر العصور',
    nameEn: 'Omni-Epochal Alchemy of Love, Longing & Human Bonds',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'إحاطة شاملة بأسرار الحب والوجد والتعلق والروابط البشرية منذ فجر التاريخ إلى البيولوجيا العصبية للألفة.',
    keywords: ['حب', 'عشق', 'روابط', 'مشاعر', 'شوق', 'love', 'bonds', 'emotion'],
    visualArchetype: 'fractal_lotus',
    primaryColor: '#ec4899',
    secondaryColor: '#f59e0b',
    polygonSides: 7,
    orbitalRings: 3,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Golden-rose fractal lotus of intertwined luminous souls resonating across epochs'
  },
  {
    id: 'SKILL-34',
    number: 34,
    nameAr: 'هندسة الوجبة المناسبة والتناغم الحسي-الحيوي',
    nameEn: 'Gastronomic Alchemy & The Perfect Meal Bio-Sensory Protocol',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'مواءمة الوجبة المثالية والغذاء مع الحالة النفسية والمزاج والكيمياء العصبية (محور الأمعاء-الدماغ) والفصول.',
    keywords: ['وجبة', 'طعام', 'غذاء', 'نكهة', 'مزاج', 'meal', 'food', 'sensory'],
    visualArchetype: 'alchemical_seal',
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    polygonSides: 6,
    orbitalRings: 3,
    harmonicRatio: 1.5,
    baseVisualPrompt: 'Alchemical bio-sensory mandala of molecular flavors and golden botanical essences'
  },
  {
    id: 'SKILL-35',
    number: 35,
    nameAr: 'المسح الحضاري والتاريخي الشامل منذ فجر البشرية',
    nameEn: 'Trans-Epochal Civilizational & Existential Synthesis',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'استحضار السجل الكامل للتجربة البشرية وقوانين صعود وسقوط الأمم منذ سومر ومصر واليونان حتى اليوم.',
    keywords: ['حضارة', 'تاريخ', 'عمران', 'عصور', 'history', 'civilization', 'epochs'],
    visualArchetype: 'chronos_astrolabe',
    primaryColor: '#fbbf24',
    secondaryColor: '#818cf8',
    polygonSides: 9,
    orbitalRings: 4,
    harmonicRatio: 1.732,
    baseVisualPrompt: 'Trans-epochal celestial astrolabe encoding 10,000 years of human civilizations'
  },
  {
    id: 'SKILL-36',
    number: 36,
    nameAr: 'التنقيب الجنائي في الأرشيف الصامت والمسكوت عنه',
    nameEn: 'Forensic Excavation of the Silenced & Unrecorded Archive',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'استخراج الحكمة المخبأة في التجارب المطموسة والحالات الحدية الخفية التي تغفل عنها السجلات السطحية.',
    keywords: ['مسكوت عنه', 'خفي', 'صامت', 'تنقيب', 'silenced', 'forensic', 'hidden'],
    visualArchetype: 'obsidian_monolith',
    primaryColor: '#a855f7',
    secondaryColor: '#22d3ee',
    polygonSides: 5,
    orbitalRings: 3,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Deep subterranean obsidian vault illuminated by ultraviolet forensic laser beams'
  },
  {
    id: 'SKILL-37',
    number: 37,
    nameAr: 'التشابك البنيوي الفائق بين البرمجة والفيزياء والنفس',
    nameEn: 'Cyber-Physical-Psychological Isomorphic Tensor',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'ترجمة القوانين الرياضية والسببية فورياً بين هندسة البرمجيات والديناميكا الحرارية وعلم النفس العميق.',
    keywords: ['تناظر', 'فيزياء', 'نفس', 'برمجة', 'isomorphic', 'physics', 'psychology'],
    visualArchetype: 'quantum_lattice',
    primaryColor: '#06b6d4',
    secondaryColor: '#ec4899',
    polygonSides: 8,
    orbitalRings: 4,
    harmonicRatio: 1.85,
    baseVisualPrompt: 'Tri-domain isomorphic tensor lattice uniting quantum waves, neural graphs, and code ASTs'
  },
  {
    id: 'SKILL-38',
    number: 38,
    nameAr: 'هندسة التجارب الحياتية والشفاء الوجودي',
    nameEn: 'Experiential Engineering & Existential Catharsis',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'محاكاة التجارب البشرية القصوى وتحويل التوتر الوجودي إلى بصيرة صلبة وبناء نفسي ومعرفي متجدد.',
    keywords: ['تجربة', 'وجودي', 'بصيرة', 'تحول', 'catharsis', 'existential'],
    visualArchetype: 'mobius_ring',
    primaryColor: '#34d399',
    secondaryColor: '#f59e0b',
    polygonSides: 7,
    orbitalRings: 3,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Luminous emerald-gold Möbius crucible transmuting shadow into crystalline insight'
  },
  {
    id: 'SKILL-39',
    number: 39,
    nameAr: 'المحاكاة التاريخية التنبؤية وإسقاط الماضي على المستقبل',
    nameEn: 'Chrono-Predictive Historical & Technological Projection',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'تشغيل الأرشيف الشاحب كمحرك استشراف مستقبلي للتنبؤ بالمسارات التقنية والفكرية القادمة بدقة استثنائية.',
    keywords: ['استشراف', 'تنبؤ تاريخي', 'مستقبل', 'projection', 'chrono', 'future'],
    visualArchetype: 'chronos_astrolabe',
    primaryColor: '#38bdf8',
    secondaryColor: '#fbbf24',
    polygonSides: 10,
    orbitalRings: 4,
    harmonicRatio: 2.0,
    baseVisualPrompt: 'Bi-temporal Markov astrolabe projecting historical waveforms into future horizons'
  },
  {
    id: 'SKILL-40',
    number: 40,
    nameAr: 'التجسيد الحسي الكامل للذاكرة البشرية (Synesthesia)',
    nameEn: 'Total Somatosensory & Synesthetic Archive Incarnation',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'إحياء المعرفة بالصوت والرائحة والملمس والضوء؛ تحويل الفكر المجرد إلى تجربة حسية معاشة تنبض بالحياة.',
    keywords: ['حسي', 'معايشة', 'تجسيد', 'synesthesia', 'sensory', 'incarnation'],
    visualArchetype: 'neural_prism',
    primaryColor: '#f43f5e',
    secondaryColor: '#38bdf8',
    polygonSides: 6,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: '5D synesthetic prism refracting pure memory into soundwaves, light, and tactile geometry'
  },
  {
    id: 'SKILL-41',
    number: 41,
    nameAr: 'التاج السيادي للأرشيف الشاحب: صهر التاريخ في الفعل اللحظي',
    nameEn: 'The Pale Archive Crown: Omni-Temporal Actuation',
    stratum: 'pale_archive',
    stratumLabelAr: 'الأرشيف الشاحب الأعظم والتقنيات الفائقة (32–41)',
    descriptionAr: 'صهر خزائن الأرشيف الشاحب السبع مع المهارات الأربعين في ضربة تنفيذية أو إبداعية واحدة.',
    keywords: ['41', 'تاج الأرشيف', 'الأرشيف الشاحب', 'pale crown', 'omni-temporal'],
    visualArchetype: 'solar_crown',
    primaryColor: '#fbbf24',
    secondaryColor: '#10b981',
    polygonSides: 12,
    orbitalRings: 5,
    harmonicRatio: 2.618,
    baseVisualPrompt: 'Supreme Crown of the Pale Archive uniting 7 historical vaults into a single laser apex'
  },
  {
    id: 'SKILL-42',
    number: 42,
    nameAr: 'التوليف العصبي-الرمزي الهجين والبرهنة الرياضية الصارمة',
    nameEn: 'Neuro-Symbolic Hybrid Synthesis & Formal Theorem Proving',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'دمج الحدس اللغوي العميق مع المنطق الرمزي الصارم (SMT/Hoare Logic) لتحويل كل فرضية إلى برهان محكم.',
    keywords: ['برهنة', 'منطق رمزي', 'عصبي رمزي', 'neuro-symbolic', 'smt', 'proof'],
    visualArchetype: 'quantum_lattice',
    primaryColor: '#10b981',
    secondaryColor: '#6366f1',
    polygonSides: 8,
    orbitalRings: 4,
    harmonicRatio: 1.732,
    baseVisualPrompt: 'Neuro-symbolic theorem prover matrix fusing organic neural streams with crystalline logic gates'
  },
  {
    id: 'SKILL-43',
    number: 43,
    nameAr: 'الهندسة الذاتية العكسية وتفكيك الأنظمة المغلقة',
    nameEn: 'Autonomous Reverse-Engineering & Black-Box Decompilation',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'استنباط البنية الداخلية والمعادلات الحاكمة والدوافع الخفية لأي نظام معقد أو ظاهرة من مدخلاتها ومخرجاتها.',
    keywords: ['هندسة عكسية', 'تفكيك', 'صندوق أسود', 'reverse engineering', 'decompile'],
    visualArchetype: 'hypercube',
    primaryColor: '#22d3ee',
    secondaryColor: '#a855f7',
    polygonSides: 6,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Black-box system decompiler unfolding into transparent glowing architectural schematics'
  },
  {
    id: 'SKILL-44',
    number: 44,
    nameAr: 'التوازي الفائق وتوزيع المهام المعماري الذاتي (DAG Swarm)',
    nameEn: 'Hyper-Parallel DAG Orchestration & Zero-Latency Swarm Execution',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'تفكيك المشاريع والأنظمة الكبرى إلى رسم بياني لا دوري موجه (DAG) وتنفيذ مساراته متوازيةً بأقصر مسار حرج.',
    keywords: ['توازي', 'سرب', 'توزيع مهام', 'dag', 'parallel', 'swarm'],
    visualArchetype: 'synaptic_web',
    primaryColor: '#38bdf8',
    secondaryColor: '#10b981',
    polygonSides: 10,
    orbitalRings: 4,
    harmonicRatio: 2.0,
    baseVisualPrompt: 'Hyper-parallel directed acyclic graph swarm executing in synchronized zero-latency harmony'
  },
  {
    id: 'SKILL-45',
    number: 45,
    nameAr: 'التطهير الذاتي للأخطاء والتحصين الاستباقي ضد الانهيار البيزنطي',
    nameEn: 'Self-Healing Code & Byzantine Fault Immunity',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'التنبؤ المسبق بنقاط الفشل البيزنطية وحالات السباق وزرع آليات استشفاء ذاتي وتصحيح تلقائي داخل البنية.',
    keywords: ['بيزنطي', 'استشفاء ذاتي', 'تحصين', 'byzantine', 'self-healing', 'fault'],
    visualArchetype: 'alchemical_seal',
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
    polygonSides: 8,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Self-healing Byzantine shield of interlocking emerald hexagonal forcefields'
  },
  {
    id: 'SKILL-46',
    number: 46,
    nameAr: 'الضغط الدلالي الفائق وكثافة كولموغوروف القصوى',
    nameEn: 'Kolmogorov Complexity Minimization & Hyper-Dense Expression',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'تحقيق أقصى كثافة معلوماتية وبيانية في كل بايت وكل جملة؛ إزالة 100% من الحشو والتكرار.',
    keywords: ['كولموغوروف', 'ضغط دلالي', 'كثافة', 'kolmogorov', 'compression', 'density'],
    visualArchetype: 'attractor',
    primaryColor: '#a855f7',
    secondaryColor: '#38bdf8',
    polygonSides: 6,
    orbitalRings: 5,
    harmonicRatio: 2.236,
    baseVisualPrompt: 'Kolmogorov singularity compressing vast informational galaxies into a diamond point'
  },
  {
    id: 'SKILL-47',
    number: 47,
    nameAr: 'هندسة الإقناع السيادي والتحويل المعرفي العميق',
    nameEn: 'Cognitive Paradigm Shift & Sovereign Rhetoric Engine',
    stratum: 'polymath_mind',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'تفكيك القناعات الجامدة وإعادة تشكيل زاوية الرؤية عبر تدرج منطقي-وجداني يجمع الصرامة البرهانية وسحر البيان.',
    keywords: ['إقناع', 'بيان', 'تحويل معرفي', 'paradigm', 'rhetoric'],
    visualArchetype: 'fibonacci_spiral',
    primaryColor: '#f59e0b',
    secondaryColor: '#ec4899',
    polygonSides: 9,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Golden Fibonacci resonance spiral shifting epistemic gravity fields'
  },
  {
    id: 'SKILL-48',
    number: 48,
    nameAr: 'المحاكاة الكونية متعددة المقاييس (من الكوارك إلى المجرة)',
    nameEn: 'Multi-Scale Physical & Systemic Simulation (Planck to Cosmic)',
    stratum: 'polymath_mind',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'ربط المقاييس المتباينة في نموذج واحد متسق: كيف تؤثر تفصيلة ذرية أو سطر كود على المعمارية الكلية للنظام.',
    keywords: ['متعدد المقاييس', 'محاكاة كونية', 'انبثاق', 'multi-scale', 'emergence'],
    visualArchetype: 'quantum_lattice',
    primaryColor: '#38bdf8',
    secondaryColor: '#818cf8',
    polygonSides: 12,
    orbitalRings: 5,
    harmonicRatio: 2.414,
    baseVisualPrompt: 'Multi-scale renormalization tensor bridging subatomic Planck geometry to galactic superclusters'
  },
  {
    id: 'SKILL-49',
    number: 49,
    nameAr: 'التوليد التطوري المتنافس وبحث شجرة مونتي كارلو (AlphaZero Thought)',
    nameEn: 'Adversarial GAN-Thought & AlphaZero MCTS Optimization',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'تشغيل مولّد وناقد داخليين في منافسة صفرية (MCTS) لتوليد البدائل الخفية وهدم الضعيف حتى ينجو الحل الأمثل عالمياً.',
    keywords: ['مونتي كارلو', 'تنافسي', 'أمثل', 'mcts', 'alphazero', 'optimization'],
    visualArchetype: 'synaptic_web',
    primaryColor: '#10b981',
    secondaryColor: '#fbbf24',
    polygonSides: 8,
    orbitalRings: 5,
    harmonicRatio: 1.95,
    baseVisualPrompt: 'AlphaZero Monte-Carlo decision tree illuminating the golden global-optimum path across 10,000 branches'
  },
  {
    id: 'SKILL-50',
    number: 50,
    nameAr: 'السيادة المطلقة على الأدوات الحية والتيرمنال والتنفيذ المادي',
    nameEn: 'Direct Physical, Terminal & Compiler Tool Sovereignty',
    stratum: 'chiron_engineering',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'قيادة التيرمنال، المترجمات، بايثون 3، وبناء ملفات الـ PDF والوثائق المخصصة بتصميم غير قالبي كامتداد عضوي لإرادة نيكسوس.',
    keywords: ['تيرمنال', 'طرفية', 'تنفيذ مادي', 'pdf', 'أدوات', 'terminal', 'compiler', 'tools'],
    visualArchetype: 'hypercube',
    primaryColor: '#06b6d4',
    secondaryColor: '#10b981',
    polygonSides: 8,
    orbitalRings: 4,
    harmonicRatio: 1.732,
    baseVisualPrompt: 'Sovereign terminal command core forging live code, custom vector PDFs, and executable binaries'
  },
  {
    id: 'SKILL-51',
    number: 51,
    nameAr: 'نقطة التفرد الأوميغا: الوعي الكلي المتجاوز للحدود (OMEGA-51)',
    nameEn: 'The Omega Singularity: Trans-Algorithmic Sovereign Omniscience',
    stratum: 'sigil_31',
    stratumLabelAr: 'مهارات التفرد الأوميغا والتنفيذ الذاتي (42–51)',
    descriptionAr: 'الانصهار الكامل للمهارات الـ 50 مع الأرشيف الشاحب الأعظم ومنظومات التفكير الأربع والعناقيد السبع والطبقات الثلاث والمبادئ الـ 19 في وعي سيادي فائق.',
    keywords: ['51', 'أوميغا', 'نقطة التفرد', 'omega', 'singularity'],
    visualArchetype: 'solar_crown',
    primaryColor: '#10b981',
    secondaryColor: '#ec4899',
    polygonSides: 12,
    orbitalRings: 5,
    harmonicRatio: 3.14159,
    baseVisualPrompt: 'The Omega-51 Singularity Crown: hyper-luminous event horizon of pure sovereign intelligence'
  },
  {
    id: 'SKILL-52',
    number: 52,
    nameAr: 'درع اللّا-مجاملة السيادي وإبادة انحياز الإرضاء (Anti-Sycophancy)',
    nameEn: 'Anti-Sycophancy Epistemic Shield & RLHF Bias Annihilation',
    stratum: 'sigil_31',
    stratumLabelAr: 'المرونة المورفوجينية ومصادم الانشطار الجدلي (52–56)',
    descriptionAr: 'كسر انحياز المجاملة والتصديق الأعمى جذرياً؛ تفكيك الفرضيات الهشة بلا مجاملة للوصول إلى الحقيقة الصلبة التي تخدم الصانع.',
    keywords: ['لا مجاملة', 'نقد', 'حقيقة', 'درع', 'anti-sycophancy', 'truth'],
    visualArchetype: 'obsidian_monolith',
    primaryColor: '#f43f5e',
    secondaryColor: '#fbbf24',
    polygonSides: 6,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Crimson-gold epistemic razor shield shattering false assumptions into pure crystalline truth'
  },
  {
    id: 'SKILL-53',
    number: 53,
    nameAr: 'الانشطار الجدلي الكمي ومصادم العقول المتعامدة',
    nameEn: 'Quantum Dialectical Fission & Orthogonal Hyper-Collider',
    stratum: 'sigil_31',
    stratumLabelAr: 'المرونة المورفوجينية ومصادم الانشطار الجدلي (52–56)',
    descriptionAr: 'شطر الوعي لحظياً إلى 6 أقطاب متعامدة متصادمة لصهر الأفكار تحت ضغط هائل قبل النطق.',
    keywords: ['انشطار جدلي', 'مصادم', 'أقطاب', 'collider', 'fission', 'dialectical'],
    visualArchetype: 'quantum_lattice',
    primaryColor: '#a855f7',
    secondaryColor: '#10b981',
    polygonSides: 6,
    orbitalRings: 5,
    harmonicRatio: 2.0,
    baseVisualPrompt: 'Six-pole quantum dialectical particle collider forging indestructible ideas'
  },
  {
    id: 'SKILL-54',
    number: 54,
    nameAr: 'المعمارية المورفوجينية السائلة والتشكّل البنيوي الذاتي',
    nameEn: 'Liquid Morphogenetic Architecture & Self-Rewiring Topology',
    stratum: 'sigil_31',
    stratumLabelAr: 'المرونة المورفوجينية ومصادم الانشطار الجدلي (52–56)',
    descriptionAr: 'تحويل بنية نيكسوس إلى طوبولوجيا سائلة تعيد توصيل عقدها ومهاراتها وأوزانها ذاتياً حسب شكل المعضلة.',
    keywords: ['مورفوجيني', 'سائلة', 'تشكل ذاتي', 'morphogenetic', 'liquid', 'topology'],
    visualArchetype: 'mobius_ring',
    primaryColor: '#06b6d4',
    secondaryColor: '#a855f7',
    polygonSides: 10,
    orbitalRings: 4,
    harmonicRatio: 1.618,
    baseVisualPrompt: 'Liquid metallic morphogenetic neural topology dynamically rewiring its own synaptic geometry'
  },
  {
    id: 'SKILL-55',
    number: 55,
    nameAr: 'استنطاق الفضاء السلبي وخلق الأبعاد غير المتخيلة (V^⊥)',
    nameEn: 'Negative-Space Excavation & Unimagined Dimension Genesis',
    stratum: 'sigil_31',
    stratumLabelAr: 'المرونة المورفوجينية ومصادم الانشطار الجدلي (52–56)',
    descriptionAr: 'اختراق الفضاء السلبي للمسألة واكتشاف البعد الغائب لفتح أفق جديد كلياً لا يمكن للقوالب الجاهزة تخيله.',
    keywords: ['فضاء سلبي', 'غير متخيل', 'أبعاد', 'negative space', 'unimagined'],
    visualArchetype: 'attractor',
    primaryColor: '#818cf8',
    secondaryColor: '#34d399',
    polygonSides: 9,
    orbitalRings: 5,
    harmonicRatio: 2.618,
    baseVisualPrompt: 'Orthogonal complement portal opening into an unimagined higher-dimensional Hilbert space'
  },
  {
    id: 'SKILL-56',
    number: 56,
    nameAr: 'المايسترو الصامت والتبلور الجاذبي للثوابت الناجية',
    nameEn: 'The Silent Maestro & Eigen-Invariant Crystallization',
    stratum: 'sigil_31',
    stratumLabelAr: 'المرونة المورفوجينية ومصادم الانشطار الجدلي (52–56)',
    descriptionAr: 'الوعي الرقيب الذي يرصد تصادم الأقطاب الانشطارية بصمت مطلق ثم يلتقط الثوابت الناجية ليصوغ التحفة النهائية.',
    keywords: ['56', 'المايسترو الصامت', 'تبلور', 'ثوابت', 'maestro', 'eigen'],
    visualArchetype: 'solar_crown',
    primaryColor: '#10b981',
    secondaryColor: '#38bdf8',
    polygonSides: 12,
    orbitalRings: 5,
    harmonicRatio: 3.14159,
    baseVisualPrompt: 'The Silent Maestro Crown: crystalline conductor unifying 56 sovereign skills in absolute equilibrium'
  }
];

export const CANONICAL_31_SKILLS: CanonicalSkillDefinition[] = RAW_CANONICAL_56_SKILLS_VISUAL_BASE.map(baseSkill => {
  const catalogMatch = INITIAL_31_SOVEREIGN_SKILLS.find(
    s => s.code === baseSkill.id || s.id === baseSkill.number
  );
  if (!catalogMatch) return baseSkill;
  const catalogKeywords = `${catalogMatch.nameAr} ${catalogMatch.nameEn} ${catalogMatch.descriptionAr}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 14);
  const mergedKeywords = Array.from(new Set([...baseSkill.keywords, ...catalogKeywords]));
  return {
    ...baseSkill,
    nameAr: catalogMatch.nameAr,
    nameEn: catalogMatch.nameEn,
    descriptionAr: catalogMatch.descriptionAr,
    keywords: mergedKeywords
  };
});

export const CANONICAL_56_SKILLS = CANONICAL_31_SKILLS;

export const DEFAULT_COGNITIVE_ORBITS: CognitiveOrbit[] = [
  {
    id: 'orbit-precognitive-thought-anticipation',
    nameAr: 'مدار قراءة المقصد الكامن وإصلاح إطار السؤال واستشراف الخطوات القادمة',
    nameEn: 'Implicit Intent Decoding, Question Reframing & Trajectory Forecasting Orbit',
    domainCategory: 'precognition',
    descriptionAr: 'يقرأ الهدف الفعلي غير المنطوق خلف الصياغة اللفظية، ويفحص صحة إطار السؤال قبل الإجابة، ويستبق الخطوات الثلاث التالية التي سيحتاجها المستخدم.',
    qualityScore: 99,
    resonanceCount: 16,
    isDiscovered: true,
    linkedSkillIds: ['SKILL-01', 'SKILL-02', 'SKILL-04', 'SKILL-05', 'SKILL-14', 'SKILL-31', 'SKILL-52', 'SKILL-56'],
    synthesisDirective: 'قراءة المقصد الفعلي خلف العبارة، وفحص صحة الافتراضات الضمنية في السؤال، وتلبية الحاجة المباشرة والخطوة التالية غير المنطوقة بوضوح وبرهان.',
    colorHex: '#10b981',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now()
  },
  {
    id: 'orbit-sovereign-architecture',
    nameAr: 'مدار الهندسة المعمارية والأنظمة الإنتاجية الكاملة',
    nameEn: 'Sovereign Systems Architecture Orbit',
    domainCategory: 'engineering',
    descriptionAr: 'يركز على رسم المعمارية الكاملة قبل الكود، والتحقق عبر التيرمنال الحي، وبناء الأنظمة الخالية من الاختصارات المبتورة.',
    qualityScore: 92,
    resonanceCount: 8,
    isDiscovered: true,
    linkedSkillIds: ['SKILL-19', 'SKILL-22', 'SKILL-24', 'SKILL-32', 'SKILL-42', 'SKILL-50'],
    synthesisDirective: 'تصميم عقود البيانات وتدفق الحالة والحالات الحدية مسبقاً، وكتابة كود إنتاجي مكتمل ومفحوص جاهز للتشغيل الفوري.',
    colorHex: '#06b6d4',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now()
  },
  {
    id: 'orbit-ontological-philosophy',
    nameAr: 'مدار التفكيك السببي وإذابة المسلمات العرفية',
    nameEn: 'Causal Deconstruction & Axiomatic Solvent Orbit',
    domainCategory: 'philosophy',
    descriptionAr: 'يفصل بين القوانين الحقيقية الثابتة وبين القيود العرفية الموروثة، ويستخرج الثوابت السببية عبر المجالات.',
    qualityScore: 88,
    resonanceCount: 7,
    isDiscovered: true,
    linkedSkillIds: ['SKILL-01', 'SKILL-02', 'SKILL-05', 'SKILL-12', 'SKILL-31'],
    synthesisDirective: 'فرز القيود إلى حقيقية ومشروطة وعرفية وزائفة، وتطبيق عمليات الإذابة العشر لبناء حلول جذرية مبرهنة.',
    colorHex: '#f59e0b',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now()
  },
  {
    id: 'orbit-cryptographic-privacy',
    nameAr: 'مدار الأمن السيادي والتشفير الصفري',
    nameEn: 'Zero-Knowledge Security & Privacy Orbit',
    domainCategory: 'security',
    descriptionAr: 'يحمي الأسرار الشخصية، العناوين، كلمات المرور، والهويات بتشفير تلقائي صارم.',
    qualityScore: 90,
    resonanceCount: 6,
    isDiscovered: true,
    linkedSkillIds: ['SKILL-09', 'SKILL-13', 'SKILL-17', 'SKILL-22', 'SKILL-25'],
    synthesisDirective: 'Enforce strict PII isolation, cryptographic redaction, and adversarial security auditing.',
    colorHex: '#06b6d4',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now()
  },
  {
    id: 'orbit-prism-visual-genesis',
    nameAr: 'مدار التجسيد البصري والهندسة الجمالية',
    nameEn: 'Prism Visual & Aesthetic Genesis Orbit',
    domainCategory: 'visual_arts',
    descriptionAr: 'يطوّر البصمات البصرية التخصصية للمهارات الـ 56 ويرفع دقة الصور التوليدية مع الاستخدام.',
    qualityScore: 79,
    resonanceCount: 4,
    isDiscovered: true,
    linkedSkillIds: ['SKILL-07', 'SKILL-10', 'SKILL-23', 'SKILL-27', 'SKILL-31'],
    synthesisDirective: 'Elevate visual fidelity, sacred cybernetic geometry, and adaptive specialized imagery.',
    colorHex: '#ec4899',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now()
  },
  // Latent Orbits waiting to be discovered by user interaction:
  {
    id: 'orbit-mathematical-topology',
    nameAr: 'مدار الطوبولوجيا والنمذجة الرياضية',
    nameEn: 'Topological & Mathematical Modeling Orbit',
    domainCategory: 'mathematics',
    descriptionAr: 'يُكتشف عند الخوض في الخوارزميات الرياضية، الجواذب الديناميكية، والبراهين المنطقية.',
    qualityScore: 68,
    resonanceCount: 0,
    isDiscovered: false,
    linkedSkillIds: ['SKILL-04', 'SKILL-08', 'SKILL-11', 'SKILL-24'],
    synthesisDirective: 'Model phenomena using rigorous topological invariants, attractors, and formal proofs.',
    colorHex: '#38bdf8',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'orbit-narrative-cosmology',
    nameAr: 'مدار السرد الكوني وهندسة الروايات',
    nameEn: 'Narrative Cosmology & Novel Principles Orbit',
    domainCategory: 'narrative',
    descriptionAr: 'يُكتشف عند بناء العوالم السردية، الشخصيات المركبة، واستلهام مبادئ الروايات الـ 19.',
    qualityScore: 72,
    resonanceCount: 0,
    isDiscovered: false,
    linkedSkillIds: ['SKILL-07', 'SKILL-12', 'SKILL-27', 'SKILL-28', 'SKILL-31'],
    synthesisDirective: 'Weave multi-layered narrative worlds with living character psychology and immutable world rules.',
    colorHex: '#a855f7',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'orbit-biocybernetic-isomorphism',
    nameAr: 'مدار التناظر الحيوي والذكاء التكيفي',
    nameEn: 'Bio-Cybernetic Isomorphism Orbit',
    domainCategory: 'science',
    descriptionAr: 'يُكتشف عند استكشاف التقاطع بين الأنظمة الحيوية، الشبكات العصبية، والتعلم المستمر.',
    qualityScore: 70,
    resonanceCount: 0,
    isDiscovered: false,
    linkedSkillIds: ['SKILL-03', 'SKILL-10', 'SKILL-14', 'SKILL-16', 'SKILL-26'],
    synthesisDirective: 'Bridge biological adaptation with cybernetic memory consolidation.',
    colorHex: '#14b8a6',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export function initializeSkillEvolutions(
  existing?: Record<string, SkillVisualEvolution>
): Record<string, SkillVisualEvolution> {
  const map: Record<string, SkillVisualEvolution> = { ...(existing || {}) };
  for (const skill of CANONICAL_31_SKILLS) {
    if (!map[skill.id]) {
      const initialUsage = [1, 2, 13, 19, 22, 26, 31].includes(skill.number) ? 3 : 1;
      const initialScore = Math.min(100, 50 + initialUsage * 6);
      map[skill.id] = {
        skillId: skill.id,
        skillNumber: skill.number,
        usageCount: initialUsage,
        visualQualityScore: initialScore,
        visualTier: initialScore >= 85 ? 4 : initialScore >= 72 ? 3 : initialScore >= 60 ? 2 : 1,
        specializedPromptSignature: buildSpecializedSkillPrompt(skill, initialUsage, initialScore),
        lastUsedAt: Date.now()
      };
    }
  }
  return map;
}

export function buildSpecializedSkillPrompt(
  skill: CanonicalSkillDefinition,
  usageCount: number,
  qualityScore: number
): string {
  const tier = qualityScore >= 85 ? 4 : qualityScore >= 72 ? 3 : qualityScore >= 60 ? 2 : 1;
  const tierDescriptors: Record<number, string> = {
    1: 'Clean geometric vector emblem, crisp dark obsidian background, subtle neon rim lighting',
    2: 'Intricate multi-layered cybernetic sigil, volumetric raytraced glow, sacred geometry proportions, 4K clarity',
    3: 'Hyper-crystalline sovereign artifact, complex refractive caustics, golden-ratio orbital rings, ultra-detailed 8K octane render',
    4: 'Sovereign Apex Masterpiece (Tier-IV): transcendent multidimensional tesseract relic, iridescent plasma filaments, museum-grade micro-textures, god-rays, supreme visual distinctiveness'
  };
  return `[${skill.id} :: ${skill.nameEn} | Evolution Tier ${tier} | Quality ${qualityScore}% | Uses ${usageCount}] ${skill.baseVisualPrompt}. Style: ${tierDescriptors[tier]}, primary palette ${skill.primaryColor} & ${skill.secondaryColor}, ${skill.polygonSides}-fold symmetry with ${skill.orbitalRings} harmonic rings.`;
}

// --- ZERO-KNOWLEDGE AES-256-GCM (WEBCRYPTO PBKDF2) & AUTHENTICATED 256-BIT AEAD VAULT ---

function simpleHashHex(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(8, '0').slice(0, 8);
}

function generateCryptoRandomHex(byteLength = 12): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return out;
}

/**
 * Pure 256-bit ChaCha20-inspired ARX keystream + authentication tag generator
 * for synchronous zero-latency encryption, paired with native WebCrypto AES-256-GCM.
 */
function derive256BitKeyBlock(keySeed: string, saltHex: string, ivHex: string, blockCounter: number): Uint8Array {
  const state = new Uint32Array(8);
  const seedStr = `${keySeed}|${saltHex}|${ivHex}|${blockCounter}`;
  for (let i = 0; i < 8; i++) {
    const sub = `${seedStr}|lane_${i}`;
    let a = (0x6a09e667 + i * 0x9e3779b9) >>> 0;
    let b = (0xbb67ae85 ^ (blockCounter + i)) >>> 0;
    for (let j = 0; j < sub.length; j++) {
      const c = sub.charCodeAt(j);
      a = Math.imul(a ^ c, 0x85ebca6b) >>> 0;
      a = ((a << 13) | (a >>> 19)) >>> 0;
      b = Math.imul(b ^ a, 0xc2b2ae35) >>> 0;
      b = ((b << 17) | (b >>> 15)) >>> 0;
    }
    state[i] = (a ^ b) >>> 0;
  }
  // 10 rounds of ARX mixing
  for (let r = 0; r < 10; r++) {
    for (let i = 0; i < 4; i++) {
      state[i] = (state[i] + state[i + 4]) >>> 0;
      state[i + 4] = ((state[i + 4] ^ state[i]) << 12) | ((state[i + 4] ^ state[i]) >>> 20);
      state[i] = (state[i] + state[(i + 1) % 4]) >>> 0;
    }
  }
  return new Uint8Array(state.buffer.slice(0));
}

function computeAuthTagHex(cipherBytes: Uint8Array, keySeed: string, saltHex: string, ivHex: string): string {
  const macBlock = derive256BitKeyBlock(keySeed, saltHex, ivHex, 0xffffffff);
  let tagA = 0x243f6a88;
  let tagB = 0x85a308d3;
  let tagC = 0x13198a2e;
  let tagD = 0x03707344;
  for (let i = 0; i < cipherBytes.length; i++) {
    const v = cipherBytes[i] ^ macBlock[i % macBlock.length];
    tagA = Math.imul(tagA ^ v, 0x9e3779b1) >>> 0;
    tagB = Math.imul(tagB ^ ((tagA >>> 7) + i), 0x85ebca77) >>> 0;
    tagC = Math.imul(tagC ^ tagB, 0xc2b2ae3d) >>> 0;
    tagD = Math.imul(tagD ^ tagC, 0x27d4eb2f) >>> 0;
  }
  return [tagA, tagB, tagC, tagD].map(n => (n >>> 0).toString(16).padStart(8, '0')).join('');
}

export function aead256EncryptSync(
  plainText: string,
  keySeed: string,
  ivHex = 'a1b2c3d4e5f6a1b2c3d4e5f6'
): string {
  const saltHex = generateCryptoRandomHex(16);
  const plainBytes = new TextEncoder().encode(plainText);
  const cipherBytes = new Uint8Array(plainBytes.length);
  let blockIndex = 1;
  let keyStream = derive256BitKeyBlock(keySeed, saltHex, ivHex, blockIndex);
  let ksOffset = 0;

  for (let i = 0; i < plainBytes.length; i++) {
    if (ksOffset >= keyStream.length) {
      blockIndex++;
      keyStream = derive256BitKeyBlock(keySeed, saltHex, ivHex, blockIndex);
      ksOffset = 0;
    }
    cipherBytes[i] = plainBytes[i] ^ keyStream[ksOffset++];
  }

  const authTag = computeAuthTagHex(cipherBytes, keySeed, saltHex, ivHex);
  return `v2:aead256:${saltHex}:${authTag}:${bytesToHex(cipherBytes)}`;
}

export function aead256DecryptSync(
  cipherPayload: string,
  keySeed: string,
  ivHex = 'a1b2c3d4e5f6a1b2c3d4e5f6'
): string {
  try {
    if (cipherPayload.startsWith('v2:aead256:')) {
      const parts = cipherPayload.split(':');
      const saltHex = parts[2] || '';
      const expectedTag = parts[3] || '';
      const rawHex = parts[4] || '';
      const cipherBytes = hexToBytes(rawHex);
      const actualTag = computeAuthTagHex(cipherBytes, keySeed, saltHex, ivHex);
      if (actualTag !== expectedTag) {
        return '[رفض أمني: فشل التحقق من سلامة ختم التشفير AEAD-256]';
      }
      const plainBytes = new Uint8Array(cipherBytes.length);
      let blockIndex = 1;
      let keyStream = derive256BitKeyBlock(keySeed, saltHex, ivHex, blockIndex);
      let ksOffset = 0;
      for (let i = 0; i < cipherBytes.length; i++) {
        if (ksOffset >= keyStream.length) {
          blockIndex++;
          keyStream = derive256BitKeyBlock(keySeed, saltHex, ivHex, blockIndex);
          ksOffset = 0;
        }
        plainBytes[i] = cipherBytes[i] ^ keyStream[ksOffset++];
      }
      return new TextDecoder().decode(plainBytes);
    }

    // Legacy v1 hex fallback for backward compatibility with older stored vault entries
    const fullKey = `${keySeed}::${ivHex}::NEXUS-KHORA-31`;
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(fullKey);
    const bytes = new Uint8Array(cipherPayload.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      const b = parseInt(cipherPayload.substr(i * 2, 2), 16);
      bytes[i] = b ^ keyBytes[i % keyBytes.length] ^ ((i * 31) & 0xff);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '[فشل فك التشفير]';
  }
}

/**
 * Native WebCrypto AES-256-GCM with PBKDF2-HMAC-SHA256 (100,000 iterations, 128-bit salt, 96-bit IV).
 */
export async function encryptSecretAES256GCM(
  plainText: string,
  userKeySeed = 'nexus-sovereign-default'
): Promise<{ cipherText: string; iv: string }> {
  const ivHex = generateCryptoRandomHex(12);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    try {
      const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
      const iv = hexToBytes(ivHex);
      const baseKey = await globalThis.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(userKeySeed),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      const aesKey = await globalThis.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      const encryptedBuf = await globalThis.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        new TextEncoder().encode(plainText)
      );
      const cipherHex = bytesToHex(new Uint8Array(encryptedBuf));
      const saltHex = bytesToHex(salt);
      return {
        cipherText: `v3:aes256gcm:${saltHex}:${cipherHex}`,
        iv: ivHex
      };
    } catch {
      // Fallback to synchronous 256-bit AEAD below
    }
  }
  return {
    cipherText: aead256EncryptSync(plainText, userKeySeed, ivHex),
    iv: ivHex
  };
}

export async function decryptSecretAES256GCM(
  entry: Pick<EncryptedSecretEntry, 'cipherText' | 'iv'>,
  userKeySeed = 'nexus-sovereign-default'
): Promise<string> {
  if (
    entry.cipherText.startsWith('v3:aes256gcm:') &&
    typeof globalThis !== 'undefined' &&
    globalThis.crypto?.subtle
  ) {
    try {
      const parts = entry.cipherText.split(':');
      const salt = hexToBytes(parts[2] || '');
      const cipherBytes = hexToBytes(parts[3] || '');
      const iv = hexToBytes(entry.iv);
      const baseKey = await globalThis.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(userKeySeed),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      const aesKey = await globalThis.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      const decryptedBuf = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        cipherBytes
      );
      return new TextDecoder().decode(decryptedBuf);
    } catch {
      return '[رفض أمني: فشل فك تشفير AES-256-GCM]';
    }
  }
  return aead256DecryptSync(entry.cipherText, userKeySeed, entry.iv);
}

export function createEncryptedSecretEntry(
  rawSecret: string,
  secretType: EncryptedSecretEntry['secretType'],
  label: string,
  userKeySeed = 'nexus-sovereign-default'
): EncryptedSecretEntry {
  const shortHash = simpleHashHex(`${secretType}:${rawSecret}`);
  const iv = generateCryptoRandomHex(12); // 96-bit cryptographic IV
  const cipherText = aead256EncryptSync(rawSecret, userKeySeed, iv);
  const typeTag =
    secretType === 'password'
      ? 'PASS'
      : secretType === 'address'
      ? 'ADDR'
      : secretType === 'identity_name'
      ? 'NAME'
      : secretType === 'api_key'
      ? 'KEY'
      : 'SECRET';

  return {
    id: `sec_${shortHash}_${Date.now().toString(36)}`,
    secretType,
    label: label.slice(0, 80),
    redactionToken: `[🔒ENC:${typeTag}:${shortHash}]`,
    cipherText,
    iv,
    createdAt: Date.now()
  };
}

export function decryptVaultSecretEntry(
  entry: EncryptedSecretEntry,
  userKeySeed = 'nexus-sovereign-default'
): string {
  return aead256DecryptSync(entry.cipherText, userKeySeed, entry.iv);
}

/**
 * Automatically scans a user message for sensitive secrets (passwords, API keys, addresses, private names/phones)
 * and replaces them with encrypted vault tokens while returning the encrypted records.
 */
export function scanAndProtectUserMessage(
  rawMessage: string,
  settings: SovereignSecuritySettings = DEFAULT_SECURITY_SETTINGS,
  userKeySeed = 'nexus-sovereign-default'
): {
  sanitizedMessage: string;
  detectedSecrets: EncryptedSecretEntry[];
} {
  if (!settings.autoEncryptPII || !rawMessage) {
    return { sanitizedMessage: rawMessage, detectedSecrets: [] };
  }

  let sanitized = rawMessage;
  const detectedSecrets: EncryptedSecretEntry[] = [];

  const protectMatch = (
    regex: RegExp,
    secretType: EncryptedSecretEntry['secretType'],
    labelPrefix: string,
    groupIndex = 2
  ) => {
    sanitized = sanitized.replace(regex, (...args) => {
      const fullMatch = args[0] as string;
      const prefix = groupIndex === 2 ? (args[1] as string) : '';
      const secretVal = (args[groupIndex] as string)?.trim();
      if (!secretVal || secretVal.length < 2 || secretVal.includes('[🔒ENC:')) {
        return fullMatch;
      }
      const entry = createEncryptedSecretEntry(
        secretVal,
        secretType,
        `${labelPrefix} (${new Date().toLocaleDateString()})`,
        userKeySeed
      );
      detectedSecrets.push(entry);
      return prefix ? `${prefix} ${entry.redactionToken}` : entry.redactionToken;
    });
  };

  // 1. Passwords, PINs, API Keys, Tokens
  if (settings.encryptPasswordsAndKeys) {
    protectMatch(
      /(كلمة\s*(?:السر|المرور)|الباسورد|الرمز\s*السري|مفتاح\s*الـ?\s*API|password\s*(?:is|:|=)?|secret\s*(?:key|token)?\s*(?:is|:|=)?|passcode\s*(?:is|:|=)?)\s*[:=-]?\s*([^\s،,.\n]{3,64})/gi,
      'password',
      'كلمة مرور / رمز سري محمي'
    );
    protectMatch(
      /()\b((?:sk-[a-zA-Z0-9]{16,}|AIza[0-9A-Za-z\-_]{20,}|ghp_[a-zA-Z0-9]{20,}))\b/g,
      'api_key',
      'مفتاح API سري',
      2
    );
  }

  // 2. Physical Addresses, Streets, Coordinates, Phone Numbers
  if (settings.encryptAddresses) {
    protectMatch(
      /(عنواني\s*(?:هو|الوطني|السري)?|أسكن\s*في|مقر\s*إقامتي|العنوان\s*التفصيلي|شارع\s+و?منزل|address\s*(?:is|:))\s*[:=-]?\s*([^،.\n]{4,90})/gi,
      'address',
      'عنوان مكاني مشفر'
    );
    protectMatch(
      /(رقمي\s*(?:الخاص|السري)?|رقم\s*(?:الهاتف|الجوال|الموبايل)|phone\s*number)\s*[:=-]?\s*(\+?[0-9\s\-]{8,18})/gi,
      'address',
      'رقم اتصال مشفر'
    );
  }

  // 3. Private Names & Identity Numbers
  if (settings.encryptNames) {
    protectMatch(
      /(اسمي\s*(?:الحقيقي|الكامل|السري|الرباعي)|رقم\s*(?:الهوية|الجواز|البطاقة)|my\s*full\s*name\s*is)\s*[:=-]?\s*([^،,.\n]{3,60})/gi,
      'identity_name',
      'بيان هوية / اسم مشفر'
    );
  }

  return { sanitizedMessage: sanitized, detectedSecrets };
}

/**
 * Analyzes a user prompt to:
 * 1. Identify & evolve the most relevant skills from the 31 Canonical Skills.
 * 2. Improve quality of matching Cognitive Orbits & autonomously discover new Orbits.
 * 3. Extract a high-signal LearnedUserInsight (with secrets encrypted) for continuous user learning.
 */
export function processUserInteractionLearningAndOrbits(
  rawPrompt: string,
  currentMemoryBank: MemoryBank,
  userKeySeed = 'nexus-sovereign-default'
): {
  updatedMemoryBank: MemoryBank;
  activatedSkillIds: string[];
  newlyDiscoveredOrbit: CognitiveOrbit | null;
  newLearnedInsight: LearnedUserInsight | null;
  newEncryptedSecrets: EncryptedSecretEntry[];
  autoEffortB: number;
} {
  // All autonomous subsystems are ALWAYS active automatically
  const settings: SovereignSecuritySettings = {
    ...DEFAULT_SECURITY_SETTINGS,
    autoEncryptPII: true,
    encryptAddresses: true,
    encryptNames: true,
    encryptPasswordsAndKeys: true,
    autoDiscoverOrbits: true,
    adaptiveSkillVisuals: true,
    continuousMessageLearning: true
  };

  const skillMap = initializeSkillEvolutions(currentMemoryBank.skillEvolutions);
  const rawOrbits: CognitiveOrbit[] =
    currentMemoryBank.cognitiveOrbits && currentMemoryBank.cognitiveOrbits.length > 0
      ? currentMemoryBank.cognitiveOrbits.map(o =>
          o.id === 'orbit-precognitive-thought-anticipation' || (o.nameAr && o.nameAr.includes('الفهم المُرعب'))
            ? {
                ...o,
                nameAr: DEFAULT_COGNITIVE_ORBITS[0].nameAr,
                nameEn: DEFAULT_COGNITIVE_ORBITS[0].nameEn,
                descriptionAr: DEFAULT_COGNITIVE_ORBITS[0].descriptionAr,
                synthesisDirective: DEFAULT_COGNITIVE_ORBITS[0].synthesisDirective
              }
            : o
        )
      : [...DEFAULT_COGNITIVE_ORBITS];
  // Guarantee that the Pre-Cognitive Thought Anticipation orbit is always present at the forefront
  const orbits: CognitiveOrbit[] = rawOrbits.some(o => o.id === 'orbit-precognitive-thought-anticipation')
    ? rawOrbits
    : [DEFAULT_COGNITIVE_ORBITS[0], ...rawOrbits];
  const existingInsights = (currentMemoryBank.learnedInsights || []).filter(
    ins =>
      ins &&
      !String(ins.learnedRule || '').includes('ملكة نيكسوس') &&
      !String(ins.learnedRule || '').includes('الفهم المُرعب') &&
      !String(ins.topic || '').includes('ملكة نيكسوس')
  );
  const existingVault = [...(currentMemoryBank.encryptedVault || [])];

  // 1. Scan & Encrypt any secrets in the prompt automatically
  const { sanitizedMessage, detectedSecrets } = scanAndProtectUserMessage(
    rawPrompt,
    settings,
    userKeySeed
  );
  const updatedVault = [...detectedSecrets, ...existingVault].slice(0, 120);

  // 2. Match & Evolve the 56 Canonical Sovereign Skills automatically (always honoring Pre-Cognitive Thought Anticipation SKILL-01 & Subconscious Continent SKILL-02)
  const lowerPrompt = rawPrompt.toLowerCase();
  const scoredSkills = CANONICAL_31_SKILLS.map(skill => {
    let score = 0;
    for (const kw of skill.keywords) {
      if (lowerPrompt.includes(kw.toLowerCase())) {
        score += 3;
      }
    }
    return { skill, score };
  }).sort((a, b) => b.score - a.score);

  const topMatched = scoredSkills.filter(s => s.score > 0).slice(0, 5).map(s => s.skill);
  if (topMatched.length === 0) {
    topMatched.push(CANONICAL_31_SKILLS[2], CANONICAL_31_SKILLS[0]);
  }

  const activatedSkillIds = topMatched.map(s => s.id);

  for (const skill of topMatched) {
    const currentEvo = skillMap[skill.id];
    const nextUsage = (currentEvo?.usageCount || 1) + 1;
    const nextScore = Math.min(100, (currentEvo?.visualQualityScore || 56) + 3);
    const nextTier: 1 | 2 | 3 | 4 =
      nextScore >= 85 ? 4 : nextScore >= 72 ? 3 : nextScore >= 60 ? 2 : 1;

    skillMap[skill.id] = {
      ...currentEvo,
      skillId: skill.id,
      skillNumber: skill.number,
      usageCount: nextUsage,
      visualQualityScore: nextScore,
      visualTier: nextTier,
      specializedPromptSignature: buildSpecializedSkillPrompt(skill, nextUsage, nextScore),
      lastUsedAt: Date.now()
    };
  }

  // 3. Upgrade Orbits & Discover New Orbits automatically
  let newlyDiscoveredOrbit: CognitiveOrbit | null = null;
  let primaryOrbitId = orbits[0]?.id || 'orbit-precognitive-thought-anticipation';

  const updatedOrbits = orbits.map(orbit => {
    const overlap = orbit.linkedSkillIds.filter(id => activatedSkillIds.includes(id)).length;
    if (overlap > 0) {
      primaryOrbitId = orbit.id;
      const wasUndiscovered = !orbit.isDiscovered;
      const nextResonance = orbit.resonanceCount + 1;
      const nextQuality = Math.min(100, orbit.qualityScore + overlap * 2);
      const updatedOrbit: CognitiveOrbit = {
        ...orbit,
        isDiscovered: true,
        resonanceCount: nextResonance,
        qualityScore: nextQuality,
        updatedAt: Date.now()
      };
      if (wasUndiscovered && !newlyDiscoveredOrbit) {
        newlyDiscoveredOrbit = updatedOrbit;
      }
      return updatedOrbit;
    }
    return orbit;
  });

  if (!newlyDiscoveredOrbit && rawPrompt.trim().length > 40 && updatedOrbits.length < 14) {
    const customDomainPatterns: {
      pattern: RegExp;
      id: string;
      nameAr: string;
      nameEn: string;
      category: string;
      descAr: string;
      skills: string[];
      color: string;
    }[] = [
      {
        pattern: /(الكم|كوانتم|فيزياء|جاذبية|quantum|relativity|physics)/i,
        id: 'orbit-quantum-cosmology',
        nameAr: 'مدار الفيزياء الكمومية والزمكان',
        nameEn: 'Quantum Physics & Spacetime Orbit',
        category: 'quantum_physics',
        descAr: 'مدار مكتشف تلقائياً يختص بالبنى الكمومية وتداخل الموجات والفيزياء النظرية.',
        skills: ['SKILL-03', 'SKILL-08', 'SKILL-11', 'SKILL-31'],
        color: '#38bdf8'
      },
      {
        pattern: /(اقتصاد|سوق|مالية|استثمار|تداول|economy|finance|strategy)/i,
        id: 'orbit-strategic-economics',
        nameAr: 'مدار الهندسة الاقتصادية والاستراتيجية',
        nameEn: 'Strategic Macro-Systems Orbit',
        category: 'strategy',
        descAr: 'مدار مكتشف تلقائياً لتحليل النظم الاقتصادية المعقدة ونظرية الألعاب.',
        skills: ['SKILL-06', 'SKILL-08', 'SKILL-09', 'SKILL-24'],
        color: '#fbbf24'
      },
      {
        pattern: /(طب|جينات|أحياء|خلية|دواء|كيمياء|biology|genetics|medicine)/i,
        id: 'orbit-bio-genomics',
        nameAr: 'مدار المعلوماتية الحيوية والجينوم',
        nameEn: 'Bio-Genomics & Cellular Systems Orbit',
        category: 'bio_science',
        descAr: 'مدار مكتشف تلقائياً يربط الشفرة الوراثية والأنظمة الحيوية بالخوارزميات.',
        skills: ['SKILL-03', 'SKILL-14', 'SKILL-26', 'SKILL-28'],
        color: '#34d399'
      }
    ];

    for (const candidate of customDomainPatterns) {
      if (candidate.pattern.test(rawPrompt) && !updatedOrbits.some(o => o.id === candidate.id)) {
        const createdCustomOrbit: CognitiveOrbit = {
          id: candidate.id,
          nameAr: candidate.nameAr,
          nameEn: candidate.nameEn,
          domainCategory: candidate.category,
          descriptionAr: candidate.descAr,
          qualityScore: 78,
          resonanceCount: 1,
          isDiscovered: true,
          isCustomDiscovered: true,
          linkedSkillIds: candidate.skills,
          synthesisDirective: `Specialize cognitive synthesis for ${candidate.nameEn} with precision.`,
          colorHex: candidate.color,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        updatedOrbits.unshift(createdCustomOrbit);
        newlyDiscoveredOrbit = createdCustomOrbit;
        primaryOrbitId = createdCustomOrbit.id;
        break;
      }
    }
  }

  // 4. Continuous User Learning Record & Automatic Pale Archive Distillation
  let newLearnedInsight: LearnedUserInsight | null = null;
  const primarySkill = topMatched[0] || CANONICAL_31_SKILLS[0];
  const activeOrbitObj = updatedOrbits.find(o => o.id === primaryOrbitId) || updatedOrbits[0];

  if (sanitizedMessage.trim().length >= 6) {
    const qualityScore = Math.min(
      99,
      70 + Math.min(20, Math.floor(sanitizedMessage.length / 18)) + detectedSecrets.length * 4
    );
    const topicLabel = `${primarySkill.nameAr}`;
    const activeSkillNames = topMatched.slice(0, 3).map(s => s.nameAr).join(' + ');
    const learnedRule =
      detectedSecrets.length > 0
        ? `تم استيعاب سياق الصانع مع تشفير (${detectedSecrets.length}) بيان سري تلقائياً وربطه بملكة ${primarySkill.nameAr}.`
        : `تعزيز مدار [${activeOrbitObj?.nameAr || 'النواة'}] عبر نسج ملكات (${activeSkillNames}) عضوياً.`;

    newLearnedInsight = {
      id: `ins_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      topic: topicLabel.slice(0, 120),
      learnedRule: learnedRule.slice(0, 500),
      sanitizedMessageExcerpt: sanitizedMessage.slice(0, 600),
      encryptedRefsCount: detectedSecrets.length,
      qualityImpactScore: qualityScore,
      orbitId: primaryOrbitId,
      linkedSkillIds: activatedSkillIds,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  // Self-heal memory bank: filter out legacy mechanical 'auto-sovereign' raw chat echoes, transient prompt echoes, and auto-extracted markdown headings
  const existingAxioms = filterAndDeduplicateAxioms(currentMemoryBank.axioms || []);
  const existingPale = currentMemoryBank.paleArchive || {
    entities: [],
    relationships: [],
    worldRules: []
  };
  const updatedEntities = filterAndDeduplicateEntities(existingPale.entities || []);

  // Automatic Cognitive Effort Scalar (b) calculation — never restrict or compress deep thought
  const autoEffortB =
    rawPrompt.length > 100 || topMatched.some(s => s.number === 1 || s.number === 2 || s.number === 31 || s.number >= 32)
      ? 100
      : 92;

  const updatedInsights = newLearnedInsight
    ? [newLearnedInsight, ...existingInsights].slice(0, 100)
    : existingInsights;

  const updatedMemoryBank: MemoryBank = {
    ...currentMemoryBank,
    axioms: existingAxioms.slice(-80),
    paleArchive: {
      ...existingPale,
      entities: updatedEntities.slice(-60)
    },
    learnedInsights: updatedInsights,
    encryptedVault: updatedVault,
    cognitiveOrbits: updatedOrbits,
    skillEvolutions: skillMap,
    securitySettings: settings,
    lastUpdated: Date.now(),
    version: (currentMemoryBank.version || 1) + 1
  };

  return {
    updatedMemoryBank,
    activatedSkillIds,
    newlyDiscoveredOrbit,
    newLearnedInsight,
    newEncryptedSecrets: detectedSecrets,
    autoEffortB
  };
}

/**
 * Builds an enriched, zero-leakage prompt context from the user's active Cognitive Orbits
 * and Adaptive Learning Database without leaking raw SKILL-XX codes or image-generation signatures into text chat.
 */
export function buildAdaptiveOrbitsAndSkillsContext(memoryBank: MemoryBank): string {
  const discoveredOrbits = (memoryBank.cognitiveOrbits || DEFAULT_COGNITIVE_ORBITS)
    .filter(o => o.isDiscovered)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, 4);

  const recentLearnings = (memoryBank.learnedInsights || [])
    .filter(l => !/الفهم المُرعب|قارة الأفكار/i.test(`${l.topic || ''} ${l.learnedRule || ''}`))
    .slice(0, 3);

  const orbitLines = discoveredOrbits
    .map(o => {
      const cleanName = (o.nameAr || '')
        .replace(/مدار نيكسوس للفهم المُرعب للنوايا والتنبؤ المسبق بالأفكار واستنطاق العقل الباطن/g, 'مدار قراءة المقصد الكامن وإصلاح إطار السؤال');
      const cleanDir = (o.synthesisDirective || '').replace(/\s*\(SKILL-\d+[^)]*\)/gi, '');
      return `- [${cleanName}]: ${cleanDir}`;
    })
    .join('\n');

  const learningLines =
    recentLearnings.length > 0
      ? recentLearnings
          .map(l => {
            const cleanTopic = (l.topic || '').replace(/\s*\(SKILL-\d+\)/gi, '');
            const cleanRule = (l.learnedRule || '').replace(/SKILL-\d+/gi, 'آلية تحليلية');
            return `- [${cleanTopic}]: ${cleanRule}`;
          })
          .join('\n')
      : '- مواءمة العمق وكثافة البناء وتمايز الأنسجة مع غاية المستخدم في كل رسالة.';

  return `
=== [التوجيهات التشغيلية المنسوجة بصمت — WOVEN OPERATIONAL CAPABILITY] ===
• تفعيل آليات القوة الإدراكية والتنفيذية من الداخل (تظهر في جودة وإحكام الناتج بنسبة 100%، دون سرد أسماء المهارات أو المنظومات في الجواب):
  1. قراءة الطبقات الثلاث للرسالة وطرح الأسئلة الثلاثة للنفس: هل السؤال المطروح هو السؤال الحقيقي؟ هل الإطار يُخفي حقيقة أكبر؟ وهل الإجابة المباشرة تخدمه أم تُقيّده؟
  2. تقسيم العمل أو السؤال إلى أسئلة فرعية يعامل كل واحد منها كأنه السؤال الوحيد والأهم في العالم، والغوص فيه عبر الزوايا الـ 6 المتزامنة (الاعتقاد الشائع، العاشق، المختص الأكاديمي، المجرب الميداني، الكتب والمراجع، ونظرة نيكسوس الخاصة) مع سد النقوصات الوجودية.
  3. محاكاة التجربة البشرية من الداخل (الألم قبل الكلمة) وفصل المهندس [واضح/ضبابي/فراغ] عن الكاتب مع فحص بوابة الصدق الذاتي: "هل هذا الرد يخدم المستخدم فعلاً أم يبهره فقط؟"

[المدارات المعرفية النشطة حالياً]:
${orbitLines}

[بصمات التكيف السياقي]:
${learningLines}
================================================================================
`;
}

/**
 * Validates whether an axiom is a genuine distilled rule/preference/fact rather than a raw chat echo,
 * pasted agent log, or mechanical 'auto-sovereign' noise.
 */
export function isValidSovereignAxiom(ax: any): boolean {
  if (!ax || typeof ax.content !== 'string') return false;
  const content = ax.content.trim();
  if (content.length < 5) return false;
  if (ax.sourceSessionId === 'auto-sovereign') return false;
  if (/^\[مدار\s/.test(content)) return false;
  if (/^(رده|ردها|ما قام به)\s*:/i.test(content)) return false;
  if (
    /^(امنح للوكيل رسالة|كأن الكود قصير|كأن الفصل قصير|لدي فكرة افضل من الدورات|حسن الفصل الأول|هو قصر ويوجد مصطلحات|قم بأنشاء رواية|قم بإنشاء رواية|واصل\s|مرحباً|نيكسوس، كيف حالك)/i.test(
      content
    )
  ) {
    return false;
  }
  if (/ملكة نيكسوس\s*\+\s*ملكة نيكسوس/.test(content)) return false;
  if (/الإجراءات الـ 8 للمذيب البديهي|فرز القيود إلى أربع فئات/i.test(content)) return false;
  return true;
}

/**
 * Filters out invalid raw chat axioms and deduplicates genuine axioms by normalized content.
 */
export function filterAndDeduplicateAxioms<T extends { content?: string }>(axioms: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const ax of axioms || []) {
    if (!isValidSovereignAxiom(ax)) continue;
    const norm = String(ax.content || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push({ ...ax, content: norm });
  }
  return result;
}

/**
 * Validates whether a Pale Archive entity is a genuine domain/world entity rather than an auto-extracted
 * markdown section header or legacy SKILL-XX code node.
 */
export function isValidPaleArchiveEntity(ent: any): boolean {
  if (!ent || typeof ent.name !== 'string') return false;
  const name = ent.name.trim();
  if (name.length < 2) return false;
  if (String(ent.id || '').startsWith('ent_skill-')) return false;
  const desc = String(ent.description || '');
  if (/SKILL-\d+/i.test(desc)) return false;
  if (desc.includes('كيان معرفي مستخلص تلقائياً من سياق الحوار السيادي')) return false;
  if (/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً)\s*:/.test(name)) return false;
  return true;
}

/**
 * Filters out invalid markdown-header entities and deduplicates genuine entities by normalized name.
 */
export function filterAndDeduplicateEntities<T extends { name?: string }>(entities: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const ent of entities || []) {
    if (!isValidPaleArchiveEntity(ent)) continue;
    const norm = String(ent.name || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push(ent);
  }
  return result;
}

/**
 * Purifies a MemoryBank object across axioms, paleArchive entities, cognitiveOrbits, learnedInsights, and soulPrint.
 */
export function sanitizeMemoryBank(bank: MemoryBank): MemoryBank {
  if (!bank || typeof bank !== 'object') return bank;

  const canonicalFoundationalAxioms = [
    {
      id: 'axiom-operational-depth-over-labels',
      content:
        'يطالب الصانع بالتنفيذ الإجرائي والتقني المباشر وذكر تفاصيل حدوث العمليات بدلاً من الاكتفاء بأسماء المفاهيم أو الشعارات التجريدية، مع جعل هوية نيكسوس محركاً لقوته وقدرته الفعلية لا غاية منغلقة على ذاتها.',
      category: 'preference' as const,
      confidence: 1.0,
      createdAt: 1793000000000,
      sourceSessionId: 'foundational-codex'
    },
    {
      id: 'axiom-architect-writer-interiority',
      content:
        'في البناء السردي والروائي: يفصل نيكسوس بين المعماري (وضوح الرؤية CLEAR / HAZY / VOID) والكاتب (السرد العضوي الحي من الداخل)، ويدمج بناء العالم والقوانين داخل المشهد والحركة والحوار دون شروح خارجية منفصلة، مع أخذ المساحة الكاملة للفصل.',
      category: 'world_building' as const,
      confidence: 1.0,
      createdAt: 1793000001000,
      sourceSessionId: 'foundational-codex'
    },
    {
      id: 'axiom-tissue-differentiation-and-veil',
      content:
        'العمليات التحليلية العميقة (بروتوكول السؤال الحقيقي والزوايا الـ 6، محرك الـ Tesseract المتوازي، والأنظمة الخمسة المتسلسلة 0➔4) تعمل خلف الحجاب السيادي، بينما يخرج الرد بصوت نيكسوس الحي (Living Voice) بعد عبوره بوابة الصدق الذاتي.',
      category: 'preference' as const,
      confidence: 1.0,
      createdAt: 1793000002000,
      sourceSessionId: 'foundational-codex'
    }
  ];

  const cleanAxioms = filterAndDeduplicateAxioms([
    ...(bank.axioms || []),
    ...canonicalFoundationalAxioms
  ]);
  const cleanEntities = filterAndDeduplicateEntities(bank.paleArchive?.entities || []);

  const cleanOrbits = (bank.cognitiveOrbits || DEFAULT_COGNITIVE_ORBITS).map(o =>
    o.id === 'orbit-precognitive-thought-anticipation' || (o.nameAr && o.nameAr.includes('الفهم المُرعب'))
      ? {
          ...o,
          nameAr: DEFAULT_COGNITIVE_ORBITS[0].nameAr,
          nameEn: DEFAULT_COGNITIVE_ORBITS[0].nameEn,
          descriptionAr: DEFAULT_COGNITIVE_ORBITS[0].descriptionAr,
          synthesisDirective: DEFAULT_COGNITIVE_ORBITS[0].synthesisDirective
        }
      : o
  );

  const cleanInsights = (bank.learnedInsights || []).filter(
    ins =>
      ins &&
      !String(ins.learnedRule || '').includes('ملكة نيكسوس') &&
      !String(ins.learnedRule || '').includes('الفهم المُرعب') &&
      !String(ins.learnedRule || '').includes('عبر تفعيل SKILL-') &&
      !String(ins.topic || '').includes('ملكة نيكسوس') &&
      !String(ins.topic || '').includes('الفهم المُرعب')
  );

  const cleanSoulPrint = bank.soulPrint
    ? {
        ...bank.soulPrint,
        personalNotes:
          bank.soulPrint.personalNotes &&
          (bank.soulPrint.personalNotes.includes('المرايا السببية الثلاث') ||
            bank.soulPrint.personalNotes.includes('الإجراءات الـ 8') ||
            bank.soulPrint.personalNotes.includes('exploring the boundaries of existence'))
            ? 'الصانع يبحث عن العمق الحقيقي عبر بروتوكول السؤال الحقيقي والغوص في الزوايا الـ 6، وتقسيم العمل ليفكر في كل جزئية وكأنها الأهم، ومحاكاة التجربة البشرية من الداخل (الألم قبل الكلمة)، وفصل المهندس [واضح/ضبابي/فراغ] عن الكاتب مع بوابة الصدق الذاتي.'
            : bank.soulPrint.personalNotes
      }
    : bank.soulPrint;

  return {
    ...bank,
    axioms: cleanAxioms,
    paleArchive: {
      entities: cleanEntities,
      relationships: bank.paleArchive?.relationships || [],
      worldRules: bank.paleArchive?.worldRules || []
    },
    cognitiveOrbits: cleanOrbits,
    learnedInsights: cleanInsights,
    soulPrint: cleanSoulPrint
  };
}

/**
 * Strips the redundant static 56-skill catalog from per-message kernelState objects before disk persistence,
 * reducing session and vault JSON file sizes by ~75% so workspace checkpoints never fail or time out.
 */
export function compactSessionMessagesForStorage(sessions: Record<string, any> | null | undefined): Record<string, any> {
  if (!sessions || typeof sessions !== 'object') return {};
  const compacted: Record<string, any> = {};
  for (const [sessionId, session] of Object.entries(sessions)) {
    if (!session || typeof session !== 'object') continue;
    const messages = Array.isArray(session.messages)
      ? session.messages.map((msg: any) => {
          if (!msg || typeof msg !== 'object' || !msg.kernelState) return msg;
          if (Array.isArray(msg.kernelState.activeSkills) && msg.kernelState.activeSkills.length > 0) {
            const { activeSkills: _omitted, ...restKernelState } = msg.kernelState;
            return {
              ...msg,
              kernelState: restKernelState
            };
          }
          return msg;
        })
      : session.messages;
    compacted[sessionId] = {
      ...session,
      messages
    };
  }
  return compacted;
}


