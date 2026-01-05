import React, { useEffect, useRef } from 'react';

interface ProceduralBackgroundAudioProps {
  isPlaying: boolean;
  isNarrating: boolean; // Signal to duck volume
  volume?: number;
}

export const ProceduralBackgroundAudio: React.FC<ProceduralBackgroundAudioProps> = ({ 
  isPlaying, 
  isNarrating, 
  volume = 0.4 
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfosRef = useRef<OscillatorNode[]>([]);
  const isInitializedRef = useRef(false);

  // Setup the Audio Graph
  const initAudio = () => {
    if (isInitializedRef.current) return;
    
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    audioContextRef.current = ctx;

    // Master Gain for Volume Control / Ducking
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0; // Start silent
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // --- DRONE LAYER 1: Deep Sawtooth (Bass) ---
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55; // A1
    
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 120; // Dark tone

    const gain1 = ctx.createGain();
    gain1.gain.value = 0.15;

    osc1.connect(filter1).connect(gain1).connect(masterGain);
    oscillatorsRef.current.push(osc1);

    // --- DRONE LAYER 2: Detuned Sine (Atmosphere) ---
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 110.5; // A2 slightly sharp for beating

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.1;

    // LFO for panning/movement
    const panNode = ctx.createStereoPanner();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1; // Slow sweep
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain).connect(panNode.pan);
    
    osc2.connect(panNode).connect(gain2).connect(masterGain);
    oscillatorsRef.current.push(osc2);
    lfosRef.current.push(lfo);

    // --- DRONE LAYER 3: High Ethereal Shimmer ---
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.value = 220; // A3

    const filter3 = ctx.createBiquadFilter();
    filter3.type = 'highpass';
    filter3.frequency.value = 800;

    const gain3 = ctx.createGain();
    gain3.gain.value = 0.05;

    osc3.connect(filter3).connect(gain3).connect(masterGain);
    oscillatorsRef.current.push(osc3);

    // Start all
    oscillatorsRef.current.forEach(o => o.start());
    lfosRef.current.forEach(l => l.start());

    isInitializedRef.current = true;
  };

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying && !isInitializedRef.current) {
      initAudio();
    }

    if (audioContextRef.current) {
      if (isPlaying) {
        audioContextRef.current.resume();
      } else {
        audioContextRef.current.suspend();
      }
    }
  }, [isPlaying]);

  // Handle Ducking (Volume Control)
  useEffect(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    const target = isNarrating ? volume * 0.2 : volume; // Drop to 20% when narrating
    
    // Smooth transition
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(target, now, 0.5); // 0.5s time constant

  }, [isNarrating, volume]);

  // Cleanup
  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(o => o.stop());
      lfosRef.current.forEach(l => l.stop());
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return null;
};