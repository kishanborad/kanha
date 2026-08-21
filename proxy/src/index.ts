import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { chatRoute } from './routes/chat.js';
import { modelsRoute } from './routes/models.js';
import { searchRoute } from './routes/search.js';
import { healthRoute } from './routes/health.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(corsMiddleware);
app.use(express.json());

app.post('/api/chat', chatRoute);
app.get('/api/models', modelsRoute);
app.post('/api/search', searchRoute);
app.get('/api/health', healthRoute);

app.listen(PORT, () => {
  console.log(`Kanha proxy running on port ${PORT}`);
});
