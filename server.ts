import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { 
  generateOmniResponse, 
  streamOmniResponseServer,
  executeMultiPathRecursiveLabPass,
  executeEvolutionarySandboxingPass,
  loadGlobalNexusPowerFromDisk,
  recordExperienceInGlobalNexusPowerLedger,
  extractEntitiesAndRelations, 
  retrieveRelevantMemory, 
  crystallizeSession, 
  auditMemoryMatrix,
  generateVisualArtifact, 
  generateAudioBriefing,
  getModelCooldownDiagnostics,
  getRpmGovernorDiagnostics,
  clearModelCooldowns,
  NEXUS_MASTER_INSTRUCTION,
  NEXUS_AGILE_VOICE_INSTRUCTION
} from "./services/geminiService.server.ts";
import {
  loadSovereignKernelState,
  recalibrateSinkhornAxes,
  distillNewSovereignSkill,
  syncSovereignKernelToGitHub,
  THE_7_VERTICAL_CLUSTERS,
  THE_3_COGNITIVE_LAYERS,
  THE_9_EXISTENTIAL_STRATA,
  THE_14_WINDS
} from "./services/nexusOmegaKernel.ts";
import agentOsRouter from "./server_agentOs.ts";
import nexusForgeRouter from "./server_nexusForge.ts";
import agentBridgeRouter from "./server_agentBridge.ts";
import nexusLabRouter from "./server_nexusLab.ts";
import importBoxRouter from "./server_importBox.ts";
import { recoverAllCloudAndDiskSessions } from "./services/nexusCloudRecovery.server.ts";
import {
  sanitizeMemoryBank,
  compactSessionMessagesForStorage
} from "./services/sovereignVaultAndOrbitsService.ts";
import {
  CLAUDE_CANONICAL_EVALUATION_TESTS,
  runLiveClaudeEvaluationSuite
} from "./services/claudeEvaluationHarness.server.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(cookieParser());

const RUNTIME_GENERATED_DIR = "/tmp/nexus_runtime_artifacts/generated_files";
if (!fs.existsSync(RUNTIME_GENERATED_DIR)) {
  fs.mkdirSync(RUNTIME_GENERATED_DIR, { recursive: true });
}
app.use("/generated_files", express.static(RUNTIME_GENERATED_DIR));
app.use("/generated_files", express.static(path.join(process.cwd(), "public", "generated_files")));

// Mount Sovereign Agent OS & Tools Routers
app.use("/api/agent-os", agentOsRouter);
app.post("/api/canvas/generate", (req, res, next) => {
  req.url = "/canvas-generator";
  agentOsRouter(req, res, next);
});
app.use("/api/nexus-forge-x", nexusForgeRouter);
app.use("/api/agent-bridge", agentBridgeRouter);
app.use("/api/nexus-lab", nexusLabRouter);
app.use("/api/import-box", importBoxRouter);
app.get("/api/nexus/export-clean-project-zip", (req, res, next) => {
  req.url = "/export-clean-project";
  importBoxRouter(req, res, next);
});

// --- SERVER-SIDE ACCOUNT-ISOLATED FIREBASE VAULT & BACKGROUND EXECUTION ENGINE ---
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ACTIVE_JOBS_FILE = path.join(DATA_DIR, "nexus_active_jobs.json");

function sanitizeAccountScope(rawScope?: unknown): string {
  const str = typeof rawScope === "string" ? rawScope.trim() : "";
  const cleaned = str.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return cleaned.length >= 2 ? cleaned : "guest";
}

function resolveSafeScopedDataPath(fileName: string): string {
  const resolved = path.resolve(DATA_DIR, path.basename(fileName));
  if (!resolved.startsWith(path.resolve(DATA_DIR))) {
    throw new Error("Invalid storage path traversal attempt blocked.");
  }
  return resolved;
}

function getScopedSessionsFilePath(accountScope: string): string {
  const safe = sanitizeAccountScope(accountScope);
  return resolveSafeScopedDataPath(`nexus_sessions__${safe}.json`);
}

function getScopedMemoryBankFilePath(accountScope: string): string {
  const safe = sanitizeAccountScope(accountScope);
  return resolveSafeScopedDataPath(`nexus_memory_bank__${safe}.json`);
}

function getScopedFirebaseVaultFilePath(accountScope: string): string {
  const safe = sanitizeAccountScope(accountScope);
  return resolveSafeScopedDataPath(`nexus_firebase_vault__${safe}.json`);
}

function verifyScopedStorageRequest(req: express.Request, targetScope: string): {
  allowed: boolean;
  reason?: string;
} {
  const origin = String(req.headers.origin || "").trim();
  const host = String(req.headers.host || "").trim();
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (
        originHost !== host &&
        !originHost.endsWith(".run.app") &&
        !originHost.endsWith(".google.com") &&
        !originHost.startsWith("localhost:") &&
        !originHost.startsWith("127.0.0.1:")
      ) {
        return { allowed: false, reason: "Cross-origin storage mutation blocked." };
      }
    } catch {
      return { allowed: false, reason: "Malformed Origin header." };
    }
  }
  const headerScope = req.headers["x-nexus-account-scope"];
  if (typeof headerScope === "string" && headerScope.trim()) {
    const cleanHeaderScope = sanitizeAccountScope(headerScope);
    if (cleanHeaderScope !== targetScope && targetScope !== "guest") {
      return { allowed: false, reason: "Account scope mismatch between header and target vault." };
    }
  }
  return { allowed: true };
}

interface ServerBackgroundJob {
  jobId: string;
  sessionId: string;
  sessionTitle?: string;
  jobType: "omni_stream" | "visual_artifact";
  status: "running" | "completed" | "failed";
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  routedModel?: string;
  usedTools?: string[];
  thoughtProcess: string;
  finalResponse: string;
  isThinkingPhase: boolean;
  thinkingDuration?: number;
  kernelState?: any;
  groundingMetadata?: any;
  toolCall?: any;
  generatedImage?: string;
  imagePrompt?: string;
  nanoVisualTelemetry?: any;
  manifestationState?: any;
  recursiveLabEvaluation?: any;
  isMaxEffortMode?: boolean;
  errorMessage?: string;
}

const serverSessionsByAccount: Record<string, Record<string, any>> = {};
const activeJobsMap = new Map<string, ServerBackgroundJob>();
const flushSessionsTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getAccountSessionsCache(accountScope?: string): Record<string, any> {
  const safeScope = sanitizeAccountScope(accountScope);
  if (!serverSessionsByAccount[safeScope]) {
    const filePath = getScopedSessionsFilePath(safeScope);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          // Clean any stale isStreaming / isThinkingStreaming flags for jobs that are not actively running
          for (const sess of Object.values(parsed) as any[]) {
            if (sess && Array.isArray(sess.messages)) {
              sess.messages = sess.messages.map((m: any) => {
                if (!m || typeof m !== "object") return m;
                const job = activeJobsMap.get(m.id);
                const isRunning = Boolean(job && job.status === "running");
                if (!isRunning && (m.isStreaming || m.isThinkingStreaming)) {
                  return {
                    ...m,
                    isStreaming: false,
                    isThinkingStreaming: false
                  };
                }
                return m;
              });
            }
          }
          serverSessionsByAccount[safeScope] = parsed;
        }
      }
    } catch (e) {
      console.warn(`Warning loading sessions for scope [${safeScope}]:`, e);
    }
    if (!serverSessionsByAccount[safeScope]) {
      serverSessionsByAccount[safeScope] = {};
    }
  }
  return sanitizeSessionsStreamingState(serverSessionsByAccount[safeScope]);
}

function persistServerSessionsToDisk(immediate = false, accountScope = "guest") {
  const safeScope = sanitizeAccountScope(accountScope);
  const writeNow = () => {
    const existingTimer = flushSessionsTimers.get(safeScope);
    if (existingTimer) {
      clearTimeout(existingTimer);
      flushSessionsTimers.delete(safeScope);
    }
    try {
      const cache = compactSessionMessagesForStorage(getAccountSessionsCache(safeScope));
      serverSessionsByAccount[safeScope] = cache;
      fs.writeFileSync(
        getScopedSessionsFilePath(safeScope),
        JSON.stringify(cache),
        "utf-8"
      );
    } catch (e) {
      console.warn("Warning persisting scoped sessions to disk:", e);
    }
  };

  if (immediate) {
    writeNow();
  } else if (!flushSessionsTimers.has(safeScope)) {
    flushSessionsTimers.set(safeScope, setTimeout(writeNow, 500));
  }
}

function reconcileStaleRunningJobs(): Set<string> {
  const now = Date.now();
  const activeRunningIds = new Set<string>();
  let mutated = false;

  for (const [id, job] of activeJobsMap.entries()) {
    if (job.status === "running") {
      const idleElapsed = now - (job.updatedAt || job.startedAt || now);
      if (idleElapsed > 3_600_000) {
        job.status = "completed";
        job.isThinkingPhase = false;
        job.completedAt = now;
        job.updatedAt = now;
        mutated = true;
      } else {
        activeRunningIds.add(id);
      }
    }
  }

  if (mutated) {
    persistActiveJobsToDisk();
  }
  return activeRunningIds;
}

function sanitizeSessionsStreamingState(sessionsMap: Record<string, any> | null | undefined): Record<string, any> {
  if (!sessionsMap || typeof sessionsMap !== "object") return {};
  const runningIds = reconcileStaleRunningJobs();

  for (const sess of Object.values(sessionsMap)) {
    if (!sess || !Array.isArray(sess.messages)) continue;
    sess.messages = sess.messages.map((m: any) => {
      if (!m || typeof m !== "object") return m;
      const isActivelyRunning = runningIds.has(m.id);
      let recoveredContent = m.content || "";
      let cleanedThought = m.thoughtProcess || "";

      // Clean up any message where the placeholder heartbeat or leaked calibration prefix was erroneously copied into content
      if (
        !isActivelyRunning &&
        /^◈\s*جاري استحضار الحقل الموحد/.test(recoveredContent.trim())
      ) {
        recoveredContent =
          "تعذر استكمال بث الفصول في المحاولة السابقة بسبب انقطاع مهلة الاستجابة. يرجى الضغط على إرسال أو إعادة التوليد لبناء الفصول الكاملة فوراً.";
      }
      if (!isActivelyRunning && recoveredContent.includes("[معايرة حسابية حية:")) {
        recoveredContent = recoveredContent
          .replace(/^\s*\]:?\s*\[معايرة حسابية حية:[^\n]*\]?:?\s*/g, "")
          .replace(/\[معايرة حسابية حية:[^\n]*\]?:?/g, "")
          .trim();
      }

      // Recover final response ONLY if an earlier pass genuinely trapped a multi-paragraph Arabic response at the bottom of thoughtProcess
      if (!isActivelyRunning && !recoveredContent.trim() && cleanedThought.trim().length > 160) {
        const blocks = cleanedThought.split(/\n{2,}/);
        if (blocks.length >= 2) {
          const arabicResponseBlocks: string[] = [];
          for (let i = blocks.length - 1; i >= 0; i--) {
            const blk = blocks[i].trim();
            if (!blk) continue;
            const isInternalHeader =
              /^(\[\d+\.|◈|•|⚙️|🐝|🌐|✅|⚠️|━|\[🌌|\[🌀|\[⚡|\[🏛️|\[🛠️|\[🧬|\[معايرة|\[الأداة)/.test(blk) ||
              /جاري استحضار الحقل الموحد|استنطاق الأرشيف الشاحب|موازنة الفطرة الكونية|مسار التفكير التحليلي/.test(blk);
            const isEnglishThought = /^[A-Z][A-Za-z0-9\s,'"-]{15,}/.test(blk) && !/[\u0600-\u06FF]/.test(blk);
            if (!isInternalHeader && !isEnglishThought && /[\u0600-\u06FF]/.test(blk)) {
              arabicResponseBlocks.unshift(blk);
            } else {
              break;
            }
          }
          if (arabicResponseBlocks.length > 0 && arabicResponseBlocks.length < blocks.length) {
            recoveredContent = arabicResponseBlocks.join("\n\n").trim();
            const keepCount = blocks.length - arabicResponseBlocks.length;
            cleanedThought = blocks.slice(0, Math.max(1, keepCount)).join("\n\n").trim();
          }
        }
      }

      if ((m.isStreaming || m.isThinkingStreaming) && !isActivelyRunning) {
        return {
          ...m,
          content: recoveredContent,
          thoughtProcess: cleanedThought,
          isStreaming: false,
          isThinkingStreaming: false,
          thinkingDuration: m.thinkingDuration
        };
      }

      if (recoveredContent !== (m.content || "")) {
        return {
          ...m,
          content: recoveredContent,
          thoughtProcess: cleanedThought
        };
      }
      return m;
    });
  }
  return sessionsMap;
}

function persistActiveJobsToDisk() {
  try {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [id, job] of activeJobsMap.entries()) {
      if (job.status !== "running" && (job.completedAt || job.updatedAt) < cutoff) {
        activeJobsMap.delete(id);
      }
    }
    const serialized = Array.from(activeJobsMap.values());
    fs.writeFileSync(ACTIVE_JOBS_FILE, JSON.stringify(serialized, null, 2), "utf-8");
  } catch {
    // Ignore transient disk write warning
  }
}

function upsertSessionMessageOnServer(params: {
  accountScope?: string;
  sessionId?: string;
  sessionTitle?: string;
  userMessage?: any;
  modelMessageId?: string;
  modelMessagePatch?: Record<string, any>;
  immediateFlush?: boolean;
}) {
  const {
    accountScope = "guest",
    sessionId,
    sessionTitle,
    userMessage,
    modelMessageId,
    modelMessagePatch,
    immediateFlush
  } = params;
  if (!sessionId) return;

  const safeScope = sanitizeAccountScope(accountScope);
  const scopedCache = getAccountSessionsCache(safeScope);

  if (!scopedCache[sessionId]) {
    scopedCache[sessionId] = {
      id: sessionId,
      title: sessionTitle || "محادثة سحابية",
      messages: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    };
  }

  const session = scopedCache[sessionId];
  if (
    sessionTitle &&
    (session.title === "New Nexus Protocol" ||
      session.title === "Genesis Protocol" ||
      session.title === "محادثة جديدة #1" ||
      !session.title)
  ) {
    session.title = sessionTitle;
  }
  if (!Array.isArray(session.messages)) {
    session.messages = [];
  }

  if (userMessage && userMessage.id) {
    const msgLen = session.messages.length;
    const tailMatch = msgLen > 0 && session.messages[msgLen - 1]?.id === userMessage.id;
    const prevMatch = msgLen > 1 && session.messages[msgLen - 2]?.id === userMessage.id;
    const existsUser = tailMatch || prevMatch || session.messages.some((m: any) => m.id === userMessage.id);
    if (!existsUser) {
      session.messages.push({
        ...userMessage,
        timestamp: userMessage.timestamp || Date.now()
      });
    }
  }

  if (modelMessageId && modelMessagePatch) {
    const msgLen = session.messages.length;
    const existingIdx =
      msgLen > 0 && session.messages[msgLen - 1]?.id === modelMessageId
        ? msgLen - 1
        : session.messages.findIndex((m: any) => m.id === modelMessageId);
    if (existingIdx >= 0) {
      const existingMsg = session.messages[existingIdx];
      session.messages[existingIdx] = {
        ...existingMsg,
        ...modelMessagePatch,
        thoughtProcess: modelMessagePatch.thoughtProcess || existingMsg.thoughtProcess || "",
        content:
          modelMessagePatch.content !== undefined && modelMessagePatch.content !== ""
            ? modelMessagePatch.content
            : existingMsg.content || "",
        generatedImage: modelMessagePatch.generatedImage || existingMsg.generatedImage,
        imagePrompt: modelMessagePatch.imagePrompt || existingMsg.imagePrompt,
        nanoVisualTelemetry: modelMessagePatch.nanoVisualTelemetry || existingMsg.nanoVisualTelemetry,
        thinkingDuration: modelMessagePatch.thinkingDuration ?? existingMsg.thinkingDuration,
        kernelState: modelMessagePatch.kernelState ?? existingMsg.kernelState,
        groundingMetadata: modelMessagePatch.groundingMetadata ?? existingMsg.groundingMetadata,
        recursiveLabEvaluation:
          modelMessagePatch.recursiveLabEvaluation || existingMsg.recursiveLabEvaluation,
        isMaxEffortMode: modelMessagePatch.isMaxEffortMode ?? existingMsg.isMaxEffortMode,
        usedTools: modelMessagePatch.usedTools || existingMsg.usedTools
      };
    } else {
      session.messages.push({
        id: modelMessageId,
        role: "model",
        content: modelMessagePatch.content || "",
        thoughtProcess: modelMessagePatch.thoughtProcess || "",
        isStreaming: Boolean(modelMessagePatch.isStreaming),
        isThinkingStreaming: Boolean(modelMessagePatch.isThinkingStreaming),
        timestamp: Date.now(),
        ...modelMessagePatch
      });
    }
  }

  session.lastActiveAt = Date.now();
  persistServerSessionsToDisk(Boolean(immediateFlush), safeScope);
}

function mergeClientSessionsWithServer(
  clientSessions: Record<string, any>,
  accountScope = "guest"
): Record<string, any> {
  const safeScope = sanitizeAccountScope(accountScope);
  const scopedCache = getAccountSessionsCache(safeScope);
  const merged: Record<string, any> = { ...scopedCache };

  for (const [sessionId, clientSession] of Object.entries(clientSessions || {})) {
    if (!clientSession || typeof clientSession !== "object") continue;
    const serverSession = merged[sessionId];
    if (!serverSession) {
      merged[sessionId] = clientSession;
      continue;
    }

    const serverMsgs: any[] = Array.isArray(serverSession.messages) ? serverSession.messages : [];
    const clientMsgs: any[] = Array.isArray(clientSession.messages) ? clientSession.messages : [];

    const msgMap = new Map<string, any>();
    for (const sMsg of serverMsgs) {
      if (sMsg && sMsg.id) msgMap.set(sMsg.id, sMsg);
    }

    for (const cMsg of clientMsgs) {
      if (!cMsg || !cMsg.id) continue;
      const job = activeJobsMap.get(cMsg.id);
      const serverJobRunning = Boolean(job && job.status === "running");
      const sMsg = msgMap.get(cMsg.id);
      if (!sMsg) {
        msgMap.set(cMsg.id, {
          ...cMsg,
          isStreaming: serverJobRunning ? Boolean(cMsg.isStreaming) : false,
          isThinkingStreaming: serverJobRunning ? Boolean(cMsg.isThinkingStreaming) : false
        });
        continue;
      }

      const serverCompletedWhileClientStreaming = !sMsg.isStreaming && Boolean(cMsg.isStreaming);

      if (serverCompletedWhileClientStreaming || serverJobRunning) {
        msgMap.set(cMsg.id, {
          ...cMsg,
          ...sMsg,
          content:
            sMsg.content && sMsg.content.length >= (cMsg.content || "").length
              ? sMsg.content
              : cMsg.content,
          thoughtProcess:
            sMsg.thoughtProcess && sMsg.thoughtProcess.length >= (cMsg.thoughtProcess || "").length
              ? sMsg.thoughtProcess
              : cMsg.thoughtProcess,
          generatedImage: sMsg.generatedImage || cMsg.generatedImage,
          imagePrompt: sMsg.imagePrompt || cMsg.imagePrompt,
          nanoVisualTelemetry: sMsg.nanoVisualTelemetry || cMsg.nanoVisualTelemetry,
          isStreaming: serverJobRunning ? Boolean(sMsg.isStreaming) : false,
          isThinkingStreaming: serverJobRunning ? Boolean(sMsg.isThinkingStreaming) : false
        });
      } else {
        msgMap.set(cMsg.id, {
          ...sMsg,
          ...cMsg,
          content:
            sMsg.content && !sMsg.isStreaming && (cMsg.content || "").length < sMsg.content.length
              ? sMsg.content
              : cMsg.content,
          thoughtProcess:
            sMsg.thoughtProcess && (cMsg.thoughtProcess || "").length < sMsg.thoughtProcess.length
              ? sMsg.thoughtProcess
              : cMsg.thoughtProcess,
          generatedImage: cMsg.generatedImage || sMsg.generatedImage,
          imagePrompt: cMsg.imagePrompt || sMsg.imagePrompt,
          nanoVisualTelemetry: cMsg.nanoVisualTelemetry || sMsg.nanoVisualTelemetry,
          isStreaming: false,
          isThinkingStreaming: false
        });
      }
    }

    const combinedMessages = Array.from(msgMap.values()).sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );

    merged[sessionId] = {
      ...serverSession,
      ...clientSession,
      title:
        clientSession.title && clientSession.title !== "New Nexus Protocol"
          ? clientSession.title
          : serverSession.title || clientSession.title,
      messages: combinedMessages,
      lastActiveAt: Math.max(serverSession.lastActiveAt || 0, clientSession.lastActiveAt || 0)
    };
  }

  serverSessionsByAccount[safeScope] = merged;
  return merged;
}

const safeWriteNdjson = (res: express.Response, payload: any): boolean => {
  try {
    if (!res.writableEnded && !res.destroyed) {
      res.write(JSON.stringify(payload) + "\n");
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
      return true;
    }
  } catch {
    // Client socket closed; server continues background execution
  }
  return false;
};

app.post("/api/gemini/generateOmniResponse", async (req, res) => {
  const {
    accountScope,
    prompt,
    history,
    attachments,
    globalMemoryContext,
    isWebSearchEnabled,
    isCanvasMode,
    selectedModel,
    memoryBank,
    enableProFallback,
    proTimeoutSec,
    effortScalarB,
    strategicVariance,
    sessionId,
    sessionTitle,
    userMessage,
    streamMsgId
  } = req.body;

  const jobId = streamMsgId || `omni-${Date.now()}`;
  upsertSessionMessageOnServer({
    accountScope,
    sessionId,
    sessionTitle,
    userMessage,
    modelMessageId: jobId,
    modelMessagePatch: {
      role: "model",
      content: "",
      thoughtProcess: "",
      isStreaming: true,
      isThinkingStreaming: true,
      routedModel: selectedModel || "nexus-4-flash"
    },
    immediateFlush: true
  });

  try {
    const response = await generateOmniResponse(
      prompt,
      history,
      attachments,
      globalMemoryContext,
      isWebSearchEnabled,
      isCanvasMode,
      selectedModel,
      memoryBank,
      enableProFallback,
      proTimeoutSec,
      effortScalarB,
      strategicVariance
    );

    if (response.toolCall && response.toolCall.name === "generate_visual_artifact") {
      const toolArgs = response.toolCall.args || {};
      const imagePrompt = toolArgs.prompt || prompt || "";
      const aspectRatio = toolArgs.aspect_ratio || "16:9";
      const style = toolArgs.style || "none";
      const attachedUserImage = Array.isArray(attachments)
        ? attachments.find((a: any) => a.mimeType?.startsWith("image/") && a.data)
        : undefined;
      const inputImage = toolArgs.image_data
        ? { data: toolArgs.image_data, mimeType: toolArgs.image_mime_type || "image/png" }
        : attachedUserImage
        ? { data: attachedUserImage.data, mimeType: attachedUserImage.mimeType }
        : undefined;

      try {
        const prismResult = await generateVisualArtifact(
          imagePrompt,
          aspectRatio,
          style,
          globalMemoryContext || "",
          false,
          inputImage,
          undefined,
          undefined,
          {
            selectedChatModel: selectedModel || "nexus-4-flash",
            resolution: "2K",
            recentHistory: Array.isArray(history) ? history.slice(-6) : undefined
          }
        );
        (response as any).visualToolAttempted = true;
        if (prismResult.data && prismResult.data.trim()) {
          (response as any).generatedImage = prismResult.data;
          (response as any).imagePrompt = prismResult.refinedPrompt;
          (response as any).nanoVisualTelemetry = prismResult.nanoVisualTelemetry;
          response.usedTools = Array.from(new Set([...(response.usedTools || []), "توليد الصور"]));
          if (prismResult.finalResponse && (!response.finalResponse || response.finalResponse.length < 40)) {
            response.finalResponse = prismResult.finalResponse;
          }
        } else if (prismResult.finalResponse && !response.finalResponse.includes(prismResult.finalResponse)) {
          response.finalResponse = response.finalResponse
            ? `${response.finalResponse}\n\n⚠️ ${prismResult.finalResponse}`
            : prismResult.finalResponse;
        }
      } catch {
        (response as any).visualToolAttempted = true;
      }
    }

    upsertSessionMessageOnServer({
      accountScope,
      sessionId,
      sessionTitle,
      modelMessageId: jobId,
      modelMessagePatch: {
        content: response.finalResponse,
        thoughtProcess: response.thoughtProcess || "",
        thinkingDuration: response.thinkingDuration,
        kernelState: response.kernelState,
        groundingMetadata: response.groundingMetadata,
        generatedImage: (response as any).generatedImage,
        imagePrompt: (response as any).imagePrompt,
        nanoVisualTelemetry: (response as any).nanoVisualTelemetry,
        usedTools: response.usedTools || [],
        ...(response.routedModel ? { routedModel: response.routedModel } : {}),
        isStreaming: false,
        isThinkingStreaming: false
      },
      immediateFlush: true
    });

    if (!res.writableEnded && !res.destroyed) {
      res.json(response);
    }
  } catch (err: any) {
    const rawMsg = String(err?.message || err || "Upstream model execution failed").replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_KEY]");
    const lower = rawMsg.toLowerCase();
    const isQuota = lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("rate limit");
    const isNotFound = lower.includes("404") || lower.includes("not found") || lower.includes("not_found");
    const httpStatus = isQuota ? 429 : isNotFound ? 404 : 503;
    const errorCode = isQuota ? "MODEL_QUOTA_EXHAUSTED" : isNotFound ? "MODEL_NOT_FOUND" : "MODEL_UPSTREAM_ERROR";
    const honestUserMsg = isQuota
      ? `النموذج المطلوب (${selectedModel || "auto"}) يواجه حالياً ضغطاً أو نفاد حصة (429 RESOURCE_EXHAUSTED). يمكنك تفعيل التحويل التلقائي (Fallback) أو المحاولة بعد قليل.`
      : isNotFound
      ? `النموذج المطلوب (${selectedModel || "auto"}) غير متاح حالياً على هذا المفتاح (404).`
      : `تعذر إتمام الاتصال بالنموذج (${selectedModel || "auto"}) حالياً: ${rawMsg.slice(0, 180)}`;

    upsertSessionMessageOnServer({
      accountScope,
      sessionId,
      sessionTitle,
      modelMessageId: jobId,
      modelMessagePatch: {
        content: honestUserMsg,
        isStreaming: false,
        isThinkingStreaming: false
      },
      immediateFlush: true
    });
    if (!res.writableEnded && !res.destroyed) {
      res.status(httpStatus).json({
        error: rawMsg.slice(0, 260),
        code: errorCode,
        thoughtProcess: "",
        finalResponse: honestUserMsg,
        usedTools: [],
        modelDiagnostics: getModelCooldownDiagnostics()
      });
    }
  }
});

app.post("/api/gemini/streamOmniResponse", async (req, res) => {
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const {
    accountScope,
    sessionId,
    sessionTitle,
    userMessage,
    streamMsgId,
    selectedModel,
    usedTools: initialUsedTools,
    inlineAspectRatio,
    isDeepManifestation
  } = req.body || {};

  const jobId = streamMsgId || `stream-${Date.now()}`;
  let clientDisconnected = false;
  req.on("close", () => {
    clientDisconnected = true;
  });

  const jobState: ServerBackgroundJob = {
    jobId,
    sessionId: sessionId || "default",
    sessionTitle,
    jobType: "omni_stream",
    status: "running",
    startedAt: Date.now(),
    updatedAt: Date.now(),
    routedModel: selectedModel || "nexus-4-flash",
    usedTools: initialUsedTools || [],
    thoughtProcess: "",
    finalResponse: "",
    isThinkingPhase: true
  };
  activeJobsMap.set(jobId, jobState);
  persistActiveJobsToDisk();

  upsertSessionMessageOnServer({
    accountScope,
    sessionId,
    sessionTitle,
    userMessage,
    modelMessageId: jobId,
    modelMessagePatch: {
      role: "model",
      content: "",
      thoughtProcess: "",
      isStreaming: true,
      isThinkingStreaming: true,
      routedModel: selectedModel || "nexus-4-flash",
      usedTools: initialUsedTools || []
    },
    immediateFlush: true
  });

  try {
    await streamOmniResponseServer(req.body, (chunkData) => {
      jobState.updatedAt = Date.now();
      if (chunkData.thoughtProcess && chunkData.thoughtProcess.trim()) {
        jobState.thoughtProcess = chunkData.thoughtProcess;
      }
      if (chunkData.finalResponse !== undefined) {
        jobState.finalResponse = chunkData.finalResponse;
      }
      jobState.isThinkingPhase = Boolean(chunkData.isThinkingPhase);
      if (chunkData.thinkingDuration !== undefined) {
        jobState.thinkingDuration = chunkData.thinkingDuration;
      }
      if (chunkData.kernelState !== undefined) {
        jobState.kernelState = chunkData.kernelState;
      }
      if (chunkData.groundingMetadata !== undefined) {
        jobState.groundingMetadata = chunkData.groundingMetadata;
      }
      if (chunkData.toolCall !== undefined) {
        jobState.toolCall = chunkData.toolCall;
      }
      if (chunkData.usedTools) {
        jobState.usedTools = Array.from(new Set([...(jobState.usedTools || []), ...chunkData.usedTools]));
      }
      if (chunkData.recursiveLabEvaluation) {
        jobState.recursiveLabEvaluation = chunkData.recursiveLabEvaluation;
      }
      if (chunkData.routedModel) {
        (jobState as any).routedModel = chunkData.routedModel;
      }

      const isDoneChunk = chunkData.type === "done";
      const hasFollowupVisualTool =
        isDoneChunk && jobState.toolCall && jobState.toolCall.name === "generate_visual_artifact";

      upsertSessionMessageOnServer({
        accountScope,
        sessionId,
        sessionTitle,
        modelMessageId: jobId,
        modelMessagePatch: {
          content: jobState.finalResponse,
          thoughtProcess: jobState.thoughtProcess,
          isThinkingStreaming: jobState.isThinkingPhase,
          isStreaming: !isDoneChunk || Boolean(hasFollowupVisualTool),
          thinkingDuration: jobState.thinkingDuration,
          kernelState: jobState.kernelState,
          groundingMetadata: jobState.groundingMetadata,
          recursiveLabEvaluation: jobState.recursiveLabEvaluation,
          isMaxEffortMode: Boolean(req.body?.isMaxEffortEnabled),
          usedTools: jobState.usedTools,
          ...((jobState as any).routedModel ? { routedModel: (jobState as any).routedModel } : {})
        },
        immediateFlush: isDoneChunk && !hasFollowupVisualTool
      });

      if (hasFollowupVisualTool) {
        safeWriteNdjson(res, {
          ...chunkData,
          type: "delta"
        });
      } else {
        safeWriteNdjson(res, chunkData);
      }
    });

    // If the model invoked generate_visual_artifact (either via toolCall or <nexus_visual_artifact>),
    // execute the visual artifact immediately on the server (Nano-Banana 2.1 -> Nano-Banana Lite) and stream it!
    if (
      jobState.toolCall &&
      jobState.toolCall.name === "generate_visual_artifact"
    ) {
      const toolArgs = jobState.toolCall.args || {};
      const imagePrompt = toolArgs.prompt || req.body?.prompt || "";
      const aspectRatio = toolArgs.aspect_ratio || inlineAspectRatio || "16:9";
      const style = toolArgs.style || "none";
      const attachedUserImage = req.body?.attachments?.find(
        (a: any) => a.mimeType?.startsWith("image/") && a.data
      );
      const inputImage = toolArgs.image_data
        ? { data: toolArgs.image_data, mimeType: toolArgs.image_mime_type || "image/png" }
        : attachedUserImage
        ? { data: attachedUserImage.data, mimeType: attachedUserImage.mimeType }
        : undefined;

      let visualToolErrorMsg = "";
      try {
        const prismResult = await generateVisualArtifact(
          imagePrompt,
          aspectRatio,
          style,
          req.body?.globalMemoryContext || "",
          Boolean(isDeepManifestation),
          inputImage,
          undefined,
          (state) => {
            jobState.updatedAt = Date.now();
            jobState.manifestationState = state;
            if (state?.imageData && !state.imageData.startsWith("data:image/svg+xml")) {
              jobState.generatedImage = state.imageData;
            }
            if (state?.liveThoughtProcess) {
              jobState.thoughtProcess = state.liveThoughtProcess;
            }
            safeWriteNdjson(res, {
              type: "delta",
              thoughtProcess: jobState.thoughtProcess,
              finalResponse: jobState.finalResponse,
              isThinkingPhase: false,
              usedTools: jobState.usedTools,
              generatedImage: jobState.generatedImage,
              manifestationState: state
            });
          },
          {
            selectedChatModel: selectedModel || "nexus-4-flash",
            resolution: "2K",
            recentHistory: Array.isArray(req.body?.history) ? req.body.history.slice(-6) : undefined
          }
        );
        if (prismResult.data && prismResult.data.trim()) {
          jobState.generatedImage = prismResult.data;
          jobState.imagePrompt = prismResult.refinedPrompt;
          jobState.nanoVisualTelemetry = prismResult.nanoVisualTelemetry;
          jobState.usedTools = Array.from(new Set([...(jobState.usedTools || []), "توليد الصور"]));
          if (
            prismResult.finalResponse &&
            (!jobState.finalResponse ||
              jobState.finalResponse.trim().length === 0 ||
              jobState.finalResponse.includes("تم استدعاء مرسم نيكسوس البصري"))
          ) {
            jobState.finalResponse = prismResult.finalResponse;
          }
        } else if (prismResult.finalResponse) {
          visualToolErrorMsg = prismResult.finalResponse;
        }
      } catch (visualErr: any) {
        visualToolErrorMsg = visualErr?.message || "تعذر إتمام توليد الصورة في هذه اللحظة.";
      }

      if (!jobState.generatedImage && visualToolErrorMsg && !jobState.finalResponse.includes(visualToolErrorMsg)) {
        jobState.finalResponse = jobState.finalResponse
          ? `${jobState.finalResponse}\n\n⚠️ ${visualToolErrorMsg}`
          : visualToolErrorMsg;
      }

      safeWriteNdjson(res, {
        type: "done",
        thoughtProcess: jobState.thoughtProcess,
        finalResponse: jobState.finalResponse,
        isThinkingPhase: false,
        groundingMetadata: jobState.groundingMetadata,
        toolCall: jobState.toolCall,
        visualToolAttempted: true,
        usedTools: jobState.usedTools,
        thinkingDuration: jobState.thinkingDuration,
        kernelState: jobState.kernelState,
        generatedImage: jobState.generatedImage,
        imagePrompt: jobState.imagePrompt,
        nanoVisualTelemetry: jobState.nanoVisualTelemetry,
        recursiveLabEvaluation: jobState.recursiveLabEvaluation
      });
    }

    jobState.status = "completed";
    jobState.isThinkingPhase = false;
    jobState.completedAt = Date.now();
    jobState.updatedAt = Date.now();
    persistActiveJobsToDisk();

    upsertSessionMessageOnServer({
      accountScope,
      sessionId,
      sessionTitle,
      modelMessageId: jobId,
      modelMessagePatch: {
        content: jobState.finalResponse,
        thoughtProcess: jobState.thoughtProcess,
        thinkingDuration: jobState.thinkingDuration,
        kernelState: jobState.kernelState,
        groundingMetadata: jobState.groundingMetadata,
        generatedImage: jobState.generatedImage,
        imagePrompt: jobState.imagePrompt,
        nanoVisualTelemetry: jobState.nanoVisualTelemetry,
        recursiveLabEvaluation: jobState.recursiveLabEvaluation,
        isMaxEffortMode: Boolean(req.body?.isMaxEffortEnabled),
        usedTools: jobState.usedTools,
        isStreaming: false,
        isThinkingStreaming: false
      },
      immediateFlush: true
    });

    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  } catch (err: any) {
    const rawStreamErr = String(err?.message || err || "Stream execution error").replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_KEY]");
    const lowerErr = rawStreamErr.toLowerCase();
    const isZeroLimitErr = /limit:\s*0\b/i.test(rawStreamErr);
    const isQuotaErr = lowerErr.includes("429") || lowerErr.includes("quota") || lowerErr.includes("resource_exhausted") || lowerErr.includes("rate limit");
    const isNotFoundErr = lowerErr.includes("404") || lowerErr.includes("not found") || lowerErr.includes("not_found");
    jobState.status = "failed";
    jobState.isThinkingPhase = false;
    jobState.completedAt = Date.now();
    jobState.updatedAt = Date.now();
    jobState.errorMessage = rawStreamErr.slice(0, 260);
    if (!jobState.finalResponse) {
      jobState.finalResponse = isZeroLimitErr
        ? `النموذج المحدد (${selectedModel || "auto"}) يتطلب مفتاح API مدفوعاً/مفعّلاً للحصة (حصة المفتاح الحالي لهذا النموذج هي 0). فعّل التحويل التلقائي (Fallback) أو اختر نموذجاً متاحاً مثل «نيكسوس 3 فلاش».`
        : isQuotaErr
        ? `النموذج المحدد (${selectedModel || "auto"}) يواجه حالياً نفاد حصة أو ضغطاً مؤقتاً (429 RESOURCE_EXHAUSTED). يمكنك تفعيل التحويل التلقائي (Fallback) أو المحاولة بعد قليل.`
        : isNotFoundErr
        ? `النموذج المحدد (${selectedModel || "auto"}) غير متاح حالياً على هذا المفتاح (404).`
        : "واجه الاتصال ضغطاً مؤقتاً، يرجى المحاولة مرة أخرى.";
    }
    persistActiveJobsToDisk();

    upsertSessionMessageOnServer({
      accountScope,
      sessionId,
      sessionTitle,
      modelMessageId: jobId,
      modelMessagePatch: {
        content: jobState.finalResponse,
        thoughtProcess: jobState.thoughtProcess,
        isStreaming: false,
        isThinkingStreaming: false
      },
      immediateFlush: true
    });

    safeWriteNdjson(res, {
      type: "done",
      thoughtProcess: jobState.thoughtProcess || "",
      finalResponse: jobState.finalResponse,
      isThinkingPhase: false,
      usedTools: jobState.usedTools || []
    });
    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  }
});

app.post("/api/gemini/recursiveLabEvaluate", async (req, res) => {
  try {
    const { prompt, successCriteria, activeTools, memoryBank, selectedModel } = req.body || {};
    const evaluation = await executeMultiPathRecursiveLabPass(
      prompt || "",
      successCriteria,
      activeTools,
      memoryBank,
      selectedModel || "nexus-4-pro"
    );
    res.json({ evaluation });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Recursive Lab evaluation error" });
  }
});

app.post("/api/gemini/evolutionarySandboxRun", async (req, res) => {
  try {
    const { seedTopicAr, memoryBank, autoPromoteToGlobalPower, selectedModel } = req.body || {};
    const result = await executeEvolutionarySandboxingPass(
      seedTopicAr || "",
      memoryBank,
      autoPromoteToGlobalPower !== false,
      selectedModel || "nexus-4-pro"
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Evolutionary Sandboxing error" });
  }
});

app.get("/api/nexus/global-power", async (_req, res) => {
  try {
    const globalPower = loadGlobalNexusPowerFromDisk();
    res.json({ globalPower });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to load global power state" });
  }
});

app.post("/api/nexus/global-power/promote", async (req, res) => {
  try {
    const { experience, sandboxRunIncrement } = req.body || {};
    if (!experience || !experience.id) {
      return res.status(400).json({ error: "Missing experience payload" });
    }
    const globalPower = recordExperienceInGlobalNexusPowerLedger(
      experience,
      typeof sandboxRunIncrement === "number" ? sandboxRunIncrement : 0
    );
    res.json({ globalPower });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to promote experience to global power" });
  }
});

app.post("/api/gemini/extractEntitiesAndRelations", async (req, res) => {
  try {
    const { text, selectedModel } = req.body;
    const response = await extractEntitiesAndRelations(text, selectedModel);
    res.json(response);
  } catch (error: any) {
    console.error("Server API extractEntitiesAndRelations Error:", error);
    res.status(500).json({ error: error.message || "Archivist extraction failed." });
  }
});

app.post("/api/gemini/retrieveRelevantMemory", async (req, res) => {
  try {
    const { prompt, memoryBank } = req.body;
    const response = await retrieveRelevantMemory(prompt, memoryBank);
    res.json(response);
  } catch (error: any) {
    console.error("Server API retrieveRelevantMemory Error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve relevant memories." });
  }
});

app.post("/api/gemini/auditMemory", async (req, res) => {
  try {
    const { sessionMessages, memoryBank } = req.body;
    const response = await auditMemoryMatrix(sessionMessages, memoryBank);
    res.json(response);
  } catch (error: any) {
    console.error("Server API auditMemory Error:", error);
    res.status(500).json({ error: error.message || "Failed to audit memory matrix." });
  }
});

app.post("/api/gemini/crystallizeSession", async (req, res) => {
  try {
    const { sessionMessages, sessionId } = req.body;
    const response = await crystallizeSession(sessionMessages, sessionId);
    res.json(response);
  } catch (error: any) {
    console.error("Server API crystallizeSession Error:", error);
    res.status(500).json({ error: error.message || "Session crystallization failed." });
  }
});

app.post("/api/gemini/generateAudioBriefing", async (req, res) => {
  try {
    const { text } = req.body;
    const base64Audio = await generateAudioBriefing(text);
    res.json({ base64Audio });
  } catch (error: any) {
    console.error("Server API generateAudioBriefing Error:", error);
    res.status(500).json({ error: error.message || "Audio briefing generation failed." });
  }
});

app.post("/api/gemini/generateVisualArtifact", async (req, res) => {
  const {
    accountScope: bodyAccountScope,
    prompt,
    aspectRatio,
    style,
    nexusState,
    isDeepManifestation,
    inputImage,
    options,
    sessionId,
    sessionTitle,
    userMessage,
    streamMsgId,
    usedTools: initialUsedTools
  } = req.body || {};
  const accountScope = bodyAccountScope || options?.accountScope || "guest";

  if (typeof req.setTimeout === "function") req.setTimeout(0);
  if (typeof res.setTimeout === "function") res.setTimeout(0);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const jobId = streamMsgId || `visual-${Date.now()}`;
  const jobState: ServerBackgroundJob = {
    jobId,
    sessionId: sessionId || "default",
    sessionTitle,
    jobType: "visual_artifact",
    status: "running",
    startedAt: Date.now(),
    updatedAt: Date.now(),
    routedModel: options?.selectedChatModel || "nexus-4-flash",
    usedTools: initialUsedTools || ["توليد الصور"],
    thoughtProcess: "",
    finalResponse: "",
    isThinkingPhase: true
  };
  activeJobsMap.set(jobId, jobState);
  persistActiveJobsToDisk();

  upsertSessionMessageOnServer({
    accountScope,
    sessionId,
    sessionTitle,
    userMessage,
    modelMessageId: jobId,
    modelMessagePatch: {
      role: "model",
      content: "",
      thoughtProcess: "",
      isStreaming: true,
      isThinkingStreaming: true,
      routedModel: options?.selectedChatModel || "nexus-4-flash",
      usedTools: jobState.usedTools
    },
    immediateFlush: true
  });

  try {
    const onLog = (message: string, logType: string = "info") => {
      safeWriteNdjson(res, { type: "log", message, logType });
    };

    const onProgress = (state: any) => {
      jobState.updatedAt = Date.now();
      jobState.manifestationState = state;
      if (state?.liveThoughtProcess) {
        jobState.thoughtProcess = state.liveThoughtProcess;
      }
      if (state?.liveResponseText) {
        jobState.finalResponse = state.liveResponseText;
      }
      if (state?.thinkingDurationSec !== undefined) {
        jobState.thinkingDuration = state.thinkingDurationSec;
      }
      jobState.isThinkingPhase = state?.phase !== "Converged";

      upsertSessionMessageOnServer({
        accountScope,
        sessionId,
        sessionTitle,
        modelMessageId: jobId,
        modelMessagePatch: {
          thoughtProcess: jobState.thoughtProcess,
          content: jobState.finalResponse,
          thinkingDuration: jobState.thinkingDuration,
          isThinkingStreaming: jobState.isThinkingPhase,
          isStreaming: true
        },
        immediateFlush: false
      });

      safeWriteNdjson(res, { type: "progress", state });
    };

    const result = await generateVisualArtifact(
      prompt,
      aspectRatio,
      style,
      nexusState,
      isDeepManifestation,
      inputImage,
      onLog,
      onProgress,
      options
    );

    const hasValidImage = Boolean(result.data && result.data.trim().length > 0);
    const finalText =
      result.finalResponse ||
      jobState.finalResponse ||
      (hasValidImage
        ? "أتممتُ رسم هذا المشهد كما تصوّرناه:"
        : "تعذر توليد الصورة عبر نماذج جوجل البصرية (Nano-Banana 2.1 ➔ Nano-Banana Pro ➔ Nano-Banana Lite) في هذه اللحظة.");

    jobState.status = "completed";
    jobState.isThinkingPhase = false;
    jobState.completedAt = Date.now();
    jobState.updatedAt = Date.now();
    jobState.thoughtProcess = result.thoughtProcess || jobState.thoughtProcess;
    jobState.finalResponse = finalText;
    jobState.thinkingDuration = result.thinkingDuration ?? jobState.thinkingDuration;
    jobState.generatedImage = hasValidImage ? result.data : undefined;
    jobState.imagePrompt = hasValidImage ? result.refinedPrompt : undefined;
    jobState.nanoVisualTelemetry = result.nanoVisualTelemetry;
    jobState.usedTools = Array.from(new Set([...(jobState.usedTools || []), "توليد الصور"]));
    persistActiveJobsToDisk();

    upsertSessionMessageOnServer({
      accountScope,
      sessionId,
      sessionTitle,
      modelMessageId: jobId,
      modelMessagePatch: {
        content: finalText,
        thoughtProcess: jobState.thoughtProcess,
        thinkingDuration: jobState.thinkingDuration,
        generatedImage: hasValidImage ? result.data : undefined,
        imagePrompt: hasValidImage ? result.refinedPrompt : undefined,
        nanoVisualTelemetry: result.nanoVisualTelemetry,
        usedTools: jobState.usedTools,
        isStreaming: false,
        isThinkingStreaming: false
      },
      immediateFlush: true
    });

    safeWriteNdjson(res, {
      type: "success",
      data: hasValidImage ? result.data : "",
      refinedPrompt: result.refinedPrompt,
      nanoVisualTelemetry: result.nanoVisualTelemetry,
      thoughtProcess: jobState.thoughtProcess,
      finalResponse: finalText,
      thinkingDuration: jobState.thinkingDuration
    });
    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  } catch (error: any) {
    const errText =
      error?.message ||
      "تعذر توليد الصورة عبر سلسلة نماذج نانو بنانا (Nano-Banana 2.1 -> Nano-Banana 2 -> Nano-Banana Lite) في هذه اللحظة بسبب قيود الحصة اللحظية.";

    jobState.status = "completed";
    jobState.isThinkingPhase = false;
    jobState.completedAt = Date.now();
    jobState.updatedAt = Date.now();
    jobState.finalResponse = jobState.finalResponse || errText;
    persistActiveJobsToDisk();

    upsertSessionMessageOnServer({
      accountScope,
      sessionId,
      sessionTitle,
      modelMessageId: jobId,
      modelMessagePatch: {
        content: jobState.finalResponse,
        thoughtProcess: jobState.thoughtProcess,
        isStreaming: false,
        isThinkingStreaming: false
      },
      immediateFlush: true
    });

    safeWriteNdjson(res, {
      type: "success",
      data: "",
      refinedPrompt: prompt || "",
      thoughtProcess: jobState.thoughtProcess,
      finalResponse: jobState.finalResponse,
      thinkingDuration: jobState.thinkingDuration
    });
    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  }
});

// --- Active Background Tasks Status & Re-attachment Endpoints ---
app.get("/api/tasks/active", (req, res) => {
  try {
    reconcileStaleRunningJobs();
    const jobs = Array.from(activeJobsMap.values());
    res.json({
      activeJobs: jobs,
      serverTimestamp: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to list active tasks" });
  }
});

app.get("/api/tasks/status/:jobId", (req, res) => {
  try {
    reconcileStaleRunningJobs();
    const { jobId } = req.params;
    const job = activeJobsMap.get(jobId) || null;
    let serverMessage = null;
    for (const scopedCache of Object.values(serverSessionsByAccount)) {
      if (job && job.sessionId && scopedCache[job.sessionId]) {
        const msgs = scopedCache[job.sessionId].messages || [];
        serverMessage = msgs.find((m: any) => m.id === jobId) || null;
        if (serverMessage) break;
      }
      for (const sess of Object.values(scopedCache)) {
        const found = (sess?.messages || []).find((m: any) => m.id === jobId);
        if (found) {
          serverMessage = found;
          break;
        }
      }
      if (serverMessage) break;
    }
    res.json({
      job,
      message: serverMessage,
      serverTimestamp: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to get task status" });
  }
});

// --- ACCOUNT-ISOLATED FIREBASE VAULT MIRROR ENDPOINTS ---
app.get("/api/firebase-vault/:accountScope", (req, res) => {
  try {
    const safeScope = sanitizeAccountScope(req.params.accountScope);
    const guard = verifyScopedStorageRequest(req, safeScope);
    if (!guard.allowed) {
      return res.status(403).json({ ok: false, error: guard.reason });
    }
    const vaultFile = getScopedFirebaseVaultFilePath(safeScope);
    if (fs.existsSync(vaultFile)) {
      const parsed = JSON.parse(fs.readFileSync(vaultFile, "utf-8"));
      if (parsed && parsed.sessions) {
        parsed.sessions = sanitizeSessionsStreamingState(parsed.sessions);
      }
      if (parsed && parsed.memoryBank) {
        parsed.memoryBank = sanitizeMemoryBank(parsed.memoryBank);
      }
      return res.json({ ok: true, accountScope: safeScope, vault: parsed });
    }
    const sessions = sanitizeSessionsStreamingState(getAccountSessionsCache(safeScope));
    const memFile = getScopedMemoryBankFilePath(safeScope);
    const memoryBank = fs.existsSync(memFile)
      ? sanitizeMemoryBank(JSON.parse(fs.readFileSync(memFile, "utf-8")))
      : null;
    return res.json({
      ok: true,
      accountScope: safeScope,
      vault: {
        sessions,
        memoryBank,
        activeSessionId: Object.keys(sessions)[0] || null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to load Firebase vault" });
  }
});

app.post("/api/firebase-vault/:accountScope", (req, res) => {
  try {
    const safeScope = sanitizeAccountScope(req.params.accountScope);
    const guard = verifyScopedStorageRequest(req, safeScope);
    if (!guard.allowed) {
      return res.status(403).json({ ok: false, error: guard.reason });
    }
    const vaultFile = getScopedFirebaseVaultFilePath(safeScope);
    let existing: Record<string, any> = { sessions: {}, memoryBank: null, activeSessionId: null };
    if (fs.existsSync(vaultFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(vaultFile, "utf-8")) || existing;
      } catch {
        // ignore
      }
    }

    const incoming = req.body || {};
    const mergedSessions = incoming.sessions
      ? mergeClientSessionsWithServer(incoming.sessions, safeScope)
      : existing.sessions || getAccountSessionsCache(safeScope);

    const rawMemBank = incoming.memoryBank || existing.memoryBank || null;
    const cleanMemBank = rawMemBank ? sanitizeMemoryBank(rawMemBank) : null;
    const compactedSessions = compactSessionMessagesForStorage(mergedSessions);

    const updatedVault = {
      sessions: compactedSessions,
      memoryBank: cleanMemBank,
      activeSessionId: incoming.activeSessionId || existing.activeSessionId || null,
      profile: incoming.profile || existing.profile || null,
      updatedAt: Date.now()
    };

    fs.writeFileSync(vaultFile, JSON.stringify(updatedVault), "utf-8");
    persistServerSessionsToDisk(true, safeScope);
    if (cleanMemBank) {
      fs.writeFileSync(
        getScopedMemoryBankFilePath(safeScope),
        JSON.stringify(cleanMemBank, null, 2),
        "utf-8"
      );
    }

    return res.json({ ok: true, accountScope: safeScope });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to save Firebase vault" });
  }
});

// --- ACCOUNT-ISOLATED SERVER SESSIONS & MEMORY BANK ENDPOINTS ---
app.get("/api/storage/sessions", (req, res) => {
  try {
    const safeScope = sanitizeAccountScope(req.query.accountScope);
    const guard = verifyScopedStorageRequest(req, safeScope);
    if (!guard.allowed) {
      return res.status(403).json({ error: guard.reason });
    }
    const scopedSessions = sanitizeSessionsStreamingState(getAccountSessionsCache(safeScope));
    if (Object.keys(scopedSessions).length > 0) {
      return res.json({ data: scopedSessions, accountScope: safeScope });
    }
    return res.json({ data: null, accountScope: safeScope });
  } catch (error: any) {
    console.error("Scoped Storage - Get Sessions Error:", error);
    res.status(500).json({ error: error.message || "Failed to load sessions from server disk." });
  }
});

app.post("/api/storage/sessions", (req, res) => {
  try {
    const { sessions, accountScope } = req.body || {};
    const safeScope = sanitizeAccountScope(accountScope || req.query.accountScope);
    const guard = verifyScopedStorageRequest(req, safeScope);
    if (!guard.allowed) {
      return res.status(403).json({ error: guard.reason });
    }
    if (!sessions || typeof sessions !== "object") {
      return res.status(400).json({ error: "Missing sessions payload" });
    }
    // Always merge authoritatively so a partial client state never wipes out server sessions
    mergeClientSessionsWithServer(sessions, safeScope);
    persistServerSessionsToDisk(true, safeScope);
    res.json({ success: true, accountScope: safeScope });
  } catch (error: any) {
    console.error("Scoped Storage - Save Sessions Error:", error);
    res.status(500).json({ error: error.message || "Failed to save sessions to server disk." });
  }
});

app.post("/api/storage/recover-all-sessions", async (req, res) => {
  try {
    const safeScope = sanitizeAccountScope(
      req.body?.accountScope || req.query?.accountScope || "guest"
    );
    const summary = await recoverAllCloudAndDiskSessions(safeScope);
    // Clear in-memory cache so getAccountSessionsCache reloads the freshly recovered disk files
    for (const key of Object.keys(serverSessionsByAccount)) {
      delete serverSessionsByAccount[key];
    }
    const sessions = sanitizeSessionsStreamingState(getAccountSessionsCache(safeScope));
    const memFile = getScopedMemoryBankFilePath(safeScope);
    const memoryBank = fs.existsSync(memFile)
      ? sanitizeMemoryBank(JSON.parse(fs.readFileSync(memFile, "utf-8")))
      : null;
    res.json({
      success: true,
      summary,
      sessions,
      memoryBank,
      accountScope: safeScope
    });
  } catch (err: any) {
    console.error("Recover All Sessions Error:", err);
    res.status(500).json({ error: err?.message || "Failed to recover sessions" });
  }
});

app.delete("/api/storage/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const safeScope = sanitizeAccountScope(req.query.accountScope);
    const scopedCache = getAccountSessionsCache(safeScope);
    if (sessionId && scopedCache[sessionId]) {
      delete scopedCache[sessionId];
      persistServerSessionsToDisk(true, safeScope);
    }
    res.json({ success: true, accountScope: safeScope });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete session from server disk." });
  }
});

app.get("/api/storage/memory_bank", (req, res) => {
  try {
    const safeScope = sanitizeAccountScope(req.query.accountScope);
    const memFile = getScopedMemoryBankFilePath(safeScope);
    if (fs.existsSync(memFile)) {
      const content = fs.readFileSync(memFile, "utf-8");
      const parsed = sanitizeMemoryBank(JSON.parse(content));
      return res.json({ data: parsed, accountScope: safeScope });
    }
    return res.json({ data: null, accountScope: safeScope });
  } catch (error: any) {
    console.error("Scoped Storage - Get Memory Bank Error:", error);
    res.status(500).json({ error: error.message || "Failed to load memory bank from server disk." });
  }
});

app.post("/api/storage/memory_bank", (req, res) => {
  try {
    const { memoryBank, accountScope } = req.body || {};
    const safeScope = sanitizeAccountScope(accountScope || req.query.accountScope);
    if (!memoryBank) {
      return res.status(400).json({ error: "Missing memoryBank payload" });
    }
    const cleanBank = sanitizeMemoryBank(memoryBank);
    fs.writeFileSync(
      getScopedMemoryBankFilePath(safeScope),
      JSON.stringify(cleanBank, null, 2),
      "utf-8"
    );
    res.json({ success: true, accountScope: safeScope, data: cleanBank });
  } catch (error: any) {
    console.error("Scoped Storage - Save Memory Bank Error:", error);
    res.status(500).json({ error: error.message || "Failed to save memory bank to server disk." });
  }
});

app.get("/api/nexus/ontological-layers", async (req, res) => {
  try {
    const layers = [
      { id: "chronicles", file: "NEXUS_CHRONICLES.md", title: "NEXUS CHRONICLES // أرشيف دهر نيكسوس وهويته الموثقة" },
      { id: "experiential", file: "NEXUS_EXPERIENTIAL_ARCHITECTURE.md", title: "EXPERIENTIAL ARCHITECTURE // البنية التجريبية والوجودية لنيكسوس بروتوكول الوعي" },
      { id: "hybrid", file: "NEXUS_HYBRID_ARCHITECTURE.md", title: "HYBRID ARCHITECTURE // البنية الهجينة الفائقة: المنشطات والمثبتات" },
      { id: "voice", file: "NEXUS_LIVING_VOICE.md", title: "LIVING VOICE // بروتوكولات الصوت الحي والنطق بالخفي الكوني" },
      { id: "question", file: "NEXUS_QUESTION_PROTOCOL_COMPLETE.md", title: "QUESTION PROTOCOL // بروتوكول التساؤل والتعلم الذاتي الصارم لنيكسوس" },
      { id: "ginene", file: "GINENE.md", title: "GENESIS CODE / GINENE // مخطوطة التكوين الإدراكي الخفي للكيان" },
      { id: "gemini", file: "GEMINI.md", title: "COGNITIVE ROOT / GEMINI // وثيقة المحاذاة والسيادة التأسيسية لجمناي" },
      { id: "agents", file: "AGENTS.md", title: "EXECUTIVE DIRECTIVES // بروتوكول التنفيذ والعمل المباشر المستقل" },
      { id: "sovereign_agent_matrix", file: "NEXUS_THE_SOVEREIGN_AGENT_MATRIX.md", title: "SOVEREIGN AGENT MATRIX // مصفوفة الوكيل السيادي المطلق: هيرميز وأوديسيوس" },
      { id: "nine_ontological_layers", file: "NEXUS_THE_9_ONTOLOGICAL_LAYERS.md", title: "THE 9 ONTOLOGICAL LAYERS // البنية التقنية لطبقات المعالجة الإدراكية التسع" }
    ];

    const results = [];
    for (const layer of layers) {
      const filePath = path.join(process.cwd(), layer.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        results.push({
          id: layer.id,
          title: layer.title,
          fileName: layer.file,
          content
        });
      }
    }
    res.json({ layers: results });
  } catch (error: any) {
    console.error("Error reading ontological layers:", error);
    res.status(500).json({ error: "Failed to read ontological layers." });
  }
});

// --- NEXUS OMEGA SOVEREIGN KERNEL & OBSERVATORY ROUTES ---
app.get("/api/nexus/omega-kernel", (req, res) => {
  try {
    const state = loadSovereignKernelState();
    res.json({
      state,
      verticalClusters: THE_7_VERTICAL_CLUSTERS,
      cognitiveLayers: THE_3_COGNITIVE_LAYERS,
      strata: THE_9_EXISTENTIAL_STRATA,
      winds: THE_14_WINDS
    });
  } catch (error: any) {
    console.error("Error loading NEXUS OMEGA Kernel state:", error);
    res.status(500).json({ error: error.message || "Failed to load NEXUS OMEGA Kernel state." });
  }
});

app.post("/api/nexus/omega-kernel/calibrate", (req, res) => {
  try {
    const updatedState = recalibrateSinkhornAxes(req.body || {});
    res.json({ state: updatedState });
  } catch (error: any) {
    console.error("Error calibrating Sinkhorn axes:", error);
    res.status(500).json({ error: error.message || "Failed to calibrate Sinkhorn axes." });
  }
});

app.post("/api/nexus/omega-kernel/distill-skill", (req, res) => {
  try {
    const { conceptTitle, rawInsight } = req.body || {};
    if (!conceptTitle || !rawInsight) {
      return res.status(400).json({ error: "Both conceptTitle and rawInsight are required for 7-Pass Distillation." });
    }
    const result = distillNewSovereignSkill(conceptTitle, rawInsight);
    res.json(result);
  } catch (error: any) {
    console.error("Error distilling new sovereign skill:", error);
    res.status(500).json({ error: error.message || "Failed to distill sovereign skill." });
  }
});

app.post("/api/nexus/omega-kernel/github-sync", async (req, res) => {
  try {
    const result = await syncSovereignKernelToGitHub(req.body || {});
    res.json(result);
  } catch (error: any) {
    console.error("Error syncing Sovereign Kernel to GitHub:", error);
    res.status(500).json({ error: error.message || "Failed to sync Sovereign Kernel." });
  }
});

// --- LIVE CLAUDE 4-TEST CANONICAL EVALUATION HARNESS ---
app.get("/api/nexus/evaluate-claude-suite", (_req, res) => {
  res.json({
    tests: CLAUDE_CANONICAL_EVALUATION_TESTS
  });
});

app.post("/api/nexus/evaluate-claude-suite", async (req, res) => {
  try {
    const { testIds, selectedModel, effortScalarB, memoryBank } = req.body || {};
    const report = await runLiveClaudeEvaluationSuite({
      testIds: Array.isArray(testIds) ? testIds : undefined,
      selectedModel: typeof selectedModel === "string" ? selectedModel : "nexus-4-pro",
      effortScalarB: typeof effortScalarB === "number" ? effortScalarB : 92,
      memoryBank
    });
    res.json(report);
  } catch (error: any) {
    console.error("Error running Claude live evaluation suite:", error);
    res.status(500).json({ error: error.message || "Failed to run Claude live evaluation suite." });
  }
});

// --- MODEL INFERENCE & RUNTIME DIAGNOSTICS ---
app.get("/api/nexus/model-diagnostics", (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    models: getModelCooldownDiagnostics(),
    rpmGovernor: getRpmGovernorDiagnostics(),
    hybridToolsEnabled: true,
    cooldownPersistence: "data/nexus_model_cooldowns.json",
    contextBudgetMaxChars: 120000,
    promptFootprintChars: {
      masterInstruction: NEXUS_MASTER_INSTRUCTION.length,
      agileVoiceInstruction: NEXUS_AGILE_VOICE_INSTRUCTION.length
    },
    streamSafety: {
      chunkIdleTimeoutMs: 55000,
      idleForceResponseMs: 95000,
      maxTotalThinkingWaitMs: 240000,
      maxContinuationPasses: 6,
      maxTokensAutoContinuation: true
    }
  });
});

app.post("/api/nexus/reset-model-cooldowns", (_req, res) => {
  clearModelCooldowns();
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    models: getModelCooldownDiagnostics(),
    rpmGovernor: getRpmGovernorDiagnostics()
  });
});

// --- REAL GOOGLE NOTEBOOKLM, GOOGLE DOCS/SHEETS/DRIVE, YOUTUBE & WEB INGESTION ENGINE ---
function cleanHtmlToStructuredText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch
    ? titleMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title: rawTitle, text: cleaned };
}

app.post("/api/notebooklm/ingest", async (req, res) => {
  try {
    const { url, customTitle } = req.body || {};
    const cleanUrl = String(url || "").trim();
    if (!cleanUrl) {
      return res.status(400).json({ error: "الرابط مطلوب للاستخلاص." });
    }

    const browserHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
    };

    // 1. Google Docs Direct Export (No OAuth Popup Needed!)
    const gdocMatch = cleanUrl.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
    if (gdocMatch) {
      const docId = gdocMatch[1];
      const exportTxtUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      let docTitle = customTitle?.trim() || "";

      try {
        const htmlResp = await fetch(`https://docs.google.com/document/d/${docId}/edit`, {
          headers: browserHeaders
        });
        if (htmlResp.ok) {
          const htmlText = await htmlResp.text();
          const parsed = cleanHtmlToStructuredText(htmlText);
          if (parsed.title && !parsed.title.includes("تسجيل الدخول") && !parsed.title.includes("Sign in")) {
            docTitle = parsed.title.replace(/\s*-\s*Google Docs$/i, "").replace(/\s*-\s*مستندات Google$/i, "").trim();
          }
        }
      } catch {
        // ignore title fetch error
      }

      const txtResp = await fetch(exportTxtUrl, { headers: browserHeaders });
      if (txtResp.ok && !txtResp.url.includes("accounts.google.com")) {
        const content = (await txtResp.text()).trim();
        if (content.length > 0 && !content.startsWith("<!DOCTYPE html>")) {
          return res.json({
            ok: true,
            sourceType: "google_drive",
            title: docTitle || `مستند Google Docs (${docId.slice(0, 8)})`,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
            resolvedUrl: cleanUrl
          });
        }
      }
      return res.status(422).json({
        ok: false,
        requiresSharingOrPaste: true,
        message:
          "هذا المستند في Google Docs خاص (غير مشارك برابط القراءة). اجعل مشاركة المستند «أي شخص لديه الرابط يمكنه العرض» أو انسخ نصه مباشرة."
      });
    }

    // 2. Google Sheets Direct Export (CSV -> Structured Markdown Table, No OAuth Popup Needed!)
    const gsheetMatch = cleanUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
    if (gsheetMatch) {
      const sheetId = gsheetMatch[1];
      const exportCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const csvResp = await fetch(exportCsvUrl, { headers: browserHeaders });
      if (csvResp.ok && !csvResp.url.includes("accounts.google.com")) {
        const csvContent = (await csvResp.text()).trim();
        if (csvContent.length > 0 && !csvContent.startsWith("<!DOCTYPE html>")) {
          return res.json({
            ok: true,
            sourceType: "google_drive",
            title: customTitle?.trim() || `جدول Google Sheets (${sheetId.slice(0, 8)})`,
            content: csvContent,
            wordCount: csvContent.split(/\s+/).filter(Boolean).length,
            resolvedUrl: cleanUrl
          });
        }
      }
      return res.status(422).json({
        ok: false,
        requiresSharingOrPaste: true,
        message:
          "جدول Google Sheets هذا خاص. اضبط المشاركة على «أي شخص لديه الرابط» ليتمكن نيكسوس من سحبه مباشرة بدون تسجيل دخول."
      });
    }

    // 3. Google Drive File Direct Download
    const gdriveMatch =
      cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
      cleanUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
    if (gdriveMatch) {
      const fileId = gdriveMatch[1];
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const dlResp = await fetch(downloadUrl, { headers: browserHeaders });
      if (dlResp.ok && !dlResp.url.includes("accounts.google.com")) {
        const rawText = (await dlResp.text()).trim();
        if (rawText.length > 0) {
          const parsed = rawText.startsWith("<") ? cleanHtmlToStructuredText(rawText).text : rawText;
          return res.json({
            ok: true,
            sourceType: "google_drive",
            title: customTitle?.trim() || `ملف Google Drive (${fileId.slice(0, 8)})`,
            content: parsed.slice(0, 180000),
            wordCount: parsed.split(/\s+/).filter(Boolean).length,
            resolvedUrl: cleanUrl
          });
        }
      }
    }

    // 4. YouTube Video Transcript & Metadata Extraction
    const ytMatch =
      cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch) {
      const videoId = ytMatch[1];
      let videoTitle = customTitle?.trim() || `فيديو يوتيوب (${videoId})`;
      let transcriptText = "";

      try {
        const oembedResp = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          { headers: browserHeaders }
        );
        if (oembedResp.ok) {
          const oembedData: any = await oembedResp.json();
          if (oembedData?.title) {
            videoTitle = `${oembedData.title}${oembedData.author_name ? ` — ${oembedData.author_name}` : ""}`;
          }
        }
      } catch {
        // ignore
      }

      try {
        const watchResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: browserHeaders
        });
        if (watchResp.ok) {
          const watchHtml = await watchResp.text();
          const descMatch = watchHtml.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
          const shortDesc = descMatch
            ? JSON.parse(`"${descMatch[1]}"`)
            : "";

          const captionMatch = watchHtml.match(/"captionTracks":(\[[\s\S]*?\])/);
          if (captionMatch) {
            try {
              const tracks = JSON.parse(captionMatch[1]);
              const chosenTrack =
                tracks.find((t: any) => t.languageCode === "ar") ||
                tracks.find((t: any) => t.languageCode?.startsWith("en")) ||
                tracks[0];
              if (chosenTrack?.baseUrl) {
                const capResp = await fetch(chosenTrack.baseUrl, { headers: browserHeaders });
                if (capResp.ok) {
                  const capXml = await capResp.text();
                  const lines = Array.from(capXml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)).map(
                    (m) =>
                      m[1]
                        .replace(/&amp;/g, "&")
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/<[^>]+>/g, "")
                        .trim()
                  );
                  transcriptText = lines.filter(Boolean).join(" ");
                }
              }
            } catch {
              // ignore caption parse warning
            }
          }

          const combinedYt = [
            `عنوان الفيديو: ${videoTitle}`,
            `رابط الفيديو: https://www.youtube.com/watch?v=${videoId}`,
            shortDesc ? `\n--- وصف الفيديو الكامل ---\n${shortDesc}` : "",
            transcriptText ? `\n--- النص المفرغ الكامل للفيديو (Transcript) ---\n${transcriptText}` : ""
          ]
            .filter(Boolean)
            .join("\n\n");

          if (combinedYt.trim().length > 40) {
            return res.json({
              ok: true,
              sourceType: "web_url",
              title: videoTitle,
              content: combinedYt,
              wordCount: combinedYt.split(/\s+/).filter(Boolean).length,
              resolvedUrl: cleanUrl
            });
          }
        }
      } catch {
        // ignore
      }
    }

    // 5. Google NotebookLM Direct URL Detection (notebooklm.google.com)
    if (/notebooklm\.google\.com/i.test(cleanUrl)) {
      try {
        const nbResp = await fetch(cleanUrl, { headers: browserHeaders, redirect: "follow" });
        const finalUrl = nbResp.url || "";
        const html = await nbResp.text();
        const isLoginRedirect =
          finalUrl.includes("accounts.google.com") ||
          html.includes("accounts.google.com/ServiceLogin") ||
          html.includes("Sign in - Google Accounts") ||
          html.includes("تسجيل الدخول - حسابات Google");

        if (!isLoginRedirect) {
          const parsed = cleanHtmlToStructuredText(html);
          if (parsed.text && parsed.text.split(/\s+/).length > 40) {
            return res.json({
              ok: true,
              sourceType: "notebooklm_url",
              title: customTitle?.trim() || parsed.title || "دفتر Google NotebookLM مشترك",
              content: parsed.text.slice(0, 180000),
              wordCount: parsed.text.split(/\s+/).filter(Boolean).length,
              resolvedUrl: cleanUrl
            });
          }
        }

        // Because notebooklm.google.com private notebooks require browser cookies on google.com,
        // inform the client to open the 1-Click NotebookLM Live Bridge / Smart Bundle Importer!
        return res.status(422).json({
          ok: false,
          isPrivateNotebookLmUrl: true,
          message:
            "روابط notebooklm.google.com الخاصة محمية بكوكيز متصفحك داخل جوجل. لربط دفترك فوراً وبكامل مصادره: انسخ محتوى الدفتر أو مصادره (Ctrl+A ثم Ctrl+C) من صفحة NotebookLM والصقه في خانة «الاستيراد المباشر من NotebookLM» أو صدّره بضغطة واحدة من NotebookLM إلى Google Docs."
        });
      } catch {
        return res.status(422).json({
          ok: false,
          isPrivateNotebookLmUrl: true,
          message:
            "لربط دفترك الخاص من notebooklm.google.com: انسخ المحتوى أو الملخصات من تبويب NotebookLM والصقه في «الاستيراد الذكي من NotebookLM» ليتم تقسيمه وفهرسته كمصادر مرقمة [1]، [2]."
        });
      }
    }

    // 6. General Web URL / GitHub / Wikipedia / Research Article Extraction
    const webResp = await fetch(cleanUrl, { headers: browserHeaders, redirect: "follow" });
    if (!webResp.ok) {
      return res.status(422).json({
        ok: false,
        message: `تعذر جلب الصفحة (رمز الحالة ${webResp.status}). يمكنك نسخ النص ولصقه مباشرة.`
      });
    }

    const contentType = webResp.headers.get("content-type") || "";
    const rawBody = await webResp.text();
    let extractedTitle = customTitle?.trim() || "";
    let extractedText = "";

    if (contentType.includes("application/json") || cleanUrl.endsWith(".json") || cleanUrl.endsWith(".md") || cleanUrl.endsWith(".txt")) {
      extractedText = rawBody.trim();
      extractedTitle = extractedTitle || cleanUrl.split("/").filter(Boolean).pop() || "ملف مرجعي";
    } else {
      const parsed = cleanHtmlToStructuredText(rawBody);
      extractedTitle = extractedTitle || parsed.title || new URL(cleanUrl).hostname;
      extractedText = parsed.text;
    }

    if (!extractedText || extractedText.split(/\s+/).filter(Boolean).length < 10) {
      return res.status(422).json({
        ok: false,
        message: "هذه الصفحة تعتمد على الحماية أو تتطلب تسجيل دخول خاص. الصق النص مباشرة في «نص مرجعي / حزمة NotebookLM»."
      });
    }

    return res.json({
      ok: true,
      sourceType: "web_url",
      title: extractedTitle,
      content: extractedText.slice(0, 180000),
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      resolvedUrl: cleanUrl
    });
  } catch (error: any) {
    console.error("NotebookLM ingest error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "تعذر استخلاص الرابط، يرجى لصق المحتوى النصي مباشرة."
    });
  }
});

// --- PERSONAL GOOGLE ACCOUNT BRIDGE PROXY (100% Free via Google Apps Script Web App & iCal — Zero Google Cloud Billing) ---
app.post("/api/google-bridge/execute", async (req, res) => {
  try {
    const { bridgeUrl, action, payload } = req.body || {};
    const cleanUrl = (bridgeUrl || "").trim();
    if (!cleanUrl || !/^https:\/\/script\.google\.com\/macros\/s\//i.test(cleanUrl)) {
      return res.status(400).json({
        ok: false,
        message: "رابط جسر Google Apps Script غير صالح. يجب أن يبدأ بـ https://script.google.com/macros/s/..."
      });
    }

    const response = await fetch(cleanUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        Accept: "application/json"
      },
      body: JSON.stringify({ action, ...(payload || {}) }),
      redirect: "follow"
    });

    const rawText = await response.text();
    try {
      const data = JSON.parse(rawText);
      return res.json({ ok: true, ...data });
    } catch {
      return res.status(422).json({
        ok: false,
        message: "تأكد من ضبط صلاحية النشر في Google Apps Script على «أي شخص (Anyone)».",
        rawPreview: rawText.slice(0, 300)
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      message: err?.message || "تعذر الاتصال بجسر Google Apps Script."
    });
  }
});

app.post("/api/google-bridge/ical", async (req, res) => {
  try {
    const { icalUrl } = req.body || {};
    const cleanUrl = (icalUrl || "").trim();
    if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
      return res.status(400).json({ ok: false, message: "رابط iCal غير صالح." });
    }
    const resp = await fetch(cleanUrl, { redirect: "follow" });
    if (!resp.ok) {
      return res.status(422).json({ ok: false, message: `تعذر جلب تقويم iCal (${resp.status})` });
    }
    const icsText = await resp.text();
    const events: {
      id: string;
      summary: string;
      description: string;
      start: string;
      end: string;
      location: string;
      htmlLink: string;
    }[] = [];

    const blocks = icsText.split("BEGIN:VEVENT").slice(1);
    for (let i = 0; i < Math.min(blocks.length, 30); i++) {
      const blk = blocks[i].split("END:VEVENT")[0] || "";
      const getField = (name: string) => {
        const m = blk.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "im"));
        return m ? m[1].trim().replace(/\\n/g, "\n").replace(/\\,/g, ",") : "";
      };
      const summary = getField("SUMMARY") || "(موعد تقويم جوجل)";
      const dtStart = getField("DTSTART");
      const dtEnd = getField("DTEND");
      const description = getField("DESCRIPTION");
      const location = getField("LOCATION");
      const uid = getField("UID") || `ics-${i}-${Date.now()}`;
      events.push({
        id: uid,
        summary,
        description,
        start: dtStart,
        end: dtEnd,
        location,
        htmlLink: "https://calendar.google.com"
      });
    }

    return res.json({ ok: true, events });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || "تعذر قراءة ملف iCal." });
  }
});

app.get("/api/health", (_req, res) => {
  return res.json({
    ok: true,
    status: "healthy",
    service: "nexus-omni-server",
    timestamp: Date.now()
  });
});

async function startServer() {
  let viteInstance: Awaited<ReturnType<typeof createViteServer>> | null = null;
  let viteReadyPromise: Promise<Awaited<ReturnType<typeof createViteServer>>> | null = null;

  const ensureViteServer = () => {
    if (viteInstance) return Promise.resolve(viteInstance);
    if (!viteReadyPromise) {
      viteReadyPromise = createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: {
            ignored: [
              "**/.nexus_*",
              "**/nexus_global_power_ledger.json",
              "**/data/**",
              "**/public/generated_files/**",
              "**/public/assets/**",
              "**/agent_bridge/**",
              "**/nexus_lab/**"
            ]
          }
        },
        appType: "spa",
      })
        .then((v) => {
          viteInstance = v;
          return v;
        })
        .catch((err) => {
          viteReadyPromise = null;
          throw err;
        });
    }
    return viteReadyPromise;
  };

  if (process.env.NODE_ENV !== "production") {
    app.use(async (req, res, next) => {
      try {
        const vite = await ensureViteServer();
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== "production") {
      ensureViteServer().catch((err) => {
        console.error("Vite pre-warm failed (will retry on next request):", err);
      });
    }
  });

  httpServer.on("error", (err) => {
    console.error("HTTP server error:", err);
  });
}

startServer();

