import React, { useState, useEffect, useRef } from 'react';

interface AudioNarratorProps {
  text: string;
  onAutoNext: () => void;
  audioCache: Map<string, AudioBuffer>;
  audioContext: AudioContext | null;
  cacheVersion: number;
  onProgressUpdate?: (progress: number) => void;
}

export const AudioNarrator: React.FC<AudioNarratorProps> = ({ 
    text, 
    onAutoNext,
    audioCache,
    audioContext,
    cacheVersion,
    onProgressUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  const currentTextRef = useRef<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Effect to handle Playback triggers
  useEffect(() => {
    // 1. If text changed completely, we must stop previous audio
    if (text !== currentTextRef.current) {
        stopAudio();
        currentTextRef.current = text;
    }

    // 2. If we have a source node playing the current text, do NOT disturb it.
    //    This prevents restarts when cacheVersion updates for OTHER steps (background loading).
    if (sourceNodeRef.current) {
        return;
    }

    // 3. Try to play if we have the data
    if (text && audioCache.has(text) && audioContext) {
        // Small delay to ensure state settles
        const timer = setTimeout(() => playAudio(), 200);
        return () => clearTimeout(timer);
    } 
  }, [text, audioCache, audioContext, cacheVersion]); 

  const playAudio = () => {
    // Safety check: ensure we don't layer audio
    stopAudio(); 
    
    // Re-verify conditions
    if (!text || !audioContext) return;
    if (!audioCache.has(text)) return; 

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const buffer = audioCache.get(text)!;

    // Create Source
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null; // Mark as done
        
        if (onProgressUpdate) onProgressUpdate(100);
        
        // Automatically proceed to next slide
        // Only trigger if we are actively playing this slide (redundant check but safe)
        autoNextTimeoutRef.current = setTimeout(() => {
            onAutoNext();
        }, 1000); 
    };

    source.start(0);
    startTimeRef.current = audioContext.currentTime;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    const updateProgress = () => {
        // Only run if this source is still the active one
        if (audioContext && sourceNodeRef.current === source) {
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
    // Clear any pending auto-next
    if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        // CRITICAL: Remove onended listener so manual stop doesn't trigger next slide logic.
        // This fixes the "erratic skipping" bug where stop() triggered onended() -> onAutoNext().
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) { }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (onProgressUpdate) onProgressUpdate(0);
  };

  return null;
};