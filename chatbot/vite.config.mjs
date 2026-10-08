import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { host: '127.0.0.1', watch:{ignored:['**/data/**','**/artifacts/**']}, fs:{deny:['.env','.env.*','**/.git/**','**/data/**','**/server/**','**/scripts/**']} }, build: { outDir: 'dist' } });
