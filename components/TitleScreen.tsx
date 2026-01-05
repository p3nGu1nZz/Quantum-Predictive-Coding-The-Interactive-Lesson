import React from 'react';
import { Cpu, Radio, ChevronRight, Zap, Atom, Volume2, VolumeX } from 'lucide-react';
import { MatrixBackground } from './MatrixBackground';

interface TitleScreenProps {
  initStatus: 'idle' | 'loading' | 'ready';
  loadingProgress: number;
  onInitialize: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ initStatus, loadingProgress, onInitialize, soundEnabled, onToggleSound }) => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-serif select-none z-[100]">
      <MatrixBackground />
      <div className="z-10 text-center max-w-6xl px-6 flex flex-col items-center relative">
        
        {/* Netrunner Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
            <div className="absolute top-[-50px] left-[5%] w-[1px] h-[300px] bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-30"></div>
            <div className="absolute bottom-[-50px] right-[5%] w-[1px] h-[300px] bg-gradient-to-t from-transparent via-purple-500 to-transparent opacity-30"></div>
            <div className="absolute top-[20%] right-[20%] w-[100px] h-[100px] border border-cyan-500/10 rounded-full animate-pulse"></div>
        </div>

        <div className="animate-fade-in-up bg-black/90 p-12 md:p-16 rounded-3xl border border-slate-800 shadow-[0_0_100px_rgba(6,182,212,0.1)] backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-1000">
            {/* Scanline Effect overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwgMjU1LpV7LCAwLjAzKSIvPgo8L3N2Zz4=')] opacity-20 pointer-events-none"></div>

            <div className="mb-6 flex items-center justify-center gap-3 text-cyan-500/80 tracking-[0.2em] uppercase text-xs font-bold font-mono border border-cyan-900/50 py-1 px-4 rounded-full bg-cyan-950/20 inline-block backdrop-blur-md">
                <Atom size={12} className="animate-spin-slow inline-block mr-2" />
                <span>L-Group Framework // Simulation Engine</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tighter cyber-font leading-[0.9] glitch-text relative z-10" data-text="QUANTUM PREDICTIVE CODING NETWORKS">
                QUANTUM PREDICTIVE<br />CODING NETWORKS
            </h1>
            
            <div className="flex items-center justify-center gap-4 mb-10">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500"></div>
                <h2 className="text-lg md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 font-mono tracking-[0.3em] uppercase z-10">
                    The Interactive Lesson
                </h2>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500"></div>
            </div>

            <div className="relative z-20 mt-8 flex flex-col items-center gap-4">
                <button 
                    onClick={onInitialize} 
                    disabled={initStatus === 'loading'}
                    className={`
                        relative px-12 md:px-16 py-5 font-bold text-lg md:text-xl rounded-sm border transition-all flex items-center gap-4 cyber-font uppercase tracking-widest overflow-hidden group/btn
                        ${initStatus === 'idle' ? 'bg-slate-950 hover:bg-cyan-950/30 text-cyan-50 border-cyan-800 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]' : ''}
                        ${initStatus === 'loading' ? 'bg-slate-900 border-slate-700 text-slate-400 cursor-wait' : ''}
                        ${initStatus === 'ready' ? 'bg-emerald-950/50 border-emerald-400 text-emerald-100 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-pulse' : ''}
                    `}
                >
                    {/* Button Background Animation */}
                    {initStatus === 'loading' && (
                        <div className="absolute inset-0 bg-slate-900 w-full">
                            <div className="h-full bg-cyan-500/20 transition-all duration-300 ease-linear relative" style={{width: `${loadingProgress}%`}}>
                                <div className="absolute right-0 top-0 h-full w-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                            </div>
                        </div>
                    )}

                    <div className="relative flex items-center gap-3 z-10">
                        {initStatus === 'idle' && (
                            <>
                                <span className="group-hover/btn:text-cyan-300 transition-colors">Initialize System</span>
                                <Zap size={20} className="text-yellow-400 group-hover/btn:scale-110 transition-transform" />
                            </>
                        )}
                        {initStatus === 'loading' && (
                            <>
                                <Radio size={18} className="animate-spin text-cyan-400" />
                                <span className="text-cyan-100">Uplink: {Math.floor(loadingProgress)}%</span>
                            </>
                        )}
                        {initStatus === 'ready' && (
                            <>
                                <span>Enter Matrix</span>
                                <ChevronRight size={24} />
                            </>
                        )}
                    </div>
                </button>

                {initStatus === 'idle' && (
                    <button 
                        onClick={onToggleSound}
                        className={`flex items-center gap-2 px-4 py-2 rounded border text-xs uppercase tracking-widest font-mono transition-all ${soundEnabled ? 'border-cyan-900 text-cyan-500 hover:bg-cyan-950/30' : 'border-slate-800 text-slate-600 hover:text-slate-400'}`}
                    >
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        <span>{soundEnabled ? "Sound Enabled" : "Sound Disabled"}</span>
                    </button>
                )}
                
                {/* Decorative subtext */}
                <div className="mt-4 text-slate-600 font-mono text-[10px] space-y-1 opacity-60">
                        <p>SECURE PROTOCOL v3.0 // KARA RAWSON & AIMEE CHRZANOWSKI</p>
                        <p className="tracking-widest">QUANTUM FIELD SIMULATION ENGINE</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};