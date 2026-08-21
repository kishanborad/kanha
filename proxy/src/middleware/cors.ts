import cors from 'cors';

export const corsMiddleware = cors({
  origin: ['http://localhost:5173', 'https://kishanborad.github.io'],
  methods: ['GET', 'POST'],
});
