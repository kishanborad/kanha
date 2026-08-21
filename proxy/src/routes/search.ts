import type { Request, Response } from 'express';

export async function searchRoute(req: Request, res: Response) {
  const { query, instance } = req.body as { query: string; instance: string };
  try {
    const response = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
