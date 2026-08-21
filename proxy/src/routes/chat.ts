import type { Request, Response } from 'express';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequestBody {
  provider: string;
  model: string;
  messages: ChatMessage[];
  apiKey?: string;
}

export async function chatRoute(req: Request, res: Response) {
  const { provider, model, messages, apiKey } = req.body as ChatRequestBody;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    if (provider === 'ollama') {
      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      // O(n) — parse NDJSON lines from Ollama stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as { message?: { content?: string } };
            if (parsed.message?.content) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: parsed.message.content } }] })}\n\n`);
            }
          } catch { /* skip malformed line */ }
        }
      }
      res.write('data: [DONE]\n\n');

    } else if (provider === 'anthropic') {
      const systemMessage = messages.find((m) => m.role === 'system');
      const userMessages = messages.filter((m) => m.role !== 'system');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey ?? '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: userMessages,
          ...(systemMessage ? { system: systemMessage.content } : {}),
          stream: true,
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as {
              type: string;
              delta?: { text?: string };
            };
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: parsed.delta.text } }] })}\n\n`);
            }
          } catch { /* skip */ }
        }
      }
      res.write('data: [DONE]\n\n');

    } else if (provider === 'huggingface') {
      const hfToken = apiKey ?? process.env.HF_TOKEN ?? '';
      // HuggingFace Inference API — chat completions endpoint
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hfToken}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2048,
          stream: true,
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            break;
          }
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
            }
          } catch { /* skip */ }
        }
      }
      res.write('data: [DONE]\n\n');

    } else {
      res.write(`data: ${JSON.stringify({ error: `Unknown provider: ${provider}` })}\n\n`);
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
  }

  res.end();
}
