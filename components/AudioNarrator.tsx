import React, { useState, useEffect, useRef } from 'react';

interface AudioNarratorProps {
  text: string;
  onAutoNext: () => void;
  audioCache: Map<string, AudioBuffer>;
  audioContext: AudioContext | null;
  cacheVersion: number;
  onProgressUpdate?: (progress: number) => void;
  soundEnabled: boolean;
  playbackSpeed?: number;
  disabled?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void; // New Prop for BGM Ducking
}

export const AudioNarrator: React.FC<AudioNarratorProps> = ({ 
    text, 
    onAutoNext,
    audioCache,
    audioContext,
    cacheVersion,
    onProgressUpdate,
    soundEnabled,
    playbackSpeed = 1,
    disabled = false,
    onPlayStateChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  const currentTextRef = useRef<string | null>(null);
  
  const playbackSpeedRef = useRef(playbackSpeed);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);

  // Notify parent of play state for Music Ducking
  useEffect(() => {
    if (onPlayStateChange) onPlayStateChange(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Clean up on unmount or disable
  useEffect(() => {
    if (disabled) {
        stopAudio();
    }
    return () => stopAudio();
  }, [disabled]);

  // Effect to handle Playback triggers
  useEffect(() => {
    if (disabled) return;

    // 1. If text changed completely, we must stop previous audio
    if (text !== currentTextRef.current) {
        stopAudio();
        currentTextRef.current = text;
    }

    // 2. If we have a source node playing the current text, do NOT disturb it.
    if (sourceNodeRef.current) {
        return;
    }

    // 3. Trigger Playback
    if (text) {
        // If sound enabled, wait for cache. If disabled, play simulation immediately.
        if (!soundEnabled || (audioCache.has(text) && audioContext)) {
             // Small delay to ensure state settles
            const timer = setTimeout(() => playAudio(), 200);
            return () => clearTimeout(timer);
        }
    } 
  }, [text, audioCache, audioContext, cacheVersion, soundEnabled, disabled]); 

  const playAudio = () => {
    stopAudio(); 
    if (!text || disabled) return;

    // --- Silent Simulation Mode ---
    if (!soundEnabled) {
        const wordCount = text.split(/\s+/).length;
        // Estimate read time: 300ms per word, min 3s
        const duration = Math.max(3000, wordCount * 300); 
        
        let accumulatedTime = 0;
        let lastFrameTime = performance.now();
        setIsPlaying(true);

        const tick = () => {
            if (currentTextRef.current !== text || disabled) return; // Stale check
            
            const now = performance.now();
            const dt = now - lastFrameTime;
            lastFrameTime = now;
            
            // Dynamic speed adjustment logic
            accumulatedTime += dt * playbackSpeedRef.current;
            
            const p = Math.min(100, (accumulatedTime / duration) * 100);
            
            if (onProgressUpdate) onProgressUpdate(p);
            
            if (p < 100) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                setIsPlaying(false);
                // Trigger auto next
                // Use shorter timeout if speeding
                const nextDelay = playbackSpeedRef.current > 1 ? 500 : 3000; // Increased to 3s for readability
                autoNextTimeoutRef.current = setTimeout(() => {
                    if (!disabled) onAutoNext();
                }, nextDelay);
            }
        };
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
    }

    // --- Audio Playback Mode ---
    if (!audioContext || !audioCache.has(text)) return; 

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const buffer = audioCache.get(text)!;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null; 
        
        if (onProgressUpdate) onProgressUpdate(100);
        
        // Increased delay to 3000ms (3 seconds) to allow user to read the final step
        autoNextTimeoutRef.current = setTimeout(() => {
            if (!disabled) onAutoNext();
        }, 3000); 
    };

    source.start(0);
    startTimeRef.current = audioContext.currentTime;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    const updateProgress = () => {
        if (audioContext && sourceNodeRef.current === source && !disabled) {
            const current = audioContext.currentTime - startTimeRef.current;
            const dur = buffer.duration;
            const p = Math.min(100, (current / dur) * 100);
            
            if (onProgressUpdate) onProgressUpdate(p);
            
            if (p < 100) {
                animationFrameRef.current = requestAnimationFrame(updateProgress);
            }
        }
    };
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const stopAudio = () => {
    if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) { }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (onProgressUpdate && disabled) onProgressUpdate(0); // Reset progress if disabled
  };

  return null;
};