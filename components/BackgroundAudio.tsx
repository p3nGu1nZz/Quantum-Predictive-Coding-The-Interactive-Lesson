import React, { useEffect, useRef, useState } from 'react';

interface BackgroundAudioProps {
  isPlaying: boolean;
  isNarrating: boolean; // Signal to duck volume
  volume?: number;
}

export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({ 
  isPlaying, 
  isNarrating, 
  volume = 0.3 
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number>(0);

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio('audio/ambience.mp3'); // Assumes a file exists, or fails gracefully
    audio.loop = true;
    audio.volume = 0; // Start silent for fade-in
    audioRef.current = audio;

    // Optional: Add a simple drone synthesizer as fallback if file is missing
    // For this implementation, we rely on the audio element logic.

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Handle Play/Pause State
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Auto-play prevented (background music):", error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Documentary Style Mixing (Ducking)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Target volume: Lower if narrating (Ducking), standard if ambient
    const targetVol = isNarrating ? 0.05 : volume;
    
    // Clear existing fader
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    // Smooth Volume Transition
    fadeIntervalRef.current = window.setInterval(() => {
      const current = audio.volume;
      const step = 0.01;
      
      if (Math.abs(current - targetVol) < step) {
        audio.volume = targetVol;
        clearInterval(fadeIntervalRef.current);
      } else if (current < targetVol) {
        audio.volume = Math.min(1, current + step);
      } else {
        audio.volume = Math.max(0, current - step);
      }
    }, 50); // Updates every 50ms

    return () => clearInterval(fadeIntervalRef.current);
  }, [isNarrating, volume, isPlaying]);

  return null; // Invisible component
};