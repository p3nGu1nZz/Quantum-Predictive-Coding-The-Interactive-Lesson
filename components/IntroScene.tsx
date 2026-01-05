import React from 'react';
import { Atom, Box, BrainCircuit, Cpu, ArrowRight, Zap, Layers, Activity, Aperture } from 'lucide-react';
import { LessonSubsection } from '../types';

interface IntroSceneProps {
    progress: number;
    subsections?: LessonSubsection[];
}

export const IntroScene: React.FC<IntroSceneProps> = ({ progress, subsections }) => {
    // Phase thresholds (matched to Step 00 script)
    // 0: Abstract (0-35)
    // 1: Physics (35-55)
    // 2: Geometry (55-75)
    // 3: Dynamics (75-100)

    const getOpacity = (start: number, end: number) => {
        if (progress >= start && progress < end) return 1;
        return 0;
    };

    const getTransform = (start: number, end: number, direction: 'left' | 'right' | 'up' | 'down' | 'zoom') => {
        if (progress < start) {
            switch(direction) {
                case 'left': return 'translateX(-150px) scale(0.9)';
                case 'right': return 'translateX(150px) scale(0.9)';
                case 'up': return 'translateY(150px) scale(0.9)';
                case 'zoom': return 'scale(0.8)';
            }
        }
        if (progress >= end) return 'scale(1.1) blur(10px)'; // Scale up and blur on exit
        return 'translate(0) scale(1)';
    };

    const getTitle = (idx: number) => subsections && subsections[idx] ? subsections[idx].title : "";
    const getContent = (idx: number) => subsections && subsections[idx] ? subsections[idx].content : null;

    // HUD Corner Component
    const HUDCorner = ({ className }: { className: string }) => (
        <div className={`absolute w-6 h-6 border-cyan-500/50 ${className}`}></div>
    );

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none overflow-hidden font-sans">
            
            {/* Cinematic Overlay Layers */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90 opacity-90 z-0"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

            {/* PHASE 0: WELCOME / ABSTRACT (Center Zoom) */}
            <div 
                className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ease-out"
                style={{ 
                    opacity: getOpacity(0, 35), 
                    transform: getTransform(0, 35, 'zoom')
                }}
            >
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-cyan-500 blur-[80px] opacity-20 animate-pulse"></div>
                    <div className="relative z-10 p-10 border border-cyan-500/30 bg-black/60 backdrop-blur-md rounded-full shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                        <Cpu size={100} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                        <div className="absolute inset-0 border border-cyan-400/20 rounded-full animate-spin-slow-reverse" style={{ padding: '-20px' }}></div>
                    </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200 cyber-font mb-8 text-center tracking-tighter drop-shadow-lg">
                    L-GROUP SIMULATION
                </h1>

                <div className="max-w-3xl text-center relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500"></div>
                    
                    <div className="bg-black/50 p-8 border-x border-cyan-900/30 backdrop-blur-sm">
                         <div className="text-2xl text-slate-200 font-light leading-relaxed font-serif">
                            {getContent(0)}
                        </div>
                    </div>
                </div>
            </div>

            {/* PHASE 1: PHYSICS (From Left) */}
            <div 
                className="absolute left-10 md:left-20 top-1/2 -translate-y-1/2 max-w-xl transition-all duration-1000 ease-out"
                style={{ 
                    opacity: getOpacity(35, 55), 
                    transform: getTransform(35, 55, 'left'),
                }}
            >
                <div className="relative bg-black/80 p-10 rounded-r-3xl border-l-8 border-yellow-500 shadow-[0_0_60px_rgba(234,179,8,0.15)] backdrop-blur-xl">
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 bg-black border-2 border-yellow-500 rounded-full p-4 shadow-[0_0_30px_rgba(234,179,8,0.4)] z-20">
                        <Atom size={48} className="text-yellow-400 animate-spin-slow" />
                    </div>
                    
                    <div className="ml-8">
                        <div className="text-yellow-500 font-mono text-xs tracking-[0.4em] uppercase mb-2">Phase 01</div>
                        <h2 className="text-4xl font-bold text-white cyber-font mb-6">{getTitle(1)}</h2>
                        <div className="text-xl text-slate-300 font-light leading-relaxed">
                            {getContent(1)}
                        </div>
                    </div>
                    
                    {/* Decorative Grid */}
                    <div className="absolute right-4 top-4 grid grid-cols-3 gap-1 opacity-20">
                        {[...Array(9)].map((_,i) => <div key={i} className="w-1 h-1 bg-yellow-500 rounded-full"></div>)}
                    </div>
                </div>
            </div>

            {/* PHASE 2: GEOMETRY (From Right) */}
            <div 
                className="absolute right-10 md:right-20 top-1/2 -translate-y-1/2 max-w-xl transition-all duration-1000 ease-out text-right"
                style={{ 
                    opacity: getOpacity(55, 75), 
                    transform: getTransform(55, 75, 'right'),
                }}
            >
                <div className="relative bg-black/80 p-10 rounded-l-3xl border-r-8 border-purple-500 shadow-[0_0_60px_rgba(168,85,247,0.15)] backdrop-blur-xl">
                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 bg-black border-2 border-purple-500 rounded-full p-4 shadow-[0_0_30px_rgba(168,85,247,0.4)] z-20">
                        <Box size={48} className="text-purple-400" />
                    </div>

                    <div className="mr-8">
                        <div className="text-purple-500 font-mono text-xs tracking-[0.4em] uppercase mb-2">Phase 02</div>
                        <h2 className="text-4xl font-bold text-white cyber-font mb-6">{getTitle(2)}</h2>
                        <div className="text-xl text-slate-300 font-light leading-relaxed">
                            {getContent(2)}
                        </div>
                    </div>

                    {/* Decorative Lines */}
                    <div className="absolute left-6 bottom-6 flex gap-1 opacity-30">
                        <div className="w-16 h-1 bg-purple-500"></div>
                        <div className="w-8 h-1 bg-purple-500"></div>
                        <div className="w-2 h-1 bg-purple-500"></div>
                    </div>
                </div>
            </div>

            {/* PHASE 3: DYNAMICS (From Bottom) */}
            <div 
                className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-4xl transition-all duration-1000 ease-out"
                style={{ 
                    opacity: getOpacity(75, 95), 
                    transform: getTransform(75, 95, 'up') 
                }}
            >
                <div className="relative bg-black/80 p-12 rounded-t-[3rem] border-t border-x border-emerald-500/30 shadow-[0_-10px_60px_rgba(16,185,129,0.2)] backdrop-blur-xl text-center">
                    
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border-2 border-emerald-500 rounded-full p-5 shadow-[0_0_40px_rgba(16,185,129,0.5)] z-20">
                        <BrainCircuit size={56} className="text-emerald-400" />
                    </div>

                    <div className="mt-6">
                        <div className="text-emerald-500 font-mono text-xs tracking-[0.4em] uppercase mb-4">Phase 03 // Synthesis</div>
                        <h2 className="text-5xl font-bold text-white cyber-font mb-6">{getTitle(3)}</h2>
                        <div className="text-2xl text-slate-200 font-light leading-relaxed max-w-2xl mx-auto">
                            {getContent(3)}
                        </div>
                    </div>
                    
                    {/* Animated Activity Bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                        <div className="h-full bg-emerald-500 w-1/3 animate-pulse mx-auto shadow-[0_0_15px_#10b981]"></div>
                    </div>
                </div>
            </div>

             {/* COMPLETION / NEXT PROMPT */}
             <div 
                className="absolute bottom-10 right-10 transition-all duration-500 flex items-center gap-4 text-cyan-400 font-mono tracking-widest uppercase bg-black/80 px-6 py-3 rounded-full border border-cyan-500/30"
                style={{ 
                    opacity: progress > 95 ? 1 : 0, 
                    transform: progress > 95 ? 'translateY(0)' : 'translateY(20px)' 
                }}
            >
                <span className="animate-pulse">Awaiting Input</span>
                <ArrowRight size={20} className="text-white" />
            </div>
            
            {/* Persistent Lesson Indicator */}
            <div className="absolute top-8 left-8 flex items-center gap-3 opacity-50">
                 <Aperture size={20} className="text-cyan-500 animate-spin-slow" />
                 <span className="text-xs font-mono text-cyan-500 tracking-widest">LESSON_00 // OVERVIEW</span>
            </div>
        </div>
    );
};