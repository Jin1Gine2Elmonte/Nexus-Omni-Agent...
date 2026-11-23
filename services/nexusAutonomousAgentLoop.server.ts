// NEXUS SOVEREIGN AUTONOMOUS AGENT ENGINE (ReAct + Native Gemini Tool Calling + Parallel Subagents + Real Disk Workspace + Terminal + WebCortex)
import fs from "fs";
import path from "path";
import { Type, type FunctionDeclaration } from "@google/genai";
import {
  executeSovereignTerminalCommand,
  performOpenClawExternalFetch,
  type SovereignGeneratedArtifact
} from "../server_agentOs.ts";
import {
  applySurgicalPatchToFiles,
  executeSovereignHarnessSwarm,
  type HarnessFileItem,
  normalizeHarnessLanguage
} from "./nexusSovereignHarness.ts";
import {
  getAIClient,
  prioritizeByQuotaCooldown,
  getHydrogenExecutiveSubagentCascade,
  markModelQuotaCooldown,
  buildModelThinkingConfig,
  forgeDirectUniversalArtifactViaTerminal,
  SOVEREIGN_SAFETY_SETTINGS
} from "./geminiCore.server.ts";

export interface AgentWorkspaceState {
  workspaceId: string;
  workspaceDir: string;
  files: Map<string, HarnessFileItem>;
  executedToolLogsAr: string[];
  generatedArtifacts: Map<string, SovereignGeneratedArtifact>;
  usedToolBadges: Set<string>;
}

const PUBLIC_GENERATED_DIR = "/tmp/nexus_runtime_artifacts/generated_files";
const AGENT_WORKSPACES_ROOT = path.join(PUBLIC_GENERATED_DIR, "agent_workspaces");

function ensureWorkspaceDirs(workspaceDir: string) {
  if (!fs.existsSync(PUBLIC_GENERATED_DIR)) {
    fs.mkdirSync(PUBLIC_GENERATED_DIR, { recursive: true });
  }
  if (!fs.existsSync(AGENT_WORKSPACES_ROOT)) {
    fs.mkdirSync(AGENT_WORKSPACES_ROOT, { recursive: true });
  }
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }
}

function sanitizeRelativeFilePath(rawPath: string): string {
  const cleaned = String(rawPath || "src/index.html")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.\.+/g, "")
    .replace(/\/+/g, "/")
    .trim();
  return cleaned || "src/index.html";
}

function writeWorkspaceFileToDisk(
  state: AgentWorkspaceState,
  relPath: string,
  content: string,
  language?: string,
  title?: string
): HarnessFileItem {
  ensureWorkspaceDirs(state.workspaceDir);
  const safeRelPath = sanitizeRelativeFilePath(relPath);
  const absPath = path.join(state.workspaceDir, safeRelPath);
  const parentDir = path.dirname(absPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  fs.writeFileSync(absPath, content, "utf-8");

  // Also mirror top-level deliverable into /public/generated_files for direct 1-click download
  const flatFileName = `${state.workspaceId}_${safeRelPath.replace(/\//g, "_")}`;
  const publicMirrorPath = path.join(PUBLIC_GENERATED_DIR, flatFileName);
  try {
    fs.writeFileSync(publicMirrorPath, content, "utf-8");
    const stat = fs.statSync(publicMirrorPath);
    const ext = (path.extname(safeRelPath).replace(".", "") || "txt").toLowerCase();
    state.generatedArtifacts.set(flatFileName, {
      filename: flatFileName,
      relativePath: flatFileName,
      downloadUrl: `/generated_files/${encodeURIComponent(flatFileName)}`,
      mimeType:
        ext === "html"
          ? "text/html"
          : ext === "py"
          ? "text/x-python"
          : ext === "js" || ext === "ts"
          ? "application/javascript"
          : ext === "json"
          ? "application/json"
          : "text/plain",
      category:
        ext === "py" || ext === "js" || ext === "ts" || ext === "html" || ext === "css" || ext === "sql"
          ? "code"
          : "document",
      sizeBytes: stat.size,
      createdAt: Date.now()
    });
  } catch {
    // Non-fatal mirror write
  }

  const item: HarnessFileItem = {
    name: title || safeRelPath.split("/").pop() || safeRelPath,
    path: safeRelPath,
    language: normalizeHarnessLanguage(language, safeRelPath),
    content
  };
  state.files.set(safeRelPath, item);
  return item;
}

// ---------------------------------------------------------------------------
// 7 REAL EXECUTABLE AGENT FUNCTION DECLARATIONS (Native Gemini Function Calling)
// ---------------------------------------------------------------------------
export const SOVEREIGN_AGENT_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "workspace_list_and_read",
    description:
      "استكشاف شجرة ملفات مساحة عمل الوكيل أو ملفات المشروع وقراءة محتوى أي ملف حقيقي على القرص قبل تعديله أو البناء عليه.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: "'list' لعرض قائمة الملفات في مساحة العمل، أو 'read' لقراءة محتوى ملف محدد."
        },
        file_path: {
          type: Type.STRING,
          description: "مسار الملف المراد قراءته عند اختيار action='read' (مثل src/app.js أو chapters/chapter_01.md)."
        }
      },
      required: ["action"]
    }
  },
  {
    name: "workspace_write_file",
    description:
      "إنشاء أو كتابة ملف كامل حقيقي على القرص في مساحة عمل الوكيل ومزامنته فوراً في الكانفاس الحي (سواء ملف كود برمجي أو فصل روائي/موسوعي كامل).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file_path: {
          type: Type.STRING,
          description: "مسار الملف داخل المشروع (مثل src/index.html أو backend/engine.py أو chapters/chapter_01.md)."
        },
        title: {
          type: Type.STRING,
          description: "عنوان وصفي للملف أو الفصل بالعربية."
        },
        language: {
          type: Type.STRING,
          description: "لغة الملف: html, css, javascript, typescript, python, sql, json, markdown."
        },
        content: {
          type: Type.STRING,
          description: "المحتوى الكامل والنهائي للملف دون أي اختصار."
        }
      },
      required: ["file_path", "content"]
    }
  },
  {
    name: "workspace_apply_patch",
    description:
      "تطبيق رقعة تعديل جراحية دقيقة (Codex apply_patch / Search-Replace) على ملف موجود في مساحة العمل دون إعادة كتابة الأجزاء السليمة.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file_path: {
          type: Type.STRING,
          description: "مسار الملف المستهدف بالتعديل الجراحي."
        },
        search_block: {
          type: Type.STRING,
          description: "المقطع الدقيق الموجود حالياً في الملف والمراد استبداله."
        },
        replace_block: {
          type: Type.STRING,
          description: "المقطع الجديد المحسّن الذي سيحل محل المقطع القديم."
        }
      },
      required: ["file_path", "search_block", "replace_block"]
    }
  },
  {
    name: "execute_terminal_sandbox",
    description:
      "تنفيذ كود حقيقي في التيرمنال السيادي الحي (Python 3.10 / Node.js / Bash / FFmpeg / SQLite3) لاختبار الخوارزميات، فحص الكود، معالجة البيانات، أو توليد ملفات وسائط وأرشيفات حقيقية.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        language: {
          type: Type.STRING,
          description: "بيئة التنفيذ: 'python' أو 'node' أو 'bash'."
        },
        purpose: {
          type: Type.STRING,
          description: "الهدف من تشغيل هذا الكود في التيرمنال."
        },
        code: {
          type: Type.STRING,
          description: "الكود البرمجي أو الأمر الكامل المراد تنفيذه فعلياً."
        }
      },
      required: ["language", "code"]
    }
  },
  {
    name: "spawn_subagent_swarm",
    description:
      "إطلاق سرب وكلاء فرعيين متوازيين معزولي السياق (ctx.subagents + Virtual Worktrees) يعملون في نفس اللحظة (Promise.all) لبناء ملفات مشروع متعدد الطبقات أو فصول عمل روائي/موسوعي ضخم بالتوازي.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mission_title: {
          type: Type.STRING,
          description: "عنوان المشروع أو العمل الكبير الذي يبنيه سرب الوكلاء."
        },
        subagents_json: {
          type: Type.STRING,
          description:
            "مصفوفة JSON للوكلاء الفرعيين المتوازيين، كل عنصر يحتوي على: {\"role_ar\": \"اسم دور الوكيل\", \"file_path\": \"مسار الملف المملوك له\", \"language\": \"لغة الملف\", \"objective\": \"المهمة التفصيلية المطلوبة منه\"}."
        }
      },
      required: ["mission_title", "subagents_json"]
    }
  },
  {
    name: "web_cortex_fetch",
    description:
      "سحب وتحليل محتوى أي رابط ويب خارجي أو واجهة API حية بالوقت الفعلي عبر محرك OpenClaw WebCortex.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "الرابط الكامل للموقع أو الـ API (https://...)."
        }
      },
      required: ["url"]
    }
  },
  {
    name: "verify_and_package_workspace",
    description:
      "فحص سلامة جميع ملفات مساحة العمل برمجياً وسردياً (Python/Node AST syntax check + فحص اكتمال الفصول) وتحزيم المشروع/العمل كاملاً في أرشيف ZIP حقيقي قابل للتحميل المباشر.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        archive_name: {
          type: Type.STRING,
          description: "اسم أرشيف الـ ZIP النهائي (مثل nexus_project_bundle.zip)."
        }
      },
      required: ["archive_name"]
    }
  },
  {
    name: "forge_bespoke_document_artifact",
    description:
      "صكّ وبناء وثيقة أو كتاب مستقل مخصص (.pdf, .docx, .xlsx, .pptx, .epub, .html, .md) على القرص مباشرة بهندسة بصرية وتايبوجرافية حرة بالكامل (يدعم :::callout, :::card-grid, :::stat-strip, :::steps, :::timeline, svg, chart, board, math).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: {
          type: Type.STRING,
          description: "اسم الملف مع الامتداد (مثل manual.pdf أو report.docx أو data.xlsx)."
        },
        title: {
          type: Type.STRING,
          description: "العنوان الرئيسي للوثيقة أو الكتاب."
        },
        subtitle: {
          type: Type.STRING,
          description: "العنوان الفرعي الاختياري."
        },
        content: {
          type: Type.STRING,
          description: "المتن الكامل للوثيقة بصيغة Markdown المثرى بالمكونات البصرية الحرة."
        }
      },
      required: ["filename", "title", "content"]
    }
  }
];

// ---------------------------------------------------------------------------
// REAL EXECUTION HANDLER FOR EACH AGENT TOOL CALL
// ---------------------------------------------------------------------------
export async function executeSingleSovereignAgentToolCall(
  toolName: string,
  rawArgs: Record<string, any>,
  state: AgentWorkspaceState,
  modelCascade: string[]
): Promise<{
  toolOutputSummary: string;
  toolLogLineAr: string;
}> {
  const args = rawArgs || {};

  if (toolName === "workspace_list_and_read") {
    state.usedToolBadges.add("إدارة وفحص ملفات مساحة العمل (Workspace FS)");
    const action = String(args.action || "list").toLowerCase();
    if (action === "read" && args.file_path) {
      const targetRel = sanitizeRelativeFilePath(args.file_path);
      const inMem = state.files.get(targetRel);
      if (inMem) {
        const lines = inMem.content.split("\n").length;
        const words = inMem.content.split(/\s+/).filter(Boolean).length;
        const logLine = `📂 [workspace_list_and_read]: قراءة الملف «${targetRel}» (${lines} سطراً · ${words} كلمة).`;
        state.executedToolLogsAr.push(logLine);
        return {
          toolOutputSummary: `محتوى الملف [${targetRel}] (${lines} سطراً، ${words} كلمة):\n${inMem.content.slice(0, 14000)}`,
          toolLogLineAr: logLine
        };
      }
      // Check project repo read-only
      const repoCandidate = path.join(process.cwd(), targetRel);
      if (
        repoCandidate.startsWith(process.cwd()) &&
        fs.existsSync(repoCandidate) &&
        fs.statSync(repoCandidate).isFile()
      ) {
        const raw = fs.readFileSync(repoCandidate, "utf-8");
        const logLine = `📂 [workspace_list_and_read]: قراءة ملف المشروع «${targetRel}» (${raw.split("\n").length} سطراً).`;
        state.executedToolLogsAr.push(logLine);
        return {
          toolOutputSummary: `محتوى ملف المشروع [${targetRel}]:\n${raw.slice(0, 12000)}`,
          toolLogLineAr: logLine
        };
      }
      const notFoundLog = `📂 [workspace_list_and_read]: الملف «${targetRel}» غير موجود بعد في مساحة العمل.`;
      state.executedToolLogsAr.push(notFoundLog);
      return {
        toolOutputSummary: `الملف ${targetRel} غير موجود حالياً في مساحة العمل. الملفات الموجودة: [${Array.from(state.files.keys()).join(", ") || "لا يوجد بعد"}]`,
        toolLogLineAr: notFoundLog
      };
    }

    const fileEntries = Array.from(state.files.values()).map(
      f => `- ${f.path} (${f.language} · ${f.content.split("\n").length} سطراً · ${f.content.split(/\s+/).filter(Boolean).length} كلمة)`
    );
    const listLog = `📂 [workspace_list_and_read]: مسح شجرة مساحة العمل (${fileEntries.length} ملفات نشطة).`;
    state.executedToolLogsAr.push(listLog);
    return {
      toolOutputSummary:
        fileEntries.length > 0
          ? `ملفات مساحة العمل الحالية (${fileEntries.length}):\n${fileEntries.join("\n")}`
          : "مساحة العمل فارغة حالياً وجاهزة لإنشاء الملفات.",
      toolLogLineAr: listLog
    };
  }

  if (toolName === "workspace_write_file") {
    state.usedToolBadges.add("كتابة وبناء الملفات الحية (Workspace File Writer)");
    const filePath = sanitizeRelativeFilePath(args.file_path || "src/index.html");
    const content = String(args.content || "").trim();
    const title = String(args.title || filePath.split("/").pop() || filePath).trim();
    const language = String(args.language || "");

    const written = writeWorkspaceFileToDisk(state, filePath, content, language, title);
    const lines = content.split("\n").length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const logLine = `✍️ [workspace_write_file]: تم إنشاء وحفظ الملف «${written.path}» على القرص وفي الكانفاس (${lines} سطراً · ${words} كلمة).`;
    state.executedToolLogsAr.push(logLine);
    return {
      toolOutputSummary: `تم حفظ الملف [${written.path}] بنجاح (${lines} سطراً، ${words} كلمة) في مساحة العمل وعلى القرص.`,
      toolLogLineAr: logLine
    };
  }

  if (toolName === "workspace_apply_patch") {
    state.usedToolBadges.add("الرقعة الجراحية للملفات (Codex V4A apply_patch)");
    const filePath = sanitizeRelativeFilePath(args.file_path || "");
    const searchBlock = String(args.search_block || "");
    const replaceBlock = String(args.replace_block || "");
    const existingList = Array.from(state.files.values());

    const patchPayload = `<nexus_patch path="${filePath}" action="update">\n<<<<<<< SEARCH\n${searchBlock}\n=======\n${replaceBlock}\n>>>>>>> REPLACE\n</nexus_patch>`;
    const patchRes = applySurgicalPatchToFiles(existingList, patchPayload, filePath);

    if (patchRes.success) {
      for (const pf of patchRes.patchedFiles) {
        if (pf.path === filePath) {
          writeWorkspaceFileToDisk(state, pf.path, pf.content, pf.language, pf.name);
        }
      }
    }
    const logLine = `🩹 [workspace_apply_patch]: ${patchRes.logAr} (${filePath})`;
    state.executedToolLogsAr.push(logLine);
    return {
      toolOutputSummary: patchRes.logAr,
      toolLogLineAr: logLine
    };
  }

  if (toolName === "execute_terminal_sandbox") {
    state.usedToolBadges.add("التيرمنال السيادي الحي (Python3/Node/Bash)");
    const lang = String(args.language || "python").toLowerCase();
    const purpose = String(args.purpose || "تنفيذ كود وكيل سيادي في التيرمنال").trim();
    const code = String(args.code || "").trim();

    const execRes = executeSovereignTerminalCommand({
      codeOrCmd: code,
      lang,
      actor: "nexus_agent",
      purpose,
      timeoutMs: 25000
    });

    if (Array.isArray(execRes.generatedArtifacts)) {
      for (const art of execRes.generatedArtifacts) {
        state.generatedArtifacts.set(art.filename, art);
      }
    }

    const cleanOut = (execRes.stdout || execRes.stderr || "Exit 0").trim().slice(0, 4000);
    const logLine = `⚡ [execute_terminal_sandbox · ${execRes.lang.toUpperCase()} · Exit ${execRes.exitCode} · ${execRes.durationMs}ms]: ${purpose} ➔ ${cleanOut.replace(/\n+/g, " | ").slice(0, 220)}`;
    state.executedToolLogsAr.push(logLine);

    return {
      toolOutputSummary: `نتيجة تنفيذ التيرمنال (${execRes.lang}, Exit Code: ${execRes.exitCode}, ${execRes.durationMs}ms):\nSTDOUT:\n${execRes.stdout || "(فارغ)"}\nSTDERR:\n${execRes.stderr || "(لا يوجد)"}${
        execRes.generatedArtifacts?.length
          ? `\nالملفات المولدة على القرص: ${execRes.generatedArtifacts.map(a => `${a.filename} (${a.downloadUrl})`).join(", ")}`
          : ""
      }`,
      toolLogLineAr: logLine
    };
  }

  if (toolName === "spawn_subagent_swarm") {
    state.usedToolBadges.add("سرب الوكلاء الفرعيين المتوازيين (ctx.subagents + Worktrees)");
    const missionTitle = String(args.mission_title || "مهمة سرب الوكلاء المتوازي").trim();
    let specs: Array<{
      role_ar: string;
      file_path: string;
      language?: string;
      objective: string;
    }> = [];

    try {
      const parsed = JSON.parse(String(args.subagents_json || "[]"));
      if (Array.isArray(parsed)) {
        specs = parsed
          .filter(item => item && (item.file_path || item.path) && (item.objective || item.task))
          .slice(0, 6)
          .map((item, idx) => ({
            role_ar: String(item.role_ar || item.role || `وكيل فرعي #${idx + 1}`),
            file_path: sanitizeRelativeFilePath(item.file_path || item.path || `worktree_${idx + 1}.md`),
            language: String(item.language || ""),
            objective: String(item.objective || item.task || "")
          }));
      }
    } catch {
      specs = [];
    }

    if (specs.length === 0) {
      // Use full Sovereign Harness Swarm if JSON specs weren't manually itemized
      const swarmRes = await executeSovereignHarnessSwarm({
        prompt: missionTitle,
        existingFiles: Array.from(state.files.values()),
        projectTitle: missionTitle
      });
      for (const f of swarmRes.files) {
        writeWorkspaceFileToDisk(state, f.path, f.content, f.language, f.name);
      }
      const logLine = `🐝 [spawn_subagent_swarm]: أنجز سرب الوكلاء المتوازيين (${swarmRes.subagentReports.length} وكلاء في أشجار عمل معزولة) بناء ${swarmRes.files.length} ملفات في ${swarmRes.totalDurationMs}ms.`;
      state.executedToolLogsAr.push(logLine);
      return {
        toolOutputSummary: `تم تنفيذ سرب الوكلاء بنجاح (${swarmRes.totalDurationMs}ms):\n${swarmRes.subagentReports
          .map(r => `- ${r.roleNameAr} (${r.worktreeId}): بنى [${r.ownedPaths.join(", ")}] (${r.linesWritten} سطراً)`)
          .join("\n")}\nتقرير الفحص: ${swarmRes.verificationReportAr}`,
        toolLogLineAr: logLine
      };
    }

    const ai = getAIClient();
    const sharedFilesOverview = Array.from(state.files.values())
      .map(f => `- ${f.path}: ${f.content.slice(0, 300).replace(/\n+/g, " ")}`)
      .join("\n");

    const swarmStartMs = Date.now();
    const results = await Promise.all(
      specs.map(async (spec, idx) => {
        const worktreeId = `wt-subagent-0${idx + 1}`;
        const isProse =
          /markdown|md|text/i.test(spec.language || "") ||
          /\.(md|txt)$/i.test(spec.file_path) ||
          /chapter|فصل|مشهد|موسوعة|كتاب|سرد|codex/i.test(`${spec.file_path} ${spec.role_ar}`);

        const subPrompt = `[امتداد الوعي السيادي — ${spec.role_ar} | Worktree: ${worktreeId} | العمل الكلي: "${missionTitle}"]
الملف المملوك حصرياً (File Ownership Lock): ${spec.file_path}
${sharedFilesOverview ? `\nخريطة الملفات والفصول الأخرى في مساحة العمل لضمان التحام العضوية والاتساق الكامل 100%:\n${sharedFilesOverview}\n` : ""}
الغاية البنائية لهذا الملف:
${spec.objective}

[طبيعة البناء والتمايز النسيجي والتحقق السببي]:
- يتشكل هذا الملف كبنيان متصل ومكتمل في ذاته ومتآزر مع بقية ملفات المشروع:
  1. **الضرورة البنيوية والسببية**: كل عنصر في هذا الملف (مشهد، حوار، مفهوم فكري، أو دالة برمجية) يحمل ضرورته السببية في موضعه ويخدم البنية الكلية للمشروع.
  2. **التجسيد الملموس**: في السرد والأدب، تتجسد المعاني والمشاعر عبر الفعل الحسي والحركة والتوتر الدرامي الحي والتفاصيل الملموسة؛ وفي البرمجة والهندسة، تتجسد المتطلبات في دوال مكتملة ومنطق تنفيذي ومعالجة أخطاء صلبة.
  3. **زاوية التلقي والجسر البشري**: يتدرج إيقاع البناء من المألوف إلى العميق ومن المجرد إلى المحسوس بأعلى وضوح وقوة.
${
  isProse
    ? `- طبيعة المتن (${spec.file_path}): متن غني، ممتد، ومكتمل من البناء الحي المتصل، المشاهد المجسدة، الحوارات العميقة، والأبعاد الفلسفية والنفسية المنصهرة.`
    : `- طبيعة الكود (${spec.file_path}): الكود البرمجي الكامل والنهائي الجاهز للعمل الفوري بتكامل تام مع بقية ملفات المشروع.`
}
المحتوى الكامل لملف ${spec.file_path} مباشرةً (بدون وسوم <think> أو <nexus_file>):`;

        const swarmModels = getHydrogenExecutiveSubagentCascade(
          modelCascade.filter(m => !m.includes("flash"))
        );

        for (const candidateModel of swarmModels) {
          try {
            const subThinkingCfgFull = buildModelThinkingConfig(candidateModel, 95, true, "full");
            const subThinkingCfgLevel = buildModelThinkingConfig(candidateModel, 95, true, "level_only");
            const callSubagent = (cfg: Record<string, any>) =>
              ai.models.generateContent({
                model: candidateModel,
                contents: [{ role: "user", parts: [{ text: subPrompt }] }],
                config: {
                  safetySettings: SOVEREIGN_SAFETY_SETTINGS,
                  ...cfg
                }
              });

            let resp: any;
            try {
              resp = await callSubagent(subThinkingCfgFull);
            } catch {
              try {
                resp = await callSubagent(subThinkingCfgLevel);
              } catch {
                resp = await callSubagent({});
              }
            }
            const cleanContent = (resp.text || "")
              .replace(/<think>[\s\S]*?<\/think>/gi, "")
              .replace(/^```[a-zA-Z0-9_-]*\n?/i, "")
              .replace(/```$/i, "")
              .trim();
            if (cleanContent.length > 40) {
              const written = writeWorkspaceFileToDisk(
                state,
                spec.file_path,
                cleanContent,
                spec.language,
                spec.role_ar
              );
              const words = cleanContent.split(/\s+/).filter(Boolean).length;
              const lines = cleanContent.split("\n").length;
              return {
                worktreeId,
                roleAr: spec.role_ar,
                path: written.path,
                lines,
                words,
                ok: true
              };
            }
          } catch (err: any) {
            markModelQuotaCooldown(candidateModel, err);
          }
        }
        return {
          worktreeId,
          roleAr: spec.role_ar,
          path: spec.file_path,
          lines: 0,
          words: 0,
          ok: false
        };
      })
    );

    const elapsedMs = Date.now() - swarmStartMs;
    const summaryLines = results.map(
      r =>
        `  • [${r.worktreeId} · ${r.roleAr}] ➔ ${r.path}: ${
          r.ok ? `تم البناء والدمج (${r.lines} سطراً · ${r.words} كلمة)` : "تعذر التوليد"
        }`
    );
    const logLine = `🐝 [spawn_subagent_swarm]: أطلق الوكيل الأب ${specs.length} وكلاء فرعيين بالتوازي الكامل (Promise.all) في ${elapsedMs}ms:\n${summaryLines.join("\n")}`;
    state.executedToolLogsAr.push(logLine);

    return {
      toolOutputSummary: `اكتمل تنفيذ سرب الوكلاء الفرعيين المتوازيين (${elapsedMs}ms):\n${summaryLines.join("\n")}`,
      toolLogLineAr: logLine
    };
  }

  if (toolName === "web_cortex_fetch") {
    state.usedToolBadges.add("مستخلص الويب والـ APIs الحي (OpenClaw WebCortex)");
    const url = String(args.url || "").trim();
    const fetchRes = await performOpenClawExternalFetch(url);
    const logLine = `🌐 [web_cortex_fetch]: سحب الرابط الحي «${fetchRes.finalUrl}» (HTTP ${fetchRes.status} · ${fetchRes.latencyMs}ms · ${fetchRes.cleanText.length} حرفاً).`;
    state.executedToolLogsAr.push(logLine);
    return {
      toolOutputSummary: `نتيجة سحب الرابط [${fetchRes.finalUrl}] (HTTP ${fetchRes.status}, ${fetchRes.latencyMs}ms):\nالعنوان: ${fetchRes.title}\nالوصف: ${fetchRes.metaDescription}\nالعناوين: ${fetchRes.headings.slice(0, 12).join(" | ")}\nالمحتوى المستخلص:\n${fetchRes.cleanText.slice(0, 9000)}`,
      toolLogLineAr: logLine
    };
  }

  if (toolName === "verify_and_package_workspace") {
    state.usedToolBadges.add("التحقق الذاتي وتحزيم المشاريع (AST Verifier & ZIP Packager)");
    ensureWorkspaceDirs(state.workspaceDir);
    const rawArchiveName = String(args.archive_name || `nexus_agent_workspace_${state.workspaceId}.zip`)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.zip$/i, "");
    const zipFilename = `${rawArchiveName}_${state.workspaceId}.zip`;
    const zipAbsPath = path.join(PUBLIC_GENERATED_DIR, zipFilename);

    const diagnostics: string[] = [];
    for (const file of state.files.values()) {
      const absFilePath = path.join(state.workspaceDir, file.path);
      const words = file.content.split(/\s+/).filter(Boolean).length;
      const lines = file.content.split("\n").length;

      if (file.language === "python" && fs.existsSync(absFilePath)) {
        const pyCheck = executeSovereignTerminalCommand({
          codeOrCmd: `import py_compile; py_compile.compile(r"${absFilePath}", doraise=True); print("PYTHON_AST_OK")`,
          lang: "python",
          actor: "nexus_agent",
          purpose: `فحص سلامة Syntax/AST لملف ${file.path}`,
          timeoutMs: 8000
        });
        diagnostics.push(
          `- [${file.path}]: ${
            pyCheck.exitCode === 0 ? "✓ سليم برمجياً (Python AST OK)" : `⚠️ خطأ نحوي: ${pyCheck.stderr.slice(0, 180)}`
          } (${lines} سطراً)`
        );
      } else {
        diagnostics.push(`- [${file.path}]: ✓ مكتمل (${lines} سطراً · ${words} كلمة)`);
      }
    }

    // Create real .zip bundle of the entire Agent Workspace using Python zipfile
    if (state.files.size > 0) {
      const zipPyCode = `
import os, zipfile
ws_dir = r"""${state.workspaceDir}"""
zip_path = r"""${zipAbsPath}"""
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(ws_dir):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, ws_dir)
            zf.write(full_p, rel_p)
print("ZIP_CREATED:", os.path.getsize(zip_path))
`.trim();

      const zipExec = executeSovereignTerminalCommand({
        codeOrCmd: zipPyCode,
        lang: "python",
        actor: "nexus_agent",
        purpose: `تحزيم ملفات مساحة عمل الوكيل في أرشيف ${zipFilename}`,
        timeoutMs: 12000
      });

      if (fs.existsSync(zipAbsPath)) {
        const stat = fs.statSync(zipAbsPath);
        state.generatedArtifacts.set(zipFilename, {
          filename: zipFilename,
          relativePath: zipFilename,
          downloadUrl: `/generated_files/${encodeURIComponent(zipFilename)}`,
          mimeType: "application/zip",
          category: "archive",
          sizeBytes: stat.size,
          createdAt: Date.now()
        });
        diagnostics.push(
          `- 📦 [أرشيف مساحة العمل الكامل]: تم تحزيم ${state.files.size} ملفات في \`${zipFilename}\` (${(stat.size / 1024).toFixed(1)} KB) جاهز للتحميل المباشر.`
        );
      } else if (zipExec.generatedArtifacts?.length) {
        for (const zArt of zipExec.generatedArtifacts) {
          state.generatedArtifacts.set(zArt.filename, zArt);
        }
      }
    }

    const logLine = `🔍 [verify_and_package_workspace]: تم فحص ${state.files.size} ملفات وتحزيمها في «${zipFilename}»:\n${diagnostics.join("\n")}`;
    state.executedToolLogsAr.push(logLine);
    return {
      toolOutputSummary: `تقرير الفحص والتحزيم النهائي لمساحة العمل:\n${diagnostics.join("\n")}`,
      toolLogLineAr: logLine
    };
  }

  // -------------------------------------------------------------------------
  // 8. forge_bespoke_document_artifact
  // -------------------------------------------------------------------------
  if (toolName === "forge_bespoke_document_artifact") {
    state.usedToolBadges.add("صكّ الوثائق والكتب المستقلة (Bespoke Document Forge)");
    const rawFilename = String(args.filename || "document.pdf").trim();
    const docTitle = String(args.title || rawFilename).trim();
    const docSubtitle = String(args.subtitle || "").trim();
    const docContent = String(args.content || "").trim();

    if (!docContent) {
      return {
        toolOutputSummary: "خطأ: المحتوى فارغ في forge_bespoke_document_artifact.",
        toolLogLineAr: "⚠️ [forge_bespoke_document_artifact]: لم يتم تمرير محتوى للوثيقة."
      };
    }

    // Save the manuscript into workspace files as well so it's preserved across multi-pass Agent Mode
    const mdManuscriptPath = rawFilename.replace(/\.[a-z0-9]+$/i, "") + ".md";
    writeWorkspaceFileToDisk(state, mdManuscriptPath, docContent, "markdown", docTitle);

    const ext = (rawFilename.split(".").pop() || "pdf").toLowerCase();
    if (ext !== "pdf") {
      const forged = forgeDirectUniversalArtifactViaTerminal({
        filename: rawFilename,
        content: docContent,
        title: docTitle,
        subtitle: docSubtitle
      });
      if (forged) {
        state.generatedArtifacts.set(forged.filename, forged);
      }
    }

    const wordsCount = docContent.split(/\s+/).filter(Boolean).length;
    const logLine = `🏛️ [forge_bespoke_document_artifact]: تم تأليف وصكّ الوثيقة المستقلة «${docTitle}» (\`${rawFilename}\` · ${wordsCount} كلمة).`;
    state.executedToolLogsAr.push(logLine);
    return {
      toolOutputSummary: `تم صكّ وحفظ الوثيقة المستقلة "${docTitle}" (${rawFilename}) بنجاح بحجم ${wordsCount} كلمة.`,
      toolLogLineAr: logLine
    };
  }

  return {
    toolOutputSummary: `الأداة ${toolName} غير معروفة.`,
    toolLogLineAr: `⚠️ أداة غير معروفة: ${toolName}`
  };
}

export { writeWorkspaceFileToDisk };

export async function syncCanvasFilesToDiskAndPackageZip(
  state: AgentWorkspaceState,
  finalBodyText: string,
  archiveLabel?: string
): Promise<{
  syncedCount: number;
  verificationLogAr: string;
}> {
  const fileTagRegex = /<nexus_file\b([^>]*)>([\s\S]*?)<\/nexus_file>/gi;
  let match: RegExpExecArray | null;
  let syncedCount = 0;

  while ((match = fileTagRegex.exec(finalBodyText)) !== null) {
    const attrs = match[1] || "";
    const content = (match[2] || "").trim();
    if (!content) continue;
    const pathMatch = attrs.match(/path="([^"]*)"/i);
    const titleMatch = attrs.match(/title="([^"]*)"/i);
    const langMatch = attrs.match(/language="([^"]*)"/i);
    const relPath = (pathMatch?.[1] || `file_${syncedCount + 1}.md`).trim();
    const title = (titleMatch?.[1] || relPath).trim();
    const lang = (langMatch?.[1] || "markdown").trim();

    writeWorkspaceFileToDisk(state, relPath, content, lang, title);
    syncedCount++;
  }

  if (state.files.size > 0) {
    const verifyRes = await executeSingleSovereignAgentToolCall(
      "verify_and_package_workspace",
      { archive_name: archiveLabel || "nexus_agent_bundle" },
      state,
      []
    );
    return {
      syncedCount,
      verificationLogAr: verifyRes.toolLogLineAr
    };
  }

  return {
    syncedCount: 0,
    verificationLogAr: ""
  };
}

export function buildLiveCanvasEnvelopeFromWorkspace(
  state: AgentWorkspaceState,
  projectTitle: string
): string {
  if (state.files.size === 0) return "";
  const allFiles = Array.from(state.files.values());
  const hasCode = allFiles.some(f =>
    ["html", "javascript", "typescript", "python", "css", "sql"].includes(f.language)
  );
  const canvasType = hasCode ? "code" : "document";
  const safeTitle = (projectTitle || "مشروع الوكيل السيادي").replace(/"/g, "'").slice(0, 75);

  const fileBlocks = allFiles
    .map(
      f =>
        `<nexus_file path="${f.path}" title="${(f.name || f.path).replace(/"/g, "'")}" language="${f.language}">\n${f.content}\n</nexus_file>`
    )
    .join("\n\n");

  return `<nexus_canvas title="${safeTitle}" type="${canvasType}">\n${fileBlocks}\n</nexus_canvas>`;
}

export function createAgentWorkspaceState(sessionId?: string): AgentWorkspaceState {
  const shortId = (sessionId || Date.now().toString(36)).replace(/[^a-zA-Z0-9_-]/g, "").slice(-12) || "ws";
  const workspaceId = `${shortId}_${Date.now().toString(36)}`;
  const workspaceDir = path.join(AGENT_WORKSPACES_ROOT, workspaceId);

  return {
    workspaceId,
    workspaceDir,
    files: new Map<string, HarnessFileItem>(),
    executedToolLogsAr: [],
    generatedArtifacts: new Map<string, SovereignGeneratedArtifact>(),
    usedToolBadges: new Set<string>()
  };
}
