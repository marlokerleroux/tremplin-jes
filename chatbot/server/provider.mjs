import { config } from './config.mjs';
export async function openrouter(endpoint, body, signal) {
  if (!config.key) throw new Error('MISSING_API_KEY');
  const response = await fetch(`https://openrouter.ai/api/v1/${endpoint}`, {
    method: 'POST', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(40000)]) : AbortSignal.timeout(40000),
    headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json', 'HTTP-Referer': config.site, 'X-Title': 'Tremplin - En coulisses' },
    body: JSON.stringify(body),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`PROVIDER_${response.status}`); }
  const data = await response.json();
  if (data.error) throw new Error('PROVIDER_RESPONSE_ERROR');
  return data;
}
export async function embed(input, signal) {
  const result = await openrouter('embeddings', { model: config.embedding, input, encoding_format: 'float' }, signal);
  const vectors = result.data?.sort((a,b) => a.index - b.index).map(x => x.embedding);
  if (!vectors || vectors.length !== input.length || vectors.some(v => !Array.isArray(v) || !v.length || v.some(n => !Number.isFinite(n)))) throw new Error('INVALID_EMBEDDINGS');
  return vectors;
}
