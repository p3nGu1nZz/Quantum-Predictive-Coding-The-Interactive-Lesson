import React, { useState, useEffect, useRef } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { Particle, Interaction, Vector2 } from './types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { Play, Pause, RefreshCw, ChevronRight, ChevronLeft, Activity, Sparkles, Microscope, Info, ZoomIn, ZoomOut, Maximize, X, Plus, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LESSON_STEPS } from './lessons/content';
import { createParticles } from './lessons/setups';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>(createParticles('grid'));
  const [isRunning, setIsRunning] = useState(true);
  const [energyData, setEnergyData] = useState<{t: number, E: number}[]>([]);
  const [frame, setFrame] = useState(0);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Vector2>({ x: 0, y: 0 });
  const [showHelp, setShowHelp] = useState(false);

  // Ref to track the LATEST state from the physics engine
  const latestParticlesRef = useRef<Particle[]>(particles);
  // Ref to prevent race conditions during add/remove operations
  const isUpdatingRef = useRef(false);

  const currentStep = LESSON_STEPS[stepIndex];

  // Reset when step changes
  useEffect(() => {
    const newParticles = createParticles(currentStep.setup);
    setParticles(newParticles);
    latestParticlesRef.current = newParticles; 
    isUpdatingRef.current = false;
    setEnergyData([]);
    setFrame(0);
    setIsRunning(true);
    setSelectedParticle(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [stepIndex, currentStep.setup]);

  // Keyboard Shortcuts for Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '=' || e.key === '+') {
            setZoom(z => Math.min(z * 1.1, 5));
        } else if (e.key === '-') {
            setZoom(z => Math.max(z * 0.9, 0.2));
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdate = (newParticles: Particle[], interactions: Interaction[], energy: { pred: number, pos: number }) => {
    // CRITICAL FIX: Only update the ref if we are not in the middle of a user-triggered update
    // OR if the simulation state has caught up to the application state (counts match).
    // This prevents the physics loop from overwriting the ref with stale data immediately after an Add/Remove action.
    if (!isUpdatingRef.current || newParticles.length === particles.length) {
        latestParticlesRef.current = newParticles;
        // If counts match, the race is over, we can unlock updates
        if (newParticles.length === particles.length) {
            isUpdatingRef.current = false;
        }
    }

    if (frame % 5 === 0) {
        setEnergyData(prev => {
            const next = [...prev, { t: frame, E: energy.pred + energy.pos }];
            if (next.length > 50) next.shift(); 
            return next;
        });
    }
    setFrame(f => f + 1);

    if (selectedParticle) {
        const updated = newParticles.find(p => p.id === selectedParticle.id);
        if (updated) setSelectedParticle(updated);
    }
  };

  const handleSelectParticle = (p: Particle | null) => {
      setSelectedParticle(p);
  };

  const addParticle = () => {
    // Lock updates to prevent race condition
    isUpdatingRef.current = true;
    
    const currentList = latestParticlesRef.current;
    const newParticle: Particle = {
        id: currentList.length > 0 ? Math.max(...currentList.map(p => p.id)) + 1 : 0,
        pos: { x: CANVAS_WIDTH/2 + (Math.random()-0.5)*100, y: CANVAS_HEIGHT/2 + (Math.random()-0.5)*100 },
        vel: { x: 0, y: 0 },
        val: 0,
        valVel: 0,
        phase: Math.random() * Math.PI * 2,
        phaseVel: 0.1,
        spin: Math.random() > 0.5 ? 0.5 : -0.5,
        color: COLORS.blue,
        isFixed: false
    };
    
    const newList = [...currentList, newParticle];
    setParticles(newList);
    // Optimistically update ref so next click sees the new particle even if frame hasn't processed
    latestParticlesRef.current = newList; 
  };

  const removeParticle = () => {
      const currentList = latestParticlesRef.current;
      if (currentList.length > 0) {
          isUpdatingRef.current = true;
          const newList = currentList.slice(0, -1);
          setParticles(newList);
          latestParticlesRef.current = newList;
          setSelectedParticle(null);
      }
  };

  const handleResetCamera = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
  };

  // --- Splash Screen ---
  if (!hasStarted) {
    return (
      <div className="relative w-full h-screen bg-slate-900 overflow-hidden flex flex-col items-center justify-center font-serif">
         <div className="absolute inset-0 opacity-40 pointer-events-none">
             <SimulationCanvas
                particles={createParticles('swarm')} 
                config={{k: 0.05, r0:100, eta:0.1, eta_r:0.1, sigma:100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, damping: 0.98, temperature: 0.3}}
                onUpdate={() => {}}
                onSelectParticle={() => {}}
                isRunning={true}
                interactionMode="perturb"
                zoom={0.8}
                pan={{x:0, y:0}}
                onPan={() => {}}
             />
         </div>

         <div className="z-10 text-center max-w-3xl px-6 animate-fade-in-up">
            <div className="flex justify-center mb-6">
                <Sparkles className="text-cyan-400 w-16 h-16 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-6 tracking-tight filter drop-shadow-lg">
              Quantum PCN
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed font-light">
               Explore <strong>L-Group PCNs</strong> with vibrationally coupled particles.
            </p>
            
            <button
               onClick={() => setHasStarted(true)}
               className="group relative px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-full transition-all shadow-[0_0_20px_rgba(8,145,178,0.5)] hover:shadow-[0_0_40px_rgba(8,145,178,0.7)] hover:-translate-y-1 flex items-center gap-3 mx-auto border border-cyan-400"
            >
               <span>Start Interactive Lesson</span>
               <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="mt-12 text-slate-500 text-sm">
                Based on the research of Rawson (2025)
            </div>
         </div>
      </div>
    );
  }

  // --- Main Application ---
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-slate-800">
      
      {/* Sidebar / Lesson Control */}
      <div className="w-full md:w-2/5 flex flex-col border-r border-slate-300 bg-slate-50 z-10 shadow-xl">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-2">
             <button onClick={() => setHasStarted(false)} className="hover:text-cyan-600 transition-colors" title="Back to Title">
                <Sparkles size={24} className="text-cyan-600" />
             </button>
             <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 font-serif">
                Quantum PCN
             </h1>
          </div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interactive Lesson Plan</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 relative">
           
           <h3 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif leading-tight border-b-2 border-cyan-100 pb-2">
            {currentStep.title}
           </h3>
           
           <div className="text-slate-700 text-sm md:text-base leading-7 md:leading-8 font-normal font-serif">
             {currentStep.content}
           </div>

           <div className="pt-6 mt-4 border-t border-slate-200">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                  disabled={stepIndex === 0}
                  className="px-5 py-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2 text-sm"
                >
                  <ChevronLeft size={18} /> Back
                </button>

                <button 
                  onClick={() => setStepIndex(Math.min(LESSON_STEPS.length - 1, stepIndex + 1))}
                  disabled={stepIndex === LESSON_STEPS.length - 1}
                  className="flex-1 px-5 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base"
                >
                  {stepIndex === LESSON_STEPS.length - 1 ? 'Finish Lesson' : 'Next Lesson'} <ChevronRight size={20} />
                </button>
             </div>
             <div className="text-center mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Section {stepIndex + 1} of {LESSON_STEPS.length}
             </div>
           </div>

           {/* Real-time Energy Chart */}
           {stepIndex > 1 && (
             <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-2 text-xs text-yellow-600 font-bold uppercase tracking-wider">
                 <Activity size={14} /> Total Free Energy (F)
               </div>
               <div className="h-32 w-full rounded p-1">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={energyData}>
                     <YAxis hide domain={['auto', 'auto']} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '6px' }}
                        itemStyle={{ color: '#ca8a04', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(val: number) => [val.toFixed(2), "Energy"]}
                        labelStyle={{ display: 'none' }}
                     />
                     <Line type="monotone" dataKey="E" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             </div>
           )}
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-100 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest">
           <span>Rawson (2025)</span>
           <span>v1.0.1</span>
        </div>
      </div>

      {/* Main Simulation Area */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        <SimulationCanvas 
            particles={particles}
            config={currentStep.config}
            onUpdate={handleUpdate}
            onSelectParticle={handleSelectParticle}
            isRunning={isRunning}
            interactionMode="drag"
            zoom={zoom}
            pan={pan}
            onPan={setPan}
        />

        {/* Overlay Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 items-end">
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowHelp(true)}
                    className="flex items-center justify-center w-10 h-10 bg-slate-800/80 hover:bg-slate-700 backdrop-blur text-cyan-400 rounded-full border border-slate-600 transition-all shadow-lg"
                    title="Help"
                >
                    <Info size={20} />
                </button>
                <button 
                    onClick={() => {
                        const setup = createParticles(currentStep.setup);
                        setParticles(setup);
                        latestParticlesRef.current = setup;
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur text-white rounded-full border border-slate-600 transition-all text-sm font-medium shadow-lg"
                >
                    <RefreshCw size={16} /> Reset
                </button>
                <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-full border border-slate-600 transition-all text-sm font-medium shadow-lg ${isRunning ? 'bg-rose-500/80 hover:bg-rose-600' : 'bg-emerald-500/80 hover:bg-emerald-600'}`}
                >
                    {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Play</>}
                </button>
            </div>
            {/* Particle Controls */}
            <div className="flex gap-1 bg-slate-800/80 rounded-full p-1 border border-slate-600 shadow-lg backdrop-blur">
                 <button onClick={removeParticle} className="p-2 text-rose-400 hover:text-white hover:bg-slate-700 rounded-full" title="Remove Particle">
                    <Minus size={16} />
                </button>
                <span className="text-slate-400 text-xs self-center px-1 font-mono">{particles.length}</span>
                <button onClick={addParticle} className="p-2 text-emerald-400 hover:text-white hover:bg-slate-700 rounded-full" title="Add Particle">
                    <Plus size={16} />
                </button>
            </div>
            {/* Camera Controls */}
            <div className="flex gap-1 bg-slate-800/80 rounded-full p-1 border border-slate-600 shadow-lg backdrop-blur">
                <button onClick={() => setZoom(z => Math.max(z * 0.9, 0.2))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full" title="Zoom Out (-)">
                    <ZoomOut size={16} />
                </button>
                 <button onClick={handleResetCamera} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full" title="Reset Camera">
                    <Maximize size={16} />
                </button>
                <button onClick={() => setZoom(z => Math.min(z * 1.1, 5))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full" title="Zoom In (+)">
                    <ZoomIn size={16} />
                </button>
            </div>
        </div>

        {/* Help Modal */}
        {showHelp && (
            <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-800 rounded-2xl border border-slate-600 p-6 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                    <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                        <Info size={24} /> Playground Controls
                    </h3>
                    <ul className="space-y-3 text-slate-300 text-sm">
                        <li className="flex items-start gap-3">
                            <div className="bg-slate-700 p-2 rounded text-cyan-400"><RefreshCw size={16} /></div>
                            <div><strong>Drag Particles:</strong> Click and hold any particle to move it.</div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-slate-700 p-2 rounded text-cyan-400"><Maximize size={16} /></div>
                            <div><strong>Pan Camera:</strong> Click and drag anywhere on the background.</div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-slate-700 p-2 rounded text-cyan-400"><Plus size={16} /></div>
                            <div><strong>Modify Swarm:</strong> Add or remove particles to test system stability.</div>
                        </li>
                         <li className="flex items-start gap-3">
                            <div className="bg-slate-700 p-2 rounded text-cyan-400"><ZoomIn size={16} /></div>
                            <div><strong>Zoom:</strong> Use the <code>+</code> and <code>-</code> keys or buttons.</div>
                        </li>
                    </ul>
                    <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold transition-colors">
                        Got it!
                    </button>
                </div>
            </div>
        )}

        {/* Particle Inspector */}
        {selectedParticle && (
            <div className="absolute top-4 left-4 w-64 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-600 shadow-2xl z-30 animate-fade-in-up p-4">
                <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                    <h4 className="text-cyan-400 font-bold flex items-center gap-2">
                        <Microscope size={18} /> Particle {selectedParticle.id}
                    </h4>
                    <button onClick={() => setSelectedParticle(null)} className="text-slate-500 hover:text-white">&times;</button>
                </div>
                <div className="space-y-2 text-sm text-slate-200">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Value (x):</span>
                        <span className="font-mono text-white">{selectedParticle.val.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Phase (φ):</span>
                        <span className="font-mono text-purple-400">{(selectedParticle.phase / Math.PI).toFixed(2)}π</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Spin (s):</span>
                        <span className={`font-mono ${selectedParticle.spin > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                            {selectedParticle.spin > 0 ? '↑ Up' : '↓ Down'}
                        </span>
                    </div>
                </div>
                {selectedParticle.isFixed && (
                    <div className="mt-3 text-xs bg-red-900/50 text-red-200 p-2 rounded border border-red-800 flex gap-2 items-center">
                        <Info size={12} /> Sensory Node (Fixed)
                    </div>
                )}
            </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-4 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700 text-sm z-20 pointer-events-none text-slate-300">
            <div className="font-bold mb-2 text-slate-400 uppercase text-xs tracking-wider">Legend</div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span>Sensory Node</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span>Processing Node</span>
                </div>
                {currentStep.config.spinEnabled && (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border-2 border-green-400"></div>
                            <span>Spin Up (+0.5)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border-2 border-orange-400 bg-transparent border-dashed"></div>
                            <span>Spin Down (-0.5)</span>
                        </div>
                    </>
                )}
                {currentStep.config.couplingEnabled && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 border-b-2 border-dashed border-yellow-400"></div>
                        <span>Dynamic Coupling</span>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}