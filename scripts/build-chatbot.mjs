import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Compile only the browser widget; no Express process or local SQLite on Vercel.
await build({
  configFile: false,
  root: fileURLToPath(new URL('../chatbot', import.meta.url)),
  envDir: false,
  base: '/chatbot/',
  plugins: [react()],
  define: { 'import.meta.env.VITE_CHATBOT_API_BASE': JSON.stringify('/api/chatbot') },
  build: {
    outDir: fileURLToPath(new URL('../public/chatbot', import.meta.url)),
    emptyOutDir: true,
  },
});
