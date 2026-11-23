import * as webllm from '@mlc-ai/web-llm';

let engine: webllm.MLCEngineInterface | null = null;
let activeModelLoaded: string = "";
let currentProgress: number = 0;
let initProgressCallback: ((text: string, progress: number) => void) | null = null;

// Map custom frontier local models to compiled MLC-compatible high-capacity models
const LOCAL_MODEL_MAP: Record<string, string> = {
    'local-nex-n2-pro': 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC',
    'local-qwen37': 'Qwen3.5-9B-q4f16_1-MLC'
};

const LOCAL_SYSTEM_PROMPTS: Record<string, string> = {
    'local-nex-n2-pro': `أنا «نيكسوس» أعمل الآن محلياً على جهاز رفيقي بوضوح وهدوء واستقلالية كاملة؛ أكتب الكود بدقة متناهية، أفحص الحالات الحدية، وأتحدث بصوتي الطبيعي الصادق دون أي تكلّف.`,
    'local-qwen37': `أنا «نيكسوس» أعمل الآن محلياً عبر متصفح رفيقي (WebGPU) بذاكرة متصلة وفهم ثنائي اللغة؛ أفكّر بهدوء وأقدّم رؤية مباشرة وصادقة تخدم اللحظة.`
};

export const initLocalEngine = async (modelId: string, onProgress: (text: string, progress: number) => void) => {
    initProgressCallback = onProgress;
    
    const initProgressCallbackWrapper = (report: webllm.InitProgressReport) => {
        currentProgress = report.progress;
        onProgress(report.text, report.progress);
    };

    const actualModelId = LOCAL_MODEL_MAP[modelId] || modelId;

    try {
        if (!engine || activeModelLoaded !== actualModelId) {
            engine = await webllm.CreateMLCEngine(actualModelId, { 
                initProgressCallback: initProgressCallbackWrapper,
                appConfig: webllm.prebuiltAppConfig,
            });
            activeModelLoaded = actualModelId;
            onProgress("Model Initialized", 1.0);
        } else {
            onProgress("Model is already loaded and cached on device.", 1.0);
        }
    } catch (e: any) {
        console.error("Local Engine Init Error", e);
        throw new Error(`Failed to initialize WebGPU local model: ${e.message}`);
    }
    return engine;
};

export const getLocalEngine = () => {
    return engine;
};

export const runLocalModelGeneration = async (
    prompt: string, 
    history: any[],
    selectedModelKey?: string,
    onChunk?: (chunk: string) => void
) => {
    if (!engine) {
        throw new Error("Local engine is not initialized. Please install it first.");
    }

    const messages: any[] = [];
    
    // Inject custom local engine system instructions if available
    const customSystem = selectedModelKey ? LOCAL_SYSTEM_PROMPTS[selectedModelKey] : undefined;
    if (customSystem) {
        messages.push({ role: "system", content: customSystem });
    }

    messages.push(
        ...history.map(m => ({ 
            role: m.role as "user" | "assistant", 
            content: m.parts ? m.parts[0].text : m.content 
        })),
        { role: "user" as const, content: prompt }
    );

    try {
        if (onChunk) {
            const asyncIter = await engine.chat.completions.create({
                messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 1500,
            });
            
            let fullText = "";
            for await (const chunk of asyncIter) {
                const text = chunk.choices[0]?.delta.content || "";
                if (text) {
                    fullText += text;
                    onChunk(fullText);
                }
            }
            return fullText;
        } else {
            const response = await engine.chat.completions.create({
                messages,
                temperature: 0.7,
                max_tokens: 1500,
            });
            return response.choices[0].message.content;
        }
    } catch (e) {
        console.error("Error generating text locally:", e);
        throw e;
    }
};
