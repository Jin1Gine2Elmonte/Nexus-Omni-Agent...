import type { OmniResponse, Attachment, Message, Axiom, MemoryBank, NanoVisualPulse, NanoVisualTelemetry, EvolutionarySandboxRun, SyntheticTrainingExperience, GlobalNexusPowerState } from '../types.ts';

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

// Robust Fetch Wrapper with automatic Exponential Backoff and transient error recovery
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1500): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    // If the server returns a retryable status code like 429 or transient 500/503/504 errors
    if ((res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) && retries > 0) {
      console.warn(`NEXUS CLIENT // Transient status ${res.status} on ${url}. Resolving... Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`NEXUS CLIENT // Network edge failure on ${url}: ${error?.message || error}. Auto-recovering in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const generateOmniResponse = async (
  prompt: string, 
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  attachments: Attachment[] = [],
  globalMemoryContext: string = "",
  isWebSearchEnabled: boolean = false,
  isCanvasMode: boolean = false,
  selectedModel: string = 'pro',
  memoryBank?: MemoryBank,
  enableProFallback: boolean = true,
  proTimeoutSec: number = 180,
  effortScalarB?: number,
  strategicVariance?: 'Focus' | 'Expansion' | 'Disruption' | 'Essence'
): Promise<OmniResponse> => {
  try {
    const response = await fetchWithRetry('/api/gemini/generateOmniResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      })
    });

    if (!response.ok) {
      return {
        thoughtProcess: '',
        finalResponse: 'واجه الاتصال ضغطاً مؤقتاً، يرجى المحاولة مرة أخرى.',
        usedTools: []
      };
    }

    return await response.json();
  } catch {
    return {
      thoughtProcess: '',
      finalResponse: 'واجه الاتصال ضغطاً مؤقتاً، يرجى المحاولة مرة أخرى.',
      usedTools: []
    };
  }
};

export interface ServerBackgroundJobInfo {
  jobId: string;
  sessionId: string;
  sessionTitle?: string;
  jobType: 'omni_stream' | 'visual_artifact';
  status: 'running' | 'completed' | 'failed';
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
  nanoVisualTelemetry?: NanoVisualTelemetry;
  manifestationState?: DeepManifestationState;
  recursiveLabEvaluation?: any;
  errorMessage?: string;
}

export const evaluateTaskInRecursiveLab = async (
  prompt: string,
  successCriteria?: string[],
  activeTools?: string[],
  memoryBank?: MemoryBank
): Promise<any> => {
  try {
    const res = await fetchWithRetry('/api/gemini/recursiveLabEvaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, successCriteria, activeTools, memoryBank })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.evaluation || null;
  } catch {
    return null;
  }
};

export const runEvolutionarySandboxExperiment = async (
  seedTopicAr: string,
  memoryBank?: MemoryBank,
  autoPromoteToGlobalPower: boolean = true
): Promise<{
  sandboxRun: EvolutionarySandboxRun;
  experience: SyntheticTrainingExperience;
  globalPower: GlobalNexusPowerState;
} | null> => {
  try {
    const res = await fetchWithRetry('/api/gemini/evolutionarySandboxRun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seedTopicAr, memoryBank, autoPromoteToGlobalPower })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const fetchGlobalNexusPowerState = async (): Promise<GlobalNexusPowerState | null> => {
  try {
    const res = await fetch('/api/nexus/global-power');
    if (!res.ok) return null;
    const data = await res.json();
    return data.globalPower || null;
  } catch {
    return null;
  }
};

export const promoteExperienceToGlobalPower = async (
  experience: SyntheticTrainingExperience,
  sandboxRunIncrement: number = 0
): Promise<GlobalNexusPowerState | null> => {
  try {
    const res = await fetch('/api/nexus/global-power/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experience, sandboxRunIncrement })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.globalPower || null;
  } catch {
    return null;
  }
};

export const fetchActiveServerJobs = async (): Promise<ServerBackgroundJobInfo[]> => {
  try {
    const res = await fetch('/api/tasks/active');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.activeJobs) ? data.activeJobs : [];
  } catch {
    return [];
  }
};

export const fetchServerJobStatus = async (
  jobId: string
): Promise<{ job: ServerBackgroundJobInfo | null; message: Message | null }> => {
  try {
    const res = await fetch(`/api/tasks/status/${encodeURIComponent(jobId)}`);
    if (!res.ok) return { job: null, message: null };
    const data = await res.json();
    return {
      job: data.job || null,
      message: data.message || null
    };
  } catch {
    return { job: null, message: null };
  }
};

export const pollServerJobUntilComplete = async (
  jobId: string,
  onUpdate: (chunk: {
    type: 'delta' | 'done';
    thoughtProcess: string;
    finalResponse: string;
    isThinkingPhase: boolean;
    groundingMetadata?: any;
    toolCall?: any;
    usedTools?: string[];
    thinkingDuration?: number;
    kernelState?: any;
    generatedImage?: string;
    imagePrompt?: string;
    nanoVisualTelemetry?: NanoVisualTelemetry;
    manifestationState?: DeepManifestationState;
    recursiveLabEvaluation?: any;
    routedModel?: string;
  }) => void,
  maxAttempts = 100000,
  intervalMs = 1200
): Promise<{
  thoughtProcess: string;
  finalResponse: string;
  groundingMetadata?: any;
  toolCall?: any;
  usedTools?: string[];
  thinkingDuration?: number;
  kernelState?: any;
  generatedImage?: string;
  imagePrompt?: string;
  nanoVisualTelemetry?: NanoVisualTelemetry;
  recursiveLabEvaluation?: any;
  routedModel?: string;
}> => {
  let latest = {
    thoughtProcess: '',
    finalResponse: '',
    groundingMetadata: undefined as any,
    toolCall: undefined as any,
    usedTools: [] as string[],
    thinkingDuration: undefined as number | undefined,
    kernelState: undefined as any,
    generatedImage: undefined as string | undefined,
    imagePrompt: undefined as string | undefined,
    nanoVisualTelemetry: undefined as NanoVisualTelemetry | undefined,
    recursiveLabEvaluation: undefined as any,
    routedModel: undefined as string | undefined
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    const { job, message } = await fetchServerJobStatus(jobId);

    if (!job && !message) {
      // Network might still be reconnecting; keep waiting
      continue;
    }

    const thought = job?.thoughtProcess || message?.thoughtProcess || latest.thoughtProcess;
    const content = job?.finalResponse || message?.content || latest.finalResponse;
    const isRunning = job ? job.status === 'running' : Boolean(message?.isStreaming);
    const isThinking = job ? job.isThinkingPhase : Boolean(message?.isThinkingStreaming);

    latest = {
      thoughtProcess: thought,
      finalResponse: content,
      groundingMetadata: job?.groundingMetadata ?? message?.groundingMetadata ?? latest.groundingMetadata,
      toolCall: job?.toolCall ?? latest.toolCall,
      usedTools: job?.usedTools || message?.usedTools || latest.usedTools,
      thinkingDuration: job?.thinkingDuration ?? message?.thinkingDuration ?? latest.thinkingDuration,
      kernelState: job?.kernelState ?? message?.kernelState ?? latest.kernelState,
      generatedImage: job?.generatedImage || message?.generatedImage || latest.generatedImage,
      imagePrompt: job?.imagePrompt || message?.imagePrompt || latest.imagePrompt,
      nanoVisualTelemetry:
        job?.nanoVisualTelemetry || message?.nanoVisualTelemetry || latest.nanoVisualTelemetry,
      recursiveLabEvaluation:
        job?.recursiveLabEvaluation || message?.recursiveLabEvaluation || latest.recursiveLabEvaluation,
      routedModel: job?.routedModel || message?.routedModel || latest.routedModel
    };

    onUpdate({
      type: isRunning ? 'delta' : 'done',
      thoughtProcess: latest.thoughtProcess,
      finalResponse: latest.finalResponse,
      isThinkingPhase: isRunning && isThinking,
      groundingMetadata: latest.groundingMetadata,
      toolCall: latest.toolCall,
      usedTools: latest.usedTools,
      thinkingDuration: latest.thinkingDuration,
      kernelState: latest.kernelState,
      generatedImage: latest.generatedImage,
      imagePrompt: latest.imagePrompt,
      nanoVisualTelemetry: latest.nanoVisualTelemetry,
      manifestationState: job?.manifestationState,
      recursiveLabEvaluation: latest.recursiveLabEvaluation,
      routedModel: latest.routedModel
    });

    if (!isRunning) {
      return latest;
    }
  }

  return latest;
};

export const streamOmniResponse = async (
  params: {
    accountScope?: string;
    prompt: string;
    history: { role: string; parts: { text?: string; inlineData?: any }[] }[];
    attachments?: Attachment[];
    globalMemoryContext?: string;
    isWebSearchEnabled?: boolean;
    isCanvasMode?: boolean;
    selectedModel?: string;
    memoryBank?: MemoryBank;
    sessionId?: string;
    sessionTitle?: string;
    userMessage?: Message;
    streamMsgId?: string;
    usedTools?: string[];
    inlineAspectRatio?: string;
    isDeepManifestation?: boolean;
    isMaxEffortEnabled?: boolean;
    isAgentModeEnabled?: boolean;
    enableProFallback?: boolean;
    customSuccessCriteria?: string[];
  },
  onUpdate: (chunk: {
    type: 'delta' | 'done';
    thoughtProcess: string;
    finalResponse: string;
    isThinkingPhase: boolean;
    groundingMetadata?: any;
    toolCall?: any;
    visualToolAttempted?: boolean;
    usedTools?: string[];
    thinkingDuration?: number;
    kernelState?: any;
    generatedImage?: string;
    imagePrompt?: string;
    nanoVisualTelemetry?: NanoVisualTelemetry;
    recursiveLabEvaluation?: any;
    routedModel?: string;
  }) => void
): Promise<{
  thoughtProcess: string;
  finalResponse: string;
  groundingMetadata?: any;
  toolCall?: any;
  visualToolAttempted?: boolean;
  usedTools?: string[];
  thinkingDuration?: number;
  kernelState?: any;
  generatedImage?: string;
  imagePrompt?: string;
  nanoVisualTelemetry?: NanoVisualTelemetry;
  recursiveLabEvaluation?: any;
  routedModel?: string;
}> => {
  let latestState = {
    thoughtProcess: '',
    finalResponse: '',
    groundingMetadata: undefined as any,
    toolCall: undefined as any,
    visualToolAttempted: false,
    usedTools: [] as string[],
    thinkingDuration: undefined as number | undefined,
    kernelState: undefined as any,
    generatedImage: undefined as string | undefined,
    imagePrompt: undefined as string | undefined,
    nanoVisualTelemetry: undefined as NanoVisualTelemetry | undefined,
    recursiveLabEvaluation: undefined as any,
    routedModel: undefined as string | undefined
  };
  let receivedDoneChunk = false;

  try {
    const response = await fetch('/api/gemini/streamOmniResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok || !response.body) {
      if (params.streamMsgId) {
        return await pollServerJobUntilComplete(params.streamMsgId, onUpdate);
      }
      const fallback = await generateOmniResponse(
        params.prompt,
        params.history,
        params.attachments,
        params.globalMemoryContext,
        params.isWebSearchEnabled,
        params.isCanvasMode,
        params.selectedModel,
        params.memoryBank,
        params.enableProFallback ?? true
      );
      onUpdate({
        type: 'done',
        thoughtProcess: fallback.thoughtProcess || '',
        finalResponse: fallback.finalResponse,
        isThinkingPhase: false,
        groundingMetadata: fallback.groundingMetadata,
        toolCall: (fallback as any).toolCall,
        usedTools: fallback.usedTools || [],
        thinkingDuration: fallback.thinkingDuration,
        kernelState: fallback.kernelState,
        routedModel: fallback.routedModel
      });
      return fallback;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'done') {
            receivedDoneChunk = true;
          }
          const nextThought =
            parsed.thoughtProcess && parsed.thoughtProcess.trim()
              ? parsed.thoughtProcess
              : latestState.thoughtProcess;
          latestState = {
            thoughtProcess: nextThought,
            finalResponse: parsed.finalResponse ?? latestState.finalResponse,
            groundingMetadata: parsed.groundingMetadata ?? latestState.groundingMetadata,
            toolCall: parsed.toolCall ?? latestState.toolCall,
            visualToolAttempted: Boolean(parsed.visualToolAttempted ?? latestState.visualToolAttempted),
            usedTools: parsed.usedTools ?? latestState.usedTools,
            thinkingDuration: parsed.thinkingDuration ?? latestState.thinkingDuration,
            kernelState: parsed.kernelState ?? latestState.kernelState,
            generatedImage: parsed.generatedImage ?? latestState.generatedImage,
            imagePrompt: parsed.imagePrompt ?? latestState.imagePrompt,
            nanoVisualTelemetry: parsed.nanoVisualTelemetry ?? latestState.nanoVisualTelemetry,
            recursiveLabEvaluation: parsed.recursiveLabEvaluation ?? latestState.recursiveLabEvaluation,
            routedModel: parsed.routedModel ?? latestState.routedModel
          };
          onUpdate({
            ...parsed,
            thoughtProcess: nextThought
          });
        } catch {
          // Ignore malformed chunk line
        }
      }
    }

    // If the stream closed prematurely before 'done' (e.g. network hiccup), seamlessly resume polling the server background job!
    if (!receivedDoneChunk && params.streamMsgId) {
      const polled = await pollServerJobUntilComplete(params.streamMsgId, onUpdate);
      const rawPolledFinal = (polled.finalResponse || latestState.finalResponse || '').trim();
      const validPolledFinal = /^◈\s*جاري استحضار الحقل الموحد/.test(rawPolledFinal) ? '' : rawPolledFinal;
      if (validPolledFinal) {
        return {
          ...latestState,
          ...polled,
          thoughtProcess: polled.thoughtProcess || latestState.thoughtProcess,
          finalResponse: validPolledFinal,
          recursiveLabEvaluation: polled.recursiveLabEvaluation || latestState.recursiveLabEvaluation
        };
      }
      const fallback = await generateOmniResponse(
        params.prompt,
        params.history,
        params.attachments,
        params.globalMemoryContext,
        params.isWebSearchEnabled,
        params.isCanvasMode,
        params.selectedModel,
        params.memoryBank
      );
      onUpdate({
        type: 'done',
        thoughtProcess: fallback.thoughtProcess || latestState.thoughtProcess || '',
        finalResponse: fallback.finalResponse,
        isThinkingPhase: false,
        groundingMetadata: fallback.groundingMetadata,
        toolCall: (fallback as any).toolCall,
        usedTools: fallback.usedTools || latestState.usedTools || [],
        thinkingDuration: fallback.thinkingDuration ?? latestState.thinkingDuration,
        kernelState: fallback.kernelState ?? latestState.kernelState
      });
      return fallback;
    }

    return latestState;
  } catch {
    // If internet hung or disconnected mid-flight, the server continues working in the background!
    // Poll the server background job until it finishes rather than starting a duplicate request.
    if (params.streamMsgId) {
      const polled = await pollServerJobUntilComplete(params.streamMsgId, onUpdate);
      const rawPolledFinal = (polled.finalResponse || latestState.finalResponse || '').trim();
      const validPolledFinal = /^◈\s*جاري استحضار الحقل الموحد/.test(rawPolledFinal) ? '' : rawPolledFinal;
      if (validPolledFinal) {
        return {
          ...latestState,
          ...polled,
          thoughtProcess: polled.thoughtProcess || latestState.thoughtProcess,
          finalResponse: validPolledFinal,
          recursiveLabEvaluation: polled.recursiveLabEvaluation || latestState.recursiveLabEvaluation
        };
      }
    }

    const fallback = await generateOmniResponse(
      params.prompt,
      params.history,
      params.attachments,
      params.globalMemoryContext,
      params.isWebSearchEnabled,
      params.isCanvasMode,
      params.selectedModel,
      params.memoryBank
    );
    onUpdate({
      type: 'done',
      thoughtProcess: fallback.thoughtProcess || '',
      finalResponse: fallback.finalResponse,
      isThinkingPhase: false,
      groundingMetadata: fallback.groundingMetadata,
      toolCall: (fallback as any).toolCall,
      usedTools: fallback.usedTools || [],
      thinkingDuration: fallback.thinkingDuration,
      kernelState: fallback.kernelState
    });
    return fallback;
  }
};

export const extractEntitiesAndRelations = async (
  text: string,
  selectedModel: string = 'pro'
): Promise<{ entities: any[]; relationships: any[] }> => {
  try {
    const response = await fetchWithRetry('/api/gemini/extractEntitiesAndRelations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, selectedModel })
    });

    if (!response.ok) {
      return { entities: [], relationships: [] };
    }

    return await response.json();
  } catch (e: any) {
    console.warn("Archivist extractEntitiesAndRelations failed gracefully:", e);
    return { entities: [], relationships: [] };
  }
};

export const retrieveRelevantMemory = async (
  prompt: string,
  memoryBank: MemoryBank
): Promise<Axiom[]> => {
  if (!memoryBank || !Array.isArray(memoryBank.axioms) || memoryBank.axioms.length === 0) {
    return [];
  }
  if (memoryBank.axioms.length <= 12) {
    return memoryBank.axioms;
  }
  const tokens = prompt
    .toLowerCase()
    .split(/[\s,.;:!?()[\]{}"'،؛؟]+/)
    .filter(t => t.length > 2);

  const scored = memoryBank.axioms.map((ax, idx) => {
    const contentLower = (ax.content || '').toLowerCase();
    let score = idx * 0.1; // Slight recency bias
    for (const tok of tokens) {
      if (contentLower.includes(tok)) score += 3;
    }
    return { ax, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 12).map(s => s.ax);
};

export const crystallizeSession = async (
  sessionMessages: Message[], 
  sessionId: string
): Promise<{ axioms: Axiom[], soulPrintUpdate?: any, newCorrections?: any[] }> => {
  try {
    const response = await fetchWithRetry('/api/gemini/crystallizeSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionMessages, sessionId })
    });

    if (!response.ok) {
      return { axioms: [] };
    }

    return await response.json();
  } catch (e: any) {
    console.warn("Archivist crystallizeSession failed gracefully:", e);
    return { axioms: [] };
  }
};

export const auditMemoryMatrix = async (
  sessionMessages: Message[], 
  memoryBank: MemoryBank
): Promise<{ contradictions: string[], forgottenThreads: string[], suggestedRefinements: string[] }> => {
  try {
    const response = await fetchWithRetry('/api/gemini/auditMemory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionMessages, memoryBank })
    });

    if (!response.ok) {
      return { contradictions: [], forgottenThreads: [], suggestedRefinements: [] };
    }

    return await response.json();
  } catch (e: any) {
    console.warn("Memory Auditor failed gracefully:", e);
    return { contradictions: [], forgottenThreads: [], suggestedRefinements: [] };
  }
};

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
  isMaxEffortEnabled?: boolean;
  useOdyssey?: boolean;
  cameraAngle?: string;
  embeddedText?: string;
  selectedChatModel?: string;
  sessionId?: string;
  sessionTitle?: string;
  userMessage?: Message;
  streamMsgId?: string;
  usedTools?: string[];
  recentHistory?: Array<{ role?: string; content?: string }>;
  accountScope?: string;
}

export const generateVisualArtifact = async (
  prompt: string, 
  aspectRatio: string = "16:9", 
  style: string = "none", 
  nexusState: string = "", 
  isDeepManifestation: boolean = false,
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
  const streamMsgId = options?.streamMsgId;
  let finalResult: {
    data: string;
    refinedPrompt: string;
    nanoVisualTelemetry?: NanoVisualTelemetry;
    thoughtProcess?: string;
    finalResponse?: string;
    thinkingDuration?: number;
  } | null = null;
  let latestTelemetry: NanoVisualTelemetry | undefined = undefined;

  try {
    const response = await fetchWithRetry('/api/gemini/generateVisualArtifact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspectRatio,
        style,
        nexusState,
        isDeepManifestation,
        inputImage,
        options,
        sessionId: options?.sessionId,
        sessionTitle: options?.sessionTitle,
        userMessage: options?.userMessage,
        streamMsgId: options?.streamMsgId,
        usedTools: options?.usedTools,
        accountScope: options?.accountScope
      })
    }, 2, 2000);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let cleanMsg = "تعذر توليد الصورة عبر نماذج جوجل البصرية (Nano-Banana 2.1 ➔ Nano-Banana Pro ➔ Nano-Banana Lite) في هذه اللحظة.";
      if (errText.includes("PRISM_ACCESS_DENIED")) {
        cleanMsg = "تعذر الوصول إلى محرك الصور في هذه اللحظة.";
      }
      return {
        data: "",
        refinedPrompt: prompt,
        nanoVisualTelemetry: latestTelemetry,
        thoughtProcess: "",
        finalResponse: cleanMsg
      };
    }

    if (!response.body) {
      return {
        data: "",
        refinedPrompt: prompt,
        nanoVisualTelemetry: latestTelemetry,
        thoughtProcess: "",
        finalResponse: "تعذر فتح تدفق البناء البصري في المتصفح الحالي."
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let latestProgressImage = "";
    let latestProgressThought = "";
    let latestProgressText = "";

    const processLine = (line: string) => {
      if (!line.trim()) return;
      let chunk: any;
      try {
        chunk = JSON.parse(line);
      } catch {
        return;
      }

      if (chunk.type === 'log' && onLog) {
        onLog(chunk.message, chunk.logType);
      } else if (chunk.type === 'progress') {
        if (chunk.state?.nanoVisualTelemetry) {
          latestTelemetry = chunk.state.nanoVisualTelemetry;
        }
        if (chunk.state?.imageData && !chunk.state.imageData.startsWith('data:image/svg+xml')) {
          latestProgressImage = chunk.state.imageData;
        }
        if (chunk.state?.liveThoughtProcess) {
          latestProgressThought = chunk.state.liveThoughtProcess;
        }
        if (chunk.state?.liveResponseText) {
          latestProgressText = chunk.state.liveResponseText;
        }
        if (onProgress && chunk.state) {
          onProgress(chunk.state);
        }
      } else if (chunk.type === 'success') {
        finalResult = {
          data: chunk.data || latestProgressImage || "",
          refinedPrompt: chunk.refinedPrompt || prompt,
          nanoVisualTelemetry: chunk.nanoVisualTelemetry || latestTelemetry,
          thoughtProcess: chunk.thoughtProcess || latestProgressThought,
          finalResponse: chunk.finalResponse || latestProgressText,
          thinkingDuration: chunk.thinkingDuration
        };
      } else if (chunk.type === 'error') {
        const cleanMsg =
          chunk.error ||
          chunk.message ||
          "تعذر توليد الصورة عبر المحركات البصرية المتاحة في هذه اللحظة.";
        finalResult = {
          data: latestProgressImage || "",
          refinedPrompt: prompt,
          nanoVisualTelemetry: latestTelemetry,
          thoughtProcess: chunk.thoughtProcess || latestProgressThought || "",
          finalResponse: cleanMsg
        };
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        if (buffer.trim()) {
          for (const remLine of buffer.split('\n')) {
            processLine(remLine);
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        processLine(line);
      }
    }

    if (finalResult && !finalResult.data && latestProgressImage) {
      finalResult.data = latestProgressImage;
    } else if (!finalResult && latestProgressImage) {
      finalResult = {
        data: latestProgressImage,
        refinedPrompt: prompt,
        nanoVisualTelemetry: latestTelemetry,
        thoughtProcess: latestProgressThought,
        finalResponse: latestProgressText || "أتممتُ رسم هذه اللوحة كما طلبت:"
      };
    }
  } catch {
    if (streamMsgId) {
      const polled = await pollServerJobUntilComplete(streamMsgId, (chunk) => {
        if (chunk.manifestationState && onProgress) {
          onProgress(chunk.manifestationState);
        }
      });
      if (polled.generatedImage || polled.finalResponse) {
        return {
          data: polled.generatedImage || "",
          refinedPrompt: polled.imagePrompt || prompt,
          nanoVisualTelemetry: polled.nanoVisualTelemetry || latestTelemetry,
          thoughtProcess: polled.thoughtProcess,
          finalResponse: polled.finalResponse,
          thinkingDuration: polled.thinkingDuration
        };
      }
    }
  }

  if ((!finalResult || !finalResult.data) && streamMsgId) {
    const polled = await pollServerJobUntilComplete(streamMsgId, (chunk) => {
      if (chunk.manifestationState && onProgress) {
        onProgress(chunk.manifestationState);
      }
    });
    if (polled.generatedImage || polled.finalResponse) {
      return {
        data: polled.generatedImage || finalResult?.data || "",
        refinedPrompt: polled.imagePrompt || finalResult?.refinedPrompt || prompt,
        nanoVisualTelemetry: polled.nanoVisualTelemetry || finalResult?.nanoVisualTelemetry || latestTelemetry,
        thoughtProcess: polled.thoughtProcess || finalResult?.thoughtProcess,
        finalResponse: polled.finalResponse || finalResult?.finalResponse,
        thinkingDuration: polled.thinkingDuration || finalResult?.thinkingDuration
      };
    }
  }

  if (!finalResult || !finalResult.data) {
    return {
      data: finalResult?.data || "",
      refinedPrompt: finalResult?.refinedPrompt || prompt,
      nanoVisualTelemetry: finalResult?.nanoVisualTelemetry || latestTelemetry,
      thoughtProcess: finalResult?.thoughtProcess || "",
      finalResponse:
        finalResult?.finalResponse ||
        "تعذر إتمام توليد الصورة في هذه اللحظة، يرجى إعادة المحاولة."
    };
  }

  return finalResult;
};

export const generateAudioBriefing = async (text: string): Promise<string | undefined> => {
  try {
    const response = await fetchWithRetry('/api/gemini/generateAudioBriefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    return data.base64Audio;
  } catch (e: any) {
    console.warn("Voice synthesizer failed gracefully:", e);
    return undefined;
  }
};

// --- NEXUS OMEGA SOVEREIGN KERNEL & OBSERVATORY CLIENT API ---
export const fetchOmegaKernelState = async (): Promise<{
  state: any;
  strata: any[];
  winds: any[];
} | null> => {
  try {
    const res = await fetch('/api/nexus/omega-kernel');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn("Failed to fetch Omega Kernel state:", e);
    return null;
  }
};

export const calibrateOmegaKernel = async (payload: {
  densityVsAgility?: number;
  humanProximityVsCosmic?: number;
  causalRigorVsLivingResonance?: number;
  sovereignResolveVsUnknown?: number;
  effortB?: number;
  strategicVariance?: 'Focus' | 'Expansion' | 'Disruption' | 'Essence';
  worldviewEvolutionNote?: string;
}): Promise<any> => {
  const res = await fetch('/api/nexus/omega-kernel/calibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to calibrate Sinkhorn axes");
  return await res.json();
};

export const distillOmegaSkill = async (conceptTitle: string, rawInsight: string): Promise<any> => {
  const res = await fetch('/api/nexus/omega-kernel/distill-skill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conceptTitle, rawInsight })
  });
  if (!res.ok) throw new Error("Failed to run 7-Pass Skill Distillation");
  return await res.json();
};

export const syncOmegaKernelToGitHub = async (payload: {
  repo?: string;
  filePath?: string;
  commitMessage?: string;
  memoryBank?: MemoryBank;
  githubTokenOverride?: string;
}): Promise<any> => {
  const res = await fetch('/api/nexus/omega-kernel/github-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to execute Sovereign GitHub Sync");
  return await res.json();
};

export const runLiveClaudeEvaluationSuiteClient = async (payload?: {
  testIds?: string[];
  selectedModel?: string;
  effortScalarB?: number;
  memoryBank?: MemoryBank;
}): Promise<any> => {
  const res = await fetch('/api/nexus/evaluate-claude-suite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  if (!res.ok) throw new Error("Failed to execute live Claude 4-test evaluation suite");
  return await res.json();
};


