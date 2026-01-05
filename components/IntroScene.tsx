import React from 'react';
import { Atom, Box, BrainCircuit, Cpu, ArrowRight } from 'lucide-react';
import { LessonSubsection } from '../types';

interface IntroSceneProps {
    progress: number;
    subsections?: LessonSubsection[];
}

export const IntroScene: React.FC<IntroSceneProps> = ({ progress, subsections }) => {
    // Phases based on subsection timings in Step00
    // 0: Abstract (0-35)
    // 1: Physics (35-55)
    // 2: Geometry (55-75)
    // 3: Dynamics (75-100)

    const getOpacity = (start: number, end: number) => {
        if (progress >= start && progress < end) return 1;
        return 0;
    };

    const getTransform = (start: number, end: number, direction: 'left' | 'right' | 'up' | 'down') => {
        if (progress < start) {
            switch(direction) {
                case 'left': return 'translateX(-100px)';
                case 'right': return 'translateX(100px)';
                case 'up': return 'translateY(100px)';
                case 'down': return 'translateY(-100px)';
            }
        }
        if (progress >= end) return 'scale(0.9)'; // Scale down on exit
        return 'translate(0) scale(1)';
    };

    // Helper to get active subsection content safely
    const getTitle = (idx: number) => subsections && subsections[idx] ? subsections[idx].title : "";
    const getContent = (idx: number) => subsections && subsections[idx] ? subsections[idx].content : null;

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none p-8">
            {/* Background Gradient Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/90 opacity-80"></div>

            {/* PHASE 0: ABSTRACT / WELCOME */}
            <div 
                className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ease-out"
                style={{ 
                    opacity: getOpacity(0, 35), 
                    transform: progress > 35 ? 'scale(1.5) blur(10px)' : 'scale(1)' 
                }}
            >
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-[60px] opacity-20 animate-pulse"></div>
                    <Cpu size={120} className="text-cyan-400 relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                </div>
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white cyber-font mb-6 text-center">
                    L-GROUP SIMULATION
                </h1>
                <div className="max-w-2xl text-center text-xl text-slate-300 font-light leading-relaxed bg-black/40 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
                    {getContent(0)}
                </div>
            </div>

            {/* PHASE 1: PHYSICS (From Left) */}
            <div 
                className="absolute left-10 top-1/2 -translate-y-1/2 max-w-xl transition-all duration-1000 ease-out flex items-center gap-8"
                style={{ 
                    opacity: getOpacity(35, 55), 
                    transform: getTransform(35, 55, 'left'),
                    filter: progress >= 55 ? 'blur(5px)' : 'none'
                }}
            >
                <div className="bg-black/60 p-8 rounded-2xl border-l-4 border-yellow-500 backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                    <div className="flex items-center gap-4 mb-4">
                        <Atom size={48} className="text-yellow-400 animate-spin-slow" />
                        <h2 className="text-4xl font-bold text-white cyber-font">{getTitle(1)}</h2>
                    </div>
                    <div className="text-lg text-slate-200">
                        {getContent(1)}
                    </div>
                </div>
            </div>

            {/* PHASE 2: GEOMETRY (From Right) */}
            <div 
                className="absolute right-10 top-1/2 -translate-y-1/2 max-w-xl transition-all duration-1000 ease-out flex items-center gap-8 flex-row-reverse text-right"
                style={{ 
                    opacity: getOpacity(55, 75), 
                    transform: getTransform(55, 75, 'right'),
                    filter: progress >= 75 ? 'blur(5px)' : 'none'
                }}
            >
                <div className="bg-black/60 p-8 rounded-2xl border-r-4 border-purple-500 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <div className="flex items-center justify-end gap-4 mb-4">
                        <h2 className="text-4xl font-bold text-white cyber-font">{getTitle(2)}</h2>
                        <Box size={48} className="text-purple-400" />
                    </div>
                    <div className="text-lg text-slate-200">
                        {getContent(2)}
                    </div>
                </div>
            </div>

            {/* PHASE 3: DYNAMICS (From Bottom) */}
            <div 
                className="absolute bottom-20 transition-all duration-1000 ease-out flex flex-col items-center"
                style={{ 
                    opacity: getOpacity(75, 95), 
                    transform: getTransform(75, 95, 'up') 
                }}
            >
                <div className="bg-black/80 p-10 rounded-3xl border border-emerald-500/50 backdrop-blur-lg shadow-[0_0_50px_rgba(16,185,129,0.3)] max-w-3xl text-center">
                     <BrainCircuit size={64} className="text-emerald-400 mx-auto mb-6" />
                     <h2 className="text-5xl font-bold text-white cyber-font mb-6">{getTitle(3)}</h2>
                     <div className="text-xl text-slate-200 leading-relaxed">
                        {getContent(3)}
                    </div>
                </div>
            </div>

             {/* BEGIN PROMPT */}
             <div 
                className="absolute transition-all duration-500 flex items-center gap-3 text-cyan-400 font-mono tracking-widest uppercase"
                style={{ 
                    opacity: progress > 95 ? 1 : 0, 
                    transform: progress > 95 ? 'scale(1)' : 'scale(0.5)' 
                }}
            >
                <span>Initiating Sequence</span>
                <ArrowRight size={20} className="animate-pulse" />
            </div>
        </div>
    );
};