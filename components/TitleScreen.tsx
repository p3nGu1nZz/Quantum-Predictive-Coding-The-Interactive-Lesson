import React from 'react';
import { Cpu, Radio, ChevronRight, Zap } from 'lucide-react';
import { MatrixBackground } from './MatrixBackground';

interface TitleScreenProps {
  initStatus: 'idle' | 'loading' | 'ready';
  loadingProgress: number;
  onInitialize: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ initStatus, loadingProgress, onInitialize }) => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-serif select-none z-[100]">
      <MatrixBackground />
      <div className="z-10 text-center max-w-5xl px-6 flex flex-col items-center relative">
        
        {/* Netrunner Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
            <div className="absolute top-[-50px] left-[10%] w-[2px] h-[200px] bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-30"></div>
            <div className="absolute bottom-[-50px] right-[10%] w-[2px] h-[200px] bg-gradient-to-t from-transparent via-purple-500 to-transparent opacity-30"></div>
        </div>

        <div className="animate-fade-in-up bg-black/80 p-12 rounded-3xl border border-slate-800 shadow-[0_0_80px_rgba(6,182,212,0.15)] backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-700">
            {/* Scanline Effect overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwgMjU1LpV7LCAwLjAzKSIvPgo8L3N2Zz4=')] opacity-30 pointer-events-none"></div>

            <div className="mb-2 flex items-center justify-center gap-3 text-cyan-500/80 tracking-widest uppercase text-xs font-bold font-mono">
                <Cpu size={14} className="animate-pulse" />
                <span>Neural Link: Active</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tighter cyber-font leading-none glitch-text relative z-10" data-text="L-GROUP PCN">
                L-GROUP PCN
            </h1>
            
            <h2 className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-10 font-mono tracking-[0.2em] uppercase border-b border-white/10 pb-6 inline-block z-10">
                Vibrational Intelligence
            </h2>

            <div className="relative z-20 mt-4">
                <button 
                    onClick={onInitialize} 
                    disabled={initStatus === 'loading'}
                    className={`
                        relative px-16 py-6 font-bold text-xl rounded border-2 transition-all flex items-center gap-4 mx-auto cyber-font uppercase tracking-widest overflow-hidden
                        ${initStatus === 'idle' ? 'bg-slate-900/60 hover:bg-cyan-900/40 text-cyan-100 border-cyan-800 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]' : ''}
                        ${initStatus === 'loading' ? 'bg-slate-900 border-slate-700 text-slate-400 cursor-wait' : ''}
                        ${initStatus === 'ready' ? 'bg-emerald-900/40 border-emerald-400 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse' : ''}
                    `}
                >
                    {/* Button Background Animation */}
                    {initStatus === 'loading' && (
                        <div className="absolute inset-0 bg-slate-800 w-full">
                            <div className="h-full bg-cyan-900/50 transition-all duration-100 ease-linear" style={{width: `${loadingProgress}%`}}></div>
                        </div>
                    )}

                    <div className="relative flex items-center gap-3 z-10">
                        {initStatus === 'idle' && (
                            <>
                                <span>Initialize System</span>
                                <Zap size={20} className="text-yellow-400" />
                            </>
                        )}
                        {initStatus === 'loading' && (
                            <>
                                <Radio size={20} className="animate-spin" />
                                <span>Establishing Uplink {Math.floor(loadingProgress)}%</span>
                            </>
                        )}
                        {initStatus === 'ready' && (
                            <>
                                <span>Access Granted // Enter</span>
                                <ChevronRight size={24} />
                            </>
                        )}
                    </div>
                </button>
                
                {/* Decorative subtext */}
                <div className="mt-6 text-slate-500 font-mono text-[10px] space-y-1 opacity-70">
                        <p>SECURE PROTOCOL v2.1.0 // KARA RAWSON & AIMEE CHRZANOWSKI</p>
                        <p>QUANTUM FIELD SIMULATION ENGINE</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};