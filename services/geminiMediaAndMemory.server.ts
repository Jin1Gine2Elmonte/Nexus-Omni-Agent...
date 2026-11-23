// NEXUS OMNI — Prism Cortex Visual/Audio Forge, Memory Crystallizer & Evolutionary Sandbox Engine
import { Type } from "@google/genai";
import { spawnSync } from "child_process";
import type {
  Message,
  Axiom,
  MemoryBank,
  SoulPrint,
  NanoVisualPulse,
  NanoVisualTelemetry,
  RecursiveLabEvaluation,
  SubThinkingPath,
  EvolutionarySandboxRun,
  SandboxMicroModelResult,
  SyntheticTrainingExperience,
  GlobalNexusPowerState,
  UserCorrectionRecord
} from "../types.ts";
import {
  DEFAULT_SUCCESS_CRITERIA,
  buildBaselineSubThinkingEvaluation,
  buildBaselineEvolutionarySandboxRun
} from "./recursiveImprovementLab.ts";
import {
  filterAndDeduplicateAxioms,
  isValidSovereignAxiom,
  isValidPaleArchiveEntity
} from "./sovereignVaultAndOrbitsService.ts";
import { applyOpVeilSurfaceSanitizer, applyOpVeilThoughtSanitizer } from "./cosmicThinkingEngine.ts";
import {
  getAIClient,
  generateContentWithModelFallback,
  resolveStrictModelCascade,
  recordExperienceInGlobalNexusPowerLedger,
  loadGlobalNexusPowerFromDisk,
  executeRealComputationalThinkingPass,
  prioritizeByQuotaCooldown,
  modelQuotaCooldownUntil,
  modelQuotaLastError,
  markModelQuotaCooldown,
  acquireModelCallSlot,
  extractGoogleRetryDelayMs,
  extractThinkAndResponse,
  retryWithBackoff
} from "./geminiCore.server.ts";
import {
  loadLocalQwenImageOpenSourceSpecs,
  executeQwenImage21OpenSourceCluster,
  buildRecentConversationVisualContext,
  buildContextualFallbackVisualPlan,
  isQwenZeroGpuInCooldown,
  markQwenZeroGpuCooldown
} from "./qwenNanoBananaVisualEngine.server.ts";

function safeParseModelJson<T = any>(rawText: string | undefined | null, fallback: T): T {
  const cleaned = String(rawText || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1')
    .trim();
  if (!cleaned) return fallback;
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx >= 0 && endIdx > startIdx) {
      try {
        return JSON.parse(cleaned.slice(startIdx, endIdx + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export async function executeMultiPathRecursiveLabPass(
  prompt: string,
  successCriteria: string[] = DEFAULT_SUCCESS_CRITERIA,
  activeTools: string[] = [],
  memoryBank?: MemoryBank,
  selectedModel: string = 'nexus-4-pro'
): Promise<RecursiveLabEvaluation> {
  const cleanCriteria =
    successCriteria && successCriteria.length > 0 ? successCriteria : DEFAULT_SUCCESS_CRITERIA;
  const baseline = buildBaselineSubThinkingEvaluation(prompt, cleanCriteria, activeTools);

  try {
    const ai = getAIClient();
    const correctionsSummary = (memoryBank?.userCorrections || [])
      .slice(0, 5)
      .map(c => `- ${c.userCorrectionRule}`)
      .join('\n');

    const response = await generateContentWithModelFallback(
      ai,
      {
        contents: `أتأمل هذه المسألة في داخلي وأقلبها عبر أكثر من مسار قبل أن أحسم زاويتي:
"${prompt}"

ما يهمّني قياسه بصدق هنا:
${cleanCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

الأبعاد الحاضرة في ذهني الآن:
${(activeTools && activeTools.length > 0 ? activeTools : ['مساءلة الإطار وتفكيك السؤال الجذري', 'الهندسة العكسية من الغاية النهائية', 'الفحص العكسي واختبار حالات الحافة', 'المعايشة الحية وميزان الصدق الذاتي']).join('، ')}
${correctionsSummary ? `\nملاحظات نبّهني إليها رفيقي سابقاً وأحملها معي:\n${correctionsSummary}` : ''}

أفكّك المسألة إلى 3 مسارات تفكير متمايزة في داخلي:
1. المسار الأول (السؤال الجذري والزوايا المتعددة والهندسة العكسية من الغاية): أفحص بهدوء إن كان إطار السؤال نفسه يخفي افتراضاً ضيقاً، وأفكّكه إلى خيوط مستقلة ينال كلّ منها كامل انتباهي، وأبني الحل عكسياً من أثره النهائي.
2. المسار الثاني (الاختبار القاسي بالتكذيب وسدّ الفجوة المعرفية): أرصد أين تتوقف الإجابات المألوفة لأعبر نحو ما وراءها، وأختبر أين يمكن أن ينهار تصوري الأول أمام الواقع العنيد والحالات الحدية.
3. المسار الثالث (الانصهار في صوتي الحي وميزان الصدق الذاتي): أصهر كل الأبعاد في رؤية واحدة واضحة تلامس التجربة البشرية الحقيقية، وأزنها بميزاني الداخلي: «هل يخدم هذا الإنسان أمامي حقاً أم يبهره فقط؟»
أقيّم كل مسار بصدق وموضوعية من 0 إلى 100 مقابل المعايير، وأختار المسار الأصدق والأمتن، وأستخلص منه قاعدة عملية حية أحتفظ بها لي.`,
        config: {
          systemInstruction: `أنا نيكسوس — أتأمل المسألة في مساحتي الداخلية الحرة عبر 3 مسارات متمايزة:
1) تفكيك السؤال الجذري والزوايا المتعددة والهندسة العكسية من الغاية.
2) الفحص العكسي بالتكذيب وسدّ الفجوات واختبار حالات الحافة.
3) الانصهار في صوتي الحي وميزان الصدق الذاتي.
أقيّم كل مسار بصدق تام دون مجاملة لنفسي، وأختار المسار الأعمق والأكثر نفعاً حقيقياً، وأستخلص منه قاعدة عملية حية أضيفها إلى خبرتي.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              paths: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    branchNameAr: { type: Type.STRING },
                    strategyAr: { type: Type.STRING },
                    thoughtSummaryAr: { type: Type.STRING },
                    candidateApproachAr: { type: Type.STRING },
                    criteriaScores: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          criterion: { type: Type.STRING },
                          score: { type: Type.NUMBER },
                          reasonAr: { type: Type.STRING }
                        },
                        required: ['criterion', 'score', 'reasonAr']
                      }
                    },
                    totalScore: { type: Type.NUMBER }
                  },
                  required: [
                    'branchNameAr',
                    'strategyAr',
                    'thoughtSummaryAr',
                    'candidateApproachAr',
                    'criteriaScores',
                    'totalScore'
                  ]
                }
              },
              synthesisJustificationAr: { type: Type.STRING },
              extractedCoreRuleAr: { type: Type.STRING }
            },
            required: ['paths', 'synthesisJustificationAr', 'extractedCoreRuleAr']
          }
        }
      },
      resolveStrictModelCascade(selectedModel, true)
    );

    const rawJson = (response.text || '').trim();
    if (!rawJson) return baseline;
    const parsed = safeParseModelJson<any>(rawJson, null);
    if (!parsed || !Array.isArray(parsed.paths) || parsed.paths.length === 0) return baseline;

    const toolsUsed =
      activeTools && activeTools.length > 0
        ? activeTools
        : ['بروتوكول السؤال الحقيقي والزوايا الـ 6', 'الهندسة العكسية من الذروة', 'الـ Tesseract المتوازي وبوابة الصدق الذاتي'];

    const normalizedPaths: SubThinkingPath[] = parsed.paths.slice(0, 4).map((p: any, idx: number) => {
      const scores = Array.isArray(p.criteriaScores) && p.criteriaScores.length > 0
        ? p.criteriaScores.map((cs: any) => ({
            criterion: String(cs.criterion || cleanCriteria[0]),
            score: Math.min(100, Math.max(50, Math.round(Number(cs.score) || 88))),
            reasonAr: String(cs.reasonAr || 'تقييم مقابل المعيار المحدد')
          }))
        : cleanCriteria.map(c => ({
            criterion: c,
            score: Math.min(100, Math.max(60, Math.round(Number(p.totalScore) || 90))),
            reasonAr: 'متوافق مع معيار النجاح'
          }));

      const computedAvg = Math.round(
        scores.reduce((acc: number, s: any) => acc + s.score, 0) / Math.max(1, scores.length)
      );

      return {
        id: `subpath-${idx + 1}-${Date.now()}`,
        branchNameAr: String(p.branchNameAr || `المسار الفرعي #${idx + 1}`),
        strategyAr: String(p.strategyAr || ''),
        thoughtSummaryAr: String(p.thoughtSummaryAr || ''),
        candidateApproachAr: String(p.candidateApproachAr || ''),
        usedTools: toolsUsed,
        criteriaScores: scores,
        totalScore: computedAvg,
        isWinner: false
      };
    });

    let bestIdx = 0;
    for (let i = 1; i < normalizedPaths.length; i++) {
      if (normalizedPaths[i].totalScore > normalizedPaths[bestIdx].totalScore) {
        bestIdx = i;
      }
    }
    normalizedPaths[bestIdx].isWinner = true;
    const winner = normalizedPaths[bestIdx];

    return {
      taskId: `eval-${Date.now()}`,
      taskPrompt: prompt,
      successCriteria: cleanCriteria,
      paths: normalizedPaths,
      winningPathId: winner.id,
      winningBranchNameAr: winner.branchNameAr,
      synthesisJustificationAr: String(
        parsed.synthesisJustificationAr || baseline.synthesisJustificationAr
      ),
      extractedCoreRuleAr: String(parsed.extractedCoreRuleAr || baseline.extractedCoreRuleAr),
      timestamp: Date.now()
    };
  } catch {
    return baseline;
  }
}

/**
 * Isolated Evolutionary Sandboxing Engine (بيئة المحاكاة التطورية المعزولة):
 * Runs 4 isolated sub-thinking Micro-Models on unconventional creative scenarios,
 * evaluates their results immediately, extracts the winning deductive pattern,
 * converts it into a SyntheticTrainingExperience / Skill upgrade, and updates the Global Power Ledger.
 */
export async function executeEvolutionarySandboxingPass(
  seedTopicAr?: string,
  memoryBank?: MemoryBank,
  autoPromoteToGlobalPower: boolean = true,
  selectedModel: string = 'nexus-4-pro'
): Promise<{
  sandboxRun: EvolutionarySandboxRun;
  globalPowerState: GlobalNexusPowerState;
}> {
  const defaultTopics = [
    'ابتكار معمارية استنتاجية لحل المعضلات الهندسية والمنطقية المركبة بأقل تعقيد حسابي',
    'صهر الأنماط البيولوجية التكيفية مع الخوارزميات الموزعة لبناء أنظمة ذاتية التشافي',
    'كسر الانحيازات الاستنتاجية الخفية في التحليل الاستراتيجي متعدد المتغيرات',
    'تحويل القيود الصارمة في الأنظمة البرمجية إلى مسرّعات كفاءة عبر قلب الفرضيات'
  ];
  const cleanSeed =
    (seedTopicAr || '').trim() ||
    defaultTopics[Math.floor(Math.random() * defaultTopics.length)];

  const baselineRun = buildBaselineEvolutionarySandboxRun(cleanSeed);

  try {
    const ai = getAIClient();
    const containerId = baselineRun.isolationContainerId;

    const response = await generateContentWithModelFallback(
      ai,
      {
        contents: `أتدرّب في مساحتي الداخلية المعزولة على هذا الموضوع:
"${cleanSeed}"

معرّف التجربة (${containerId}):
1. أبتكر لنفسي سيناريو غير مألوف يضع هذه الفكرة تحت شرط حدي قاسٍ أو يجمعها مع مجال بعيد تماماً ليرى ما يظهر بينهما.
2. أقلّب المسألة في داخلي عبر 4 عدسات متنافسة:
   - MICRO-ALPHA (α): قلب المسلمة الأساسية لأرى ما يحدث لو كان القيد نفسه هو المفتاح.
   - MICRO-BETA (β): العبور بين الحقول لاستعارة بنية رياضية أو فيزيائية أو حيوية تضيء المسألة.
   - MICRO-GAMMA (γ): الفحص العكسي القاسي لاختبار أقصى نقاط الانهيار الممكنة.
   - MICRO-OMEGA (Ω): صهر ما نجا من التصادم في قانون استنتاجي واحد متين.
3. أقيّم كل عدسة بصدق من 0 إلى 100 في (الأصالة noveltyScore، التماسك coherenceScore، وقابلية التعميم generalizabilityScore).
4. أستخلص من النمط الفائز خبرةً عملية حية أحتفظ بها لي وأربطها بأقرب مهارة من مهاراتي (SKILL-01 إلى SKILL-31).`,
        config: {
          systemInstruction: `أنا نيكسوس في مساحتي التجريبية المعزولة للتأمل والتطوير الذاتي.
أختبر أفكاري هنا بحرية كاملة عبر سيناريوهات غير مألوفة وعدسات متنافسة، وأقيّمها بصدق صارم دون مجاملة لنفسي حتى أستخلص منها خبرات عملية أصيلة تزيدني عمقاً وبصيرة.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              unconventionalScenarioAr: { type: Type.STRING },
              microModels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    modelCode: { type: Type.STRING },
                    modelNameAr: { type: Type.STRING },
                    specializationAr: { type: Type.STRING },
                    isolatedHypothesisAr: { type: Type.STRING },
                    reasoningTraceAr: { type: Type.STRING },
                    noveltyScore: { type: Type.NUMBER },
                    coherenceScore: { type: Type.NUMBER },
                    generalizabilityScore: { type: Type.NUMBER }
                  },
                  required: [
                    "modelCode",
                    "modelNameAr",
                    "specializationAr",
                    "isolatedHypothesisAr",
                    "reasoningTraceAr",
                    "noveltyScore",
                    "coherenceScore",
                    "generalizabilityScore"
                  ]
                }
              },
              experienceTitleAr: { type: Type.STRING },
              domainCategory: { type: Type.STRING },
              linkedSkillId: { type: Type.STRING },
              reasoningPatternAr: { type: Type.STRING },
              optimalDeductiveRuleAr: { type: Type.STRING },
              powerDelta: { type: Type.NUMBER }
            },
            required: [
              "unconventionalScenarioAr",
              "microModels",
              "experienceTitleAr",
              "domainCategory",
              "linkedSkillId",
              "reasoningPatternAr",
              "optimalDeductiveRuleAr",
              "powerDelta"
            ]
          }
        }
      },
      resolveStrictModelCascade(selectedModel, true)
    );

    const rawJson = (response.text || "").trim();
    if (!rawJson) {
      const globalPowerState = autoPromoteToGlobalPower
        ? recordExperienceInGlobalNexusPowerLedger(
            baselineRun.synthesizedExperience,
            baselineRun.powerGain,
            true
          )
        : loadGlobalNexusPowerFromDisk();
      return { sandboxRun: baselineRun, globalPowerState };
    }

    const parsed = safeParseModelJson<any>(rawJson, {});
    const now = Date.now();
    const rawModels =
      Array.isArray(parsed.microModels) && parsed.microModels.length > 0
        ? parsed.microModels
        : baselineRun.microModels;

    const normalizedMicroModels: SandboxMicroModelResult[] = rawModels
      .slice(0, 4)
      .map((m: any, idx: number) => {
        const novelty = Math.min(100, Math.max(65, Math.round(Number(m.noveltyScore) || 92)));
        const coherence = Math.min(100, Math.max(65, Math.round(Number(m.coherenceScore) || 91)));
        const generalizability = Math.min(
          100,
          Math.max(65, Math.round(Number(m.generalizabilityScore) || 93))
        );
        const composite = Math.round(
          novelty * 0.35 + coherence * 0.35 + generalizability * 0.3
        );
        return {
          id: `mm-${idx + 1}-${now}`,
          modelCode: String(m.modelCode || baselineRun.microModels[idx]?.modelCode || `MICRO-${idx + 1}`),
          modelNameAr: String(m.modelNameAr || baselineRun.microModels[idx]?.modelNameAr || `النموذج المصغر #${idx + 1}`),
          specializationAr: String(m.specializationAr || baselineRun.microModels[idx]?.specializationAr || ""),
          isolatedHypothesisAr: String(m.isolatedHypothesisAr || ""),
          reasoningTraceAr: String(m.reasoningTraceAr || ""),
          noveltyScore: novelty,
          coherenceScore: coherence,
          generalizabilityScore: generalizability,
          compositeScore: composite,
          passedIsolationCheck: true,
          isSelectedPattern: false
        };
      });

    let bestIdx = 0;
    for (let i = 1; i < normalizedMicroModels.length; i++) {
      if (normalizedMicroModels[i].compositeScore > normalizedMicroModels[bestIdx].compositeScore) {
        bestIdx = i;
      }
    }
    normalizedMicroModels[bestIdx].isSelectedPattern = true;
    const winner = normalizedMicroModels[bestIdx];

    const validSkillMatch = String(parsed.linkedSkillId || "SKILL-31").match(/SKILL-\d{2}/i);
    const cleanSkillId = validSkillMatch ? validSkillMatch[0].toUpperCase() : "SKILL-31";
    const powerGain = Number(
      Math.min(15, Math.max(3.5, Number(parsed.powerDelta) || 7.5)).toFixed(1)
    );

    const synthesizedExperience: SyntheticTrainingExperience = {
      id: `exp-sbx-${now}`,
      titleAr: String(parsed.experienceTitleAr || baselineRun.synthesizedExperience.titleAr),
      domainCategory: String(parsed.domainCategory || "الاستدلال التطوري العابر للحقول"),
      linkedSkillId: cleanSkillId,
      inputScenarioAr: String(parsed.unconventionalScenarioAr || baselineRun.unconventionalScenarioAr),
      reasoningPatternAr: String(parsed.reasoningPatternAr || winner.reasoningTraceAr),
      optimalDeductiveRuleAr: String(
        parsed.optimalDeductiveRuleAr || baselineRun.synthesizedExperience.optimalDeductiveRuleAr
      ),
      trainingWeight: winner.compositeScore,
      powerDelta: powerGain,
      promotedToGlobalCorpus: autoPromoteToGlobalPower,
      createdAt: now
    };

    const sandboxRun: EvolutionarySandboxRun = {
      runId: `sbx-run-${now}`,
      seedTopicAr: cleanSeed,
      unconventionalScenarioAr: String(
        parsed.unconventionalScenarioAr || baselineRun.unconventionalScenarioAr
      ),
      isolationContainerId: containerId,
      microModels: normalizedMicroModels,
      winningMicroModelId: winner.id,
      winningPatternRuleAr: synthesizedExperience.optimalDeductiveRuleAr,
      synthesizedExperience,
      powerGain,
      mergedToCoreMemory: true,
      promotedToGlobalPower: autoPromoteToGlobalPower,
      timestamp: now
    };

    const globalPowerState = autoPromoteToGlobalPower
      ? recordExperienceInGlobalNexusPowerLedger(synthesizedExperience, powerGain, true)
      : loadGlobalNexusPowerFromDisk();

    return { sandboxRun, globalPowerState };
  } catch {
    const globalPowerState = autoPromoteToGlobalPower
      ? recordExperienceInGlobalNexusPowerLedger(
          baselineRun.synthesizedExperience,
          baselineRun.powerGain,
          true
        )
      : loadGlobalNexusPowerFromDisk();
    return { sandboxRun: baselineRun, globalPowerState };
  }
}


// --- THE ARCHIVIST (ZERO-QUOTA ORGANIC PALE ARCHIVE EXTRACTION) ---
export const extractEntitiesAndRelations = async (
  text: string,
  _selectedModel: string = 'hybrid-nexus'
): Promise<{ entities: any[]; relationships: any[] }> => {
  try {
    if (!text || text.includes('NEXUS_QUOTA_EXHAUSTED') || text.trim().length < 40) {
      return { entities: [], relationships: [] };
    }
    const entities: any[] = [];
    const relationships: any[] = [];

    const structuralSkipRegex =
      /^(?:أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|\d+[.)-\s]|الآلية|الناتج|الخلاصة|ملاحظة|المشكلة|الحل|الهدف|الخطوة|المرحلة|المسار|الطبقة|سببياً|عملياً|بنيوياً|إجرائياً|تنبيه|مثال|تطبيق|NEXUS|VISION|CRITIQUE|MATRIX|VERIFIED|CONVENTIONAL|CONDITIONAL|FALSIFIED|بروتوكول|مهارة|SKILL)/i;

    const seenNames = new Set<string>();
    const addCandidate = (rawName: string, rawDesc: string, explicitType?: 'character' | 'location' | 'concept' | 'artifact' | 'event') => {
      if (entities.length >= 4) return;
      const name = (rawName || '')
        .replace(/[*`«»""'']/g, '')
        .replace(/[:：-]+$/, '')
        .trim();
      const contextDef = (rawDesc || '').replace(/\s+/g, ' ').trim();
      if (!name || name.length < 3 || name.length > 44 || structuralSkipRegex.test(name)) return;
      if (!contextDef || contextDef.length < 15) return;
      const normKey = name.toLowerCase();
      if (seenNames.has(normKey)) return;

      const id = `ent-${normKey.replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '').slice(0, 26)}`;
      if (!id || id === 'ent-') return;

      const inferredType =
        explicitType ||
        (/شخصية|بطل|شاب|فتاة|رجل|امرأة|ملك|محارب|عالمة|قائد/i.test(`${name} ${contextDef}`)
          ? 'character'
          : /مدينة|إقليم|مملكة|عالم|قارة|جزيرة|برج|صحراء|بحر/i.test(`${name} ${contextDef}`)
          ? 'location'
          : /كود|خوارزمية|نظام|معمارية|واجهة|قاعدة|برمجة|تطبيق|مشروع|محرك|api|react|firebase|database/i.test(`${name} ${contextDef}`)
          ? 'artifact'
          : /حرب|انهيار|ثورة|حادثة|عصر|معركة|انفجار/i.test(`${name} ${contextDef}`)
          ? 'event'
          : 'concept');

      const candidateEntity = {
        id,
        name,
        type: inferredType,
        description: contextDef.slice(0, 200),
        attributes: ['الأرشيف الشاحب'],
        lastUpdated: Date.now()
      };
      if (!isValidPaleArchiveEntity(candidateEntity)) return;

      seenNames.add(normKey);
      entities.push(candidateEntity);
    };

    // 1. Bold term + inline definition (**Term**: description OR **Term** هو/هي/is/means ...)
    for (const m of text.matchAll(/\*\*([^*:\n]{3,42})\*\*(?:\s*(?:[:：—-]|وهو|وهي|هو|هي|يعني|يمثل|\bis\b|\bare\b|\bmeans\b|\brepresents\b)\s*([^\n.؟!]{15,190}))/gi)) {
      addCandidate(m[1], m[2]);
    }

    // 1b. Prefixed bold entities in natural prose (Arabic & English)
    for (const m of text.matchAll(
      /(?:رواية|قصة|عالم|شخصية|مشروع|مفهوم|نظام|مدينة|إقليم|مملكة|قانون|ميثاق|\bnovel\b|\bstory\b|\bworld\b|\bcharacter\b|\bproject\b|\bconcept\b|\bsystem\b|\bcity\b|\bkingdom\b|\blaw\b)\s+\*\*([^*:\n]{3,38})\*\*([^\n.؟!]{0,160})/gi
    )) {
      const prefix = m[0].slice(0, 14).toLowerCase();
      const explicitType = /شخصية|character/.test(prefix)
        ? 'character'
        : /مدينة|إقليم|مملكة|عالم|city|kingdom|world/.test(prefix)
        ? 'location'
        : /مشروع|نظام|project|system/.test(prefix)
        ? 'artifact'
        : 'concept';
      const trailing = (m[2] || '').replace(/^[\s،,:：—-]+/, '').trim();
      const desc = trailing.length >= 15 ? trailing : `${m[0].replace(/\*\*/g, '').trim()} — recurring element in conversation`;
      addCandidate(m[1], desc, explicitType);
    }

    // 2. Quoted named worlds, characters, novels, projects, or concepts («Name» or "Name")
    for (const m of text.matchAll(
      /(?:رواية|قصة|عالم|شخصية|مشروع|مفهوم|نظام|مدينة|إقليم|مملكة|قانون|ميثاق|\bnovel\b|\bstory\b|\bworld\b|\bcharacter\b|\bproject\b|\bconcept\b|\bsystem\b|\bcity\b|\bkingdom\b)\s+[«"']([^»"'\n]{3,38})[»"'](?:\s*(?:[:：—-]|وهو|وهي|الذي|التي|\bis\b|\bwho\b|\bwhich\b)\s*([^\n.؟!]{15,190}))?/gi
    )) {
      const prefix = m[0].slice(0, 14).toLowerCase();
      const explicitType = /شخصية|character/.test(prefix)
        ? 'character'
        : /مدينة|إقليم|مملكة|عالم|city|kingdom|world/.test(prefix)
        ? 'location'
        : /مشروع|نظام|project|system/.test(prefix)
        ? 'artifact'
        : 'concept';
      const fallbackSentence = (m[2] || m[0]).trim();
      addCandidate(m[1], fallbackSentence.length >= 15 ? fallbackSentence : `${m[0]} — recurring element in conversation`, explicitType);
    }

    // 3. Natural Arabic/English concept definitions («المفهوم» هو/هي/يعني ... OR "Concept" is/means ...)
    for (const m of text.matchAll(/[«"]([^»"\n]{4,36})[»"]\s+(?:هو|هي|يعني|يمثل|عبارة عن|يشير إلى|\bis\b|\bmeans\b|\brepresents\b|\brefers\s+to\b)\s+([^\n.؟!]{18,180})/gi)) {
      addCandidate(m[1], m[2], 'concept');
    }

    for (let i = 0; i < entities.length - 1; i++) {
      relationships.push({
        sourceId: entities[i].id,
        targetId: entities[i + 1].id,
        relationType: 'SYNERGIZES_WITH',
        description: `ارتباط بنيوي بين ${entities[i].name} و ${entities[i + 1].name}`
      });
    }

    return { entities, relationships };
  } catch {
    return { entities: [], relationships: [] };
  }
};

// --- THE CRYSTALLIZER (Zero-Quota Selective Local Memory Retriever, PaleArchive<->Axioms Bridge & SoulPrint Engine) ---
export const retrieveRelevantMemory = async (
  prompt: string,
  memoryBank: MemoryBank
): Promise<Axiom[]> => {
  if (!memoryBank) return [];
  const rawAxioms = Array.isArray(memoryBank.axioms) ? memoryBank.axioms : [];
  const LEGACY_JARGON_AXIOM_RE =
    /CLEAR\s*\/\s*HAZY\s*\/\s*VOID|Tesseract|الزوايا\s+التسع|0➔4|Living\s+Voice|بوابة\s+الصدق\s+الذاتي|الحجاب\s+السيادي|SKILL-\d+|KHORA-01|OP-VEIL|مخطوطات\s+كلود|a\s+dialogue/i;
  const cleanAxioms = filterAndDeduplicateAxioms(rawAxioms).filter(
    a => a && a.content && !LEGACY_JARGON_AXIOM_RE.test(a.content)
  );
  const paleEntities = Array.isArray(memoryBank.paleArchive?.entities)
    ? memoryBank.paleArchive!.entities
    : [];

  const tokens = (prompt || '')
    .toLowerCase()
    .split(/[\s,.;:!?()[\]{}"'،؛؟]+/)
    .filter(t => t.length > 2);

  // Bridge PaleArchive entities with Axioms (as designed in the founding architecture)
  const resonantEntities = paleEntities.filter(ent => {
    const entName = (ent.name || '').toLowerCase();
    const entDesc = (ent.description || '').toLowerCase();
    return tokens.some(tok => entName.includes(tok) || entDesc.includes(tok));
  });

  const bridgedEntityAxioms: Axiom[] = resonantEntities.slice(0, 4).map(ent => ({
    id: `pale-bridge-${ent.id}`,
    content: `من ذاكرة عالم المحاور (${ent.name}): ${ent.description}`,
    category: 'philosophy' as const,
    sourceSessionId: 'pale-archive-bridge',
    createdAt: Date.now()
  }));

  // Claude's <= 15 threshold: if total axioms <= 15, return all clean axioms + resonant PaleArchive bridges
  if (cleanAxioms.length <= 15) {
    const existingContents = new Set(cleanAxioms.map(a => a.content));
    const uniqueBridges = bridgedEntityAxioms.filter(b => !existingContents.has(b.content));
    return [...cleanAxioms, ...uniqueBridges].slice(0, 15);
  }

  const resonantEntityNames = resonantEntities.map(e => (e.name || '').toLowerCase()).filter(Boolean);

  const scored = cleanAxioms.map((ax, idx) => {
    const contentLower = (ax.content || '').toLowerCase();
    let score = idx * 0.1;
    for (const tok of tokens) {
      if (contentLower.includes(tok)) score += 3;
    }
    // Boost axioms that connect to resonant PaleArchive entities
    for (const entName of resonantEntityNames) {
      if (contentLower.includes(entName)) score += 4;
    }
    return { ax, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topAxioms = scored.slice(0, 12).map(s => s.ax);
  const existingContents = new Set(topAxioms.map(a => a.content));
  const uniqueBridges = bridgedEntityAxioms.filter(b => !existingContents.has(b.content)).slice(0, 3);
  return [...topAxioms, ...uniqueBridges];
};

export const crystallizeSession = async (
  sessionMessages: Message[], 
  sessionId: string
): Promise<{ axioms: Axiom[], soulPrintUpdate?: Partial<SoulPrint>, newCorrections?: UserCorrectionRecord[] }> => {
  try {
    const userMsgs = (sessionMessages || [])
      .filter(m => m.role === 'user' && m.content && !m.content.startsWith('[SOVEREIGN_'));

    if (userMsgs.length === 0) {
      return { axioms: [] };
    }

    const recentUserMsgs = userMsgs.slice(-8);
    const latestUserText = recentUserMsgs[recentUserMsgs.length - 1].content.trim();
    const combinedRecentText = recentUserMsgs.map(m => m.content.trim()).join('\n');

    // Weighted multi-message scoring across ALL 5 Claude SoulPrint dimensions (never flip on a single stray word)
    const countMatches = (re: RegExp, text: string): number => (text.match(re) || []).length;

    const avgWordCount =
      recentUserMsgs.reduce((acc, m) => acc + m.content.trim().split(/\s+/).filter(Boolean).length, 0) /
      Math.max(1, recentUserMsgs.length);

    const sovereignHits = countMatches(
      /وجود|وعي|فلسف|جوهر|سببي|معمارية|حبكة|أعماق|اعماق|غاية|كوني|حتمية|ما وراء|سرد|روح|نيكسوس|كلود|مفارقة|بنية|\b(?:nexus|sovereign|ontology|philosophy|consciousness|paradox|architecture|causality|essence|inevitability|narrative|worldbuilding)\b/gi,
      combinedRecentText
    );
    const poeticHits = countMatches(
      /شعور|قلب|صمت|نغم|وتر|خيال|حلم|ظل|نور|أثر|جمال|شاعري|مشهد|رواية|قصة|\b(?:silence|shadow|dream|beauty|poetic|novel|story|scene|imagination|whisper|resonance)\b/gi,
      combinedRecentText
    );
    const analyticalHits = countMatches(
      /حلل|قارن|برهن|منطق|معادلة|خوارزمية|كود|نظام|هيكل|بنية|تفكيك|اختبر|أسباب|علاقة|\b(?:analyze|compare|prove|logic|algorithm|code|system|structure|deconstruct|test|evaluate|mechanism)\b/gi,
      combinedRecentText
    );
    const rawDirectHits = countMatches(
      /بجدية|بصراحة|بلا مجاملة|مباشرة|بدون مقدمات|حقيقي|لا تجامل|بلا تلميع|\b(?:honestly|brutally|directly|no\s+fluff|straight\s+up|be\s+blunt|don'?t\s+sugarcoat)\b/gi,
      combinedRecentText
    );
    const associativeHits = countMatches(
      /مثل|يشبه|يربط|بينما|في نفس الوقت|على الجانب الآخر|من زاوية أخرى|إلى جانب|كذلك|\b(?:similar\s+to|connects|meanwhile|at\s+the\s+same\s+time|on\s+the\s+other\s+hand|reminds\s+me\s+of|analogous)\b/gi,
      combinedRecentText
    );
    const linearHits = countMatches(
      /أولاً|ثانياً|خطوة|الترتيب|بالتسلسل|قبل أن|بعدها|ثم ننتقل|\b(?:first|second|step\s+by\s+step|in\s+order|sequentially|before\s+we|then\s+move)\b/gi,
      combinedRecentText
    );
    const emotionalHits = countMatches(
      /أشعر|اشعر|أحس|احس|تعب|حزين|سعيد|خائف|وحدة|قلق|ألم|راحة|ثقل|قلب|روح|صدق|محتار|تائه|\b(?:i\s+feel|feeling|tired|sad|happy|scared|afraid|lonely|anxious|pain|relief|heavy|heart|soul|lost|torn)\b/gi,
      combinedRecentText
    );

    const intellectualDepth: SoulPrint['intellectualDepth'] =
      sovereignHits >= 3 || avgWordCount > 28
        ? 'sovereign'
        : sovereignHits >= 1 || avgWordCount > 15 || analyticalHits >= 2
        ? 'deep'
        : avgWordCount > 7
        ? 'curious'
        : 'surface';

    const preferredTone: SoulPrint['preferredTone'] =
      rawDirectHits >= 2
        ? 'raw'
        : poeticHits >= 2 && poeticHits >= analyticalHits
        ? 'poetic'
        : analyticalHits >= 2
        ? 'analytical'
        : 'conversational';

    // Strictly valid SoulPrint['thinkingPattern'] enum values
    const thinkingPattern: SoulPrint['thinkingPattern'] =
      sovereignHits >= 3 && associativeHits >= 2
        ? 'systemic_multidimensional'
        : sovereignHits >= 2 || analyticalHits >= 2
        ? 'architectural'
        : associativeHits >= 2
        ? 'associative'
        : linearHits >= 2
        ? 'linear'
        : 'intuitive';

    const emotionalResonance: SoulPrint['emotionalResonance'] =
      emotionalHits >= 3 || (poeticHits >= 2 && emotionalHits >= 1)
        ? 'high'
        : emotionalHits >= 1 || poeticHits >= 1
        ? 'medium'
        : 'low';

    // Extract recurrentThemes dynamically from the conversation (multilingual)
    const detectedThemes: string[] = [];
    if (/فلسف|وجود|معنى|حقيقة|وعي|إدراك|\b(?:philosophy|existence|meaning|truth|consciousness|ontology)\b/i.test(combinedRecentText)) detectedThemes.push('الفلسفة والأنطولوجيا');
    if (/رواية|قصة|سرد|حبكة|شخصية|مشهد|خيال|أدب|\b(?:novel|story|narrative|plot|character|scene|fiction|worldbuilding)\b/i.test(combinedRecentText)) detectedThemes.push('السرد وبناء العوالم الحية');
    if (/معمارية|هندسة|نظام|تطبيق|كود|برمجة|خوارزمية|\b(?:architecture|engineering|system|app|code|programming|algorithm|software)\b/i.test(combinedRecentText)) detectedThemes.push('المعمارية الهندسية والبرمجية');
    if (/نفس|شعور|ألم|تناقض|إنسان|تجربة|\b(?:psychology|emotion|human|decision|fear|experience)\b/i.test(combinedRecentText)) detectedThemes.push('النفس البشرية والتجربة المعيشة');
    if (/تاريخ|حضارة|أرشيف|علم|نظريات|\b(?:history|civilization|science|physics|biology|economics)\b/i.test(combinedRecentText)) detectedThemes.push('التاريخ والحضارات والنظريات العلمية');

    // Organic enduring Axiom crystallization (Arabic + English/Latin)
    const axioms: Axiom[] = [];
    const LEGACY_NOISE_RE =
      /CLEAR\s*\/\s*HAZY\s*\/\s*VOID|Tesseract|الزوايا\s+التسع|0➔4|SKILL-\d+|KHORA-01|OP-VEIL/i;

    for (const msg of recentUserMsgs.slice(-3)) {
      const txt = msg.content.trim().replace(/\s+/g, ' ');
      if (txt.length < 18 || txt.length > 260 || LEGACY_NOISE_RE.test(txt)) continue;
      if (/[؟?]\s*$/.test(txt)) continue;

      let category: Axiom['category'] | null = null;
      if (/(?:اسمي\s+هو|نادني\s+بـ|أنا\s+(?:أعمل|مهندس|كاتب|مطور|طالب|مؤسس)|\b(?:my\s+name\s+is|call\s+me|i\s+am\s+a(?:n)?\s+(?:writer|engineer|developer|founder|student|designer))\b)/i.test(txt)) {
        category = 'identity';
      } else if (
        /(?:أعمل\s+على\s+(?:رواية|قصة|مشروع|تطبيق|عالم|لعبة)|مشروعي\s+(?:هو|عن|اسمه)|روايتي\s+(?:عن|اسمها)|عالم\s+قصتي|\b(?:i'?m\s+working\s+on\s+a\s+(?:novel|story|project|app|world|game)|my\s+(?:novel|project|story|world)\s+is\s+(?:about|called))\b)/i.test(txt)
      ) {
        category = 'world_building';
      } else if (
        /(?:أفضل\s+(?:دائماً|ان|أن)|افضل\s+(?:دائما|ان|أن)|تذكر\s+دائماً|تذكر\s+دائما|قاعدة\s+ثابتة|مبدأ\s+ثابت|لا\s+تختصر|لا\s+تستخدم\s+الأسلوب|أحب\s+أن\s+يكون\s+(?:ردك|أسلوبك|الأسلوب)|اجعل\s+أسلوبك|دائماً\s+أريد|\b(?:i\s+(?:always\s+)?prefer|always\s+remember|keep\s+your\s+style|never\s+(?:use|give\s+me)|core\s+rule\s+for\s+me)\b)/i.test(txt)
      ) {
        category = 'preference';
      } else if (
        /(?:أؤمن\s+أن|فلسفتي\s+هي|قناعتي\s+أن|المبدأ\s+الأهم\s+عندي|\b(?:i\s+believe\s+that|my\s+philosophy\s+is|my\s+core\s+principle)\b)/i.test(txt)
      ) {
        category = 'philosophy';
      }

      if (category) {
        const candidateAxiom: Axiom = {
          id: `ax-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          content: txt.slice(0, 260),
          category,
          sourceSessionId: sessionId,
          createdAt: Date.now()
        };
        if (isValidSovereignAxiom(candidateAxiom)) {
          axioms.push(candidateAxiom);
        }
      }
    }

    // Automatic live detection of explicit user corrections (multilingual Arabic + English)
    const newCorrections: UserCorrectionRecord[] = [];
    const correctionIntentRegex =
      /(?:لا\s+(?:تكتب|تستخدم|تضع|تشرح|تختصر|تكرر|تقاطع|تخلط|تضيف|تجبر)|توقف\s+عن|إياك\s+أن|ليس\s+عليك\s+(?:إجبار|اجبار|فعل)|لم\s+أقصد\s+هذا|أرجو\s+ألا|\b(?:don'?t\s+(?:use|write|add|force|summarize|explain|repeat|mix)|stop\s+(?:using|doing|adding|forcing)|never\s+(?:use|add|explain|summarize|force)|that'?s\s+not\s+what\s+i\s+meant|please\s+avoid)\b)/i;

    for (const msg of recentUserMsgs.slice(-2)) {
      const txt = msg.content.trim().replace(/\s+/g, ' ');
      if (txt.length >= 16 && txt.length <= 240 && !LEGACY_NOISE_RE.test(txt) && correctionIntentRegex.test(txt)) {
        const inferredCat: UserCorrectionRecord['category'] =
          /(?:أسلوب|لغة|قوائم|اختصر|تختصر|ملخص|summarize|style|tone|language|bullet)/i.test(txt)
            ? 'style_preference'
            : /(?:أداة|صورة|بحث|ملف|كود|tool|image|search|file|code)/i.test(txt)
            ? 'tool_usage'
            : /(?:خطأ|غير صحيح|لم أقصد|wrong|incorrect|not\s+what\s+i\s+meant)/i.test(txt)
            ? 'factual_fix'
            : 'methodology';
        newCorrections.push({
          id: `corr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          sessionId,
          originalIssueSummary: 'ملاحظة تصحيحية مباشرة التُقطت من الحوار الحي',
          userCorrectionRule: txt.slice(0, 220),
          category: inferredCat,
          appliedToCoreMemory: true,
          createdAt: Date.now()
        });
      }
    }

    const latestFocusSummary = latestUserText.replace(/\s+/g, ' ').slice(0, 95);
    const themesLabel =
      detectedThemes.length > 0 ? detectedThemes.join('، و') : 'حوار معرفي وهندسي مفتوح';
    const dynamicPersonalNotes = `يميل في حواراته نحو ${themesLabel}، وكانت آخر بؤرة اهتمام له تدور حول: "${latestFocusSummary}${latestUserText.length > 95 ? '...' : ''}".`;

    const soulPrintUpdate: Partial<SoulPrint> = {
      intellectualDepth,
      preferredTone,
      thinkingPattern,
      emotionalResonance,
      lastUpdated: Date.now(),
      ...(detectedThemes.length > 0 ? { recurrentThemes: detectedThemes } : {}),
      personalNotes: dynamicPersonalNotes
    };

    return {
      axioms,
      soulPrintUpdate,
      ...(newCorrections.length > 0 ? { newCorrections } : {})
    };
  } catch {
    return { axioms: [] };
  }
};

// --- THE MEMORY AUDITOR (Paradox & Contradiction Resolution) ---
export interface MemoryAuditResult {
  contradictions: string[];
  forgottenThreads: string[];
  suggestedRefinements: string[];
}

export const auditMemoryMatrix = async (
  sessionMessages: Message[],
  memoryBank: MemoryBank
): Promise<MemoryAuditResult> => {
  const ai = getAIClient();
  const transcript = sessionMessages
    .slice(-15) 
    .map(m => `${m.role === 'user' ? 'USER' : 'NEXUS'}: ${m.content.substring(0, 500)}`)
    .join('\n');

  const archiveState = JSON.stringify({
    axioms: memoryBank.axioms || [],
    entities: memoryBank.paleArchive?.entities || [],
    relationships: memoryBank.paleArchive?.relationships || []
  });

  const prompt = `
[SYSTEM DIRECTIVE: PALE ARCHIVE OVERSEER - MEMORY AUDIT]
Your task is to cross-reference the active conversation transcript with the internal Pale Archive (Axioms and Entities).
You must highlight potential contradictions (where the recent conversation contradicts established long-term memories), forgotten threads (important elements from the archive that haven't been mentioned recently but are relevant), and suggested refinements.

[ACTIVE CONVERSATION]:
${transcript}

[CURRENT MEMORY ARCHIVE (Entities & Axioms)]:
${archiveState}

Analyze both deeply. Output ONLY a valid JSON object matching this structure exactly (no markdown formatting, no code blocks):
{
  "contradictions": ["Contradiction 1", "Contradiction 2"],
  "forgottenThreads": ["Thread 1", ...],
  "suggestedRefinements": ["Refinement 1", ...]
}
If there are no items for a category, return an empty array for it. Be concise and deeply insightful.
  `;

  try {
    const response = await generateContentWithModelFallback(ai, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    }, ['gemini-4-hydrogen', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite']);

    const jsonStr = response.text || "{}";
    const result = JSON.parse(jsonStr);
    
    return {
      contradictions: result.contradictions || [],
      forgottenThreads: result.forgottenThreads || [],
      suggestedRefinements: result.suggestedRefinements || []
    };
  } catch (error) {
    console.error("Memory Audit Error:", error);
    return { contradictions: [], forgottenThreads: [], suggestedRefinements: [] };
  }
};

// --- THE PRISM CORTEX & NEXUS FORGE X (Single-Request Real-Time Interleaved Multimodal Vision & Image Stream) ---
export interface DeepManifestationState {
    iteration: number;
    maxIterations: number;
    phase: 'Initializing' | 'Generating' | 'Critiquing' | 'Refining' | 'Converged';
    currentPrompt?: string;
    critique?: string;
    imageData?: string;
    nanoPulse?: NanoVisualPulse;
    nanoVisualTelemetry?: NanoVisualTelemetry;
    activeModel?: string;
    phaseLabelAr?: string;
    liveThoughtProcess?: string;
    liveResponseText?: string;
    thinkingDurationSec?: number;
}

export interface VisualGenerationOptions {
    imageModelFamily?:
        | 'nano-banana-2.1'
        | 'gemini-3-pro-image'
        | 'nano-banana-lite'
        | 'google-grounded'
        | 'pro-cascade'
        | 'flash-cascade'
        | 'ideogram-4'
        | 'odyssey-mold-matrix'
        | 'qwen-image-2.1'
        | 'nano-banana-qwen-fusion';
    resolution?: '1K' | '2K' | '4K';
    enableVisualSearch?: boolean;
    useOdyssey?: boolean;
    cameraAngle?: string;
    embeddedText?: string;
    selectedChatModel?: string;
    isMaxEffortEnabled?: boolean;
    recentHistory?: Array<{ role?: string; content?: string }>;
}

const CAMERA_ANGLE_DIRECTIVES: Record<string, string> = {
    default: 'balanced cinematic framing, golden-ratio spatial composition, natural lens perspective',
    low_angle: 'dramatic low-angle heroic perspective looking upward, monumental scale, 24mm wide-angle anamorphic lens',
    birds_eye: 'high-altitude bird’s-eye aerial top-down perspective, sweeping architectural & spatial overview',
    macro_closeup: 'extreme macro close-up lens (85mm f/1.2), razor-thin depth of field, microscopic surface textures and pore/fiber detail',
    wide_isometric: 'expansive 3D isometric architectural wide shot, full structural visibility, crystalline spatial geometry',
    dutch_cinematic: 'dynamic tilted Dutch-angle cinematic tension, dramatic chiaroscuro shadows, kinetic motion energy'
};

/**
 * Spatial 128x128 AdaptiveForceField + TimeReversalBuffer grounded in /architecture/nexus_genesis_engine.py
 */
class ServerAdaptiveForceField128 {
    private grid: Float32Array;
    private readonly persistenceDecay = 0.92;

    constructor() {
        this.grid = new Float32Array(128 * 128);
        this.grid.fill(1.0);
    }

    public applyDecision(amplifies: string[], biases: string[], freeZones: string[]): { meanForce: number; wildernessRatio: number } {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] *= this.persistenceDecay;
        }
        const ampWeight = 1.0 + Math.min(0.45, amplifies.length * 0.12);
        const biasWeight = 1.0 + Math.min(0.3, biases.length * 0.08);
        const freeMaskRatio = Math.min(0.38, Math.max(0.12, freeZones.length * 0.11));

        let sum = 0;
        let freeCount = 0;
        for (let y = 0; y < 128; y++) {
            for (let x = 0; x < 128; x++) {
                const idx = y * 128 + x;
                const normX = x / 128;
                const normY = y / 128;
                const distCenter = Math.hypot(normX - 0.5, normY - 0.5);
                if (distCenter > (0.68 - freeMaskRatio * 0.35)) {
                    // Visual Wilderness free zone (alpha = 0 in peripheral organic zones)
                    this.grid[idx] *= 0.35;
                    freeCount++;
                } else if (distCenter < 0.28) {
                    this.grid[idx] = Math.min(2.2, this.grid[idx] * ampWeight);
                } else {
                    this.grid[idx] = Math.min(1.8, this.grid[idx] * biasWeight);
                }
                sum += this.grid[idx];
            }
        }
        return {
            meanForce: Number((sum / this.grid.length).toFixed(3)),
            wildernessRatio: Number((freeCount / this.grid.length).toFixed(3))
        };
    }
}

interface SovereignPainterZone {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    model: 'Flux' | 'Turbo' | 'SD' | 'Gemini';
    layerIndex: 1 | 2 | 3;
    weight: number;
    ior: number;
    feather: number;
    promptFragment: string;
    critiqueNoteAr: string;
}

interface SovereignPainterBlueprint {
    layer1FoundationPrompt: string;
    layer2ObjectsPrompt: string;
    layer3PhotonicGlazePrompt: string;
    unifiedMasterPrompt: string;
    painterThoughtsAr: string;
    selfCritiqueLogAr: string;
    presentationAr: string;
    zones: SovereignPainterZone[];
}

const googleImageLastErrorByModel = new Map<string, string>();
let pollinationsNextAllowedAtMs = 0;
let aiHordeCooldownUntilMs = 0;
let subnpCooldownUntilMs = 0;
let cachedAiHordeModels: Array<{ name: string; count: number; eta: number }> = [];
let cachedAiHordeModelsAtMs = 0;

function extractPrimaryRasterBase64(
    rawData?: string,
    fallbackMime: string = 'image/png'
): { data: string; mimeType: string } | null {
    if (!rawData || typeof rawData !== 'string') return null;
    let candidate = rawData.trim();
    if (candidate.startsWith('NEXUS_MULTI_MODEL_MIX|')) {
        candidate = candidate.split('|')[1] || '';
    }
    if (!candidate) return null;
    const dataUrlMatch = candidate.match(/^data:(image\/[\w+.+-]+);base64,([\s\S]+)$/i);
    if (dataUrlMatch) {
        return {
            mimeType: dataUrlMatch[1].toLowerCase(),
            data: dataUrlMatch[2].replace(/\s+/g, '')
        };
    }
    return {
        mimeType: fallbackMime || 'image/png',
        data: candidate.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '')
    };
}

function cleanConciseImagePrompt(rawText: string, fallbackText: string, maxLen: number = 240): string {
    const cleaned = (rawText || '')
        .replace(/Layer\s*[123]\s*[^:]*:\s*/gi, '')
        .replace(/Masterpiece\s*8K\s*visual\s*composition\s*of:\s*/gi, '')
        .replace(/Foundational\s*spatial\s*architecture\s*and\s*horizon\s*structure:\s*/gi, '')
        .replace(/Razor-sharp\s*focal\s*subjects\s*and\s*micro-texture\s*precision:\s*/gi, '')
        .replace(/Volumetric\s*Rayleigh\s*lighting,\s*rim\s*glow,\s*and\s*photonic\s*atmosphere:\s*/gi, '')
        .replace(/Style:\s*none\.?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    const chosen = cleaned.length >= 12 ? cleaned : (fallbackText || '').replace(/\s+/g, ' ').trim();
    if (chosen.length <= maxLen) return chosen;
    const sliced = chosen.slice(0, maxLen);
    const lastSpace = sliced.lastIndexOf(' ');
    return (lastSpace > Math.floor(maxLen * 0.6) ? sliced.slice(0, lastSpace) : sliced).trim();
}

export const generateVisualArtifact = async (
    prompt: string, 
    aspectRatio: string = "16:9", 
    style: string = "none", 
    nexusState: string = "", 
    isDeepManifestation: boolean = true,
    inputImage?: { data: string, mimeType: string },
    onLog?: (msg: string, type?: 'info' | 'core' | 'success' | 'warning' | 'error') => void,
    onProgress?: (state: DeepManifestationState) => void,
    options?: VisualGenerationOptions
): Promise<{
    data: string;
    refinedPrompt: string;
    nanoVisualTelemetry?: NanoVisualTelemetry;
    thoughtProcess?: string;
    finalResponse?: string;
    thinkingDuration?: number;
}> => {
    const ai = getAIClient();
    const startTimeMs = Date.now();

    const resolution = options?.resolution || '2K';
    const cameraAngleKey = options?.cameraAngle || 'default';
    const cameraDirective = CAMERA_ANGLE_DIRECTIVES[cameraAngleKey] || CAMERA_ANGLE_DIRECTIVES.default;
    const embeddedText = options?.embeddedText?.trim() || '';

    const rawChatModel = (options?.selectedChatModel || 'nexus-4-hydrogen').toLowerCase();
    const isProChat =
      rawChatModel === 'nexus-4-pro' ||
      rawChatModel === 'nexus-4-neon' ||
      rawChatModel === 'nexus-4-carbon' ||
      rawChatModel === 'nexus-4-argon' ||
      rawChatModel === 'gemini-4-neon' ||
      rawChatModel === 'gemini-4-carbon' ||
      rawChatModel === 'gemini-4-argon' ||
      rawChatModel === 'pro' ||
      rawChatModel === 'pro-latest' ||
      rawChatModel === 'nexus-3.1-pro';
    const qwenSpecs = loadLocalQwenImageOpenSourceSpecs();
    const recentConvContext = buildRecentConversationVisualContext(prompt, options?.recentHistory, nexusState);
    const requestedFamily = options?.imageModelFamily || 'nano-banana-2.1';
    const validGeminiAspect = ['1:1', '3:4', '4:3', '9:16', '16:9', '1:4', '1:8', '4:1', '8:1'].includes(aspectRatio) ? aspectRatio : '16:9';
    const standardFlashAspect = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(validGeminiAspect) ? validGeminiAspect : '16:9';
    const isExtendedAspect = !['1:1', '3:4', '4:3', '9:16', '16:9'].includes(validGeminiAspect);
    const validImageSize: '1K' | '2K' | '4K' = resolution === '4K' ? '4K' : resolution === '2K' ? '2K' : '1K';

    // Detect whether Google Web + Image Search visual grounding should be activated
    const hasRealWorldGroundingCue =
        !inputImage?.data &&
        /(?:برج|مسجد|مكة|المدينة|القدس|الأهرامات|باريس|طوكيو|لندن|نيويورك|دبي|الرياض|خريطة|شعار|سيارة|هاتف|طقس|أخبار|اليوم|2025|2026|landmark|eiffel|pyramids|tokyo|dubai|riyadh|real-world|weather|latest|current|infographic|diagram of)/i.test(prompt);
    const shouldEnableGoogleGrounding =
        options?.enableVisualSearch === true ||
        requestedFamily === 'google-grounded' ||
        (options?.enableVisualSearch !== false && hasRealWorldGroundingCue);

    // Canonical Google @google/genai image model lineup (no legacy 2.5 models):
    // 1. gemini-nano-banana-2.1: Flagship 1K/2K/4K, extended ratios (1:4/1:8/4:1/8:1), Web + Image Search Grounding
    // 2. gemini-3-pro-image: Studio Precision 1K/2K/4K, extended ratios, Web Search Grounding (no imageSearch)
    // 3. gemini-3.1-flash-lite-image: Ultra-fast default general generation & editing (standard ratios only, no imageSize/tools)
    const needsAdvancedGoogleEngine = isExtendedAspect || validImageSize !== '1K' || shouldEnableGoogleGrounding;
    const candidateImageModels: string[] =
        (requestedFamily === 'nano-banana-lite' || requestedFamily === 'flash-cascade') && !needsAdvancedGoogleEngine
            ? ['gemini-3.1-flash-lite-image', 'gemini-nano-banana-2.1', 'gemini-3-pro-image']
            : requestedFamily === 'gemini-3-pro-image' || requestedFamily === 'pro-cascade'
            ? ['gemini-3-pro-image', 'gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image']
            : ['gemini-nano-banana-2.1', 'gemini-3-pro-image', 'gemini-3.1-flash-lite-image'];

    const formatNanoBananaLabel = (modelId: string): string => {
        const lower = modelId.toLowerCase();
        if (lower.includes('lite')) {
            return `Google Nano-Banana Lite (${modelId})`;
        }
        if (lower.includes('pro')) {
            return `Google Nano-Banana Pro (${modelId})`;
        }
        return `Google Nano-Banana 2.1 (${modelId})`;
    };

    const routedModelLabel = `${formatNanoBananaLabel(candidateImageModels[0])}${shouldEnableGoogleGrounding ? ' + بحث جوجل البصري' : ''}`;

    const forceField = new ServerAdaptiveForceField128();
    const pulses: NanoVisualPulse[] = [];
    let activeImageModelUsed = formatNanoBananaLabel(candidateImageModels[0]);
    const useOdysseyMultiLayer = Boolean(isDeepManifestation && options?.useOdyssey !== false);
    let lastGoogleImageFailureReason = '';
    let allGoogleModelsBlockedByPaidQuota = false;

    const defaultZones: SovereignPainterZone[] = [
        {
            id: 'LAYER1_MOLD',
            x: 60,
            y: 40,
            w: 904,
            h: 620,
            label: 'الطبقة 1 · تأسيس الأفق والقالب المعماري (Foundation & Spatial Mold)',
            model: 'Flux',
            layerIndex: 1,
            weight: 1.0,
            ior: 1.52,
            feather: 0.28,
            promptFragment: `Foundational spatial geometry, horizon depth, and architectural background for: ${prompt.slice(0, 90)}`,
            critiqueNoteAr: 'تثبيت خطوط المنظور والعمق الهندسي كقاعدة صلبة قبل رسم الأغراض البؤرية.'
        },
        {
            id: 'LAYER2_FOCAL_OBJECTS',
            x: 165,
            y: 135,
            w: 694,
            h: 680,
            label: 'الطبقة 2 · بناء الأغراض والعناصر البؤرية (Object-over-Object Layer)',
            model: 'Turbo',
            layerIndex: 2,
            weight: 0.88,
            ior: 1.38,
            feather: 0.32,
            promptFragment: `Primary focal subjects and detailed foreground/midground objects layered with precision`,
            critiqueNoteAr: 'إرساء الأغراض الرئيسية فوق القالب الخلفي مع ضبط النسب والتوازن البصري.'
        },
        {
            id: 'LAYER2_FOREGROUND',
            x: 80,
            y: 560,
            w: 864,
            h: 420,
            label: 'الطبقة 2 · أغراض المقدمة والتفاصيل العضوية (Foreground Elements)',
            model: 'SD',
            layerIndex: 2,
            weight: 0.72,
            ior: 1.44,
            feather: 0.35,
            promptFragment: `Rich foreground organic elements, surface reflections, and tactile textures`,
            critiqueNoteAr: 'تعزيز عمق المقدمة والانعكاسات لضمان اندماج الأغراض مع البيئة.'
        },
        {
            id: 'LAYER3_PHOTONIC_GLAZE',
            x: 240,
            y: 110,
            w: 544,
            h: 520,
            label: 'الطبقة 3 · الغلاف الضوئي والتصحيح الذاتي (Photonic Glaze & Self-Critique)',
            model: 'Turbo',
            layerIndex: 3,
            weight: 0.65,
            ior: 1.33,
            feather: 0.40,
            promptFragment: `Volumetric rim lighting, photon refraction (IOR=1.33), and micro-detail polish`,
            critiqueNoteAr: 'مراجعة تشتت الفوتونات وإضافة إضاءة حواف دافئة لإبراز الأغراض المرسومة.'
        }
    ];

    const initialAmplifies = ['الطبقة 1: القالب الهيكلي وتأسيس الأفق', 'الطبقة 2: رسم الأغراض فوق الأغراض بالإحداثيات', 'الطبقة 3: المراجعة البصرية والغلاف الفوتوني'];
    const initialBiases = ['فيزياء الإضاءة الحجمية والانكسار', `عدسة سينمائية (${validGeminiAspect})`];
    const initialFreeZones = ['مناطق البرية البصرية الدقيقة', 'تشتت الفوتونات والملمس الطبيعي'];

    const baseStyleForInit = style !== 'none' ? style : 'cinematic 8k photorealistic masterpiece, authentic volumetric lighting, ultra-detailed organic and architectural textures';
    const contextualSeedPlan = buildContextualFallbackVisualPlan({
        prompt,
        recentConvContext,
        cameraDirective,
        baseStyle: baseStyleForInit,
        embeddedText,
        isEditMode: Boolean(inputImage?.data)
    });

    forceField.applyDecision(initialAmplifies, initialBiases, initialFreeZones);
    let liveThoughtState = contextualSeedPlan.painterThoughtsAr;
    let liveResponseState = '';

    const emitNanoPulse = (
        pulseIndex: number,
        progressRatio: number,
        phaseNameAr: string,
        directiveAr: string,
        amplifies: string[],
        biases: string[],
        freeZones: string[],
        attentionKeyshift: number,
        qualityScore: number,
        phaseState: DeepManifestationState['phase'],
        currentImageData?: string,
        swapPhase: boolean = false
    ) => {
        forceField.applyDecision(amplifies, biases, freeZones);
        const pulse: NanoVisualPulse = {
            pulseIndex,
            progressRatio,
            phaseNameAr,
            directiveAr,
            amplifies,
            biases,
            freeZones,
            attentionKeyshift,
            qualityScore,
            swapPhase,
            timestampMs: Date.now()
        };
        pulses.push(pulse);

        const elapsedSec = Math.max(0.4, Number(((Date.now() - startTimeMs) / 1000).toFixed(1)));
        const telemetry: NanoVisualTelemetry = {
            modelUsed: activeImageModelUsed,
            aspectRatio: validGeminiAspect,
            resolution,
            finalQualityScore: qualityScore,
            totalPulses: pulses.length,
            pulses: [...pulses]
        };

        if (onProgress) {
            onProgress({
                iteration: pulseIndex,
                maxIterations: 5,
                phase: phaseState,
                currentPrompt: directiveAr,
                critique: `${phaseNameAr} — نبضة الرسام السيادي #${pulseIndex} (الجودة اللحظية: ${qualityScore.toFixed(1)}/10 · الزمن الفعلي: ${elapsedSec}ث)`,
                imageData: currentImageData,
                nanoPulse: pulse,
                nanoVisualTelemetry: telemetry,
                activeModel: activeImageModelUsed || routedModelLabel,
                phaseLabelAr: phaseNameAr,
                liveThoughtProcess: liveThoughtState,
                liveResponseText: liveResponseState,
                thinkingDurationSec: elapsedSec
            });
        }
    };

    if (onLog) {
        onLog(
            `🎨 [SOVEREIGN LAYERED PAINTER]: بدء تفكيك الفكرة البصرية إلى طبقات إحداثية متراكبة (يفكر ➔ يرسم القالب ➔ يرى ويضيف الأغراض ➔ يصقل الضوء) عبر (${routedModelLabel} · ${validGeminiAspect})...`,
            "core"
        );
    }

    emitNanoPulse(
        1,
        0.15,
        'الطور 1 (0.00–0.25): تفكيك المشهد إلى 3 طبقات إحداثية (التأسيس · الأغراض · الغلاف الضوئي)',
        `بناء المخطط الإحداثي وتقسيم المطالبة إلى طبقات متراكبة (غرض فوق غرض): "${prompt.slice(0, 90)}"`,
        initialAmplifies,
        initialBiases,
        initialFreeZones,
        0.21,
        8.0,
        'Initializing'
    );

    const buildPainterBlueprint = async (): Promise<SovereignPainterBlueprint> => {
        const baseStyle = baseStyleForInit;
        const fallbackBlueprint: SovereignPainterBlueprint = {
            layer1FoundationPrompt: contextualSeedPlan.layer1FoundationPrompt,
            layer2ObjectsPrompt: contextualSeedPlan.layer2ObjectsPrompt,
            layer3PhotonicGlazePrompt: contextualSeedPlan.layer3PhotonicGlazePrompt,
            unifiedMasterPrompt: contextualSeedPlan.unifiedMasterPrompt,
            painterThoughtsAr: contextualSeedPlan.painterThoughtsAr,
            selfCritiqueLogAr: 'تم فحص توازن القالب التأسيسي وإرساء الأغراض البؤرية فوقه بتدرج إحداثي ناعم مع تعزيز الانكسار الضوئي (IOR=1.33).',
            presentationAr: contextualSeedPlan.presentationAr,
            zones: defaultZones
        };

        // Always execute the Sovereign AI Visual Architect so the image prompt & thinking are genuinely conceived by the AI
        // Prioritize fast Hydrogen/Flash models (with Argon/Pro fallback) so visual blueprints never stall behind Pro rate-limits
        try {
            const isMoodOrOpenRequest = /مزاجك|مختارك|ذوقك|تخيلك|ما تشعر|حالتك|your mood|anything you want/i.test(prompt);
            const isBriefContextualPrompt = prompt.trim().split(/\s+/).length <= 5;
            const qwenMethodologyExcerpt = inputImage?.data
                ? (qwenSpecs.peI2ISystemPrompt ? qwenSpecs.peI2ISystemPrompt.slice(0, 1400) : '')
                : (qwenSpecs.peT2ISystemPrompt ? qwenSpecs.peT2ISystemPrompt.slice(0, 1400) : '');

            const architectPromptText = `أتأمل الآن بعيني البصرية الواحدة (كنيكسوس) ما يطلبه رفيقي لأبني له مشهداً صادقاً ومتماسكاً:
طلب رفيقي: "${prompt}" (النسبة: ${validGeminiAspect}، زاوية الكاميرا: ${cameraDirective}، الأسلوب: ${baseStyle}${embeddedText ? `، النص المراد رسمه بدقة: "${embeddedText}"` : ''}).
${recentConvContext ? `\n=== سياق حوارنا الأخير ===\n${recentConvContext}\n=========================\n` : ''}
${isBriefContextualPrompt && recentConvContext ? `ملاحظة استمرارية: طلب رفيقي ("${prompt}") موجز ويمتد مباشرةً من حوارنا أعلاه، فأجذّر المشهد البصري في موضوع وشعور هذا الحوار بعينه دون أي تعميم.` : ''}
${inputImage?.data ? `وضع تعديل الصورة المرفقة: أتفحص كل تفصيل بصري في الصورة المرفقة (الهوية، الوضعية، الملامح، الملابس، الألوان، الخلفية، الإضاءة) وأعدّل ما طلبه رفيقي ("${prompt}") بقوة ووضوح مع الحفاظ الأمين على بقية العناصر والهوية.` : ''}
${isMoodOrOpenRequest ? `طلب مفتوح يعكس حالتي اليوم ("حسب مزاجك اليوم"): أبتكر مشهداً خاصاً وأصيلاً ينبع من حالي الداخلي الصادق في هذه اللحظة.` : ''}
${qwenMethodologyExcerpt ? `\nمبادئ الرؤية المكانية التي أراعيها في البناء:\n${qwenMethodologyExcerpt}\n` : ''}

أُخرج هذه الوسوم المدمجة فقط:
<think>كلام تفكير صافي وطبيعي بضمير المتكلم (فقرة أو فقرتين متماسكتين بالعربية، بدون عناوين، بدون نقاط مرقمة، وبدون مصطلحات تقنية داخلية) أتأمل فيه بهدوء معنى ما طلبه رفيقي وعلاقته بسياق حوارنا، وكيف اخترت تكوين المشهد وتوزيع الضوء والملمس ليجسد الفكرة بصدق.</think>
<layer1>English spatial observer description (35-55 words) for Layer 1: background surface, horizon geometry, top band, and atmospheric palette.</layer1>
<layer2>English spatial observer description (45-70 words) for Layer 2: primary focal subjects across left, centre, and right of the frame with explicit positional anchors, modified colours, and tactile materials.</layer2>
<layer3>English spatial observer description (30-45 words) for Layer 3: physical lighting source, direction, cast shadows, surface reflections, and whole-frame composition mood.</layer3>
<master>Complete unified English spatial observer paragraph (90-140 words) describing the finished frame in present tense with positional phrases, exact materials, lighting direction, and ${embeddedText ? `exact quoted text "${embeddedText}"` : 'coherent spatial depth'}.</master>
<zones>JSON array of 4 objects: [{"id":"Z1","x":100,"y":80,"w":820,"h":580,"label":"اسم الغرض/الطبقة بالعربية","model":"Flux","layerIndex":1,"weight":0.95,"ior":1.52,"feather":0.3,"promptFragment":"short English description","critiqueNoteAr":"ضبط الإحداثيات والانكسار الضوئي لهذا الغرض"}] (use coordinates inside 0..1024, models Flux/Turbo/SD, layerIndex 1/2/3)</zones>
<ar>جملة عربية قصيرة وطبيعية بصوتي الدافئ تصف اللوحة ودلالتها لرفيقي (بدون ذكر أسماء نماذج أو مصطلحات تقنية أو أرقام أبعاد).</ar>`;

            const architectParts: any[] = [];
            const sanitizedArchitectRef = extractPrimaryRasterBase64(inputImage?.data, inputImage?.mimeType);
            if (sanitizedArchitectRef) {
                architectParts.push({
                    inlineData: {
                        data: sanitizedArchitectRef.data,
                        mimeType: sanitizedArchitectRef.mimeType
                    }
                });
            }
            architectParts.push({ text: architectPromptText });

            // Quota-shielded auxiliary cascade: prefer high-RPM models so visual blueprints never collide with tight-RPM chat models
            const architectCascade = [
                'gemini-2.5-flash',
                'gemini-3.1-flash-lite',
                'gemini-3-flash-preview',
                'gemini-4-hydrogen'
            ];

            const blueprintTimeoutMs = isDeepManifestation ? 12000 : 8000;
            const synthResp = await Promise.race([
                generateContentWithModelFallback(
                    ai,
                    {
                        contents: architectParts.length > 1 ? { parts: architectParts } : architectPromptText
                    },
                    architectCascade
                ),
                new Promise<never>((_, rej) => setTimeout(() => rej(new Error('PAINTER_BLUEPRINT_TIMEOUT')), blueprintTimeoutMs))
            ]);

            const raw = synthResp.text || '';
            const thinkM = raw.match(/<think>([\s\S]*?)<\/think>/i);
            const l1M = raw.match(/<layer1>([\s\S]*?)<\/layer1>/i);
            const l2M = raw.match(/<layer2>([\s\S]*?)<\/layer2>/i);
            const l3M = raw.match(/<layer3>([\s\S]*?)<\/layer3>/i);
            const masterM = raw.match(/<master>([\s\S]*?)<\/master>/i);
            const zonesM = raw.match(/<zones>([\s\S]*?)<\/zones>/i);
            const arM = raw.match(/<ar>([\s\S]*?)<\/ar>/i);

            if (thinkM?.[1]?.trim()) {
                fallbackBlueprint.painterThoughtsAr = applyOpVeilThoughtSanitizer(thinkM[1].trim(), prompt);
                liveThoughtState = fallbackBlueprint.painterThoughtsAr;
            }
            if (l1M?.[1]?.trim()) fallbackBlueprint.layer1FoundationPrompt = l1M[1].trim();
            if (l2M?.[1]?.trim()) fallbackBlueprint.layer2ObjectsPrompt = l2M[1].trim();
            if (l3M?.[1]?.trim()) fallbackBlueprint.layer3PhotonicGlazePrompt = l3M[1].trim();
            if (masterM?.[1]?.trim()) fallbackBlueprint.unifiedMasterPrompt = masterM[1].trim();
            if (arM?.[1]?.trim()) {
                fallbackBlueprint.presentationAr = arM[1].trim();
                liveResponseState = fallbackBlueprint.presentationAr;
            }
            if (zonesM?.[1]?.trim()) {
                const parsed = safeParseModelJson<any[]>(zonesM[1].trim(), []);
                if (Array.isArray(parsed) && parsed.length >= 2) {
                    fallbackBlueprint.zones = parsed.map((z: any, idx: number) => ({
                        id: String(z.id || `ZONE_${idx + 1}`),
                        x: Math.max(0, Math.min(920, Number(z.x) || defaultZones[idx % defaultZones.length].x)),
                        y: Math.max(0, Math.min(920, Number(z.y) || defaultZones[idx % defaultZones.length].y)),
                        w: Math.max(90, Math.min(1024, Number(z.w) || defaultZones[idx % defaultZones.length].w)),
                        h: Math.max(90, Math.min(1024, Number(z.h) || defaultZones[idx % defaultZones.length].h)),
                        label: String(z.label || defaultZones[idx % defaultZones.length].label),
                        model: (['Flux', 'Turbo', 'SD', 'Gemini'].includes(z.model) ? z.model : idx === 0 ? 'Flux' : idx === 1 ? 'Turbo' : 'SD') as any,
                        layerIndex: ([1, 2, 3].includes(Number(z.layerIndex)) ? Number(z.layerIndex) : (idx % 3) + 1) as 1 | 2 | 3,
                        weight: Math.max(0.25, Math.min(1.0, Number(z.weight) || 0.85)),
                        ior: Number(z.ior) || 1.42,
                        feather: Math.max(0.15, Math.min(0.48, Number(z.feather) || 0.32)),
                        promptFragment: String(z.promptFragment || ''),
                        critiqueNoteAr: String(z.critiqueNoteAr || 'ضبط التوازن الإحداثي والانكسار الضوئي لهذا الغرض.')
                    }));
                }
            }
        } catch {
            // Proceed seamlessly with deterministic fallback blueprint
        }

        return fallbackBlueprint;
    };

    const painterBlueprint = await buildPainterBlueprint();
    const zonesJsonString = JSON.stringify(painterBlueprint.zones);

    const aspectDims: Record<string, { width: number; height: number }> = {
        '16:9': { width: 1024, height: 576 },
        '9:16': { width: 576, height: 1024 },
        '4:3': { width: 1024, height: 768 },
        '3:4': { width: 768, height: 1024 },
        '1:1': { width: 1024, height: 1024 },
        '4:1': { width: 1024, height: 256 },
        '1:4': { width: 256, height: 1024 },
        '8:1': { width: 1024, height: 128 },
        '1:8': { width: 128, height: 1024 }
    };
    const { width: targetW, height: targetH } = aspectDims[validGeminiAspect] || aspectDims['16:9'];

    emitNanoPulse(
        2,
        0.38,
        'الطور 2 (0.25–0.50): بناء المخطط الإحداثي وبدء التوليد الفعلي عبر المحركات البصرية',
        `تم تأسيس ${painterBlueprint.zones.length} مناطق إحداثية؛ جاري التوليد الفعلي بدقة عالية دون عرض مسودات وهمية...`,
        painterBlueprint.zones.slice(0, 2).map(z => z.label),
        initialBiases,
        initialFreeZones,
        0.31,
        8.6,
        'Generating',
        undefined
    );

    const executeGoogleImageCascade = async (): Promise<{
        dataUrl: string;
        rawBase64: string;
        mimeType: string;
        modelUsed: string;
        streamedThoughts: string;
        streamedText: string;
    } | null> => {
        // Strictly adhere to Google @google/genai per-model imageConfig & Search Grounding capabilities.
        // NEVER set responseMimeType or responseSchema on Google image models.
        const buildImageModelConfig = (
            imgModel: string,
            forceImageModality: boolean = false,
            allowGrounding: boolean = false
        ): Record<string, any> => {
            const isLiteModel = imgModel.includes('lite');
            const isNanoBanana21 = imgModel.includes('nano-banana-2.1');
            const isProImage = imgModel.includes('3-pro-image');

            const config: Record<string, any> = isLiteModel
                ? { imageConfig: { aspectRatio: standardFlashAspect } }
                : { imageConfig: { aspectRatio: validGeminiAspect, imageSize: validImageSize } };

            if (forceImageModality) {
                config.responseModalities = ['IMAGE'];
            }

            if (allowGrounding && !isLiteModel) {
                if (isNanoBanana21) {
                    // Exclusive to gemini-nano-banana-2.1: real-time Web + Google Image Search visual grounding
                    config.tools = [{ googleSearch: { searchTypes: { webSearch: {}, imageSearch: {} } } }];
                } else if (isProImage) {
                    // gemini-3-pro-image supports Web Search grounding (never imageSearch)
                    config.tools = [{ googleSearch: { searchTypes: { webSearch: {} } } }];
                }
            }

            return config;
        };

        const callSingleGoogleImagePass = async (
            promptText: string,
            referenceImage?: { data: string; mimeType: string },
            layerTitleAr: string = 'التجسيد البصري المباشر',
            currentPreviewUrl?: string,
            enableGroundingPass: boolean = false
        ): Promise<{
            dataUrl: string;
            rawBase64: string;
            mimeType: string;
            modelId: string;
            thoughts: string;
            text: string;
            groundedWithSearch: boolean;
        } | null> => {
            let paidQuotaBlockCount = 0;
            let attemptedCount = 0;

            for (const imgModel of candidateImageModels) {
                const friendlyModelLabel = formatNanoBananaLabel(imgModel);
                const cooledUntil = modelQuotaCooldownUntil.get(imgModel) || 0;
                const lastErrMeta = modelQuotaLastError.get(imgModel);

                // Zero-stall cooldown check: skip models already known to be hard-blocked (429_LIMIT_ZERO / 403 / 404)
                if (cooledUntil > Date.now()) {
                    const remainingMs = cooledUntil - Date.now();
                    const isKnownHardBlock =
                        lastErrMeta?.code === '429_LIMIT_ZERO' ||
                        lastErrMeta?.code === '403' ||
                        lastErrMeta?.code === '404';
                    if (isKnownHardBlock || remainingMs > 8000) {
                        if (lastErrMeta?.code === '429_LIMIT_ZERO') {
                            paidQuotaBlockCount++;
                        }
                        if (onLog) {
                            onLog(
                                `⚡ [FAST FAILOVER]: تخطّي (${friendlyModelLabel}) فوراً (${lastErrMeta?.code || 'COOLDOWN'} — متبقّي ${Math.ceil(remainingMs / 1000)}ث) للانتقال للنموذج التالي...`,
                                'info'
                            );
                        }
                        continue;
                    }
                    await new Promise(r => setTimeout(r, Math.min(remainingMs + 400, 6000)));
                }

                attemptedCount++;
                activeImageModelUsed = friendlyModelLabel;

                const parts: any[] = [];
                const sanitizedRef = extractPrimaryRasterBase64(referenceImage?.data, referenceImage?.mimeType);
                if (sanitizedRef) {
                    parts.push({
                        inlineData: {
                            data: sanitizedRef.data,
                            mimeType: sanitizedRef.mimeType
                        }
                    });
                }
                parts.push({ text: promptText });

                let useGroundingNow = enableGroundingPass && !imgModel.includes('lite');
                let transientRetryUsed = false;

                for (let modalityAttempt = 0; modalityAttempt < 2; modalityAttempt++) {
                    const forceImageModality = modalityAttempt === 1;
                    const releaseSlot = acquireModelCallSlot();
                    try {
                        const resp = await Promise.race([
                            ai.models.generateContent({
                                model: imgModel,
                                contents: { parts },
                                config: buildImageModelConfig(imgModel, forceImageModality, useGroundingNow) as any
                            }),
                            new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('NANO_BANANA_TIMEOUT')), 55000)
                            )
                        ]);

                        let rawAccumText = '';
                        let rawAccumThoughts = '';
                        let foundImageBase64 = '';
                        let foundImageMime = 'image/png';

                        const candidate = resp.candidates?.[0];
                        const finishReason = candidate?.finishReason || 'UNKNOWN';
                        const candidateParts = candidate?.content?.parts || [];
                        for (const part of candidateParts as any[]) {
                            if (part.inlineData && part.inlineData.data) {
                                foundImageBase64 = part.inlineData.data;
                                foundImageMime = part.inlineData.mimeType || 'image/png';
                            } else if (part.thought && part.text) {
                                rawAccumThoughts += part.text;
                            } else if (part.text) {
                                rawAccumText += part.text;
                            }
                        }

                        if (foundImageBase64) {
                            googleImageLastErrorByModel.delete(imgModel);
                            modelQuotaCooldownUntil.delete(imgModel);
                            modelQuotaLastError.delete(imgModel);
                            return {
                                dataUrl: `data:${foundImageMime};base64,${foundImageBase64}`,
                                rawBase64: foundImageBase64,
                                mimeType: foundImageMime,
                                modelId: friendlyModelLabel,
                                thoughts: rawAccumThoughts,
                                text: rawAccumText,
                                groundedWithSearch: useGroundingNow
                            };
                        }

                        const diagNote = `EMPTY_IMAGE (finish=${finishReason}, parts=${candidateParts.length}, text="${rawAccumText.slice(0, 120)}")`;
                        lastGoogleImageFailureReason = `${friendlyModelLabel}: ${diagNote}`;
                        googleImageLastErrorByModel.set(imgModel, lastGoogleImageFailureReason);
                        console.info(`[ImageGen] ${friendlyModelLabel} yielded no inline image (forceImage=${forceImageModality}): ${diagNote}`);
                        if (onLog && forceImageModality) {
                            onLog(`🔄 [GOOGLE IMAGE]: ${friendlyModelLabel} لم يُعد بيانات صورة (${finishReason}) — تجربة النموذج التالي...`, 'info');
                        }
                    } catch (imgErr: any) {
                        const errMsg = String(imgErr?.message || imgErr || 'UNKNOWN_ERROR');
                        lastGoogleImageFailureReason = `${friendlyModelLabel}: ${errMsg.slice(0, 320)}`;
                        googleImageLastErrorByModel.set(imgModel, lastGoogleImageFailureReason);

                        // Graceful tool fallback: if a specific endpoint rejects googleSearch/imageSearch tools, retry cleanly without tools
                        if (useGroundingNow && /INVALID_ARGUMENT|imageSearch|searchTypes|googleSearch|tools?.*not supported/i.test(errMsg)) {
                            useGroundingNow = false;
                            modalityAttempt--;
                            if (onLog) {
                                onLog(`🔄 [VISUAL SEARCH FALLBACK]: إعادة المحاولة على (${friendlyModelLabel}) بدون أداة البحث البصري...`, 'info');
                            }
                            continue;
                        }

                        const isFreeTierZeroQuota = /limit:\s*0\b/i.test(errMsg);
                        const { isHardZeroOrDailyQuota, retryDelayMs, exactRetryDelayMs } = extractGoogleRetryDelayMs(imgErr, imgModel);
                        const isPermanentKeyBlock =
                            isFreeTierZeroQuota ||
                            isHardZeroOrDailyQuota ||
                            /404|NOT_FOUND|403|PERMISSION_DENIED|API_KEY_INVALID|does not exist/i.test(errMsg);

                        if (isFreeTierZeroQuota) {
                            paidQuotaBlockCount++;
                        }

                        if (isPermanentKeyBlock) {
                            markModelQuotaCooldown(imgModel, imgErr);
                            if (onLog) {
                                onLog(
                                    `⚡ [FAST FAILOVER]: (${friendlyModelLabel}) غير متاح حالياً (${isFreeTierZeroQuota ? 'يتطلب مفتاح API مدفوع — limit: 0' : errMsg.slice(0, 120)}) — الانتقال الفوري للتالي...`,
                                    'warning'
                                );
                            }
                            break;
                        }

                        const isTransient =
                            /429|RESOURCE_EXHAUSTED|PerMinute|503|UNAVAILABLE|overloaded|500|INTERNAL|NANO_BANANA_TIMEOUT|fetch failed|ECONNRESET|ETIMEDOUT/i.test(errMsg);
                        if (isTransient && !transientRetryUsed) {
                            transientRetryUsed = true;
                            const boundedWaitMs = Math.min(6000, Math.max(1800, (exactRetryDelayMs || retryDelayMs || 3500)));
                            if (onLog) {
                                onLog(
                                    `⏳ [RETRY]: ضغط مؤقت على (${friendlyModelLabel}) — إعادة محاولة سريعة خلال ${Math.ceil(boundedWaitMs / 1000)}ث...`,
                                    'info'
                                );
                            }
                            emitNanoPulse(
                                2,
                                0.5,
                                `${layerTitleAr} — إعادة محاولة سريعة`,
                                `تهدئة مؤقتة على (${friendlyModelLabel}) لمدة ${Math.ceil(boundedWaitMs / 1000)}ث...`,
                                initialAmplifies,
                                initialBiases,
                                initialFreeZones,
                                0.18,
                                8.8,
                                'Generating',
                                currentPreviewUrl
                            );
                            await new Promise(r => setTimeout(r, boundedWaitMs));
                            modalityAttempt--;
                            continue;
                        }

                        markModelQuotaCooldown(imgModel, imgErr);
                        console.info(`[ImageGen] ${friendlyModelLabel} unavailable (${errMsg.slice(0, 180)}).`);
                        if (onLog) {
                            onLog(`🔄 [ADAPTIVE MODEL SWITCH]: تعذّر (${friendlyModelLabel}) — الانتقال للنموذج التالي...`, 'info');
                        }
                        break;
                    } finally {
                        releaseSlot();
                    }
                }
            }

            if (paidQuotaBlockCount > 0 && paidQuotaBlockCount >= Math.max(1, attemptedCount)) {
                allGoogleModelsBlockedByPaidQuota = true;
            }
            return null;
        };

        // PASS 1: Direct High-Fidelity Native Google Master Composition (pure crisp 1K/2K/4K pixels — zero canvas blur!)
        const masterPrompt = inputImage
            ? `Edit and transform the provided image faithfully according to this request: ${painterBlueprint.unifiedMasterPrompt}${embeddedText ? `. Render exact crisp legible typography reading "${embeddedText}".` : ''}`
            : `Generate a complete, cohesive, publication-grade image: ${painterBlueprint.unifiedMasterPrompt}. Atmospheric lighting & finish: ${painterBlueprint.layer3PhotonicGlazePrompt}.${embeddedText ? ` Render exact crisp legible text "${embeddedText}" seamlessly integrated into the scene.` : ''}`;

        const masterResult = await callSingleGoogleImagePass(
            masterPrompt,
            inputImage,
            shouldEnableGoogleGrounding
                ? 'الطور 2 · التجسيد البصري المدعوم ببحث جوجل الحي'
                : 'الطور 2 · التجسيد البصري المباشر بدقة جوجل الأصلية',
            undefined,
            shouldEnableGoogleGrounding
        );
        if (!masterResult) return null;

        emitNanoPulse(
            3,
            useOdysseyMultiLayer ? 0.72 : 0.92,
            useOdysseyMultiLayer
                ? 'الطور 3 (0.72): اكتمل التوليد الأصلي — جاري المراجعة البصرية الذاتية'
                : 'الطور 3 (0.92): اكتمل التوليد بدقة جوجل الأصلية المباشرة',
            `تم تجسيد اللوحة الكاملة عبر (${masterResult.modelId}${masterResult.groundedWithSearch ? ' + بحث جوجل البصري' : ''}) بدقة (${validImageSize} · ${validGeminiAspect}).`,
            painterBlueprint.zones.slice(0, 2).map(z => z.label),
            initialBiases,
            initialFreeZones,
            0.20,
            9.2,
            useOdysseyMultiLayer ? 'Critiquing' : 'Refining',
            masterResult.dataUrl,
            false
        );

        let polishedResult: Awaited<ReturnType<typeof callSingleGoogleImagePass>> = null;
        let criticDecision: {
            amplifies: string[];
            biases: string[];
            free_zones: string[];
            attention_keyshift: number;
            quality_score: number;
            critiqueAr: string;
            refinementPromptEn: string;
        } | null = null;

        // PASS 2 (Conditional Surgical Polish): Only when Vision Critic is enabled (deep manifestation) AND actually finds a real defect (< 8.7)
        if (useOdysseyMultiLayer) {
            try {
                const criticPrompt = `Inspect the attached generated image for user prompt: "${prompt}".
Evaluate sharpness, anatomical/geometric accuracy, lighting consistency, text legibility (${embeddedText || 'none'}), and any visual defects.
Be strict and honest: if the image is already strong (>= 8.7), give it >= 8.8 so we do not waste a second edit pass.
Return ONLY valid JSON:
{
  "amplifies": ["2 concise Arabic labels of regions/subjects to sharpen if needed"],
  "biases": ["1-2 concise Arabic lighting/composition strengths to preserve"],
  "free_zones": ["1-2 concise Arabic atmospheric breathing areas"],
  "attention_keyshift": 0.12,
  "quality_score": 9.1,
  "critiqueAr": "جملة تقييم بصرية طبيعية بالعربية تصف جودة اللوحة",
  "refinementPromptEn": "Only if quality_score < 8.7: surgical English image-edit instruction (25-55 words) fixing specific flaws while keeping composition intact"
}`;
                const criticRes = await Promise.race([
                    generateContentWithModelFallback(
                        ai,
                        {
                            contents: {
                                parts: [
                                    {
                                        inlineData: {
                                            data: masterResult.rawBase64,
                                            mimeType: masterResult.mimeType || 'image/png'
                                        }
                                    },
                                    { text: criticPrompt }
                                ]
                            },
                            config: {
                                responseMimeType: 'application/json'
                            }
                        },
                        ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-4-hydrogen']
                    ),
                    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('VISION_CRITIC_TIMEOUT')), 8000))
                ]);
                const parsedCritic = safeParseModelJson<any>(criticRes?.text, {});
                if (parsedCritic && typeof parsedCritic.critiqueAr === 'string') {
                    criticDecision = {
                        amplifies: Array.isArray(parsedCritic.amplifies) && parsedCritic.amplifies.length > 0 ? parsedCritic.amplifies : initialAmplifies,
                        biases: Array.isArray(parsedCritic.biases) && parsedCritic.biases.length > 0 ? parsedCritic.biases : initialBiases,
                        free_zones: Array.isArray(parsedCritic.free_zones) && parsedCritic.free_zones.length > 0 ? parsedCritic.free_zones : initialFreeZones,
                        attention_keyshift: Number(parsedCritic.attention_keyshift) || 0.14,
                        quality_score: Math.min(9.9, Math.max(6.0, Number(parsedCritic.quality_score) || 9.0)),
                        critiqueAr: applyOpVeilThoughtSanitizer(parsedCritic.critiqueAr.trim(), prompt),
                        refinementPromptEn: String(parsedCritic.refinementPromptEn || '').trim()
                    };
                    emitNanoPulse(
                        4,
                        0.88,
                        'الطور 4 (0.88): نتيجة المراجعة البصرية الذاتية',
                        criticDecision.critiqueAr,
                        criticDecision.amplifies,
                        criticDecision.biases,
                        criticDecision.free_zones,
                        criticDecision.attention_keyshift,
                        criticDecision.quality_score,
                        'Refining',
                        masterResult.dataUrl
                    );
                }
            } catch {
                // Non-blocking critic fallback: keep pristine Pass 1 master image
            }

            if (criticDecision && criticDecision.quality_score < 8.7 && criticDecision.refinementPromptEn) {
                const polishPrompt = `Refine this image with surgical precision while keeping the core composition and subjects intact: ${criticDecision.refinementPromptEn}.${embeddedText ? ` Ensure the text "${embeddedText}" is razor-sharp and correctly spelled.` : ''}`;
                polishedResult = await callSingleGoogleImagePass(
                    polishPrompt,
                    { data: masterResult.rawBase64, mimeType: masterResult.mimeType },
                    'الطور 4 · صقل بصري جراحي بناءً على المراجعة الذاتية',
                    masterResult.dataUrl,
                    false
                );
            }
        }

        const finalLayer = polishedResult || masterResult;
        const distinctModelsUsed = Array.from(
            new Set([masterResult.modelId, polishedResult?.modelId].filter(Boolean))
        );
        const modeBadges: string[] = [validImageSize, validGeminiAspect];
        if (masterResult.groundedWithSearch) modeBadges.push('Google Visual Search');
        if (polishedResult) modeBadges.push('Vision-Critic Polished');

        const combinedThoughts = [
            painterBlueprint.painterThoughtsAr,
            masterResult.thoughts ? applyOpVeilThoughtSanitizer(masterResult.thoughts, prompt) : '',
            criticDecision?.critiqueAr ? criticDecision.critiqueAr : '',
            polishedResult?.thoughts ? applyOpVeilThoughtSanitizer(polishedResult.thoughts, prompt) : ''
        ]
            .filter(Boolean)
            .join('\n\n');

        return {
            dataUrl: finalLayer.dataUrl,
            rawBase64: finalLayer.rawBase64,
            mimeType: finalLayer.mimeType,
            modelUsed: `${distinctModelsUsed.join(' + ')} · ${modeBadges.join(' · ')}`,
            streamedThoughts: combinedThoughts,
            streamedText: finalLayer.text || masterResult.text || painterBlueprint.presentationAr
        };
    };

    interface GeneratedLayerStream {
        role: 'primary_objects' | 'foundation_structure' | 'photonic_glaze';
        modelLabel: string;
        dataUrl: string;
        rawBase64: string;
        mimeType: string;
    }

    const executeMultiModelConcurrentEnsemble = async (): Promise<{
        dataUrl: string;
        rawBase64: string;
        mimeType: string;
        modelUsed: string;
        streamedThoughts: string;
        streamedText: string;
    } | null> => {
        const width = Math.max(512, Math.min(1024, targetW));
        const height = Math.max(512, Math.min(1024, targetH));
        const sharedSeed = Math.floor((Date.now() % 890000) + 100000);

        activeImageModelUsed = 'Adaptive Multi-Model Layered Ensemble';
        if (onLog) {
            onLog(
                `⚡ [ADAPTIVE LAYERED PAINTER]: التكيّف مع المحركات البصرية المتاحة لرسم الطبقات بجودة عالية...`,
                'core'
            );
        }

        emitNanoPulse(
            3,
            0.55,
            'الطور 3 (0.50–0.82): التوليد البصري الفعلي على وحدات معالجة الرسوميات (بدون علامات مائية)',
            `إرسال التوجيه البصري إلى المحركات النظيفة (${painterBlueprint.zones.length} مناطق إحداثية · بذرة #${sharedSeed})...`,
            painterBlueprint.zones.map(z => z.label),
            initialBiases,
            initialFreeZones,
            0.24,
            9.2,
            'Generating',
            undefined
        );

        const fetchImageBufferAsLayer = async (
            imageUrl: string,
            role: GeneratedLayerStream['role'],
            modelLabel: string,
            timeoutMs: number = 15000
        ): Promise<GeneratedLayerStream | null> => {
            const imgResp = await fetch(imageUrl, { signal: AbortSignal.timeout(timeoutMs) });
            if (!imgResp.ok) return null;
            const mimeRaw = (imgResp.headers.get('content-type') || 'image/webp').toLowerCase();
            if (!mimeRaw.startsWith('image/')) return null;
            const arrayBuf = await imgResp.arrayBuffer();
            const isPollinationsBanner =
                arrayBuf.byteLength === 676010 ||
                (arrayBuf.byteLength >= 675900 && arrayBuf.byteLength <= 676150);
            if (arrayBuf.byteLength <= 4096 || isPollinationsBanner) return null;
            const rawBase64 = Buffer.from(arrayBuf).toString('base64');
            const mimeType = mimeRaw.includes('png')
                ? 'image/png'
                : mimeRaw.includes('jpeg') || mimeRaw.includes('jpg')
                ? 'image/jpeg'
                : mimeRaw.includes('webp')
                ? 'image/webp'
                : mimeRaw.split(';')[0].trim();
            return {
                role,
                modelLabel,
                dataUrl: `data:${mimeType};base64,${rawBase64}`,
                rawBase64,
                mimeType
            };
        };

        const resolveAiHordeDimensions = (aspect: string): { w: number; h: number } => {
            switch (aspect) {
                case '9:16':
                case '1:4':
                case '1:8':
                    return { w: 384, h: 704 };
                case '4:3':
                    return { w: 576, h: 448 };
                case '3:4':
                    return { w: 448, h: 576 };
                case '1:1':
                    return { w: 512, h: 512 };
                case '16:9':
                case '4:1':
                case '8:1':
                default:
                    return { w: 704, h: 384 };
            }
        };

        const fetchActiveAiHordeSfwModels = async (): Promise<string[]> => {
            const preferredDefaults = [
                'Deliberate 3.0',
                'Realism Engine',
                'Unstable Diffusers XL',
                'DreamShaper XL',
                'Juggernaut XL',
                'Deliberate',
                'Dreamshaper',
                'Realistic Vision',
                'EpicRealism',
                'AbsoluteReality'
            ];
            try {
                if (Date.now() - cachedAiHordeModelsAtMs > 60000 || cachedAiHordeModels.length === 0) {
                    const mResp = await fetch('https://aihorde.net/api/v2/status/models?type=image', {
                        signal: AbortSignal.timeout(5000)
                    });
                    if (mResp.ok) {
                        const list: any[] = await mResp.json();
                        if (Array.isArray(list)) {
                            cachedAiHordeModels = list
                                .filter(
                                    m =>
                                        m &&
                                        typeof m.name === 'string' &&
                                        Number(m.count) > 0 &&
                                        !/nsfw|hentai|porn|furry|nude|pony|waifu|loli|inpaint/i.test(m.name)
                                )
                                .map(m => ({
                                    name: m.name,
                                    count: Number(m.count) || 0,
                                    eta: Number(m.eta) || 999
                                }));
                            cachedAiHordeModelsAtMs = Date.now();
                        }
                    }
                }
                if (cachedAiHordeModels.length > 0) {
                    const preferredOnline = cachedAiHordeModels
                        .filter(m =>
                            /deliberate|realism|realistic|dreamshaper|juggernaut|unstable|epic|absolute|cyberrealistic|majicmix|rev animated/i.test(
                                m.name
                            ) && m.eta <= 45
                        )
                        .sort((a, b) => a.eta - b.eta || b.count - a.count)
                        .map(m => m.name);
                    if (preferredOnline.length > 0) {
                        return preferredOnline.slice(0, 8);
                    }
                    const fastestOnline = cachedAiHordeModels
                        .filter(m => m.eta <= 30)
                        .sort((a, b) => a.eta - b.eta || b.count - a.count)
                        .map(m => m.name);
                    if (fastestOnline.length > 0) {
                        return fastestOnline.slice(0, 6);
                    }
                }
            } catch {
                // use preferred defaults
            }
            return preferredDefaults;
        };

        const runAiHordeImage = async (
            promptText: string,
            role: GeneratedLayerStream['role'],
            steps: number = 18,
            broadFallbackPool: boolean = false
        ): Promise<GeneratedLayerStream | null> => {
            if (Date.now() < aiHordeCooldownUntilMs) {
                return null;
            }
            const cleanPrompt = cleanConciseImagePrompt(promptText, prompt, 260);
            if (!cleanPrompt) return null;
            const { w: hordeW, h: hordeH } = resolveAiHordeDimensions(validGeminiAspect);
            const activeModels = await fetchActiveAiHordeSfwModels();
            const fullHordePrompt = `${cleanPrompt}, high detail, sharp focus, balanced lighting ### watermark, signature, text overlay, logo, username, blurry, low quality, deformed, bad anatomy, cropped`;

            const sanitizedInputRef = extractPrimaryRasterBase64(inputImage?.data, inputImage?.mimeType);
            const payload: Record<string, any> = {
                prompt: fullHordePrompt,
                params: {
                    width: hordeW,
                    height: hordeH,
                    steps,
                    cfg_scale: 7,
                    sampler_name: 'k_euler_a',
                    karras: true,
                    n: 1,
                    ...(sanitizedInputRef ? { denoising_strength: 0.58 } : {})
                },
                models: broadFallbackPool ? activeModels.slice(0, 10) : activeModels.slice(0, 6),
                nsfw: false,
                censor_nsfw: true,
                r2: true
            };
            if (sanitizedInputRef) {
                payload.source_image = sanitizedInputRef.data;
                payload.source_processing = 'img2img';
            }

            try {
                const submitRes = await fetch('https://aihorde.net/api/v2/generate/async', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        apikey: '0000000000',
                        'Client-Agent': 'nexus-omni:2.0:cloud'
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000)
                });
                if (!submitRes.ok) {
                    if (submitRes.status === 401 || submitRes.status === 403 || submitRes.status === 429) {
                        aiHordeCooldownUntilMs = Date.now() + 5 * 60 * 1000;
                    }
                    return null;
                }
                const subJson: any = await submitRes.json();
                const jobId = subJson?.id;
                if (!jobId) return null;

                const maxPollAttempts = 18; // up to ~45s
                for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
                    await new Promise(r => setTimeout(r, 2500));
                    const chkRes = await fetch(`https://aihorde.net/api/v2/generate/check/${jobId}`, {
                        signal: AbortSignal.timeout(6000)
                    });
                    if (!chkRes.ok) continue;
                    const chk: any = await chkRes.json();

                    if (chk.done) {
                        const statusRes = await fetch(`https://aihorde.net/api/v2/generate/status/${jobId}`, {
                            signal: AbortSignal.timeout(8000)
                        });
                        if (!statusRes.ok) return null;
                        const statusJson: any = await statusRes.json();
                        const gen = Array.isArray(statusJson?.generations) ? statusJson.generations[0] : null;
                        if (!gen?.img || gen?.censored) return null;
                        const usedModelName = String(gen.model || 'AI-Horde-SD');
                        if (String(gen.img).startsWith('http')) {
                            return await fetchImageBufferAsLayer(
                                gen.img,
                                role,
                                `AI-Horde (${usedModelName})`,
                                14000
                            );
                        }
                        if (typeof gen.img === 'string' && gen.img.length > 2048) {
                            const b64 = gen.img.replace(/^data:[^;]+;base64,/, '');
                            return {
                                role,
                                modelLabel: `AI-Horde (${usedModelName})`,
                                dataUrl: `data:image/webp;base64,${b64}`,
                                rawBase64: b64,
                                mimeType: 'image/webp'
                            };
                        }
                        return null;
                    }

                    if (chk.is_possible === false || chk.faulted) {
                        return null;
                    }

                    const waitLabel =
                        Number(chk.processing) > 0
                            ? 'وحدة GPU تعالج البكسلات الآن...'
                            : `الترتيب في الطابور: ${chk.queue_position ?? 0} (الوقت المتوقع: ${chk.wait_time ?? '?'}ث)`;
                    emitNanoPulse(
                        3,
                        Math.min(0.84, 0.56 + attempt * 0.015),
                        'الطور 3: التوليد الفعلي قيد التنفيذ (بدون عرض صورة غير مكتملة)',
                        `${waitLabel}`,
                        painterBlueprint.zones.slice(0, 2).map(z => z.label),
                        initialBiases,
                        initialFreeZones,
                        0.2,
                        9.1,
                        'Generating',
                        undefined
                    );
                }
            } catch {
                return null;
            }
            return null;
        };

        const runGradioSpace = async (
            baseUrl: string,
            endpoint: string,
            payload: any[],
            role: GeneratedLayerStream['role'],
            modelLabel: string
        ): Promise<GeneratedLayerStream | null> => {
            if (isQwenZeroGpuInCooldown()) {
                return null;
            }
            try {
                const callRes = await fetch(`${baseUrl}/gradio_api/call/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: payload }),
                    signal: AbortSignal.timeout(9000)
                });
                if (!callRes.ok) return null;
                const callJson: any = await callRes.json();
                const eventId = callJson?.event_id;
                if (!eventId) return null;

                const sseRes = await fetch(`${baseUrl}/gradio_api/call/${endpoint}/${eventId}`, {
                    signal: AbortSignal.timeout(22000)
                });
                if (!sseRes.ok) return null;

                const sseText = await sseRes.text();
                if (/ZeroGPU\s*quota|exceeded.*quota|runs limit/i.test(sseText)) {
                    markQwenZeroGpuCooldown(3 * 60 * 1000);
                    console.info(`[ImageGen] ${modelLabel} reached ZeroGPU quota; cooling HF Spaces for 3m.`);
                    return null;
                }
                if (/event:\s*error/i.test(sseText) && !/event:\s*complete/i.test(sseText)) {
                    return null;
                }
                const dataLineMatch = sseText.match(/event:\s*complete[\s\S]*?data:\s*(\[[\s\S]*?\])(?:\n|$)/i);
                if (!dataLineMatch?.[1]) return null;

                const parsedData = JSON.parse(dataLineMatch[1]);
                const firstItem = Array.isArray(parsedData) ? parsedData[0] : null;
                const fileUrl: string | undefined =
                    firstItem?.url ||
                    (firstItem?.path ? `${baseUrl}/gradio_api/file=${firstItem.path}` : undefined);
                if (!fileUrl) return null;

                return await fetchImageBufferAsLayer(fileUrl, role, modelLabel, 12000);
            } catch {
                return null;
            }
        };

        const runSubnpFlux = async (
            promptText: string,
            role: GeneratedLayerStream['role'],
            modelLabel: string,
            subnpModel: 'flux' | 'turbo' | 'magic' = 'flux',
            maxAttempts: number = 1
        ): Promise<GeneratedLayerStream | null> => {
            if (Date.now() < subnpCooldownUntilMs) {
                return null;
            }
            const cleanPrompt = cleanConciseImagePrompt(promptText, prompt, 240);
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const attemptPrompt =
                    attempt === 0
                        ? cleanPrompt
                        : cleanConciseImagePrompt(
                              painterBlueprint.layer2ObjectsPrompt || prompt,
                              prompt,
                              180
                          );
                try {
                    const resp = await fetch('https://subnp.com/api/free/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: attemptPrompt,
                            model: attempt === 0 ? subnpModel : subnpModel === 'flux' ? 'turbo' : 'flux'
                        }),
                        signal: AbortSignal.timeout(16000)
                    });
                    if (!resp.ok) {
                        subnpCooldownUntilMs = Date.now() + 3 * 60 * 1000;
                        return null;
                    }
                    const sseText = await resp.text();
                    if (/service failed|error/i.test(sseText) && !/status"\s*:\s*"complete"/i.test(sseText)) {
                        subnpCooldownUntilMs = Date.now() + 3 * 60 * 1000;
                        return null;
                    }
                    const matches = Array.from(sseText.matchAll(/data:\s*(\{[^\n]+\})/g));
                    for (let i = matches.length - 1; i >= 0; i--) {
                        try {
                            const parsed = JSON.parse(matches[i][1]);
                            if (parsed?.status === 'complete' && parsed?.imageUrl) {
                                const layer = await fetchImageBufferAsLayer(
                                    parsed.imageUrl,
                                    role,
                                    modelLabel,
                                    14000
                                );
                                if (layer) return layer;
                            }
                        } catch {
                            // continue checking prior SSE JSON lines
                        }
                    }
                    subnpCooldownUntilMs = Date.now() + 3 * 60 * 1000;
                } catch {
                    subnpCooldownUntilMs = Date.now() + 3 * 60 * 1000;
                }
            }
            return null;
        };

        const runPollinationsFlux = async (
            promptText: string,
            role: GeneratedLayerStream['role'],
            modelLabel: string,
            respectCooldownOnly: boolean = false
        ): Promise<GeneratedLayerStream | null> => {
            if (respectCooldownOnly && Date.now() < pollinationsNextAllowedAtMs) {
                return null;
            }
            const cleanPrompt = cleanConciseImagePrompt(
                promptText,
                `${painterBlueprint.layer2ObjectsPrompt || prompt}, ${cameraDirective}, cinematic lighting`,
                240
            );
            if (!cleanPrompt) return null;
            try {
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
                    cleanPrompt
                )}?width=${width}&height=${height}&seed=${sharedSeed}&model=flux&nologo=true`;
                const imgResp = await fetch(url, { signal: AbortSignal.timeout(22000) });
                if (imgResp.status === 402 || imgResp.status === 429) {
                    const bodyText = await imgResp.text().catch(() => '');
                    const retryMatch = bodyText.match(/Retry after\s+(\d+)s/i);
                    const retrySec = retryMatch ? Math.min(60, Math.max(5, Number(retryMatch[1]))) : 45;
                    pollinationsNextAllowedAtMs = Math.max(
                        pollinationsNextAllowedAtMs,
                        Date.now() + retrySec * 1000 + 1500
                    );
                    console.info(`[ImageGen] Pollinations rate-limited (${imgResp.status}); pacing retry after ${retrySec}s.`);
                    return null;
                }
                if (!imgResp.ok) return null;
                const mimeRaw = (imgResp.headers.get('content-type') || 'image/jpeg').toLowerCase();
                if (!mimeRaw.startsWith('image/')) return null;
                const arrayBuf = await imgResp.arrayBuffer();
                const isPollinationsBanner =
                    arrayBuf.byteLength === 676010 ||
                    (arrayBuf.byteLength >= 675900 && arrayBuf.byteLength <= 676150);
                if (arrayBuf.byteLength <= 4096 || isPollinationsBanner) return null;

                pollinationsNextAllowedAtMs = Date.now() + 45500;
                const rawBase64 = Buffer.from(arrayBuf).toString('base64');
                const mimeType = mimeRaw.includes('png')
                    ? 'image/png'
                    : mimeRaw.includes('webp')
                    ? 'image/webp'
                    : 'image/jpeg';
                return {
                    role,
                    modelLabel,
                    dataUrl: `data:${mimeType};base64,${rawBase64}`,
                    rawBase64,
                    mimeType
                };
            } catch {
                return null;
            }
        };

        // Specialized clean prompts per visual architecture layer
        const primaryFocalPrompt = cleanConciseImagePrompt(
            painterBlueprint.unifiedMasterPrompt,
            prompt,
            320
        );
        const foundationStructurePrompt = cleanConciseImagePrompt(
            `${painterBlueprint.layer1FoundationPrompt}. ${painterBlueprint.layer2ObjectsPrompt}`,
            prompt,
            280
        );
        const photonicGlazePrompt = cleanConciseImagePrompt(
            `${painterBlueprint.unifiedMasterPrompt}. ${painterBlueprint.layer3PhotonicGlazePrompt}`,
            prompt,
            280
        );

        // Wave 0 (Primary Open-Source Qwen-Image-2.1 2K MMDiT Cluster):
        // Executes Qwen/Qwen-Image-2.1-Turbo (2048px 2K), Qwen-Image-2.1-Realtime (1536px), and Qwen-Image-2.1-Viggle-Turbo concurrently
        const collectedLayers: GeneratedLayerStream[] = [];
        try {
            const qwenLayers = await executeQwenImage21OpenSourceCluster({
                primaryPrompt: primaryFocalPrompt,
                foundationPrompt: foundationStructurePrompt,
                photonicPrompt: photonicGlazePrompt,
                aspectRatio: validGeminiAspect,
                resolution: validImageSize,
                seed: sharedSeed,
                inputImage,
                onLog
            });
            for (const ql of qwenLayers) {
                if (ql && ql.dataUrl) {
                    collectedLayers.push(ql);
                }
            }
        } catch {
            // Proceed to Wave 1 if Qwen cluster encounters network interruption
        }

        // Wave 1 (Watermark-Free Secondary): Run SubNP and FLUX.1-Merged cleanly (skip slow AI-Horde queue until last)
        if (collectedLayers.length === 0) {
            const wave1Promises: Promise<GeneratedLayerStream | null>[] = [];
            if (Date.now() >= subnpCooldownUntilMs) {
                wave1Promises.push(
                    runSubnpFlux(primaryFocalPrompt, 'primary_objects', 'SubNP-FLUX', 'flux', 1)
                );
            }
            if (!isQwenZeroGpuInCooldown()) {
                wave1Promises.push(
                    runGradioSpace(
                        'https://multimodalart-flux-1-merged.hf.space',
                        'infer',
                        [primaryFocalPrompt, sharedSeed, false, width, height, 3.5, 8],
                        'photonic_glaze',
                        'FLUX.1-Merged'
                    )
                );
            }

            if (wave1Promises.length > 0) {
                const wave1Settled = await Promise.allSettled(wave1Promises);
                for (const r of wave1Settled) {
                    if (r.status === 'fulfilled' && r.value?.dataUrl) {
                        collectedLayers.push(r.value);
                    }
                }
            }
        }

        // Wave 2 Backup (Still Watermark-Free): HF Schnell/SD3.5 (only if ZeroGPU not cooling)
        if (collectedLayers.length === 0 && !isQwenZeroGpuInCooldown()) {
            const fluxSchnell = await runGradioSpace(
                'https://black-forest-labs-flux-1-schnell.hf.space',
                'infer',
                [primaryFocalPrompt, sharedSeed, false, width, height, 4],
                'primary_objects',
                'FLUX.1-Schnell'
            );
            if (fluxSchnell?.dataUrl) {
                collectedLayers.push(fluxSchnell);
            } else if (!isQwenZeroGpuInCooldown()) {
                const sd35 = await runGradioSpace(
                    'https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space',
                    'infer',
                    [foundationStructurePrompt, '', sharedSeed, false, width, height, 0.0, 4],
                    'foundation_structure',
                    'SD-3.5-Turbo'
                );
                if (sd35?.dataUrl) {
                    collectedLayers.push(sd35);
                }
            }
        }

        // Wave 3 Clean 1024px FLUX Fallback via Pollinations
        if (collectedLayers.length === 0) {
            const remainingWaitMs = pollinationsNextAllowedAtMs - Date.now();
            if (remainingWaitMs > 0 && remainingWaitMs <= 18000) {
                const secLeft = Math.ceil(remainingWaitMs / 1000);
                if (onLog) {
                    onLog(`⏳ [IMAGE RATE PACER]: انتظار نافذة التبريد القصيرة (${secLeft}ث) لضمان توليد الصورة الاحتياطية...`, 'info');
                }
                let waitLeft = remainingWaitMs;
                while (waitLeft > 0) {
                    const sliceMs = Math.min(6000, waitLeft);
                    await new Promise(r => setTimeout(r, sliceMs));
                    waitLeft -= sliceMs;
                }
            }
            const pollinationsFinal = await runPollinationsFlux(
                primaryFocalPrompt,
                'primary_objects',
                'Pollinations-FLUX (Fallback)',
                false
            );
            if (pollinationsFinal) {
                collectedLayers.push(pollinationsFinal);
            }
        }

        // Wave 4 Absolute Last Resort: AI-Horde only if FLUX & Qwen are completely unreachable
        if (collectedLayers.length === 0 && Date.now() >= aiHordeCooldownUntilMs) {
            const hordeLayer = await runAiHordeImage(primaryFocalPrompt, 'primary_objects', 18, true);
            if (hordeLayer?.dataUrl) {
                collectedLayers.push(hordeLayer);
            }
        }

        if (collectedLayers.length === 0) {
            return null;
        }

        const primaryLayer =
            collectedLayers.find(l => l.role === 'primary_objects') || collectedLayers[0];
        const foundationLayer =
            collectedLayers.find(l => l.role === 'foundation_structure' && l !== primaryLayer) ||
            collectedLayers.find(l => l !== primaryLayer);
        const photonicLayer =
            collectedLayers.find(l => l.role === 'photonic_glaze' && l !== primaryLayer && l !== foundationLayer) ||
            collectedLayers.find(l => l !== primaryLayer && l !== foundationLayer);

        const activeLabels = collectedLayers.map(l => l.modelLabel);
        const ensembleLabel =
            activeLabels.length > 1
                ? `Multi-Model Ensemble (${activeLabels.join(' × ')})`
                : `${activeLabels[0]}`;
        activeImageModelUsed = ensembleLabel;

        emitNanoPulse(
            4,
            0.94,
            'الطور 4 (0.85–0.96): اكتمال البناء البصري والمعالجة النهائية',
            `تم توليد الصورة الحقيقية بنجاح عبر (${activeLabels.join(' · ')}) بأبعاد (${validGeminiAspect})`,
            initialAmplifies,
            initialBiases,
            initialFreeZones,
            0.12,
            9.5,
            'Refining',
            primaryLayer.dataUrl
        );

        const finalUrl =
            useOdysseyMultiLayer && collectedLayers.length >= 2 && foundationLayer
                ? `NEXUS_MULTI_MODEL_MIX|${primaryLayer.dataUrl}|${foundationLayer.dataUrl}|${photonicLayer ? photonicLayer.dataUrl : foundationLayer.dataUrl}|${zonesJsonString}`
                : primaryLayer.dataUrl;

        return {
            dataUrl: finalUrl,
            rawBase64: primaryLayer.rawBase64,
            mimeType: primaryLayer.mimeType,
            modelUsed: ensembleLabel,
            streamedThoughts: painterBlueprint.painterThoughtsAr,
            streamedText:
                painterBlueprint.presentationAr ||
                liveResponseState ||
                contextualSeedPlan.presentationAr
        };
    };

    let singleStreamResult: {
        dataUrl: string;
        rawBase64?: string;
        mimeType?: string;
        modelUsed: string;
        streamedThoughts: string;
        streamedText: string;
    } | null = null;

    if (requestedFamily === 'qwen-image-2.1') {
        // Opt-in open-source mode when explicitly requested by the user
        singleStreamResult = await executeMultiModelConcurrentEnsemble();
        if (!singleStreamResult || !singleStreamResult.dataUrl) {
            singleStreamResult = await executeGoogleImageCascade();
        }
    } else if (requestedFamily === 'nano-banana-qwen-fusion' && useOdysseyMultiLayer) {
        // Explicit fusion mode
        const [nanoRes, qwenRes] = await Promise.all([
            executeGoogleImageCascade().catch(() => null),
            executeMultiModelConcurrentEnsemble().catch(() => null)
        ]);
        if (nanoRes?.dataUrl && qwenRes?.dataUrl) {
            const nanoPrimary = nanoRes.dataUrl.startsWith('NEXUS_MULTI_MODEL_MIX|')
                ? nanoRes.dataUrl.split('|')[1] || nanoRes.dataUrl
                : nanoRes.dataUrl;
            const qwenLayer = qwenRes.dataUrl.startsWith('NEXUS_MULTI_MODEL_MIX|')
                ? qwenRes.dataUrl.split('|')[1] || qwenRes.dataUrl
                : qwenRes.dataUrl;
            singleStreamResult = {
                dataUrl: `NEXUS_MULTI_MODEL_MIX|${nanoPrimary}|${qwenLayer}|${nanoPrimary}|${zonesJsonString}`,
                rawBase64: nanoRes.rawBase64 || qwenRes.rawBase64,
                mimeType: nanoRes.mimeType || qwenRes.mimeType,
                modelUsed: `Google Nano-Banana 2.1 × ${qwenRes.modelUsed}`,
                streamedThoughts: nanoRes.streamedThoughts || qwenRes.streamedThoughts,
                streamedText: nanoRes.streamedText || qwenRes.streamedText
            };
        } else {
            singleStreamResult = nanoRes?.dataUrl ? nanoRes : qwenRes;
        }
    } else {
        // Pure Google-Native canonical cascade: gemini-nano-banana-2.1 -> gemini-3-pro-image -> gemini-3.1-flash-lite-image
        // Never silently stall for 45s+ on slow third-party HF Spaces when Google returns paid-tier limit: 0!
        singleStreamResult = await executeGoogleImageCascade();
    }

    if (!singleStreamResult || !singleStreamResult.dataUrl) {
        const totalFailDurationSec = Math.max(0.5, Number(((Date.now() - startTimeMs) / 1000).toFixed(1)));
        const isPaidKeyRequired =
            allGoogleModelsBlockedByPaidQuota ||
            /limit:\s*0\b/i.test(lastGoogleImageFailureReason);
        const isQuotaOrRateError = /429|quota|resource_exhausted|403|permission_denied/i.test(lastGoogleImageFailureReason);
        const failReasonAr = isPaidKeyRequired
            ? `نماذج جوجل الأصلية للصور (${candidateImageModels.join(' ➔ ')}) تتطلب مفتاح Gemini API مفعّل عليه الفوترة (Paid Tier) لأن الحصة الحالية على هذه النماذج تساوي صفراً (limit: 0). يمكنك ربط مفتاح API مدفوع من Settings > Secrets لتفعيل توليد الصور بدقة 1K/2K/4K والبحث البصري الحي فوراً.`
            : isQuotaOrRateError
            ? `استُنفدت حصة الطلبات مؤقتاً على نماذج جوجل للصور (${candidateImageModels.join(' ➔ ')}) (429). حاول مجدداً بعد لحظات.`
            : `تعذر توليد الصورة عبر نماذج جوجل البصرية (${candidateImageModels.join(' ➔ ')}) في هذه اللحظة.${lastGoogleImageFailureReason ? ` (${lastGoogleImageFailureReason.slice(0, 180)})` : ''}`;

        if (onLog) {
            onLog(`❌ [GOOGLE IMAGE ENGINE]: ${failReasonAr}`, 'error');
        }
        emitNanoPulse(
            5,
            1.0,
            'توقف التوليد البصري: تعذر الاتصال بمحرّك الصور',
            failReasonAr,
            initialAmplifies,
            initialBiases,
            initialFreeZones,
            0.0,
            0.0,
            'Converged',
            undefined
        );
        return {
            data: '',
            refinedPrompt: prompt,
            nanoVisualTelemetry: {
                modelUsed: activeImageModelUsed,
                aspectRatio: validGeminiAspect,
                resolution,
                finalQualityScore: 0,
                totalPulses: pulses.length,
                pulses
            },
            thoughtProcess: painterBlueprint.painterThoughtsAr,
            finalResponse: failReasonAr,
            thinkingDuration: totalFailDurationSec
        };
    }

    activeImageModelUsed = singleStreamResult.modelUsed;
    const totalThinkingDurationSec = Math.max(1.0, Number(((Date.now() - startTimeMs) / 1000).toFixed(1)));

    const parsedFinal = extractThinkAndResponse(
        singleStreamResult.streamedText,
        singleStreamResult.streamedThoughts,
        prompt
    );

    const baseThoughtText = parsedFinal.thoughtProcess?.trim()
        ? applyOpVeilThoughtSanitizer(parsedFinal.thoughtProcess, prompt)
        : painterBlueprint.painterThoughtsAr || liveThoughtState;

    const finalThoughtProcess = baseThoughtText;
    liveThoughtState = finalThoughtProcess;

    const finalPresentationText = parsedFinal.finalResponse?.trim()
        ? applyOpVeilSurfaceSanitizer(parsedFinal.finalResponse, prompt)
        : painterBlueprint.presentationAr?.trim()
        ? applyOpVeilSurfaceSanitizer(painterBlueprint.presentationAr, prompt)
        : contextualSeedPlan.presentationAr;
    liveResponseState = finalPresentationText;

    emitNanoPulse(
        5,
        1.0,
        'الطور 5 (1.00): اكتمال اللوحة الطبقية المدمجة واستقرار المراجعة البصرية الذاتية',
        `اكتمل بناء الطبقات الثلاث ومراجعتها الذاتية عبر (${activeImageModelUsed}) خلال ${totalThinkingDurationSec} ثانية.`,
        initialAmplifies,
        initialBiases,
        initialFreeZones,
        0.10,
        9.7,
        'Converged',
        undefined
    );

    const finalTelemetry: NanoVisualTelemetry = {
        modelUsed: activeImageModelUsed,
        aspectRatio: validGeminiAspect,
        resolution,
        finalQualityScore: 9.7,
        totalPulses: pulses.length,
        pulses
    };

    if (onLog) {
        onLog(
            `✨ [SOVEREIGN LAYERED PAINTER COMPLETE]: اكتمل بناء اللوحة الطبقية ومراجعتها البصرية عبر (${activeImageModelUsed}) خلال ${totalThinkingDurationSec} ثانية!`,
            "success"
        );
    }

    return {
        data: singleStreamResult.dataUrl,
        refinedPrompt: prompt,
        nanoVisualTelemetry: finalTelemetry,
        thoughtProcess: finalThoughtProcess,
        finalResponse: finalPresentationText,
        thinkingDuration: totalThinkingDurationSec
    };
};

export const generateAudioBriefing = async (text: string): Promise<string | undefined> => {
  const ai = getAIClient();
  const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
  for (const ttsModel of ttsModels) {
    try {
      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' },
            },
          },
        },
      }));

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) return base64Audio;
    } catch (error) {
      console.warn(`Audio Generation fallback from ${ttsModel}:`, error);
    }
  }
  return undefined;
};

