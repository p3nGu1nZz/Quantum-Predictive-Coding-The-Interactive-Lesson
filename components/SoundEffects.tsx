import React, { useEffect, useRef } from 'react';
import { ScriptedEvent } from '../types';

interface SoundEffectsProps {
    trigger: ScriptedEvent | null;
    soundEnabled: boolean;
}

export const SoundEffects: React.FC<SoundEffectsProps> = ({ trigger, soundEnabled }) => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getContext = () => {
        if (!soundEnabled) return null;
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    const playSound = (type: string) => {
        const ctx = getContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);

        switch (type) {
            case 'pulse':
                // Soft sine swell
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, t);
                osc.frequency.exponentialRampToValueAtTime(440, t + 0.1);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
                osc.start(t);
                osc.stop(t + 0.8);
                break;
            case 'shake':
                // Low rumble/thud
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(80, t);
                osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                osc.start(t);
                osc.stop(t + 0.4);
                break;
            case 'spawn':
            case 'highlight':
                // High tech ping
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, t);
                osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
                break;
            case 'force':
                // Swish noise
                const bufferSize = ctx.sampleRate * 0.5;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(400, t);
                noiseFilter.frequency.linearRampToValueAtTime(1000, t + 0.2);
                
                noise.connect(noiseFilter).connect(gain);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                noise.start(t);
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        if (trigger) {
            playSound(trigger.type);
        }
    }, [trigger]);

    return null;
};