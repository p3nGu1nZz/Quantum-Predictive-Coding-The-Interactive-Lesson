import React, { useEffect, useRef, useState } from 'react';

interface ProceduralBackgroundAudioProps {
  isPlaying: boolean;
  isNarrating: boolean; // Signal to duck volume
  volume?: number;
}

// IndexedDB configuration for Music Cache
const DB_NAME = 'QuantumPCN_MusicDB';
const STORE_NAME = 'music_tracks';
const TRACK_KEY = 'cyberpunk_midtempo_v1';

export const ProceduralBackgroundAudio: React.FC<ProceduralBackgroundAudioProps> = ({ 
  isPlaying, 
  isNarrating, 
  volume = 0.4 
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isReady, setIsReady] = useState(false);

  // --- Music Generation Logic ---
  const generateTrack = async (sampleRate: number): Promise<AudioBuffer> => {
    const duration = 60; // 60 seconds loop
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const bpm = 90;
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
    bassFilter.frequency.value = 150;
    const bassLfo = offlineCtx.createOscillator();
    bassLfo.type = 'sine';
    bassLfo.frequency.value = 0.1; // Slow movement
    const bassLfoGain = offlineCtx.createGain();
    bassLfoGain.gain.value = 50;
    
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
    padLfo.frequency.value = 0.2;
    padLfo.connect(padPan.pan);

    padOsc.connect(padGain).connect(padPan).connect(masterGain);
    padOsc.connect(padGain).connect(delay); // Send to delay
    padOsc.start(0);
    padLfo.start(0);

    // 3. Kick Drum (Midtempo Heartbeat)
    const kickGain = offlineCtx.createGain();
    kickGain.connect(masterGain);
    
    for (let i = 0; i < totalBeats; i++) {
        if (i % 4 === 0 || i % 4 === 2.5) { // Simple pattern
            const t = i * beatTime;
            const osc = offlineCtx.createOscillator();
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(1, t);
            env.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            osc.connect(env).connect(kickGain);
            osc.start(t);
            osc.stop(t + 0.5);
        }
    }

    // 4. Hi-Hats / Clicks (Cyberpunk Texture)
    const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.1, sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

    const hatGain = offlineCtx.createGain();
    hatGain.gain.value = 0.05;
    hatGain.connect(masterGain);

    for (let i = 0; i < totalBeats * 4; i++) { // 16th notes
        if (i % 4 !== 0) { // Skip beat
            const t = i * (beatTime / 4);
            const src = offlineCtx.createBufferSource();
            src.buffer = noiseBuffer;
            
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 8000;
            
            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(0.3, t);
            env.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

            src.connect(filter).connect(env).connect(hatGain);
            src.start(t);
        }
    }

    // 5. Arpeggio (Tech feel)
    const arpGain = offlineCtx.createGain();
    arpGain.gain.value = 0.03;
    arpGain.connect(delay); // Heavy delay

    const notes = [293.66, 349.23, 440.00, 523.25]; // D Minor 7
    for (let i = 0; i < totalBeats * 2; i++) {
        if (Math.random() > 0.4) {
            const t = i * (beatTime / 2);
            const osc = offlineCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = notes[i % 4];
            
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, t);
            filter.frequency.linearRampToValueAtTime(2000, t + 0.1);

            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(0, t);
            env.gain.linearRampToValueAtTime(0.5, t + 0.01);
            env.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

            osc.connect(filter).connect(env).connect(arpGain);
            osc.start(t);
            osc.stop(t + 0.3);
        }
    }

    return await offlineCtx.startRendering();
  };

  // --- IndexedDB Management ---
  const getCachedTrack = async (db: IDBDatabase): Promise<AudioBuffer | null> => {
      return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(TRACK_KEY);
          req.onsuccess = () => {
              if (req.result && audioContextRef.current) {
                  // Decode stored array buffer
                  audioContextRef.current.decodeAudioData(req.result).then(resolve).catch(() => resolve(null));
              } else {
                  resolve(null);
              }
          };
          req.onerror = () => resolve(null);
      });
  };

  const saveTrackToCache = (db: IDBDatabase, buffer: AudioBuffer) => {
      // We need to convert AudioBuffer back to ArrayBuffer/WAV to store, 
      // OR mostly simply store the channel data, but AudioBuffer isn't directly serializable in all browsers.
      // Easiest is to encode to WAV or just rely on raw PCM floats if space permits.
      // For simplicity here, we re-render as WAV blob or just store the raw buffer if supported.
      // Actually, standard AudioContext.decodeAudioData takes an ArrayBuffer. 
      // To cache, we assume we generated it. 
      // *Correction*: We can't easily turn AudioBuffer back to ArrayBuffer for decodeAudioData without a wav encoder.
      // Instead, we will store the raw Float32Arrays.
      
      const channels = [];
      for(let i=0; i<buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
      
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
          channels,
          sampleRate: buffer.sampleRate,
          length: buffer.length
      }, TRACK_KEY);
  };

  const loadFromCacheOrGenerate = async (ctx: AudioContext) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
          }
      };

      request.onsuccess = async (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.get(TRACK_KEY);
          
          getReq.onsuccess = async () => {
              if (getReq.result) {
                  // Reconstruct AudioBuffer
                  const data = getReq.result;
                  const newBuffer = ctx.createBuffer(data.channels.length, data.length, data.sampleRate);
                  for(let i=0; i<data.channels.length; i++) {
                      newBuffer.copyToChannel(data.channels[i], i);
                  }
                  startPlayback(ctx, newBuffer);
              } else {
                  // Generate
                  const buffer = await generateTrack(ctx.sampleRate);
                  // Cache
                  saveTrackToCache(db, buffer);
                  startPlayback(ctx, buffer);
              }
          };
          getReq.onerror = async () => {
              const buffer = await generateTrack(ctx.sampleRate);
              startPlayback(ctx, buffer);
          }
      };
  };

  const startPlayback = (ctx: AudioContext, buffer: AudioBuffer) => {
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.value = volume;
      gainNodeRef.current = gain;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start(0);
      sourceNodeRef.current = source;
      setIsReady(true);
  };

  useEffect(() => {
    if (isPlaying && !isReady && !audioContextRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        loadFromCacheOrGenerate(ctx);
    } else if (audioContextRef.current) {
        if (isPlaying) audioContextRef.current.resume();
        else audioContextRef.current.suspend();
    }
  }, [isPlaying, isReady]);

  // Documentary Style Mixing (Ducking)
  useEffect(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    
    // Documentary mix: Background music drops significantly when voice is active
    // Voice usually -10dB to -6dB, Music -20dB to -30dB
    const target = isNarrating ? volume * 0.15 : volume; 
    
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(target, now, 0.8); // Slower fade for cinematic feel

  }, [isNarrating, volume]);

  useEffect(() => {
      return () => {
          if (sourceNodeRef.current) sourceNodeRef.current.stop();
          if (audioContextRef.current) audioContextRef.current.close();
      };
  }, []);

  return null;
};