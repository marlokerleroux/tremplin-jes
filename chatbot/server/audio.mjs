import { config } from './config.mjs';
import { openrouter } from './provider.mjs';

export const MAX_AUDIO_BYTES = 2 * 1024 * 1024;

export function validateAudio(body, contentType = '') {
  if (!Buffer.isBuffer(body) || body.length < 64 || body.length > MAX_AUDIO_BYTES) {
    throw new Error('Enregistrement vide ou trop volumineux. Enregistre une question plus courte.');
  }
  const mime = contentType.split(';')[0].trim().toLowerCase();
  let format;
  if (mime === 'audio/webm' && body.readUInt32BE(0) === 0x1a45dfa3) format = 'webm';
  if (mime === 'audio/ogg' && body.toString('ascii', 0, 4) === 'OggS') format = 'ogg';
  if (['audio/mp4', 'audio/x-m4a'].includes(mime) && body.toString('ascii', 4, 8) === 'ftyp') format = 'm4a';
  if (['audio/wav', 'audio/x-wav'].includes(mime) && body.toString('ascii', 0, 4) === 'RIFF' && body.toString('ascii', 8, 12) === 'WAVE') format = 'wav';
  if (!format) throw new Error('Format audio non reconnu. Réessaie avec ton micro ou écris ta question.');
  return { data: body.toString('base64'), format };
}

export async function transcribe(inputAudio, signal) {
  const result = await openrouter('audio/transcriptions', {
    model: config.transcription,
    input_audio: inputAudio,
    language: 'fr',
    temperature: 0,
    response_format: 'verbose_json',
  }, signal);
  const silent = result.segments?.length && result.segments.every(segment => segment.no_speech_prob > 0.8);
  const text = typeof result.text === 'string' ? result.text.trim() : '';
  if (!text || silent) return { error: 'Je n’ai pas entendu de paroles. Rapproche-toi du micro et réessaie.', status: 422 };
  if (text.length > 1500) return { error: 'Ton vocal dépasse 1 500 caractères. Enregistre une question plus courte.', status: 422 };
  return { text };
}
