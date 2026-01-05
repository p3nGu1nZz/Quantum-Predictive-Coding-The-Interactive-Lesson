import React, { useEffect, useRef, useState } from 'react';

interface ProceduralBackgroundAudioProps {
  isPlaying: boolean;
  isNarrating: boolean; // Signal to duck volume
  volume?: number;
  mode?: 'title' | 'lesson'; // New prop to control audio intensity/filter
}

// IndexedDB configuration for Music Cache
const DB_NAME = 'QuantumPCN_MusicDB';
const STORE_NAME = 'music_tracks';
const TRACK_KEY = 'cyberpunk_midtempo_v2'; // Bump version to force regen

export const ProceduralBackgroundAudio: React.FC<ProceduralBackgroundAudioProps> = ({ 
  isPlaying, 
  isNarrating, 
  volume = 0.4,
  mode = 'lesson'
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null); // For mode transitions
  const [isReady, setIsReady] = useState(false);

  // --- Music Generation Logic ---
  const generateTrack = async (sampleRate: number): Promise<AudioBuffer> => {
    const duration = 60; // 60 seconds loop
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const bpm = 80; // Slightly slower for more cinematic feel
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

  // --- IndexedDB Management ---
  const getCachedTrack = async (db: IDBDatabase): Promise<AudioBuffer | null> => {
      return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(TRACK_KEY);
          req.onsuccess = () => {
              if (req.result && audioContextRef.current) {
                  // If we stored raw data, decode is needed, but we stored structure.
                  // Simpler: Just regen if complex storage is hard. 
                  // For this demo, let's regen to be safe and consistent without complex serialization.
                  resolve(null); 
              } else {
                  resolve(null);
              }
          };
          req.onerror = () => resolve(null);
      });
  };

  const startPlayback = (ctx: AudioContext, buffer: AudioBuffer) => {
      // Create Filter for Title/Lesson Mode Transition
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = mode === 'title' ? 400 : 20000;
      filter.Q.value = 1;
      filterNodeRef.current = filter;

      const gain = ctx.createGain();
      gain.gain.value = volume;
      gainNodeRef.current = gain;

      // Chain: Source -> Filter -> Gain -> Destination
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
       const buffer = await generateTrack(ctx.sampleRate);
       startPlayback(ctx, buffer);
  };

  useEffect(() => {
    // Initialize Audio Context on first play request
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

      // Smooth transition between muffled and clear
      if (mode === 'title') {
          filter.frequency.exponentialRampToValueAtTime(400, t + 2); // Muffle
      } else {
          filter.frequency.exponentialRampToValueAtTime(20000, t + 4); // Open up slowly
      }
  }, [mode]);

  // Documentary Style Mixing (Ducking)
  useEffect(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    
    // Documentary mix: Background music drops significantly when voice is active
    const target = isNarrating ? volume * 0.2 : volume; 
    
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(target, now, 0.8); // Slower fade for cinematic feel

  }, [isNarrating, volume]);

  useEffect(() => {
      return () => {
          // Cleanup on unmount (though we moved this to App top level so it shouldn't unmount often)
          if (sourceNodeRef.current) sourceNodeRef.current.stop();
          if (audioContextRef.current) audioContextRef.current.close();
      };
  }, []);

  return null;
};