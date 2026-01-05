import React, { useEffect, useRef, useState } from 'react';

interface ProceduralBackgroundAudioProps {
  isPlaying: boolean;
  volume?: number;
  mode?: 'title' | 'lesson'; // 'title' = muffled, 'lesson' = clear
}

// IndexedDB configuration for Music Cache
const DB_NAME = 'QuantumPCN_MusicDB';
const STORE_NAME = 'music_tracks';
const TRACK_KEY = 'cyberpunk_midtempo_v3_cached'; 

const openMusicDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (evt) => {
            const db = (evt.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const ProceduralBackgroundAudio: React.FC<ProceduralBackgroundAudioProps> = ({ 
  isPlaying, 
  volume = 0.4,
  mode = 'lesson'
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null); 
  const [isReady, setIsReady] = useState(false);

  // --- Music Generation Logic ---
  const generateTrack = async (ctx: AudioContext): Promise<AudioBuffer> => {
    const sampleRate = ctx.sampleRate;
    const duration = 60; // 60 seconds loop
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const bpm = 80; 
    const beatTime = 60 / bpm;
    const totalBeats = Math.floor(duration / beatTime);

    // Master Bus
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(offlineCtx.destination);

    // Reverb Effect (Simple Convolution Approximation or Delay)
    const delay = offlineCtx.createDelay();
    delay.delayTime.value = beatTime * 0.75; // Dotted 8th
    const delayFeedback = offlineCtx.createGain();
    delayFeedback.gain.value = 0.3;
    const delayFilter = offlineCtx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2000;
    
    delay.connect(delayFeedback);
    delayFeedback.connect(delayFilter);
    delayFilter.connect(delay);
    delay.connect(masterGain);

    // 1. Deep Bass Drone (The foundation)
    const bassOsc = offlineCtx.createOscillator();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.value = 36.71; // D1
    const bassFilter = offlineCtx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 120;
    const bassLfo = offlineCtx.createOscillator();
    bassLfo.type = 'sine';
    bassLfo.frequency.value = 0.1; // Slow movement
    const bassLfoGain = offlineCtx.createGain();
    bassLfoGain.gain.value = 40;
    
    bassLfo.connect(bassLfoGain).connect(bassFilter.frequency);
    bassOsc.connect(bassFilter).connect(masterGain);
    bassOsc.start(0);
    bassLfo.start(0);

    // 2. Pad / Atmosphere
    const padOsc = offlineCtx.createOscillator();
    padOsc.type = 'triangle';
    padOsc.frequency.value = 146.83; // D3
    const padGain = offlineCtx.createGain();
    padGain.gain.value = 0.05;
    const padPan = offlineCtx.createStereoPanner();
    const padLfo = offlineCtx.createOscillator();
    padLfo.frequency.value = 0.15;
    padLfo.connect(padPan.pan);

    padOsc.connect(padGain).connect(padPan).connect(masterGain);
    padOsc.connect(padGain).connect(delay); // Send to delay
    padOsc.start(0);
    padLfo.start(0);

    // 3. Arpeggio (Tech feel)
    const arpGain = offlineCtx.createGain();
    arpGain.gain.value = 0.03;
    arpGain.connect(delay); // Heavy delay

    const notes = [293.66, 349.23, 440.00, 523.25, 293.66, 440.00, 349.23, 261.63]; // D Minor extended
    for (let i = 0; i < totalBeats * 4; i++) { // 16th notes
        if (Math.random() > 0.6) {
            const t = i * (beatTime / 4);
            const osc = offlineCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = notes[i % 8];
            
            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(0, t);
            env.gain.linearRampToValueAtTime(0.4, t + 0.01);
            env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

            osc.connect(env).connect(arpGain);
            osc.start(t);
            osc.stop(t + 0.25);
        }
    }

    return await offlineCtx.startRendering();
  };

  const getCachedTrack = async (): Promise<ArrayBuffer | null> => {
      try {
          const db = await openMusicDB();
          return new Promise((resolve) => {
              const tx = db.transaction(STORE_NAME, 'readonly');
              const store = tx.objectStore(STORE_NAME);
              const req = store.get(TRACK_KEY);
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => resolve(null);
          });
      } catch (e) {
          console.error("Music DB Read Error", e);
          return null;
      }
  };

  const saveTrackToCache = async (buffer: AudioBuffer) => {
      try {
          // Convert AudioBuffer to ArrayBuffer (interleaved) for storage
          const ch0 = buffer.getChannelData(0);
          const ch1 = buffer.getChannelData(1);
          const len = ch0.length;
          const interleaved = new Float32Array(len * 2);
          for(let i=0; i<len; i++) {
              interleaved[i*2] = ch0[i];
              interleaved[i*2+1] = ch1[i];
          }
          
          const db = await openMusicDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(interleaved.buffer, TRACK_KEY);
      } catch (e) {
          console.error("Music DB Write Error", e);
      }
  };

  const arrayBufferToAudioBuffer = (ab: ArrayBuffer, ctx: AudioContext): AudioBuffer => {
      const float32 = new Float32Array(ab);
      const len = float32.length / 2;
      const audioBuffer = ctx.createBuffer(2, len, ctx.sampleRate);
      const ch0 = audioBuffer.getChannelData(0);
      const ch1 = audioBuffer.getChannelData(1);
      for(let i=0; i<len; i++) {
          ch0[i] = float32[i*2];
          ch1[i] = float32[i*2+1];
      }
      return audioBuffer;
  };

  const startPlayback = (ctx: AudioContext, buffer: AudioBuffer) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = mode === 'title' ? 400 : 20000;
      filter.Q.value = 1;
      filterNodeRef.current = filter;

      const gain = ctx.createGain();
      gain.gain.value = volume;
      gainNodeRef.current = gain;

      filter.connect(gain);
      gain.connect(ctx.destination);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(filter);
      source.start(0);
      sourceNodeRef.current = source;
      setIsReady(true);
  };

  const loadAndPlay = async (ctx: AudioContext) => {
       // 1. Try Cache
       const cachedAB = await getCachedTrack();
       if (cachedAB) {
           const buffer = arrayBufferToAudioBuffer(cachedAB, ctx);
           startPlayback(ctx, buffer);
       } else {
           // 2. Generate
           const buffer = await generateTrack(ctx);
           // 3. Save
           saveTrackToCache(buffer);
           startPlayback(ctx, buffer);
       }
  };

  useEffect(() => {
    if (isPlaying && !isReady && !audioContextRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        loadAndPlay(ctx);
    } else if (audioContextRef.current) {
        if (isPlaying) audioContextRef.current.resume();
        else audioContextRef.current.suspend();
    }
  }, [isPlaying, isReady]);

  // Handle Mode Changes (Title vs Lesson)
  useEffect(() => {
      if (!filterNodeRef.current || !audioContextRef.current) return;
      const t = audioContextRef.current.currentTime;
      const filter = filterNodeRef.current;
      if (mode === 'title') {
          filter.frequency.exponentialRampToValueAtTime(400, t + 2); 
      } else {
          filter.frequency.exponentialRampToValueAtTime(20000, t + 4); 
      }
  }, [mode]);

  useEffect(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(volume, now, 0.5); 
  }, [volume]);

  useEffect(() => {
      return () => {
          if (sourceNodeRef.current) sourceNodeRef.current.stop();
          if (audioContextRef.current) audioContextRef.current.close();
      };
  }, []);

  return null;
};