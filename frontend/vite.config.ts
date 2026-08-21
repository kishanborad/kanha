import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import react from '@vitejs/plugin-react';

const __dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dir, '');
  return {
    plugins: [react()],
    base: env.VITE_BASE || '/kanha/',
    build: { sourcemap: false },
  };
});
