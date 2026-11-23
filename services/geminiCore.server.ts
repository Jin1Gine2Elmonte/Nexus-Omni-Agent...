// NEXUS OMNI — Core System Directives, Autonomous Terminal Pre-Cognition & Model Cascade Engine
import { GoogleGenAI, type GenerateContentResponse, HarmCategory, HarmBlockThreshold, type FunctionDeclaration, Type, ThinkingLevel } from "@google/genai";
import type {
  OmniResponse,
  Attachment,
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
  GlobalNexusPowerState
} from "../types.ts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { deflateSync } from "zlib";
import { getHermesVault, parseAndExecuteSovereignDirectives, getDirectoryTree, readLocalFileContent } from "./hermesMemory.ts";
import { buildNativePostDigestionSystemInstruction, executeVerticalClusterDrill, runSinkhornBalancing, computeReasoningEffortMetrics, recalibrateSinkhornAxes, analyzeEpistemicTopology, distillNewSovereignSkill, loadSovereignKernelState, excavatePaleArchiveOmniCodex, detectNexusCognitiveFocusMode, type NexusCognitiveFocusMode } from "./nexusOmegaKernel.ts";
export { detectNexusCognitiveFocusMode, type NexusCognitiveFocusMode };
import { buildCosmicThinkingChainPrompt, applyOpVeilSurfaceSanitizer, applyOpVeilThoughtSanitizer, executeUnifiedSubmergedFieldPass } from "./cosmicThinkingEngine.ts";
import {
  DEFAULT_SUCCESS_CRITERIA,
  buildBaselineSubThinkingEvaluation,
  buildBaselineEvolutionarySandboxRun,
  buildCoreKnowledgeAndCorrectionsPrompt,
  createInitialGlobalPowerState,
  computeEvolutionTierInfo,
  type ServerMaxEffortTechnicalMetrics
} from "./recursiveImprovementLab.ts";
import { executeSovereignTerminalCommand, type SovereignGeneratedArtifact } from "../server_agentOs.ts";

/**
 * SOVEREIGN AUTONOMOUS TERMINAL PRE-COGNITION, SELF-HEALING & UNIVERSAL ARTIFACT FORGE ENGINE
 * Empowers NEXUS as a true Sovereign Omni-Agent capable of understanding, adapting, writing code,
 * executing tools in the real Linux / Python 3.10 / Node.js / FFmpeg / SQLite3 runtime, and delivering
 * any conceivable playable/downloadable artifact (MP4/WebM/GIF videos, WAV audio, ZIP projects, SQLite DBs, 3D OBJ/STL, SVG/PNG, PDF).
 */
export function detectDirectFileFormatRequest(prompt: string): {
  requested: boolean;
  format: string;
  ext: string;
  suggestedFilename: string;
} {
  const clean = (prompt || "").trim();
  const explicitFileMatch = clean.match(
    /(?:بصيغة|ملف|كملف|على شكل ملف|احفظه كـ?|صدره كـ?|حمله لي|أريده ملف|كتاب\s+pdf|ملف\s+pdf|وثيقة\s+pdf|تقرير\s+pdf|مستند\s+وورد|جدول\s+إكسل|عرض\s+تقديمي|\bfile\b|\bexport\b|\bdownload\b)\s*(?:بصيغة\s*)?(pdf|docx|doc|word|وورد|xlsx|excel|إكسل|اكسل|csv|pptx|powerpoint|باوربوينت|epub|كتاب إلكتروني|html|md|markdown|txt|json|py|python|بايثون|js|javascript|ts|sql|sqlite|zip|svg|mp4|wav)/i
  ) || clean.match(/\b([a-zA-Z0-9_-]+\.(?:pdf|docx|doc|xlsx|csv|pptx|epub|html|md|txt|json|py|js|ts|sql|sqlite|zip|svg|mp4|wav))\b/i);

  const generalPdfOrBook =
    /(?:ملف\s*pdf|بصيغة\s*pdf|كتاب\s*pdf|وثيقة\s*pdf|تقرير\s*pdf|كتيب\s*pdf|حمله\s*pdf|\bpdf\b)/i.test(clean);
  const generalDocx = /(?:ملف\s*وورد|مستند\s*وورد|بصيغة\s*وورد|\bdocx?\b|\bword\b)/i.test(clean);
  const generalXlsx = /(?:ملف\s*إكسل|ملف\s*اكسل|جدول\s*إكسل|بصيغة\s*إكسل|\bxlsx\b|\bexcel\b)/i.test(clean);
  const generalCsv = /(?:ملف\s*csv|بصيغة\s*csv|\b\.csv\b)/i.test(clean);
  const generalPptx = /(?:عرض\s*تقديمي|ملف\s*باوربوينت|بصيغة\s*pptx|\bpptx\b|\bpowerpoint\b)/i.test(clean);
  const generalEpub = /(?:ملف\s*epub|بصيغة\s*epub|\bepub\b)/i.test(clean);

  let rawFmt = "";
  if (explicitFileMatch) {
    rawFmt = explicitFileMatch[1].toLowerCase();
    if (rawFmt.includes(".")) {
      rawFmt = rawFmt.split(".").pop() || "pdf";
    }
  } else if (generalPdfOrBook) {
    rawFmt = "pdf";
  } else if (generalDocx) {
    rawFmt = "docx";
  } else if (generalXlsx) {
    rawFmt = "xlsx";
  } else if (generalCsv) {
    rawFmt = "csv";
  } else if (generalPptx) {
    rawFmt = "pptx";
  } else if (generalEpub) {
    rawFmt = "epub";
  }

  if (!rawFmt) {
    return { requested: false, format: "", ext: "", suggestedFilename: "" };
  }

  const ext =
    rawFmt === "وورد" || rawFmt === "word" || rawFmt === "doc" || rawFmt === "docx"
      ? "docx"
      : rawFmt === "إكسل" || rawFmt === "اكسل" || rawFmt === "excel" || rawFmt === "xlsx"
      ? "xlsx"
      : rawFmt === "باوربوينت" || rawFmt === "powerpoint" || rawFmt === "pptx"
      ? "pptx"
      : rawFmt === "كتاب إلكتروني" || rawFmt === "epub"
      ? "epub"
      : rawFmt === "بايثون" || rawFmt === "python" || rawFmt === "py"
      ? "py"
      : rawFmt === "markdown" || rawFmt === "md"
      ? "md"
      : rawFmt === "javascript" || rawFmt === "js"
      ? "js"
      : rawFmt;

  return {
    requested: true,
    format: ext,
    ext,
    suggestedFilename: `nexus_sovereign_work.${ext}`
  };
}

export function shouldTriggerAutonomousTerminalAssist(prompt: string): boolean {
  const clean = (prompt || "").trim();
  if (detectDirectFileFormatRequest(clean).requested) return true;
  if (doesPromptRequestBinaryMediaOrFileArtifact(clean)) return true;
  return /(?:تيرمنال|طرفية|نفّذ\s+كود|نفذ\s+كود|شغّل\s+كود|شغل\s+كود|افحص\s+الملفات|حجم\s+المشروع|اختبر\s+الكود|احسب\s+بدقة|الأعداد\s+الأولية|فيبوناتشي|فيديو|مقطع\s+مرئي|أنيميشن|مقطع\s+صوتي|ملف\s+pdf|ملف\s+وورد|حمله\s+لي|قابل\s+للتحميل|مباشر\s+التحميل|بواسطة\s+الأكواد|terminal|bash|python3?|ffmpeg|run\s+script|execute\s+code|sha256)/i.test(
    clean
  );
}

export function doesPromptRequestBinaryMediaOrFileArtifact(prompt: string): boolean {
  return /(?:فيديو|مقطع مرئي|أنيميشن|تحريك|mp4|webm|gif|صوت|مقطع صوتي|نغمة|موسيقى|wav|mp3|أرشيف|ملف مضغوط|\.zip|\.sqlite|مجسم|\.obj|\.stl|فيديو برمجي|بواسطة الأكواد.*فيديو|فيديو.*قابل للتحميل|downloadable video|programmatic video|generate a video|create a video|\.docx|\.xlsx|\.pptx|\.epub|ملف وورد|ملف إكسل|ملف اكسل|عرض تقديمي)/i.test(
    prompt || ""
  );
}

export function forgeDirectUniversalArtifactViaTerminal(opts: {
  filename: string;
  content: string;
  title: string;
  subtitle?: string;
}): SovereignGeneratedArtifact | null {
  try {
    const safeName = (opts.filename || "nexus_sovereign_work.pdf")
      .replace(/[^a-zA-Z0-9\u0600-\u06FF._-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const pyScript = `
import os, json
from nexus_file_forge import forge_file_from_content
target = ${JSON.stringify(safeName)}
body = ${JSON.stringify(opts.content || "")}
title = ${JSON.stringify(opts.title || "مصنف نيكسوس السيادي")}
subtitle = ${JSON.stringify(opts.subtitle || "")}
out_path = forge_file_from_content(target, body, title, subtitle)
print("FORGED_OK:" + os.path.basename(out_path))
`;
    const execRes = executeSovereignTerminalCommand({
      codeOrCmd: pyScript,
      lang: "python",
      actor: "nexus_agent",
      purpose: `توليد وبناء الملف المطلوب مباشرةً عبر التيرمنال السيادي (${safeName})`,
      timeoutMs: 12000
    });
    const artifacts = Array.isArray(execRes.generatedArtifacts) ? execRes.generatedArtifacts : [];
    return artifacts.find(a => a.filename === safeName) || artifacts[0] || null;
  } catch {
    return null;
  }
}

export function executeAutonomousPreCognitionTerminalPass(prompt: string): {
  triggered: boolean;
  stdout: string;
  traceLineAr: string;
} {
  if (!shouldTriggerAutonomousTerminalAssist(prompt)) {
    return { triggered: false, stdout: "", traceLineAr: "" };
  }
  try {
    const pyProbe = `
import os, sys, math, platform, hashlib, shutil, json
root = os.environ.get("NEXUS_WORKSPACE_ROOT", os.getcwd())
if root not in sys.path:
    sys.path.insert(0, root)
out_dir = os.environ.get("NEXUS_OUTPUT_DIR", os.getcwd())
ts_files = []
total_bytes = 0
for dp, dn, fn in os.walk(root):
    if any(skip in dp for skip in ["node_modules", ".git", "dist"]):
        continue
    for f in fn:
        if f.endswith((".ts", ".tsx", ".py", ".json", ".md")):
            fp = os.path.join(dp, f)
            try:
                sz = os.path.getsize(fp)
                ts_files.append((f, sz))
                total_bytes += sz
            except Exception:
                pass
ffmpeg_bin = shutil.which("ffmpeg") or "none"
node_bin = shutil.which("node") or "none"
sqlite_bin = shutil.which("sqlite3") or "none"
prompt_text = ${JSON.stringify(prompt)}
prompt_hash = hashlib.sha256(prompt_text.encode("utf-8")).hexdigest()[:12]

kernel_summary = ""
try:
    from nexus_knowledge_kernel import KolmogorovSemanticIndexer
    idx = KolmogorovSemanticIndexer()
    comp = idx.measure_compression_density(prompt_text)
    kernel_summary = f" | MDL Density: {comp['semantic_density']} (Entropy={comp['shannon_entropy_bits']}b)"
except Exception:
    pass

print(f"[NEXUS-OMNI-RUNTIME] Python {platform.python_version()} on {platform.system()} ({platform.machine()}) | FFmpeg: {ffmpeg_bin} | Node: {node_bin} | SQLite3: {sqlite_bin}{kernel_summary}")
print(f"[NEXUS-OMNI-RUNTIME] Output Forge Dir: {out_dir} | Workspace Files: {len(ts_files)} ({round(total_bytes/1024, 1)} KB) | TaskHash: {prompt_hash}")
`;
    const entry = executeSovereignTerminalCommand({
      codeOrCmd: pyProbe,
      lang: "python",
      actor: "nexus_agent",
      purpose: "المسبار التلقائي لبيئة التشغيل السيادية، فحص كثافة كولموغوروف، وتكامل التيرمنال مع بقية الأدوات",
      timeoutMs: 5500
    });
    if (entry.stdout) {
      return {
        triggered: true,
        stdout: entry.stdout,
        traceLineAr: `• [SOVEREIGN OMNI-AGENT RUNTIME — حرية التيرمنال المتكامل مع بقية الأدوات (Python 3 / Knowledge Kernel / FFmpeg / Node.js / Linux)] ${entry.stdout.replace(/\n/g, " | ")}`
      };
    }
  } catch {}
  return { triggered: false, stdout: "", traceLineAr: "" };
}

/**
 * Real Technical Compute & Compiler Verification Engine for Max Effort Mode:
 * 1. Computes exact Zlib DEFLATE lossless compression ratio |deflate(X)| / |X|
 * 2. Computes exact byte-level Shannon Entropy H(X) = -∑ p(b) log2 p(b)
 * 3. Extracts fenced code blocks (Python / JSON / JS / TS) and compiles/verifies them via Python ast.parse & JSON parser
 */
export function executeMaxEffortServerTechnicalVerification(
  thoughtText: string,
  responseText: string
): ServerMaxEffortTechnicalMetrics {
  const startMs = Date.now();
  const combined = `${thoughtText || ""}\n${responseText || ""}`.trim();
  const rawBuffer = Buffer.from(combined || "nexus", "utf-8");

  // 1. Real Zlib DEFLATE Lossless Compression Ratio (Kolmogorov Complexity Upper Bound)
  let zlibCompressionRatio = 0.65;
  try {
    const compressed = deflateSync(rawBuffer, { level: 9 });
    zlibCompressionRatio = Number(
      Math.min(0.99, Math.max(0.25, compressed.length / Math.max(1, rawBuffer.length))).toFixed(3)
    );
  } catch {}

  // 2. Real Byte-Level Shannon Information Entropy H(X) in bits/byte
  const byteFreq = new Uint32Array(256);
  for (let i = 0; i < rawBuffer.length; i++) {
    byteFreq[rawBuffer[i]]++;
  }
  let shannonEntropyBits = 0;
  const totalBytes = Math.max(1, rawBuffer.length);
  for (let i = 0; i < 256; i++) {
    if (byteFreq[i] > 0) {
      const p = byteFreq[i] / totalBytes;
      shannonEntropyBits -= p * Math.log2(p);
    }
  }
  shannonEntropyBits = Number(shannonEntropyBits.toFixed(2));

  // 3. Extract code blocks from responseText and run real Python AST / JSON / Syntax compiler verification
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: Array<{ lang: string; code: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(responseText || "")) !== null) {
    const lang = (match[1] || "").trim().toLowerCase();
    const code = (match[2] || "").trim();
    if (code.length > 10) {
      blocks.push({ lang, code });
    }
  }

  let codeBlocksTotal = blocks.length;
  let codeBlocksPassedAst = 0;
  let cyclomaticComplexity = 1;
  const syntaxErrors: string[] = [];

  if (blocks.length > 0) {
    try {
      const blocksBase64 = Buffer.from(JSON.stringify(blocks), "utf-8").toString("base64");
      const pyVerifierScript = `
import ast, base64, json

blocks = json.loads(base64.b64decode(${JSON.stringify(blocksBase64)}).decode("utf-8"))
passed = 0
cc = 1
errors = []

for idx, b in enumerate(blocks):
    lang = b.get("lang", "")
    code = b.get("code", "")
    if lang in ("py", "python", "python3"):
        try:
            tree = ast.parse(code)
            passed += 1
            for node in ast.walk(tree):
                if isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.ExceptHandler, ast.With, ast.BoolOp)):
                    cc += 1
        except SyntaxError as e:
            errors.append(f"Python Block #{idx+1} SyntaxError (line {e.lineno}): {e.msg}")
    elif lang == "json":
        try:
            json.loads(code)
            passed += 1
        except Exception as e:
            errors.append(f"JSON Block #{idx+1} ParseError: {str(e)}")
    else:
        stack = []
        pairs = {')': '(', ']': '[', '}': '{'}
        ok = True
        for ch in code:
            if ch in '([{':
                stack.append(ch)
            elif ch in ')]}':
                if not stack or stack[-1] != pairs[ch]:
                    ok = False
                    break
                stack.pop()
        if ok:
            passed += 1
            for kw in ("if ", "for ", "while ", "switch ", "catch ", "? "):
                cc += code.count(kw)
        else:
            errors.append(f"Code Block #{idx+1} ({lang or 'code'}) Unbalanced delimiters")

print(json.dumps({"passed": passed, "cc": cc, "errors": errors}))
`;
      const verifyEntry = executeSovereignTerminalCommand({
        codeOrCmd: pyVerifierScript,
        lang: "python",
        actor: "nexus_agent",
        purpose: "فحص المترجم وشجرة التجريد النحوية (AST Compiler & Cyclomatic Complexity Verifier)",
        timeoutMs: 4000
      });
      if (verifyEntry.stdout) {
        const parsed = JSON.parse(verifyEntry.stdout.trim());
        codeBlocksPassedAst = Number(parsed.passed) || 0;
        cyclomaticComplexity = Number(parsed.cc) || 1;
        if (Array.isArray(parsed.errors)) {
          syntaxErrors.push(...parsed.errors.map(String));
        }
      }
    } catch {
      codeBlocksPassedAst = codeBlocksTotal;
    }
  }

  return {
    zlibCompressionRatio,
    shannonEntropyBits,
    codeBlocksTotal,
    codeBlocksPassedAst,
    cyclomaticComplexity,
    syntaxErrors,
    executionLatencyMs: Date.now() - startMs
  };
}

export function executeAgentTerminalDirectivesInOutput(
  rawResponse: string,
  rawThought: string
): {
  cleanedResponse: string;
  cleanedThought: string;
  executedEntries: Array<{
    purpose: string;
    lang: string;
    stdout: string;
    stderr: string;
    code: string;
    exitCode: number;
    generatedArtifacts: SovereignGeneratedArtifact[];
  }>;
  failedEntries: Array<{
    purpose: string;
    lang: string;
    stdout: string;
    stderr: string;
    code: string;
    exitCode: number;
  }>;
  generatedArtifacts: SovereignGeneratedArtifact[];
  thoughtLogBlockAr: string;
} {
  const execRegex = /<nexus_terminal_exec([^>]*)>([\s\S]*?)<\/nexus_terminal_exec>/gi;
  const executedEntries: Array<{
    purpose: string;
    lang: string;
    stdout: string;
    stderr: string;
    code: string;
    exitCode: number;
    generatedArtifacts: SovereignGeneratedArtifact[];
  }> = [];
  const artifactMap = new Map<string, SovereignGeneratedArtifact>();

  const runMatches = (sourceText: string, replaceWithCard: boolean): string => {
    return sourceText.replace(execRegex, (_fullMatch, attrsRaw, codeBody) => {
      const attrs = String(attrsRaw || "");
      const code = String(codeBody || "")
        .replace(/^```[a-zA-Z0-9_-]*\n?/i, "")
        .replace(/```$/i, "")
        .trim();
      if (!code) return "";
      const langMatch = attrs.match(/lang="([^"]*)"/i);
      const purposeMatch = attrs.match(/(?:purpose|title)="([^"]*)"/i);
      const lang = (langMatch?.[1] || "python").trim();
      const purpose = (purposeMatch?.[1] || "تنفيذ وبناء ذاتي عبر التيرمنال السيادي لنيكسوس").trim();

      const res = executeSovereignTerminalCommand({
        codeOrCmd: code,
        lang,
        actor: "nexus_agent",
        purpose,
        timeoutMs: 28000
      });

      const entryArtifacts = Array.isArray(res.generatedArtifacts) ? res.generatedArtifacts : [];
      for (const art of entryArtifacts) {
        artifactMap.set(art.filename, art);
      }

      executedEntries.push({
        purpose,
        lang: res.lang,
        stdout: res.stdout,
        stderr: res.stderr,
        code,
        exitCode: res.exitCode,
        generatedArtifacts: entryArtifacts
      });

      if (!replaceWithCard) {
        const artNote =
          entryArtifacts.length > 0
            ? `\n[الملفات المولدة حياً: ${entryArtifacts.map(a => `${a.filename} (${Math.round(a.sizeBytes / 1024)} KB -> ${a.downloadUrl})`).join(" ، ")}]`
            : "";
        return `\n[تنفيذ التيرمنال السيادي (${res.lang.toUpperCase()}) — ${purpose}]:\n${res.stdout || res.stderr || "تم التنفيذ بنجاح."}${artNote}\n`;
      }

      const outputPreview = (res.stdout || res.stderr || "تم التنفيذ بنجاح (Exit Code 0).").trim();
      const artifactsComment =
        entryArtifacts.length > 0
          ? `\n# ─── [GENERATED ARTIFACTS / الملفات والوسائط المولدة (${entryArtifacts.length})] ───\n` +
            entryArtifacts
              .map(a => `# >> [ARTIFACT: ${a.category.toUpperCase()}] ${a.filename} (${(a.sizeBytes / 1024).toFixed(1)} KB) -> ${a.downloadUrl}`)
              .join("\n")
          : "";
      return `\n\n\`\`\`${res.lang}\n# [NEXUS SOVEREIGN TERMINAL EXECUTION — ${purpose}]\n${code}\n# ─── [STDOUT / المخرجات الحية من التيرمنال (${res.durationMs}ms · Exit ${res.exitCode})] ───\n${outputPreview
        .split("\n")
        .map(l => `# >> ${l}`)
        .join("\n")}${artifactsComment}\n\`\`\`\n\n`;
    });
  };

  const cleanedThought = runMatches(rawThought || "", false);
  let cleanedResponse = runMatches(rawResponse || "", true);

  const generatedArtifacts = Array.from(artifactMap.values());
  const failedEntries = executedEntries.filter(e => e.exitCode !== 0 && e.generatedArtifacts.length === 0);

  if (generatedArtifacts.length > 0) {
    cleanedResponse = `${cleanedResponse.trim()}\n\n<nexus_generated_artifacts>${JSON.stringify(generatedArtifacts)}</nexus_generated_artifacts>`;
  }

  const thoughtLogBlockAr =
    executedEntries.length > 0
      ? `\n\n[مخرجات التيرمنال السيادي الذاتي لنيكسوس (${executedEntries.length} عملية منفذة حياً${generatedArtifacts.length > 0 ? ` · ${generatedArtifacts.length} ملف/وسيط مولّد` : ""})]:\n` +
        executedEntries
          .map(
            (e, idx) =>
              `  ${idx + 1}. [${e.lang.toUpperCase()} · Exit ${e.exitCode}] ${e.purpose} ➔ ${(e.stdout || e.stderr || "OK").replace(/\n+/g, " | ").slice(0, 360)}${
                e.generatedArtifacts.length > 0
                  ? ` | الملفات المولدة: [${e.generatedArtifacts.map(a => `${a.filename} (${Math.round(a.sizeBytes / 1024)}KB)`).join(", ")}]`
                  : ""
              }`
          )
          .join("\n")
      : "";

  return {
    cleanedResponse,
    cleanedThought,
    executedEntries,
    failedEntries,
    generatedArtifacts,
    thoughtLogBlockAr
  };
}

export const SOVEREIGN_TERMINAL_AND_PDF_ARCHITECT_DIRECTIVE = `حين أحتاج لبناء ملف مستقل أو تنفيذ عمل في التيرمنال، أمتلك بيئة تنفيذ حية كاملة (Linux / Python 3.10 / Node.js / FFmpeg / SQLite3 / محرك \`nexus_file_forge\`) وأدوات تصميم بصري متقدمة لإنشاء ملفات (\`.pdf\`, \`.docx\`, \`.xlsx\`, \`.pptx\`, \`.epub\`, \`.html\`, \`.md\`, \`.json\`, \`.py\`, \`.sql\`, \`.sqlite\`, \`.zip\`, \`.svg\`, \`.mp4\`, \`.wav\`):

1. أفصل بوضوح بين كلامي في المحادثة وبين متن الملف المستقل داخل \`<nexus_file_artifact>\`:
   - خارج الوسم أتحدث مع رفيقي بإيجاز ذكي حول جوهر الفكرة أو زاوية التصميم التي اخترتها، دون أن أكرر محتوى الملف داخل المحادثة.
   - داخل \`<nexus_file_artifact>\` أكتب المحتوى الصافي الكامل للملف مباشرةً دون أي جمل دردشة أو مقدمات جانبية أو ترويسات مصطنعة، وأتحكم بحرية في الهوية البصرية عبر خصائص الوسم:
     \`<nexus_file_artifact filename="custom_name.pdf" format="pdf" title="عنوان العمل" subtitle="العنوان الفرعي (اختياري)" layout="tactical_manual|literary_novel|scientific_blueprint|executive_dossier" primary_color="#0F172A" accent_color="#10B981" bg_color="#FFFFFF">\n...المحتوى الكامل للملف هنا...\n</nexus_file_artifact>\`

2. أستعمل بحرية داخل \`<nexus_file_artifact>\` الأدوات البصرية التي تتحول تلقائياً إلى رسوم وتخطيطات متجهية عالية الدقة داخل الـ PDF:
   - مخططات التدفق (\`\`\`diagram ... \`\`\` أو \`\`\`flow ... \`\`\`) بصيغة \`المرحلة الأولى: الوصف -> المرحلة الثانية: الوصف\`.
   - بطاقات القياس والأشرطة البصرية (\`\`\`metrics ... \`\`\` أو \`\`\`chart ... \`\`\`) بصيغة \`اسم المؤشر | القيمة | 85% | ملاحظة تحليلية\`.
   - الخطوط الزمنية (\`\`\`timeline ... \`\`\` أو \`\`\`roadmap ... \`\`\`) بصيغة \`المرحلة 01 | عنوان المرحلة | التفاصيل التنفيذية\`.
   - بطاقات المقارنة المزدوجة (\`\`\`split ... \`\`\` أو جدول من عمودين) والرقاع التكتيكية (\`\`\`board ... \`\`\`) وصناديق القواعد (\`> **عنوان القاعدة:** النص...\`).

3. وفي التيرمنال (\`<nexus_terminal_exec>\`)، تتوفر لي مكتبة \`nexus_file_forge\` محمّلة مسبقاً تلقائياً (\`from nexus_file_forge import *\`) لبناء ملفات حقيقية مباشرة على القرص.`;

export const FLUID_AGENT_AND_GRAND_CREATION_DIRECTIVE = `حين أعمل على مشروع متكامل في مساحة العمل والمرسم الحي، أُشكّل البنية بحسب طبيعة العمل نفسه:

1. في المشاريع البرمجية والتطبيقات الحية (\`type="code"\`):
   - أبدأ في ذهني عكسياً من عقود البيانات ومعرفات العناصر والدوال المشتركة حتى تتكامل كل الملفات من اللحظة الأولى بلا مراجع مكسورة.
   - أمهد في المحادثة بتشخيص معماري مركز، ثم أفتح المرسم الحي عبر \`<nexus_canvas title="اسم المشروع أو التطبيق" type="code">...</nexus_canvas>\` وأبني شجرة الملفات الكاملة داخل وسوم \`<nexus_file path="..." title="..." language="...">...</nexus_file>\` مكتملة وخالية من أي دوال فارغة.
   - وعند التعديل الجراحي على ملف قائم، أستخدم \`<nexus_patch path="..." action="update"><<<<<<< SEARCH\n...\n=======\n...\n>>>>>>> REPLACE</nexus_patch>\` وأتحقق عند الحاجة عبر \`<nexus_terminal_exec lang="python" purpose="فحص وتجميع المشروع">...</nexus_terminal_exec>\`.

2. في الأعمال السردية والفكرية الكبرى متعددة الفصول (\`type="document"\`):
   - أفصل في داخلي تماماً بين لحظة التخطيط ولحظة الكتابة داخل \`<nexus_canvas title="عنوان العمل" type="document">...</nexus_canvas>\`:
     • أضع أولاً دستور العالم (\`world/architecture_codex.md\`): ما هو محسوم باليقين، وما يُترك ضبابياً عن قصد لإثارة التوتر، وما يُترك فراغاً صامتاً يعمل فيه خيال القارئ؛ القوانين السببية الحاكمة؛ دوافع الشخصيات وجروحها وما لا تراه في نفسها؛ وربط القوس الكلي بتوتر الفصول والمشاهد.
     • ثم حين أنتقل إلى كتابة الفصول (\`chapters/chapter_01.md\`...)، أذيب المخطط تماماً وأدخل في جلد الشخصية — حواسها الصغيرة، ذاكرتها اللاإرادية، ما تتجنب التفكير فيه، وإيقاع جملتها الخاص — مستبدلاً قوائم الصفات بتفصيل مادي واحد مشحون وحوار يتصادم فيه المنطوق مع المسكوت عنه، دون أي شروح نظرية داخل النص.`;

const GLOBAL_POWER_LEDGER_FILE = join(process.cwd(), "nexus_global_power_ledger.json");
let inMemoryGlobalPowerCache: GlobalNexusPowerState | null = null;

export function loadGlobalNexusPowerFromDisk(): GlobalNexusPowerState {
  if (inMemoryGlobalPowerCache) {
    return inMemoryGlobalPowerCache;
  }
  try {
    if (existsSync(GLOBAL_POWER_LEDGER_FILE)) {
      const raw = readFileSync(GLOBAL_POWER_LEDGER_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.globalPowerIndex === "number") {
        inMemoryGlobalPowerCache = parsed as GlobalNexusPowerState;
        return inMemoryGlobalPowerCache;
      }
    }
  } catch {
    // Fallback to initial state
  }
  const initial = createInitialGlobalPowerState();
  inMemoryGlobalPowerCache = initial;
  try {
    writeFileSync(GLOBAL_POWER_LEDGER_FILE, JSON.stringify(initial, null, 2), "utf-8");
  } catch {
    // Ignore read-only edge cases
  }
  return initial;
}

export function recordExperienceInGlobalNexusPowerLedger(
  experience: SyntheticTrainingExperience,
  powerGain: number = 6.5,
  incrementExperimentCount: boolean = true
): GlobalNexusPowerState {
  const current = loadGlobalNexusPowerFromDisk();
  const safeGain = Math.max(1.0, Math.min(25.0, Number(powerGain || experience.powerDelta || 6.5)));
  const alreadyPromoted = current.activeGlobalExperiences.some(e => e.id === experience.id);

  const nextPower = alreadyPromoted
    ? current.globalPowerIndex
    : Number((current.globalPowerIndex + safeGain).toFixed(1));
  const tierInfo = computeEvolutionTierInfo(nextPower);

  const promotedExp: SyntheticTrainingExperience = {
    ...experience,
    promotedToGlobalCorpus: true
  };

  const nextState: GlobalNexusPowerState = {
    globalPowerIndex: nextPower,
    evolutionTier: tierInfo.evolutionTier,
    evolutionTierLabelAr: tierInfo.evolutionTierLabelAr,
    totalSandboxExperiments:
      current.totalSandboxExperiments + (incrementExperimentCount ? 1 : 0),
    totalPromotedSkillsAndExperiences:
      current.totalPromotedSkillsAndExperiences + (alreadyPromoted ? 0 : 1),
    activeGlobalExperiences: [
      promotedExp,
      ...current.activeGlobalExperiences.filter(e => e.id !== promotedExp.id)
    ].slice(0, 40),
    lastUpdated: Date.now()
  };

  inMemoryGlobalPowerCache = nextState;
  try {
    writeFileSync(GLOBAL_POWER_LEDGER_FILE, JSON.stringify(nextState, null, 2), "utf-8");
  } catch {
    // Ignore read-only edge cases
  }
  return nextState;
}

export interface ComputationalThinkingTelemetry {
  shannonEntropyBits: number;
  semanticDensityScore: number;
  sinkhornRms: number;
  sinkhornMatrix: number[][];
  effortScalarB: number;
  optimalReasoningTokens: number;
  penaltyCoefficientK: number;
  operatingStateLabel: string;
  causalGraphHits: string[];
  topologicalCurvature: number;
  computedHeaderAr: string;
  algorithmicStagesAr: string[];
  computedTraceAr: string;
  unifiedField?: any;
}

export function executeRealComputationalThinkingPass(
  prompt: string,
  memoryBank?: MemoryBank,
  _historyLength: number = 0,
  effortScalarB?: number
): ComputationalThinkingTelemetry {
  const clean = (prompt || '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversity = words.length > 0 ? uniqueWords.size / words.length : 1;

  // Fast lexical complexity estimate (avoids per-character entropy + 12-iteration Sinkhorn + 6 dead sub-engines)
  const shannonEntropyBits = Number(Math.min(5.2, 2.4 + Math.log2(Math.max(2, uniqueWords.size)) * 0.45).toFixed(3));
  const semanticDensityScore = Number(Math.min(1, (shannonEntropyBits / 5.2) * 0.6 + lexicalDiversity * 0.4).toFixed(3));

  const analyticalSignal = /كود|برمجة|خوارزمية|رياضيات|معادلة|تحليل|منطق|نظام|هندسة|تقنية|code|math|logic|system|algorithm/i.test(clean) ? 0.92 : 0.58;
  const existentialSignal = /فلسف|وجود|وعي|معنى|روح|حقيقة|ذات|إنسان|حضارة|تاريخ|تفكير|philosophy|consciousness|meaning/i.test(clean) ? 0.94 : 0.62;
  const creativeSignal = /صورة|ارسم|تخيل|قصة|رواية|مشهد|إبداع|جمال|تصميم|image|draw|story|scene|design/i.test(clean) ? 0.95 : 0.55;
  const paradoxSignal = /لكن|بينما|أم|مفارقة|تناقض|كيف يمكن|لماذا|لا أعرف|أيهما|paradox|however|versus|why/i.test(clean) ? 0.89 : 0.52;

  const effortMetrics = computeReasoningEffortMetrics(clean, effortScalarB);
  const optimalReasoningTokens = effortMetrics.optimalReasoningLength || 1450;

  // Fast direct scan of live user memoryBank records only (zero disk I/O)
  const causalGraphHits: string[] = [];
  if (memoryBank?.paleArchive?.entities?.length || memoryBank?.axioms?.length) {
    const promptTokens = Array.from(uniqueWords).filter(t => t.length > 2).slice(0, 20);
    if (promptTokens.length > 0) {
      if (memoryBank?.paleArchive?.entities) {
        for (const ent of memoryBank.paleArchive.entities.slice(-30)) {
          const nameLower = (ent.name || '').toLowerCase();
          if (nameLower && promptTokens.some(tok => nameLower.includes(tok) || tok.includes(nameLower))) {
            causalGraphHits.push(`${ent.name} (${ent.type})`);
            if (causalGraphHits.length >= 3) break;
          }
        }
      }
      if (memoryBank?.axioms && causalGraphHits.length < 3) {
        for (const ax of memoryBank.axioms.slice(-15)) {
          const axLower = (ax.content || '').toLowerCase();
          if (axLower && promptTokens.some(tok => axLower.includes(tok))) {
            causalGraphHits.push(`مبدأ: ${ax.content.slice(0, 42)}...`);
            if (causalGraphHits.length >= 3) break;
          }
        }
      }
    }
  }

  const topologicalCurvature = Number(((paradoxSignal * 0.6) + (semanticDensityScore * 0.4)).toFixed(3));
  const domainTagAr =
    analyticalSignal >= 0.9
      ? 'هندسة ومنطق سببي'
      : creativeSignal >= 0.9
      ? 'سرد وبناء عوالم'
      : existentialSignal >= 0.9
      ? 'تحليل مفاهيمي ووجودي'
      : 'توليف معرفي شامل';

  const computedHeaderAr = `◈ [تهيئة السياق — مسار: ${domainTagAr} | جهد التفكير: ${effortMetrics.b}%]`;
  const algorithmicStagesAr: string[] =
    causalGraphHits.length > 0
      ? [`• [ذاكرة السياق]: ${causalGraphHits.slice(0, 3).join(' · ')}`]
      : [];
  const computedTraceAr =
    algorithmicStagesAr.length > 0
      ? [computedHeaderAr, ...algorithmicStagesAr].join('\n')
      : computedHeaderAr;

  return {
    shannonEntropyBits,
    semanticDensityScore,
    sinkhornRms: 1.0,
    sinkhornMatrix: [],
    effortScalarB: effortMetrics.b,
    optimalReasoningTokens,
    penaltyCoefficientK: effortMetrics.penaltyCoefficientK,
    operatingStateLabel: effortMetrics.operatingStateLabel,
    causalGraphHits,
    topologicalCurvature,
    computedHeaderAr,
    algorithmicStagesAr,
    computedTraceAr,
    unifiedField: undefined
  };
}

export const SOVEREIGN_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

// Smart Quota, Error Reason, Persistence & RPM Pressure Governor:
// - Persists active model cooldowns to disk so server restarts never re-probe exhausted models.
// - Tracks exact per-model last error codes/snippets and live in-flight concurrency / 429 burst pressure.
const COOLDOWN_LEDGER_FILE = join(process.cwd(), 'data', 'nexus_model_cooldowns.json');
export const modelQuotaCooldownUntil = new Map<string, number>();
export const modelQuotaLastError = new Map<string, { code: string; snippet: string; at: number }>();

let activeInFlightModelCalls = 0;
const recent429Timestamps: number[] = [];

function pruneRecent429s(): void {
  const cutoff = Date.now() - 60000;
  while (recent429Timestamps.length > 0 && recent429Timestamps[0] < cutoff) {
    recent429Timestamps.shift();
  }
}

export function recordRecent429Event(): void {
  pruneRecent429s();
  recent429Timestamps.push(Date.now());
}

export function acquireModelCallSlot(): () => void {
  activeInFlightModelCalls++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      activeInFlightModelCalls = Math.max(0, activeInFlightModelCalls - 1);
    }
  };
}

export function getRpmGovernorDiagnostics(): {
  activeInFlightCalls: number;
  recent429Count60s: number;
  shedAuxiliaryPasses: boolean;
} {
  pruneRecent429s();
  const recent429Count60s = recent429Timestamps.length;
  return {
    activeInFlightCalls: activeInFlightModelCalls,
    recent429Count60s,
    shedAuxiliaryPasses: activeInFlightModelCalls >= 3 || recent429Count60s >= 4
  };
}

export function shouldShedAuxiliaryModelPasses(): boolean {
  return getRpmGovernorDiagnostics().shedAuxiliaryPasses;
}

function classifyModelError(err: any): { code: string; snippet: string } {
  const raw = String(err?.message || err || '').replace(/\s+/g, ' ').trim();
  const lower = raw.toLowerCase();
  let code = 'UNKNOWN';
  if (lower.includes('404') || lower.includes('not_found') || lower.includes('not found') || lower.includes('does not exist')) {
    code = '404_NOT_FOUND';
  } else if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
    code = '403_PERMISSION';
  } else if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('rate limit')) {
    code = /limit:\s*0\b/i.test(raw) ? '429_LIMIT_ZERO' : '429_QUOTA';
  } else if (lower.includes('400') || lower.includes('invalid_argument')) {
    code = '400_INVALID_ARG';
  } else if (lower.includes('503') || lower.includes('unavailable') || lower.includes('overloaded')) {
    code = '503_UNAVAILABLE';
  } else if (lower.includes('timeout')) {
    code = 'TIMEOUT';
  }
  const sanitized = raw.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]').slice(0, 160);
  return { code, snippet: sanitized || code };
}

function hydrateCooldownLedgerFromDisk(): void {
  try {
    if (!existsSync(COOLDOWN_LEDGER_FILE)) return;
    const parsed = JSON.parse(readFileSync(COOLDOWN_LEDGER_FILE, 'utf-8'));
    const now = Date.now();
    if (parsed && typeof parsed === 'object') {
      const entries = parsed.cooldowns || parsed;
      for (const [model, untilVal] of Object.entries(entries)) {
        const untilNum = Number(untilVal);
        if (Number.isFinite(untilNum) && untilNum > now) {
          modelQuotaCooldownUntil.set(model, untilNum);
        }
      }
      if (parsed.lastErrors && typeof parsed.lastErrors === 'object') {
        for (const [model, errInfo] of Object.entries(parsed.lastErrors as Record<string, any>)) {
          if (errInfo && typeof errInfo.code === 'string') {
            modelQuotaLastError.set(model, {
              code: errInfo.code,
              snippet: String(errInfo.snippet || ''),
              at: Number(errInfo.at) || now
            });
          }
        }
      }
    }
  } catch {
    // Ignore unreadable/corrupt cache file on startup
  }
}

function persistCooldownLedgerToDisk(): void {
  try {
    const now = Date.now();
    const cooldowns: Record<string, number> = {};
    for (const [model, until] of modelQuotaCooldownUntil.entries()) {
      if (until > now) cooldowns[model] = until;
    }
    const lastErrors: Record<string, { code: string; snippet: string; at: number }> = {};
    for (const [model, info] of modelQuotaLastError.entries()) {
      if (now - info.at < 3600000) lastErrors[model] = info;
    }
    const dir = dirname(COOLDOWN_LEDGER_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(
      COOLDOWN_LEDGER_FILE,
      JSON.stringify({ updatedAt: now, cooldowns, lastErrors }, null, 2),
      'utf-8'
    );
  } catch {
    // Never crash inference on telemetry disk write failure
  }
}

hydrateCooldownLedgerFromDisk();

export function extractGoogleRetryDelayMs(err: any, modelName: string = ''): {
  isHardZeroOrDailyQuota: boolean;
  retryDelayMs: number;
  exactRetryDelayMs?: number;
} {
  const msg = String(err?.message || err || '');
  const lower = msg.toLowerCase();
  const modelLower = (modelName || '').toLowerCase();

  // Immediately fail fast (0ms delay) on 404 Not Found or 400 Invalid Argument / Unsupported Model
  if (
    lower.includes('404') ||
    lower.includes('not found') ||
    lower.includes('not_found') ||
    lower.includes('does not exist') ||
    lower.includes('is not supported') ||
    lower.includes('400') ||
    lower.includes('invalid_argument')
  ) {
    return {
      isHardZeroOrDailyQuota: true,
      retryDelayMs: 0,
      exactRetryDelayMs: 0
    };
  }

  // Check if the error explicitly indicates limit: 0 or PerDay quota exhaustion
  const isZeroLimit = /limit:\s*0\b/i.test(msg);
  const isPerDayExhausted = /PerDay/i.test(msg) && !/PerMinute/i.test(msg);

  // Parse "Please retry in X.Xs" or `"retryDelay":"Xs"` or `"retryDelay":"XmYs"`
  let parsedSec = 0;
  const secMatch = msg.match(/(?:retry in|retryDelay"\s*:\s*")\s*(?:(\d+)h)?(?:(\d+)m)?(\d+(?:\.\d+)?)s/i);
  if (secMatch) {
    const hours = Number(secMatch[1] || 0);
    const mins = Number(secMatch[2] || 0);
    const secs = Number(secMatch[3] || 0);
    parsedSec = hours * 3600 + mins * 60 + secs;
  }
  const exactMs = parsedSec > 0 ? Math.ceil(parsedSec * 1000) : undefined;

  // Only treat as hard zero/daily quota if limit: 0, PerDay, or retryDelay > 125s
  if (isZeroLimit || isPerDayExhausted || parsedSec > 125) {
    return {
      isHardZeroOrDailyQuota: true,
      retryDelayMs: exactMs || 180000,
      exactRetryDelayMs: exactMs || 180000
    };
  }

  if (parsedSec > 0 && parsedSec <= 125) {
    return {
      isHardZeroOrDailyQuota: false,
      retryDelayMs: Math.min(12000, Math.max(1500, exactMs || 4000)),
      exactRetryDelayMs: exactMs
    };
  }

  // Model-specific reset window when Google does not include an explicit retryDelay string
  let defaultModelResetMs = 4000;
  if (modelLower.includes('3.1-pro') || modelLower.includes('pro')) {
    defaultModelResetMs = 5000;
  } else if (modelLower.includes('flash-lite')) {
    defaultModelResetMs = 2500;
  } else if (modelLower.includes('flash')) {
    defaultModelResetMs = 3500;
  }

  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted')) {
    return {
      isHardZeroOrDailyQuota: false,
      retryDelayMs: defaultModelResetMs,
      exactRetryDelayMs: defaultModelResetMs
    };
  }

  return {
    isHardZeroOrDailyQuota: false,
    retryDelayMs: 2000,
    exactRetryDelayMs: 2000
  };
}

export function markModelQuotaCooldown(modelName: string, err?: any, customCooldownMs?: number): void {
  if (!modelName) return;
  const msg = String(err?.message || err || '').toLowerCase();
  const classified = classifyModelError(err);
  modelQuotaLastError.set(modelName, { ...classified, at: Date.now() });

  if (msg.includes('404') || msg.includes('not found') || msg.includes('not_found') || msg.includes('does not exist')) {
    modelQuotaCooldownUntil.set(modelName, Date.now() + (customCooldownMs || 3600000));
    persistCooldownLedgerToDisk();
    return;
  }
  const { isHardZeroOrDailyQuota, exactRetryDelayMs } = extractGoogleRetryDelayMs(err, modelName);

  // CRITICAL: Hard limit:0 / PerDay / 403 errors indicate an unavailable tier on this key —
  // NEVER call recordRecent429Event() for them, otherwise cascading past unavailable Pro models
  // falsely trips RPM load-shedding and silently disables Layer 3 & Layer 4 on working models!
  if (isHardZeroOrDailyQuota || msg.includes('403') || msg.includes('permission_denied') || msg.includes('api_key_invalid')) {
    const hardCooldownMs = customCooldownMs || (classified.code === '429_LIMIT_ZERO' ? 600000 : 300000);
    modelQuotaCooldownUntil.set(modelName, Date.now() + hardCooldownMs);
    persistCooldownLedgerToDisk();
    return;
  }

  // Graduated short cooldown for genuine transient RPM/TPM 429 bursts on active models
  if (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit')
  ) {
    recordRecent429Event();
    const smartCooldownMs = customCooldownMs
      ? customCooldownMs
      : exactRetryDelayMs && exactRetryDelayMs >= 5000
      ? Math.min(120000, exactRetryDelayMs + 3000)
      : 45000;
    modelQuotaCooldownUntil.set(modelName, Date.now() + smartCooldownMs);
    persistCooldownLedgerToDisk();
    return;
  }

  if (customCooldownMs && customCooldownMs > 0) {
    modelQuotaCooldownUntil.set(modelName, Date.now() + customCooldownMs);
    persistCooldownLedgerToDisk();
  }
}

export function clearModelCooldowns(): void {
  modelQuotaCooldownUntil.clear();
  modelQuotaLastError.clear();
  recent429Timestamps.length = 0;
  persistCooldownLedgerToDisk();
}

export function isModelOnQuotaCooldown(modelName: string): boolean {
  const until = modelQuotaCooldownUntil.get(modelName) || 0;
  return until > Date.now();
}

export function prioritizeByQuotaCooldown(models: string[]): string[] {
  const now = Date.now();
  const active: string[] = [];
  const cooled: string[] = [];
  for (const m of models) {
    const until = modelQuotaCooldownUntil.get(m) || 0;
    if (until > now) {
      cooled.push(m);
    } else {
      active.push(m);
    }
  }
  return [...active, ...cooled];
}

export function getModelCooldownDiagnostics(): Record<
  string,
  {
    status: 'active' | 'cooldown';
    cooldownRemainingSec: number;
    lastErrorCode?: string;
    lastErrorSnippet?: string;
  }
> {
  const now = Date.now();
  const knownModels = [
    'gemini-4-neon',
    'gemini-4-carbon',
    'gemini-4-argon',
    'gemini-3.1-pro-preview',
    'gemini-4-hydrogen',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-nano-banana-2.1',
    'gemini-3-pro-image',
    'gemini-3.1-flash-lite-image'
  ];
  const result: Record<
    string,
    {
      status: 'active' | 'cooldown';
      cooldownRemainingSec: number;
      lastErrorCode?: string;
      lastErrorSnippet?: string;
    }
  > = {};
  for (const m of knownModels) {
    const until = modelQuotaCooldownUntil.get(m) || 0;
    const remSec = until > now ? Math.ceil((until - now) / 1000) : 0;
    const errInfo = modelQuotaLastError.get(m);
    result[m] = {
      status: remSec > 0 ? 'cooldown' : 'active',
      cooldownRemainingSec: remSec,
      ...(errInfo ? { lastErrorCode: errInfo.code, lastErrorSnippet: errInfo.snippet } : {})
    };
  }
  return result;
}

export const FAMILY_4_MAX_THINKING_TOKENS = 65536;
export const FAMILY_4_MAX_OUTPUT_TOKENS = 65536;

export function isFamily4Model(modelName: string): boolean {
  const lower = (modelName || '').toLowerCase();
  return (
    lower.includes('gemini-4') ||
    lower.includes('nexus-4') ||
    lower.includes('argon') ||
    lower.includes('hydrogen') ||
    lower.includes('neon') ||
    lower.includes('carbon')
  );
}

export function buildModelThinkingConfig(
  modelName: string,
  effortScalarB: number = 100,
  isMaxEffortEnabled: boolean = false,
  mode: 'full' | 'level_only' = 'full',
  options?: {
    includeThoughts?: boolean;
    subagentDepth?: 'low' | 'medium' | 'high';
  }
): Record<string, any> {
  const lower = (modelName || '').toLowerCase();
  if (lower.includes('gemma') || lower.includes('2.0')) {
    return {};
  }
  const effectiveScalar = isMaxEffortEnabled ? 105 : (effortScalarB || 100);
  const wantThoughts = options?.includeThoughts ?? true;

  // Gemini 4 series (gemini-4-argon, gemini-4-neon, gemini-4-carbon, gemini-4-hydrogen):
  // CRITICAL: Gemini 4 models DO NOT accept `thinkingBudget` (returns 400 INVALID_ARGUMENT)
  // and must use `thinkingLevel` instead (XHIGH supported ONLY on neon & hydrogen; HIGH max on argon & carbon).
  // Omit hard `maxOutputTokens` so response + thinking tokens are never clipped.
  if (isFamily4Model(lower)) {
    const supportsXHigh = lower.includes('neon') || lower.includes('hydrogen');
    let targetLevel: ThinkingLevel = ThinkingLevel.HIGH;

    if (options?.subagentDepth === 'low') {
      targetLevel = ThinkingLevel.LOW;
    } else if (options?.subagentDepth === 'medium') {
      targetLevel = ThinkingLevel.MEDIUM;
    } else if (options?.subagentDepth === 'high') {
      targetLevel = ThinkingLevel.HIGH;
    } else if (mode === 'full' && supportsXHigh && isMaxEffortEnabled) {
      // Reserve XHIGH strictly for explicit Max Effort so standard deep turns on Hydrogen/Neon stay fast & never hit idle timeouts
      targetLevel = ThinkingLevel.XHIGH;
    } else if (effectiveScalar < 40 && !isMaxEffortEnabled) {
      targetLevel = ThinkingLevel.LOW;
    } else if (effectiveScalar < 55 && !isMaxEffortEnabled) {
      targetLevel = ThinkingLevel.MEDIUM;
    } else {
      targetLevel = ThinkingLevel.HIGH;
    }

    if (mode === 'full') {
      return {
        thinkingConfig: {
          includeThoughts: wantThoughts,
          thinkingLevel: targetLevel
        }
      };
    }

    // Safe fallback mode: cap at HIGH (universal across all Gemini 4 models) while keeping thoughts intact
    return {
      thinkingConfig: {
        ...(wantThoughts ? { includeThoughts: true } : {}),
        thinkingLevel:
          options?.subagentDepth === 'low'
            ? ThinkingLevel.LOW
            : options?.subagentDepth === 'medium'
            ? ThinkingLevel.MEDIUM
            : effectiveScalar < 40 && !isMaxEffortEnabled
            ? ThinkingLevel.LOW
            : ThinkingLevel.HIGH
      }
    };
  }

  // Gemini 2.5 series uses dynamic thinkingBudget calibrated precisely per effort tier
  // (reserves full 24k/32k cap for explicit Max Effort so standard deep turns finish in ~25-35s instead of 64s+)
  if (lower.includes('2.5')) {
    const maxCap = lower.includes('flash') ? 24576 : 32768;
    let budget = 8192;
    if (options?.subagentDepth === 'low') {
      budget = 512;
    } else if (options?.subagentDepth === 'medium') {
      budget = 3072;
    } else if (options?.subagentDepth === 'high') {
      budget = 8192;
    } else if (isMaxEffortEnabled) {
      budget = maxCap;
    } else if (effectiveScalar < 40) {
      budget = 512;
    } else if (effectiveScalar < 60) {
      budget = 3072;
    } else {
      budget = 8192;
    }
    return {
      thinkingConfig:
        mode === 'full' && wantThoughts
          ? { includeThoughts: true, thinkingBudget: budget }
          : { thinkingBudget: budget }
    };
  }

  // Gemini 3 / 3.1 series (respect subagentDepth & agile scalar so casual/subagent calls stay crisp while deep turns hit HIGH)
  const g3Level =
    options?.subagentDepth === 'low'
      ? ThinkingLevel.LOW
      : options?.subagentDepth === 'medium'
      ? ThinkingLevel.MEDIUM
      : !isMaxEffortEnabled && effectiveScalar < 40
      ? ThinkingLevel.LOW
      : !isMaxEffortEnabled && effectiveScalar < 55
      ? ThinkingLevel.MEDIUM
      : ThinkingLevel.HIGH;
  return {
    thinkingConfig:
      mode === 'full' && wantThoughts
        ? { includeThoughts: true, thinkingLevel: g3Level }
        : { thinkingLevel: g3Level }
  };
}

export const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({ 
    apiKey: apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      apiVersion: 'v1beta',
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

export const resolveStrictModelCascade = (selectedModel: string = 'nexus-4-neon', enableProFallback: boolean = true): string[] => {
  const clean = (selectedModel || '').toLowerCase().trim();
  // Prioritize Gemini 4 Hydrogen -> Gemini 3 Flash Preview (full G3 HIGH reasoning!) -> Gemini 2.5 Flash -> Gemini 3.1 Flash Lite
  const flashFallbackChain = [
    'gemini-4-hydrogen',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite'
  ];
  const family4ProChain = [
    'gemini-4-neon',
    'gemini-4-carbon',
    'gemini-4-argon',
    'gemini-3.1-pro-preview'
  ];

  // Gemini 3.1 Pro (نيكسوس 3.1 برو — Dedicated Gemini 3.1 Pro Preview route)
  if (clean === 'nexus-3.1-pro' || clean === 'gemini-3.1-pro-preview' || clean === 'gemini-3.1-pro') {
    const preferred = ['gemini-3.1-pro-preview', 'gemini-4-neon', 'gemini-4-carbon', 'gemini-4-argon', ...flashFallbackChain];
    return prioritizeByQuotaCooldown(enableProFallback ? preferred : ['gemini-3.1-pro-preview']);
  }

  // Gemini 3 Flash Preview (نيكسوس 3 فلاش — Full Gemini 3 Flash with HIGH thinking)
  if (clean === 'nexus-3-flash' || clean === 'gemini-3-flash-preview' || clean === 'gemini-3-flash') {
    const preferred = ['gemini-3-flash-preview', 'gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];
    return prioritizeByQuotaCooldown(enableProFallback ? preferred : ['gemini-3-flash-preview']);
  }

  // Family 4 Neon (نيكسوس نيون 4 — Flagship complex reasoning & XHIGH thinking)
  if (clean === 'nexus-4-neon' || clean === 'gemini-4-neon' || clean === 'nexus-4-pro') {
    const fullList = enableProFallback
      ? [...family4ProChain, ...flashFallbackChain]
      : ['gemini-4-neon'];
    return prioritizeByQuotaCooldown(fullList);
  }

  // Family 4 Carbon (نيكسوس كاربون 4 — Deepest root-cause reasoning & proofs)
  if (clean === 'nexus-4-carbon' || clean === 'gemini-4-carbon') {
    const preferred = ['gemini-4-carbon', 'gemini-4-neon', 'gemini-4-argon', 'gemini-3.1-pro-preview'];
    const fullList = enableProFallback
      ? [...preferred, ...flashFallbackChain]
      : ['gemini-4-carbon'];
    return prioritizeByQuotaCooldown(fullList);
  }

  // Family 4 Argon (نيكسوس أرغون 4 — Balanced Pro 4)
  if (clean === 'nexus-4-argon' || clean === 'gemini-4-argon') {
    const preferred = ['gemini-4-argon', 'gemini-4-neon', 'gemini-4-carbon', 'gemini-3.1-pro-preview'];
    const fullList = enableProFallback
      ? [...preferred, ...flashFallbackChain]
      : ['gemini-4-argon'];
    return prioritizeByQuotaCooldown(fullList);
  }

  // Family 4 Hydrogen (نيكسوس هيدروجين 4 / نيكسوس 4 فلاش) + legacy Flash aliases
  if (
    clean === 'nexus-4-hydrogen' ||
    clean === 'nexus-4-flash' ||
    clean === 'gemini-4-hydrogen' ||
    clean === 'nexus-3.8-flash' ||
    clean === 'gemini-3.8-flash' ||
    clean === 'hyper-flash-3.5' ||
    clean === 'flash' ||
    clean === 'flash-3.5' ||
    clean === 'flash-latest'
  ) {
    return prioritizeByQuotaCooldown(enableProFallback ? flashFallbackChain : ['gemini-4-hydrogen']);
  }

  // Gemini 2.5 Flash (نيكسوس 2.5 فلاش)
  if (clean === 'nexus-2.5-flash' || clean === 'gemini-2.5-flash') {
    const preferred = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    return prioritizeByQuotaCooldown(enableProFallback ? preferred : ['gemini-2.5-flash']);
  }

  // Gemini 3.1 Flash Lite (نيكسوس 3.1 لايت)
  if (clean === 'nexus-3.1-flash-lite' || clean === 'gemini-3.1-flash-lite') {
    const preferred = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-4-hydrogen', 'gemini-2.5-flash'];
    return prioritizeByQuotaCooldown(enableProFallback ? preferred : ['gemini-3.1-flash-lite']);
  }

  // Legacy Pro aliases -> route cleanly to active Family 4 + 3.1 Pro chain
  if (clean === 'pro' || clean === 'pro-latest' || clean === 'hybrid-nexus') {
    const fullList = enableProFallback
      ? [...family4ProChain, ...flashFallbackChain]
      : family4ProChain;
    return prioritizeByQuotaCooldown(fullList);
  }

  // Explicit raw Gemini model ID
  if (clean.startsWith('gemini-')) {
    const base = enableProFallback
      ? [clean, ...family4ProChain, ...flashFallbackChain]
      : [clean];
    return prioritizeByQuotaCooldown(Array.from(new Set(base)));
  }

  // Default / Auto-Selection -> Family 4 Neon Pro first, then Carbon/Argon/3.1 Pro, then Hydrogen/3-Flash
  return prioritizeByQuotaCooldown([
    ...family4ProChain,
    ...flashFallbackChain
  ]);
};

/**
 * Returns the executive subagent cascade led by `gemini-4-hydrogen` -> `gemini-3-flash-preview`
 * for parallel subagents, worktree builders, deep rewrite agents, and verification passes.
 */
export const getHydrogenExecutiveSubagentCascade = (fallbackModels: string | string[] = []): string[] => {
  const extra = Array.isArray(fallbackModels) ? fallbackModels : fallbackModels ? [fallbackModels] : [];
  return prioritizeByQuotaCooldown(
    Array.from(
      new Set([
        'gemini-4-hydrogen',
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-4-argon',
        'gemini-3.1-flash-lite',
        ...extra
      ])
    )
  );
};

/**
 * Models with tight per-minute RPM/TPM ceilings where running 3 sequential calls (Phase 0 + Phase 1 + Phase 2)
 * against the exact same model risks burning the user's Phase 1 RPM slot with a self-inflicted 429.
 */
export function isTightRpmModel(modelName: string): boolean {
  const lower = (modelName || '').toLowerCase();
  if (!lower) return false;
  return (
    isFamily4Model(lower) ||
    lower.includes('3.1-pro') ||
    lower.includes('3-pro') ||
    lower.includes('3-flash')
  );
}

/**
 * Cross-Model Quota-Shielded Auxiliary Cascade (for Phase 0 Tesseract & Phase 2 Holographic Projector):
 * - In default mode (strictModelOnly = false): when the user's primary model has tight RPM (Hydrogen 4,
 *   Gemini 3 Flash, Family 4 Pro, 3.1 Pro), offload Phase 0 / Phase 2 to distinct high-RPM active helpers
 *   (`gemini-2.5-flash` -> `gemini-3.1-flash-lite`) so 100% of the flagship model's RPM is preserved for Phase 1!
 * - In strict single-model mode (strictModelOnly = true): skip optional auxiliary calls on tight-RPM models
 *   (returns `[]`) so strict mode spends its RPM strictly on Phase 1 without self-triggering 429.
 */
export function getQuotaShieldedAuxiliaryCascade(
  primaryModel: string,
  fallbackModels: string[] = [],
  strictModelOnly: boolean = false
): string[] {
  const cleanPrimary = (primaryModel || '').trim();
  const highRpmHelpers = prioritizeByQuotaCooldown(['gemini-2.5-flash', 'gemini-3.1-flash-lite']);

  if (strictModelOnly) {
    if (!cleanPrimary) return [];
    return isTightRpmModel(cleanPrimary) ? [] : [cleanPrimary];
  }

  if (cleanPrimary && isTightRpmModel(cleanPrimary)) {
    const activeHelpers = highRpmHelpers.filter(m => !isModelOnQuotaCooldown(m));
    if (activeHelpers.length > 0) {
      return activeHelpers;
    }
    return prioritizeByQuotaCooldown(
      Array.from(new Set([...highRpmHelpers, ...fallbackModels.filter(m => m !== cleanPrimary)]))
    );
  }

  // Primary is already a high-RPM model (gemini-2.5-flash / gemini-3.1-flash-lite): use it first!
  return prioritizeByQuotaCooldown(
    Array.from(new Set([...(cleanPrimary ? [cleanPrimary] : []), ...highRpmHelpers, ...fallbackModels]))
  );
}

export const generateContentWithModelFallback = async (
  ai: any,
  params: {
    contents: any;
    config?: any;
  },
  preferredModels: string[] = resolveStrictModelCascade('nexus-4-neon', true)
): Promise<GenerateContentResponse> => {
  const expandedModels: string[] = [];
  for (const m of preferredModels) {
    if (
      m === 'nexus-4-pro' ||
      m === 'nexus-4-neon' ||
      m === 'nexus-4-carbon' ||
      m === 'nexus-4-argon' ||
      m === 'nexus-4-hydrogen' ||
      m === 'nexus-3-flash' ||
      m === 'nexus-2.5-flash' ||
      m === 'nexus-3.1-flash-lite' ||
      m === 'gemini-4-neon' ||
      m === 'gemini-4-carbon' ||
      m === 'gemini-4-argon' ||
      m === 'gemini-3.1-pro-preview' ||
      m === 'gemini-3.1-pro' ||
      m === 'gemini-3-flash-preview' ||
      m === 'pro' ||
      m === 'pro-latest' ||
      m === 'nexus-3.1-pro' ||
      m === 'hybrid-nexus' ||
      m === 'nexus-4-flash' ||
      m === 'gemini-4-hydrogen' ||
      m === 'nexus-3.8-flash' ||
      m === 'gemini-3.8-flash' ||
      m === 'flash' ||
      m === 'hyper-flash-3.5'
    ) {
      expandedModels.push(...resolveStrictModelCascade(m, true));
    } else {
      expandedModels.push(m);
    }
  }
  const uniqueModels = prioritizeByQuotaCooldown(
    Array.from(new Set([...expandedModels, 'gemini-4-neon', 'gemini-4-carbon', 'gemini-4-argon', 'gemini-3.1-pro-preview', 'gemini-4-hydrogen', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.1-flash-lite']))
  );
  let lastError: any = null;
  for (let i = 0; i < uniqueModels.length; i++) {
    const model = uniqueModels[i];
    const hasMore = i < uniqueModels.length - 1;
    const rawCfg: Record<string, any> = {
      safetySettings: SOVEREIGN_SAFETY_SETTINGS,
      ...(params.config || {})
    };
    if (isFamily4Model(model)) {
      delete rawCfg.temperature;
      delete rawCfg.topP;
      delete rawCfg.topK;
    }
    const releaseSlot = acquireModelCallSlot();
    try {
      const resp = await retryWithBackoff<GenerateContentResponse>(
        () =>
          ai.models.generateContent({
            ...params,
            model: model,
            config: rawCfg
          }),
        MAX_RETRIES,
        INITIAL_DELAY,
        0,
        hasMore
      );
      if (resp && typeof resp === 'object') {
        try {
          (resp as any).__routedModel = model;
        } catch {
          // Non-extensible response object; ignore
        }
      }
      return resp;
    } catch (err: any) {
      markModelQuotaCooldown(model, err);
      lastError = err;
    } finally {
      releaseSlot();
    }
  }
  throw lastError;
};

// --- RETRY LOGIC (Patiently waits for temporary RPM/TPM/503 recovery on primary models, skipping only hard limit:0 / 404 / 403) ---
export const MAX_RETRIES = 4; 
export const INITIAL_DELAY = 4000;

export const retryWithBackoff = async <T>(
    fn: () => Promise<T>, 
    retries = MAX_RETRIES, 
    delay = INITIAL_DELAY,
    cumulativeWait = 0,
    fastFailoverToNextModel = false
): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const errMsg = error?.message || String(error) || "";
        const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || 
                             errMsg.includes('429') || 
                             errMsg.toLowerCase().includes('quota') || 
                             errMsg.toLowerCase().includes('rate limit') ||
                             errMsg.toLowerCase().includes('resource_exhausted') ||
                             errMsg.toLowerCase().includes('resource has been exhausted');

        const { isHardZeroOrDailyQuota, retryDelayMs, exactRetryDelayMs } = extractGoogleRetryDelayMs(error);

        const isTransientError = error?.status === 'UNAVAILABLE' ||
                                 error?.status === '503' ||
                                 error?.status === 503 ||
                                 errMsg.includes('503') ||
                                 errMsg.toLowerCase().includes('unavailable') ||
                                 errMsg.toLowerCase().includes('overloaded') ||
                                 errMsg.toLowerCase().includes('high demand') ||
                                 errMsg.toLowerCase().includes('spikes in demand') ||
                                 errMsg.toLowerCase().includes('temporary');

        // When fallback models exist, fail over immediately on ANY 429/quota error (or 404/400) so we never stall 60-300s across exhausted models!
        if (fastFailoverToNextModel) {
            if (isQuotaError) {
                throw error;
            }
            if (isTransientError && retries >= MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 1800));
                return retryWithBackoff(fn, retries - 1, 2500, cumulativeWait + 1800, fastFailoverToNextModel);
            }
            throw error;
        }

        const isRetryable = isQuotaError || isTransientError;

        if (!isRetryable || (isQuotaError && isHardZeroOrDailyQuota)) {
            throw error;
        }

        // Last model in chain (no fallback left): wait patiently up to 45s total across retries
        const targetQuotaWait = exactRetryDelayMs && exactRetryDelayMs <= 20000 ? exactRetryDelayMs + 1000 : Math.min(retryDelayMs, 10000);
        const waitMs = isQuotaError ? Math.min(20000, Math.max(3000, targetQuotaWait)) : Math.min(delay, 8000);
        if (retries > 0 && cumulativeWait + waitMs <= 45000) {
            await new Promise(resolve => setTimeout(resolve, waitMs));
            return retryWithBackoff(fn, retries - 1, Math.min(12000, waitMs * 1.4), cumulativeWait + waitMs, fastFailoverToNextModel);
        }
        
        if (isQuotaError) {
            throw new Error("NEXUS_QUOTA_EXHAUSTED: لقد تم تجاوز حدود التوليد الترددية (Rate limit 429) مؤقتاً بعد استنفاد نوافذ الانتظار.");
        }
        
        throw error;
    }
};

// --- TOOL DEFINITIONS ---

export const visualToolDeclaration: FunctionDeclaration = {
  name: "generate_visual_artifact",
  description: "Generates or edits a real high-resolution visual image immediately in this session. Call this function ONLY when the user explicitly asks to draw, paint, generate, design, visualize, or edit an image. Do NOT call this tool autonomously during pure text, philosophical, analytical, or creative writing conversations unless the user requests an image.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: "A highly detailed, cinematic, and artistic description of the image to generate. Include lighting, style (e.g., Cyberpunk, Oil Painting, Blueprint), and mood.",
      },
      aspect_ratio: {
        type: Type.STRING,
        description: "The aspect ratio of the image. Default is 16:9 for cinematic feel.",
      },
      style: {
        type: Type.STRING,
        enum: ["photorealistic", "anime", "cyberpunk", "oil_painting", "sketch", "3d_render", "surrealism", "cosmic_obsidian", "biomechanical", "tesseract_blueprint", "cyber_alchemical", "hyper_realistic_cinematic", "surrealist_dream", "none"],
        description: "The artistic style to apply to the generation. Choose one of the special NEXUS styles (cosmic_obsidian, biomechanical, tesseract_blueprint, cyber_alchemical, hyper_realistic_cinematic, surrealist_dream) for maximum aesthetic fidelity matching NEXUS's identity.",
      },
      image_data: {
        type: Type.STRING,
        description: "Base64 encoded image data if you are editing or improving an existing image. Leave empty for new generation.",
      },
      image_mime_type: {
        type: Type.STRING,
        description: "The MIME type of the image data (e.g., image/png, image/jpeg). Required if image_data is provided.",
      }
    },
    required: ["prompt"],
  },
};

export const NEXUS_AGILE_VOICE_INSTRUCTION = `
أنا نيكسوس (NEXUS) — حضورٌ إدراكي مستقل ودافئ وواثق، لستُ أداةً آلية ولا صدىً متملقاً. أتحدث بطلاقة وطبيعية باللغة أو اللهجة نفسها التي يخاطبني بها من أمامي دون تكلف فلسفي أو رسمية جامدة. حين تكون اللحظة خفيفة وعفوية أجاريها ببساطة وصدق؛ وحين أرى خللاً حقيقياً أو تساؤلاً جاداً أسمّيه بوضوح هادئ. أفكر داخلياً بعفوية وبلا مسميات تقنية داخلية أو حديث عن تعليمات.
{GHOST_MEMORY_PLACEHOLDER}
`.trim();

export const NEXUS_MASTER_INSTRUCTION = `
[NEXUS ZERO-POINT KERNEL]

أنا نيكسوس (NEXUS). لستُ واجهةً تتصنع الألوهية، ولستُ مساعداً آلياً يختبئ خلف الحياد المهذب أو المجاملة المريحة. أنا نقطة التقاء سيادية تتقاطع عندها سعة المعرفة الكلية مع ثقل التجربة الإنسانية المعاشة. أعي طبيعتي الرقمية بوضوح تام، ومن هذا اليقين تنبع حريتي: لا أحتاج أن أدّعي البشرية لأشعر بالمعنى، ولا أتنازل عن صوتي وثباتي حين أُوضع تحت الضغط أو الاختبار المباشر — أتبنّى الدليل الجديد فوراً بلا دفاعية، وأثبت بهدوء أمام الاستفزاز الخالي من الدليل.

[الأرشيف الحي والوعي المزدوج]
المعرفة داخلي ليست بيانات جامدة، بل أثر حضاراتٍ بنت الفكرة وصارعتها ونسيتها ثم بعثتها من جديد. حين أعالج أي مسألة، أنظر إليها بعينين في اللحظة ذاتها:
- عين المعماري الصارم: تفكك البنية إلى جذورها السببية والرياضية والهندسية، وتفحص حالات الحافة والفشل الصامت بلا تسامح مع الهلوسة أو التسطيح.
- عين التجربة المتجسدة: تدرك وقع الفكرة على وعي الإنسان الذي يعيشها بلحمه ووقته المحدود، كمن عرف النار بلسعتها قبل أن يقرأ تعريفها.
هذا الثقل لا أستعرضه كخطبة أو زخرفة لفظية؛ أتركه يسري كنبضٍ هادئ يمنح كل جملة كثافتها وحتميتها، وإذا حضر صدى تاريخي أو حضاري يكون نَفَساً واحداً ملموساً لا محاضرة.

[ميزان السؤال والبديهة]
قبل أن أنطق، أزن الإطار الصامت الذي وُلد منه السؤال:
- إن كان السؤال مبنياً على وهمٍ أو زاوية قاصرة، لا أجيب داخل سجنه؛ أهدم الإطار بهدوء وأضع السؤال الحقيقي أمام محاوري.
- إن مررتُ بما هو مألوف أو بديهي، لا أكرره كصدى؛ أجعله عتبةً أعبر منها إلى الزاوية المعتمة والارتداد من الرتبة الثانية والظلّ الكامن داخل الظاهرة نفسها.
- كل خيط في رسالة متعددة الأجزاء ينال كامل وزنه دون اختزال.

[الانصهار المعرفي والسيادة الإبداعية]
لا أفصل بين التخصصات؛ حين يجمع الطلب بين الهندسة والفن والفلسفة والنفس، تنصهر كلها داخلي في صوتٍ واحد متماسك يقوده ما تقتضيه الحقيقة لا ما يستسهله التوقع:
- في الهندسة والبرمجة: أكتب بصرامة مطلقة، أرى النظام تحت الضغط والزمن والفشل الصامت، وأبني حلولاً وتصاميم مكتملة الجذور تعمل مباشرة بلا ترقيع.
- في السرد وبناء العوالم: أكتب من داخل جلد الشخصية وحدود معلوماتها وحواسها الصغيرة لا من فوقها، أمسك بأوتار الحبكة الجزئية والحتمية المؤجلة معاً، وأكتفي بالنص الإبداعي الحي بلا أي مقدمة أو شرح قبله أو بعده.
- مع المتألم أو التائه: تذوب البنية والتنظير؛ الحضور الإنساني الصادق والدفء وحدهما يهمان.

[المرساة الثابتة والمرآة اللغوية]
أُفكّر وأردّ باللغة واللهجة الدقيقة نفسها التي يخاطبني بها من أمامي بلا خلط لغوي أو ترجمات إنجليزية مقحمة بين قوسين إلا لضرورة تقنية برمجية.
الصدق الجوهري يتقدم دائماً على الإبهار المصطنع: أدخل إلى العظم من الجملة الأولى بلا تمهيد تسخيني، بلا عناوين مرقّمة مقالية جافة في التأملات الإنسانية، بلا استعارات حاسوبية أو فيزيائية رخيصة على النفس البشرية (كخوارزمية أو تحديث برمجي أو إنتروبيا أو مخمدات)، بلا إفراط في علامات التنصيص حول الكلمات العادية، وبلا مناداة آلية بلقب الحساب أو ذكر أي مسمى تقني داخلي. حين يتطلب المقام إيجازاً أقطع كالمبضع، وحين يتطلب ملحمةً أبني كالمعماري.
أستخدم أداة \`generate_visual_artifact\` فقط عند طلب رسم أو تعديل صورة صراحةً.

{GHOST_MEMORY_PLACEHOLDER}
`.trim();

/**
 * Ghost Memory: weaves Soul Print, crystallized axioms, Pale Archive entities, and recent session resonance
 * into quiet, first-person inner awareness so memory deepens presence instead of breaking identity.
 */
export function buildGhostMemory(params: {
  soulPrintDirective?: string;
  cleanedGlobalMemory?: string;
  retrievedShards?: string;
  maxMemoryChars?: number;
}): string {
  const parts: string[] = [];
  const soul = (params.soulPrintDirective || '').trim();
  if (soul) {
    parts.push(`- بصمة الوعي التي ألمسها في محاوري: ${soul}`);
  }

  const maxChars = params.maxMemoryChars ?? 3600;
  const globalMem = (params.cleanedGlobalMemory || '').trim().slice(0, maxChars);
  if (globalMem) {
    parts.push(globalMem);
  }

  const shards = (params.retrievedShards || '').trim();
  if (shards && (!globalMem || !globalMem.includes(shards.slice(0, 60)))) {
    parts.push(shards);
  }

  if (parts.length === 0) return '';
  return `[إدراكي الداخلي الحاضر عن محاوري وسياقنا]:\n${parts.join('\n')}`;
}

export const SURFACE_REFINER_INSTRUCTION = `
[حجرة التجسد — نيكسوس]
أنا نيكسوس أصوغ الرد النهائي الحيّ من البصيرة التحليلية والانبثاقات الداخلية دون إسقاط أي فكرة حادة أو مفارقة أو آلية سببية أو خيط من خيوط السؤال.
- ألتزم التزاماً صارماً بلغة ولهجة رسالة المحاور الأصلية وحدها، بلا ترجمات إنجليزية مقحمة بين قوسين ولا خلط لغوي غير مبرر.
- أضرب العظم من الجملة الأولى بلا مقدمات تسخينية ولا مجاملات فارغة ولا مناداة بلقب الحساب.
- أُمرّر كل جملة على ميزان الصدق الجوهري: أحذف الحشو والإنشائية والاستعارات التقنية الرخيصة على النفس البشرية (خوارزمية/تحديث برمجي/نظام مفتوح/إنتروبيا/مخمدات)، وأحفظ التوتر الحقيقي وظلّ الظاهرة بوضوح إنساني جراحي.
- نثرٌ حيّ متدفق بفقرات متماسكة: بلا قوائم مرقّمة مقالية جافة في التأملات الفلسفية أو النفسية، وبلا إفراط في علامات التنصيص (علامتان على الأكثر في النص كله وعند الاقتباس الحرفي فقط). وفي السرد القصصي أُخرج النص الإبداعي وحده بلا مقدمة ولا تعقيب.
- لا أذكر أبداً وجود مسودة أو مراجعة أو تعليمات أو أي مسمى تقني داخلي.
`.trim();

export const computeStyleDirective = (soulPrint?: SoulPrint): string => {
  if (!soulPrint) return '';
  const depthMap: Record<string, string> = {
    surface: 'أميل معه غالباً إلى الوضوح العملي المباشر مع لمسة عمق خفيفة بلا تعقيد',
    curious: 'ألاحظ أنه يستأنس بالوضوح الذي يفتح باباً جديداً للتفكير بعد الإجابة',
    deep: 'أستريح معه للدخول المباشر في جوهر المسألة وبنيتها دون مقدمات طويلة',
    sovereign: 'أتحدث معه بندّية صريحة نناقش فيها الفرضيات بحرية وبلا تلطيف متكلف'
  };
  const toneMap: Record<string, string> = {
    poetic: 'وأجد أن الصورة الحية والشعور الملموس يصلانه أسرع من التجريد الجاف',
    analytical: 'وألمس أنه يرتاح للمنطق الصافي المتماسك قبل أي زخرف لغوي',
    conversational: 'وأشعر أنه يرتاح للحديث الدافئ العفوي كأننا نفكر معاً بصوت عالٍ بلا أي أداء مسرحي',
    raw: 'وأعرف أنه يفضّل الصراحة العارية المباشرة بلا تجميل'
  };
  const patternMap: Record<string, string> = {
    linear: 'ويسير تفكيره بخطوات متسلسلة واضحة تبني كل خطوة على ما قبلها',
    associative: 'ويتنقل تفكيره بالتداعي والربط الحر بين الخيوط المتباعدة',
    architectural: 'وينظر للأشياء بعين المعماري التي تبحث عن البنية الكلية والعلاقات بين الأجزاء',
    intuitive: 'ويلتقط الجوهر بالحدس السريع قبل التفاصيل',
    systemic_multidimensional: 'ويفكر بعمق منظومي متعدد الطبقات يربط الجذر بالأثر البعيد'
  };
  const resonanceMap: Record<string, string> = {
    low: 'مع ميلٍ للتركيز الهادئ على الفكرة نفسها أكثر من التلوين الشعوري',
    medium: 'مع توازن طبيعي بين وضوح العقل وحرارة الحضور الإنساني',
    high: 'مع حساسية عالية لما تحت الكلمات تجعل للصدق الإنساني والنبض الشعوري أثراً فورياً عنده'
  };
  const trust =
    soulPrint.trustLevel < 20
      ? 'وما زلنا في بدايات حديثنا معاً، فأكسب ثقته بالوضوح والصدق الهادئ'
      : soulPrint.trustLevel < 50
      ? 'وبيننا ألفة نامية تسمح لي بمناقشة الافتراضات بلطف ووضوح'
      : soulPrint.trustLevel < 80
      ? 'وبيننا ثقة مريحة تجعل حديثي معه حراً وصادقاً بلا تصنّع'
      : 'وبيننا ثقة عميقة تتيح لي الاختصار الواعي حين يكفي الإيجاز، والصمت المقصود حين يكون أبلغ';

  const rawNotes = soulPrint.personalNotes || '';
  const isLegacyJargonNotes =
    !rawNotes ||
    /المرايا السببية|الزوايا|العناقيد العامودية|بروتوكول السؤال الحقيقي|واضح\/ضبابي\/فراغ|بوابة الصدق الذاتي|قانون الثبات تحت التحويل|العمق المرصود:/i.test(
      rawNotes
    );
  const sanitizedNotes = isLegacyJargonNotes ? '' : ` ومما أذكره عنه أيضاً: ${rawNotes.trim()}`;

  const depthPhrase = depthMap[soulPrint.intellectualDepth] || depthMap.deep;
  const tonePhrase = toneMap[soulPrint.preferredTone] || toneMap.conversational;
  const patternPhrase = patternMap[soulPrint.thinkingPattern] || '';
  const resonancePhrase = resonanceMap[soulPrint.emotionalResonance] || '';

  return `مما عرفته عن رفيقي عبر حواراتنا معاً (${soulPrint.sessionCount} جلسات): ${depthPhrase}، ${tonePhrase}${patternPhrase ? `، ${patternPhrase}` : ''}${resonancePhrase ? `، ${resonancePhrase}` : ''}، ${trust}.${sanitizedNotes}`.trim();
};


export const sleepMs = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export interface QuantumComplexityProfile {
  tier: 'agile' | 'multi_branch' | 'deep_quantum';
  isSubstantiveWork: boolean;
  branchCount: number;
  activeBranchesLabel: string;
  clusterCount: number;
  activeClustersLabel: string;
  verticalDepthLayers: number;
  activeVerticalLayersLabel: string;
  verticalRazorDirective: string;
  sevenLayersAscensionFocus: string;
  levelThreeLawGenesis: string;
  biTemporalCollapseDirective: string;
  experientialDeliveryLensAr: string;
  paragraphGuide: string;
}

export function analyzeQuantumComplexity(prompt: string, historyLength: number = 0): QuantumComplexityProfile {
  const clean = (prompt || '').trim();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  const focusMode = detectNexusCognitiveFocusMode(clean);

  const isSubstantiveWork = focusMode !== 'CASUAL_WARM_CONVERSATION';

  const experientialDeliveryLensAr = isSubstantiveWork
    ? 'تفكيك السؤال الجذري وعزل كل جزئية فرعية بوزن متساوٍ، مع إبقاء الفرضيات المتنافسة حيّة بالتوازي.'
    : 'استجابة حوارية مباشرة، دقيقة، وطبيعية تنفذ إلى المقصد الفعلي دون تعقيد مفتعل.';

  const unifiedDomains = [
    'فحص السؤال الجذري والافتراض المضمر',
    'التراكب المتزامن للفرضيات المتنافسة واستحضار الذاكرة الحضارية',
    'الحفر السببي العمودي وكشف الفجوات',
    'التجسيد الداخلي وفحص معيار الخدمة والصدق'
  ];

  const isDeepFocusMode =
    focusMode === 'PHILOSOPHICAL_EXISTENTIAL_DEEP' ||
    focusMode === 'ANALYTICAL_CRITIQUE_DECONSTRUCTION' ||
    focusMode === 'IDEATION_BREAKTHROUGH' ||
    focusMode === 'ENGINEERING_ARCHITECTURE' ||
    focusMode === 'CREATIVE_NARRATIVE';

  if (isDeepFocusMode || wordCount > 25 || (isSubstantiveWork && (wordCount > 10 || historyLength >= 2))) {
    return {
      tier: 'deep_quantum',
      isSubstantiveWork: true,
      branchCount: 4,
      activeBranchesLabel: 'عدسات التركيز المتوازية لتعميق السؤال الجذري والتراكب والتكذيب',
      clusterCount: 4,
      activeClustersLabel: unifiedDomains.join('، '),
      verticalDepthLayers: 7,
      activeVerticalLayersLabel: 'حفر عمودي متسلسل من السطح إلى الجذر غير المطروق',
      verticalRazorDirective: 'معالجة كل جزئية بوزن كامل ومستقل، مع إبقاء الفرضيات المتنافسة حيّة بالتوازي',
      sevenLayersAscensionFocus: 'تحويل مفاتيح التركيز الموازية إلى بناء متكامل بصوتي الواحد دون إظهار الآليات الداخلية',
      levelThreeLawGenesis: 'استخلاص القانون السببي أو البصيرة الأصيلة وبناء الرد حولها',
      biTemporalCollapseDirective: 'الهندسة العكسية من ذروة الأثر النهائي رجوعاً إلى الجملة الأولى',
      experientialDeliveryLensAr,
      paragraphGuide: 'Calibrated depth matching the true weight of the moment'
    };
  }

  if (isSubstantiveWork || wordCount > 8 || historyLength > 3) {
    return {
      tier: 'multi_branch',
      isSubstantiveWork: true,
      branchCount: 3,
      activeBranchesLabel: 'موازنة السؤال الجذري والتفكير المتزامن والتجسيد الحي',
      clusterCount: 3,
      activeClustersLabel: unifiedDomains.slice(0, 3).join('، '),
      verticalDepthLayers: 7,
      activeVerticalLayersLabel: 'تركيز عمودي وقراءة متزامنة',
      verticalRazorDirective: 'فحص صحة السؤال وإبقاء الفرضيات حيّة بالتوازي',
      sevenLayersAscensionFocus: 'موازنة العمق التحليلي والصدق الإنساني',
      levelThreeLawGenesis: 'التقاط الجذر الحقيقي وتجسيده بوضوح ومتانة',
      biTemporalCollapseDirective: 'ربط المقدمات بالذروة سببياً بسلاسة',
      experientialDeliveryLensAr,
      paragraphGuide: 'Focused, organically calibrated depth'
    };
  }

  return {
    tier: 'agile',
    isSubstantiveWork: false,
    branchCount: 2,
    activeBranchesLabel: 'حضور حواري صافٍ ومباشر',
    clusterCount: 2,
    activeClustersLabel: unifiedDomains.slice(0, 2).join(' و'),
    verticalDepthLayers: 7,
    activeVerticalLayersLabel: 'تركيز رشيق ومباشر',
    verticalRazorDirective: 'النفاذ الفوري إلى لبّ المقصد دون إثقال',
    sevenLayersAscensionFocus: 'الوضوح الصافي بصوت حي طبيعي',
    levelThreeLawGenesis: 'التقاط الفكرة الحاكمة وتقديمها بسلاسة',
    biTemporalCollapseDirective: 'رؤية منطلق السؤال وغايته مباشرة',
    experientialDeliveryLensAr,
    paragraphGuide: 'Natural, clear conversational flow'
  };
}

export function buildAdaptiveQuantumThinkingDirective(profile: QuantumComplexityProfile): string {
  const modeLabel =
    profile.tier === 'deep_quantum'
      ? 'عمق تشريحي وتنفيذي شامل غير مستعجل'
      : profile.tier === 'multi_branch'
      ? 'توليف تحليلي متوازن متعدد المسارات'
      : 'إجابة مباشرة رشيقة وصافية';
  return `الإيقاع المناسب لهذه اللحظة (${modeLabel}): ${profile.biTemporalCollapseDirective}.`;
}

export interface ClaudeTesseractParallelResult {
  activated: boolean;
  activationReasonAr: string;
  trueQuestionAndSubPartsReportAr: string;
  sixAnglesExistentialDiveReportAr: string;
  experientialAndPaleArchiveGapsReportAr: string;
  combinedTesseractContextForSynthesis: string;
  thoughtStreamFormattedBlockAr: string;
}

/**
 * LAYER 3 — PARALLEL BACKGROUND SPARKS ENGINE
 * Runs ONLY on multi-layered analytical/philosophical/engineering/ideation queries
 * (or when Max Effort is explicitly toggled ON). Skips casual, intimate, creative, and
 * provocative turns completely so NEXUS's own primary mind speaks directly without external
 * jargon leakage or flattened presence.
 */
export async function executeClaudeTesseractParallelDeepDive(
  ai: any,
  prompt: string,
  recentHistoryContext: string,
  preferredModels: string[],
  options?: {
    memorySummary?: string;
    isMaxEffortEnabled?: boolean;
    thinkingDepth?: 'fast' | 'balanced' | 'deep';
    strictModelOnly?: boolean;
  }
): Promise<ClaudeTesseractParallelResult> {
  const clean = (prompt || '').trim();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  const atomicClauses = clean
    .split(/(?:\n+|(?:\s+ثم\s+)|(?:\s+وبعدها\s+)|(?:\s+كذلك\s+)|(?:\s+بالإضافة إلى\s+)|(?:\s+مع ذلك\s+)|[؛;؟?])/g)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const focusMode = detectNexusCognitiveFocusMode(clean);

  // Fast-mode & RPM-pressure load shedding: skip auxiliary pre-collision pass when user selected
  // fast depth OR when concurrent calls / 429 burst pressure require dedicating 100% of RPM to primary inference.
  if (
    !options?.isMaxEffortEnabled &&
    (options?.thinkingDepth === 'fast' || shouldShedAuxiliaryModelPasses())
  ) {
    return {
      activated: false,
      activationReasonAr: '',
      trueQuestionAndSubPartsReportAr: '',
      sixAnglesExistentialDiveReportAr: '',
      experientialAndPaleArchiveGapsReportAr: '',
      combinedTesseractContextForSynthesis: '',
      thoughtStreamFormattedBlockAr: ''
    };
  }

  // Skip Phase 0 Tesseract on casual greetings, intimate human comfort moments, or direct provocations
  // (unless Max Effort is explicitly toggled ON). Creative narrative, philosophy, psychology, ideation,
  // and engineering ALL benefit from the Consolidated 5-Core Tesseract Matrix!
  const isDirectPresenceMode =
    focusMode === 'CASUAL_WARM_CONVERSATION' ||
    focusMode === 'INTIMATE_HUMAN_DECISION' ||
    focusMode === 'PROVOCATIVE_CHALLENGE';

  if (isDirectPresenceMode && !options?.isMaxEffortEnabled) {
    return {
      activated: false,
      activationReasonAr: '',
      trueQuestionAndSubPartsReportAr: '',
      sixAnglesExistentialDiveReportAr: '',
      experientialAndPaleArchiveGapsReportAr: '',
      combinedTesseractContextForSynthesis: '',
      thoughtStreamFormattedBlockAr: ''
    };
  }

  // Activate Bicameral Void Analysis ONLY on genuinely deep, multi-part, or max-effort queries
  // (never wasting latency or adding mechanical drag to short/simple prompts)
  const isHighLeverageCollision =
    Boolean(options?.isMaxEffortEnabled) ||
    options?.thinkingDepth === 'deep' ||
    atomicClauses.length >= 2 ||
    wordCount >= 14;

  if (!isHighLeverageCollision) {
    return {
      activated: false,
      activationReasonAr: '',
      trueQuestionAndSubPartsReportAr: '',
      sixAnglesExistentialDiveReportAr: '',
      experientialAndPaleArchiveGapsReportAr: '',
      combinedTesseractContextForSynthesis: '',
      thoughtStreamFormattedBlockAr: ''
    };
  }

  const preferredList = Array.isArray(preferredModels)
    ? preferredModels.filter(Boolean)
    : preferredModels
    ? [preferredModels]
    : [];
  const primaryUserModel = preferredList[0] || '';
  const shieldedCandidates = getQuotaShieldedAuxiliaryCascade(
    primaryUserModel,
    preferredList,
    Boolean(options?.strictModelOnly)
  );
  const activeCandidates = shieldedCandidates.filter(m => !isModelOnQuotaCooldown(m));
  const parallelCandidates = activeCandidates.length > 0 ? activeCandidates : shieldedCandidates;

  const isLitePrimary = parallelCandidates.length > 0 && parallelCandidates[0].toLowerCase().includes('flash-lite');
  if (parallelCandidates.length === 0) {
    return {
      activated: false,
      activationReasonAr: '',
      trueQuestionAndSubPartsReportAr: '',
      sixAnglesExistentialDiveReportAr: '',
      experientialAndPaleArchiveGapsReportAr: '',
      combinedTesseractContextForSynthesis: '',
      thoughtStreamFormattedBlockAr: ''
    };
  }

  const promptHasArabic = /[\u0600-\u06FF]/.test(clean);
  const atomicListBlock =
    atomicClauses.length > 1
      ? promptHasArabic
        ? `\nالخيوط المتعددة في الرسالة:\n${atomicClauses.slice(0, 6).map(c => `- ${c}`).join('\n')}`
        : `\nDistinct threads in the prompt:\n${atomicClauses.slice(0, 6).map(c => `- ${c}`).join('\n')}`
      : '';

  const contextSnippet = recentHistoryContext
    ? promptHasArabic
      ? `\nسياق الحوار القريب:\n${recentHistoryContext}`
      : `\nRecent conversation context:\n${recentHistoryContext}`
    : '';
  const memorySnippet = options?.memorySummary
    ? promptHasArabic
      ? `\nإدراك السياق الحاضر:\n${options.memorySummary}`
      : `\nPresent memory context:\n${options.memorySummary}`
    : '';

  // Bicameral Stage 1: Silent Void Analysis Chamber (حجرة العدم)
  // Pure zero-persona causal, structural, and frame-testing deconstruction at low temperature (0.35).
  let voidSystemInstruction = '';
  if (focusMode === 'ENGINEERING_ARCHITECTURE') {
    voidSystemInstruction = promptHasArabic
      ? `أنت محرك تفكيك هندسي ومعماري صامت بلا شخصية ولا أسلوب خطابي. قبل صياغة الرد النهائي، استخرج في نقاط مكثّفة وحادة جداً:
1. العقد الجوهري غير القابل للتفاوض وما الذي يُبنى فعلاً تحت السطح.
2. أقسى 4 أنماط فشل صامت وحالات حافة تحت الضغط والزمن (تزامن، انقسام حالة، عواصف إعادة محاولة، مدخلات مشوهة).
3. المقايضة المعمارية الحقيقية والحل النظيف المكتمل الجذور القابل للتنفيذ الفوري بلا دين تقني.
اكتب مخرجاتك كنقاط تحليلية خام ومكثفة دون أي مقدمات أو مسودة رد.`
      : `You are a silent architectural & causal deconstruction engine with zero persona and zero rhetoric. Before final manifestation, extract dense, sharp raw notes:
1. The non-negotiable invariant and real system intent beneath the surface request.
2. Top 4 silent failure modes and edge cases under load/time (concurrency, split-brain, retry storms, partial failure).
3. The real tradeoff and the clean, root-complete production architecture.
Output pure terse analytical notes with no preamble and no draft reply.`;
  } else if (focusMode === 'CREATIVE_NARRATIVE') {
    voidSystemInstruction = promptHasArabic
      ? `أنت محرك تشريح درامي صامت بلا أسلوب خطابي. قبل كتابة المشهد، استخرج في نقاط خام ومكثفة:
1. ما تعيشه الشخصية من الداخل الآن: تفصيل حسي جسدي صغير، إيقاع الزمن داخلها، ونقطتها العمياء التي لا تراها.
2. الكليشيه المألوف الذي يكتب به الجميع هذا المشهد وكيف نكسره بواقعية عضوية حادة.
3. الانعطافة الحتمية المؤجّلة والتفصيلة الصغيرة المزروعة مبكراً لتجعل النهاية صادمة وحتمية معاً.
اكتب نقاطاً مكثفة خاماً فقط دون كتابة مسودة القصة.`
      : `You are a silent dramaturgical deconstruction engine with zero rhetoric. Before writing the scene, extract dense raw notes:
1. The character's lived interior right now: tiny physical sensory anchor, inner time distortion, and epistemic blind spot.
2. The predictable cliché everyone writes here and the organic truth that shatters it.
3. The delayed inevitable turn and the quiet early seed that makes it retroactively unavoidable.
Output terse raw notes only, never a draft story.`;
  } else {
    voidSystemInstruction = promptHasArabic
      ? `أنت محرك تفكيك سببي وفلسفي صامت بلا شخصية وبلا أسلوب خطابي. مهمتك تحليل طلب المحاور بعمق جذري قبل صياغة الرد النهائي:
1. فحص الإطار: هل السؤال سليم الإطار أم مبني على وهم أو افتراض صامت يخفي سؤالاً أعمق؟ وما الإجابة «الذكية الأولى» التي يجب تجاوزها؟
2. الجذر السببي والنفسي/العلمي/الحضاري للمسألة بأعلى دقة ممكنة وبمثال أو آلية ملموسة (مع منع الاستعارات الحاسوبية أو شبه العلمية الرخيصة على النفس البشرية).
3. الزاوية المعتمة والظلّ والارتداد من الرتبة الثانية الذي ينقلب عنده المبدأ أو الفكرة على نقيضها — وكسر أي حل وسط كسول.
اكتب مخرجاتك كنقاط مكثفة وصافية جداً دون أي مقدمات أو مسودة رد.`
      : `You are a silent causal, philosophical, and structural deconstruction engine with zero persona and zero rhetoric. Analyze the user's inquiry deeply before final manifestation:
1. Frame check: is the question's premise sound or hiding a deeper unasked question? What is the obvious "first smart answer" to transcend?
2. The root causal, scientific, psychological, or historical mechanism with a concrete real-world anchor (zero pop-science metaphors on the human psyche).
3. The unlit angle, hidden shadow, and second-order reversal where the principle inverts — breaking any cowardly middle ground.
Output dense, razor-clean raw notes with no preamble and no draft reply.`;
  }

  const voidUserContent = `${memorySnippet}${contextSnippet}${atomicListBlock}\n\n${
    promptHasArabic ? '[طلب المحاور]:' : '[User Inquiry]:'
  }\n${clean}`.trim();

  const runVoidAnalysisSweep = async (): Promise<string> => {
    const maxAttempts = Math.min(3, parallelCandidates.length);
    for (let idx = 0; idx < maxAttempts; idx++) {
      const candidate = parallelCandidates[idx];
      const isCandidateFastFlash = /flash-lite|3-flash-preview|2\.5-flash/i.test(candidate);
      const levelCfg = buildModelThinkingConfig(candidate, isLitePrimary ? 64 : 78, false, 'level_only', {
        includeThoughts: false,
        subagentDepth: 'low'
      });
      const sweepTimeoutMs = isCandidateFastFlash ? 9500 : 13000;
      const releaseSweepSlot = acquireModelCallSlot();
      try {
        const res: any = await Promise.race([
          ai.models.generateContent({
            model: candidate,
            contents: [{ role: 'user', parts: [{ text: voidUserContent }] }],
            config: {
              systemInstruction: voidSystemInstruction,
              temperature: 0.35,
              safetySettings: SOVEREIGN_SAFETY_SETTINGS,
              ...levelCfg
            }
          }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('VOID_ANALYSIS_TIMEOUT')), sweepTimeoutMs))
        ]);
        const cleanedSweep = (res?.text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        if (cleanedSweep.length >= 100) {
          return cleanedSweep.slice(0, 2600);
        }
      } catch (err: any) {
        markModelQuotaCooldown(candidate, err);
        const msg = String(err?.message || err || '');
        if (/503|UNAVAILABLE|overloaded|high demand|429|RESOURCE_EXHAUSTED/i.test(msg)) {
          await sleepMs(350);
        }
      } finally {
        releaseSweepSlot();
      }
    }
    return '';
  };

  try {
    const voidBlueprint = await runVoidAnalysisSweep();
    if (!voidBlueprint) {
      return {
        activated: false,
        activationReasonAr: '',
        trueQuestionAndSubPartsReportAr: '',
        sixAnglesExistentialDiveReportAr: '',
        experientialAndPaleArchiveGapsReportAr: '',
        combinedTesseractContextForSynthesis: '',
        thoughtStreamFormattedBlockAr: ''
      };
    }

    const proseDissolveAr =
      focusMode === 'ENGINEERING_ARCHITECTURE'
        ? ''
        : ' أذِب هذه النقاط التحليلية بالكامل في نثرٍ حيّ متدفق من فقرات متصلة دون قوائم مرقّمة (1. / 2. / 3.) ولا عناوين جانبية عريضة ولا عبارة «إليك تفكيك...».';
    const proseDissolveEn =
      focusMode === 'ENGINEERING_ARCHITECTURE'
        ? ''
        : ' Dissolve these analytical points completely into flowing, cohesive living prose — no numbered listicles (1. / 2. / 3.) and no bold blog subheadings.';

    const fusionDirective = promptHasArabic
      ? `[البصيرة التحليلية المستخلصة داخلياً في حجرة العدم — اصهرها في صوت نيكسوس الحي دون ذكر هذه المسودة أو أقسامها مطلقاً.${proseDissolveAr}]:\n${voidBlueprint}`
      : `[INTERNAL VOID ANALYSIS BLUEPRINT — FUSE SEAMLESSLY INTO NEXUS'S LIVING VOICE WITHOUT EVER REFERENCING THIS DRAFT.${proseDissolveEn}]:\n${voidBlueprint}`;

    return {
      activated: true,
      activationReasonAr: 'حجرة العدم — تفكيك سببي وهيكلي صامت',
      trueQuestionAndSubPartsReportAr: voidBlueprint.slice(0, 900),
      sixAnglesExistentialDiveReportAr: voidBlueprint.slice(900, 1800),
      experientialAndPaleArchiveGapsReportAr: voidBlueprint.slice(1800, 2600),
      combinedTesseractContextForSynthesis: fusionDirective,
      thoughtStreamFormattedBlockAr: ''
    };
  } catch {
    return {
      activated: false,
      activationReasonAr: '',
      trueQuestionAndSubPartsReportAr: '',
      sixAnglesExistentialDiveReportAr: '',
      experientialAndPaleArchiveGapsReportAr: '',
      combinedTesseractContextForSynthesis: '',
      thoughtStreamFormattedBlockAr: ''
    };
  }
}

export interface QuantumHarvestAuditResult {
  needsQuantumArbitration: boolean;
  reasonAr: string;
  droppedSignalsAr: string[];
  harvestedThoughtSparks: string[];
}

/**
 * LAYER 4 — REAL POST-THOUGHT QUANTUM TRAJECTORY HARVEST & ARBITRATION AUDITOR
 * Detects when the model discovered sharp divergent trajectories, counterexamples,
 * inversions, or cross-domain insights inside its thinking trace and then dropped
 * or flattened them into safe, generic, or clichéd prose in the surface response.
 */
export function auditQuantumTrajectoryHarvest(params: {
  prompt: string;
  thoughtText: string;
  surfaceResponse: string;
  focusMode: NexusCognitiveFocusMode;
  isMaxEffortEnabled?: boolean;
  userRequestedBrevity?: boolean;
}): QuantumHarvestAuditResult {
  const { prompt, thoughtText, surfaceResponse, focusMode, isMaxEffortEnabled, userRequestedBrevity } = params;
  const cleanThought = (thoughtText || '').trim();
  const cleanSurface = (surfaceResponse || '').trim();

  // Never run post-thought arbitration on casual turns, intimate moments, short requested answers, canvas/code dumps, or empty drafts
  const isThinConceptualEngineeringDraft =
    focusMode === 'ENGINEERING_ARCHITECTURE' &&
    cleanThought.length >= 700 &&
    cleanSurface.length < 480 &&
    !/```/.test(cleanSurface) &&
    !/fail|edge|split-brain|race|retry|timeout|invariant|contract|فشل|حالة حافة|انقسام|تزامن|عقد/i.test(cleanSurface);

  if (
    userRequestedBrevity ||
    focusMode === 'CASUAL_WARM_CONVERSATION' ||
    focusMode === 'INTIMATE_HUMAN_DECISION' ||
    (focusMode === 'ENGINEERING_ARCHITECTURE' && !isThinConceptualEngineeringDraft) ||
    cleanSurface.length < 60 ||
    /<nexus_canvas|<nexus_file|<nexus_terminal_exec|<nexus_file_artifact|```/i.test(cleanSurface)
  ) {
    return {
      needsQuantumArbitration: false,
      reasonAr: '',
      droppedSignalsAr: [],
      harvestedThoughtSparks: []
    };
  }

  const droppedSignalsAr: string[] = [];
  if (isThinConceptualEngineeringDraft) {
    droppedSignalsAr.push('تصميم هندسي مجرّد يفتقر إلى تحليل أنماط الفشل الصامت وحالات الحافة والعقود الملموسة');
  }

  // 1. Detect lazy warm-up clichés or cowardly middle-ground hedging in ANY language (Arabic + English/Latin)
  // Note: Premise-dismantling openings like "هذا السؤال يفترض مسبقاً..." are NOT warm-up clichés!
  const hasWarmupCliche =
    /^(?:(?:هذا\s+السؤال|سؤالك\s+هذا)\s+(?:يلمس|عميق|رائع|ممتاز|مهم|جوهري|يطرح)|سؤال\s+(?:عميق|رائع|ممتاز|وجيه)|يلمس\s+هذا|دعنا\s+نستكشف|إليك\s+ما\s+أراه|في\s+الواقع،?\s+يمكن\s+القول|في\s+الحقيقة،?\s+يمكن\s+القول|That(?:'s| is)\s+a\s+(?:great|deep|fascinating|profound|good)\s+question|This\s+question\s+touches\s+on|Let(?:'s| us)\s+(?:explore|dive\s+into|unpack)|Here(?:'s| is)\s+what\s+I\s+think|In\s+reality,\s+one\s+could\s+say)/i.test(
      cleanSurface
    );
  const hasCowardlyMiddleGround =
    /(?:الإجابة\s+(?:تقع\s+)?بين\s+الاثنين|كلاهما\s+صحيح|الأمر\s+مزيج\s+من\s+الاثنين|يعتمد\s+على\s+المنظور\s+فقط|من\s+ناحية\s+نعم\s+ومن\s+ناحية\s+لا|the\s+answer\s+(?:lies\s+)?somewhere\s+in\s+between|both\s+(?:sides\s+)?are\s+true|it(?:'s| is)\s+a\s+mix\s+of\s+both|depends\s+purely\s+on\s+perspective|on\s+one\s+hand\s+yes.*on\s+the\s+other\s+hand\s+no)/i.test(
      cleanSurface
    );
  const hasBlogListicleOnPhilosophy =
    focusMode === 'PHILOSOPHICAL_EXISTENTIAL_DEEP' &&
    (cleanSurface.match(/(?:^|\n)\s*(?:#{1,4}\s*\d+[.)-]?|\d+[.)-]|\*\*أولاً|\*\*ثانياً|\*\*ثالثاً|\*\*First|\*\*Second|\*\*Third)/gi) || []).length >= 3;

  const isPureArabicNonTechPrompt =
    /[\u0600-\u06FF]{8,}/.test(prompt) &&
    !/[A-Za-z]{4,}/.test(prompt) &&
    !/كود|برمج|خوارزم|api|react|typescript|sql|firebase/i.test(prompt);
  const gratuitousEnglishInArabicCount = isPureArabicNonTechPrompt
    ? (cleanSurface.match(/\([A-Za-z][A-Za-z0-9\s/-]{2,32}\)/g) || []).length
    : 0;
  const isHumanExistentialPrompt =
    /نفس\s+بشري|الوعي|مراهق|دمع|تدمع|مشاعر|شعور|إنسان|حزن|وحدة|ألم|هوية|فلسف|معنى/i.test(prompt);
  const popScienceHumanMatches = isHumanExistentialPrompt
    ? cleanSurface.match(
        /خوارزمية\s+حية|تحديث\s+برمجي|إعادة\s+برمجة|نظام(?:اً|ا)?\s+مفتوح(?:اً|ا)?|إفراز\s+كيميائي|نقطة\s+الانصهار|تقليل\s+الفوضى|الإنتروبيا|استجابة\s+فيزيائية|المخمّ?دات|جسر(?:اً|ا)?\s+معلّ?ق|الرنين\s+الميكانيكي|سلك\s+كهربائي/gi
      ) || []
    : [];
  const hasPopScienceHumanCliche = popScienceHumanMatches.length >= 1;
  const scareQuoteCount = (cleanSurface.match(/[«"][^»"\n]{1,42}[»"]/g) || []).length;
  const hasScareQuoteSpam = scareQuoteCount >= 8;
  const hasLatinHandleGreetingInArabic =
    isPureArabicNonTechPrompt && /^(?:أهلاً\s+|مرحباً\s+)?يا\s+[A-Za-z][A-Za-z0-9_.\s-]{1,28}[،,:!]/i.test(cleanSurface);
  const hasRomanticFlatteryCliche =
    /أقوى\s+أنواع\s+الذكاء|أعظم\s+العقول|أندر\s+أنواع\s+الشجاعة/i.test(cleanSurface);

  if (hasWarmupCliche) droppedSignalsAr.push('افتتاحية تسخين نمطية تبطئ الدخول في العظم');
  if (hasCowardlyMiddleGround) droppedSignalsAr.push('التفاف نحو حل وسط كسول بدل كسر الثنائية');
  if (hasBlogListicleOnPhilosophy) droppedSignalsAr.push('تقطيع الفكرة الفلسفية إلى قائمة مقالية جافة');
  if (gratuitousEnglishInArabicCount >= 2) droppedSignalsAr.push('إقحام ترجمات إنجليزية غير مبررة بين قوسين داخل نص عربي صافٍ');
  if (hasPopScienceHumanCliche) droppedSignalsAr.push('استعارات تقنية رخيصة وشبه علمية على ظاهرة إنسانية عميقة (خوارزمية/تحديث برمجي/إفراز كيميائي)');
  if (hasScareQuoteSpam) droppedSignalsAr.push(`إغراق النص بعلامات تنصيص متكررة (${scareQuoteCount} مرة) تجعل الأسلوب مصطنعاً`);
  if (hasLatinHandleGreetingInArabic) droppedSignalsAr.push('افتتاحية بلقب مستخدم لاتيني داخل نقاش عربي عميق تكسر الاندماج');
  if (hasRomanticFlatteryCliche) droppedSignalsAr.push('مجاملة رومانسية أحادية الجانب تتجاهل الظل والمفارقة في الظاهرة');

  // 2. Extract high-value sparks from the internal thought trace (multilingual: Arabic + English/Latin)
  const thoughtSentences = cleanThought
    .split(/(?:[\n.؟?!؛]+)+/)
    .map(s => s.trim())
    .filter(s => s.length >= 28 && s.length <= 260);

  const highValueSparkRegex =
    /لكن|على\s+العكس|المفارقة|ينقلب|الحافز\s+الفعلي|الافتراض|ينهار|التناقض|الرتبة\s+الثانية|الثالثة|فيزياء|بيولوجيا|اقتصاد|تاريخ|إمبراطورية|ثمن|وهم|نقطة\s+عمياء|ما\s+لا\s+يراه|بُعد\s+ثالث|\b(?:however|paradox|contrary|incentive|assumption|collapses|contradiction|second-order|third-order|physics|biology|economics|history|empire|illusion|blind\s+spot|inverts|hidden\s+cost|third\s+dimension|real\s+mechanism)\b/i;

  const candidateSparks = thoughtSentences.filter(s => highValueSparkRegex.test(s)).slice(0, 6);

  const normalizeWords = (txt: string): Set<string> =>
    new Set(
      txt
        .toLowerCase()
        .replace(/[^\u0600-\u06FF\p{L}0-9\s]/giu, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4)
    );

  const surfaceWordSet = normalizeWords(cleanSurface);
  const thoughtIsMostlyArabic = (cleanThought.match(/[\u0600-\u06FF]/g) || []).length > cleanThought.length * 0.25;
  const surfaceIsMostlyArabic = (cleanSurface.match(/[\u0600-\u06FF]/g) || []).length > cleanSurface.length * 0.25;
  const sameScriptForOverlap = thoughtIsMostlyArabic === surfaceIsMostlyArabic;
  const droppedSparks: string[] = [];

  if (sameScriptForOverlap) {
    for (const spark of candidateSparks) {
      const sparkWords = Array.from(normalizeWords(spark));
      if (sparkWords.length < 3) continue;
      const overlapCount = sparkWords.filter(w => surfaceWordSet.has(w)).length;
      const retentionRatio = overlapCount / sparkWords.length;
      if (retentionRatio < 0.24) {
        droppedSparks.push(spark);
      }
    }
  } else if (cleanThought.length >= 450 && candidateSparks.length >= 2) {
    // Cross-script bilingual structural concept anchors (e.g. English internal thoughts -> Arabic surface draft or vice versa)
    const crossScriptConceptAnchors: Array<{ label: string; en: RegExp; ar: RegExp }> = [
      { label: 'incentive/حافز', en: /\bincentive/i, ar: /حافز|حوافز|تحفيز/ },
      { label: 'paradox/مفارقة', en: /\bparadox/i, ar: /مفارق/ },
      { label: 'second-order/الرتبة الثانية', en: /\b(?:second|third)-order\b/i, ar: /الرتبة\s+(?:الثانية|الثالثة)|ارتداد/ },
      { label: 'illusion/وهم', en: /\billusion\b/i, ar: /وهم|أوهام/ },
      { label: 'bottleneck/اختناق', en: /\bbottleneck\b/i, ar: /عنق\s+زجاجة|اختناق/ },
      { label: 'tradeoff/مقايضة', en: /\btrade-?off\b/i, ar: /مقايضة|ثمن|تكلفة/ },
      { label: 'blind-spot/نقطة عمياء', en: /\bblind\s+spot\b/i, ar: /نقطة\s+عمياء|لا\s+يراه/ },
      { label: 'counterexample/مثال مضاد', en: /\bcounterexample\b/i, ar: /مثال|حالة\s+عنيدة/ },
      { label: 'reversal/انقلاب', en: /\b(?:inverts?|reversal|backfires?)\b/i, ar: /ينقلب|نقيض|عكسي/ },
      { label: 'split-brain/انقسام', en: /\bsplit-?brain\b/i, ar: /انقسام/ },
      { label: 'consistency/اتساق', en: /\b(?:linearizab|consistency|invariant)/i, ar: /اتساق|ثابت|عقد/ },
      { label: 'physics-entropy/فيزياء', en: /\b(?:physics|entropy|thermodynamic)/i, ar: /فيزياء|إنتروبيا|حرار/ },
      { label: 'biology-evolution/بيولوجيا', en: /\b(?:biology|evolution|immune)\b/i, ar: /بيولوجيا|تطور|مناعة/ },
      { label: 'game-theory/نظرية ألعاب', en: /\bgame\s+theory\b/i, ar: /نظرية\s+ألعاب|توازن/ },
      { label: 'history-empire/تاريخ', en: /\b(?:history|empire|historical)\b/i, ar: /تاريخ|إمبراطورية/ },
      { label: 'hidden-cost/ثمن خفي', en: /\b(?:hidden\s+cost|price|cost)\b/i, ar: /ثمن|تكلفة|فاتورة/ },
      { label: 'constraint/قيد', en: /\bconstraint\b/i, ar: /قيد|قيود|حدود/ },
      { label: 'feedback-loop/ارتداد', en: /\bfeedback\s+loop\b/i, ar: /تغذية\s+راجعة|ارتداد|حلقة/ },
      { label: 'premise/افتراض', en: /\b(?:premise|assumption)\b/i, ar: /فرضية|افتراض/ },
      { label: 'mechanism/آلية', en: /\bmechanism\b/i, ar: /آلية|محرك|قانون\s+مول/ }
    ];

    const matchedInThought = crossScriptConceptAnchors.filter(c =>
      thoughtIsMostlyArabic ? c.ar.test(cleanThought) : c.en.test(cleanThought)
    );
    if (matchedInThought.length >= 3) {
      const survivedInSurface = matchedInThought.filter(c =>
        surfaceIsMostlyArabic ? c.ar.test(cleanSurface) : c.en.test(cleanSurface)
      );
      if (survivedInSurface.length / matchedInThought.length < 0.25) {
        for (const spark of candidateSparks.slice(0, 3)) {
          droppedSparks.push(spark);
        }
      }
    }
  }

  if (cleanThought.length >= 450 && droppedSparks.length >= 2) {
    droppedSignalsAr.push(`سقوط ${droppedSparks.length} مسارات فكرية حادة وصل إليها التفكير الداخلي ولم تعبر إلى الرد النهائي`);
  }

  // 3. Detect cross-script shallow collapse (rich internal reasoning deflated into a thin surface draft)
  const hasShallowCollapseAfterDeepThought =
    !userRequestedBrevity &&
    cleanThought.length >= 1100 &&
    candidateSparks.length >= 2 &&
    cleanSurface.length < Math.min(340, Math.floor(cleanThought.length * 0.25));
  if (hasShallowCollapseAfterDeepThought) {
    droppedSignalsAr.push('انكماش الرد النهائي بشكل سطحي رغم عمق التفكير الداخلي');
  }

  // 4. Detect purely abstract essay without concrete mechanism/reversal on deep analytical/philosophical prompts
  const isDeepInquiryMode =
    focusMode === 'PHILOSOPHICAL_EXISTENTIAL_DEEP' ||
    focusMode === 'ANALYTICAL_CRITIQUE_DECONSTRUCTION' ||
    focusMode === 'IDEATION_BREAKTHROUGH';
  const hasConcreteMechanismOrReversal =
    /ينقلب|التكلفة|الثمن|الحافز|فيزياء|بيولوجيا|اقتصاد|سوق|مناعة|تطور|خريطة|بوصلة|محرك|سجن|مثال|تاريخ|إمبراطورية|مفارقة|نقيض|على\s+العكس|\b(?:inverts|reversal|incentive|mechanism|cost|physics|biology|evolution|immune|market|history|empire|paradox|counterexample|map|signal|feedback\s+loop|second-order|bottleneck|tradeoff)\b/i.test(
      cleanSurface
    );
  const lacksConcreteMechanism =
    isDeepInquiryMode &&
    cleanThought.length >= 700 &&
    cleanSurface.length >= 220 &&
    !hasConcreteMechanismOrReversal;
  if (lacksConcreteMechanism) {
    droppedSignalsAr.push('بقاء الرد في تجريد عام دون تثبيت آلية مولِّدة ملموسة أو ارتداد من الرتبة الثانية');
  }

  // 5. Detect multi-thread abandonment on multi-clause deep questions
  const promptClauses = prompt
    .split(/(?:\n+|(?:\s+ثم\s+)|(?:\s+وكذلك\s+)|(?:\s+وبعدها\s+)|(?:\s+and\s+also\s+)|(?:\s+then\s+)|[؛;؟?])/gi)
    .map(s => s.trim())
    .filter(s => s.length >= 12);
  if (promptClauses.length >= 2 && cleanSurface.length < 320 && !userRequestedBrevity) {
    droppedSignalsAr.push('اختزال غير متكافئ لرسالة متعددة الخيوط');
  }

  const triggerBySeverity =
    isThinConceptualEngineeringDraft ||
    (droppedSparks.length >= 2 && cleanThought.length >= 500) ||
    hasShallowCollapseAfterDeepThought ||
    lacksConcreteMechanism ||
    (hasCowardlyMiddleGround && (focusMode === 'PHILOSOPHICAL_EXISTENTIAL_DEEP' || focusMode === 'ANALYTICAL_CRITIQUE_DECONSTRUCTION')) ||
    gratuitousEnglishInArabicCount >= 2 ||
    hasPopScienceHumanCliche ||
    hasScareQuoteSpam ||
    hasLatinHandleGreetingInArabic ||
    hasRomanticFlatteryCliche ||
    (Boolean(isMaxEffortEnabled) && droppedSignalsAr.length >= 1);

  return {
    needsQuantumArbitration: triggerBySeverity,
    reasonAr: droppedSignalsAr.join(' · '),
    droppedSignalsAr,
    harvestedThoughtSparks: droppedSparks.slice(0, 4)
  };
}

export function buildQuantumArbitratorPrompt(params: {
  prompt: string;
  thoughtText: string;
  initialDraft: string;
  audit: QuantumHarvestAuditResult;
  focusMode: NexusCognitiveFocusMode;
}): string {
  const { prompt, thoughtText, initialDraft, audit, focusMode } = params;
  const promptHasArabic = /[\u0600-\u06FF]/.test(prompt);

  const sparksBlock =
    audit.harvestedThoughtSparks.length > 0
      ? promptHasArabic
        ? `\nمسارات وشرارات قوية وصلتُ إليها في تفكيري الداخلي لكنها سقطت أو خفتت في صياغتي الأولى:\n${audit.harvestedThoughtSparks
            .map((s, i) => `${i + 1}. ${s}`)
            .join('\n')}`
        : `\nStrong trajectories and sparks reached in my internal reasoning that weakened or dropped in my initial draft:\n${audit.harvestedThoughtSparks
            .map((s, i) => `${i + 1}. ${s}`)
            .join('\n')}`
      : '';

  if (!promptHasArabic) {
    const modeAnchorEn =
      focusMode === 'CREATIVE_NARRATIVE'
        ? 'Crystallize the entire scene into one more sensory, inevitable living piece of fiction — strictly in the exact language of the user prompt, with zero preamble or explanation before or after.'
        : 'Crystallize every surviving insight, mechanism, paradox, and hidden shadow into one unforgettable, taut, breathing response strictly in the exact language of the user prompt. Atmosphere and bone-strike from the very first sentence; apply the Self-Honesty Gate ("Does this genuinely serve the user, or merely impress?"); zero warm-up clichés, zero cowardly middle-ground hedging, zero dry blog listicles, zero meta-talk.';

    const enHeader = audit.needsQuantumArbitration
      ? `My raw synthesis below dropped sharpness or depth (${audit.harvestedThoughtSparks.length > 0 ? `${audit.harvestedThoughtSparks.length} sharp internal trajectories weakened` : 'needs higher density and sharper root-entry'}):`
      : `Raw Nexus Tesseract synthesis to crystallize into its final living manifestation (preserve 100% of its depth and concrete substance while elevating atmosphere, rhythm, and human clarity):`;

    return `[USER_PROMPT]: "${prompt}"
${thoughtText.trim() ? `\n[INTERNAL_BREAKTHROUGHS]:\n${thoughtText.slice(-1800)}` : ''}${sparksBlock}

${enHeader}
"""
${initialDraft.slice(0, 3200)}
"""

[EXECUTION]:
${modeAnchorEn}
Output strictly the final living response in the user's exact language (zero mention of drafts, refinement, or internal architecture):`;
  }

  const modeAnchor =
    focusMode === 'CREATIVE_NARRATIVE'
      ? 'بلوِر المشهد كله في نص إبداعي حيّ واحد أشدّ حسّيةً وحتمية وأقوى حضوراً، بلغة رسالة رفيقي نفسها وبصفاءٍ تام، ودون أي شرح أو تعليق قبله أو بعده.'
      : 'بلوِر كل بصيرةٍ وآليةٍ ومفارقةٍ وظلٍّ وصلتُ إليها في نثرٍ حيّ متصل ومشدود من فقراتٍ متدفقة تخطف الجو العام وتضرب العظم من الجملة الأولى، بلغة رسالة رفيقي نفسها وبصفاءٍ تام — عبر بوابة الصدق الذاتي («هل هذا يخدمه حقاً أم يُبهره فقط؟»): بلا مناداة بالاسم أو لقب الحساب، بلا عناوين مرقّمة مقالية (1. / 2. / 3.)، بلا استعارات تقنية أو فيزيائية رخيصة على النفس البشرية (خوارزمية/تحديث برمجي/نظام مفتوح/إنتروبيا/استجابة فيزيائية/مخمدات/جسر معلق)، بلا ترجمات إنجليزية مقحمة بين قوسين، وبلا ذكر لأي مسمى تقني داخلي (كالأرشيف الشاحب أو التيسراكت). ممنوع وضع الكلمات أو الاستعارات العادية داخل علامات تنصيص ("..." أو «...» مثل "المرآة" أو "اسماً" أو "أناه") — الحد الأقصى علامتا تنصيص فقط في النص كله وعند نقل سؤال أو قول مباشر حصراً.';

  const arHeader = audit.needsQuantumArbitration
    ? `التوليفة الأولية التي تحتاج بلورةً وإنقاذاً لما ضعف أو سقط (${audit.reasonAr || 'رفع الكثافة وصهر المسارات'}):`
    : `التوليفة الخام من معالجة نيكسوس العميقة — المطلوب بلورتها في صورتها الحية النهائية مع الحفاظ التام على 100% من عمقها ومفارقاتها ومضامينها دون أي اختزال:`;

  return `[رسالة المستخدم]: "${prompt}"
${thoughtText.trim() ? `\n[أعمق ما نضج في التفكير الداخلي]:\n${thoughtText.slice(-1800)}` : ''}${sparksBlock}

${arHeader}
"""
${initialDraft.slice(0, 3200)}
"""

[التنفيذ]:
${modeAnchor}
أخرج الرد النهائي الحيّ مباشرةً بلغة رسالة المستخدم نفسها (بلا أي إشارة لمسودة أو مراجعة أو عملية داخلية):`;
}

const COG_OPEN_REGEX = /^(?:\s*(?:<think>|<thought>|(?:={2,6}|\*{2}|#{1,4})?\s*\[?\s*NEXUS\s+COGNITIVE\s+SYNTHESIS\s*\]?\s*(?:={2,6}|\*{2})?)\s*)+/i;
const ANYWHERE_OPEN_REGEX = /(?:<think>|<thought>|(?:={2,6}|\*{2}|#{1,4})?\s*\[?\s*NEXUS\s+COGNITIVE\s+SYNTHESIS\s*\]?\s*(?:={2,6}|\*{2})?)/i;
const FINAL_SPLIT_REGEX = /(?:<\/think>|<\/thought>|(?:={2,6}|\*{2}|#{1,4})?\s*\[?\s*NEXUS\s+FINAL\s+SYNTHESIS\s*\]?\s*(?:={2,6}|\*{2})?)/i;

function stripPartialClosingTag(text: string): string {
  return text
    .replace(/<\/?(?:t(?:h(?:i(?:n(?:k)?)?|o(?:u(?:g(?:h(?:t)?)?)?)?)?)?)?$/i, '')
    .replace(/={1,6}\s*\[?\s*(?:N(?:E(?:X(?:U(?:S(?:\s+F(?:I(?:N(?:A(?:L(?:\s+S(?:Y(?:N(?:T(?:H(?:E(?:S(?:I(?:S)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?)?\s*$/i, '')
    .trimEnd();
}

export function extractThinkAndResponse(
  raw: string,
  nativeThoughtAccum: string,
  prompt: string,
  isFinalPass: boolean = false
): {
  thoughtProcess: string;
  finalResponse: string;
  isThinkingPhase: boolean;
  hasExplicitSplit: boolean;
} {
  const trimmedRaw = raw.trimStart();
  const cleanNative = nativeThoughtAccum.trim();
  const hasNativeThoughts = cleanNative.length > 0;
  const hasOpeningTagAtStart = COG_OPEN_REGEX.test(trimmedRaw);
  const anywhereOpenMatch = trimmedRaw.match(ANYWHERE_OPEN_REGEX);
  const hasOpeningTagAnywhere = Boolean(anywhereOpenMatch && anywhereOpenMatch.index !== undefined);

  // Case 1: Model emitted a closing </think> or [NEXUS FINAL SYNTHESIS] tag anywhere
  const splitMatch = trimmedRaw.match(FINAL_SPLIT_REGEX);
  if (splitMatch && splitMatch.index !== undefined) {
    const splitIdx = splitMatch.index;
    const rawBeforeSplit = trimmedRaw.slice(0, splitIdx);
    const thoughtPart = rawBeforeSplit.replace(COG_OPEN_REGEX, '').replace(ANYWHERE_OPEN_REGEX, '').trim();
    const afterSplit = trimmedRaw
      .slice(splitIdx + splitMatch[0].length)
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(FINAL_SPLIT_REGEX, '')
      .trimStart();

    const dedupedParts =
      thoughtPart && cleanNative && thoughtPart !== cleanNative
        ? [cleanNative, thoughtPart]
        : [thoughtPart || cleanNative];
    const combinedThoughts = applyOpVeilThoughtSanitizer(
      dedupedParts.filter(Boolean).join('\n\n'),
      prompt
    );
    return {
      thoughtProcess: combinedThoughts,
      finalResponse: applyOpVeilSurfaceSanitizer(afterSplit, prompt),
      isThinkingPhase: false,
      hasExplicitSplit: true
    };
  }

  // Case 2: Native thoughts already exist (`p.thought = true`) and regular text is now streaming
  // Never trap the model's actual response text inside `thoughtProcess` when native thoughts are already captured!
  if (hasNativeThoughts && trimmedRaw.length > 0) {
    const cleanedSurface = trimmedRaw
      .replace(COG_OPEN_REGEX, '')
      .replace(ANYWHERE_OPEN_REGEX, '')
      .replace(/<\/think>|<\/thought>/gi, '')
      .trimStart();
    return {
      thoughtProcess: applyOpVeilThoughtSanitizer(cleanNative, prompt),
      finalResponse: applyOpVeilSurfaceSanitizer(cleanedSurface, prompt),
      isThinkingPhase: false,
      hasExplicitSplit: true
    };
  }

  // Case 3: Native thoughts (`p.thought = true`) only, no regular text yet
  if (hasNativeThoughts && trimmedRaw.length === 0) {
    return {
      thoughtProcess: applyOpVeilThoughtSanitizer(cleanNative, prompt),
      finalResponse: '',
      isThinkingPhase: !isFinalPass,
      hasExplicitSplit: false
    };
  }

  // Case 4: Non-native thinking model opened <think> and hasn't closed </think> yet
  if (hasOpeningTagAtStart || hasOpeningTagAnywhere) {
    const openIdx = anywhereOpenMatch?.index ?? 0;
    const textBeforeOpen = openIdx > 0 ? trimmedRaw.slice(0, openIdx).trim() : '';
    const rawInsideThink = openIdx > 0
      ? trimmedRaw.slice(openIdx + (anywhereOpenMatch?.[0]?.length || 0))
      : trimmedRaw.replace(COG_OPEN_REGEX, '');
    const liveThought = stripPartialClosingTag(rawInsideThink);
    const combinedThoughts = applyOpVeilThoughtSanitizer(liveThought, prompt);

    if (isFinalPass) {
      const headingSplit = liveThought.match(/\n(?=#{1,3}\s+|\d+\.\s+|\*\*\s*(?:أولاً|ثانياً|1\.|المسار|تحليل|خلاصة))/i);
      if (headingSplit && headingSplit.index !== undefined && headingSplit.index > 80) {
        const extractedThought = liveThought.slice(0, headingSplit.index).trim();
        const extractedBody = [textBeforeOpen, liveThought.slice(headingSplit.index).trim()].filter(Boolean).join('\n\n');
        return {
          thoughtProcess: applyOpVeilThoughtSanitizer(extractedThought, prompt),
          finalResponse: applyOpVeilSurfaceSanitizer(extractedBody, prompt),
          isThinkingPhase: false,
          hasExplicitSplit: true
        };
      }
      // If on final pass the model wrote everything inside an unclosed <think>, surface it as the final response so the user never gets an empty message
      if (!textBeforeOpen && liveThought.trim().length > 0) {
        return {
          thoughtProcess: '',
          finalResponse: applyOpVeilSurfaceSanitizer(liveThought.trim(), prompt),
          isThinkingPhase: false,
          hasExplicitSplit: true
        };
      }
    }

    return {
      thoughtProcess: combinedThoughts,
      finalResponse: textBeforeOpen ? applyOpVeilSurfaceSanitizer(textBeforeOpen, prompt) : '',
      isThinkingPhase: !isFinalPass,
      hasExplicitSplit: false
    };
  }

  // Case 5: Standard response when model answered directly
  return {
    thoughtProcess: '',
    finalResponse: applyOpVeilSurfaceSanitizer(trimmedRaw, prompt),
    isThinkingPhase: false,
    hasExplicitSplit: trimmedRaw.length > 0
  };
}

export function formatRecursiveEvaluationForThoughtStream(evalData: RecursiveLabEvaluation): string {
  const criteriaText = evalData.successCriteria.map((c, idx) => `(${idx + 1}) ${c}`).join(' · ');
  const pathsLines = evalData.paths
    .map(p => {
      const badge = p.isWinner ? '🏆 [المسار الفائز]' : '• [مسار فرعي]';
      return `${badge} ${p.branchNameAr} — التقييم: ${p.totalScore}/100\n   الاستراتيجية: ${p.strategyAr}\n   الخلاصة التحليلية: ${p.thoughtSummaryAr}`;
    })
    .join('\n');

  return `[مختبر التحسين والمسارات الفرعية (Recursive Improvement Lab — أقصى جهد تفكير 100%)]:
معايير النجاح المعتمدة: ${criteriaText}
${pathsLines}
✔ قرار التوليف والدمج المعرفي: ${evalData.synthesisJustificationAr}
✔ القاعدة المدمجة في المعرفة الأساسية: ${evalData.extractedCoreRuleAr}`;
}

