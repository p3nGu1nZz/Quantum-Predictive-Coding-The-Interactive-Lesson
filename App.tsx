import React, { useState, useEffect, useRef } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { SymbolTable } from './components/SymbolTable';
import { AudioNarrator } from './components/AudioNarrator'; 
import { MatrixBackground } from './components/MatrixBackground'; 
import { AdminPanel } from './components/AdminPanel';
import { Particle, Interaction, Vector2, QuizQuestion, LessonStep } from './types';
import { createParticles } from './lessons/setups';
import { LESSON_STEPS } from './lessons/content';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { ChevronRight, ChevronLeft, Activity, Sparkles, Microscope, BookOpen, List, Award, RotateCcw, Loader2, Settings } from 'lucide-react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from "@google/genai";

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false); 
  const [loadingProgress, setLoadingProgress] = useState(0);   
  const [stepAudioProgress, setStepAudioProgress] = useState(0); 
  const [currentPlaybackProgress, setCurrentPlaybackProgress] = useState(0); // New state
  const [cacheVersion, setCacheVersion] = useState(0); 
  
  const [stepIndex, setStepIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>(createParticles('grid'));
  const [isRunning, setIsRunning] = useState(true);
  const [energyData, setEnergyData] = useState<{t: number, E: number}[]>([]);
  const [frame, setFrame] = useState(0);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Vector2>({ x: 0, y: 0 });
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [predictionError, setPredictionError] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [quizzesEnabled, setQuizzesEnabled] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  // Lesson State
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);

  // Quiz State
  const [quizState, setQuizState] = useState<{
    active: boolean;
    question: QuizQuestion | null;
    targetStep: number;
  }>({ active: false, question: null, targetStep: 0 });

  // Audio Cache (In-Memory Layer)
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());

  // Generation Queue to prevent Rate Limiting
  const ttsQueue = useRef<Array<() => Promise<void>>>([]);
  const isProcessingQueue = useRef(false);

  // Refs
  const latestParticlesRef = useRef<Particle[]>(particles);
  const isUpdatingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Safe check for bounds
  const currentStep = LESSON_STEPS[stepIndex] || LESSON_STEPS[0];

  // Helper: Decode Standard Audio File (MP3/WAV)
  async function decodeFileAudioData(data: ArrayBuffer, ctx: AudioContext): Promise<AudioBuffer> {
    return ctx.decodeAudioData(data);
  }

  // Helper: Decode Raw PCM Data (Gemini Output)
  // Gemini 2.5 Flash TTS typically outputs 24kHz, 1 channel, 16-bit PCM
  function decodePCM(buffer: ArrayBuffer, ctx: AudioContext): AudioBuffer {
    const dataInt16 = new Int16Array(buffer);
    const numChannels = 1; 
    const sampleRate = 24000;
    const frameCount = dataInt16.length; 
    
    const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
        // Convert Int16 to Float32 [-1.0, 1.0]
        channelData[i] = dataInt16[i] / 32768.0; 
    }
    return audioBuffer;
  }

  // --- AUDIO QUEUE PROCESSOR ---
  const processQueue = async () => {
    if (isProcessingQueue.current || ttsQueue.current.length === 0) return;
    isProcessingQueue.current = true;
    
    const task = ttsQueue.current.shift();
    if (task) {
        try {
            await task();
        } catch (e) {
            console.error("Queue task failed", e);
        }
    }
    
    // STRICT RATE LIMITING:
    // Add a mandatory delay between requests to prevent 429 errors.
    // 2000ms delay ensures we don't spam the server.
    setTimeout(() => {
        isProcessingQueue.current = false;
        if (ttsQueue.current.length > 0) processQueue();
    }, 2000); 
  };

  const enqueueTask = (task: () => Promise<void>) => {
      ttsQueue.current.push(task);
      processQueue();
  };

  const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
      if (!process.env.API_KEY) {
          console.warn("No API Key found for TTS generation.");
          return null;
      }
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-preview-tts',
              contents: [{ parts: [{ text }] }],
              config: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                      voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: 'Kore' }
                      }
                  }
              }
          });
          
          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
              }
              return bytes.buffer;
          }
      } catch (e) {
          console.error("Gemini TTS Error:", e);
      }
      return null;
  };

  // --- AUDIO LOADING SYSTEM ---
  
  const fetchAudioForStep = async (step: LessonStep, stepIdx: number, onProgress?: (percent: number) => void): Promise<ArrayBuffer | undefined> => {
      if (!step.narration) {
          if (onProgress) onProgress(100);
          return undefined;
      }
      
      const narrationKey = step.narration;
      
      // Ensure AudioContext
      if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (fetchingRef.current.has(narrationKey)) return undefined; // Busy
      fetchingRef.current.add(narrationKey);

      if (onProgress) onProgress(10);

      // 1. Try Static File first (fastest)
      try {
          const paddedIndex = (stepIdx + 1).toString().padStart(2, '0');
          // Sanitize title for filename
          const safeTitle = step.title.split(':')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const filePath = `audio/step_${paddedIndex}.mp3`; // Reverted to simple index for robustness
          
          const response = await fetch(filePath);
          if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              if (audioContextRef.current) {
                  // MP3s use the native browser decoder
                  const buffer = await decodeFileAudioData(arrayBuffer, audioContextRef.current);
                  audioCacheRef.current.set(narrationKey, buffer);
                  setCacheVersion(v => v + 1);
              }
              if (onProgress) onProgress(100);
              fetchingRef.current.delete(narrationKey);
              return arrayBuffer;
          }
      } catch (e) {
          // Fall through to generation
      }

      // 2. Generate with API (Queued)
      return new Promise<ArrayBuffer | undefined>((resolve) => {
          enqueueTask(async () => {
              // Simulate progress while waiting for API
              let currentFakeProgress = 10;
              const progressInterval = setInterval(() => {
                  currentFakeProgress += (90 - currentFakeProgress) * 0.1;
                  if (onProgress) onProgress(currentFakeProgress);
              }, 200);

              if (onProgress) onProgress(15);
              const generatedBuffer = await generateSpeech(step.narration!);
              
              clearInterval(progressInterval);

              if (generatedBuffer) {
                  if (audioContextRef.current) {
                      try {
                          // Generated audio is Raw PCM, use manual decoder
                          const buffer = decodePCM(generatedBuffer, audioContextRef.current);
                          audioCacheRef.current.set(narrationKey, buffer);
                          setCacheVersion(v => v + 1);
                      } catch (e) {
                          console.error("PCM Decode failed", e);
                      }
                  }
                  if (onProgress) onProgress(100);
                  fetchingRef.current.delete(narrationKey);
                  resolve(generatedBuffer);
              } else {
                  console.warn("Failed to generate audio for step " + (stepIdx + 1));
                  if (onProgress) onProgress(0);
                  fetchingRef.current.delete(narrationKey);
                  resolve(undefined);
              }
          });
      });
  };

  const processBackgroundAudio = async (steps: LessonStep[]) => {
      // Load remaining steps
      for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const globalIdx = LESSON_STEPS.indexOf(step);
          
          if (audioCacheRef.current.has(step.narration || "")) continue; 
          
          fetchAudioForStep(step, globalIdx); 
          await new Promise(r => setTimeout(r, 200)); 
      }
  };

  const handleInitialize = async () => {
      setIsInitialLoading(true);
      
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Load first 1 step critically
      const initialStep = LESSON_STEPS[0];
      await fetchAudioForStep(initialStep, 0);
      setLoadingProgress(100);

      setIsInitialLoading(false);
      setHasStarted(true);

      // Background load the rest
      const remainingSteps = LESSON_STEPS.slice(1);
      processBackgroundAudio(remainingSteps);
  };

  // Check audio availability on step change
  useEffect(() => {
      if (!hasStarted) return;
      
      const checkAudio = async () => {
          const step = LESSON_STEPS[stepIndex];
          setStepAudioProgress(0); // Reset progress bar
          setCurrentPlaybackProgress(0); // Reset playback timeline

          if (step.narration) {
              // Check if already cached
              if (audioCacheRef.current.has(step.narration)) {
                  setStepAudioProgress(100);
              } else {
                  // Fetch explicitly for this step if missing
                  await fetchAudioForStep(step, stepIndex, (p) => setStepAudioProgress(p));
              }
          } else {
              setStepAudioProgress(100);
          }
      };
      
      checkAudio();
  }, [stepIndex, hasStarted]);

  // Scroll to top when step changes
  useEffect(() => {
     if (sidebarRef.current) {
         sidebarRef.current.scrollTo(0, 0);
     }
  }, [stepIndex, showResults]);

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

  const handleResetCamera = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
  };

  // --- Quiz Logic ---
  const attemptNextStep = (forceBypass = false) => {
      const nextIndex = stepIndex + 1;
      if (nextIndex >= LESSON_STEPS.length) {
          setShowResults(true);
          return;
      }
      
      if (!forceBypass && quizzesEnabled && currentStep.questions && currentStep.questions.length > 0) {
          const qIndex = Math.floor(Math.random() * currentStep.questions.length);
          const question = currentStep.questions[qIndex];
          setQuizState({
              active: true,
              question: question,
              targetStep: nextIndex
          });
      } else {
          setStepIndex(nextIndex);
      }
  };

  const handlePrevStep = () => {
      setStepIndex(Math.max(0, stepIndex - 1));
  };

  const handleQuizResult = (correct: boolean) => {
      setScore(prev => ({
          correct: prev.correct + (correct ? 1 : 0),
          total: prev.total + 1
      }));
      setQuizState(prev => ({ ...prev, active: false }));
      setStepIndex(quizState.targetStep);
  };

  const handleDisableQuizzes = () => {
      setQuizzesEnabled(false);
      setQuizState(prev => ({ ...prev, active: false }));
      setStepIndex(quizState.targetStep); 
  };

  const handleRestart = () => {
      setStepIndex(0);
      setScore({ correct: 0, total: 0 });
      setShowResults(false);
      setQuizzesEnabled(true);
      setIsAutoPlay(false);
  };

  const handleJumpToStep = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value);
      setStepIndex(idx);
      setShowResults(false);
  };

  // --- Loading Screen (Initial Only) ---
  if (isInitialLoading) {
      return (
          <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-serif text-cyan-400 relative overflow-hidden">
               <MatrixBackground />
               <div className="z-10 bg-black/80 p-10 rounded-xl border border-cyan-900/50 backdrop-blur-sm flex flex-col items-center">
                    <Loader2 size={64} className="animate-spin mb-6" />
                    <h2 className="text-3xl font-bold mb-4 cyber-font tracking-widest">
                       INITIALIZING NEURAL LINK
                    </h2>
                    <p className="mb-6 text-slate-400 font-mono">
                        Synthesizing initial data streams...
                    </p>
                    <div className="w-96 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div 
                            className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-300" 
                            style={{width: `${loadingProgress}%`}}
                        />
                    </div>
                    <div className="mt-2 font-mono text-sm">{Math.round(loadingProgress)}%</div>
               </div>
          </div>
      );
  }

  // --- Splash Screen ---
  if (!hasStarted) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-serif">
         <MatrixBackground />
         
         <div className="z-10 text-center max-w-4xl px-6 animate-fade-in-up bg-black/60 p-12 rounded-2xl border border-cyan-900/30 backdrop-blur-sm">
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
               onClick={handleInitialize}
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
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-slate-200 bg-black relative pb-24">
      
      {/* --- ADMIN TRIGGER --- */}
      <button 
        onClick={() => setShowAdmin(true)}
        className="fixed top-3 left-3 z-[100] p-2 text-slate-600 hover:text-cyan-400 bg-black/20 hover:bg-black/90 backdrop-blur rounded-full transition-all border border-transparent hover:border-cyan-500/50"
        title="Admin Console"
      >
        <Settings size={16} />
      </button>

      {/* --- ADMIN PANEL --- */}
      <AdminPanel 
         isOpen={showAdmin} 
         onClose={() => setShowAdmin(false)}
         lessonSteps={LESSON_STEPS}
         fetchAudioForStep={(step) => fetchAudioForStep(step, LESSON_STEPS.indexOf(step))}
      />

      {/* --- LEFT: SIDEBAR / LESSON CONTROL --- */}
      {!isFullScreen && (
      <div className="w-full md:w-2/5 flex flex-col border-r border-slate-800 bg-[#080808] z-10 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"></div>

        <div className="p-8 border-b border-slate-800 bg-black/50 backdrop-blur-sm pl-12">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                 <button onClick={() => setHasStarted(false)} className="hover:text-cyan-400 transition-colors" title="Back to Title">
                    <Sparkles size={28} className="text-cyan-500 neon-text" />
                 </button>
                 <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cyber-font tracking-tight">
                    QUANTUM PCN
                 </h1>
             </div>
          </div>
          
          {/* Quick Jump Dropdown */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <List size={16} />
            </div>
            <select 
                value={stepIndex} 
                onChange={handleJumpToStep}
                disabled={quizState.active}
                className="w-full bg-slate-900/80 border border-slate-700 text-cyan-400 text-lg rounded pl-10 pr-4 py-2 appearance-none cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div 
            ref={sidebarRef}
            className="flex-1 overflow-y-auto p-10 space-y-8 relative scrollbar-cyber"
        >
           {showResults ? (
               <div className="animate-fade-in space-y-8">
                   <div className="border-b border-slate-700 pb-6">
                       <h3 className="text-4xl font-bold text-yellow-400 cyber-font mb-2">Sim Complete</h3>
                       <p className="text-xl text-slate-400">Training module finished.</p>
                   </div>
                   
                   <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-700">
                       <div className="flex items-center gap-4 mb-6">
                           <Award size={48} className={score.correct / Math.max(1, score.total) > 0.7 ? "text-emerald-400" : "text-yellow-400"} />
                           <div>
                               <div className="text-sm uppercase tracking-widest text-slate-500">Final Efficiency</div>
                               <div className="text-4xl font-mono font-bold text-white">
                                   {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                               </div>
                           </div>
                       </div>
                       
                       <div className="space-y-2 mb-8">
                           <div className="flex justify-between text-lg border-b border-slate-800 pb-2">
                               <span>Correct Predictions</span>
                               <span className="font-mono text-emerald-400">{score.correct}</span>
                           </div>
                           <div className="flex justify-between text-lg border-b border-slate-800 pb-2">
                               <span>Total Challenges</span>
                               <span className="font-mono text-white">{score.total}</span>
                           </div>
                       </div>

                       <button 
                         onClick={handleRestart}
                         className="w-full py-4 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500 text-cyan-400 uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
                        >
                           <RotateCcw size={20} /> Reboot System
                       </button>
                   </div>
               </div>
           ) : (
             <>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-100 cyber-font leading-tight border-b-2 border-cyan-900/50 pb-4">
                    {currentStep.title}
                </h3>
                
                <div className="text-slate-200 text-xl md:text-2xl leading-relaxed font-normal tracking-wide">
                    {currentStep.content}
                </div>

                {currentStep.explanation && (
                    <button 
                        onClick={() => {
                            setShowLearnMore(true);
                        }}
                        disabled={quizState.active}
                        className="w-full py-4 mt-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-cyan-400 rounded-lg flex items-center justify-center gap-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <BookOpen size={20} className="group-hover:scale-110 transition-transform"/>
                        <span className="uppercase tracking-widest font-bold text-sm">Open Deep Dive Module</span>
                    </button>
                )}

                {/* Previous / Next Buttons in Sidebar */}
                <div className="flex items-center gap-4 mt-4">
                    <button 
                        onClick={handlePrevStep}
                        disabled={stepIndex === 0 || quizState.active}
                        className="flex-1 px-4 py-3 rounded border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 text-sm uppercase tracking-wider cyber-font"
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>

                    <button 
                        onClick={() => attemptNextStep()}
                        disabled={quizState.active}
                        className="flex-1 px-4 py-3 rounded bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400 border border-cyan-600 font-bold shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cyber-font disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>

                <SymbolTable symbols={currentStep.symbols} />

                <div className="text-center mt-12 text-xs font-bold text-slate-600 uppercase tracking-[0.2em] font-mono">
                    Segment {stepIndex + 1} / {LESSON_STEPS.length}
                </div>
             </>
           )}
           
            {/* Always Visible Control Panel */}
            <AudioNarrator 
                text={currentStep.narration || ""} 
                title={currentStep.title}
                onPrev={handlePrevStep}
                onNext={() => attemptNextStep(false)}
                canPrev={stepIndex > 0 && !quizState.active}
                canNext={!quizState.active}
                isAutoPlay={isAutoPlay}
                onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
                onAutoNext={() => attemptNextStep(true)}
                audioCache={audioCacheRef.current} // Pass the cache
                audioContext={audioContextRef.current} // Pass the context
                cacheVersion={cacheVersion} // Pass version to trigger updates
                loadingProgress={stepAudioProgress} // Pass granular progress
                onProgressUpdate={setCurrentPlaybackProgress} // Pass progress handler
            />
        </div>
      </div>
      )}

      {/* --- RIGHT: SIMULATION CANVAS --- */}
      <div className="flex-1 relative bg-black h-[50vh] md:h-auto overflow-hidden">
        <MatrixBackground />
        
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
            playbackProgress={currentPlaybackProgress}
            script={currentStep.script}
        />

        {/* Real-time Energy Chart Overlay */}
        {stepIndex > 1 && (
            <div className="absolute bottom-6 left-6 z-20 w-64 p-3 bg-black/60 rounded-lg border border-slate-800 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2 text-[10px] text-yellow-500 font-bold uppercase tracking-wider cyber-font">
                    <Activity size={12} /> System Free Energy
                </div>
                <div className="h-20 w-full rounded border border-slate-800/50 bg-black/40">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyData}>
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px' }}
                            itemStyle={{ color: '#facc15', fontSize: '10px', fontFamily: 'monospace' }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Line type="monotone" dataKey="E" stroke="#facc15" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* --- SYSTEM KEY (Moved to Canvas Layer) --- */}
        <div className="absolute bottom-6 right-6 p-4 bg-black/80 backdrop-blur border border-slate-800 rounded-lg text-xs z-10 pointer-events-none text-slate-300 shadow-xl">
             <div className="font-bold mb-2 text-slate-500 uppercase text-[10px] tracking-widest cyber-font">System Key</div>
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                    <span className="font-mono text-[10px] text-red-200">SENSORY</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                    <span className="font-mono text-[10px] text-cyan-200">PROCESSING</span>
                </div>
             </div>
        </div>

        {/* --- PARTICLE INSPECTOR (Canvas Overlay) --- */}
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
                        <span className="text-slate-400 uppercase text-xs tracking-wider">Spin (s)</span>
                        <span className={`font-mono font-bold text-lg ${selectedParticle.spin > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                            {selectedParticle.spin > 0 ? 'UP (+1/2)' : 'DOWN (-1/2)'}
                        </span>
                    </div>
                </div>
            </div>
        )}
      </div>

    </div>
  );
}