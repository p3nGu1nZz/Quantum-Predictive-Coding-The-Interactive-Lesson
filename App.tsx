import React, { useState, useEffect, useRef } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { SymbolTable } from './components/SymbolTable';
import { AudioNarrator } from './components/AudioNarrator'; 
import { MatrixBackground } from './components/MatrixBackground'; 
import { AdminPanel } from './components/AdminPanel';
import { Particle, Interaction, Vector2, QuizQuestion, LessonStep, ScriptedEvent } from './types';
import { createParticles } from './lessons/setups';
import { LESSON_STEPS } from './lessons/content';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { ChevronRight, ChevronLeft, Microscope, Settings, Layout, Monitor } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false); 
  const [loadingProgress, setLoadingProgress] = useState(0);   
  const [stepAudioProgress, setStepAudioProgress] = useState(0); 
  const [currentPlaybackProgress, setCurrentPlaybackProgress] = useState(0); 
  const [cacheVersion, setCacheVersion] = useState(0); 
  
  const [stepIndex, setStepIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>(createParticles('grid'));
  const [isRunning, setIsRunning] = useState(true);
  const [frame, setFrame] = useState(0);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  
  // Camera State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Vector2>({ x: 0, y: 0 });
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true); // Default to Auto-Play for recording
  const [showAdmin, setShowAdmin] = useState(false);

  // Lesson State
  const [activeTab, setActiveTab] = useState(0); // For tabbed lesson content

  // Audio Cache
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  const ttsQueue = useRef<Array<() => Promise<void>>>([]);
  const isProcessingQueue = useRef(false);

  // Refs
  const latestParticlesRef = useRef<Particle[]>(particles);
  const isUpdatingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const currentStep = LESSON_STEPS[stepIndex] || LESSON_STEPS[0];
  const [currentConfig, setCurrentConfig] = useState(currentStep.config);

  // Update config when step changes
  useEffect(() => {
    setCurrentConfig(currentStep.config);
    setActiveTab(0); // Reset tab
  }, [stepIndex]);

  const handleScriptTrigger = (evt: ScriptedEvent) => {
      // Always allow script triggers in this mode to ensure visual fidelity
      if (evt.type === 'setTab' && evt.value !== undefined) {
          setActiveTab(evt.value);
      }
      if (evt.type === 'zoom' && evt.targetZoom !== undefined) {
          setZoom(evt.targetZoom);
      }
      if (evt.type === 'pan' && evt.targetPan !== undefined) {
          setPan(evt.targetPan);
      }
      if (evt.type === 'reset') {
          setZoom(1);
          setPan({x:0, y:0});
      }
  };

  async function decodeFileAudioData(data: ArrayBuffer, ctx: AudioContext): Promise<AudioBuffer> {
    return ctx.decodeAudioData(data);
  }

  function decodePCM(buffer: ArrayBuffer, ctx: AudioContext): AudioBuffer {
    const dataInt16 = new Int16Array(buffer);
    const numChannels = 1; 
    const sampleRate = 24000;
    const frameCount = dataInt16.length; 
    const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0; 
    }
    return audioBuffer;
  }

  const processQueue = async () => {
    if (isProcessingQueue.current || ttsQueue.current.length === 0) return;
    isProcessingQueue.current = true;
    const task = ttsQueue.current.shift();
    if (task) { try { await task(); } catch (e) { console.error("Queue task failed", e); } }
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
      if (!process.env.API_KEY) return null;
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-preview-tts',
              contents: [{ parts: [{ text }] }],
              config: {
                  responseModalities: ['AUDIO'],
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
              }
          });
          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
              return bytes.buffer;
          }
      } catch (e) { console.error("Gemini TTS Error:", e); }
      return null;
  };

  const fetchAudioForStep = async (step: LessonStep, stepIdx: number, onProgress?: (percent: number) => void): Promise<ArrayBuffer | undefined> => {
      if (!step.narration) { if (onProgress) onProgress(100); return undefined; }
      const narrationKey = step.narration;
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (fetchingRef.current.has(narrationKey)) return undefined; 
      fetchingRef.current.add(narrationKey);
      if (onProgress) onProgress(10);
      try {
          const paddedIndex = (stepIdx + 1).toString().padStart(2, '0');
          const filePath = `audio/step_${paddedIndex}.mp3`; 
          const response = await fetch(filePath);
          if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              if (audioContextRef.current) {
                  const buffer = await decodeFileAudioData(arrayBuffer, audioContextRef.current);
                  audioCacheRef.current.set(narrationKey, buffer);
                  setCacheVersion(v => v + 1);
              }
              if (onProgress) onProgress(100);
              fetchingRef.current.delete(narrationKey);
              return arrayBuffer;
          }
      } catch (e) {}
      return new Promise<ArrayBuffer | undefined>((resolve) => {
          enqueueTask(async () => {
              let currentFakeProgress = 10;
              const progressInterval = setInterval(() => {
                  currentFakeProgress += (90 - currentFakeProgress) * 0.1;
                  if (onProgress) onProgress(currentFakeProgress);
              }, 200);
              const generatedBuffer = await generateSpeech(step.narration!);
              clearInterval(progressInterval);
              if (generatedBuffer && audioContextRef.current) {
                  try {
                      const buffer = decodePCM(generatedBuffer, audioContextRef.current);
                      audioCacheRef.current.set(narrationKey, buffer);
                      setCacheVersion(v => v + 1);
                  } catch (e) {}
                  if (onProgress) onProgress(100);
                  fetchingRef.current.delete(narrationKey);
                  resolve(generatedBuffer);
              } else {
                  if (onProgress) onProgress(0);
                  fetchingRef.current.delete(narrationKey);
                  resolve(undefined);
              }
          });
      });
  };

  const processBackgroundAudio = async (steps: LessonStep[]) => {
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
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const initialStep = LESSON_STEPS[0];
      await fetchAudioForStep(initialStep, 0);
      setLoadingProgress(100);
      setIsInitialLoading(false);
      setHasStarted(true);
      const remainingSteps = LESSON_STEPS.slice(1);
      processBackgroundAudio(remainingSteps);
  };

  useEffect(() => {
      if (!hasStarted) return;
      const checkAudio = async () => {
          const step = LESSON_STEPS[stepIndex];
          setStepAudioProgress(0); 
          setCurrentPlaybackProgress(0); 
          if (step.narration) {
              if (audioCacheRef.current.has(step.narration)) {
                  setStepAudioProgress(100);
              } else {
                  await fetchAudioForStep(step, stepIndex, (p) => setStepAudioProgress(p));
              }
          } else {
              setStepAudioProgress(100);
          }
      };
      checkAudio();
  }, [stepIndex, hasStarted]);

  useEffect(() => {
     if (sidebarRef.current) sidebarRef.current.scrollTo(0, 0);
  }, [stepIndex]);

  useEffect(() => {
    if (currentStep) {
        const newParticles = createParticles(currentStep.setup);
        setParticles(newParticles);
        latestParticlesRef.current = newParticles; 
        isUpdatingRef.current = false;
        setFrame(0);
        setIsRunning(true);
        setSelectedParticle(null);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }
  }, [stepIndex, currentStep?.setup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '=' || e.key === '+') setZoom(z => Math.min(z * 1.1, 5));
        else if (e.key === '-') setZoom(z => Math.max(z * 0.9, 0.2));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdate = (newParticles: Particle[], interactions: Interaction[], energy: { pred: number, pos: number, historyError?: number }) => {
    if (!isUpdatingRef.current || newParticles.length === particles.length) {
        latestParticlesRef.current = newParticles;
        if (newParticles.length === particles.length) isUpdatingRef.current = false;
    }
    setFrame(f => f + 1);
    if (selectedParticle) {
        const updated = newParticles.find(p => p.id === selectedParticle.id);
        if (updated) setSelectedParticle(updated);
    }
  };

  const attemptNextStep = (forceBypass = false) => {
      const nextIndex = stepIndex + 1;
      if (nextIndex < LESSON_STEPS.length) {
          setStepIndex(nextIndex);
      }
  };

  if (isInitialLoading) {
      return (
          <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-serif text-cyan-400 relative overflow-hidden">
               <MatrixBackground />
               <div className="z-10 bg-black/80 p-10 rounded-xl border border-cyan-900/50 backdrop-blur-sm flex flex-col items-center">
                    {/* <Loader2 size={64} className="animate-spin mb-6" /> */}
                    <h2 className="text-3xl font-bold mb-4 cyber-font tracking-widest">INITIALIZING</h2>
                    <div className="w-96 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-300" style={{width: `${loadingProgress}%`}}/>
                    </div>
               </div>
          </div>
      );
  }

  if (!hasStarted) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-serif">
         <MatrixBackground />
         <div className="z-10 text-center max-w-4xl px-6 animate-fade-in-up bg-black/60 p-12 rounded-2xl border border-cyan-900/30 backdrop-blur-sm">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-2 tracking-tighter cyber-font leading-tight">
                L-Group Predictive Coding Networks
            </h1>
            <h2 className="text-xl md:text-2xl text-cyan-200 mb-8 font-mono tracking-widest uppercase border-b border-cyan-500/30 pb-4 inline-block">
                with Vibrationally Coupled Particles
            </h2>
            <div className="mb-8 text-slate-400 font-mono text-sm space-y-1">
                <p>Cat Game Research Copyright 2026</p>
                <p>Authors: Kara Rawson & Aimee Chrzanowski</p>
            </div>
            <button onClick={handleInitialize} className="group relative px-12 py-6 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-100 font-bold text-xl rounded border-2 border-cyan-500 transition-all flex items-center gap-4 mx-auto cyber-font uppercase tracking-widest">
               <span>Initialize Simulation</span>
               <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden text-slate-200 bg-black relative pb-24">
      <button onClick={() => setShowAdmin(true)} className="fixed top-3 left-3 z-[100] p-2 text-slate-600 hover:text-cyan-400 bg-black/20 hover:bg-black/90 backdrop-blur rounded-full transition-all border border-transparent hover:border-cyan-500/50" title="Admin Console">
        <Settings size={16} />
      </button>

      <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} lessonSteps={LESSON_STEPS} fetchAudioForStep={(step) => fetchAudioForStep(step, LESSON_STEPS.indexOf(step))} />

      {!isFullScreen && (
      <div className="w-full md:w-2/5 flex flex-col border-r border-slate-800 bg-[#080808] z-10 shadow-2xl relative">
        <div className="p-8 border-b border-slate-800 bg-black/50 backdrop-blur-sm pl-12 flex justify-between items-start">
          <div>
              <div className="flex items-center gap-3 mb-2">
                 <button onClick={() => setIsFullScreen(true)} className="text-slate-500 hover:text-cyan-400" title="Hide UI (Record Mode)">
                    <Monitor size={20} />
                 </button>
                 <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cyber-font">L-GROUP PCN</h1>
              </div>
          </div>
        </div>

        <div ref={sidebarRef} className="flex-1 overflow-hidden relative flex flex-col">
           {/* Header Area */}
           <div className="p-10 pb-4 shrink-0">
               <h3 className="text-2xl font-bold text-slate-100 cyber-font">{currentStep.title}</h3>
           </div>
           
           {/* TABBED INTERFACE */}
           {currentStep.subsections && currentStep.subsections.length > 0 ? (
               <div className="flex-1 flex flex-col min-h-0">
                   {/* Tabs */}
                   <div className="flex border-b border-slate-800 px-10 gap-4 shrink-0 overflow-x-auto">
                       {currentStep.subsections.map((sub, idx) => (
                           <button
                               key={idx}
                               onClick={() => setActiveTab(idx)}
                               className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                                   activeTab === idx 
                                   ? 'text-cyan-400 border-cyan-500' 
                                   : 'text-slate-500 border-transparent hover:text-slate-300'
                               }`}
                           >
                               {sub.title}
                           </button>
                       ))}
                   </div>
                   
                   {/* Content Area */}
                   <div className="flex-1 overflow-y-auto p-10 relative">
                       <div className="animate-fade-in text-lg text-slate-300 leading-relaxed">
                           {currentStep.subsections[activeTab].content}
                       </div>
                   </div>
               </div>
           ) : (
               /* Fallback Legacy Layout */
               <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-cyber">
                   <div className="text-slate-200 text-lg leading-relaxed">{currentStep.content}</div>
                   <SymbolTable symbols={currentStep.symbols} />
               </div>
           )}
           
           <div className="p-10 pt-4 flex items-center gap-4 shrink-0 border-t border-slate-800 bg-black/20">
               <button onClick={() => setStepIndex(Math.max(0, stepIndex-1))} disabled={stepIndex===0} className="flex-1 px-4 py-3 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-30">Prev</button>
               <button onClick={() => attemptNextStep()} className="flex-1 px-4 py-3 rounded bg-cyan-900/30 border border-cyan-600 text-cyan-400">Next</button>
           </div>
        </div>
        <AudioNarrator text={currentStep.narration || ""} title={currentStep.title} onPrev={() => setStepIndex(Math.max(0, stepIndex-1))} onNext={() => attemptNextStep(false)} canPrev={stepIndex > 0} canNext={true} isAutoPlay={isAutoPlay} onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)} onAutoNext={() => attemptNextStep(true)} audioCache={audioCacheRef.current} audioContext={audioContextRef.current} cacheVersion={cacheVersion} loadingProgress={stepAudioProgress} onProgressUpdate={setCurrentPlaybackProgress} />
      </div>
      )}

      <div className={`flex-1 relative bg-black h-[50vh] md:h-auto overflow-hidden transition-all duration-500 ${isFullScreen ? 'w-full' : ''}`}>
        <MatrixBackground />
        {isFullScreen && (
            <button onClick={() => setIsFullScreen(false)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-cyan-900">
                <Layout size={20} />
            </button>
        )}
        
        <SimulationCanvas 
            particles={particles}
            config={currentConfig} 
            onUpdate={handleUpdate}
            onSelectParticle={setSelectedParticle}
            isRunning={isRunning}
            interactionMode="drag"
            zoom={zoom}
            pan={pan}
            onPan={setPan}
            playbackProgress={currentPlaybackProgress}
            script={currentStep.script}
            onScriptTrigger={handleScriptTrigger}
        />

        {selectedParticle && (
            <div className="absolute top-6 left-6 w-72 bg-slate-900/90 backdrop-blur-md rounded border border-cyan-500/30 shadow-2xl z-30 p-5">
                 <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                    <h4 className="text-cyan-400 font-bold flex items-center gap-2 cyber-font">
                        <Microscope size={20} /> CELL_{selectedParticle.id}
                    </h4>
                    <button onClick={() => setSelectedParticle(null)} className="text-slate-500 hover:text-white">&times;</button>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                    <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                        <span className="text-slate-400 uppercase text-xs tracking-wider">Biomass</span>
                        <span className="font-mono text-cyan-300 font-bold text-lg">{selectedParticle.val.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                        <span className="text-slate-400 uppercase text-xs tracking-wider">Colony ID</span>
                        <span className="font-mono text-purple-300 font-bold text-lg">{selectedParticle.colonyId || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                        <span className="text-slate-400 uppercase text-xs tracking-wider">Spin</span>
                        <span className="font-mono text-green-300 font-bold text-lg">{selectedParticle.spin > 0 ? 'UP' : 'DOWN'}</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}