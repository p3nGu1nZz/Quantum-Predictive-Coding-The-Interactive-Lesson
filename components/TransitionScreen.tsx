import React, { useEffect, useState, useRef } from 'react';
import { MatrixBackground } from './MatrixBackground';
import { Loader } from 'lucide-react';

interface TransitionScreenProps {
  isVisible: boolean;
  lessonNumber: number;
  title: string;
}

export const TransitionScreen: React.FC<TransitionScreenProps> = ({ isVisible, lessonNumber, title }) => {
  const [showContent, setShowContent] = useState(false);
  const [decodedTitle, setDecodedTitle] = useState("");
  const [loadPercent, setLoadPercent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (isVisible) {
      // Reset state
      setLoadPercent(0);
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setDecodedTitle("");
    }
  }, [isVisible]);

  // Loading Bar Animation - Calibrated for 5 Seconds (5000ms)
  useEffect(() => {
      if (!isVisible) return;
      
      const updateInterval = 50; // Update every 50ms
      const totalDuration = 4800; // Target ~4.8s to finish just before screen lift
      const increment = 100 / (totalDuration / updateInterval);

      const interval = setInterval(() => {
          setLoadPercent(prev => {
              if (prev >= 100) return 100;
              return prev + increment;
          });
      }, updateInterval);
      
      return () => clearInterval(interval);
  }, [isVisible]);

  // Matrix-style Text Decoder Effect
  useEffect(() => {
    if (!showContent) return;
    
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#%&";
    let iteration = 0;
    
    const animateText = () => {
        const result = title.split("").map((char, index) => {
            if (index < iteration) return char;
            return characters[Math.floor(Math.random() * characters.length)];
        }).join("");
        
        setDecodedTitle(result);
        
        if (iteration < title.length) {
            iteration += 0.3; // Slower decoding speed for dramatic effect
            frameRef.current = requestAnimationFrame(animateText);
        }
    };
    
    animateText();
    return () => cancelAnimationFrame(frameRef.current);

  }, [showContent, title]);

  return (
    <div 
      className={`fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 pointer-events-none overflow-hidden ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <MatrixBackground />
      
      {/* Cinematic Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl p-10">
        
        {/* Lesson Number Large */}
        <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-bold text-slate-900/40 cyber-font tracking-tighter transition-all duration-1000 transform ${showContent ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}`}
        >
            {lessonNumber === 0 ? "INTR" : lessonNumber.toString().padStart(2, '0')}
        </div>

        {/* Main Content */}
        <div className="relative z-20 text-center flex flex-col items-center">
            <div className={`flex items-center gap-3 text-cyan-500 font-mono text-xs uppercase tracking-[0.4em] mb-6 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Loader size={12} className="animate-spin" />
                <span>Initializing Neural Context</span>
            </div>

            <div className="h-20 flex items-center justify-center">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 cyber-font text-center shadow-cyan-500/50 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    {decodedTitle || title}
                </h1>
            </div>

            {/* Progress Bar */}
            <div className={`mt-12 w-64 md:w-96 h-1 bg-slate-900 rounded-full overflow-hidden transition-all duration-1000 delay-300 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <div 
                    className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee] transition-all duration-100 ease-linear"
                    style={{ width: `${loadPercent}%` }}
                />
            </div>
            
            <div className={`mt-2 flex justify-between w-64 md:w-96 text-[10px] font-mono text-slate-500 transition-opacity duration-500 delay-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                <span>SYS_LOAD</span>
                <span>{Math.floor(loadPercent)}%</span>
            </div>
        </div>

      </div>
    </div>
  );
};