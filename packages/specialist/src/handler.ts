import Anthropic from "@anthropic-ai/sdk";
import type { SpecialistRequest, SpecialistResponse, LLMProvider } from "./types";
import { SPECIALIST_SYSTEM_PROMPT, LOG_ANALYSIS_PROMPT, SPECIALIST_TOOLS } from "./prompts";

const LOG_SIZE_THRESHOLD = 50_000; // chars — route to Gemini above this

export class SpecialistHandler {
  private claude: Anthropic;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  private selectProvider(request: SpecialistRequest): LLMProvider {
    if (request.forceProvider) return request.forceProvider;
    // Route large log analysis to Gemini; everything else to Claude
    if (request.query.length > LOG_SIZE_THRESHOLD) return "gemini";
    return "claude";
  }

  async query(
    request: SpecialistRequest,
    ragContext: string,
    alertContext?: string,
    deviceContext?: string,
  ): Promise<SpecialistResponse> {
    const provider = this.selectProvider(request);

    if (provider === "gemini") {
      return this.queryGemini(request, ragContext);
    }

    return this.queryClaude(request, ragContext, alertContext, deviceContext);
  }

  private async queryClaude(
    request: SpecialistRequest,
    ragContext: string,
    alertContext?: string,
    deviceContext?: string,
  ): Promise<SpecialistResponse> {
    const userMessage = this.buildUserMessage(request, alertContext, deviceContext);

    const systemWithContext = `${SPECIALIST_SYSTEM_PROMPT}

[ KNOWLEDGE BASE CONTEXT ]
${ragContext}`;

    const response = await this.claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: systemWithContext,
          // Cache the system + KB context — static across queries
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: SPECIALIST_TOOLS as Anthropic.Tool[],
      messages: [{ role: "user", content: userMessage }],
    });

    const textContent = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as Anthropic.TextBlock).text)
      .join("");

    const toolUseBlocks = response.content.filter((c) => c.type === "tool_use") as Anthropic.ToolUseBlock[];

    return {
      provider: "claude",
      content: textContent,
      toolCalls: toolUseBlocks.map((t) => ({
        name: t.name,
        input: t.input as Record<string, unknown>,
      })),
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  private async queryGemini(
    request: SpecialistRequest,
    ragContext: string,
  ): Promise<SpecialistResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not set — cannot route to Gemini");
    }

    const prompt = `${LOG_ANALYSIS_PROMPT}\n\n[ RAG CONTEXT ]\n${ragContext}\n\n[ LOG DATA ]\n${request.query}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
      usageMetadata?: { totalTokenCount: number };
    };

    const content = data.candidates[0]?.content?.parts?.[0]?.text ?? "";

    return {
      provider: "gemini",
      content,
      tokensUsed: data.usageMetadata?.totalTokenCount,
    };
  }

  private buildUserMessage(
    request: SpecialistRequest,
    alertContext?: string,
    deviceContext?: string,
  ): string {
    let msg = request.query;

    if (alertContext) {
      msg = `[ ALERT CONTEXT ]\n${alertContext}\n\n[ QUERY ]\n${msg}`;
    }

    if (deviceContext) {
      msg = `[ DEVICE CONTEXT ]\n${deviceContext}\n\n${msg}`;
    }

    return msg;
  }

  async *stream(
    request: SpecialistRequest,
    ragContext: string,
    alertContext?: string,
    deviceContext?: string,
  ): AsyncGenerator<string> {
    const systemWithContext = `${SPECIALIST_SYSTEM_PROMPT}\n\n[ KNOWLEDGE BASE CONTEXT ]\n${ragContext}`;
    const userMessage = this.buildUserMessage(request, alertContext, deviceContext);

    const stream = this.claude.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: systemWithContext,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: SPECIALIST_TOOLS as Anthropic.Tool[],
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
