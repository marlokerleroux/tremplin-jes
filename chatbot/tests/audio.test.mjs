import test from 'node:test';
import assert from 'node:assert/strict';
process.env.OPENROUTER_API_KEY = 'test-only';
const { validateAudio, transcribe, MAX_AUDIO_BYTES } = await import('../server/audio.mjs');

test('audio validates browser containers and rejects disguised or oversized uploads', () => {
  const webm = Buffer.alloc(128); webm.writeUInt32BE(0x1a45dfa3);
  assert.equal(validateAudio(webm, 'audio/webm;codecs=opus').format, 'webm');
  const mp4 = Buffer.alloc(128); mp4.write('ftyp', 4);
  assert.equal(validateAudio(mp4, 'audio/mp4').format, 'm4a');
  const ogg = Buffer.alloc(128); ogg.write('OggS');
  assert.equal(validateAudio(ogg, 'audio/ogg;codecs=opus').format, 'ogg');
  assert.throws(() => validateAudio(webm, 'audio/mp4'));
  assert.throws(() => validateAudio(Buffer.from('<html>not an audio file</html>'), 'audio/webm'));
  assert.throws(() => validateAudio(Buffer.alloc(0), 'audio/webm'));
  assert.throws(() => validateAudio(Buffer.alloc(MAX_AUDIO_BYTES + 1), 'audio/webm'));
  assert.throws(() => validateAudio({ data: 'not a buffer' }, 'audio/webm'));
});

test('transcription requests French speech-to-text without sending chat history', async context => {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/audio/transcriptions');
    const body = JSON.parse(options.body);
    assert.equal(body.language, 'fr');
    assert.equal(body.response_format, 'verbose_json');
    assert.equal(body.messages, undefined);
    assert.deepEqual(body.input_audio, { data: 'test-audio', format: 'webm' });
    return Response.json({ text: ' Quand sont les auditions ? ' });
  });
  assert.deepEqual(await transcribe({ data: 'test-audio', format: 'webm' }), { text: 'Quand sont les auditions ?' });
});

test('empty, silent and oversized transcriptions never become a chat message', async context => {
  let result;
  context.mock.method(globalThis, 'fetch', async () => Response.json(result));
  for (result of [{ text: '' }, { text: 'Merci.', segments: [{ no_speech_prob: 0.99 }] }, { text: 'x'.repeat(1501) }, { text: null }]) {
    const response = await transcribe({ data: 'test-audio', format: 'webm' });
    assert.equal(response.status, 422);
    assert.equal(response.text, undefined);
  }
});
