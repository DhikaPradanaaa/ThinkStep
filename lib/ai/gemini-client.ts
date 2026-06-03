import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

// Validate API key format — Gemini keys typically start with 'AIza'
if (apiKey && !apiKey.startsWith('AIza')) {
  console.warn('[GeminiClient] ⚠️  GEMINI_API_KEY format looks invalid. Google API keys should start with "AIza". Current prefix:', apiKey.slice(0, 8));
} else if (!apiKey) {
  console.warn('[GeminiClient] ⚠️  GEMINI_API_KEY is not set.');
} else {
  console.log('[GeminiClient] ✅ API key loaded, prefix:', apiKey.slice(0, 8));
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Model fallback chain ordered by free-tier quota (highest first):
// gemini-2.0-flash = 200 RPD, gemini-2.5-flash-lite = 30 RPD, gemini-2.5-flash = 20 RPD
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

export interface GeminiMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

// Stream chat completion from Gemini
export async function streamGeminiChat(
  systemPrompt: string,
  history: GeminiMessage[],
  onChunk: (content: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!genAI) {
    onError(new Error('Gemini API Key is not configured.'));
    return;
  }

  const rawHistory = history.slice(0, -1).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Gemini strictly requires alternating user/model roles. Collapse consecutive roles.
  const chatHistory: any[] = [];
  for (const msg of rawHistory) {
    const last = chatHistory[chatHistory.length - 1];
    if (last && last.role === msg.role) {
      last.parts[0].text += '\n\n' + msg.parts[0].text;
    } else {
      chatHistory.push({ ...msg, parts: [{ text: msg.parts[0].text }] });
    }
  }

  // Ensure the history ends with 'model' before sending the new 'user' message
  if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
    chatHistory.push({ role: 'model', parts: [{ text: 'Baik, silakan lanjutkan.' }] });
  }

  // Ensure the history STARTS with 'user' role
  if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
    chatHistory.unshift({ role: 'user', parts: [{ text: 'Mari mulai belajar.' }] });
  }

  const lastMessage = history[history.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    onError(new Error('Last message must be from user'));
    return;
  }

  // Try each model in fallback chain until one succeeds
  let lastError: Error | null = null;
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.3,
          topP: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessageStream(lastMessage.content);
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onChunk(chunkText);
      }

      onComplete(fullResponse);
      return; // success — exit the fallback loop

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const is429 = err.message.includes('429') || err.message.includes('quota') || err.message.includes('Too Many Requests');
      const is404 = err.message.includes('404') || err.message.includes('not found');

      if (is429 || is404) {
        // Quota exceeded or model not available — try next model in chain
        console.warn(`[Gemini] Model ${modelName} unavailable (${is429 ? '429 quota' : '404 not found'}), trying next...`);
        lastError = err;
        continue;
      }

      // Non-quota error — fail immediately
      onError(err);
      return;
    }
  }

  // All models exhausted
  onError(lastError ?? new Error('All Gemini models exhausted their quota'));
}
