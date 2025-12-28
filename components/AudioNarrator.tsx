import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Loader, Volume2, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface AudioNarratorProps {
  text: string;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
  onAutoNext: () => void;
  audioCache: Map<string, AudioBuffer>;
  audioContext: AudioContext | null;
  cacheVersion: number; // New prop to signal cache updates
  loadingProgress?: number; // Granular loading progress
}

export const AudioNarrator: React.FC<AudioNarratorProps> = ({ 
    text, 
    title,
    onPrev, 
    onNext, 
    canPrev, 
    canNext,
    isAutoPlay,
    onToggleAutoPlay,
    onAutoNext,
    audioCache,
    audioContext,
    cacheVersion,
    loadingProgress = 0
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasAudioLoaded, setHasAudioLoaded] = useState(false);
  
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  
  const isAutoPlayRef = useRef(isAutoPlay);

  useEffect(() => {
    isAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // New Slide Reset or Cache Update
  useEffect(() => {
    // If we are already playing the correct audio, don't reset
    if (isPlaying && hasAudioLoaded && sourceNodeRef.current) {
        // Just let it play
        return;
    }

    stopAudio();
    pauseTimeRef.current = 0;
    setProgress(0);
    setDuration(0);
    setCurrentTime(0);
    setHasAudioLoaded(false);
    
    // Check Cache
    if (text && audioCache.has(text) && audioContext) {
        const buffer = audioCache.get(text)!;
        setDuration(buffer.duration);
        setHasAudioLoaded(true);
        if (isAutoPlayRef.current && !isPlaying) {
            // Small timeout to allow state to settle
            setTimeout(() => playAudio(), 100);
        }
    }
  }, [text, audioCache, audioContext, cacheVersion]); // Added cacheVersion dependency

  const playAudio = () => {
    if (!text || !audioContext) return;
    if (!audioCache.has(text)) return; 

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const buffer = audioCache.get(text)!;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;
    source.connect(audioContext.destination);
    
    const offset = pauseTimeRef.current;
    source.start(0, offset);
    
    startTimeRef.current = audioContext.currentTime - (offset / speed);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
        const playedDuration = (audioContext.currentTime - startTimeRef.current) * speed;
        
        // If we reached the end (with a small margin of error)
        if (Math.abs(playedDuration - buffer.duration) < 0.2) {
             setIsPlaying(false);
             pauseTimeRef.current = 0;
             setProgress(100);
             setCurrentTime(buffer.duration);

             if (isAutoPlayRef.current) {
                 setTimeout(() => {
                     onAutoNext();
                 }, 500); 
             }
        }
    };

    const updateProgress = () => {
        if (audioContext && isPlaying) {
            const current = (audioContext.currentTime - startTimeRef.current) * speed;
            const dur = buffer.duration;
            const p = Math.min(100, (current / dur) * 100);
            
            setProgress(p);
            setCurrentTime(Math.min(current, dur));
            
            if (p < 100) {
                animationFrameRef.current = requestAnimationFrame(updateProgress);
            }
        }
    };
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContext) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      pauseTimeRef.current += (audioContext.currentTime - startTimeRef.current) * speed;
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { }
      sourceNodeRef.current.disconnect();
    }
    setIsPlaying(false);
    pauseTimeRef.current = 0;
    setProgress(0);
    setCurrentTime(0);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const togglePlayback = () => {
    if (isPlaying) pauseAudio();
    else playAudio();
  };

  const handleSpeedChange = () => {
    const newSpeed = speed === 1.0 ? 1.25 : (speed === 1.25 ? 1.5 : 1.0);
    setSpeed(newSpeed);
    if (isPlaying && sourceNodeRef.current) {
       sourceNodeRef.current.playbackRate.value = newSpeed;
    }
  };

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#050505] border-t border-slate-800 flex items-center z-[80] shadow-[0_-5px_20px_rgba(0,0,0,0.8)] px-0">
      
      {/* LEFT NAV (PREV) */}
      <button 
         onClick={onPrev}
         disabled={!canPrev}
         className="h-full w-16 md:w-20 bg-slate-900 border-r border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors shrink-0"
      >
          <ChevronLeft size={32} />
      </button>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex items-center px-4 md:px-6 gap-4 md:gap-6 h-full bg-[#0a0a0a] min-w-0">
        
        {/* Status Icon */}
        <div className={`p-3 rounded-full border shrink-0 transition-all duration-500 hidden md:flex ${isPlaying ? 'border-cyan-500 bg-cyan-900/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
            <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} />
        </div>

        {/* Text & Progress */}
        <div className="flex-1 flex flex-col justify-center gap-2 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0 flex-1">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 cyber-font truncate">
                        NARRATION PROTOCOL
                     </span>
                     <div className="flex items-center gap-2">
                        <span className="text-sm md:text-base text-slate-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis block w-full" title={text}>
                            {text ? text : "No Audio"}
                        </span>
                        {!hasAudioLoaded && text && (
                            <div className="flex items-center gap-2 shrink-0 animate-pulse bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                <Loader size={12} className="animate-spin text-cyan-500" />
                                <span className="text-xs font-mono text-cyan-400">{Math.round(loadingProgress)}%</span>
                            </div>
                        )}
                     </div>
                </div>
                <div className="text-xs font-mono text-cyan-500 shrink-0 tabular-nums">
                   {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0 relative">
                {!hasAudioLoaded && text && (
                    <div 
                        className="absolute inset-0 bg-cyan-900/50"
                        style={{ width: `${loadingProgress}%`, transition: 'width 0.2s linear' }}
                    ></div>
                )}
                <div 
                    className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-100 ease-linear relative z-10"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2 shrink-0">
             <button
                onClick={onToggleAutoPlay}
                className={`p-2 rounded border flex items-center gap-1 transition-all ${isAutoPlay ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-600 hover:text-slate-400'}`}
             >
                <Zap size={16} fill={isAutoPlay ? "currentColor" : "none"} />
                <span className="text-[10px] font-bold uppercase hidden xl:inline">Auto</span>
             </button>

             <div className="h-8 w-px bg-slate-800 mx-1 hidden md:block"></div>

             <button 
                onClick={togglePlayback}
                disabled={!hasAudioLoaded}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-slate-800 hover:bg-cyan-900/50 text-white border border-slate-600 hover:border-cyan-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>

            <button 
                onClick={stopAudio}
                disabled={!hasAudioLoaded}
                className="p-3 text-slate-400 hover:text-white transition-colors hidden md:block"
            >
                <RotateCcw size={20} />
            </button>

            <button 
                onClick={handleSpeedChange}
                disabled={!hasAudioLoaded}
                className="w-10 text-center text-slate-400 hover:text-cyan-400 transition-colors font-mono font-bold text-xs"
            >
                {speed}x
            </button>
        </div>
      </div>

      {/* RIGHT NAV (NEXT) */}
      <button 
         onClick={onNext}
         disabled={!canNext}
         className="h-full w-16 md:w-20 bg-cyan-900/20 border-l border-cyan-900/50 flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shrink-0"
      >
          <ChevronRight size={32} />
      </button>

    </div>
  );
};