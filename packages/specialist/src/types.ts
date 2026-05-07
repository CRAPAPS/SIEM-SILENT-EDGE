export type LLMProvider = "claude" | "gemini";

export interface SpecialistRequest {
  query: string;
  provider?: LLMProvider;
  alertId?: string;
  deviceId?: string;
  orgId: string;
  userId: string;
  stream?: boolean;
  forceProvider?: LLMProvider;
}

export interface SpecialistResponse {
  provider: LLMProvider;
  content: string;
  toolCalls?: ToolCall[];
  ragChunks?: number;
  tokensUsed?: number;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
}

export interface RagChunk {
  id: string;
  content: string;
  sourceFile: string;
  similarity: number;
}
