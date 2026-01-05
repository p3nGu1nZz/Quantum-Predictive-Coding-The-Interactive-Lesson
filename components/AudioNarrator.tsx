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
  paused?: boolean; // New prop for Timeline control
  onPlayStateChange?: (isPlaying: boolean) => void;
  seekTo?: number | null; 
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
    paused = false,
    onPlayStateChange,
    seekTo = null
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0); 
  const offsetTimeRef = useRef<number>(0); 
  const animationFrameRef = useRef<number>(0);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  const currentTextRef = useRef<string | null>(null);
  
  const playbackSpeedRef = useRef(playbackSpeed);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);

  useEffect(() => {
    if (onPlayStateChange) onPlayStateChange(isPlaying && !paused);
  }, [isPlaying, paused, onPlayStateChange]);

  // Handle Pause/Resume via AudioContext
  useEffect(() => {
      if (!audioContext) return;
      if (paused) {
          if (audioContext.state === 'running') audioContext.suspend();
      } else {
          if (audioContext.state === 'suspended') audioContext.resume();
      }
  }, [paused, audioContext]);

  useEffect(() => {
    if (disabled) {
        stopAudio();
    }
    return () => stopAudio();
  }, [disabled]);

  useEffect(() => {
      if (seekTo !== null && seekTo !== undefined) {
          playAudio(seekTo);
      }
  }, [seekTo]);

  useEffect(() => {
    if (disabled) return;

    if (text !== currentTextRef.current) {
        stopAudio();
        currentTextRef.current = text;
        
        if (text) {
            if (!soundEnabled || (audioCache.has(text) && audioContext)) {
                const timer = setTimeout(() => playAudio(0), 200);
                return () => clearTimeout(timer);
            }
        } 
    }
  }, [text, audioCache, audioContext, cacheVersion, soundEnabled, disabled]); 

  const playAudio = (startPercentage: number = 0) => {
    stopAudio(); 
    if (!text || disabled) return;

    // --- Silent Simulation Mode ---
    if (!soundEnabled) {
        const wordCount = text.split(/\s+/).length;
        const duration = Math.max(3000, wordCount * 300); 
        
        let accumulatedTime = duration * (startPercentage / 100);
        let lastFrameTime = performance.now();
        setIsPlaying(true);

        const tick = () => {
            if (currentTextRef.current !== text || disabled) return; 
            
            const now = performance.now();
            const dt = now - lastFrameTime;
            lastFrameTime = now;
            
            if (!paused) {
                accumulatedTime += dt * playbackSpeedRef.current;
            }
            
            const p = Math.min(100, (accumulatedTime / duration) * 100);
            
            if (onProgressUpdate) onProgressUpdate(p);
            
            if (p < 100) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                setIsPlaying(false);
                const nextDelay = playbackSpeedRef.current > 1 ? 500 : 3000;
                autoNextTimeoutRef.current = setTimeout(() => {
                    if (!disabled && !paused) onAutoNext();
                }, nextDelay);
            }
        };
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
    }

    // --- Audio Playback Mode ---
    if (!audioContext || !audioCache.has(text)) return; 

    if (audioContext.state === 'suspended' && !paused) {
      audioContext.resume();
    }

    const buffer = audioCache.get(text)!;
    const offset = buffer.duration * (startPercentage / 100);
    offsetTimeRef.current = offset;

    if (offset >= buffer.duration) {
        if (onProgressUpdate) onProgressUpdate(100);
        return;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null; 
    };

    source.start(0, offset);
    startTimeRef.current = audioContext.currentTime;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    const updateProgress = () => {
        if (audioContext && sourceNodeRef.current === source && !disabled) {
            // When paused via context.suspend(), currentTime stops advancing automatically
            const elapsedSinceStart = (audioContext.currentTime - startTimeRef.current) * playbackSpeedRef.current; 
            const totalPosition = offsetTimeRef.current + elapsedSinceStart;
            
            const p = Math.min(100, (totalPosition / buffer.duration) * 100);
            
            if (onProgressUpdate) onProgressUpdate(p);
            
            if (p < 100) {
                animationFrameRef.current = requestAnimationFrame(updateProgress);
            } else {
                if (onProgressUpdate) onProgressUpdate(100);
                autoNextTimeoutRef.current = setTimeout(() => {
                    if (!disabled && !paused) onAutoNext();
                }, 3000);
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
  };

  return null;
};