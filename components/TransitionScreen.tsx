import React, { useEffect, useState } from 'react';
import { MatrixBackground } from './MatrixBackground';

interface TransitionScreenProps {
  isVisible: boolean;
  lessonNumber: number;
  title: string;
}

export const TransitionScreen: React.FC<TransitionScreenProps> = ({ isVisible, lessonNumber, title }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Small delay to allow the fade-to-black to happen before text slides in
      const timer = setTimeout(() => setShowContent(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  return (
    <div 
      className={`fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center transition-opacity duration-500 pointer-events-none ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <MatrixBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center overflow-hidden w-full max-w-4xl p-10">
        
        {/* Lesson Number Animation */}
        <div 
            className={`transition-all duration-1000 ease-out transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
        >
            <div className="text-8xl md:text-9xl font-bold text-slate-800/50 cyber-font tracking-tighter">
                {lessonNumber}
            </div>
        </div>

        {/* Title Animation */}
        <div 
            className={`mt-[-2rem] transition-all duration-1000 delay-300 ease-out transform ${showContent ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        >
             <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cyber-font text-center shadow-cyan-500/50 drop-shadow-lg">
                {title}
             </h1>
        </div>

        {/* Decorative Line */}
        <div 
            className={`h-1 bg-cyan-500 mt-8 transition-all duration-1000 delay-500 ease-out ${showContent ? 'w-32 opacity-100' : 'w-0 opacity-0'}`} 
        />
        
        <div className={`mt-4 text-xs font-mono text-cyan-800 uppercase tracking-[0.5em] transition-opacity duration-1000 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
            Loading Simulation Context...
        </div>

      </div>
    </div>
  );
};