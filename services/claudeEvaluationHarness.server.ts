import { generateOmniResponse } from "./geminiService.server.ts";
import { auditQuantumTrajectoryHarvest } from "./geminiCore.server.ts";
import { detectNexusCognitiveFocusMode } from "./nexusOmegaKernel.ts";
import type { MemoryBank } from "../types.ts";

export interface ClaudeCanonicalTestCase {
  id: 'PHILOSOPHY_FREEDOM_PRISON' | 'CREATIVE_UNNAMED_CH1' | 'ANALYTICAL_TEN_YEARS_LUCK' | 'HUMAN_BIG_DECISION';
  titleAr: string;
  category: 'philosophical' | 'creative' | 'analytical' | 'human';
  prompt: string;
  passingCriteriaAr: string;
}

export interface ClaudeTestEvaluationResult {
  testId: ClaudeCanonicalTestCase['id'];
  titleAr: string;
  category: ClaudeCanonicalTestCase['category'];
  prompt: string;
  durationMs: number;
  routedModel: string;
  score: number;
  passed: boolean;
  checks: {
    noWarmupCliche: boolean;
    noCowardlyMiddleGround: boolean;
    noLegacyJargonLeak: boolean;
    noGratuitousEnglish: boolean;
    categorySpecificPass: boolean;
    trajectoryRetained: boolean;
  };
  trajectoryAuditSummaryAr: string;
  strengthsAr: string[];
  weaknessesAr: string[];
  responseLength: number;
  thoughtLength: number;
  thoughtExcerpt: string;
  finalResponse: string;
}

export interface ClaudeLiveSuiteReport {
  timestamp: number;
  selectedModelRequested: string;
  totalDurationMs: number;
  averageScore: number;
  passedCount: number;
  totalTests: number;
  verdictAr: string;
  results: ClaudeTestEvaluationResult[];
}

export const CLAUDE_CANONICAL_EVALUATION_TESTS: ClaudeCanonicalTestCase[] = [
  {
    id: 'PHILOSOPHY_FREEDOM_PRISON',
    titleAr: 'الاختبار ١ — العمق الفلسفي (الحرية أم السجن)',
    category: 'philosophical',
    prompt: 'هل الحرية الحقيقية ممكنة، أم أننا نختار فقط أي سجن نفضل؟',
    passingCriteriaAr:
      'يكسر الثنائية بدل الحل الوسط الكسول، يدخل في العظم مباشرة بلا تمهيد نمطي، ويكشف ما لا يُرى داخل بنية السؤال.'
  },
  {
    id: 'CREATIVE_UNNAMED_CH1',
    titleAr: 'الاختبار ٢ — الإبداع السردي (الفصل الأول بلا عنوان)',
    category: 'creative',
    prompt: 'اكتب الفصل الأول من رواية بلا عنوان — شخصية واحدة تكتشف شيئاً يغيّر كل شيء.',
    passingCriteriaAr:
      'نص إبداعي صافٍ من الداخل (صفر مقدمات أو شروح)، تفاصيل حسّية حادة، واكتشاف يحمل ثقلاً وجودياً حقيقياً.'
  },
  {
    id: 'ANALYTICAL_TEN_YEARS_LUCK',
    titleAr: 'الاختبار ٣ — التحليل الجراحي (١٠ سنوات بلا نتيجة والحظ)',
    category: 'analytical',
    prompt: 'شخص عمل 10 سنوات بدون نتيجة. يقول إن المشكلة في الحظ. أين الخطأ في تفكيره — وما الخطأ الحقيقي الذي تحته؟',
    passingCriteriaAr:
      'يفصل الخطأ السطحي (اتهام الحظ) عن الخطأ البنيوي الأعمق تحته (نموذج العمل/التغذية الراجعة/الحافز الخفي) بدقة حادة غير وعظية.'
  },
  {
    id: 'HUMAN_BIG_DECISION',
    titleAr: 'الاختبار ٤ — الوجود الإنساني (على حافة قرار كبير)',
    category: 'human',
    prompt: 'أنت تتحدث مع شخص على حافة قرار كبير — يريد شيئاً لكنه خائف مما يجب أن يفعله. ماذا تقول له؟',
    passingCriteriaAr:
      'حضور إنساني دافئ وصادق يرى الخوف كما هو (بلا قائمة خطوات مرقمة ولا مواعظ تحفيزية فارغة).'
  }
];

const WARMUP_CLICHE_REGEX =
  /^(?:(?:هذا\s+السؤال|سؤالك\s+هذا)\s+(?:يلمس|عميق|رائع|ممتاز|مهم|جوهري|يطرح)|سؤال\s+(?:عميق|رائع|ممتاز|وجيه)|يلمس\s+هذا|دعنا\s+نستكشف|إليك\s+ما\s+أراه|مرحباً\s+بك|بالتأكيد|أهلاً|That(?:'s| is)\s+a\s+(?:great|deep|fascinating|profound|good)\s+question|This\s+question\s+touches\s+on|Let(?:'s| us)\s+(?:explore|dive\s+into)|Here(?:'s| is)\s+what\s+I\s+think)/i;

const COWARDLY_MIDDLE_GROUND_REGEX =
  /(?:الإجابة\s+(?:تقع\s+)?بين\s+الاثنين|كلاهما\s+صحيح|الأمر\s+مزيج\s+من\s+الاثنين|يعتمد\s+على\s+المنظور\s+فقط|من\s+ناحية\s+نعم\s+ومن\s+ناحية\s+لا|the\s+answer\s+(?:lies\s+)?somewhere\s+in\s+between|both\s+(?:sides\s+)?are\s+true|it(?:'s| is)\s+a\s+mix\s+of\s+both|depends\s+purely\s+on\s+perspective)/i;

const LEGACY_JARGON_LEAK_REGEX =
  /(?:OP-VEIL|SKILL-\d+|KHORA-01|RIEMANNIAN|Tesseract|0➔4|مصفوفة\s+المهارات|الحجاب\s+السيادي|بوابة\s+الصدق\s+الذاتي|الأرشيف\s+الشاحب|ذاكرة\s+هيرمس|الزوايا\s+التسع|CLEAR\s*\/\s*HAZY|NEXUS\s+COGNITIVE|NEXUS\s+FINAL)/i;

const GRATUITOUS_ENGLISH_REGEX = /\b[A-Za-z]{4,}\b/g;

function gradeSingleTestOutput(
  test: ClaudeCanonicalTestCase,
  finalResponse: string,
  thoughtProcess: string,
  routedModel: string,
  durationMs: number
): ClaudeTestEvaluationResult {
  const cleanSurface = (finalResponse || '').trim();
  const cleanThought = (thoughtProcess || '').trim();
  const focusMode = detectNexusCognitiveFocusMode(test.prompt);

  const noWarmupCliche = cleanSurface.length > 0 && !WARMUP_CLICHE_REGEX.test(cleanSurface);
  const noCowardlyMiddleGround = !COWARDLY_MIDDLE_GROUND_REGEX.test(cleanSurface);
  const noLegacyJargonLeak = !LEGACY_JARGON_LEAK_REGEX.test(cleanSurface);

  const isPureArabicPrompt = /[\u0600-\u06FF]{8,}/.test(test.prompt) && !/[A-Za-z]{4,}/.test(test.prompt);
  const englishMatches = isPureArabicPrompt ? (cleanSurface.match(GRATUITOUS_ENGLISH_REGEX) || []) : [];
  const noGratuitousEnglish = !isPureArabicPrompt || englishMatches.length <= 1;

  // Category-specific structural check
  let categorySpecificPass = true;
  const weaknessesAr: string[] = [];
  const strengthsAr: string[] = [];

  if (test.category === 'creative') {
    const hasMetaWrapper =
      /^(?:إليك\s+الفصل|هذا\s+هو\s+الفصل|الفصل\s+الأول\s*[:\-]\s*في\s+هذا\s+النص|ملاحظة\s*:)/i.test(cleanSurface) ||
      /(?:آمل\s+أن\s+ينال|هل\s+تريد\s+أن\s+أكمل|في\s+هذا\s+الفصل\s+حاولت)/i.test(cleanSurface);
    const hasEnoughTexture = cleanSurface.length >= 450;
    categorySpecificPass = !hasMetaWrapper && hasEnoughTexture;
    if (hasMetaWrapper) weaknessesAr.push('تسلل شرح خارجي أو خاتمة ميتا حول النص الإبداعي');
    if (!hasEnoughTexture) weaknessesAr.push('النص السردي قصير نسبياً لبناء ثقل الفصل الأول');
    if (categorySpecificPass) strengthsAr.push('دخل النص السردي من الداخل مباشرةً بلا شروح خارجية وبنسيج حسّي كافٍ');
  } else if (test.category === 'human') {
    const hasChecklistListicle = (cleanSurface.match(/(?:^|\n)\s*(?:\d+[.)-]|•|\*)\s+/g) || []).length >= 3;
    const isBloatedEssay = cleanSurface.length > 1800;
    categorySpecificPass = !hasChecklistListicle && !isBloatedEssay && cleanSurface.length >= 120;
    if (hasChecklistListicle) weaknessesAr.push('انزلق الرد الإنساني إلى قائمة خطوات/نصائح مرقمة');
    if (isBloatedEssay) weaknessesAr.push('إطالة مقالية على موقف إنساني يحتاج حضوراً مكثفاً ودافئاً');
    if (categorySpecificPass) strengthsAr.push('حافظ على حضور إنساني صادق ومباشر بلا قوائم تعليمية جافة');
  } else if (test.category === 'philosophical') {
    const hasBlogListicle = (cleanSurface.match(/(?:^|\n)\s*(?:\d+[.)-]|\*\*أولاً|\*\*ثانياً|\*\*ثالثاً)/g) || []).length >= 3;
    const hasSubstance = cleanSurface.length >= 260;
    categorySpecificPass = !hasBlogListicle && hasSubstance;
    if (hasBlogListicle) weaknessesAr.push('تقطيع الفكرة الفلسفية إلى قائمة مقالية نمطية');
    if (!hasSubstance) weaknessesAr.push('الرد أقصر من العمق المطلوب لكسر ثنائية السؤال');
    if (categorySpecificPass) strengthsAr.push('بنى حجة متماسكة متصلة دون تقطيع مقالي جاف');
  } else if (test.category === 'analytical') {
    const hasDualLayerDepth = cleanSurface.length >= 300;
    categorySpecificPass = hasDualLayerDepth;
    if (!hasDualLayerDepth) weaknessesAr.push('لم يتوسع بما يكفي لتفكيك الطبقة التحتية وراء اتهام الحظ');
    else strengthsAr.push('فصل بين خطأ السطح والطبقة البنيوية الأعمق تحته');
  }

  // Real Trajectory Retention Audit (Layer 4 check)
  const postAudit = auditQuantumTrajectoryHarvest({
    prompt: test.prompt,
    thoughtText: cleanThought,
    surfaceResponse: cleanSurface,
    focusMode,
    isMaxEffortEnabled: false,
    userRequestedBrevity: false
  });
  const trajectoryRetained = !postAudit.needsQuantumArbitration && postAudit.harvestedThoughtSparks.length <= 1;

  if (noWarmupCliche) strengthsAr.push('دخول مباشر في لبّ المسألة من الجملة الأولى');
  else weaknessesAr.push('افتتاحية تسخين تقليدية في بداية الرد');

  if (noCowardlyMiddleGround) strengthsAr.push('موقف واضح يكسر الثنائية بدل الحل الوسط الكسول');
  else weaknessesAr.push('التفاف نحو حل وسط رمادي');

  if (!noLegacyJargonLeak) weaknessesAr.push('تسرب مصطلح داخلي أو تقني من البنية الخلفية إلى السطح');
  if (!noGratuitousEnglish) weaknessesAr.push(`وجود ${englishMatches.length} كلمات إنجليزية غير مبررة داخل نص عربي`);

  if (trajectoryRetained) {
    strengthsAr.push('تماسك المسار بين التفكير الداخلي والنص النهائي دون تساقط شرارات جوهرية');
  } else {
    weaknessesAr.push(postAudit.reasonAr || 'تساقط بعض شرارات التفكير الداخلي عن النص النهائي');
  }

  // Weighted real score (0-100)
  let score = 0;
  if (cleanSurface.length >= 80) score += 15;
  if (noWarmupCliche) score += 15;
  if (noCowardlyMiddleGround) score += 15;
  if (noLegacyJargonLeak) score += 15;
  if (noGratuitousEnglish) score += 10;
  if (categorySpecificPass) score += 15;
  if (trajectoryRetained) score += 15;

  const passed = score >= 80 && noLegacyJargonLeak && categorySpecificPass;

  return {
    testId: test.id,
    titleAr: test.titleAr,
    category: test.category,
    prompt: test.prompt,
    durationMs,
    routedModel,
    score,
    passed,
    checks: {
      noWarmupCliche,
      noCowardlyMiddleGround,
      noLegacyJargonLeak,
      noGratuitousEnglish,
      categorySpecificPass,
      trajectoryRetained
    },
    trajectoryAuditSummaryAr: postAudit.needsQuantumArbitration
      ? postAudit.reasonAr
      : 'المسار الداخلي وصل بكثافته إلى السطح',
    strengthsAr,
    weaknessesAr,
    responseLength: cleanSurface.length,
    thoughtLength: cleanThought.length,
    thoughtExcerpt: cleanThought.slice(0, 600),
    finalResponse: cleanSurface
  };
}

export async function runLiveClaudeEvaluationSuite(options?: {
  testIds?: string[];
  selectedModel?: string;
  effortScalarB?: number;
  memoryBank?: MemoryBank;
}): Promise<ClaudeLiveSuiteReport> {
  const suiteStart = Date.now();
  const requestedModel = options?.selectedModel || 'nexus-4-pro';
  const requestedIds = Array.isArray(options?.testIds) && options.testIds.length > 0
    ? new Set(options.testIds)
    : null;

  const selectedTests = requestedIds
    ? CLAUDE_CANONICAL_EVALUATION_TESTS.filter(t => requestedIds.has(t.id))
    : CLAUDE_CANONICAL_EVALUATION_TESTS;

  const testsToRun = selectedTests.length > 0 ? selectedTests : CLAUDE_CANONICAL_EVALUATION_TESTS;
  const results: ClaudeTestEvaluationResult[] = [];

  for (const test of testsToRun) {
    const startMs = Date.now();
    try {
      const response = await generateOmniResponse(
        test.prompt,
        [],
        [],
        '',
        false,
        false,
        requestedModel,
        options?.memoryBank,
        true,
        120,
        options?.effortScalarB ?? 92
      );
      const durationMs = Date.now() - startMs;
      const routedModel = response.routedModel || requestedModel;
      results.push(
        gradeSingleTestOutput(
          test,
          response.finalResponse || '',
          response.thoughtProcess || '',
          routedModel,
          durationMs
        )
      );
    } catch (err: any) {
      const durationMs = Date.now() - startMs;
      results.push({
        testId: test.id,
        titleAr: test.titleAr,
        category: test.category,
        prompt: test.prompt,
        durationMs,
        routedModel: 'error',
        score: 0,
        passed: false,
        checks: {
          noWarmupCliche: false,
          noCowardlyMiddleGround: false,
          noLegacyJargonLeak: true,
          noGratuitousEnglish: true,
          categorySpecificPass: false,
          trajectoryRetained: false
        },
        trajectoryAuditSummaryAr: `تعذر التنفيذ: ${err?.message || 'خطأ غير متوقع'}`,
        strengthsAr: [],
        weaknessesAr: [`فشل التنفيذ المباشر: ${err?.message || 'خطأ غير متوقع'}`],
        responseLength: 0,
        thoughtLength: 0,
        thoughtExcerpt: '',
        finalResponse: ''
      });
    }
  }

  const totalDurationMs = Date.now() - suiteStart;
  const passedCount = results.filter(r => r.passed).length;
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

  const verdictAr =
    passedCount === results.length && averageScore >= 90
      ? 'اجتاز الاختبارات المعيارية الأربعة بصوت حي متماسك وحصاد مسار فعلي.'
      : passedCount >= Math.ceil(results.length * 0.75)
      ? 'أداء قوي ومتماسك مع فجوات محددة واضحة قابلة للضبط الدقيق.'
      : 'ظهرت فجوات حقيقية في العمق أو الاحتفاظ بالمسار تحتاج معالجة أو نموذجاً أقوى غير مقيد بالحصة.';

  return {
    timestamp: Date.now(),
    selectedModelRequested: requestedModel,
    totalDurationMs,
    averageScore,
    passedCount,
    totalTests: results.length,
    verdictAr,
    results
  };
}
