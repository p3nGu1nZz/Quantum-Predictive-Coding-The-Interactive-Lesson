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
  
  // Clean up on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Watch for text changes or cache updates
  useEffect(() => {
    // Stop current audio if text changes
    stopAudio();
    
    // Attempt to play new text
    if (text && audioCache.has(text) && audioContext) {
        // Small delay to ensure state settles
        const timer = setTimeout(() => playAudio(), 200);
        return () => clearTimeout(timer);
    } else {
        // Audio not ready yet, will retry when cacheVersion increments via parent
    }
  }, [text, audioCache, audioContext, cacheVersion]); 

  const playAudio = () => {
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
    
    source.start(0);
    startTimeRef.current = audioContext.currentTime;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
        setIsPlaying(false);
        if (onProgressUpdate) onProgressUpdate(100);
        // Automatically proceed to next slide
        setTimeout(() => {
            onAutoNext();
        }, 1000); 
    };

    const updateProgress = () => {
        if (audioContext && sourceNodeRef.current) {
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
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) { }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (onProgressUpdate) onProgressUpdate(0);
  };

  // Render nothing - Headless Controller
  return null;
};