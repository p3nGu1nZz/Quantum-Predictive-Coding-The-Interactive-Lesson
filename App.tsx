import React, { useState, useEffect, useRef } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { SymbolTable } from './components/SymbolTable';
import { QuizModal } from './components/QuizModal'; // Imported
import { Particle, Interaction, Vector2, QuizQuestion } from './types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { Play, Pause, RefreshCw, ChevronRight, ChevronLeft, Activity, Sparkles, Microscope, Info, ZoomIn, ZoomOut, Maximize, X, Plus, Minus, ScanEye, BookOpen, GraduationCap, List, Maximize2, Minimize2, HelpCircle } from 'lucide-react';
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
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [predictionError, setPredictionError] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Quiz State
  const [quizState, setQuizState] = useState<{
    active: boolean;
    question: QuizQuestion | null;
    targetStep: number;
  }>({ active: false, question: null, targetStep: 0 });

  // Ref to track the LATEST state from the physics engine
  const latestParticlesRef = useRef<Particle[]>(particles);
  // Ref to prevent race conditions during add/remove operations
  const isUpdatingRef = useRef(false);

  // Safe check for bounds
  const currentStep = LESSON_STEPS[stepIndex] || LESSON_STEPS[0];

  // Reset when step changes
  useEffect(() => {
    if (currentStep) {
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
        setPredictionError(null);
        setShowLearnMore(false);
    }
  }, [stepIndex, currentStep?.setup]);

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

  const handleUpdate = (newParticles: Particle[], interactions: Interaction[], energy: { pred: number, pos: number, historyError?: number }) => {
    if (!isUpdatingRef.current || newParticles.length === particles.length) {
        latestParticlesRef.current = newParticles;
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

    if (energy.historyError !== undefined) {
        setPredictionError(energy.historyError);
    } else {
        setPredictionError(null);
    }

    if (selectedParticle) {
        const updated = newParticles.find(p => p.id === selectedParticle.id);
        if (updated) setSelectedParticle(updated);
    }
  };

  const handleSelectParticle = (p: Particle | null) => {
      setSelectedParticle(p);
  };

  const addParticle = () => {
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

  // --- Quiz Logic ---
  const attemptNextStep = () => {
      const nextIndex = Math.min(LESSON_STEPS.length - 1, stepIndex + 1);
      
      // Check if current step has questions
      if (currentStep.questions && currentStep.questions.length > 0) {
          // Pick a random question
          const qIndex = Math.floor(Math.random() * currentStep.questions.length);
          const question = currentStep.questions[qIndex];
          setQuizState({
              active: true,
              question: question,
              targetStep: nextIndex
          });
      } else {
          // No quiz, just go
          setStepIndex(nextIndex);
      }
  };

  const handleQuizComplete = () => {
      setQuizState(prev => ({ ...prev, active: false }));
      setStepIndex(quizState.targetStep);
  };

  const handleQuizCancel = () => {
      setQuizState(prev => ({ ...prev, active: false }));
      // Optional: Don't advance, or advance anyway? Let's advance for UX
      setStepIndex(quizState.targetStep);
  };

  const handleJumpToStep = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value);
      setStepIndex(idx);
  };

  // --- Splash Screen ---
  if (!hasStarted) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-serif">
         <div className="absolute inset-0 opacity-30 pointer-events-none">
             <SimulationCanvas
                particles={createParticles('swarm')} 
                config={{k: 0.05, r0:100, eta:0.1, eta_r:0.1, sigma:100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, damping: 0.99, temperature: 0.6}}
                onUpdate={() => {}}
                onSelectParticle={() => {}}
                isRunning={true}
                interactionMode="perturb"
                zoom={0.8}
                pan={{x:0, y:0}}
                onPan={() => {}}
             />
         </div>

         <div className="z-10 text-center max-w-4xl px-6 animate-fade-in-up">
            <div className="flex justify-center mb-8">
                <Sparkles className="text-cyan-400 w-24 h-24 animate-pulse neon-text" />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-8 tracking-tighter filter drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] cyber-font">
              QUANTUM PCN
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 mb-12 leading-relaxed font-light tracking-wide">
               L-Group Predictive Coding Networks & Vibrational Coupling
            </p>
            
            <button
               onClick={() => setHasStarted(true)}
               className="group relative px-12 py-6 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-100 font-bold text-xl rounded-none border-2 border-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:-translate-y-1 flex items-center gap-4 mx-auto cyber-font uppercase tracking-widest"
            >
               <span>Initialize System</span>
               <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="mt-16 text-slate-500 text-sm font-mono tracking-widest">
                ARCHITECT: K. RAWSON (2025) // SYSTEM READY
            </div>
         </div>
      </div>
    );
  }

  // --- Main Application ---
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-slate-200 bg-black">
      
      {/* Sidebar / Lesson Control */}
      {!isFullScreen && (
      <div className="w-full md:w-2/5 flex flex-col border-r border-slate-800 bg-[#080808] z-10 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"></div>

        <div className="p-8 border-b border-slate-800 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
             <button onClick={() => setHasStarted(false)} className="hover:text-cyan-400 transition-colors" title="Back to Title">
                <Sparkles size={28} className="text-cyan-500 neon-text" />
             </button>
             <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cyber-font tracking-tight">
                QUANTUM PCN
             </h1>
          </div>
          
          {/* Quick Jump Dropdown */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <List size={16} />
            </div>
            <select 
                value={stepIndex} 
                onChange={handleJumpToStep}
                className="w-full bg-slate-900/80 border border-slate-700 text-cyan-400 text-sm rounded pl-10 pr-4 py-2 appearance-none cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono uppercase tracking-wide"
            >
                {LESSON_STEPS.map((step, idx) => (
                    <option key={idx} value={idx}>
                        {idx + 1}. {step.title.split(':')[0]}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 relative scrollbar-cyber pb-24">
           
           <h3 className="text-3xl md:text-4xl font-bold text-slate-100 cyber-font leading-tight border-b-2 border-cyan-900/50 pb-4">
            {currentStep.title}
           </h3>
           
           <div className="text-slate-200 text-xl md:text-2xl leading-relaxed font-normal tracking-wide">
             {currentStep.content}
           </div>

           {/* Learn More Button */}
           {currentStep.explanation && (
             <button 
                onClick={() => setShowLearnMore(true)}
                className="w-full py-4 mt-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-cyan-400 rounded-lg flex items-center justify-center gap-2 transition-all group"
             >
                <BookOpen size={20} className="group-hover:scale-110 transition-transform"/>
                <span className="uppercase tracking-widest font-bold text-sm">Open Deep Dive Module</span>
             </button>
           )}

           {/* NEW: Symbol Table Component */}
           <SymbolTable symbols={currentStep.symbols} />

           <div className="pt-8 mt-8 border-t border-slate-800">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                  disabled={stepIndex === 0}
                  className="px-6 py-4 rounded border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-3 text-sm uppercase tracking-wider cyber-font"
                >
                  <ChevronLeft size={18} /> Prev
                </button>

                <button 
                  onClick={attemptNextStep}
                  disabled={stepIndex === LESSON_STEPS.length - 1}
                  className="flex-1 px-6 py-4 rounded bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400 border border-cyan-600 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-wider cyber-font"
                >
                  {stepIndex === LESSON_STEPS.length - 1 ? 'Finish' : 'Next Step'} <ChevronRight size={20} />
                </button>
             </div>
             <div className="text-center mt-4 text-xs font-bold text-slate-600 uppercase tracking-[0.2em] font-mono">
                Segment {stepIndex + 1} / {LESSON_STEPS.length}
             </div>
           </div>

           {/* Real-time Energy Chart */}
           {stepIndex > 1 && (
             <div className="mt-10 p-5 bg-black/40 rounded border border-slate-800 shadow-inner">
               <div className="flex items-center gap-2 mb-3 text-xs text-yellow-500 font-bold uppercase tracking-wider cyber-font">
                 <Activity size={14} /> System Free Energy
               </div>
               <div className="h-40 w-full rounded p-1 border border-slate-800/50 bg-black/20">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={energyData}>
                     <YAxis hide domain={['auto', 'auto']} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }}
                        itemStyle={{ color: '#facc15', fontSize: '12px', fontFamily: 'monospace' }}
                        labelStyle={{ display: 'none' }}
                     />
                     <Line type="monotone" dataKey="E" stroke="#facc15" strokeWidth={2} dot={false} isAnimationActive={false} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             </div>
           )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#050505] flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-widest font-mono">
           <span>Rawson (2025)</span>
           <span>SYS.V.2.0.4</span>
        </div>
      </div>
      )}

      {/* Main Simulation Area */}
      <div className="flex-1 relative bg-black overflow-hidden">
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
        
        {/* Prediction Error HUD (Step 14 specific) */}
        {currentStep.config.showGhosts && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
                <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-yellow-500/50 shadow-[0_0_20px_rgba(250,204,21,0.2)] flex items-center gap-4">
                    <div className="flex items-center gap-2 text-yellow-500">
                        <ScanEye size={20} className="animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest cyber-font">Visual Link</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-700"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Prediction Deviation</span>
                        <span className="text-sm font-mono font-bold text-white">
                            {predictionError !== null ? predictionError.toFixed(2) + ' units' : 'CALCULATING...'}
                        </span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-700"></div>
                    <div className="group relative flex items-center gap-2 cursor-help">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">Ghost Physics</span>
                        <HelpCircle size={14} className="text-yellow-500" />
                        
                        {/* Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-slate-900/95 border border-yellow-500/30 p-4 rounded-lg text-xs text-slate-300 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-xl">
                            <h5 className="font-bold text-yellow-400 mb-2 uppercase cyber-font">Inertial vs. Structural</h5>
                            <p className="mb-2 leading-relaxed">
                                Ghost particles visualize the <strong>inertial trajectory</strong>: where the particle <em>would</em> go if no other forces acted on it.
                            </p>
                            <div className="bg-black/50 p-2 rounded mb-2 font-mono text-cyan-300 border border-slate-700 text-[10px]">
                                r(t+1) = r(t) + v(t)Δt ... (Integrated)
                            </div>
                            <p className="text-slate-400 italic">
                                The distance between the Ghost (Inertia) and the Real Particle (influenced by neighbors) represents <strong>Prediction Error</strong> (Surprise).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-20 items-end">
            <div className="flex gap-2">
                <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="flex items-center justify-center w-12 h-12 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-900/50 transition-all shadow-lg backdrop-blur"
                    title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
                <button 
                    onClick={() => setShowHelp(true)}
                    className="flex items-center justify-center w-12 h-12 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-900/50 transition-all shadow-lg backdrop-blur"
                    title="Help"
                >
                    <Info size={24} />
                </button>
                <button 
                    onClick={() => {
                        const setup = createParticles(currentStep.setup);
                        setParticles(setup);
                        latestParticlesRef.current = setup;
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg border border-slate-700 transition-all text-sm font-bold uppercase tracking-wide shadow-lg backdrop-blur"
                >
                    <RefreshCw size={18} /> Reset
                </button>
                <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg border border-slate-700 transition-all text-sm font-bold uppercase tracking-wide shadow-lg backdrop-blur ${isRunning ? 'bg-red-900/80 hover:bg-red-800 text-red-200' : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200'}`}
                >
                    {isRunning ? <><Pause size={18} /> HALT</> : <><Play size={18} /> RUN</>}
                </button>
            </div>
            
            {/* Particle Controls */}
            <div className="flex gap-2 bg-slate-900/90 rounded-lg p-2 border border-cyan-900/30 shadow-xl backdrop-blur">
                 <button 
                    onClick={removeParticle} 
                    className="p-3 bg-red-900/20 text-red-400 hover:text-white hover:bg-red-600 rounded-md border border-red-900/50 transition-all" 
                    title="Remove Particle"
                >
                    <Minus size={20} />
                </button>
                <span className="text-cyan-400 text-lg self-center px-3 font-mono font-bold w-12 text-center">{particles.length}</span>
                <button 
                    onClick={addParticle} 
                    className="p-3 bg-emerald-900/20 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-md border border-emerald-900/50 transition-all" 
                    title="Add Particle"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Camera Controls */}
            <div className="flex gap-1 bg-slate-900/90 rounded-lg p-1 border border-slate-800 shadow-xl backdrop-blur">
                <button onClick={() => setZoom(z => Math.max(z * 0.9, 0.2))} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded" title="Zoom Out (-)">
                    <ZoomOut size={18} />
                </button>
                 <button onClick={handleResetCamera} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded" title="Reset Camera">
                    <Maximize size={18} />
                </button>
                <button onClick={() => setZoom(z => Math.min(z * 1.1, 5))} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded" title="Zoom In (+)">
                    <ZoomIn size={18} />
                </button>
            </div>
        </div>

        {/* QUIZ MODAL */}
        {quizState.active && quizState.question && (
            <QuizModal 
                questionData={quizState.question}
                onComplete={handleQuizComplete}
                onCancel={handleQuizCancel}
            />
        )}

        {/* LEARN MORE MODAL */}
        {showLearnMore && (
            <div className="absolute inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-lg animate-fade-in">
                <div className="bg-[#050505] rounded-xl border border-cyan-500/50 max-w-4xl w-full h-[80vh] shadow-[0_0_100px_rgba(6,182,212,0.15)] relative flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/20 shrink-0">
                        <div>
                             <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2 cyber-font flex items-center gap-3">
                                <GraduationCap size={32} />
                                DEEP DIVE: MODULE {stepIndex + 1}
                            </h3>
                             <p className="text-slate-400 text-lg uppercase tracking-wide font-mono">{currentStep.title}</p>
                        </div>
                        <button onClick={() => setShowLearnMore(false)} className="text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded transition-colors">
                            <X size={32} />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-300 leading-8 text-lg scrollbar-cyber max-h-full pr-4">
                        {currentStep.explanation}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex justify-end shrink-0">
                        <button onClick={() => setShowLearnMore(false)} className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-bold uppercase tracking-widest transition-colors cyber-font">
                            Return to Simulation
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Help Modal */}
        {showHelp && (
            <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                <div className="bg-slate-900 rounded border border-cyan-500/50 p-8 max-w-lg w-full shadow-[0_0_50px_rgba(6,182,212,0.2)] relative">
                    <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                        <X size={28} />
                    </button>
                    <h3 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-3 cyber-font uppercase">
                        <Info size={28} /> Systems Manual
                    </h3>
                    <ul className="space-y-4 text-slate-300 text-base leading-relaxed">
                        <li className="flex items-start gap-4">
                            <div className="bg-slate-800 p-2 rounded text-cyan-400"><RefreshCw size={20} /></div>
                            <div><strong>Interaction:</strong> Drag particles to perturb the field.</div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="bg-slate-800 p-2 rounded text-cyan-400"><Maximize size={20} /></div>
                            <div><strong>Navigation:</strong> Pan by dragging the void. Zoom with +/-.</div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="bg-slate-800 p-2 rounded text-cyan-400"><Plus size={20} /></div>
                            <div><strong>Modification:</strong> Inject/Eject particles to test stability.</div>
                        </li>
                    </ul>
                    <button onClick={() => setShowHelp(false)} className="w-full mt-8 py-4 bg-cyan-700 hover:bg-cyan-600 rounded text-white font-bold transition-colors cyber-font uppercase tracking-widest">
                        Acknowledge
                    </button>
                </div>
            </div>
        )}

        {/* Particle Inspector */}
        {selectedParticle && (
            <div className="absolute top-6 left-6 w-72 bg-slate-900/90 backdrop-blur-md rounded border border-cyan-500/30 shadow-2xl z-30 animate-fade-in-up p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                    <h4 className="text-cyan-400 font-bold flex items-center gap-2 cyber-font">
                        <Microscope size={20} /> NODE_{selectedParticle.id}
                    </h4>
                    <button onClick={() => setSelectedParticle(null)} className="text-slate-500 hover:text-white">&times;</button>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                    <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                        <span className="text-slate-400 uppercase text-xs tracking-wider">Activation (x)</span>
                        <span className="font-mono text-cyan-300 font-bold text-lg">{selectedParticle.val.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                        <span className="text-slate-400 uppercase text-xs tracking-wider">Phase (φ)</span>
                        <span className="font-mono text-purple-400 font-bold text-lg">{(selectedParticle.phase / Math.PI).toFixed(2)}π</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                        <span className="text-slate-400 uppercase text-xs tracking-wider">Spin (s)</span>
                        <span className={`font-mono font-bold text-lg ${selectedParticle.spin > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {selectedParticle.spin > 0 ? '↑ UP' : '↓ DOWN'}
                        </span>
                    </div>
                </div>
                {selectedParticle.isFixed && (
                    <div className="mt-4 text-xs bg-red-900/30 text-red-200 p-3 rounded border border-red-500/30 flex gap-2 items-center uppercase tracking-wider font-bold">
                        <Info size={14} /> Sensory Node (Fixed)
                    </div>
                )}
            </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 p-5 bg-slate-900/90 backdrop-blur rounded border border-slate-700 text-sm z-20 pointer-events-none text-slate-300 shadow-xl">
            <div className="font-bold mb-3 text-slate-500 uppercase text-[10px] tracking-[0.2em] cyber-font">System Key</div>
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                    <span className="font-mono text-xs">SENSORY_NODE</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                    <span className="font-mono text-xs">PROCESSING_NODE</span>
                </div>
                {currentStep.config.spinEnabled && (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full border-2 border-emerald-500"></div>
                            <span className="font-mono text-xs text-emerald-400">SPIN_UP (+0.5)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-transparent border-dashed"></div>
                            <span className="font-mono text-xs text-orange-400">SPIN_DOWN (-0.5)</span>
                        </div>
                    </>
                )}
                {currentStep.config.couplingEnabled && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-1 border-b-2 border-dashed border-purple-500"></div>
                        <span className="font-mono text-xs text-purple-400">VIB_COUPLING</span>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}