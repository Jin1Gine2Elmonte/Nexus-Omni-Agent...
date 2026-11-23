import { OpenAI } from "openai";
import axios from "axios";

/**
 * 🌠 GLM (ZhipuAI) API client.
 * Base URL: https://open.bigmodel.cn/api/paas/v4
 */
export class GLMClient {
  private key: string;
  private client: OpenAI | null = null;

  constructor() {
    this.key = process.env.ZHIPUAI_API_KEY || process.env.GLM_API_KEY || "";
    if (this.key) {
      this.client = new OpenAI({
        apiKey: this.key,
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
      });
    }
  }

  /**
   * Generates a text completion or returns a chat stream.
   * Model examples: "glm-5", "glm-5-plus", "glm-5-flash", "glm-5-air", "glm-5.1"
   */
  async generateChat(messages: any[], model: string = "glm-5-plus", temperature: number = 0.7) {
    if (!this.client) {
      throw new Error("GLM Client is not initialized. Please configure ZHIPUAI_API_KEY or GLM_API_KEY in your environment.");
    }

    try {
      const response = await this.client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
      });
      return response.choices[0]?.message?.content || "";
    } catch (e: any) {
      console.error("[GLM CLIENT ERROR]:", e);
      throw e;
    }
  }

  /**
   * Generates a streaming response.
   */
  async streamChat(messages: any[], model: string = "glm-5-plus", callback: (chunk: string) => void) {
    if (!this.client) {
      throw new Error("GLM Client is not initialized.");
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: model,
        messages: messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          callback(text);
        }
      }
    } catch (e: any) {
      console.error("[GLM CLIENT STREAM ERROR]:", e);
      throw e;
    }
  }
}

/**
 * 🧿 MiniMax (M3) API Client.
 * Base URL: https://api.minimax.chat/v1
 */
export class MiniMaxClient {
  private apiKey: string;
  private groupId: string;

  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || "";
    this.groupId = process.env.MINIMAX_GROUP_ID || "";
  }

  /**
   * Generates a response using MiniMax's OpenAI-compatible or direct endpoint.
   * Model: "abab7-chat", "abab6.5g-chat", etc. (M3 Large language models)
   */
  async generateChat(messages: any[], model: string = "abab7-chat", temperature: number = 0.7) {
    if (!this.apiKey) {
      throw new Error("MiniMax API key is missing. Please configure MINIMAX_API_KEY in your environment.");
    }

    // MiniMax supports standard OpenAI-compatible completions
    const url = "https://api.minimax.chat/v1/chat/completions";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };

    if (this.groupId) {
      headers["minimax-group-id"] = this.groupId;
    }

    try {
      const payload = {
        model: model,
        messages: messages,
        temperature: temperature,
      };

      const response = await axios.post(url, payload, { headers });
      return response.data?.choices?.[0]?.message?.content || "";
    } catch (e: any) {
      const errMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      console.error("[MINIMAX CLIENT ERROR]:", errMsg);
      throw new Error(`MiniMax call failed: ${errMsg}`);
    }
  }

  /**
   * Stream response directly using axios post with stream reader
   */
  async streamChat(messages: any[], model: string = "abab7-chat", callback: (chunk: string) => void) {
    if (!this.apiKey) {
      throw new Error("MiniMax API key is missing.");
    }

    const url = "https://api.minimax.chat/v1/chat/completions";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };

    if (this.groupId) {
      headers["minimax-group-id"] = this.groupId;
    }

    try {
      const response = await axios.post(url, {
        model: model,
        messages: messages,
        stream: true,
      }, {
        headers,
        responseType: "stream"
      });

      response.data.on("data", (chunk: any) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") return;
            try {
              const parsed = JSON.parse(dataStr);
              const text = parsed.choices?.[0]?.delta?.content || "";
              if (text) {
                callback(text);
              }
            } catch (jsonErr) {
              // Ignore partial chunk splits
            }
          }
        }
      });
    } catch (e: any) {
      console.error("[MINIMAX STREAM ERROR]:", e.message);
      throw e;
    }
  }
}
