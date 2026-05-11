// Yousuf Rice AI Agent — shared OpenRouter client
export interface AgentConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export function createAgentClient(config: AgentConfig) {
  const baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  const model = config.model || 'inclusionai/ring-2.6-1t:free';

  return {
    async chat(messages: Array<{ role: string; content: string }>) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://yousufrice.com',
          'X-Title': 'Yousuf Rice AI Assistant',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI request failed: ${res.status} ${await res.text()}`);
      }

      return res.json();
    },
  };
}
