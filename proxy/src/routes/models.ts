import type { Request, Response } from 'express';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

export async function modelsRoute(_req: Request, res: Response) {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.json({ models: [] });
  }
}
