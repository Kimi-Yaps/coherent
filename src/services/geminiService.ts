const GEMINI_STORAGE_KEY = 'coherent_gemini_api_key';
const GEMINI_MODEL_KEY = 'coherent_gemini_model';

export interface GeminiModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  rpm: number; // Requests Per Minute
  rpd: number; // Requests Per Day
  tpm: string; // Tokens Per Minute
  maxTokens: string;
  isDefault?: boolean;
}

export interface ModelLimitInfo {
  modelId: string;
  modelName: string;
  rpm: number;
  rpd: number;
  tpm: string;
  maxTokens: string;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Recommended',
    description: 'Fast, empathetic multimodal care companion',
    rpm: 15,
    rpd: 1500,
    tpm: '1,000,000',
    maxTokens: '1,000,000',
    isDefault: true,
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    badge: 'Deep Reasoning',
    description: 'Next-gen hybrid reasoning for complex emotional reflections',
    rpm: 15,
    rpd: 1500,
    tpm: '1,000,000',
    maxTokens: '1,000,000',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    badge: 'Ultra Fast',
    description: 'Lowest-latency, lightweight companion for rapid check-ins',
    rpm: 30,
    rpd: 1500,
    tpm: '1,000,000',
    maxTokens: '1,000,000',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    badge: 'Pro Thinking',
    description: 'Maximum depth, long-context understanding and synthesis',
    rpm: 2,
    rpd: 50,
    tpm: '32,000',
    maxTokens: '2,000,000',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    badge: 'Lightweight',
    description: 'Efficient, streamlined model for continuous daily support',
    rpm: 30,
    rpd: 1500,
    tpm: '1,000,000',
    maxTokens: '1,000,000',
  },
  {
    id: 'gemma-4-31b-it',
    name: 'Gemma 4 31B',
    badge: 'Open Weights',
    description: 'High-parameter dense open model fine-tuned for helpful chats',
    rpm: 15,
    rpd: 1500,
    tpm: '500,000',
    maxTokens: '128,000',
  },
  {
    id: 'gemma-4-26b-a4b-it',
    name: 'Gemma 4 MoE (26B/4B)',
    badge: 'MoE Architecture',
    description: 'Mixture-of-experts model balancing efficiency and intellect',
    rpm: 30,
    rpd: 1500,
    tpm: '500,000',
    maxTokens: '128,000',
  },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

export function getActiveModelLimitInfo(modelId?: string): ModelLimitInfo {
  const currentId = modelId || getGeminiModel() || DEFAULT_GEMINI_MODEL;
  const match = AVAILABLE_GEMINI_MODELS.find((m) => m.id === currentId);
  return {
    modelId: currentId,
    modelName: match?.name || currentId,
    rpm: match?.rpm ?? 15,
    rpd: match?.rpd ?? 1500,
    tpm: match?.tpm ?? '1,000,000',
    maxTokens: match?.maxTokens ?? '1,000,000',
  };
}

export const getEnvGeminiApiKey = (): string => {
  const envVal = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  return envVal.trim();
};

export const hasEnvGeminiApiKey = (): boolean => {
  const envKey = getEnvGeminiApiKey();
  return Boolean(envKey && !envKey.includes('your-gemini-api-key'));
};

export const getGeminiApiKey = (): string => {
  try {
    const local = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    // ignore storage error
  }
  return getEnvGeminiApiKey();
};

export const setGeminiApiKey = (key: string): void => {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
};

export const removeGeminiApiKey = (): void => {
  try {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const getGeminiModel = (): string => {
  try {
    const local = localStorage.getItem(GEMINI_MODEL_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    // ignore
  }
  return DEFAULT_GEMINI_MODEL;
};

export const setGeminiModel = (model: string): void => {
  try {
    if (model.trim()) {
      localStorage.setItem(GEMINI_MODEL_KEY, model.trim());
    }
  } catch {
    // ignore
  }
};

/**
 * Parses either the modern Interactions API format or standard generateContent format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractResponseText(data: any): string {
  // 1. Direct output_text convenience property (Interactions API)
  if (data?.output_text && typeof data.output_text === 'string') {
    return data.output_text.trim();
  }

  // 2. Trailing model_output steps (Interactions API)
  if (Array.isArray(data?.steps)) {
    for (let i = data.steps.length - 1; i >= 0; i--) {
      const step = data.steps[i];
      if (step?.type === 'model_output' || step?.role === 'model') {
        if (Array.isArray(step.content)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parts = step.content.map((c: any) => (typeof c === 'string' ? c : c.text || '')).filter(Boolean);
          if (parts.length > 0) return parts.join(' ').trim();
        } else if (typeof step.content === 'string') {
          return step.content.trim();
        }
      }
    }
  }

  // 3. Fallback candidates format (generateContent endpoint)
  if (data?.candidates?.[0]?.content?.parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = data.candidates[0].content.parts.map((p: any) => p.text || '').filter(Boolean);
    if (parts.length > 0) return parts.join(' ').trim();
  }

  return '';
}

/**
 * Tests connection with the Google Gemini API using the Interactions API
 * and gracefully falls back to generateContent.
 */
export const testGeminiApiKey = async (
  key: string,
  modelToTest?: string
): Promise<{ success: boolean; message: string }> => {
  const cleanKey = key.trim();
  if (!cleanKey) {
    return { success: false, message: 'Please enter your Google Gemini API key.' };
  }

  const activeModel = modelToTest?.trim() || getGeminiModel() || DEFAULT_GEMINI_MODEL;
  const modelMeta = AVAILABLE_GEMINI_MODELS.find((m) => m.id === activeModel);
  const modelName = modelMeta?.name || activeModel;

  // 1. Try modern Interactions API first
  try {
    const interactionsUrl = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(cleanKey)}`;
    const res = await fetch(interactionsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        input: 'Say "Connected" to confirm connection.',
      }),
    });

    if (res.ok) {
      return {
        success: true,
        message: `Connected successfully to ${modelName} via Google Interactions API!`,
      };
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback to generateContent endpoint
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with the word "Connected" to test connection.' }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}: Failed to authenticate with Google Gemini.`;
      return { success: false, message: msg };
    }

    return {
      success: true,
      message: `Connected successfully to ${modelName}!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error testing Gemini API.';
    return { success: false, message: errorMsg };
  }
};

const SYSTEM_INSTRUCTION = `You are the Coherent AI Care Companion, a compassionate, warm, and supportive mental health companion.
Your goal is to actively listen, validate feelings with empathy, suggest gentle breathing or mindfulness techniques when appropriate, and foster a safe, reflective space.
Keep responses concise (2 to 4 sentences unless the user invites deeper reflection) and warm.
If the user indicates active self-harm or severe emergency, compassionately provide crisis hotline info: "If you are in distress or feel unsafe, please call or text 988 (Suicide & Crisis Lifeline) available 24/7."`;

function getBuiltInCompanionResponse(
  _history: { sender: 'user' | 'assistant'; text: string }[],
  prompt: string
): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('hurt') || lower.includes('die') || lower.includes('suicide') || lower.includes('kill')) {
    return "If you are in distress or feel unsafe, please know that you are not alone. You can call or text 988 anytime to reach the Suicide & Crisis Lifeline (24/7 free and confidential support). I'm also right here with you.";
  }

  if (lower.includes('breath') || lower.includes('panic') || lower.includes('anxious') || lower.includes('anxiety')) {
    return "Take a slow, gentle breath in with me... hold it softly for four counts... and let it out slowly. Anxiety can feel intense, but you are safe in this moment. What is one small thing around you that brings a little comfort?";
  }

  if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('tired') || lower.includes('night')) {
    return "Resting your mind when your thoughts are running can be tough. Try letting your shoulders drop away from your ears, unclench your jaw, and take three deep breaths. What has been occupying your mind tonight?";
  }

  if (lower.includes('sad') || lower.includes('cry') || lower.includes('depress') || lower.includes('lonely') || lower.includes('alone')) {
    return "I hear how heavy things feel right now. It is completely okay to feel this way, and you don't have to carry all of it on your own. I'm right here beside you whenever you want to share.";
  }

  if (lower.includes('work') || lower.includes('deadline') || lower.includes('stress') || lower.includes('overwhelm')) {
    return "That sounds like a lot to navigate all at once. Remember that taking a pause isn't falling behind—it's giving yourself the space you need. What feels like the heaviest piece right now?";
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm your care companion. How are you holding up today? Whatever you're feeling, there's always a safe space for you here.";
  }

  if (lower.includes('thank')) {
    return "You're so welcome. Be gentle with yourself today—you are doing your best, and that is more than enough.";
  }

  return "Thank you for sharing that with me. It takes real courage to open up. Take all the time you need—what feels most important for you right now?";
}

export interface CompanionResponse {
  text: string;
  tokensUsed: number;
  promptTokens?: number;
  candidateTokens?: number;
}

/**
 * Calls Gemini using the modern Interactions API with automatic fallback.
 * Extracts real-time token usage metadata from the response.
 */
export const callGeminiCompanion = async (
  history: { sender: 'user' | 'assistant'; text: string }[],
  newPrompt: string,
  apiKey?: string,
  modelOverride?: string
): Promise<CompanionResponse> => {
  const activeKey = apiKey?.trim() || getGeminiApiKey();
  const activeModel = modelOverride?.trim() || getGeminiModel() || DEFAULT_GEMINI_MODEL;

  // Optional: If no key is provided, provide built-in compassionate care response
  if (!activeKey) {
    const builtIn = getBuiltInCompanionResponse(history, newPrompt);
    const approxTokens = Math.max(16, Math.ceil((newPrompt.length + builtIn.length) / 3.8));
    return {
      text: builtIn,
      tokensUsed: approxTokens,
    };
  }

  // Build conversational context for Interactions API
  const contextSummary = history
    .slice(-6)
    .map((m) => `${m.sender === 'user' ? 'Member' : 'Companion'}: ${m.text}`)
    .join('\n');
  const interactionInput = contextSummary
    ? `Recent dialogue:\n${contextSummary}\n\nMember: ${newPrompt}`
    : newPrompt;

  // 1. Try Interactions API first
  try {
    const interactionsUrl = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(activeKey)}`;
    const intResponse = await fetch(interactionsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        input: interactionInput,
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
      }),
    });

    if (intResponse.ok) {
      const data = await intResponse.json();
      const text = extractResponseText(data);
      const usage = data.usage_metadata || data.usageMetadata;
      const tokens =
        usage?.total_token_count ||
        usage?.totalTokenCount ||
        Math.max(16, Math.ceil((newPrompt.length + (text?.length || 0)) / 3.8));

      if (text) {
        return {
          text,
          tokensUsed: tokens,
          promptTokens: usage?.prompt_token_count || usage?.promptTokenCount,
          candidateTokens: usage?.candidates_token_count || usage?.candidatesTokenCount,
        };
      }
    }
  } catch {
    // Fall through to generateContent
  }

  // 2. Fallback to generateContent
  try {
    const contents = [
      ...history.slice(-8).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      {
        role: 'user',
        parts: [{ text: newPrompt }],
      },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(activeKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('Gemini API Error:', err);
      const fallbackText = "I'm listening and here beside you. Take a slow, gentle breath. What's on your mind right now?";
      return {
        text: fallbackText,
        tokensUsed: Math.max(16, Math.ceil((newPrompt.length + fallbackText.length) / 3.8)),
      };
    }

    const data = await response.json();
    const candidateText = extractResponseText(data);
    const usage = data.usageMetadata;
    const tokens =
      usage?.totalTokenCount ||
      Math.max(16, Math.ceil((newPrompt.length + (candidateText?.length || 0)) / 3.8));

    return {
      text:
        candidateText ||
        "I'm listening closely. Please take your time, I am right here with you.",
      tokensUsed: tokens,
      promptTokens: usage?.promptTokenCount,
      candidateTokens: usage?.candidatesTokenCount,
    };
  } catch (error) {
    console.error('Gemini companion network error:', error);
    const netFallback = "I'm right here with you. Take a slow, deep breath, and share whatever feels comfortable.";
    return {
      text: netFallback,
      tokensUsed: Math.max(16, Math.ceil((newPrompt.length + netFallback.length) / 3.8)),
    };
  }
};
