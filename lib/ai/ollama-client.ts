const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

// Check if Ollama is available
export async function checkOllamaAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Stream chat completion from Ollama
export async function streamOllamaChat(
  messages: OllamaMessage[],
  onChunk: (content: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        options: {
          temperature: 0.3,
          top_p: 0.7,
          num_predict: 512,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const json: OllamaStreamChunk = JSON.parse(line);
          if (json.message?.content) {
            fullResponse += json.message.content;
            onChunk(json.message.content);
          }
          if (json.done) {
            onComplete(fullResponse);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown Ollama error'));
  }
}

// Single (non-streaming) completion
export async function generateOllamaCompletion(
  messages: OllamaMessage[],
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature: 0.3, top_p: 0.7, num_predict: 1024 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}
