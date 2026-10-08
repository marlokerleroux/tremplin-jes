import path from 'node:path';
export const root = process.cwd();
export const dataDir = path.join(root, 'data');
export const config = {
  site: process.env.SITE_URL || 'https://www.tremplin-jeunes-en-scene.fr',
  key: process.env.OPENROUTER_API_KEY || '',
  model: process.env.CHAT_MODEL || 'google/gemini-3.1-flash-lite',
  embedding: process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small',
  transcription: process.env.TRANSCRIPTION_MODEL || 'openai/whisper-large-v3-turbo',
  port: Number(process.env.PORT || 3000), host: process.env.HOST || '127.0.0.1',
};
