export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface StreamOptions extends GenerateOptions {
  signal?: AbortSignal;
}

export interface AIProvider {
  generateResponse(prompt: string, options?: GenerateOptions): Promise<string | null>;
  generateContentStream?(prompt: string, history: AIMessage[], systemInstruction: string, options?: StreamOptions): Promise<ReadableStream<Uint8Array>>;
}
