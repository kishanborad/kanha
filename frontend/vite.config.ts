import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [react()],
    base: env.VITE_BASE || '/kanha/',
    build: { sourcemap: false },
  };
});
