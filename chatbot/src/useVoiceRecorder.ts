import { API_BASE } from './runtime';
import { useCallback, useEffect, useRef, useState } from 'react';

type VoiceState = 'idle' | 'permission' | 'recording' | 'transcribing';
const MAX_SECONDS = 60;
const MAX_BYTES = 2 * 1024 * 1024;

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const phase = useRef<VoiceState>('idle');
  const generation = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const transcriptCallback = useRef(onTranscript);
  transcriptCallback.current = onTranscript;

  function transition(next: VoiceState) { phase.current = next; setState(next); }
  const releaseMicrophone = useCallback(() => {
    clearInterval(timer.current); clearTimeout(deadline.current);
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }, []);
  const cancel = useCallback(() => {
    generation.current++;
    request.current?.abort(); request.current = null;
    const current = recorder.current;
    if (current) {
      current.onstop = null; current.ondataavailable = null; current.onerror = null;
      if (current.state !== 'inactive') current.stop();
    }
    recorder.current = null;
    releaseMicrophone();
    phase.current = 'idle'; setState('idle'); setSeconds(0); setError('');
  }, [releaseMicrophone]);

  useEffect(() => {
    const onHidden = () => { if (document.hidden && phase.current !== 'idle') cancel(); };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', cancel);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', cancel);
      cancel();
    };
  }, [cancel]);

  function stop() {
    const current = recorder.current;
    if (phase.current !== 'recording' || !current || current.state === 'inactive') return;
    transition('transcribing');
    current.stop();
    releaseMicrophone();
  }

  async function start() {
    if (phase.current !== 'idle') return;
    setError(''); setSeconds(0);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Le micro n’est pas disponible dans ce navigateur. Ouvre le site dans Safari, Chrome ou Firefox, ou écris ta question.');
      return;
    }
    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) { setError('Ce navigateur ne permet pas l’enregistrement vocal. Tu peux écrire ta question.'); return; }
    const run = ++generation.current;
    transition('permission');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }, video: false });
      // A late permission result must not reopen the mic after closing the widget.
      if (run !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const current = new MediaRecorder(media, { mimeType, audioBitsPerSecond: 64000 });
      recorder.current = current;
      const chunks: Blob[] = []; let bytes = 0;
      current.ondataavailable = event => {
        if (run !== generation.current || !event.data.size) return;
        bytes += event.data.size;
        if (bytes > MAX_BYTES) { cancel(); setError('Ce vocal est trop volumineux. Enregistre une question plus courte.'); return; }
        chunks.push(event.data);
      };
      current.onerror = () => { if (run === generation.current) { cancel(); setError('L’enregistrement a été interrompu. Réessaie le micro ou écris ta question.'); } };
      current.onstop = async () => {
        if (run !== generation.current) return;
        releaseMicrophone(); recorder.current = null; transition('transcribing');
        const controller = new AbortController(); request.current = controller;
        try {
          const audio = new Blob(chunks, { type: current.mimeType || mimeType });
          if (audio.size < 64) throw new Error('Je n’ai rien enregistré. Réessaie en parlant près du micro.');
          const response = await fetch(`${API_BASE}/transcribe`, {
            method: 'POST', headers: { 'Content-Type': audio.type }, body: audio,
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'La transcription a échoué. Réessaie ou écris ta question.');
          if (typeof result.text !== 'string' || !result.text.trim() || result.text.length > 1500) throw new Error('Le vocal n’a pas pu être transcrit. Réessaie ou écris ta question.');
          if (run === generation.current) transcriptCallback.current(result.text);
        } catch (cause) {
          if (run === generation.current && !controller.signal.aborted) setError(cause instanceof Error && !['TypeError', 'TimeoutError'].includes(cause.name) ? cause.message : 'La transcription prend trop de temps. Réessaie ou écris ta question.');
        } finally {
          if (run === generation.current) { request.current = null; transition('idle'); }
        }
      };
      current.start(250);
      transition('recording');
      const startedAt = Date.now();
      timer.current = setInterval(() => setSeconds(Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAt) / 1000))), 250);
      deadline.current = setTimeout(stop, MAX_SECONDS * 1000);
    } catch (cause) {
      if (run !== generation.current) return;
      releaseMicrophone(); recorder.current = null; transition('idle');
      const name = cause instanceof Error ? cause.name : '';
      setError(name === 'NotAllowedError' || name === 'SecurityError'
        ? 'Micro bloqué. Autorise le micro dans ton navigateur, ou écris ta question.'
        : name === 'NotFoundError' ? 'Aucun micro détecté. Branche un micro ou écris ta question.'
        : 'Impossible d’ouvrir le micro. Vérifie qu’il est disponible, ou écris ta question.');
    }
  }

  return { state, seconds, error, start, stop, cancel, clearError: () => setError(''), active: state !== 'idle' };
}
