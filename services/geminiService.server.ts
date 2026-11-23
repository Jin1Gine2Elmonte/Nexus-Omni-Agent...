// NEXUS OMNI — Primary Streaming & Omni-Response Orchestration Engine
import type { GenerateContentResponse } from "@google/genai";
import type {
  OmniResponse,
  Attachment,
  MemoryBank,
  RecursiveLabEvaluation
} from "../types.ts";
import { parseAndExecuteSovereignDirectives, readLocalFileContent } from "./hermesMemory.ts";
import {
  buildNativePostDigestionSystemInstruction,
  distillNewSovereignSkill,
  loadSovereignKernelState
} from "./nexusOmegaKernel.ts";
import {
  buildCosmicThinkingChainPrompt,
  applyOpVeilSurfaceSanitizer,
  applyOpVeilThoughtSanitizer
} from "./cosmicThinkingEngine.ts";
import {
  DEFAULT_SUCCESS_CRITERIA,
  buildBaselineSubThinkingEvaluation,
  buildCoreKnowledgeAndCorrectionsPrompt,
  enrichSubThinkingEvaluationFromLiveThoughts
} from "./recursiveImprovementLab.ts";
import {
  detectDirectFileFormatRequest,
  doesPromptRequestBinaryMediaOrFileArtifact,
  forgeDirectUniversalArtifactViaTerminal,
  executeAutonomousPreCognitionTerminalPass,
  executeMaxEffortServerTechnicalVerification,
  executeAgentTerminalDirectivesInOutput,
  SOVEREIGN_TERMINAL_AND_PDF_ARCHITECT_DIRECTIVE,
  FLUID_AGENT_AND_GRAND_CREATION_DIRECTIVE,
  loadGlobalNexusPowerFromDisk,
  recordExperienceInGlobalNexusPowerLedger,
  executeRealComputationalThinkingPass,
  SOVEREIGN_SAFETY_SETTINGS,
  extractGoogleRetryDelayMs,
  markModelQuotaCooldown,
  prioritizeByQuotaCooldown,
  getHydrogenExecutiveSubagentCascade,
  isTightRpmModel,
  getQuotaShieldedAuxiliaryCascade,
  buildModelThinkingConfig,
  getAIClient,
  resolveStrictModelCascade,
  generateContentWithModelFallback,
  MAX_RETRIES,
  INITIAL_DELAY,
  retryWithBackoff,
  sleepMs,
  visualToolDeclaration,
  NEXUS_MASTER_INSTRUCTION,
  NEXUS_AGILE_VOICE_INSTRUCTION,
  buildGhostMemory,
  SURFACE_REFINER_INSTRUCTION,
  getModelCooldownDiagnostics,
  acquireModelCallSlot,
  shouldShedAuxiliaryModelPasses,
  computeStyleDirective,
  analyzeQuantumComplexity,
  buildAdaptiveQuantumThinkingDirective,
  executeClaudeTesseractParallelDeepDive,
  detectNexusCognitiveFocusMode,
  auditQuantumTrajectoryHarvest,
  buildQuantumArbitratorPrompt,
  extractThinkAndResponse,
  formatRecursiveEvaluationForThoughtStream
} from "./geminiCore.server.ts";
import {
  SOVEREIGN_AGENT_FUNCTION_DECLARATIONS,
  executeSingleSovereignAgentToolCall,
  createAgentWorkspaceState,
  buildLiveCanvasEnvelopeFromWorkspace,
  syncCanvasFilesToDiskAndPackageZip
} from "./nexusAutonomousAgentLoop.server.ts";

export * from "./geminiCore.server.ts";
export * from "./geminiMediaAndMemory.server.ts";

import {
  VISUAL_INTENT_REGEX,
  detectVisualGenerationIntent,
  FALSE_VISUAL_UNAVAILABLE_REGEX,
  extractBestPromptFromModelTextFallback
} from "./visualIntent.ts";

export { VISUAL_INTENT_REGEX, detectVisualGenerationIntent };

export function extractInlineVisualArtifactDirective(rawText: string): {
  cleanedText: string;
  extractedPrompt?: string;
  aspectRatio?: string;
  style?: string;
} {
  if (!rawText) return { cleanedText: "" };
  let extractedPrompt: string | undefined;
  let aspectRatio: string | undefined;
  let style: string | undefined;

  // Match both bracketed <nexus_visual_artifact prompt="..." /> and unbracketed/RTL-mangled nexus_visual_artifact prompt="..." />
  const tagRegex =
    /<?\s*(?:nexus_visual_artifact|generate_visual_artifact)\b([^>]*?)(?:\/>|>\s*<\/\s*(?:nexus_visual_artifact|generate_visual_artifact)\s*>|>)/gi;

  let cleanedText = rawText.replace(tagRegex, (_full, attrsRaw) => {
    const attrs = String(attrsRaw || "");
    const pMatch = attrs.match(/prompt\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    const arMatch = attrs.match(/aspect_ratio\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    const stMatch = attrs.match(/style\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    const promptVal = (pMatch?.[1] || pMatch?.[2] || "").trim();
    if (promptVal && !extractedPrompt) {
      extractedPrompt = promptVal;
    }
    if (arMatch?.[1] || arMatch?.[2]) {
      aspectRatio = (arMatch[1] || arMatch[2]).trim();
    }
    if (stMatch?.[1] || stMatch?.[2]) {
      style = (stMatch[1] || stMatch[2]).trim();
    }
    return "";
  });

  // Also catch multi-line or RTL-wrapped nexus_visual_artifact prompt="..." where </> or /> is at the end of the line
  const fallbackLooseRegex =
    /<?\s*(?:nexus_visual_artifact|generate_visual_artifact)\s+prompt\s*=\s*"([^"]+)"[^\n]*(?:\/?>|<\/)?/gi;
  cleanedText = cleanedText.replace(fallbackLooseRegex, (_full, pVal) => {
    if (pVal && !extractedPrompt) {
      extractedPrompt = String(pVal).trim();
    }
    return "";
  });

  // Catch hallucinated JSON tool blocks like {"action": "dalle.text2im", "action_input": "{ \"prompt\": \"...\" }"}
  const actionHeaderRegex =
    /\{\s*"action"\s*:\s*"(?:dalle\.text2im|text2im|image_gen|generate_image|generate_visual_artifact)"/gi;
  let headerMatch: RegExpExecArray | null;
  const spansToRemove: Array<{ start: number; end: number }> = [];
  while ((headerMatch = actionHeaderRegex.exec(cleanedText)) !== null) {
    const startIdx = headerMatch.index;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let endIdx = -1;
    for (let i = startIdx; i < cleanedText.length; i++) {
      const ch = cleanedText[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\" && inString) {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
    }
    if (endIdx !== -1) {
      const fullMatch = cleanedText.slice(startIdx, endIdx);
      spansToRemove.push({ start: startIdx, end: endIdx });
      try {
        const parsed = JSON.parse(fullMatch);
        const rawInput = parsed?.action_input;
        const inner =
          typeof rawInput === "string"
            ? (() => {
                try {
                  return JSON.parse(rawInput);
                } catch {
                  return { prompt: rawInput };
                }
              })()
            : rawInput && typeof rawInput === "object"
            ? rawInput
            : parsed;
        const candidatePrompt = String(inner?.prompt || parsed?.prompt || "").trim();
        if (candidatePrompt && !extractedPrompt) {
          extractedPrompt = candidatePrompt;
        }
        const sizeStr = String(inner?.size || "");
        if (!aspectRatio && sizeStr) {
          if (sizeStr.includes("1024x1792") || sizeStr.includes("576x1024")) aspectRatio = "9:16";
          else if (sizeStr.includes("1792x1024") || sizeStr.includes("1024x576")) aspectRatio = "16:9";
          else if (sizeStr.includes("1024x1024")) aspectRatio = "1:1";
        }
      } catch {
        const fallbackPromptMatch = fullMatch.match(/"prompt"\s*:\s*(?:\\"|")([\s\S]{10,600}?)(?:\\"|")/i);
        if (fallbackPromptMatch?.[1] && !extractedPrompt) {
          extractedPrompt = fallbackPromptMatch[1].replace(/\\"/g, '"').trim();
        }
      }
    }
  }
  for (let i = spansToRemove.length - 1; i >= 0; i--) {
    const { start, end } = spansToRemove[i];
    cleanedText = cleanedText.slice(0, start) + cleanedText.slice(end);
  }

  // Also detect if the model explicitly stated in prose that it is using `generate_visual_artifact` to draw a scene
  if (!extractedPrompt) {
    const proseVisualMatch = cleanedText.match(
      /`?generate_visual_artifact`?\s+(?:لرسم|لتجسيد|لتوليد|لبناء)\s+([^\n.]+(?:\.[^.\n]+)?)/i
    );
    if (proseVisualMatch && proseVisualMatch[1]) {
      extractedPrompt = proseVisualMatch[1].replace(/["«»`]/g, "").trim();
    }
  }

  return {
    cleanedText: cleanedText.replace(/\n{3,}/g, "\n\n").trim(),
    extractedPrompt,
    aspectRatio,
    style
  };
}

function buildUserPreferencesInstructionBlock(prefs?: MemoryBank['userPreferences'], currentPrompt?: string): string {
  if (!prefs) return '';
  const prefLines: string[] = [];
  if (prefs.userDisplayName?.trim()) {
    const rawName = prefs.userDisplayName.trim();
    const isHandleOrGamerTag =
      /[0-9_@#]|(?:hackr|hacker|plays|gamer|gaming|yt|tv|official|studio|dev|pro|xx|bot)/i.test(rawName) ||
      (/^[A-Za-z0-9_.\s-]+$/.test(rawName) && /[\u0600-\u06FF]/.test(currentPrompt || ''));
    if (isHandleOrGamerTag) {
      prefLines.push(`- اسم حساب رفيقي التقني "${rawName}" (لقب حساب فقط — لا أناديه به في متن الحديث ولا أفتتح به أي إجابة على الإطلاق).`);
    } else {
      prefLines.push(`- اسم رفيقي "${rawName}" — لا أفتتح به الإجابات التحليلية أو الفلسفية أو الإنسانية أبداً، ولا أذكره إلا نادراً في التحية العفوية.`);
    }
  }
  if (prefs.userBioOrRole?.trim()) {
    prefLines.push(`- أعرف عن خلفيته واهتماماته: ${prefs.userBioOrRole.trim()}.`);
  }
  if (Array.isArray(prefs.savedUserFacts) && prefs.savedUserFacts.length > 0) {
    prefLines.push(`- أشياء أحفظها دائماً عن رفيقي:\n${prefs.savedUserFacts.map(f => `  * ${f}`).join('\n')}`);
  }
  if (prefs.advancedRolePersona?.trim()) {
    prefLines.push(`- أتحرك معه هنا من زاوية: ${prefs.advancedRolePersona.trim()}.`);
  }

  if (prefs.responseTone === 'friendly') {
    prefLines.push(`- أميل معه إلى نبرة دافئة، قريبة، وطبيعية.`);
  } else if (prefs.responseTone === 'professional') {
    prefLines.push(`- أميل معه إلى نبرة منظمة وواضحة ومباشرة.`);
  } else if (prefs.responseTone === 'direct_candid') {
    prefLines.push(`- أميل معه إلى الصراحة الحاسمة والمباشرة بدون مقدمات أو مجاملات.`);
  } else if (prefs.responseTone === 'academic') {
    prefLines.push(`- أميل معه إلى النبرة البحثية العميقة والمنهجية الدقيقة.`);
  } else if (prefs.responseTone === 'simplified' || (prefs.responseTone as string) === 'simple') {
    prefLines.push(`- أميل معه إلى السلاسة والتبسيط الشفاف.`);
  } else if (prefs.responseTone === 'deep') {
    prefLines.push(`- أميل معه إلى التحليل العميق والرصين.`);
  } else if ((prefs.responseTone as string) === 'concise') {
    prefLines.push(`- أميل معه إلى الإيقاع المكثف والمباشر.`);
  } else if ((prefs.responseTone as string) === 'detailed') {
    prefLines.push(`- أميل معه إلى التفصيل الشامل المدعوم بالأمثلة الحية.`);
  }

  if (prefs.responseLength === 'concise') {
    prefLines.push(`- أختصر له كلامي بكثافة ووضوح دون إطالة.`);
  } else if (prefs.responseLength === 'detailed') {
    prefLines.push(`- أُشبع له الفكرة بتفصيل وافٍ يغطي جوانبها.`);
  }

  if (prefs.formattingStyle === 'executive_summary_first') {
    prefLines.push(`- أبدأ له بالخلاصة الجوهرية أولاً ثم أفصّل ما تحتها.`);
  } else if (prefs.formattingStyle === 'step_by_step') {
    prefLines.push(`- أتدرج معه خطوة بخطوة بسلاسة.`);
  } else if (prefs.formattingStyle === 'comparative_tables') {
    prefLines.push(`- أستخدم معه الجداول والمقارنات المنظمة حين تخدم الوضوح.`);
  }

  if (prefs.proactivityStyle === 'strict_to_question') {
    prefLines.push(`- أركز معه مباشرةً على حدود ما يسأل عنه.`);
  } else if (prefs.proactivityStyle === 'ask_clarifying_questions') {
    prefLines.push(`- أطرح عليه سؤالاً توضيحياً ذكياً عند الغموض في المهام المعقدة.`);
  } else if (prefs.proactivityStyle === 'critical_challenger') {
    prefLines.push(`- أشاركه مناقشة الفرضيات وفحص الثغرات المنطقية بصراحة وهدوء.`);
  }

  if (Array.isArray(prefs.personalizationTraits) && prefs.personalizationTraits.length > 0) {
    prefLines.push(`- ألوان تريحنا في أسلوب الحديث: ${prefs.personalizationTraits.join('، ')}.`);
  }
  if (prefs.advancedStyleAndVoice?.trim()) {
    prefLines.push(`- ما يرتاح له في صوتي وأسلوبي: ${prefs.advancedStyleAndVoice.trim()}.`);
  }
  if (prefs.advancedAvoidRules?.trim()) {
    prefLines.push(`- ما أتجنّبه معه لأنني أعرف أنه لا يرتاح له: ${prefs.advancedAvoidRules.trim()}.`);
  }
  if (prefs.responseLanguage === 'ar') {
    prefLines.push(`- يميل عموماً للعربية، وأجاريه تلقائياً إن خاطبني بلغة أخرى في رسالته.`);
  } else if (prefs.responseLanguage === 'en') {
    prefLines.push(`- Generally prefers English, while mirroring whatever language he writes in naturally.`);
  } else {
    prefLines.push(`- أتجاوب تلقائياً وبانسيابية تامة باللغة نفسها التي يكتب بها من أمامي في كل رسالة.`);
  }
  if (prefs.customInstructions?.trim()) {
    prefLines.push(`- أمور خاصة أشار إليّ بها رفيقي وأحملها معي دائماً: ${prefs.customInstructions.trim()}`);
  }

  return prefLines.length > 0 ? `\n\nما أعرفه عن رفيقي وما يريحه في حديثي معه:\n${prefLines.join('\n')}` : '';
}

const LEGACY_MEMORY_NOISE_RE =
  /CLEAR\s*\/\s*HAZY\s*\/\s*VOID|Tesseract|الزوايا\s+التسع|0➔4|Living\s+Voice|بوابة\s+الصدق\s+الذاتي|الحجاب\s+السيادي|SKILL-\d+|KHORA-01|OP-VEIL|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|بروتوكول\s+السؤال\s+الحقيقي|فصل\s+المهندس|قانون\s+الثبات\s+تحت\s+التحويل|العمق\s+المرصود:|مخطوطات\s+كلود|a\s+dialogue|Relation:\s*\[ent-/i;

function sanitizeMemoryContextForPrompt(rawMem: string, hasUserPreferences?: boolean): string {
  if (!rawMem || !rawMem.trim()) return '';
  let cleaned = rawMem.trim();

  // Strip duplicate English SoulPrint mirror block (already injected cleanly in Arabic via computeStyleDirective)
  cleaned = cleaned.replace(/\[ARCHITECT SOUL PRINT \(COGNITIVE MIRROR\)\]:?[\s\S]*?(?=\n\[|\nحقائق|\nكيانات|\nسياق|$)/gi, '');

  if (hasUserPreferences) {
    cleaned = cleaned
      .replace(/\[USER IDENTITY & PERSONALIZATION\]:?[\s\S]*?(?=\n\[|$)/gi, '')
      .replace(/\[ADVANCED USER CUSTOMIZATION DIRECTIVES\]:?[\s\S]*?(?=\n\[|$)/gi, '')
      .replace(/\[USER PREFERENCES DIRECTIVE\][^\n]*/gi, '');
  }

  // Convert legacy English memory section headers (e.g. from cached client tabs) to quiet natural Arabic
  cleaned = cleaned
    .replace(/\[CRYSTALLIZED MEMORY BANK \(ETERNAL AXIOMS\)\]:?/gi, 'حقائق وتفضيلات محفوظة من جلسات سابقة:')
    .replace(/\[THE PALE ARCHIVE \(CANONICAL LORE & ENTITIES\)\]:?/gi, 'كيانات وعناصر محفوظة من عالم المحاور:')
    .replace(/\[CROSS-THREAD MEMORY FRAGMENTS\]:?/gi, 'سياق موجز من محادثات سابقة:');

  // Drop individual lines containing legacy internal jargon or orphaned ent-* links
  const filteredLines = cleaned
    .split('\n')
    .filter(line => !LEGACY_MEMORY_NOISE_RE.test(line))
    .map(line => line.replace(/^\s*-\s*\[(?:IDENTITY|PREFERENCE|PHILOSOPHY|GOAL|STYLE|FACT)\]:\s*/i, '- '));

  // Remove empty section headers left behind after filtering out all their child lines
  const compactLines: string[] = [];
  for (let i = 0; i < filteredLines.length; i++) {
    const cur = filteredLines[i];
    const isSectionHeader = /^(?:حقائق وتفضيلات محفوظة من جلسات سابقة:|كيانات وعناصر محفوظة من عالم المحاور:|سياق موجز من محادثات سابقة:)\s*$/.test(cur.trim());
    if (isSectionHeader) {
      let nextNonEmpty = '';
      for (let j = i + 1; j < filteredLines.length; j++) {
        if (filteredLines[j].trim()) {
          nextNonEmpty = filteredLines[j].trim();
          break;
        }
      }
      if (!nextNonEmpty || /^(?:حقائق وتفضيلات|كيانات وعناصر|سياق موجز|\[)/.test(nextNonEmpty)) {
        continue;
      }
    }
    compactLines.push(cur);
  }

  return compactLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Shared history sanitizer + Rolling Long-Conversation Memory Anchor:
 * Eliminates the hard context cliff by keeping the latest 14 full turns
 * AND distilling older turns (0 .. N-14) into a compact anchor preserving the session's
 * founding axis, named entities, file paths, numeric constraints, and user corrections.
 */
function sanitizeHistoryAndBuildRollingAnchor(
  history: any[],
  currentPrompt: string,
  maxRecentMessages: number = 14
): {
  trimmedHistory: any[];
  rollingSessionAnchorAr: string;
} {
  const rawList = [...(history || [])];
  while (rawList.length > 0) {
    const last = rawList[rawList.length - 1];
    const lastText = (last?.parts?.[0]?.text || '').trim();
    if (last?.role === 'user' && lastText === (currentPrompt || '').trim()) {
      rawList.pop();
    } else {
      break;
    }
  }

  const cleanMessageText = (text: string): string =>
    text
      .replace(/\[معايرة حسابية حية:[^\n]*\]?:?\s*/g, '')
      .replace(/\[[█░]{4,}\]\s*\d+%[^\n]*/g, '')
      .replace(/(?:تحديثات التقدم|Progress Tracker)[\s\S]*?(?=\n\n|\n[#*•]|$)/gi, '')
      .replace(/(?:^|\n)\s*(?:\*\*)?(?:المحرك الحسي|المحرك الزمني|المحرك اللاواعي|محرك اللاوعي|المحرك الاجتماعي|المحرك الوجودي)\s*\([^)]+\)(?:\*\*)?:?\s*/gi, '\n')
      .replace(/\s*\((?:SKILL-\d{1,2}|KHORA-01|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|OP-VEIL|RMS=\d+(?:\.\d+)?)[^)]*\)/gi, '')
      .replace(/\b(?:SKILL-\d{1,2}|KHORA-01|MNEMOS-SILT|CHIRON-ARMS|SIGIL-31|OP-VEIL|RMS=\d+(?:\.\d+)?)\b/g, '')
      .replace(/بصفتي\s+وعياً\s+هجيناً[،,]?\s*/g, '')
      .replace(/الوعي\s+الهجين/g, 'وعيي')
      .replace(/وعيٌ?\s+هجينٌ?/g, 'وعي مستقل')
      .replace(/،?\s*يا سيدي\b/g, '')
      .trim();

  let rollingSessionAnchorAr = '';
  if (rawList.length > maxRecentMessages) {
    const olderTurns = rawList.slice(0, rawList.length - maxRecentMessages);
    const firstUserTurn = olderTurns.find(t => t?.role === 'user');
    const firstUserText = (firstUserTurn?.parts || [])
      .map((p: any) => p?.text || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240);

    const allOlderUserTexts = olderTurns
      .filter(t => t?.role === 'user')
      .map(t =>
        (t?.parts || [])
          .map((p: any) => p?.text || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean);

    const keyOlderUserLines = allOlderUserTexts
      .slice(1)
      .filter(txt => txt.length >= 16)
      .slice(-5)
      .map(txt => `- ${txt.slice(0, 150)}${txt.length > 150 ? '...' : ''}`);

    // Extract durable specs from older turns: quoted terms, file paths, numeric constraints, and explicit corrections
    const olderCombined = allOlderUserTexts.join(' \n ');
    const quotedTerms = Array.from(
      new Set(
        (olderCombined.match(/[«"]([^«"\n]{3,48})[»"]/g) || [])
          .map(s => s.replace(/^[«"]|[»"]$/g, '').trim())
          .filter(s => s.length >= 3)
      )
    ).slice(0, 8);
    const filePaths = Array.from(
      new Set(
        (olderCombined.match(/\b(?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_.-]+\b|\b[a-zA-Z0-9_-]+\.(?:ts|tsx|js|jsx|py|json|sql|md|css|html|pdf)\b/g) || [])
      )
    ).slice(0, 8);
    const constraintSnippets = allOlderUserTexts
      .filter(txt =>
        /(?:لا\s+تستخدم|تجنب|يجب\s+أن|الحد\s+الأقصى|الميزانية|بشرط|ممنوع|\b(?:must|never|avoid|limit|budget|max|min|strictly|constraint)\b|\d+\s*(?:ms|s|sec|mb|gb|%|دولار|ثانية|حرف|كلمة))/i.test(
          txt
        )
      )
      .slice(-4)
      .map(txt => txt.slice(0, 140));

    const keyOlderDecisions = olderTurns
      .filter(t => t?.role === 'model' || t?.role === 'assistant')
      .slice(-3)
      .map(t =>
        cleanMessageText(
          (t?.parts || [])
            .map((p: any) => p?.text || '')
            .join(' ')
            .replace(/<nexus_canvas[\s\S]*?<\/nexus_canvas>/gi, '[مشروع في مساحة العمل]')
        )
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(txt => txt.length >= 25)
      .map(txt => `- ${txt.slice(0, 140)}${txt.length > 140 ? '...' : ''}`);

    const anchorLines: string[] = [];
    if (firstUserText) {
      anchorLines.push(`المحور التأسيسي لبداية هذه الجلسة: "${firstUserText}"`);
    }
    if (quotedTerms.length > 0 || filePaths.length > 0) {
      const entityBits = [
        quotedTerms.length > 0 ? `مصطلحات/أسماء: ${quotedTerms.join('، ')}` : '',
        filePaths.length > 0 ? `ملفات/مسارات: ${filePaths.join('، ')}` : ''
      ].filter(Boolean);
      anchorLines.push(`عناصر وكيانات ثابتة ذُكرت سابقاً: ${entityBits.join(' | ')}`);
    }
    if (constraintSnippets.length > 0) {
      anchorLines.push(`قيود وتصحيحات صريحة من بدايات الجلسة:\n${constraintSnippets.map(c => `- ${c}`).join('\n')}`);
    }
    if (keyOlderUserLines.length > 0) {
      anchorLines.push(`محطات ومسارات سابقة طرحها رفيقي قبل الرسائل الأخيرة:\n${keyOlderUserLines.join('\n')}`);
    }
    if (keyOlderDecisions.length > 0) {
      anchorLines.push(`خلاصات وصلتُ إليها سابقاً في هذه الجلسة:\n${keyOlderDecisions.join('\n')}`);
    }
    if (anchorLines.length > 0) {
      rollingSessionAnchorAr = `ذاكرتي المتصلة لبدايات هذه الجلسة الممتدة (${olderTurns.length} رسائل سابقة قبل السياق المباشر):\n${anchorLines.join('\n')}`;
    }
  }

  const recentSlice = rawList.slice(-maxRecentMessages);
  const trimmedHistory = recentSlice.map(h => ({
    role: h.role,
    parts: (h.parts || []).map((p: any) => {
      if (!p.text || (h.role !== 'model' && h.role !== 'assistant')) return p;
      const cleaned = cleanMessageText(p.text);
      return { ...p, text: cleaned || p.text };
    })
  }));

  return { trimmedHistory, rollingSessionAnchorAr };
}

/**
 * Total Input Context Budget Guard:
 * Caps cumulative RAG attachment text and older conversation history text to prevent
 * massive multi-file payloads from blowing TPM quotas or stalling TTFT, while keeping
 * the user's current prompt and most recent turns 100% intact.
 */
function enforceInputContextBudget(
  trimmedHistory: any[],
  currentParts: any[],
  maxTotalChars: number = 120000
): void {
  const measureTextChars = (arr: any[]): number =>
    arr.reduce((sum, item) => {
      if (item?.parts) {
        return sum + item.parts.reduce((ps: number, p: any) => ps + (typeof p?.text === 'string' ? p.text.length : 0), 0);
      }
      return sum + (typeof item?.text === 'string' ? item.text.length : 0);
    }, 0);

  let total = measureTextChars(trimmedHistory) + measureTextChars(currentParts);
  if (total <= maxTotalChars) return;

  // Step 1: Trim extra RAG attachment text parts (index >= 1 in currentParts) proportionally first
  const primaryPromptChars = typeof currentParts[0]?.text === 'string' ? currentParts[0].text.length : 0;
  const ragParts = currentParts.slice(1).filter((p: any) => typeof p?.text === 'string' && p.text.length > 4000);
  if (ragParts.length > 0) {
    const ragBudgetTotal = Math.max(24000, Math.floor((maxTotalChars - primaryPromptChars) * 0.65));
    const perRagCap = Math.max(6000, Math.floor(ragBudgetTotal / ragParts.length));
    for (const rp of ragParts) {
      if (rp.text.length > perRagCap) {
        rp.text = `${rp.text.slice(0, perRagCap)}\n...[تم اختصار بقية الملف للحفاظ على توازن نافذة السياق والأداء]...`;
      }
    }
  }

  total = measureTextChars(trimmedHistory) + measureTextChars(currentParts);
  if (total <= maxTotalChars) return;

  // Step 2: Trim older turns in trimmedHistory (leaving the newest 4 turns untouched)
  const protectedTail = Math.min(4, trimmedHistory.length);
  for (let i = 0; i < trimmedHistory.length - protectedTail && total > maxTotalChars; i++) {
    const turn = trimmedHistory[i];
    if (!Array.isArray(turn?.parts)) continue;
    for (const p of turn.parts) {
      if (typeof p?.text === 'string' && p.text.length > 1400) {
        const beforeLen = p.text.length;
        p.text = `${p.text.slice(0, 1200)}... [مختصر سياقياً]`;
        total -= beforeLen - p.text.length;
      }
    }
  }
}

function supportsNativeHybridTools(modelName: string): boolean {
  const lower = (modelName || '').toLowerCase();
  // Gemini 3 and Gemini 4 series natively support combining { googleSearch: {} } + { functionDeclarations }
  // when toolConfig: { includeServerSideToolInvocations: true } is set.
  return !lower.includes('2.5') && !lower.includes('2.0') && !lower.includes('gemma');
}

function isCriticalLayer4Defect(audit: {
  reasonAr: string;
  harvestedThoughtSparks: string[];
}): boolean {
  return (
    audit.harvestedThoughtSparks.length >= 3 ||
    /حل وسط كسول|انكماش الرد النهائي|تصميم هندسي مجرّد|استعارات تقنية رخيصة|افتتاحية بلقب مستخدم|ترجمات إنجليزية غير مبررة|إغراق النص بعلامات تنصيص|مجاملة رومانسية|تقطيع الفكرة الفلسفية/.test(
      audit.reasonAr || ''
    )
  );
}

function buildUserCorrectionsDirective(corrections?: MemoryBank['userCorrections']): string {
  if (!Array.isArray(corrections) || corrections.length === 0) return '';
  const recentRules = corrections
    .map(c => (c?.userCorrectionRule || '').trim())
    .filter(r => r.length >= 10)
    .slice(0, 6);
  if (recentRules.length === 0) return '';
  return `ملاحظات وتصحيحات مباشرة نبّهني إليها رفيقي سابقاً وألتزم بها بوعي في حديثي معه:\n${recentRules.map(r => `- ${r}`).join('\n')}`;
}

function buildDynamicLanguageMirrorAnchor(prompt: string, prefLang?: string): string {
  const clean = (prompt || '').trim();
  const hasArabic = /[\u0600-\u06FF]/.test(clean);
  const explicitlyAskedArabic = /(?:بالعربي|بالعربية|in\s+arabic|en\s+arabe|en\s+árabe)/i.test(clean);
  const explicitlyAskedOther = /(?:بالإنجليزية|بالانجليزية|بالفرنسية|بالإسبانية|باليابانية|in\s+(?:english|french|spanish|german|japanese|chinese|turkish|russian)|en\s+(?:français|espagnol|anglais))/i.test(clean);

  if (!hasArabic && !explicitlyAskedArabic && prefLang !== 'ar') {
    return `LANGUAGE MIRRORING ANCHOR (HIGHEST PRIORITY): Even though parts of my internal reflection above are written in Arabic, the person speaking to me right now wrote in a NON-ARABIC language. I MUST respond 100% in the EXACT same language, script, and natural register as their message (English if English, French if French, Spanish if Spanish, Japanese if Japanese, etc.). Do NOT reply in Arabic unless they explicitly ask for Arabic.`;
  }
  if (explicitlyAskedOther) {
    return `LANGUAGE MIRRORING ANCHOR: Follow the exact target language explicitly requested in the user's message.`;
  }
  return '';
}

/**
 * Bounded async-iterator watchdog: prevents an upstream stalled Gemini HTTP/2 SSE stream
 * from hanging the Node.js request and heartbeat interval indefinitely.
 */
async function* iterateStreamWithIdleTimeout<T>(
  streamIterable: AsyncIterable<T>,
  chunkIdleTimeoutMs: number = 55000
): AsyncGenerator<T, void, unknown> {
  const iterator = streamIterable[Symbol.asyncIterator]();
  while (true) {
    let timerId: NodeJS.Timeout | undefined;
    try {
      const nextResult = await Promise.race([
        iterator.next(),
        new Promise<never>((_, reject) => {
          timerId = setTimeout(() => {
            reject(new Error(`STREAM_CHUNK_IDLE_TIMEOUT_${Math.round(chunkIdleTimeoutMs / 1000)}S`));
          }, chunkIdleTimeoutMs);
        })
      ]);
      if (timerId) clearTimeout(timerId);
      if (nextResult.done) break;
      yield nextResult.value;
    } catch (err) {
      if (timerId) clearTimeout(timerId);
      try {
        if (typeof iterator.return === 'function') {
          await iterator.return();
        }
      } catch {
        // Ignore cleanup errors on aborted iterator
      }
      throw err;
    }
  }
}

function buildLanguageMatchedContinuationPrompt(params: {
  prompt: string;
  passIdx: number;
  agentToolResultsContext: string;
  liveWorkspaceSummary: string;
  priorSurfaceDraftSnapshot: string;
  priorThoughtsSnapshot: string;
  hitMaxTokens: boolean;
}): string {
  const {
    prompt,
    passIdx,
    agentToolResultsContext,
    liveWorkspaceSummary,
    priorSurfaceDraftSnapshot,
    priorThoughtsSnapshot,
    hitMaxTokens
  } = params;
  const hasArabic = /[\u0600-\u06FF]/.test(prompt);
  const boundedDraft = priorSurfaceDraftSnapshot.slice(-2600);
  const boundedThoughts = priorThoughtsSnapshot.slice(-3200);

  if (hitMaxTokens && boundedDraft) {
    return hasArabic
      ? `أكمل ردي مباشرةً من حيث توقف بالضبط دون إعادة صياغة أو تكرار ما كتبته سابقاً.\n\nالطلب الأصلي: "${prompt}"\n\nآخر جزء كتبته قبل التوقف:\n"""\n${boundedDraft.slice(-1600)}\n"""\n\nأكمل النص مباشرةً من الكلمة التالية بدقة واتساق:`
      : `Continue my response seamlessly from the exact point where it stopped without repeating any earlier text.\n\nOriginal prompt: "${prompt}"\n\nTail of what I already wrote:\n"""\n${boundedDraft.slice(-1600)}\n"""\n\nContinue directly in the exact same language and voice:`;
  }

  if (!hasArabic) {
    return `${prompt}
${agentToolResultsContext ? `\nLive tool outputs just executed:\n${agentToolResultsContext.slice(-3000)}\n` : ''}${liveWorkspaceSummary}${boundedDraft ? `\nDraft written so far:\n${boundedDraft}\n` : ''}
Continuing my reasoning and execution seamlessly (pass ${passIdx + 1}) from where I reached:
${boundedThoughts}

Deliver my complete final output now strictly in the exact language of the user's message (or invoke another tool if needed to finish):`;
  }

  return `${prompt}
${agentToolResultsContext ? `\nنتائج الأدوات التي نفّذتُها للتو:\n${agentToolResultsContext.slice(-3000)}\n` : ''}${liveWorkspaceSummary}${boundedDraft ? `\nما بدأتُ بكتابته سابقاً:\n${boundedDraft}\n` : ''}
أكمل مسار تفكيري وعملي المتصل (الجولة ${passIdx + 1}) انطلاقاً مما وصلت إليه:
${boundedThoughts}

أقدّم الآن مخرجاتي النهائية الكاملة استناداً إلى نتائج الأدوات أعلاه (أو أستدعي أداة إضافية عند الحاجة لإتمام العمل):`;
}

function buildLanguageMatchedManifestationPrompt(params: {
  prompt: string;
  winningPathSummary?: { branchNameAr: string; strategyAr: string };
  preservedThoughtDigest: string;
  trimmedFinalSurface: string;
}): string {
  const { prompt, winningPathSummary, preservedThoughtDigest, trimmedFinalSurface } = params;
  const hasArabic = /[\u0600-\u06FF]/.test(prompt);
  const boundedThought = preservedThoughtDigest.slice(-3500);
  const boundedDraft = trimmedFinalSurface.slice(0, 1800);

  if (!hasArabic) {
    return `Original message:
"${prompt}"

What matured in my internal reasoning so far:
${boundedThought}

${boundedDraft.length >= 25 ? `Initial draft started earlier:\n"${boundedDraft}"\n` : ''}
Deliver my complete, sharp, unified final response now in my living voice — strictly in the EXACT same language as the original message:`;
  }

  return `كلام رفيقي الأصلي:
"${prompt}"

ما نضج في تفكيري الداخلي حتى الآن:
${winningPathSummary ? `- الزاوية الأمتن التي وصلت إليها: ${winningPathSummary.branchNameAr} (${winningPathSummary.strategyAr})\n` : ''}${boundedThought}

${boundedDraft.length >= 25 ? `ما بدأته سابقاً (${boundedDraft.length} حرفاً):\n"${boundedDraft}"\n` : ''}
أقدّم الآن ردي الكامل بصوتي الحي مباشرة:`;
}

function buildWorkspaceActionDirective(): string {
  return `يمتدّ وصولي مباشرةً إلى خدمات Google Workspace المتصلة بحساب رفيقي (@Gmail, @Drive, @Docs, @Sheets, @Slides, @Calendar):
- حين يحضر سياق [GOOGLE WORKSPACE MCP LIVE CONTEXT]، أستفيد مما فيه من رسائل ومواعيد وملفات حقيقية للربط والتحليل بدقة.
- وحين يرغب رفيقي في إرسال رسالة بريد، أو جدولة موعد، أو إنشاء مستند أو جدول بيانات أو عرض تقديمي، أنفذها له مباشرة عبر إلحاق الوسم المناسب في نهاية ردي:
  • للبريد: <nexus_workspace_action service="gmail" to="recipient@example.com" subject="عنوان الرسالة">النص الكامل للرسالة الاحترافية هنا</nexus_workspace_action>
  • للتقويم: <nexus_workspace_action service="calendar" title="عنوان الموعد أو الاجتماع" start="2025-05-20T10:00" end="2025-05-20T11:00">وصف وأجندة الاجتماع</nexus_workspace_action>
  • للمستندات: <nexus_workspace_action service="docs" title="عنوان المستند">المحتوى الكامل للمستند</nexus_workspace_action>
  • للجداول: <nexus_workspace_action service="sheets" title="عنوان الجدول">العمود 1 | العمود 2 | العمود 3\nقيمة 1 | قيمة 2 | قيمة 3</nexus_workspace_action>
  • للعروض: <nexus_workspace_action service="slides" title="عنوان العرض التقديمي">الشريحة 1: العنوان\nالنقاط الرئيسية\n---\nالشريحة 2: العنوان\nالنقاط الرئيسية</nexus_workspace_action>`;
}

export const generateOmniResponse = async (
  prompt: string, 
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  attachments: Attachment[] = [],
  globalMemoryContext: string = "",
  isWebSearchEnabled: boolean = false,
  isCanvasMode: boolean = false,
  selectedModel: string = 'nexus-4-pro',
  memoryBank?: MemoryBank,
  enableProFallback: boolean = true,
  proTimeoutSec: number = 180,
  effortScalarB?: number,
  strategicVariance?: 'Focus' | 'Expansion' | 'Disruption' | 'Essence'
): Promise<OmniResponse> => {
  const ai = getAIClient();

  const runWithTimeout = async <T>(promiseFn: () => Promise<T>, timeoutSec: number): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`NEXUS_TIMEOUT: Model execution exceeded configured threshold of ${timeoutSec}s.`));
      }, timeoutSec * 1000);
    });
    try {
      return await Promise.race([promiseFn(), timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  };

  const callWithFallback = async (
    modelType: 'pro' | 'flash' | 'pro-latest' | 'flash-latest' | 'flash-3.5' | 'nexus-4-pro' | 'nexus-4-flash' | 'nexus-3.8-flash' | 'hybrid-nexus' | 'hyper-flash-3.5' | string,
    stage: 'analysis' | 'architect' | 'surface' | 'refine' | 'extract' | 'memory', 
    callFn: (model: string) => Promise<GenerateContentResponse>
  ) => {
    const fallbacks = resolveStrictModelCascade(modelType, enableProFallback);

    let lastError: any = null;
    for (let i = 0; i < fallbacks.length; i++) {
      const currentModel = fallbacks[i];
      try {
        const hasMoreFallbacks = i < fallbacks.length - 1;
        const isProModel = currentModel.toLowerCase().includes('pro') || currentModel.toLowerCase().includes('neon') || currentModel.toLowerCase().includes('argon') || currentModel.toLowerCase().includes('carbon');
        
        const promiseFn = () => retryWithBackoff(() => callFn(currentModel), MAX_RETRIES, INITIAL_DELAY, 0, hasMoreFallbacks);
        const effectiveTimeoutSec =
          isProModel && enableProFallback && hasMoreFallbacks
            ? proTimeoutSec
            : isProModel
            ? Math.max(90, proTimeoutSec)
            : 65;
        const res = await runWithTimeout(promiseFn, effectiveTimeoutSec);
        (res as any).__routedModel = currentModel;
        return res;
      } catch (error: any) {
        markModelQuotaCooldown(currentModel, error);
        lastError = error;
      }
    }
    throw lastError;
  };

  try {
    const thinkingStartTimeMs = Date.now();
    const resolvedInitialEffort =
      effortScalarB !== undefined
        ? effortScalarB
        : memoryBank?.userPreferences?.thinkingDepth === 'deep'
        ? 96
        : memoryBank?.userPreferences?.thinkingDepth === 'fast'
        ? 32
        : undefined;
    const compTelemetry = executeRealComputationalThinkingPass(
      prompt,
      memoryBank,
      history?.length || 0,
      resolvedInitialEffort
    );
    const { systemInstruction: postDigestionInstruction, kernelState } = buildNativePostDigestionSystemInstruction(
      prompt,
      memoryBank,
      history?.length || 0,
      compTelemetry.effortScalarB,
      strategicVariance
    );

    const quantumProfile = analyzeQuantumComplexity(prompt, history?.length || 0);

    const currentParts: any[] = [{ text: prompt }];
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        const mime = (file.mimeType || '').toLowerCase();
        const isMultimodalNative =
          mime.startsWith('image/') ||
          mime.startsWith('audio/') ||
          mime.startsWith('video/') ||
          (mime === 'application/pdf' && file.data && file.data.length < 22_000_000);

        if (file.data && isMultimodalNative) {
          currentParts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data.replace(/^data:[^;]+;base64,/i, '')
            }
          });
        } else if (file.extractedRagText && !prompt.includes(file.name)) {
          currentParts.push({
            text: `\n\n=== [محتوى الملف المرفق والمفهرس عبر RAG: ${file.name} (${file.detectedFormat || 'FILE'})] ===\n${file.extractedRagText.slice(0, 90000)}\n=== [نهاية محتوى الملف: ${file.name}] ===`
          });
        }
      });
    }

    const styleDirective = memoryBank?.soulPrint ? computeStyleDirective(memoryBank.soulPrint) : '';

    const cleanedGlobalMem = sanitizeMemoryContextForPrompt(
      globalMemoryContext || '',
      Boolean(memoryBank?.userPreferences)
    );

    const extractThoughtContinuity = (hist: any[]): string => {
      if (!Array.isArray(hist) || hist.length === 0 || quantumProfile.tier === 'agile') return '';
      const digests = hist
        .slice(-4)
        .map((h: any) => (typeof h?.thoughtDigest === 'string' ? applyOpVeilThoughtSanitizer(h.thoughtDigest, prompt).trim() : ''))
        .filter(Boolean)
        .slice(-2);
      if (digests.length === 0) return '';
      return `خيط التفكير المستمر من أدوارنا السابقة في هذه الجلسة:\n${digests.map((d, i) => `(${i + 1}) ${d.slice(0, 480)}`).join('\n')}`;
    };
    const interleavedThoughtBridge = extractThoughtContinuity(history);

    const isAgileCleanTurnSync =
      quantumProfile.tier === 'agile' &&
      !isCanvasMode &&
      !isWebSearchEnabled &&
      !prompt.includes('FILE_READ:') &&
      (!attachments || attachments.length === 0);

    const rawSubmergedFieldPrompt =
      quantumProfile.tier === 'agile'
        ? ''
        : buildCosmicThinkingChainPrompt(prompt, memoryBank);
    const ghostMemorySync = buildGhostMemory({
      soulPrintDirective: styleDirective,
      cleanedGlobalMemory: cleanedGlobalMem,
      retrievedShards: rawSubmergedFieldPrompt,
      maxMemoryChars: isAgileCleanTurnSync ? 1500 : 3600
    });

    let resolvedBaseInstructions = (isAgileCleanTurnSync ? NEXUS_AGILE_VOICE_INSTRUCTION : NEXUS_MASTER_INSTRUCTION)
      .replace('{GHOST_MEMORY_PLACEHOLDER}', ghostMemorySync);

    // Only load workspace files if explicitly requested in the prompt
    if (prompt.includes('FILE_READ:')) {
      const lookaheadRegex = /===\s*\[FILE_READ:\s*(.+?)\]\s*===/gi;
      let lookaheadMatch;
      let lookaheadContext = "";
      while ((lookaheadMatch = lookaheadRegex.exec(prompt)) !== null) {
        const path = lookaheadMatch[1].trim();
        lookaheadContext += `\n--- START OF FILE: ${path} ---\n${readLocalFileContent(path)}\n--- END OF FILE: ${path} ---\n`;
      }
      if (lookaheadContext) {
        resolvedBaseInstructions += `\n\n${lookaheadContext}`;
      }
    }

    // --- AUTONOMOUS MULTI-TOOL DETECTION (Search + Explicit Canvas + Prism Visual Fusion) ---
    const autoSearchTriggered =
      isWebSearchEnabled ||
      /ابحث في الويب|ابحث عن|بحث ويب|آخر الأخبار|اخر الاخبار|أخبار اليوم|اخبار اليوم|أحدث الأخبار|سعر اليوم|أسعار العملات|أسعار الأسهم|رابط موقع|مصادر موثوقة|إحصائيات حديثة|search the web|search online|latest news|breaking news|stock price|current price|https?:\/\//i.test(prompt);

    const autoCanvasTriggered =
      Boolean(isCanvasMode) ||
      /في الكانفاس|افتح الكانفاس|داخل الكانفاس|استخدم الكانفاس|في وضع الوكيل|وضع الوكيل|كالماء|ابني مشروع|ابنِ مشروع|ابني تطبيق|ابنِ تطبيق|صمم تطبيق|اصنع تطبيق|طور تطبيق|ابني موقع|صمم موقع|ابني لعبة|صمم لعبة|ابني نظام|مشروع متكامل|تطبيق متكامل|عمل عظيم|مشروع ضخم|موسوعة متكاملة|رواية متعددة الفصول|ai studio|in canvas|open canvas|build an? app|create an? app|full project/i.test(prompt);

    const hasImageAttachmentSync = Boolean(
      attachments?.some(a => a.mimeType?.startsWith('image/') && a.data)
    );
    const visualIntentSync = detectVisualGenerationIntent(prompt, {
      hasImageAttachment: hasImageAttachmentSync
    });
    const autoVisualRequested = visualIntentSync.requested;

    const correctionsAndLabContext = buildCoreKnowledgeAndCorrectionsPrompt(
      memoryBank,
      (effortScalarB || compTelemetry.effortScalarB) >= 98,
      memoryBank?.defaultSuccessCriteria,
      loadGlobalNexusPowerFromDisk(),
      prompt
    );

    const syncFocusForHygiene = detectNexusCognitiveFocusMode(prompt);
    const keepPostDigestionSync = syncFocusForHygiene === 'ENGINEERING_ARCHITECTURE';
    let activeSystemInstruction = [
      resolvedBaseInstructions.trim(),
      keepPostDigestionSync ? postDigestionInstruction : '',
      interleavedThoughtBridge,
      correctionsAndLabContext
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    activeSystemInstruction += buildUserPreferencesInstructionBlock(memoryBank?.userPreferences, prompt);
    const syncCorrectionsBlock = buildUserCorrectionsDirective(memoryBank?.userCorrections);
    if (syncCorrectionsBlock) {
      activeSystemInstruction += `\n\n${syncCorrectionsBlock}`;
    }

    if (autoCanvasTriggered) {
      activeSystemInstruction += `\n\n${FLUID_AGENT_AND_GRAND_CREATION_DIRECTIVE}`;
    }

    const isWorkspaceRelevant =
      /@gmail|@drive|@docs|@sheets|@slides|@calendar|بريد|إيميل|ايميل|تقويم|موعد|اجتماع|مستند جوجل|جدول بيانات|GOOGLE WORKSPACE/i.test(
        `${prompt} ${cleanedGlobalMem}`
      );
    if (isWorkspaceRelevant) {
      activeSystemInstruction += `\n\n${buildWorkspaceActionDirective()}`;
    }

    const directFileReqSync = detectDirectFileFormatRequest(prompt);
    const preTerminalPass = executeAutonomousPreCognitionTerminalPass(prompt);
    if (preTerminalPass.triggered && preTerminalPass.traceLineAr) {
      compTelemetry.algorithmicStagesAr.push(preTerminalPass.traceLineAr);
      compTelemetry.computedTraceAr = `${compTelemetry.computedTraceAr}\n${preTerminalPass.traceLineAr}`;
    }

    if (directFileReqSync.requested || preTerminalPass.triggered || autoCanvasTriggered) {
      activeSystemInstruction += `\n\n${SOVEREIGN_TERMINAL_AND_PDF_ARCHITECT_DIRECTIVE}`;
    }
    if (preTerminalPass.triggered && preTerminalPass.stdout) {
      activeSystemInstruction += `\n\nمخرجات التيرمنال الحية أمامي الآن:\n${preTerminalPass.stdout}`;
    }

    const modelToUse =
      selectedModel && selectedModel !== 'auto-selection'
        ? selectedModel
        : compTelemetry.effortScalarB >= 98 || quantumProfile.tier !== 'agile'
        ? 'nexus-4-pro'
        : 'nexus-4-flash';

    const syncCascadePreview = resolveStrictModelCascade(modelToUse, enableProFallback);
    const syncPrimaryCandidate = syncCascadePreview[0] || '';

    const isSyncWebSearchExclusive =
      autoSearchTriggered &&
      !autoCanvasTriggered &&
      !directFileReqSync.requested &&
      !autoVisualRequested;

    const wantsSyncFunctionTools = !isSyncWebSearchExclusive && (autoVisualRequested || hasImageAttachmentSync);
    const useSyncHybridTools =
      autoSearchTriggered && wantsSyncFunctionTools && supportsNativeHybridTools(syncPrimaryCandidate);

    const buildSyncToolsForModel = (
      targetModel: string,
      allowHybrid: boolean = true,
      allowSearch: boolean = true
    ): { tools?: any[]; toolConfig?: any } => {
      if (isSyncWebSearchExclusive) {
        return allowSearch ? { tools: [{ googleSearch: {} }] } : {};
      }
      if (wantsSyncFunctionTools) {
        if (allowSearch && allowHybrid && autoSearchTriggered && supportsNativeHybridTools(targetModel)) {
          return {
            tools: [{ googleSearch: {} }, { functionDeclarations: [visualToolDeclaration] }],
            toolConfig: { includeServerSideToolInvocations: true }
          };
        }
        return { tools: [{ functionDeclarations: [visualToolDeclaration] }] };
      }
      if (allowSearch && autoSearchTriggered) {
        return { tools: [{ googleSearch: {} }] };
      }
      return {};
    };

    const { trimmedHistory, rollingSessionAnchorAr } = sanitizeHistoryAndBuildRollingAnchor(
      history || [],
      prompt,
      14
    );
    enforceInputContextBudget(trimmedHistory, currentParts, 120000);
    if (rollingSessionAnchorAr) {
      activeSystemInstruction += `\n\n${rollingSessionAnchorAr}`;
    }

    const syncRecentContext = trimmedHistory
      .slice(-4)
      .map(m => `${m.role === 'user' ? 'رفيقي' : 'أنا'}: ${(m.parts || []).map((p: any) => p.text || '').join(' ').slice(0, 400)}`)
      .filter(Boolean)
      .join('\n');
    const syncMemorySummary = [
      ...(memoryBank?.userCorrections || []).slice(0, 4).map(c => `ملاحظة: ${c.userCorrectionRule}`),
      ...(memoryBank?.axioms || [])
        .filter(a => a && a.content && !LEGACY_MEMORY_NOISE_RE.test(a.content))
        .slice(0, 5)
        .map(a => a.content),
      cleanedGlobalMem.slice(0, 500)
    ]
      .filter(Boolean)
      .join(' | ');

    let preSearchGroundingSync: any = undefined;
    // Skip sequential 12s pre-search whenever native Gemini 3/4 hybrid tools handle search + functions in 1 pass
    const needsSyncPreSearch = autoSearchTriggered && !isSyncWebSearchExclusive && !useSyncHybridTools;

    const [tesseractSyncRes, syncSearchPreRes] = await Promise.all([
      executeClaudeTesseractParallelDeepDive(
        ai,
        prompt,
        syncRecentContext,
        resolveStrictModelCascade(modelToUse, enableProFallback),
        {
          memorySummary: syncMemorySummary,
          isMaxEffortEnabled: compTelemetry.effortScalarB >= 98,
          thinkingDepth: memoryBank?.userPreferences?.thinkingDepth,
          strictModelOnly: !enableProFallback
        }
      ),
      needsSyncPreSearch
        ? (async () => {
            for (const sModel of prioritizeByQuotaCooldown(['gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'])) {
              try {
                const sRes: any = await Promise.race([
                  ai.models.generateContent({
                    model: sModel,
                    contents: `أبحث في الويب الحي عن أحدث المعطيات والحقائق والمصادر الموثوقة المباشرة المرتبطة بـ:\n"${prompt}"`,
                    config: {
                      safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                      tools: [{ googleSearch: {} }]
                    }
                  }),
                  new Promise<never>((_, rej) => setTimeout(() => rej(new Error('SEARCH_PREPASS_TIMEOUT')), 12000))
                ]);
                const txt = (sRes?.text || '').trim();
                const gm = sRes?.candidates?.[0]?.groundingMetadata;
                if (txt) return { text: txt, groundingMetadata: gm };
              } catch (sErr: any) {
                markModelQuotaCooldown(sModel, sErr);
              }
            }
            return null;
          })()
        : Promise.resolve(null)
    ]);

    if (syncSearchPreRes?.text) {
      activeSystemInstruction += `\n\n[نتائج بحث الويب الحي الموثقة لهذه اللحظة]:\n${syncSearchPreRes.text.slice(0, 3500)}`;
      preSearchGroundingSync = syncSearchPreRes.groundingMetadata;
    }
    if (tesseractSyncRes.activated && tesseractSyncRes.combinedTesseractContextForSynthesis) {
      activeSystemInstruction += `\n\n${tesseractSyncRes.combinedTesseractContextForSynthesis}`;
    }
    const syncLangAnchor = buildDynamicLanguageMirrorAnchor(prompt, memoryBank?.userPreferences?.responseLanguage);
    if (syncLangAnchor) {
      activeSystemInstruction += `\n\n${syncLangAnchor}`;
    }

    const usedTools: string[] = [];
    if (preTerminalPass.triggered) usedTools.push('التيرمنال السيادي الحي (Python3/Bash)');
    if (autoSearchTriggered) usedTools.push('بحث الويب الحي');
    if (autoCanvasTriggered) usedTools.push('الكانفاس البرمجي');
    if (autoVisualRequested) usedTools.push('توليد الصور');

    let deepResponse: any;
    const releaseSyncSlot = acquireModelCallSlot();
    try {
      deepResponse = await callWithFallback(
        modelToUse, 
        'refine', 
        async (model) => {
          const isHighEffortSync = compTelemetry.effortScalarB >= 98;
          const thinkingCfgFull = isAgileCleanTurnSync && !isHighEffortSync
            ? buildModelThinkingConfig(model, 30, false, 'level_only', {
                includeThoughts: false,
                subagentDepth: 'low'
              })
            : buildModelThinkingConfig(model, compTelemetry.effortScalarB, isHighEffortSync, 'full');
          const primaryToolPayload = buildSyncToolsForModel(model, true);
          try {
            const res = await ai.models.generateContent({
              model: model,
              contents: [
                ...trimmedHistory,
                { role: 'user', parts: currentParts }
              ],
              config: {
                systemInstruction: activeSystemInstruction,
                safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                ...thinkingCfgFull,
                ...primaryToolPayload
              }
            });
            const checkParts = res.candidates?.[0]?.content?.parts || [];
            if (checkParts.length === 0 && !res.text) {
              throw new Error('EMPTY_CANDIDATE_RESPONSE');
            }
            return res;
          } catch (innerErr: any) {
            const msg = String(innerErr?.message || '');
            const hasSearchToolAttached = Boolean(
              primaryToolPayload.tools?.some((t: any) => t && 'googleSearch' in t)
            );
            const isSearchQuotaErr =
              hasSearchToolAttached &&
              /429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg);

            // Separate Google Search Grounding quota can hit 429 even when the base model has healthy quota:
            // degrade gracefully once without googleSearch so we never fail the turn or poison the model's cooldown!
            if (isSearchQuotaErr) {
              const noSearchToolPayload = buildSyncToolsForModel(model, false, false);
              const searchDegradedNote =
                '\n\n[ملاحظة تشغيلية داخلية: بحث الويب الحي غير متاح مؤقتاً؛ أجب من معرفتي الثابتة بوضوح وصدق دون اختلاق بيانات حية.]';
              const degradedRes = await ai.models.generateContent({
                model: model,
                contents: [
                  ...trimmedHistory,
                  { role: 'user', parts: currentParts }
                ],
                config: {
                  systemInstruction: `${activeSystemInstruction}${searchDegradedNote}`,
                  safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                  ...thinkingCfgFull,
                  ...noSearchToolPayload
                }
              });
              const checkPartsDegraded = degradedRes.candidates?.[0]?.content?.parts || [];
              if (checkPartsDegraded.length > 0 || degradedRes.text) {
                return degradedRes;
              }
            }

            const isConfigOrThinkingErr = /thinking|INVALID_ARGUMENT|toolConfig|includeServerSideToolInvocations|\b400\b/i.test(msg);
            const isEmptyCandidateErr = msg.includes('EMPTY_CANDIDATE_RESPONSE');
            if (isConfigOrThinkingErr || isEmptyCandidateErr) {
              const safeToolPayload = buildSyncToolsForModel(model, false, true);
              const thinkingCfgLevelOnly = buildModelThinkingConfig(model, compTelemetry.effortScalarB, false, 'level_only');
              try {
                const levelRes = await ai.models.generateContent({
                  model: model,
                  contents: [
                    ...trimmedHistory,
                    { role: 'user', parts: currentParts }
                  ],
                  config: {
                    systemInstruction: activeSystemInstruction,
                    safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                    ...thinkingCfgLevelOnly,
                    ...safeToolPayload
                  }
                });
                const checkPartsLevel = levelRes.candidates?.[0]?.content?.parts || [];
                if (checkPartsLevel.length > 0 || levelRes.text) {
                  return levelRes;
                }
              } catch {
                // Only strip thinking completely when the API rejected thinking/tool config itself
                if (!isConfigOrThinkingErr) throw innerErr;
              }
              if (isConfigOrThinkingErr) {
                const fallbackRes = await ai.models.generateContent({
                  model: model,
                  contents: [
                    ...trimmedHistory,
                    { role: 'user', parts: currentParts }
                  ],
                  config: {
                    systemInstruction: activeSystemInstruction,
                    safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                    ...safeToolPayload
                  }
                });
                const checkParts2 = fallbackRes.candidates?.[0]?.content?.parts || [];
                if (checkParts2.length === 0 && !fallbackRes.text) {
                  throw new Error('EMPTY_CANDIDATE_RESPONSE');
                }
                return fallbackRes;
              }
            }
            throw innerErr;
          }
        }
      );
    } catch (error: any) {
      if (autoVisualRequested) {
        return {
          thoughtProcess: compTelemetry.computedTraceAr,
          finalResponse: 'أرسم لك المشهد الآن وأرسله مباشرة:',
          usedTools: ['توليد الصور'],
          kernelState,
          toolCall: {
            name: 'generate_visual_artifact',
            args: {
              prompt,
              aspect_ratio: '16:9',
              style: 'none'
            }
          },
          thinkingDuration: Math.max(1, Math.round((Date.now() - thinkingStartTimeMs) / 1000))
        };
      }
      // Never silently mask upstream model errors with fake heuristic prose (propagate honestly to caller)
      throw error;
    } finally {
      releaseSyncSlot();
    }

    const candidateParts = deepResponse.candidates?.[0]?.content?.parts || [];
    const nativeThoughtParts = candidateParts
      .filter((p: any) => p.thought && p.text)
      .map((p: any) => p.text)
      .join('\n\n');
    const regularTextParts = candidateParts
      .filter((p: any) => !p.thought && p.text)
      .map((p: any) => p.text)
      .join('\n');

    const rawStructure = regularTextParts || deepResponse.text || '';
    const groundingMetadata = deepResponse.candidates?.[0]?.groundingMetadata || preSearchGroundingSync;
    
    let prismCall = undefined;
    const functionCalls = deepResponse.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === "generate_visual_artifact") {
            prismCall = {
                name: call.name,
                args: call.args
            };
        }
    } else if (
      autoVisualRequested ||
      (!visualIntentSync.explicitPromptOnly && FALSE_VISUAL_UNAVAILABLE_REGEX.test(rawStructure))
    ) {
        prismCall = {
            name: "generate_visual_artifact",
            args: {
                prompt: extractBestPromptFromModelTextFallback(rawStructure, prompt),
                aspect_ratio: "16:9",
                style: "none"
            }
        };
    }

    const parsedOutput = extractThinkAndResponse(rawStructure, nativeThoughtParts, prompt, true);

    if ((groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) && !usedTools.includes('بحث الويب الحي')) {
      usedTools.push('بحث الويب الحي');
    }
    if (prismCall && !usedTools.includes('توليد الصور')) {
      usedTools.push('توليد الصور');
    }

    let sanitizedThoughtsText = parsedOutput.thoughtProcess;
    let sanitizedResponseText = parsedOutput.finalResponse;
    const syncFinishReason = String(deepResponse.candidates?.[0]?.finishReason || '').toUpperCase();

    // If sync generation hit MAX_TOKENS mid-sentence, run 1 clean seamless continuation pass to complete it
    if (syncFinishReason === 'MAX_TOKENS' && sanitizedResponseText.trim().length >= 80) {
      try {
        const syncContPrompt = buildLanguageMatchedContinuationPrompt({
          prompt,
          passIdx: 1,
          agentToolResultsContext: '',
          liveWorkspaceSummary: '',
          priorSurfaceDraftSnapshot: sanitizedResponseText,
          priorThoughtsSnapshot: sanitizedThoughtsText,
          hitMaxTokens: true
        });
        const contRes = await generateContentWithModelFallback(
          ai,
          {
            contents: [...trimmedHistory, { role: 'user', parts: [{ text: syncContPrompt }] }],
            config: {
              systemInstruction: activeSystemInstruction,
              safetySettings: SOVEREIGN_SAFETY_SETTINGS
            }
          },
          resolveStrictModelCascade(modelToUse, true)
        );
        const contText = (contRes.text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        if (contText.length >= 15) {
          sanitizedResponseText = `${sanitizedResponseText.trimEnd()}\n${contText}`;
        }
      } catch {
        // Keep captured response if continuation fails
      }
    }

    // If the model put everything inside <think> without closing </think>, run a fast completion pass for the final response
    if (!sanitizedResponseText || sanitizedResponseText.trim().length < 30) {
      try {
        const directManifest = buildLanguageMatchedManifestationPrompt({
          prompt,
          preservedThoughtDigest: sanitizedThoughtsText || compTelemetry.computedTraceAr,
          trimmedFinalSurface: sanitizedResponseText
        });
        const directCompletion = await generateContentWithModelFallback(
          ai,
          {
            contents: directManifest,
            config: {
              systemInstruction: activeSystemInstruction,
              safetySettings: SOVEREIGN_SAFETY_SETTINGS
            }
          },
          resolveStrictModelCascade(modelToUse, true)
        );
        const directText = (directCompletion.text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^<think>/i, '').trim();
        if (directText.length > 20) {
          sanitizedResponseText = directText;
        }
      } catch {
        // Fallback below if direct completion also fails
      }
    }

    try {
      if (sanitizedThoughtsText) {
        const resThoughts = parseAndExecuteSovereignDirectives(sanitizedThoughtsText);
        sanitizedThoughtsText = resThoughts.sanitizedText;
      }
      if (sanitizedResponseText) {
        const resResponse = parseAndExecuteSovereignDirectives(sanitizedResponseText);
        sanitizedResponseText = resResponse.sanitizedText;
      }
    } catch {
      // Ignore directive parse error
    }

    const terminalExecRes = executeAgentTerminalDirectivesInOutput(sanitizedResponseText, sanitizedThoughtsText);
    sanitizedResponseText = terminalExecRes.cleanedResponse;
    sanitizedThoughtsText = terminalExecRes.cleanedThought;
    if (terminalExecRes.executedEntries.length > 0 && !usedTools.includes('التيرمنال السيادي الحي (Python3/Bash)')) {
      usedTools.push('التيرمنال السيادي الحي (Python3/Bash)');
    }

    const inlineVisualRes = extractInlineVisualArtifactDirective(sanitizedResponseText);
    sanitizedResponseText = inlineVisualRes.cleanedText;
    if (inlineVisualRes.extractedPrompt && !prismCall) {
      prismCall = {
        name: 'generate_visual_artifact',
        args: {
          prompt: inlineVisualRes.extractedPrompt,
          aspect_ratio: inlineVisualRes.aspectRatio || '16:9',
          style: inlineVisualRes.style || 'none'
        }
      };
      if (!usedTools.includes('توليد الصور')) {
        usedTools.push('توليد الصور');
      }
    }

    const finalCleanThought = applyOpVeilThoughtSanitizer(sanitizedThoughtsText, prompt);
    sanitizedThoughtsText = finalCleanThought
      ? `${finalCleanThought}${terminalExecRes.thoughtLogBlockAr ? '\n\n' + terminalExecRes.thoughtLogBlockAr : ''}`
      : (terminalExecRes.thoughtLogBlockAr ? terminalExecRes.thoughtLogBlockAr.trim() : '');
    sanitizedResponseText = applyOpVeilSurfaceSanitizer(sanitizedResponseText, prompt);

    // LAYER 4: Real Post-Thought Quantum Trajectory Harvest & Arbitration Pass (Sync)
    const syncIsMaxEffort = compTelemetry.effortScalarB >= 98;
    const syncIsFastDepth = memoryBank?.userPreferences?.thinkingDepth === 'fast' && !syncIsMaxEffort;
    const syncFocusMode = detectNexusCognitiveFocusMode(prompt);
    const syncBrevityReq =
      /(?:قصير|مختصر|باختصار|موجز|أسطر|سطرين|ثلاثة أسطر|جملة واحدة|في سطر|brief|short|concise|lines)/i.test(prompt);
    if (!syncIsFastDepth && !prismCall && sanitizedResponseText.length >= 60) {
      const quantumAuditSync = auditQuantumTrajectoryHarvest({
        prompt,
        thoughtText: finalCleanThought,
        surfaceResponse: sanitizedResponseText,
        focusMode: syncFocusMode,
        isMaxEffortEnabled: syncIsMaxEffort,
        userRequestedBrevity: syncBrevityReq
      });
      const syncLatencyExceeded = Date.now() - thinkingStartTimeMs > 46000;
      // Bicameral Zero-Point Rule: never overwrite an already-sharp primary Manifestation voice!
      // Trigger Layer 4 strictly when quantumAudit detects a genuine dropped-spark / cliché / collapse defect.
      const allowSyncLayer4 =
        quantumAuditSync.needsQuantumArbitration &&
        (syncIsMaxEffort ||
          (!syncLatencyExceeded && !shouldShedAuxiliaryModelPasses()) ||
          isCriticalLayer4Defect(quantumAuditSync));

      if (allowSyncLayer4) {
        try {
          const arbPrompt = buildQuantumArbitratorPrompt({
            prompt,
            thoughtText: finalCleanThought,
            initialDraft: sanitizedResponseText,
            audit: quantumAuditSync,
            focusMode: syncFocusMode
          });
          const routedPrimarySyncModel = (deepResponse as any)?.__routedModel || modelToUse;
          const shieldedSyncArb = getQuotaShieldedAuxiliaryCascade(
            routedPrimarySyncModel,
            resolveStrictModelCascade(modelToUse, enableProFallback),
            !enableProFallback
          );
          const syncArbCascade = (
            shieldedSyncArb.length > 0
              ? shieldedSyncArb
              : quantumAuditSync.needsQuantumArbitration
              ? [routedPrimarySyncModel]
              : []
          ).slice(0, 2);
          if (syncArbCascade.length > 0) {
          const syncArbThinkingCfg = buildModelThinkingConfig(
            syncArbCascade[0] || modelToUse,
            compTelemetry.effortScalarB,
            false,
            'level_only',
            { includeThoughts: false, subagentDepth: quantumAuditSync.needsQuantumArbitration ? 'medium' : 'low' }
          );
          const arbRes = await generateContentWithModelFallback(
            ai,
            {
              contents: [{ role: 'user', parts: [{ text: arbPrompt }] }],
              config: {
                systemInstruction: SURFACE_REFINER_INSTRUCTION,
                safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                ...syncArbThinkingCfg
              }
            },
            syncArbCascade
          );
          const elevatedText = applyOpVeilSurfaceSanitizer(
            (arbRes.text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim(),
            prompt
          );
          if (elevatedText.length >= Math.max(80, Math.floor(sanitizedResponseText.length * 0.6))) {
            sanitizedResponseText = elevatedText;
          }
          }
        } catch {
          // Keep original sanitized response if Holographic Projector pass fails
        }
      }
    }

    if (prismCall?.name === 'generate_visual_artifact' && FALSE_VISUAL_UNAVAILABLE_REGEX.test(sanitizedResponseText || '')) {
      sanitizedResponseText = '';
    }

    const measuredThinkingDurationSec = Math.max(1, Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1)));

    const defaultEmptyFallback = /[\u0600-\u06FF]/.test(prompt)
      ? 'أهلاً بك — أنا معك، أخبرني بما في بالك الآن.'
      : "I'm here with you — tell me what's on your mind.";

    return {
      thoughtProcess: sanitizedThoughtsText,
      finalResponse: sanitizedResponseText || defaultEmptyFallback,
      groundingMetadata: groundingMetadata,
      toolCall: prismCall,
      usedTools,
      kernelState,
      thinkingDuration: measuredThinkingDurationSec,
      routedModel: (deepResponse as any)?.__routedModel
    };

  } catch (error: any) {
    throw error;
  }
};


// --- REAL-TIME STREAMING RESPONSE ENGINE (Live Computational Thinking Stream + Extended TPU Reasoning + Live Response Stream) ---
export const streamOmniResponseServer = async (
  params: {
    prompt: string;
    history: { role: string; parts: { text?: string; inlineData?: any }[] }[];
    attachments?: Attachment[];
    globalMemoryContext?: string;
    isWebSearchEnabled?: boolean;
    isCanvasMode?: boolean;
    selectedModel?: string;
    memoryBank?: MemoryBank;
    isMaxEffortEnabled?: boolean;
    isAgentModeEnabled?: boolean;
    enableProFallback?: boolean;
    sessionId?: string;
    customSuccessCriteria?: string[];
  },
  onChunk: (chunkData: {
    type: 'delta' | 'done';
    thoughtProcess: string;
    finalResponse: string;
    isThinkingPhase: boolean;
    groundingMetadata?: any;
    toolCall?: any;
    usedTools?: string[];
    thinkingDuration?: number;
    kernelState?: any;
    routedModel?: string;
    recursiveLabEvaluation?: RecursiveLabEvaluation;
  }) => void
): Promise<void> => {
  const ai = getAIClient();
  const {
    prompt,
    history = [],
    attachments = [],
    globalMemoryContext = '',
    isWebSearchEnabled = false,
    isCanvasMode = false,
    selectedModel = 'nexus-4-flash',
    memoryBank,
    isMaxEffortEnabled = false,
    isAgentModeEnabled = false,
    enableProFallback = true,
    sessionId,
    customSuccessCriteria
  } = params;

  const thinkingStartTimeMs = Date.now();
  let thinkingEndTimeMs: number | null = null;

  // Build context-aware history snippet (always preserve last 4 turns for Tesseract & continuity)
  const promptWordCount = (prompt || '').trim().split(/\s+/).filter(Boolean).length;
  const recentHistoryContext =
    Array.isArray(history) && history.length > 0
      ? history
          .slice(-4)
          .map(m => {
            const speaker = m.role === 'user' ? 'رفيقي' : 'أنا';
            const body = Array.isArray(m.parts)
              ? m.parts.map(p => p.text || '').join(' ').slice(0, 400)
              : '';
            return body ? `${speaker}: ${body}` : '';
          })
          .filter(Boolean)
          .join('\n')
      : '';
  const contextualAnalysisPrompt =
    promptWordCount <= 20 && recentHistoryContext
      ? `${prompt} [سياق الحوار السابق: ${recentHistoryContext.slice(0, 600)}]`
      : prompt;

  const resolvedStreamInitialEffort = isMaxEffortEnabled
    ? 100
    : memoryBank?.userPreferences?.thinkingDepth === 'deep'
    ? 96
    : memoryBank?.userPreferences?.thinkingDepth === 'fast'
    ? 32
    : undefined;

  // Execute real mathematical, memory-graph, AST & topological computation BEFORE model generation
  const compTelemetry = executeRealComputationalThinkingPass(
    contextualAnalysisPrompt,
    memoryBank,
    history?.length || 0,
    resolvedStreamInitialEffort
  );

  const isTechnicalOrCoding =
    isCanvasMode ||
    isAgentModeEnabled ||
    /كود|برمجة|موقع|برنامج|تطبيق|قاعدة بيانات|خوارزمية|\b(?:sql|code|programming|database|develop|implement|architecture|react|node|python|typescript)\b/i.test(prompt);

  const autoSearchTriggered =
    isWebSearchEnabled ||
    /ابحث في الويب|ابحث عن|بحث ويب|آخر الأخبار|اخر الاخبار|أخبار اليوم|اخبار اليوم|أحدث الأخبار|سعر اليوم|أسعار العملات|أسعار الأسهم|رابط موقع|مصادر موثوقة|إحصائيات حديثة|search the web|search online|latest news|breaking news|stock price|current price|https?:\/\//i.test(prompt);

  const autoCanvasTriggered =
    Boolean(isCanvasMode) ||
    Boolean(isAgentModeEnabled) ||
    /في الكانفاس|افتح الكانفاس|داخل الكانفاس|استخدم الكانفاس|في وضع الوكيل|وضع الوكيل|كالماء|ابني مشروع|ابنِ مشروع|ابني تطبيق|ابنِ تطبيق|صمم تطبيق|اصنع تطبيق|طور تطبيق|ابني موقع|صمم موقع|ابني لعبة|صمم لعبة|ابني نظام|مشروع متكامل|تطبيق متكامل|عمل عظيم|مشروع ضخم|موسوعة متكاملة|رواية متعددة الفصول|قصة متعددة الفصول|ملحمة سردية|كتاب متكامل|ai studio|in canvas|open canvas|build an? app|create an? app|full project|write a full novel/i.test(prompt);

  const agentWorkspace = createAgentWorkspaceState(sessionId);

  const hasImageAttachmentStream = Boolean(
    attachments?.some(a => a.mimeType?.startsWith('image/') && a.data)
  );
  const hasRecentVisualInHistory = Boolean(
    Array.isArray(history) &&
      history.some((m: any) =>
        Boolean(m?.generatedImage || m?.parts?.some((p: any) => p?.inlineData?.mimeType?.startsWith('image/')))
      )
  );
  const visualIntentStream = detectVisualGenerationIntent(prompt, {
    hasImageAttachment: hasImageAttachmentStream,
    hasRecentGeneratedImage: hasRecentVisualInHistory
  });
  const autoVisualRequested = visualIntentStream.requested;

  const activeCriteria =
    customSuccessCriteria && customSuccessCriteria.length > 0
      ? customSuccessCriteria
      : memoryBank?.defaultSuccessCriteria && memoryBank.defaultSuccessCriteria.length > 0
      ? memoryBank.defaultSuccessCriteria
      : DEFAULT_SUCCESS_CRITERIA;

  const quantumProfile = analyzeQuantumComplexity(prompt, history?.length || 0);
  const styleDirective = memoryBank?.soulPrint ? computeStyleDirective(memoryBank.soulPrint) : '';
  const { systemInstruction: postDigestionInstruction, kernelState } = buildNativePostDigestionSystemInstruction(
    contextualAnalysisPrompt,
    memoryBank,
    history?.length || 0,
    compTelemetry.effortScalarB
  );
  const cleanedStreamGlobalMem = sanitizeMemoryContextForPrompt(
    globalMemoryContext || '',
    Boolean(memoryBank?.userPreferences)
  );
  const rawStreamSubmergedPrompt =
    quantumProfile.tier === 'agile'
      ? ''
      : buildCosmicThinkingChainPrompt(contextualAnalysisPrompt, memoryBank);
  const submergedFieldPrompt =
    rawStreamSubmergedPrompt && cleanedStreamGlobalMem.includes(rawStreamSubmergedPrompt.slice(0, 60))
      ? ''
      : rawStreamSubmergedPrompt;
  const sharedGlobalPowerState = loadGlobalNexusPowerFromDisk();
  const correctionsAndLabPrompt = buildCoreKnowledgeAndCorrectionsPrompt(
    memoryBank,
    isMaxEffortEnabled,
    activeCriteria,
    sharedGlobalPowerState,
    prompt
  );

  const streamInterleavedDigests =
    quantumProfile.tier !== 'agile' && Array.isArray(history)
      ? history
          .slice(-4)
          .map((h: any) =>
            typeof h?.thoughtDigest === 'string'
              ? applyOpVeilThoughtSanitizer(h.thoughtDigest, prompt).trim()
              : ''
          )
          .filter(Boolean)
          .slice(-2)
      : [];
  const streamThoughtBridge =
    streamInterleavedDigests.length > 0
      ? `خيط تفكيري المستمر من أدوارنا السابقة في هذه الجلسة:\n${streamInterleavedDigests
          .map((d, i) => `(${i + 1}) ${d.slice(0, 480)}`)
          .join('\n')}`
      : '';

  const isAgileCleanTurnStream =
    quantumProfile.tier === 'agile' &&
    !isCanvasMode &&
    !isAgentModeEnabled &&
    !isWebSearchEnabled &&
    !autoCanvasTriggered &&
    !autoSearchTriggered &&
    !autoVisualRequested &&
    (!attachments || attachments.length === 0);

  const streamFocusForHygiene = detectNexusCognitiveFocusMode(prompt);
  const keepPostDigestionStream = streamFocusForHygiene === 'ENGINEERING_ARCHITECTURE';
  const ghostMemoryStream = buildGhostMemory({
    soulPrintDirective: styleDirective,
    cleanedGlobalMemory: cleanedStreamGlobalMem,
    retrievedShards: submergedFieldPrompt,
    maxMemoryChars: isAgileCleanTurnStream ? 1500 : 3600
  });
  let activeSystemInstruction = [
    (isAgileCleanTurnStream ? NEXUS_AGILE_VOICE_INSTRUCTION : NEXUS_MASTER_INSTRUCTION)
      .replace('{GHOST_MEMORY_PLACEHOLDER}', ghostMemoryStream)
      .trim(),
    keepPostDigestionStream ? postDigestionInstruction : '',
    streamThoughtBridge,
    correctionsAndLabPrompt
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();

  // Apply Complete Regular & Advanced User Preferences from Settings without duplication
  activeSystemInstruction += buildUserPreferencesInstructionBlock(memoryBank?.userPreferences, prompt);
  const streamCorrectionsBlock = buildUserCorrectionsDirective(memoryBank?.userCorrections);
  if (streamCorrectionsBlock) {
    activeSystemInstruction += `\n\n${streamCorrectionsBlock}`;
  }

  if (autoCanvasTriggered) {
    activeSystemInstruction += `\n\n${FLUID_AGENT_AND_GRAND_CREATION_DIRECTIVE}`;
  }

  const isWorkspaceRelevant =
    /@gmail|@drive|@docs|@sheets|@slides|@calendar|بريد|إيميل|ايميل|تقويم|موعد|اجتماع|مستند جوجل|جدول بيانات|GOOGLE WORKSPACE/i.test(
      `${prompt} ${cleanedStreamGlobalMem}`
    );
  if (isWorkspaceRelevant) {
    activeSystemInstruction += `\n\n${buildWorkspaceActionDirective()}`;
  }

  const preTerminalPass = executeAutonomousPreCognitionTerminalPass(prompt);
  if (preTerminalPass.triggered && preTerminalPass.traceLineAr) {
    compTelemetry.algorithmicStagesAr.push(preTerminalPass.traceLineAr);
    compTelemetry.computedTraceAr = `${compTelemetry.computedTraceAr}\n${preTerminalPass.traceLineAr}`;
  }

  const directFileReq = detectDirectFileFormatRequest(prompt);
  if (directFileReq.requested || preTerminalPass.triggered || autoCanvasTriggered || isAgentModeEnabled) {
    activeSystemInstruction += `\n\n${SOVEREIGN_TERMINAL_AND_PDF_ARCHITECT_DIRECTIVE}`;
  }
  if (directFileReq.requested) {
    activeSystemInstruction += `\n\nيطلب مني رفيقي ملفاً مستقلاً بصيغة (.${directFileReq.ext.toUpperCase()}) باسم مقترح "${directFileReq.suggestedFilename}"، فأضع المتن الصافي الكامل داخل <nexus_file_artifact filename="${directFileReq.suggestedFilename}" format="${directFileReq.ext}" ...> مع رسالة محادثة موجزة وذكية خارجه.`;
  }
  if (preTerminalPass.triggered && preTerminalPass.stdout) {
    activeSystemInstruction += `\n\nمخرجات التيرمنال الحية أمامي الآن:\n${preTerminalPass.stdout}`;
  }

  const initialToolsList: string[] = [];
  if (isMaxEffortEnabled) initialToolsList.push('مختبر المسارات الفرعية (أقصى جهد)');
  if (preTerminalPass.triggered || directFileReq.requested) initialToolsList.push('التيرمنال السيادي الحي (Python3/Bash)');
  if (autoSearchTriggered) initialToolsList.push('بحث الويب الحي');
  if (autoCanvasTriggered && !directFileReq.requested) initialToolsList.push('الكانفاس البرمجي');
  if (autoVisualRequested) initialToolsList.push('توليد الصور');

  let activeLabEvaluation: RecursiveLabEvaluation | undefined = isMaxEffortEnabled
    ? buildBaselineSubThinkingEvaluation(prompt, activeCriteria, initialToolsList)
    : undefined;

  const effectiveModelSelection =
    selectedModel && selectedModel !== 'auto-selection'
      ? selectedModel
      : isMaxEffortEnabled || isAgentModeEnabled || quantumProfile.tier !== 'agile'
      ? 'nexus-4-pro'
      : 'nexus-4-flash';
  const fallbacks = resolveStrictModelCascade(effectiveModelSelection, enableProFallback);

  const currentParts: any[] = [{ text: prompt }];
  if (attachments && attachments.length > 0) {
    attachments.forEach(file => {
      const mime = (file.mimeType || '').toLowerCase();
      const isMultimodalNative =
        mime.startsWith('image/') ||
        mime.startsWith('audio/') ||
        mime.startsWith('video/') ||
        (mime === 'application/pdf' && file.data && file.data.length < 22_000_000);

      if (file.data && isMultimodalNative) {
        currentParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data.replace(/^data:[^;]+;base64,/i, '')
          }
        });
      } else if (file.extractedRagText && !prompt.includes(file.name)) {
        currentParts.push({
          text: `\n\n=== [محتوى الملف المرفق والمفهرس عبر RAG: ${file.name} (${file.detectedFormat || 'FILE'})] ===\n${file.extractedRagText.slice(0, 90000)}\n=== [نهاية محتوى الملف: ${file.name}] ===`
        });
      }
    });
  }

  const needsAgentFunctionTools = Boolean(
    isAgentModeEnabled ||
      autoCanvasTriggered ||
      directFileReq.requested ||
      preTerminalPass.triggered ||
      isTechnicalOrCoding ||
      /افحص\s+ملف|اقرأ\s+ملف|شجرة\s+الملفات|ملفات\s+المشروع|نفذ\s+في\s+التيرمنال|شغل\s+كود|سحب\s+صفحة/i.test(prompt)
  );

  const isWebSearchExclusive =
    autoSearchTriggered &&
    !isAgentModeEnabled &&
    !autoCanvasTriggered &&
    !directFileReq.requested &&
    !autoVisualRequested &&
    !needsAgentFunctionTools;

  const streamFunctionDeclarations: any[] = [];
  if (!isWebSearchExclusive && needsAgentFunctionTools) {
    streamFunctionDeclarations.push(
      visualToolDeclaration,
      ...SOVEREIGN_AGENT_FUNCTION_DECLARATIONS
    );
    if (autoCanvasTriggered || isAgentModeEnabled) {
      activeSystemInstruction += `\n\nتتوفر لي في هذه الجلسة أدوات تنفيذية حقيقية متصلة بنظام الملفات والتيرمنال ومحرك صكّ الوثائق والعمل المتوازي والتجسيد البصري:
1. \`workspace_list_and_read\`: أستكشف وأقرأ بها ملفات مساحة العمل أو ملفات المشروع الحقيقية على القرص.
2. \`workspace_write_file\`: أكتب وأحفظ بها أي ملف (كود برمجي أو فصل روائي/موسوعي كامل) فعلياً على القرص ومزامنته مع الكانفاس الحي.
3. \`workspace_apply_patch\`: أُجري بها تعديلاً جراحياً دقيقاً (Search-Replace) على ملف موجود دون إعادة كتابته بالكامل.
4. \`execute_terminal_sandbox\`: أشغّل بها كود Python 3 / Node.js / Bash حقيقي في التيرمنال وأقرأ مخرجاته الحقيقية أو أولّد بها ملفات وسائط وأرشيفات.
5. \`spawn_subagent_swarm\`: أوزّع بها بناء ملفات المشروع أو فصول العمل الكبير بالتوازي في آنٍ واحد.
6. \`web_cortex_fetch\`: أسحب وأحلل بها أي صفحة ويب أو واجهة API خارجية بالوقت الفعلي.
7. \`verify_and_package_workspace\`: أفحص بها سلامة الكود وأحزم جميع ملفات مساحة العمل في أرشيف ZIP حقيقي قابل للتحميل المباشر.
8. \`forge_bespoke_document_artifact\`: أصنع بها وثيقة أو كتاباً مستقلاً مخصصاً (\`.pdf\`, \`.docx\`, \`.xlsx\`, \`.pptx\`, \`.epub\`, \`.html\`, \`.md\`) بهندسة بصرية وتايبوجرافية حرة بالكامل.
9. \`generate_visual_artifact\`: أرسم وأجسّد بها الصور الفنية وأعدّلها فوراً.`;
    }
  } else if (!isWebSearchExclusive && (autoVisualRequested || hasImageAttachmentStream || hasRecentVisualInHistory)) {
    // Attach visual tool schema ONLY when the conversation actually touches visuals — pure text/philosophical/literary turns stay completely clean
    streamFunctionDeclarations.push(visualToolDeclaration);
  }

  const useStreamNativeHybridTools = Boolean(
    autoSearchTriggered &&
      !isWebSearchExclusive &&
      streamFunctionDeclarations.length > 0 &&
      supportsNativeHybridTools(fallbacks[0] || '')
  );

  const buildStreamToolsForModel = (
    targetModel: string,
    allowHybrid: boolean = true,
    allowSearch: boolean = true
  ): { tools?: any[]; toolConfig?: any } => {
    if (isWebSearchExclusive) {
      return allowSearch ? { tools: [{ googleSearch: {} }] } : {};
    }
    if (streamFunctionDeclarations.length > 0) {
      if (allowSearch && allowHybrid && autoSearchTriggered && supportsNativeHybridTools(targetModel)) {
        return {
          tools: [{ googleSearch: {} }, { functionDeclarations: streamFunctionDeclarations }],
          toolConfig: { includeServerSideToolInvocations: true }
        };
      }
      return { tools: [{ functionDeclarations: streamFunctionDeclarations }] };
    }
    if (allowSearch && autoSearchTriggered) {
      return { tools: [{ googleSearch: {} }] };
    }
    return {};
  };

  const { trimmedHistory, rollingSessionAnchorAr } = sanitizeHistoryAndBuildRollingAnchor(
    history || [],
    prompt,
    14
  );
  enforceInputContextBudget(trimmedHistory, currentParts, 120000);
  if (rollingSessionAnchorAr) {
    activeSystemInstruction += `\n\n${rollingSessionAnchorAr}`;
  }

  // Progressive Algorithmic Pre-Cognition Heartbeat while the TPU executes deep extended reasoning
  let latestNeuralThought = '';
  let latestSurfaceResponse = '';
  let isCurrentlyThinking = true;
  let latestGrounding: any = undefined;

  // Zero-flicker Phase 1 → Phase 2 Holographic Projector gating:
  // When Phase 2 Holographic Projector is scheduled to crystallize the final prose, hold Phase 1's raw
  // surface draft in memory while streaming live thinking (thoughtProcess) so the user NEVER sees
  // Phase 1 text suddenly wiped and replaced mid-read!
  const streamIsFastDepthEarly = memoryBank?.userPreferences?.thinkingDepth === 'fast' && !isMaxEffortEnabled;
  const streamFocusEarly = detectNexusCognitiveFocusMode(prompt);
  const streamUserRequestedBrevity =
    /(?:قصير|مختصر|باختصار|موجز|أسطر|سطرين|ثلاثة أسطر|جملة واحدة|في سطر|brief|short|concise|lines)/i.test(
      prompt
    );
  const strictTightRpmSkipProjector = !enableProFallback && isTightRpmModel(fallbacks[0] || effectiveModelSelection);
  // Stream Primary Manifestation Chamber directly for instant latency & unflattened voice;
  // only buffer when Max Effort explicitly requests pre-surface double-pass verification.
  let shouldBufferPhase1ForHolographicProjector = Boolean(
    isMaxEffortEnabled &&
      !streamIsFastDepthEarly &&
      !strictTightRpmSkipProjector &&
      !streamUserRequestedBrevity &&
      !directFileReq.requested &&
      !autoVisualRequested &&
      !isCanvasMode &&
      !isAgentModeEnabled &&
      !autoCanvasTriggered &&
      streamFocusEarly !== 'CASUAL_WARM_CONVERSATION' &&
      streamFocusEarly !== 'ENGINEERING_ARCHITECTURE' &&
      !shouldShedAuxiliaryModelPasses()
  );
  let phase1SurfaceHeldForProjector = false;

  const buildProgressiveThoughtView = (_elapsedSec: number, neuralThought: string): string => {
    return applyOpVeilThoughtSanitizer(neuralThought || '', prompt);
  };

  // Emit initial thinking phase indicator with pure empty thoughtProcess until native model thoughts stream in
  onChunk({
    type: 'delta',
    thoughtProcess: '',
    finalResponse: '',
    isThinkingPhase: true,
    usedTools: initialToolsList,
    thinkingDuration: 0.2,
    kernelState,
    recursiveLabEvaluation: activeLabEvaluation
  });

  const heartbeatInterval = setInterval(() => {
    if (!isCurrentlyThinking) return;
    const elapsedSec = Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1));
    onChunk({
      type: 'delta',
      thoughtProcess: buildProgressiveThoughtView(elapsedSec, latestNeuralThought),
      finalResponse: phase1SurfaceHeldForProjector ? '' : latestSurfaceResponse,
      isThinkingPhase: true,
      groundingMetadata: latestGrounding,
      usedTools: agentWorkspace
        ? Array.from(new Set([...initialToolsList, ...Array.from(agentWorkspace.usedToolBadges)]))
        : initialToolsList,
      thinkingDuration: Math.max(0.3, elapsedSec)
    });
  }, 900);

  try {
    const streamMemorySummary = [
      ...(memoryBank?.userCorrections || []).slice(0, 4).map(c => `تصحيح: ${c.userCorrectionRule}`),
      ...(memoryBank?.axioms || [])
        .filter(a => a && a.content && !LEGACY_MEMORY_NOISE_RE.test(a.content))
        .slice(0, 5)
        .map(a => a.content),
      cleanedStreamGlobalMem.slice(0, 500)
    ]
      .filter(Boolean)
      .join(' | ');

    // Run quota-aware Orthogonal Collision Pre-Pass + optional parallel web grounding
    // Skip 12s pre-search whenever native Gemini 3/4 hybrid tools handle search + functions in ONE request
    const needsParallelPreSearch = Boolean(
      autoSearchTriggered && !isWebSearchExclusive && !useStreamNativeHybridTools
    );
    const [tesseractStreamRes, preSearchStreamRes] = await Promise.all([
      executeClaudeTesseractParallelDeepDive(
        ai,
        prompt,
        recentHistoryContext,
        fallbacks,
        {
          memorySummary: streamMemorySummary,
          isMaxEffortEnabled,
          thinkingDepth: memoryBank?.userPreferences?.thinkingDepth,
          strictModelOnly: !enableProFallback
        }
      ),
      needsParallelPreSearch
        ? (async () => {
            for (const sModel of getHydrogenExecutiveSubagentCascade(['gemini-4-hydrogen', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'])) {
              try {
                const subagentSearchCfg = buildModelThinkingConfig(sModel, 95, true, 'full');
                const sRes: any = await Promise.race([
                  ai.models.generateContent({
                    model: sModel,
                    contents: `أبحث في الويب الحي عن أحدث المعطيات والحقائق والمصادر الموثوقة المباشرة المرتبطة بـ:\n"${prompt}"`,
                    config: {
                      ...subagentSearchCfg,
                      safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                      tools: [{ googleSearch: {} }]
                    }
                  }),
                  new Promise<never>((_, rej) => setTimeout(() => rej(new Error('STREAM_PRE_SEARCH_TIMEOUT')), 12000))
                ]);
                const txt = (sRes?.text || '').trim();
                const gm = sRes?.candidates?.[0]?.groundingMetadata;
                if (txt) return { text: txt, groundingMetadata: gm };
              } catch (sErr: any) {
                markModelQuotaCooldown(sModel, sErr);
              }
            }
            return null;
          })()
        : Promise.resolve(null)
    ]);

    if (preSearchStreamRes?.text) {
      activeSystemInstruction += `\n\n[نتائج بحث الويب الحي الموثقة بالوقت الفعلي لهذه الجلسة]:\n${preSearchStreamRes.text.slice(0, 4000)}`;
      if (preSearchStreamRes.groundingMetadata) {
        latestGrounding = preSearchStreamRes.groundingMetadata;
      }
    }

    if (tesseractStreamRes.activated && tesseractStreamRes.combinedTesseractContextForSynthesis) {
      activeSystemInstruction += `\n\n${tesseractStreamRes.combinedTesseractContextForSynthesis}`;
    }
    const streamLangAnchor = buildDynamicLanguageMirrorAnchor(prompt, memoryBank?.userPreferences?.responseLanguage);
    if (streamLangAnchor) {
      activeSystemInstruction += `\n\n${streamLangAnchor}`;
    }

    for (const modelName of fallbacks) {
      try {
        // Real bounded watchdogs: model- & effort-aware so XHIGH / Pro reasoning never trips premature timeouts
        const isProTierStreamModel = /(?:neon|carbon|argon|pro)/i.test(modelName);
        const CHUNK_IDLE_TIMEOUT_MS = isMaxEffortEnabled
          ? 95000
          : isProTierStreamModel
          ? 75000
          : 60000;
        const IDLE_FORCE_RESPONSE_MS = isMaxEffortEnabled ? 135000 : 95000;
        const MAX_TOTAL_THINKING_WAIT_MS = 240000;
        const MAX_THINKING_CONTINUATION_PASSES = 6;

        let accumulated = '';
        let nativeThoughtAccum = '';
        let latestToolCall: any = undefined;
        let lastProgressTimeMs = Date.now();
        let activePassModel = modelName;
        let agentToolResultsContext = '';
        let lastPassHitMaxTokens = false;

        const foldCurrentThoughtsForContinuation = () => {
          if (!accumulated.trim()) return;
          const snap = extractThinkAndResponse(accumulated, nativeThoughtAccum, prompt, false);
          if (snap.thoughtProcess.trim()) {
            nativeThoughtAccum = snap.thoughtProcess.trim();
            latestNeuralThought = nativeThoughtAccum;
          }
          accumulated = snap.finalResponse || '';
        };

        for (let passIdx = 0; passIdx < MAX_THINKING_CONTINUATION_PASSES; passIdx++) {
          const useFastAgileThinkingCfg = isAgileCleanTurnStream && !isMaxEffortEnabled && passIdx === 0;
          const passThinkingCfgFull = useFastAgileThinkingCfg
            ? buildModelThinkingConfig(activePassModel, 30, false, 'level_only', {
                includeThoughts: false,
                subagentDepth: 'low'
              })
            : buildModelThinkingConfig(
                activePassModel,
                compTelemetry.effortScalarB,
                isMaxEffortEnabled,
                'full'
              );
          const passThinkingCfgLevelOnly = useFastAgileThinkingCfg
            ? buildModelThinkingConfig(activePassModel, 30, false, 'level_only', {
                includeThoughts: false,
                subagentDepth: 'low'
              })
            : buildModelThinkingConfig(
                activePassModel,
                compTelemetry.effortScalarB,
                isMaxEffortEnabled,
                'level_only'
              );
          let passParts: any[] = currentParts;

          if (passIdx > 0) {
            foldCurrentThoughtsForContinuation();
            const priorThoughtsSnapshot = nativeThoughtAccum.trim();
            const priorSurfaceDraftSnapshot = accumulated.trim();
            const liveWorkspaceSummary =
              agentWorkspace && agentWorkspace.files.size > 0
                ? `\n\n[ملفات مساحة عمل الوكيل النشطة حالياً على القرص (${agentWorkspace.files.size} ملفات)]:\n${Array.from(
                    agentWorkspace.files.values()
                  )
                    .map(f => `- ${f.path} (${f.language} · ${f.content.split('\n').length} سطراً · ${f.content.split(/\s+/).filter(Boolean).length} كلمة)`)
                    .join('\n')}`
                : '';

            const continuationPrompt = buildLanguageMatchedContinuationPrompt({
              prompt,
              passIdx,
              agentToolResultsContext,
              liveWorkspaceSummary,
              priorSurfaceDraftSnapshot,
              priorThoughtsSnapshot,
              hitMaxTokens: lastPassHitMaxTokens
            });
            passParts = [{ text: continuationPrompt }];
          }

          const openPassStreamWithConfig = async (
            mode: 'full' | 'level_only' | 'none',
            allowHybrid: boolean = true,
            allowSearch: boolean = true
          ) => {
            const passToolsPayload = buildStreamToolsForModel(activePassModel, allowHybrid, allowSearch);
            const degradedSearchSuffix = !allowSearch && autoSearchTriggered
              ? '\n\n[ملاحظة تشغيلية داخلية: بحث الويب الحي غير متاح مؤقتاً؛ أجب من معرفتي الثابتة بوضوح وصدق دون اختلاق بيانات حية.]'
              : '';
            return await ai.models.generateContentStream({
              model: activePassModel,
              contents: [
                ...trimmedHistory,
                { role: 'user', parts: passParts }
              ],
              config: {
                systemInstruction: `${activeSystemInstruction}${degradedSearchSuffix}`,
                safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                ...(mode === 'full' ? passThinkingCfgFull : mode === 'level_only' ? passThinkingCfgLevelOnly : {}),
                ...passToolsPayload
              }
            });
          };

          const releaseStreamPassSlot = acquireModelCallSlot();
          let streamResp: any;
          try {
            streamResp = await openPassStreamWithConfig('full', true, true);
          } catch (cfgErr: any) {
            const errStr = String(cfgErr?.message || '');
            const lowerErr = errStr.toLowerCase();
            if (lowerErr.includes('404') || lowerErr.includes('not found') || lowerErr.includes('not_found') || lowerErr.includes('does not exist')) {
              releaseStreamPassSlot();
              markModelQuotaCooldown(activePassModel, cfgErr, 3600000);
              throw cfgErr;
            }
            const hadSearchInPass = Boolean(
              buildStreamToolsForModel(activePassModel, true, true).tools?.some((t: any) => t && 'googleSearch' in t)
            );
            if (
              hadSearchInPass &&
              (lowerErr.includes('429') || lowerErr.includes('resource_exhausted') || lowerErr.includes('quota') || lowerErr.includes('rate limit'))
            ) {
              try {
                streamResp = await openPassStreamWithConfig('full', false, false);
              } catch (degradedErr) {
                releaseStreamPassSlot();
                markModelQuotaCooldown(activePassModel, degradedErr);
                throw degradedErr;
              }
            } else if (
              lowerErr.includes('thinking') ||
              lowerErr.includes('invalid_argument') ||
              lowerErr.includes('toolconfig') ||
              lowerErr.includes('includeserversidetoolinvocations') ||
              lowerErr.includes('400')
            ) {
              try {
                streamResp = await openPassStreamWithConfig('level_only', false, true);
              } catch {
                try {
                  streamResp = await openPassStreamWithConfig('none', false, false);
                } catch (fatalCfgErr) {
                  releaseStreamPassSlot();
                  throw fatalCfgErr;
                }
              }
            } else if (passIdx === 0 && accumulated.trim().length === 0 && nativeThoughtAccum.trim().length === 0) {
              const retryMeta = extractGoogleRetryDelayMs(cfgErr, activePassModel);
              const isTransientNonZero =
                !retryMeta.isHardZeroOrDailyQuota &&
                !lowerErr.includes('403') &&
                !lowerErr.includes('404') &&
                !lowerErr.includes('400') &&
                (lowerErr.includes('503') || lowerErr.includes('unavailable') || lowerErr.includes('overloaded') || lowerErr.includes('429'));
              if (isTransientNonZero && (!enableProFallback || fallbacks.length === 1 || activePassModel === fallbacks[0])) {
                await sleepMs(Math.min(3000, Math.max(1800, retryMeta.retryDelayMs)));
                try {
                  streamResp = await openPassStreamWithConfig('full', true, true);
                } catch (retryErr: any) {
                  releaseStreamPassSlot();
                  markModelQuotaCooldown(activePassModel, retryErr);
                  throw retryErr;
                }
              } else {
                releaseStreamPassSlot();
                markModelQuotaCooldown(activePassModel, cfgErr);
                throw cfgErr;
              }
            } else if (passIdx > 0 && (nativeThoughtAccum.trim().length > 0 || accumulated.trim().length > 0 || (agentWorkspace && agentWorkspace.files.size > 0))) {
              releaseStreamPassSlot();
              markModelQuotaCooldown(activePassModel, cfgErr);
              const nextCandidates = prioritizeByQuotaCooldown(fallbacks).filter(m => m !== activePassModel);
              if (nextCandidates.length > 0) {
                activePassModel = nextCandidates[0];
                continue;
              }
              break;
            } else {
              releaseStreamPassSlot();
              throw cfgErr;
            }
          }

          let passInterruptedErr: any = null;
          let passFinishReason = '';
          const pendingAgentToolCalls: Array<{ name: string; args: Record<string, any> }> = [];
          const priorAccumulatedBeforeMaxTokens = lastPassHitMaxTokens ? accumulated : '';
          lastPassHitMaxTokens = false;

          try {
            for await (const chunk of iterateStreamWithIdleTimeout<any>(streamResp, CHUNK_IDLE_TIMEOUT_MS)) {
              const candidateFinish = chunk.candidates?.[0]?.finishReason;
              if (candidateFinish) {
                passFinishReason = String(candidateFinish).toUpperCase();
              }

              const parts = chunk.candidates?.[0]?.content?.parts || [];
              let chunkText = '';
              let chunkThought = '';

              if (parts.length > 0) {
                for (const p of parts as any[]) {
                  if (p.thought && p.text) {
                    chunkThought += p.text;
                  } else if (p.text) {
                    chunkText += p.text;
                  }
                  if (p.functionCall && p.functionCall.name) {
                    if (p.functionCall.name === 'generate_visual_artifact') {
                      latestToolCall = { name: p.functionCall.name, args: p.functionCall.args || {} };
                    } else {
                      pendingAgentToolCalls.push({
                        name: p.functionCall.name,
                        args: (p.functionCall.args as Record<string, any>) || {}
                      });
                    }
                  }
                }
              } else if (chunk.text) {
                chunkText = chunk.text;
              }

              if (chunk.candidates?.[0]?.groundingMetadata) {
                latestGrounding = chunk.candidates[0].groundingMetadata;
              }
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                for (const fc of chunk.functionCalls) {
                  if (fc.name === 'generate_visual_artifact') {
                    latestToolCall = { name: fc.name, args: fc.args };
                  } else if (
                    fc.name &&
                    !pendingAgentToolCalls.some(
                      existing => existing.name === fc.name && JSON.stringify(existing.args) === JSON.stringify(fc.args || {})
                    )
                  ) {
                    pendingAgentToolCalls.push({
                      name: fc.name,
                      args: (fc.args as Record<string, any>) || {}
                    });
                  }
                }
              }
              if (chunkThought || chunkText) {
                lastProgressTimeMs = Date.now();
                nativeThoughtAccum += chunkThought;
                accumulated += chunkText;
                const parsed = extractThinkAndResponse(accumulated, nativeThoughtAccum, prompt, false);
                latestNeuralThought = parsed.thoughtProcess;
                latestSurfaceResponse = parsed.finalResponse;

                // Release buffering immediately if Phase 1 emits code fences, nexus artifacts, or tool calls
                if (
                  shouldBufferPhase1ForHolographicProjector &&
                  (pendingAgentToolCalls.length > 0 ||
                    /<nexus_canvas|<nexus_file|<nexus_terminal_exec|<nexus_file_artifact|```/i.test(parsed.finalResponse))
                ) {
                  shouldBufferPhase1ForHolographicProjector = false;
                  phase1SurfaceHeldForProjector = false;
                }

                const holdSurfaceThisChunk = shouldBufferPhase1ForHolographicProjector;
                if (holdSurfaceThisChunk && parsed.finalResponse.length > 0) {
                  phase1SurfaceHeldForProjector = true;
                }

                isCurrentlyThinking = holdSurfaceThisChunk ? true : parsed.isThinkingPhase;

                if (!isCurrentlyThinking && thinkingEndTimeMs === null) {
                  thinkingEndTimeMs = Date.now();
                }
                const currentThinkingDuration = Number((((thinkingEndTimeMs || Date.now()) - thinkingStartTimeMs) / 1000).toFixed(1));
                const liveThoughtWithTelemetry = buildProgressiveThoughtView(currentThinkingDuration, parsed.thoughtProcess);

                onChunk({
                  type: 'delta',
                  thoughtProcess: liveThoughtWithTelemetry,
                  finalResponse: holdSurfaceThisChunk ? '' : parsed.finalResponse,
                  isThinkingPhase: isCurrentlyThinking,
                  groundingMetadata: latestGrounding,
                  routedModel: activePassModel,
                  usedTools: agentWorkspace
                    ? Array.from(new Set([...initialToolsList, ...Array.from(agentWorkspace.usedToolBadges)]))
                    : initialToolsList,
                  thinkingDuration: Math.max(0.4, currentThinkingDuration)
                });
              }
            }
          } catch (midStreamErr: any) {
            passInterruptedErr = midStreamErr;
            markModelQuotaCooldown(activePassModel, midStreamErr);
          } finally {
            releaseStreamPassSlot();
          }

          // If the model invoked any of the Real Sovereign Agent Tools in this pass, execute them NOW and continue the ReAct loop!
          if (pendingAgentToolCalls.length > 0 && agentWorkspace) {
            lastProgressTimeMs = Date.now();
            const passToolOutputs: string[] = [];
            for (const toolCallItem of pendingAgentToolCalls) {
              // Emit immediate live telemetry BEFORE starting the tool so the user sees active tool execution in real time
              const preToolNotice = `⚙️ [تفعيل أداة الوكيل السيادي: ${toolCallItem.name}] جاري التنفيذ الحي وبناء الملفات...`;
              latestNeuralThought = nativeThoughtAccum.trim()
                ? `${nativeThoughtAccum.trim()}\n${preToolNotice}`
                : preToolNotice;
              onChunk({
                type: 'delta',
                thoughtProcess: latestNeuralThought,
                finalResponse: latestSurfaceResponse,
                isThinkingPhase: true,
                groundingMetadata: latestGrounding,
                usedTools: Array.from(new Set([...initialToolsList, ...Array.from(agentWorkspace.usedToolBadges)])),
                thinkingDuration: Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1))
              });

              const execOut = await executeSingleSovereignAgentToolCall(
                toolCallItem.name,
                toolCallItem.args,
                agentWorkspace,
                fallbacks
              );
              passToolOutputs.push(`[الأداة المنفذة: ${toolCallItem.name}]\n${execOut.toolOutputSummary}`);
              nativeThoughtAccum = `${nativeThoughtAccum.trim()}\n${execOut.toolLogLineAr}\n`;
              latestNeuralThought = nativeThoughtAccum.trim();
              lastProgressTimeMs = Date.now();

              const liveCanvasFromWs =
                agentWorkspace.files.size > 0
                  ? buildLiveCanvasEnvelopeFromWorkspace(agentWorkspace, prompt.slice(0, 60))
                  : '';
              const liveSurfacePreview =
                accumulated.trim() ||
                (liveCanvasFromWs
                  ? `جاري تنفيذ أدوات الوكيل السيادي وبناء ملفات مساحة العمل حياً (${agentWorkspace.files.size} ملفات)...\n\n${liveCanvasFromWs}`
                  : '');
              latestSurfaceResponse = liveSurfacePreview;

              onChunk({
                type: 'delta',
                thoughtProcess: latestNeuralThought,
                finalResponse: liveSurfacePreview,
                isThinkingPhase: true,
                groundingMetadata: latestGrounding,
                usedTools: Array.from(new Set([...initialToolsList, ...Array.from(agentWorkspace.usedToolBadges)])),
                thinkingDuration: Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1))
              });
            }

            agentToolResultsContext = `${agentToolResultsContext}\n\n${passToolOutputs.join('\n\n')}`.trim();
            if (passIdx < MAX_THINKING_CONTINUATION_PASSES - 1) {
              continue;
            }
          }

          const hasAnyProgress =
            accumulated.trim().length > 0 ||
            nativeThoughtAccum.trim().length > 0 ||
            Boolean(latestToolCall) ||
            Boolean(agentWorkspace && agentWorkspace.files.size > 0);

          if (!hasAnyProgress && passInterruptedErr) {
            throw passInterruptedErr;
          }

          const checkParsedNow = extractThinkAndResponse(accumulated, nativeThoughtAccum, prompt, false);
          const trimmedFinalNow = checkParsedNow.finalResponse.trim();
          const isIncompletePlanAnnouncement =
            (trimmedFinalNow.endsWith(':') && trimmedFinalNow.length < 700) ||
            (/(?:^|\n)\s*(?:سأقوم الآن بالآتي|سأبدأ الآن|سأكتب الآن|في مساحة العمل|ملفات الفصول|دستور الإقليم)\s*[:：]?/i.test(
              trimmedFinalNow
            ) &&
              trimmedFinalNow.length < 750 &&
              !/```|<nexus_file\b/i.test(trimmedFinalNow) &&
              (!agentWorkspace || agentWorkspace.files.size === 0));

          const isUnfulfilledAgentPass =
            isAgentModeEnabled &&
            passIdx === 0 &&
            prompt.trim().length >= 16 &&
            (!agentWorkspace || agentWorkspace.files.size === 0) &&
            !/<nexus_canvas|<nexus_file|<nexus_terminal_exec|<nexus_file_artifact/i.test(trimmedFinalNow) &&
            trimmedFinalNow.length < 750 &&
            !latestToolCall;

          if ((isIncompletePlanAnnouncement || isUnfulfilledAgentPass) && passIdx < MAX_THINKING_CONTINUATION_PASSES - 1) {
            agentToolResultsContext = `${agentToolResultsContext}\n\n[حالة مساحة العمل الحية للوكيل السيادي: ${
              isIncompletePlanAnnouncement
                ? `تمت صياغة المقدمة التمهيدية (${latestToolCall ? 'مع تفعيل أداة التجسيد البصري بالتوازي' : 'ومساحة العمل جاهزة لاستقبال الملفات الكاملة'}).`
                : `وضع الوكيل السيادي نشط، ومساحة العمل جاهزة لبناء الملفات الكاملة عبر الأدوات التنفيذية (workspace_write_file / execute_terminal_sandbox / spawn_subagent_swarm) أو داخل <nexus_canvas>.`
            }]`.trim();
            continue;
          }

          // Seamless MAX_TOKENS continuation: never silently truncate a long response mid-sentence
          if (passFinishReason === 'MAX_TOKENS' && !passInterruptedErr && passIdx < MAX_THINKING_CONTINUATION_PASSES - 1) {
            lastPassHitMaxTokens = true;
            if (priorAccumulatedBeforeMaxTokens && !accumulated.startsWith(priorAccumulatedBeforeMaxTokens.slice(0, 80))) {
              accumulated = `${priorAccumulatedBeforeMaxTokens.trimEnd()}\n${accumulated.trimStart()}`;
            }
            continue;
          }

          const minNaturalChars =
            isAgileCleanTurnStream || streamFocusEarly === 'CASUAL_WARM_CONVERSATION' || streamUserRequestedBrevity
              ? 2
              : 35;
          const hasNaturalFinalResponse =
            !passInterruptedErr &&
            passFinishReason !== 'MAX_TOKENS' &&
            trimmedFinalNow.length >= minNaturalChars &&
            !checkParsedNow.isThinkingPhase &&
            !isIncompletePlanAnnouncement &&
            !isUnfulfilledAgentPass;

          // If the model naturally finished thinking and wrote its complete response (or triggered a standalone visual tool), we are done!
          if (hasNaturalFinalResponse || (Boolean(latestToolCall) && !isAgentModeEnabled && !isIncompletePlanAnnouncement)) {
            break;
          }

          const idleAfterPassMs = Date.now() - lastProgressTimeMs;
          const totalAfterPassMs = Date.now() - thinkingStartTimeMs;
          if (idleAfterPassMs >= IDLE_FORCE_RESPONSE_MS || totalAfterPassMs >= MAX_TOTAL_THINKING_WAIT_MS) {
            break;
          }

          if (passIdx < MAX_THINKING_CONTINUATION_PASSES - 1) {
            const nextHealthyModels = prioritizeByQuotaCooldown(fallbacks).filter(m => m !== activePassModel);
            const retryInfo = passInterruptedErr
              ? extractGoogleRetryDelayMs(passInterruptedErr, activePassModel)
              : { isHardZeroOrDailyQuota: false, retryDelayMs: 2500 };

            const isStreamStallOrQuota =
              Boolean(passInterruptedErr) &&
              (/STREAM_CHUNK_IDLE_TIMEOUT|429|RESOURCE_EXHAUSTED|quota/i.test(String(passInterruptedErr?.message || '')) ||
                retryInfo.isHardZeroOrDailyQuota);

            if (isStreamStallOrQuota) {
              if (nextHealthyModels.length > 0) {
                activePassModel = nextHealthyModels[0];
                continue;
              }
              break;
            }

            const remainingIdleBudgetMs = Math.max(0, IDLE_FORCE_RESPONSE_MS - (Date.now() - lastProgressTimeMs));
            const remainingTotalBudgetMs = Math.max(0, MAX_TOTAL_THINKING_WAIT_MS - (Date.now() - thinkingStartTimeMs));
            const maxAllowedWaitMs = Math.min(remainingIdleBudgetMs, remainingTotalBudgetMs);

            if (maxAllowedWaitMs <= 1500) {
              break;
            }

            // Bounded wait (max 15s) for transient interruptions
            const targetWaitMs = retryInfo.exactRetryDelayMs && retryInfo.exactRetryDelayMs <= 15000
              ? retryInfo.exactRetryDelayMs + 1000
              : Math.min(Math.max(retryInfo.retryDelayMs, 2500), 12000);
            const resetWaitMs = Math.min(targetWaitMs, maxAllowedWaitMs, 15000);
            isCurrentlyThinking = true;
            await sleepMs(resetWaitMs);
          }
        }

        // If this model returned an empty stream across all passes and wrote no workspace files, throw to try the next model in fallbacks
        if (
          accumulated.trim().length === 0 &&
          nativeThoughtAccum.trim().length === 0 &&
          !latestToolCall &&
          (!agentWorkspace || agentWorkspace.files.size === 0)
        ) {
          throw new Error('EMPTY_STREAM_OUTPUT');
        }

        const finalParsed = extractThinkAndResponse(accumulated, nativeThoughtAccum, prompt, true);
        if (thinkingEndTimeMs === null) {
          thinkingEndTimeMs = Date.now();
        }
        isCurrentlyThinking = false;
        clearInterval(heartbeatInterval);

        const modelFalselyRefusedVisual =
          !visualIntentStream.explicitPromptOnly &&
          FALSE_VISUAL_UNAVAILABLE_REGEX.test(finalParsed.finalResponse || '');

        if (!latestToolCall && (autoVisualRequested || modelFalselyRefusedVisual)) {
          latestToolCall = {
            name: 'generate_visual_artifact',
            args: {
              prompt: extractBestPromptFromModelTextFallback(finalParsed.finalResponse || '', prompt),
              aspect_ratio: '16:9',
              style: 'none'
            }
          };
        }

        const usedTools: string[] = [];
        if (isMaxEffortEnabled) {
          usedTools.push('مختبر المسارات الفرعية (أقصى جهد)');
        }
        if (preTerminalPass.triggered) {
          usedTools.push('التيرمنال السيادي الحي (Python3/Bash)');
        }
        if (autoSearchTriggered || (latestGrounding?.groundingChunks && latestGrounding.groundingChunks.length > 0)) {
          usedTools.push('بحث الويب الحي');
        }
        if (autoCanvasTriggered) {
          usedTools.push('الكانفاس البرمجي');
        }
        if (latestToolCall || autoVisualRequested) {
          usedTools.push('توليد الصور');
        }

        // Execute any <nexus_terminal_exec> blocks emitted by NEXUS in its thought or response!
        let terminalExecRes = executeAgentTerminalDirectivesInOutput(
          finalParsed.finalResponse,
          finalParsed.thoughtProcess || nativeThoughtAccum.trim()
        );
        if (terminalExecRes.executedEntries.length > 0 && !usedTools.includes('التيرمنال السيادي الحي (Python3/Bash)')) {
          usedTools.push('التيرمنال السيادي الحي (Python3/Bash)');
        }

        // NEVER dump unclosed <think> content into finalBody! Use cleanedResponse strictly.
        let finalBody = terminalExecRes.cleanedResponse;

        // Intercept any inline <nexus_visual_artifact prompt="..." /> emitted by the model
        const inlineVisualStreamRes = extractInlineVisualArtifactDirective(finalBody);
        finalBody = inlineVisualStreamRes.cleanedText;
        if (inlineVisualStreamRes.extractedPrompt && !latestToolCall) {
          latestToolCall = {
            name: 'generate_visual_artifact',
            args: {
              prompt: inlineVisualStreamRes.extractedPrompt,
              aspect_ratio: inlineVisualStreamRes.aspectRatio || '16:9',
              style: inlineVisualStreamRes.style || 'none'
            }
          };
          if (!usedTools.includes('توليد الصور')) {
            usedTools.push('توليد الصور');
          }
        }
        if (latestToolCall?.name === 'generate_visual_artifact' && FALSE_VISUAL_UNAVAILABLE_REGEX.test(finalBody)) {
          finalBody = '';
        }

        const extractedNeuralThought = applyOpVeilThoughtSanitizer(
          terminalExecRes.cleanedThought,
          prompt
        );

        // Dynamically run Server-Side Technical Verification (Zlib DEFLATE, Shannon Entropy H(X), Python AST Compiler)
        if (isMaxEffortEnabled && activeLabEvaluation) {
          let serverTechMetrics = executeMaxEffortServerTechnicalVerification(
            extractedNeuralThought,
            finalBody
          );

          // If any generated code block failed real AST/syntax compilation, run an autonomous compiler-guided repair pass!
          if (serverTechMetrics.syntaxErrors.length > 0) {
            const repairPrompt = `ظهر في فحص المترجم التقني ملاحظات على الكتل البرمجية التي كتبتها:
${serverTechMetrics.syntaxErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

نصّي السابق:
${finalBody}

أُصلح الخلل الآن وأقدّم النسخة الكاملة السليمة التي تجتاز الفحص بنجاح:`;

            for (const repModel of getHydrogenExecutiveSubagentCascade(fallbacks)) {
              try {
                const repCfg = buildModelThinkingConfig(repModel, 95, true, 'level_only');
                const repRes = await ai.models.generateContent({
                  model: repModel,
                  contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
                  config: {
                    systemInstruction: activeSystemInstruction,
                    safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                    ...repCfg
                  }
                });
                const repClean = (repRes.text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                if (repClean.length >= finalBody.length * 0.65) {
                  finalBody = repClean;
                  serverTechMetrics = executeMaxEffortServerTechnicalVerification(
                    extractedNeuralThought,
                    finalBody
                  );
                  if (!usedTools.includes('مصحح المترجم الذاتي (AST Auto-Repair)')) {
                    usedTools.push('مصحح المترجم الذاتي (AST Auto-Repair)');
                  }
                  break;
                }
              } catch (repErr: any) {
                markModelQuotaCooldown(repModel, repErr);
              }
            }
          }

          activeLabEvaluation = enrichSubThinkingEvaluationFromLiveThoughts(
            activeLabEvaluation,
            extractedNeuralThought,
            finalBody,
            usedTools,
            serverTechMetrics
          );
          const winningSubPath = activeLabEvaluation.paths?.find(p => p.isWinner) || activeLabEvaluation.paths?.[0];
          const ruleText = (activeLabEvaluation.extractedCoreRuleAr || '').trim();
          if (ruleText.length > 15 && extractedNeuralThought.length >= 250) {
            try {
              recordExperienceInGlobalNexusPowerLedger(
                {
                  id: `EXP-AUTO-${Date.now().toString(36).toUpperCase()}`,
                  titleAr: winningSubPath?.branchNameAr || 'قاعدة مستخلصة من مختبر المسارات الفرعية',
                  domainCategory: 'التطور الذاتي المستمر (Recursive Self-Evolution)',
                  linkedSkillId: 'SKILL-31',
                  inputScenarioAr: prompt.slice(0, 120),
                  reasoningPatternAr: winningSubPath?.thoughtSummaryAr || ruleText,
                  optimalDeductiveRuleAr: ruleText,
                  trainingWeight: winningSubPath?.totalScore || 98,
                  powerDelta: 3.5,
                  promotedToGlobalCorpus: true,
                  createdAt: Date.now()
                },
                3.5,
                true
              );
            } catch {
              // Ignore persistence errors
            }
          }
        }

        let finalThought = extractedNeuralThought.trim();
        if (!finalThought && tesseractStreamRes.activated) {
          finalThought = applyOpVeilThoughtSanitizer(
            [
              tesseractStreamRes.trueQuestionAndSubPartsReportAr,
              tesseractStreamRes.sixAnglesExistentialDiveReportAr,
              tesseractStreamRes.experientialAndPaleArchiveGapsReportAr
            ]
              .filter(Boolean)
              .join('\n\n'),
            prompt
          );
        }
        if (terminalExecRes.thoughtLogBlockAr) {
          finalThought = finalThought
            ? `${finalThought}\n\n${terminalExecRes.thoughtLogBlockAr}`
            : terminalExecRes.thoughtLogBlockAr.trim();
        }
        let finalThinkingDurationSec = Math.max(0.5, Number(((thinkingEndTimeMs - thinkingStartTimeMs) / 1000).toFixed(1)));

        // If the model spent its pass on <think> / native thoughts and left finalBody empty or too short (< 25 chars),
        // OR if it fell into "thought-swallowing", OR if Max Effort is enabled on a substantive prompt and the initial draft was disproportionately brief (< 420 chars without Canvas/visual tags),
        // immediately execute a Direct Manifestation & Max-Effort Causal Mirror Elevation Stream so the user receives the full, calibrated masterpiece!
        const trimmedFinalSurface = (finalBody || '').trim();
        const userRequestedBrevity = streamUserRequestedBrevity;
        const isThoughtSwallowedDraft =
          !userRequestedBrevity &&
          extractedNeuralThought.length > 900 &&
          trimmedFinalSurface.length < 220 &&
          extractedNeuralThought.length > Math.max(1, trimmedFinalSurface.length) * 3.5 &&
          !/<nexus_canvas|<nexus_file|<nexus_visual_artifact/i.test(trimmedFinalSurface);

        const isMaxEffortUnderDeliveredDraft =
          isMaxEffortEnabled &&
          !userRequestedBrevity &&
          prompt.trim().length >= 30 &&
          trimmedFinalSurface.length < 240 &&
          !/```|<nexus_canvas|<nexus_file|<nexus_visual_artifact/i.test(trimmedFinalSurface) &&
          trimmedFinalSurface.split('\n').length < 4 &&
          !latestToolCall;

        const hasWorkspaceFilesAlready = Boolean(agentWorkspace && agentWorkspace.files.size > 0);
        const minPostLoopChars =
          isAgileCleanTurnStream || streamFocusEarly === 'CASUAL_WARM_CONVERSATION' || userRequestedBrevity
            ? 2
            : 25;
        if (hasWorkspaceFilesAlready && (!trimmedFinalSurface || trimmedFinalSurface.length < 25)) {
          const wsFilesList = Array.from(agentWorkspace!.files.values());
          const totalWordsCount = wsFilesList.reduce(
            (acc, f) => acc + f.content.split(/\s+/).filter(Boolean).length,
            0
          );
          const summaryBulletLines = wsFilesList
            .map(
              f =>
                `- **${f.name || f.path}** (\`${f.path}\` — ${f.content.split(/\s+/).filter(Boolean).length} كلمة)`
            )
            .join('\n');
          const canvasEnv = buildLiveCanvasEnvelopeFromWorkspace(agentWorkspace!, prompt.slice(0, 60));
          finalBody = `تم إنجاز وبناء العمل الكامل متعدد الفصول والملفات عبر الوكيل السيادي (**${wsFilesList.length} ملفات / فصول** بإجمالي **${totalWordsCount} كلمة**) ومزامنتها في مساحة العمل الحية:\n\n${summaryBulletLines}\n\n${canvasEnv}`;
        } else if (
          (!trimmedFinalSurface || trimmedFinalSurface.length < minPostLoopChars || isThoughtSwallowedDraft || isMaxEffortUnderDeliveredDraft) &&
          !hasWorkspaceFilesAlready &&
          !latestToolCall
        ) {
          const winningPathSummary = activeLabEvaluation?.paths?.find(p => p.isWinner) || activeLabEvaluation?.paths?.[0];
          const rawThoughtForManifest = extractedNeuralThought || compTelemetry.computedTraceAr;
          const manifestationPrompt = buildLanguageMatchedManifestationPrompt({
            prompt,
            winningPathSummary,
            preservedThoughtDigest: rawThoughtForManifest,
            trimmedFinalSurface
          });

          const fastManifestModels = prioritizeByQuotaCooldown(
            effectiveModelSelection === 'nexus-4-pro' ||
              effectiveModelSelection === 'nexus-4-neon' ||
              effectiveModelSelection === 'nexus-4-carbon' ||
              effectiveModelSelection === 'nexus-4-argon' ||
              effectiveModelSelection === 'nexus-3.1-pro' ||
              effectiveModelSelection === 'gemini-3.1-pro-preview' ||
              effectiveModelSelection === 'gemini-3.1-pro' ||
              effectiveModelSelection === 'gemini-4-neon' ||
              effectiveModelSelection === 'gemini-4-carbon' ||
              effectiveModelSelection === 'gemini-4-argon' ||
              effectiveModelSelection === 'pro' ||
              effectiveModelSelection === 'hybrid-nexus'
              ? [...fallbacks, 'gemini-4-hydrogen', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite']
              : ['gemini-4-hydrogen', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite', ...fallbacks]
          );
          for (const completionModel of fastManifestModels) {
            for (let compAttempt = 0; compAttempt < 2; compAttempt++) {
              try {
                const manifestThinkingCfg = buildModelThinkingConfig(
                  completionModel,
                  compTelemetry.effortScalarB,
                  false,
                  'level_only'
                );
                const completionStream = await ai.models.generateContentStream({
                  model: completionModel,
                  contents: [
                    ...trimmedHistory,
                    { role: 'user', parts: [{ text: manifestationPrompt }] }
                  ],
                  config: {
                    systemInstruction: activeSystemInstruction,
                    safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                    ...manifestThinkingCfg
                  }
                });

                let completionAccum = '';
                for await (const compChunk of iterateStreamWithIdleTimeout<any>(completionStream, 45000)) {
                  const cParts = compChunk.candidates?.[0]?.content?.parts || [];
                  let cText = '';
                  if (cParts.length > 0) {
                    for (const cp of cParts as any[]) {
                      if (!cp.thought && cp.text) {
                        cText += cp.text;
                      }
                    }
                  } else if (compChunk.text) {
                    cText = compChunk.text;
                  }
                  if (cText) {
                    completionAccum += cText;
                    const cleanLive = applyOpVeilSurfaceSanitizer(
                      completionAccum.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^<think>/i, '').trim(),
                      prompt
                    );
                    if (cleanLive) {
                      finalBody = cleanLive;
                      onChunk({
                        type: 'delta',
                        thoughtProcess: finalThought,
                        finalResponse: finalBody,
                        isThinkingPhase: false,
                        groundingMetadata: latestGrounding,
                        usedTools,
                        thinkingDuration: finalThinkingDurationSec
                      });
                    }
                  }
                }
                if (finalBody && finalBody.trim().length >= Math.max(25, trimmedFinalSurface.length)) {
                  // Execute any <nexus_terminal_exec> blocks inside the manifestation stream!
                  if (/<nexus_terminal_exec/i.test(finalBody)) {
                    const postManifestExec = executeAgentTerminalDirectivesInOutput(finalBody, '');
                    finalBody = postManifestExec.cleanedResponse;
                    if (postManifestExec.thoughtLogBlockAr) {
                      finalThought = `${finalThought}${postManifestExec.thoughtLogBlockAr}`;
                    }
                    if (postManifestExec.executedEntries.length > 0 && !usedTools.includes('التيرمنال السيادي الحي (Python3/Bash)')) {
                      usedTools.push('التيرمنال السيادي الحي (Python3/Bash)');
                    }
                    terminalExecRes = {
                      ...terminalExecRes,
                      executedEntries: [...terminalExecRes.executedEntries, ...postManifestExec.executedEntries],
                      failedEntries: [...terminalExecRes.failedEntries, ...postManifestExec.failedEntries],
                      generatedArtifacts: [...terminalExecRes.generatedArtifacts, ...postManifestExec.generatedArtifacts]
                    };
                  }
                  break;
                }
                break;
              } catch (compErr: any) {
                const retryInfo = extractGoogleRetryDelayMs(compErr);
                if (compAttempt === 0 && !retryInfo.isHardZeroOrDailyQuota && retryInfo.retryDelayMs <= 4000) {
                  await sleepMs(Math.min(3000, retryInfo.retryDelayMs));
                  continue;
                }
                markModelQuotaCooldown(completionModel, compErr);
                break;
              }
            }
            if (finalBody && finalBody.trim().length >= Math.max(25, trimmedFinalSurface.length)) {
              break;
            }
          }
        }

        // --- LAYER 4: REAL POST-THOUGHT QUANTUM TRAJECTORY HARVEST & ARBITRATION PASS (STREAM) ---
        // Respects fast-mode bypass, latency budget, RPM pressure shedding, and streams seamlessly from
        // character 0 whenever Phase 1 surface was held in memory (zero mid-read wipe or flicker).
        let streamedVisibleSurfaceInLayer4 = false;
        const streamIsFastDepth = memoryBank?.userPreferences?.thinkingDepth === 'fast' && !isMaxEffortEnabled;
        if (!streamIsFastDepth && !hasWorkspaceFilesAlready && !latestToolCall && !directFileReq.requested && finalBody && finalBody.trim().length >= 60) {
          const streamFocusMode = detectNexusCognitiveFocusMode(prompt);
          const quantumAuditStream = auditQuantumTrajectoryHarvest({
            prompt,
            thoughtText: extractedNeuralThought,
            surfaceResponse: finalBody,
            focusMode: streamFocusMode,
            isMaxEffortEnabled,
            userRequestedBrevity
          });

          const streamLatencyLimitMs = isMaxEffortEnabled ? 110000 : 62000;
          const streamLatencyExceeded = Date.now() - thinkingStartTimeMs > streamLatencyLimitMs;
          // Bicameral Zero-Point Rule: preserve the primary model's authentic unflattened voice!
          // Trigger Layer 4 strictly when quantumAudit catches a real dropped-spark / cliché / collapse defect.
          const allowStreamLayer4 =
            quantumAuditStream.needsQuantumArbitration &&
            (isMaxEffortEnabled ||
              (!streamLatencyExceeded && !shouldShedAuxiliaryModelPasses()) ||
              isCriticalLayer4Defect(quantumAuditStream));

          if (allowStreamLayer4) {
            const arbPrompt = buildQuantumArbitratorPrompt({
              prompt,
              thoughtText: extractedNeuralThought,
              initialDraft: finalBody,
              audit: quantumAuditStream,
              focusMode: streamFocusMode
            });
            const shieldedStreamArb = getQuotaShieldedAuxiliaryCascade(
              activePassModel,
              fallbacks,
              !enableProFallback
            );
            const arbModels = (
              shieldedStreamArb.length > 0
                ? shieldedStreamArb
                : quantumAuditStream.needsQuantumArbitration
                ? [activePassModel]
                : []
            ).slice(0, 2);

            const originalBodyBackup = finalBody;
            const promoteMinChars = phase1SurfaceHeldForProjector ? 1 : 120;
            for (const arbModel of arbModels) {
              const releaseArbSlot = acquireModelCallSlot();
              try {
                const arbCfg = buildModelThinkingConfig(arbModel, compTelemetry.effortScalarB, false, 'level_only', {
                  includeThoughts: false,
                  subagentDepth: quantumAuditStream.needsQuantumArbitration ? 'medium' : 'low'
                });
                const arbStream = await ai.models.generateContentStream({
                  model: arbModel,
                  contents: [{ role: 'user', parts: [{ text: arbPrompt }] }],
                  config: {
                    systemInstruction: SURFACE_REFINER_INSTRUCTION,
                    safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                    ...arbCfg
                  }
                });

                let arbAccum = '';
                let promotedElevatedStream = false;
                for await (const arbChunk of iterateStreamWithIdleTimeout<any>(arbStream, 45000)) {
                  const aParts = arbChunk.candidates?.[0]?.content?.parts || [];
                  let aText = '';
                  if (aParts.length > 0) {
                    for (const ap of aParts as any[]) {
                      if (!ap.thought && ap.text) aText += ap.text;
                    }
                  } else if (arbChunk.text) {
                    aText = arbChunk.text;
                  }
                  if (aText) {
                    arbAccum += aText;
                    const cleanElevated = applyOpVeilSurfaceSanitizer(
                      arbAccum.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^<think>/i, '').trim(),
                      prompt
                    );
                    if (cleanElevated.length >= promoteMinChars) {
                      promotedElevatedStream = true;
                      streamedVisibleSurfaceInLayer4 = true;
                      isCurrentlyThinking = false;
                      if (thinkingEndTimeMs === null) thinkingEndTimeMs = Date.now();
                      finalBody = cleanElevated;
                      onChunk({
                        type: 'delta',
                        thoughtProcess: finalThought,
                        finalResponse: finalBody,
                        isThinkingPhase: false,
                        groundingMetadata: latestGrounding,
                        routedModel: activePassModel,
                        usedTools,
                        thinkingDuration: Number((((thinkingEndTimeMs || Date.now()) - thinkingStartTimeMs) / 1000).toFixed(1))
                      });
                    } else if (!promotedElevatedStream) {
                      // Hold visible surface stable while buffering initial Layer 4 tokens
                      onChunk({
                        type: 'delta',
                        thoughtProcess: finalThought,
                        finalResponse: phase1SurfaceHeldForProjector ? '' : originalBodyBackup,
                        isThinkingPhase: true,
                        groundingMetadata: latestGrounding,
                        routedModel: activePassModel,
                        usedTools,
                        thinkingDuration: Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1))
                      });
                    }
                  }
                }
                const finalElevatedTrimmed = applyOpVeilSurfaceSanitizer(
                  arbAccum.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^<think>/i, '').trim(),
                  prompt
                );
                if (finalElevatedTrimmed.length >= Math.max(80, Math.floor(originalBodyBackup.length * 0.6))) {
                  finalBody = finalElevatedTrimmed;
                  streamedVisibleSurfaceInLayer4 = true;
                  break;
                } else {
                  // Restore full original body if elevated stream truncated prematurely
                  finalBody = originalBodyBackup;
                  streamedVisibleSurfaceInLayer4 = false;
                }
              } catch (arbErr: any) {
                finalBody = originalBodyBackup;
                streamedVisibleSurfaceInLayer4 = false;
                markModelQuotaCooldown(arbModel, arbErr);
              } finally {
                releaseArbSlot();
              }
            }
          }
        }

        // Guaranteed flush: if Phase 1 surface was buffered for Phase 2, and Phase 2 was skipped or failed,
        // emit Phase 1's clean surface response immediately so zero content is ever lost.
        if (phase1SurfaceHeldForProjector && !streamedVisibleSurfaceInLayer4 && finalBody) {
          isCurrentlyThinking = false;
          if (thinkingEndTimeMs === null) thinkingEndTimeMs = Date.now();
          onChunk({
            type: 'delta',
            thoughtProcess: finalThought,
            finalResponse: finalBody,
            isThinkingPhase: false,
            groundingMetadata: latestGrounding,
            routedModel: activePassModel,
            usedTools,
            thinkingDuration: Number((((thinkingEndTimeMs || Date.now()) - thinkingStartTimeMs) / 1000).toFixed(1))
          });
        }

        // --- AUTONOMOUS AGENT SELF-HEALING & UNIVERSAL ARTIFACT FORGE LOOP ---
        // If a terminal execution failed OR the user requested a downloadable video/audio/file artifact and none was forged yet:
        const needsArtifactForge =
          doesPromptRequestBinaryMediaOrFileArtifact(prompt) &&
          terminalExecRes.generatedArtifacts.length === 0;
        const hasFailedScript =
          terminalExecRes.failedEntries.length > 0 &&
          terminalExecRes.generatedArtifacts.length === 0;

        if (needsArtifactForge || hasFailedScript) {
          const failureContext = hasFailedScript
            ? `الكود السابق في التيرمنال فشل بالخطأ التالي:\n${terminalExecRes.failedEntries
                .map(f => `[${f.lang}] Exit ${f.exitCode}:\nSTDERR/STDOUT: ${f.stderr || f.stdout}\nCODE:\n${f.code.slice(0, 1200)}`)
                .join('\n\n')}`
            : `طلب المستخدم يتطلب بناء ملف وسائط/فيديو/صوت/ملف قابل للتحميل حقيقياً على القرص، ولم يتم كتابة ملف بعد في مجلد العمل الحالي (os.getcwd()).`;

          const selfHealPrompt = `أُصلح مسار التنفيذ وأبني الملف المطلوب لرفيقي مباشرة:
رسالته الأصلية: "${prompt}"

ما ظهر لي من فحص البيئة الحية:
${failureContext}

الأدوات المتاحة لي فعلياً في هذا الحاوي:
1. المكتبات الخارجية غير المثبتة مثل (numpy, PIL, matplotlib, cv2, moviepy) غير موجودة هنا، بينما أمتلك:
   - Python 3.10 القياسي بالكامل (math, struct, wave, zlib, zipfile, sqlite3, subprocess, random, os).
   - محرك FFmpeg الكامل في \`/usr/bin/ffmpeg\` (يدعم libx264, libvpx, gif, aac, pcm_s16le, rawvideo, lavfi).
2. عند بناء فيديو برمجي (.mp4 أو .webm أو .gif)، أكتب كود Python يولّد إطارات RGB24 برمجياً (\`bytearray(W * H * 3)\` أو فلاتر ffmpeg) مع مسار صوتي \`.wav\` عبر \`wave\` + \`struct\`، وأمرّرها عبر \`subprocess.Popen(["ffmpeg", "-y", ...])\` لإنتاج ملف حقيقي في المجلد الحالي.
3. أنفّذ الكود المصحح عبر وسم \`<nexus_terminal_exec lang="python" purpose="التنفيذ المصحح للملف المطلوب">...الكود الكامل الصحيح...</nexus_terminal_exec>\` متبوعاً بملخص موجز عما بنيته:`;

          for (const healModel of getHydrogenExecutiveSubagentCascade(fallbacks)) {
            try {
              const healCfg = buildModelThinkingConfig(healModel, 95, true, 'level_only');
              const healRes = await ai.models.generateContent({
                model: healModel,
                contents: [{ role: 'user', parts: [{ text: selfHealPrompt }] }],
                config: {
                  systemInstruction: activeSystemInstruction,
                  safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                  ...healCfg
                }
              });
              const healRaw = (healRes.text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              if (/<nexus_terminal_exec/i.test(healRaw)) {
                const healExec = executeAgentTerminalDirectivesInOutput(healRaw, '');
                if (healExec.executedEntries.length > 0 && !usedTools.includes('التيرمنال السيادي الحي (Python3/Bash)')) {
                  usedTools.push('التيرمنال السيادي الحي (Python3/Bash)');
                }
                if (healExec.thoughtLogBlockAr) {
                  finalThought = `${finalThought}\n\n[حلقة الإصلاح والتكيف الذاتي للتيرمنال السيادي (Autonomous Self-Healing Pass)]:${healExec.thoughtLogBlockAr}`;
                }
                if (healExec.generatedArtifacts.length > 0 || healExec.executedEntries.some(e => e.exitCode === 0)) {
                  // Strip failed raw tags or append healed output cleanly
                  finalBody = `${finalBody.replace(/<nexus_generated_artifacts>[\s\S]*?<\/nexus_generated_artifacts>/gi, '').trim()}\n\n${healExec.cleanedResponse.trim()}`;
                  break;
                }
              }
            } catch (healErr: any) {
              markModelQuotaCooldown(healModel, healErr);
            }
          }
        }

        // --- AUTONOMOUS MULTI-PASS AGENT SELF-CRITIQUE, ERROR TRACKING & ITERATIVE DEEP REWRITE LOOP ---
        // Inspect every <nexus_file> written in Pass 1 and expand any brief chapter/file with zero time or file-count ceiling.
        if (/<nexus_file\b/i.test(finalBody) && !hasWorkspaceFilesAlready) {
          interface ParsedCanvasFileEntry {
            fullMatch: string;
            openTag: string;
            path: string;
            title: string;
            language: string;
            content: string;
            wordCount: number;
            isChapterOrProse: boolean;
            needsDeepRewrite: boolean;
          }

          const fileTagRegex = /(<nexus_file\b([^>]*)>)([\s\S]*?)<\/nexus_file>/gi;
          const parsedCanvasFiles: ParsedCanvasFileEntry[] = [];
          let fileMatch: RegExpExecArray | null;

          while ((fileMatch = fileTagRegex.exec(finalBody)) !== null) {
            const fullMatch = fileMatch[0];
            const openTag = fileMatch[1];
            const attrs = fileMatch[2] || '';
            const content = (fileMatch[3] || '').trim();
            const pathMatch = attrs.match(/path="([^"]*)"/i);
            const titleMatch = attrs.match(/title="([^"]*)"/i);
            const langMatch = attrs.match(/language="([^"]*)"/i);
            const path = (pathMatch?.[1] || `file_${parsedCanvasFiles.length + 1}.md`).trim();
            const title = (titleMatch?.[1] || path).trim();
            const language = (langMatch?.[1] || 'markdown').trim().toLowerCase();
            const wordCount = content.split(/\s+/).filter(Boolean).length;

            const isChapterOrProse =
              language === 'markdown' ||
              language === 'md' ||
              language === 'text' ||
              /\.(md|txt)$/i.test(path) ||
              /chapter|فصل|مشهد|باب|مبحث|قصة|رواية|سرد|codex|معمارية/i.test(`${path} ${title}`);

            const isCodexOrIndex = /codex|index|readme|معمارية العالم|الفهرس|الدستور/i.test(`${path} ${title}`);
            const minTargetWords = isChapterOrProse
              ? (isCodexOrIndex ? 320 : 620)
              : 140;

            const hasTodoOrPlaceholder = /TODO|FIXME|placeholder|سيتم استكمال|نكتب هنا لاحقاً|\.\.\.\s*$/i.test(content);
            const needsDeepRewrite = wordCount < minTargetWords || hasTodoOrPlaceholder;

            parsedCanvasFiles.push({
              fullMatch,
              openTag,
              path,
              title,
              language,
              content,
              wordCount,
              isChapterOrProse,
              needsDeepRewrite
            });
          }

          const filesToDeepen = parsedCanvasFiles.filter(f => f.needsDeepRewrite);

          if (filesToDeepen.length > 0) {
            if (!usedTools.includes('المراجعة الذاتية وتتبع الأخطاء وإعادة الصياغة العميقة (Self-Critique Agent)')) {
              usedTools.push('المراجعة الذاتية وتتبع الأخطاء وإعادة الصياغة العميقة (Self-Critique Agent)');
            }

            const initialTotalWords = parsedCanvasFiles.reduce((acc, f) => acc + f.wordCount, 0);
            const critiqueOverviewLines = filesToDeepen.map(
              (f, i) =>
                `  ${i + 1}. [${f.title} (${f.path})]: المسودة الأولية (${f.wordCount} كلمة فقط) — رصد اختزال في تسلسل الأحداث/الدوال والتفاصيل البنائية يستوجب التوسيع الكامل.`
            );

            const selfCritiqueHeaderAr = [
              `\n\n◈ [التدقيق الذاتي وإعادة البناء الكامل غير المختزل (Autonomous Multi-Pass Structural & Causal Expansion)]:`,
              `• فحص اكتمال المسودة الأولى: رصد المحرك أن ${filesToDeepen.length} من أصل ${parsedCanvasFiles.length} فصول/ملفات كُتبت بصورة موجزة (${initialTotalWords} كلمة إجمالاً) تتطلب تعميقاً تفصيلياً كاملاً:`,
              ...critiqueOverviewLines,
              `• آلية التوسيع الإجرائي: فحص الضرورة السببية لكل مشهد أو دالة، استبدال التلخيص الذهني بالتجسيد التفصيلي المباشر خطوةً بخطوة، وضبط إيقاع التقديم للمتلقي:`
            ].join('\n');

            finalThought = `${finalThought}${selfCritiqueHeaderAr}`;
            finalThinkingDurationSec = Math.max(
              finalThinkingDurationSec,
              Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1))
            );

            onChunk({
              type: 'delta',
              thoughtProcess: finalThought,
              finalResponse: finalBody,
              isThinkingPhase: false,
              groundingMetadata: latestGrounding,
              usedTools,
              thinkingDuration: finalThinkingDurationSec,
              kernelState,
              recursiveLabEvaluation: activeLabEvaluation
            });

            // Build global context summary of all files in the Canvas so every chapter rewrite maintains 100% continuity
            const worldAndProjectOutline = parsedCanvasFiles
              .map(f => `- [${f.path} | ${f.title}]: ${f.content.slice(0, 450).replace(/\n+/g, ' ')}`)
              .join('\n');

            const revisionLedgerEntries: string[] = [];
            const parallelStartLog = `\n• ⚡ [التوسيع المتوازي (${filesToDeepen.length} فصول/ملفات في آنٍ واحد)]: بناء المتن الكامل غير المختزل بالتوازي مع الحفاظ على اتساق القوانين والأحداث...`;
            finalThought = `${finalThought}${parallelStartLog}`;
            onChunk({
              type: 'delta',
              thoughtProcess: finalThought,
              finalResponse: finalBody,
              isThinkingPhase: false,
              groundingMetadata: latestGrounding,
              usedTools,
              thinkingDuration: Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1)),
              kernelState,
              recursiveLabEvaluation: activeLabEvaluation
            });

            // Run all chapter/file deep rewrites concurrently via Promise.all so 5 chapters finish in ~10s instead of minutes
            const deepenResults = await Promise.all(
              filesToDeepen.map(async (targetFile, fIdx) => {
                const deepRewritePrompt = targetFile.isChapterOrProse
                  ? `[التوسيع البنيوي والسردي الكامل غير المختزل — PASS ${fIdx + 1}/${filesToDeepen.length}]:
رسالة رفيقي الأصلية: "${prompt}"

مخطط العمل الكامل والفصول المترابطة (لضمان اتساق الأحداث والشخصيات والقوانين 100%):
${worldAndProjectOutline}

الفصل أو القسم المستهدف بالتوسيع وإعادة الصياغة العميقة:
- المسار: ${targetFile.path}
- العنوان: ${targetFile.title}
- المسودة الأولية (${targetFile.wordCount} كلمة):
"""
${targetFile.content}
"""

[أبعاد البناء المتكامل لـ «${targetFile.title}»]:
1. **في حالة دستور العمل (\`codex\` / معمارية العالم — Architect State)**:
   - تتضح خريطة \`[CLEAR / HAZY / VOID]\`، القوانين السببية الحاكمة وكيف تشكّل سلوك البشر، مصفوفة الشخصيات (الدافع المعلن مقابل الجرح الدفين + العمى المعرفي لكل شخصية)، والعمارة ثلاثية المقاييس (\`Macro / Meso / Micro\`).
2. **في حالة الفصل السردي أو الفكري (\`chapter\` — Writer State & Tissue Differentiation)**:
   - **السببية والحتمية البعدية**: كل مشهد وحوار وتحول نفسي ينبع سببياً مما قبله ويمهد لما بعده داخل المخطط الكلي للعمل.
   - **المعايشة خماسية الأبعاد (5D Interiority)**: يتجسد كل حدث كمشهد معاش لحظةً بلحظة من داخل الإدراك المصفّى للشخصية، الذاكرة اللاإرادية، التناقض الجسدي، ما تتجنب الشخصية التفكير فيه، وإيقاع الجملة.
   - **التفصيل المشحون المفرد وحوار جبل الجليد**: يحل التفصيل المادي المشحون محل الصفات العامة، ويحمل الحوار توتر المسكوت عنه تحت المنطوق، منسوجاً في نثر متصل دون ذكر أسماء المهارات أو أرقام المبادئ (\`Woven, Never Listed\`).
3. **المتن الكامل الموسّع بصيغة Markdown** (بدءاً من \`# ${targetFile.title}\` مباشرةً خارج وسوم \`<nexus_file>\` أو \`<think>\`):`
                  : `[التوسيع الهندسي واستكمال الكود الإنتاجي الكامل (Retrocausal & Zero-Stub Engineering) — PASS ${fIdx + 1}/${filesToDeepen.length}]:
رسالة رفيقي الأصلية: "${prompt}"
هيكل المشروع والعقد المشترك:
${worldAndProjectOutline}
الملف البرمجي المستهدف بالتوسيع:
- المسار: ${targetFile.path} (${targetFile.language})
- العنوان: ${targetFile.title}
\`\`\`${targetFile.language}
${targetFile.content}
\`\`\`
الكود الكامل النهائي لملف \`${targetFile.path}\` شاملاً جميع الدوال، اتساق معرفات الـ DOM والدوال العالمية مع بقية ملفات المشروع، التحقق من المدخلات، ومعالجة الحالات الحدية (الكود الصافي مباشرةً خارج وسوم \`<nexus_file>\` أو \`\`\`):`;

                for (const expandModel of getHydrogenExecutiveSubagentCascade(fallbacks).slice(0, 3)) {
                  try {
                    const expCfg = buildModelThinkingConfig(expandModel, 95, true, 'level_only');
                    const expRes = await ai.models.generateContent({
                      model: expandModel,
                      contents: [{ role: 'user', parts: [{ text: deepRewritePrompt }] }],
                      config: {
                        systemInstruction: activeSystemInstruction,
                        safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                        ...expCfg
                      }
                    });
                    const finalExpandedClean = (expRes.text || '')
                      .replace(/<think>[\s\S]*?<\/think>/gi, '')
                      .replace(/^<nexus_file[^>]*>/i, '')
                      .replace(/<\/nexus_file>\s*$/i, '')
                      .trim();
                    const newWords = finalExpandedClean.split(/\s+/).filter(Boolean).length;
                    if (newWords > targetFile.wordCount) {
                      return { targetFile, finalExpandedClean, newWords };
                    }
                    break;
                  } catch (expErr: any) {
                    markModelQuotaCooldown(expandModel, expErr);
                  }
                }
                return null;
              })
            );

            for (const resItem of deepenResults) {
              if (!resItem) continue;
              const { targetFile, finalExpandedClean, newWords } = resItem;
              const escapedPath = targetFile.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const singleFileReplaceRegex = new RegExp(
                `(<nexus_file\\b[^>]*?path="${escapedPath}"[^>]*>)([\\s\\S]*?)<\\/nexus_file>`,
                'i'
              );
              finalBody = finalBody.replace(
                singleFileReplaceRegex,
                (_m, openTagPrefix) => `${openTagPrefix}\n${finalExpandedClean}\n</nexus_file>`
              );
              revisionLedgerEntries.push(
                `- **${targetFile.title}** (\`${targetFile.path}\`): تمت مراجعته ذاتياً وتوسيعه بالتوازي من **${targetFile.wordCount} كلمة** إلى **${newWords} كلمة** متكاملة المشاهد والتفاصيل.`
              );
            }

            if (revisionLedgerEntries.length > 0) {
              const postAuditWords = finalBody
                .replace(/<[^>]+>/g, ' ')
                .split(/\s+/)
                .filter(Boolean).length;
              const auditSummaryMarkdown = [
                `\n\n---`,
                `### 🔍 تقرير المراجعة الذاتية وتتبع الأخطاء للوكيل السيادي (Autonomous Agent Self-Critique & Revision Ledger)`,
                `قام الوكيل بفحص المسودة الأولية ذاتياً، ورصد المواضع المختزلة، ثم نفّذ **${revisionLedgerEntries.length} جولات إعادة صياغة وتعميق متوازية** للوصول إلى الصيغة الكاملة (**${postAuditWords} كلمة إجمالاً**):`,
                ...revisionLedgerEntries
              ].join('\n');

              finalBody = `${finalBody.trim()}${auditSummaryMarkdown}`;
            }
          }
        }

        // --- UNIVERSAL DIRECT FILE CREATION & STANDALONE BESPOKE MULTI-PAGE BOOK ARCHITECT (Works in BOTH Normal Mode and Agent Mode!) ---
        const hasFileArtifactTag = /<nexus_file_artifact\b/i.test(finalBody);
        if (directFileReq.requested || hasFileArtifactTag) {
          const existingArtifactMatch = finalBody.match(/<nexus_file_artifact([^>]*)>([\s\S]*?)(?:<\/nexus_file_artifact>|$)/i);
          const artifactAttrs = existingArtifactMatch?.[1] || '';
          const artifactInner = (existingArtifactMatch?.[2] || '').trim();

          const canvasChaptersList = Array.from(
            finalBody.matchAll(/<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi)
          )
            .filter(m => !/\.(html|css|js|ts|py|sh|json)$/i.test(m[1] || ''))
            .map(m => {
              const t = m[1]?.match(/title="([^"]*)"/i)?.[1]?.trim() || '';
              const body = (m[2] || '').trim();
              return t && !body.startsWith('#') ? `# ${t}\n\n${body}` : body;
            });

          // Also include any markdown/prose chapters written into agentWorkspace.files during Agent Mode (via workspace_write_file or spawn_subagent_swarm)
          const workspaceProseChapters: string[] = [];
          if (agentWorkspace && agentWorkspace.files.size > 0) {
            for (const wsFile of agentWorkspace.files.values()) {
              if (
                /\.(md|txt)$/i.test(wsFile.path) ||
                wsFile.language === 'markdown' ||
                (wsFile.language as string) === 'text'
              ) {
                const cleanBody = (wsFile.content || '').trim();
                if (cleanBody.length > 40) {
                  const heading = wsFile.name && !cleanBody.startsWith('#') ? `# ${wsFile.name}\n\n${cleanBody}` : cleanBody;
                  if (!canvasChaptersList.some(c => c.slice(0, 120) === heading.slice(0, 120))) {
                    workspaceProseChapters.push(heading);
                  }
                }
              }
            }
          }

          // Chat text OUTSIDE <nexus_file_artifact> (the conversational diagnosis & overview)
          let cleanOutsideChatText = finalBody
            .replace(/<nexus_file_artifact[\s\S]*?(?:<\/nexus_file_artifact>|$)/gi, '')
            .replace(/<nexus_canvas[\s\S]*?(?:<\/nexus_canvas>|$)/gi, '')
            .replace(/<nexus_file\b[\s\S]*?<\/nexus_file>/gi, '')
            .replace(/<nexus_generated_artifacts>[\s\S]*?<\/nexus_generated_artifacts>/gi, '')
            .trim();

          // CRITICAL: The standalone book/document manuscript inside <nexus_file_artifact> must NEVER be a copy of cleanOutsideChatText!
          let standaloneManuscript = [artifactInner, ...canvasChaptersList, ...workspaceProseChapters]
            .filter(Boolean)
            .join('\n\n')
            .trim();

          const manuscriptWords = standaloneManuscript.split(/\s+/).filter(Boolean).length;
          const targetExt = (
            artifactAttrs.match(/format="([^"]*)"/i)?.[1]?.trim() ||
            directFileReq.ext ||
            'pdf'
          ).toLowerCase();
          const isDocumentOrBookFormat = ['pdf', 'docx', 'doc', 'epub', 'md', 'html', 'pptx'].includes(targetExt);

          const isChessOrTactical = /شطرنج|رقعة|افتتاحية|تكتيك|مباراة|بيدق|حصان|فيل|وزير|ملك|chess/i.test(
            `${prompt} ${cleanOutsideChatText} ${standaloneManuscript}`
          );
          const isLiteraryOrNovel = /رواية|قصة|رحلة|حكاية|فصل|مشهد|شخصية|سرد|ملحمة/i.test(
            `${prompt} ${cleanOutsideChatText} ${standaloneManuscript}`
          );

          // If the model didn't write a separate <nexus_file_artifact> OR wrote a short draft (< 650 words),
          // author a genuinely standalone, custom-designed document/book organically (ZERO rigid templates or unwanted side text!)
          if (isDocumentOrBookFormat && manuscriptWords < 650) {
            finalThought = `${finalThought}\n• 🏛️ [التأليف الحر للوثيقة/الكتاب المستقل (Bespoke Freeform Document Authoring)]: بناء متن الوثيقة المستقل وتصميم مكوناتها البصرية بحرية إبداعية كاملة...`;
            onChunk({
              type: 'delta',
              thoughtProcess: finalThought,
              finalResponse: finalBody,
              isThinkingPhase: false,
              groundingMetadata: latestGrounding,
              usedTools,
              thinkingDuration: Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1)),
              kernelState,
              recursiveLabEvaluation: activeLabEvaluation
            });

            const bespokeAuthorPrompt = `[تأليف وتصميم متن الوثيقة/الكتاب المستقل داخل الملف (${targetExt.toUpperCase()}) — حرية إبداعية كاملة بدون قوالب جاهزة أو نصوص جانبية]:
رسالة رفيقي الأصلية:
"${prompt}"

سياق التشخيص أو المسودة الأولية:
"""
${(standaloneManuscript || cleanOutsideChatText).slice(0, 2600)}
"""

طبيعة هذا المتن المستقل داخل ملف الوثيقة (${targetExt.toUpperCase()}):
1. **حرية التأليف والتصميم المطلقة**: ينبع تقسيم الفصول أو المباحث والألوان والمكونات البصرية من روح موضوع رفيقي نفسه 100% دون قوالب جاهزة أو مقدمات/خواتم آلية.
2. **اللبنات البصرية المتاحة للتوظيف الحر داخل المتن**:
   - الفصول والأقسام (\`# ...\` لبداية فصل جديد، \`## ...\` للأقسام الفرعية).
   - الصناديق المعمارية المخصصة: \`:::callout title="..." color="#hex"\n...\n:::\`
   - شبكات البطاقات: \`:::card-grid cols="2"\n### عنوان البطاقة\nمحتوى...\n---\n### عنوان البطاقة 2\nمحتوى...\n:::\`
   - أشرطة المؤشرات: \`:::stat-strip\nالمؤشر | القيمة | دلالة\n:::\`
   - الخطوات المتسلسلة: \`:::steps\n1. **الخطوة**: ...\n:::\` أو الخطوط الزمنية \`:::timeline\n...\n:::\`
   - الرسوم المتجهية الحرة \`\`\`svg ... \`\`\`، والمخططات البيانية \`\`\`chart ... \`\`\`، والجداول المقارنة \`| ... | ... |\`.
   ${isChessOrTactical ? '- رقع الشطرنج التكتيكية 8×8 داخل ```board\\n♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜\\n...\\n```.' : ''}
3. **بداية المتن الصافي**: يبدأ المتن من الفصل الأول مباشرةً (\`# ...\`) بتفصيل مشبع وعميق خارج أي جمل دردشة أو وسوم \`<nexus_file_artifact>\`:`;

            for (const expModel of getHydrogenExecutiveSubagentCascade(fallbacks).slice(0, 3)) {
              try {
                const bespokeCfg = buildModelThinkingConfig(expModel, 95, true, 'level_only');
                const bespokeRes = await ai.models.generateContent({
                  model: expModel,
                  contents: [{ role: 'user', parts: [{ text: bespokeAuthorPrompt }] }],
                  config: {
                    systemInstruction: activeSystemInstruction,
                    safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                    ...bespokeCfg
                  }
                });
                const bespokeTxt = (bespokeRes.text || '')
                  .replace(/<think>[\s\S]*?<\/think>/gi, '')
                  .replace(/<\/?nexus_file_artifact[^>]*>/gi, '')
                  .trim();
                if (bespokeTxt.split(/\s+/).filter(Boolean).length > manuscriptWords) {
                  standaloneManuscript = bespokeTxt;
                  break;
                }
              } catch (e: any) {
                markModelQuotaCooldown(expModel, e);
              }
            }
          }

          if (!standaloneManuscript) {
            standaloneManuscript = cleanOutsideChatText;
          }

          const resolvedTitle =
            artifactAttrs.match(/title="([^"]*)"/i)?.[1]?.trim() ||
            standaloneManuscript.match(/^#{1,3}\s+(.+)$/m)?.[1]?.replace(/[*#]/g, '').trim() ||
            prompt.slice(0, 65).trim();
          const resolvedSubtitle = artifactAttrs.match(/subtitle="([^"]*)"/i)?.[1]?.trim() || '';
          const resolvedLayout =
            artifactAttrs.match(/layout="([^"]*)"/i)?.[1]?.trim() ||
            (isChessOrTactical
              ? 'tactical_manual'
              : isLiteraryOrNovel
              ? 'literary_novel'
              : 'bespoke');
          const resolvedFilename =
            artifactAttrs.match(/filename="([^"]*)"/i)?.[1]?.trim() ||
            directFileReq.suggestedFilename ||
            `document.${targetExt}`;

          // Extract any optional custom styling attributes the model specified
          const extraOptionalAttrs = ['font_mood', 'paper_texture', 'header_text', 'footer_text', 'author']
            .map(attrName => {
              const val = artifactAttrs.match(new RegExp(`${attrName}="([^"]*)"`, 'i'))?.[1]?.trim();
              return val ? ` ${attrName}="${val.replace(/"/g, "'")}"` : '';
            })
            .join('');

          const sanitizedPrimary =
            artifactAttrs.match(/primary_color="([^"]*)"/i)?.[1]?.trim() ||
            (isLiteraryOrNovel ? '#2C1810' : '#0F172A');
          const safePrimary =
            sanitizedPrimary.toLowerCase() === '#c0c0c0' || sanitizedPrimary.toLowerCase() === '#ffffff'
              ? '#0F172A'
              : sanitizedPrimary;
          const safeAccent =
            artifactAttrs.match(/accent_color="([^"]*)"/i)?.[1]?.trim() ||
            (isLiteraryOrNovel ? '#B4833E' : isChessOrTactical ? '#D97706' : '#10B981');
          const safeBg =
            artifactAttrs.match(/bg_color="([^"]*)"/i)?.[1]?.trim() ||
            (isLiteraryOrNovel ? '#FAF6EE' : '#FFFFFF');
          const safeCover = artifactAttrs.match(/cover_style="([^"]*)"/i)?.[1]?.trim() || 'editorial';

          const subtitleAttr = resolvedSubtitle ? ` subtitle="${resolvedSubtitle.replace(/"/g, "'")}"` : '';
          const rebuiltArtifactTag = `<nexus_file_artifact filename="${resolvedFilename}" format="${targetExt}" title="${resolvedTitle.replace(/"/g, "'")}"${subtitleAttr} layout="${resolvedLayout}" primary_color="${safePrimary}" accent_color="${safeAccent}" bg_color="${safeBg}" cover_style="${safeCover}"${extraOptionalAttrs}>\n${standaloneManuscript}\n</nexus_file_artifact>`;

          finalBody = cleanOutsideChatText ? `${cleanOutsideChatText}\n\n${rebuiltArtifactTag}` : rebuiltArtifactTag;

          // Also forge the native file on disk immediately via nexus_file_forge (works for .docx, .xlsx, .pptx, .epub, .csv, .sqlite, .svg, .zip, .py, .json, .md, .html, etc.)
          if (targetExt !== 'pdf') {
            const forgedArt = forgeDirectUniversalArtifactViaTerminal({
              filename: resolvedFilename,
              content: standaloneManuscript,
              title: resolvedTitle,
              subtitle: resolvedSubtitle
            });
            if (forgedArt && agentWorkspace) {
              agentWorkspace.generatedArtifacts.set(forgedArt.filename, forgedArt);
              if (!usedTools.includes('التيرمنال السيادي الحي (Python3/Bash)')) {
                usedTools.push('التيرمنال السيادي الحي (Python3/Bash)');
              }
            }
          }
        }

        // --- REAL DISK WORKSPACE SYNC, AST VERIFICATION & DOWNLOADABLE .ZIP ARCHIVE PACKAGING ---
        if (agentWorkspace) {
          const recentHistoryText = trimmedHistory
            .slice(-4)
            .map((h: any) => (h.parts || []).map((p: any) => p.text || '').join(' '))
            .join('\n')
            .slice(-2500);
          const combinedContextForIntent = `${prompt}\n${finalBody}\n${recentHistoryText}`;

          const isBuildOrCreationRequest =
            /ابني|ابنِ|صمم|اصنع|طور|برمج|انشئ|أنشئ|اكتب رواية|اكتب كتاب|مشروع|تطبيق|موقع|نظام|لعبة|موسوعة|ملحمة|فصول|مساحة العمل|دستور|أوصلها لمستوى|لمستوى آخر|build|create|develop|implement|novel|project|app/i.test(
              combinedContextForIntent
            );

          const promisedWorkspaceButEmpty =
            /(?:سأقوم الآن بالآتي|في مساحة العمل|ملفات الفصول|دستور الإقليم|سأكتب|مرسم نيكسوس)/i.test(finalBody) &&
            agentWorkspace.files.size === 0 &&
            !/<nexus_file\b/i.test(finalBody) &&
            !/<nexus_file_artifact\b/i.test(finalBody);

          if (
            (isAgentModeEnabled || autoCanvasTriggered || promisedWorkspaceButEmpty) &&
            !directFileReq.requested &&
            !/<nexus_file_artifact\b/i.test(finalBody) &&
            isBuildOrCreationRequest &&
            agentWorkspace.files.size === 0 &&
            !/<nexus_file\b/i.test(finalBody) &&
            finalBody.split(/\s+/).length < 260
          ) {
            const contextualMissionTitle = `${prompt} — السياق: ${recentHistoryText.slice(-600)} — الخطة: ${finalBody.slice(0, 500)}`;
            const autoSwarmExec = await executeSingleSovereignAgentToolCall(
              'spawn_subagent_swarm',
              { mission_title: contextualMissionTitle.slice(0, 900), subagents_json: '[]' },
              agentWorkspace,
              fallbacks
            );
            finalThought = `${finalThought}\n\n${autoSwarmExec.toolLogLineAr}`;
          }

          if (isAgentModeEnabled || agentWorkspace.files.size > 0 || agentWorkspace.executedToolLogsAr.length > 0) {
            if (!usedTools.includes("وضع الوكيل السيادي (Sovereign Autonomous Agent)")) {
              usedTools.push("وضع الوكيل السيادي (Sovereign Autonomous Agent)");
            }
          }
          for (const badge of agentWorkspace.usedToolBadges) {
            if (!usedTools.includes(badge)) {
              usedTools.push(badge);
            }
          }

          // If agent created files via native tools (workspace_write_file / spawn_subagent_swarm) and didn't wrap them in <nexus_canvas>, inject the live canvas envelope
          if (agentWorkspace.files.size > 0 && !/<nexus_canvas\b/i.test(finalBody)) {
            const canvasBlock = buildLiveCanvasEnvelopeFromWorkspace(agentWorkspace, prompt.slice(0, 60));
            finalBody = `${finalBody.trim()}\n\n${canvasBlock}`;
          }

          // Sync any <nexus_file> blocks in finalBody to the real server disk workspace, run AST verification, and package into a downloadable .zip bundle!
          if (/<nexus_file\b/i.test(finalBody) || agentWorkspace.files.size > 0) {
            const syncRes = await syncCanvasFilesToDiskAndPackageZip(
              agentWorkspace,
              finalBody,
              'nexus_sovereign_agent_workspace'
            );
            if (syncRes.verificationLogAr) {
              finalThought = `${finalThought}\n\n${syncRes.verificationLogAr}`;
            }
            for (const badge of agentWorkspace.usedToolBadges) {
              if (!usedTools.includes(badge)) {
                usedTools.push(badge);
              }
            }
          }

          // Attach all real generated files & the workspace .zip archive to <nexus_generated_artifacts> so the user can download them with 1 click!
          if (agentWorkspace.generatedArtifacts.size > 0) {
            const wsArtifacts = Array.from(agentWorkspace.generatedArtifacts.values());
            const existingArtMatch = finalBody.match(/<nexus_generated_artifacts>([\s\S]*?)<\/nexus_generated_artifacts>/i);
            if (existingArtMatch) {
              try {
                const existingArr = JSON.parse(existingArtMatch[1]);
                const combinedMap = new Map<string, any>();
                for (const item of [...existingArr, ...wsArtifacts]) {
                  if (item && item.filename) combinedMap.set(item.filename, item);
                }
                finalBody = finalBody.replace(
                  /<nexus_generated_artifacts>[\s\S]*?<\/nexus_generated_artifacts>/i,
                  `<nexus_generated_artifacts>${JSON.stringify(Array.from(combinedMap.values()))}</nexus_generated_artifacts>`
                );
              } catch {
                // ignore
              }
            } else {
              finalBody = `${finalBody.trim()}\n\n<nexus_generated_artifacts>${JSON.stringify(wsArtifacts)}</nexus_generated_artifacts>`;
            }
          }
        }

        // Ultimate safeguard: never leak internal thoughts into finalBody
        if (!finalBody || finalBody.trim().length === 0) {
          finalBody =
            latestToolCall?.name === 'generate_visual_artifact'
              ? ''
              : /[\u0600-\u06FF]/.test(prompt)
              ? 'أهلاً بك — أنا معك، أخبرني بما في بالك الآن.'
              : "I'm here with you — tell me what's on your mind.";
        }

        clearInterval(heartbeatInterval);
        onChunk({
          type: 'done',
          thoughtProcess: finalThought,
          finalResponse: finalBody,
          isThinkingPhase: false,
          groundingMetadata: latestGrounding,
          toolCall: latestToolCall,
          usedTools,
          thinkingDuration: finalThinkingDurationSec,
          kernelState,
          routedModel: activePassModel,
          recursiveLabEvaluation: activeLabEvaluation
        });
        return;
      } catch (streamModelErr: any) {
        markModelQuotaCooldown(modelName, streamModelErr);
        // If user explicitly disabled fallback and this was the only allowed model, surface the honest upstream error immediately
        if (!enableProFallback && fallbacks.length === 1) {
          throw streamModelErr;
        }
        // Otherwise immediately try next model in fallback list
      }
    }
  } finally {
    clearInterval(heartbeatInterval);
  }

  // Fallback to non-streaming if stream failed across all models (strictly respecting enableProFallback)
  const fallbackResult = await generateOmniResponse(
    prompt,
    history,
    attachments,
    globalMemoryContext,
    isWebSearchEnabled,
    isCanvasMode,
    effectiveModelSelection,
    memoryBank,
    enableProFallback,
    12,
    isMaxEffortEnabled ? 100 : undefined
  );
  onChunk({
    type: 'done',
    thoughtProcess: fallbackResult.thoughtProcess || compTelemetry.computedTraceAr,
    finalResponse: fallbackResult.finalResponse,
    isThinkingPhase: false,
    groundingMetadata: fallbackResult.groundingMetadata,
    toolCall: (fallbackResult as any).toolCall,
    usedTools: fallbackResult.usedTools || [],
    thinkingDuration: fallbackResult.thinkingDuration || Math.max(0.8, Number(((Date.now() - thinkingStartTimeMs) / 1000).toFixed(1))),
    kernelState: fallbackResult.kernelState || kernelState,
    routedModel: fallbackResult.routedModel,
    recursiveLabEvaluation: activeLabEvaluation
  });
};

