import type { Request, Response } from 'express';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

export async function healthRoute(_req: Request, res: Response) {
  let ollamaOk = false;
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`);
    ollamaOk = r.ok;
  } catch { /* ollama not running */ }
  res.json({ status: 'ok', ollama: ollamaOk });
}
