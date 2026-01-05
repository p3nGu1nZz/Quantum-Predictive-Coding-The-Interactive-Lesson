import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { SymbolTable } from './components/SymbolTable';
import { AudioNarrator } from './components/AudioNarrator'; 
import { MatrixBackground } from './components/MatrixBackground'; 
import { TitleScreen } from './components/TitleScreen';
import { Particle, Interaction, Vector2, LessonStep, ScriptedEvent } from './types';
import { createParticles } from './lessons/setups';
import { LESSON_STEPS } from './lessons/content';
import { Activity, ChevronLeft, ChevronRight, FastForward } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- IndexedDB Utils ---
const DB_NAME = 'QuantumPCN_AudioDB';
const STORE_NAME = 'audio_pcm_cache';
const DB_VERSION = 2; 

interface CachedAudio {
    text: string;
    buffer: ArrayBuffer;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

const getAudioFromDB = async (key: string): Promise<CachedAudio | undefined> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        return undefined;
    }
};

const saveAudioToDB = async (key: string, text: string, data: ArrayBuffer): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const item: CachedAudio = { text, buffer: data };
            const request = store.put(item, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IDB Save Error", e);
    }
};

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [initStatus, setInitStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);   
  const [currentPlaybackProgress, setCurrentPlaybackProgress] = useState(0); 
  const [cacheVersion, setCacheVersion] = useState(0); 
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  
  const [stepIndex, setStepIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>(createParticles('grid'));
  const [isRunning, setIsRunning] = useState(true);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  
  const [cameraMode, setCameraMode] = useState<'auto' | 'manual'>('auto');
  const [manualZoom, setManualZoom] = useState(1);
  const [manualPan, setManualPan] = useState<Vector2>({ x: 0, y: 0 });
  
  const [activeSubsectionIndex, setActiveSubsectionIndex] = useState(0); 

  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  const ttsQueue = useRef<Array<() => Promise<void>>>([]);
  const isProcessingQueue = useRef(false);
  const isQuotaExceeded = useRef(false); 

  const latestParticlesRef = useRef<Particle[]>(particles);
  
  const currentStep = LESSON_STEPS[stepIndex] || LESSON_STEPS[0];
  const [currentConfig, setCurrentConfig] = useState(currentStep.config);

  useEffect(() => {
    setCurrentConfig(currentStep.config);
    setActiveSubsectionIndex(0); 
    setCurrentPlaybackProgress(0); 
    setCameraMode('auto'); 
    setManualZoom(1);
    setManualPan({ x: 0, y: 0 });
    const newParticles = createParticles(currentStep.setup);
    setParticles(newParticles);
    latestParticlesRef.current = newParticles;
    setSelectedParticle(null);
  }, [stepIndex, currentStep]);

  useEffect(() => {
      if (currentStep.subsections) {
          let idx = 0;
          for (let i = 0; i < currentStep.subsections.length; i++) {
              if (currentPlaybackProgress >= currentStep.subsections[i].at) {
                  idx = i;
              }
          }
          setActiveSubsectionIndex(idx);
      }
  }, [currentPlaybackProgress, currentStep.subsections]);

  const handleScriptTrigger = useCallback((evt: ScriptedEvent) => {
      if (evt.type === 'zoom' && evt.targetZoom !== undefined) {
          setManualZoom(evt.targetZoom);
          setCameraMode('manual');
      }
      if (evt.type === 'pan' && evt.targetPan !== undefined) {
          setManualPan(evt.targetPan);
          setCameraMode('manual');
      }
      if (evt.type === 'reset') { 
          setCameraMode('auto'); 
          setManualZoom(1);
          setManualPan({ x: 0, y: 0 });
      }
  }, []);

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

  const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
      if (!process.env.API_KEY) return null;
      if (isQuotaExceeded.current) return null; 

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
      } catch (e: any) { 
          console.error("Gemini TTS Error:", e); 
          if (e.toString().includes('429') || e.toString().includes('quota') || e.toString().includes('RESOURCE_EXHAUSTED')) {
              console.warn("API Quota Exceeded. Disabling further TTS requests for this session.");
              isQuotaExceeded.current = true;
          }
      }
      return null;
  };

  const loadAudioImmediate = async (step: LessonStep, stepIdx: number): Promise<boolean> => {
      if (!soundEnabled) return true; 
      if (!step.narration) return true;
      const textToSpeak = step.narration;
      const cacheKey = `step_${stepIdx}`; 
      
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (audioCacheRef.current.has(textToSpeak)) return true;

      // 1. Try IndexedDB - Checks if cached text matches current text
      let idbMiss = true;
      try {
          const cachedItem = await getAudioFromDB(cacheKey);
          if (cachedItem && cachedItem.text === textToSpeak) {
              const buffer = decodePCM(cachedItem.buffer, audioContextRef.current);
              audioCacheRef.current.set(textToSpeak, buffer); 
              idbMiss = false;
              return true;
          }
      } catch(e) { }

      // 2. Fallback to API if DB miss or text changed
      if (idbMiss && !isQuotaExceeded.current) {
          const generatedBuffer = await generateSpeech(textToSpeak);
          if (generatedBuffer) {
              try {
                  const buffer = decodePCM(generatedBuffer, audioContextRef.current);
                  audioCacheRef.current.set(textToSpeak, buffer);
                  // Save with new text, overwriting old if key exists
                  saveAudioToDB(cacheKey, textToSpeak, generatedBuffer);
                  return true;
              } catch (e) { console.error(e); }
          }
      }

      // 3. Last Resort: Try local file
      try {
          const paddedIndex = (stepIdx + 1).toString().padStart(2, '0');
          const filePath = `audio/step_${paddedIndex}.mp3`; 
          const response = await fetch(filePath);
          if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = await decodeFileAudioData(arrayBuffer, audioContextRef.current);
              audioCacheRef.current.set(textToSpeak, buffer);
              return true;
          }
      } catch (e) {}

      return false;
  };

  const processQueue = async () => {
    if (isProcessingQueue.current || ttsQueue.current.length === 0) return;
    isProcessingQueue.current = true;
    const task = ttsQueue.current.shift();
    if (task) { try { await task(); } catch (e) { console.error("Queue task failed", e); } }
    setTimeout(() => {
        isProcessingQueue.current = false;
        if (ttsQueue.current.length > 0) processQueue();
    }, 500);
  };

  const enqueueTask = (task: () => Promise<void>) => {
      ttsQueue.current.push(task);
      processQueue();
  };

  const fetchAudioForStep = async (step: LessonStep, stepIdx: number): Promise<void> => {
      if (!soundEnabled) return;
      if (!step.narration) return;
      const textToSpeak = step.narration;
      
      const cacheKey = `step_${stepIdx}`;
      if (isQuotaExceeded.current) {
          const cached = await getAudioFromDB(cacheKey);
          if (cached && cached.text === textToSpeak) {
               if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
               const buffer = decodePCM(cached.buffer, audioContextRef.current);
               audioCacheRef.current.set(textToSpeak, buffer);
               return;
          }
      }

      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCacheRef.current.has(textToSpeak) || fetchingRef.current.has(textToSpeak)) return; 
      fetchingRef.current.add(textToSpeak);

      enqueueTask(async () => {
         await loadAudioImmediate(step, stepIdx);
         setCacheVersion(v => v + 1);
         fetchingRef.current.delete(textToSpeak);
      });
  };

  const handleTitleAction = async () => {
      if (initStatus === 'idle') {
          setInitStatus('loading');
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          
          const progressInterval = setInterval(() => {
              setLoadingProgress(prev => prev >= 95 ? prev : prev + 0.5);
          }, 50);
          
          try {
              await loadAudioImmediate(LESSON_STEPS[0], 0);
              setCacheVersion(v => v + 1);
              loadAudioImmediate(LESSON_STEPS[1], 1).then(() => setCacheVersion(v => v + 1));
          } catch (e) {
              console.error("Audio Load Error:", e);
          } finally {
              clearInterval(progressInterval);
              setLoadingProgress(100);
              setInitStatus('ready');
          }
      } else if (initStatus === 'ready') {
          if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
          }
          setHasStarted(true);
      }
  };

  useEffect(() => {
      if (!hasStarted) return;
      
      const current = LESSON_STEPS[stepIndex];
      fetchAudioForStep(current, stepIndex);
      
      const nextStep = LESSON_STEPS[stepIndex + 1];
      if (nextStep) {
          fetchAudioForStep(nextStep, stepIndex + 1);
      }
  }, [stepIndex, hasStarted]);

  const handleUpdate = useCallback((newParticles: Particle[]) => {
     latestParticlesRef.current = newParticles;
     if (selectedParticle) {
        const p = newParticles.find(p => p.id === selectedParticle.id);
        if (p) setSelectedParticle(p);
     }
  }, [selectedParticle]);

  const attemptNextStep = () => {
      const nextIndex = stepIndex + 1;
      if (nextIndex < LESSON_STEPS.length) {
          setStepIndex(nextIndex);
      } else {
          setIsFinished(true);
      }
  };

  const handlePrevStep = () => {
      if (stepIndex > 0) {
          setStepIndex(prev => prev - 1);
      }
  };

  if (!hasStarted) {
    return (
        <TitleScreen 
            initStatus={initStatus} 
            loadingProgress={loadingProgress} 
            onInitialize={handleTitleAction} 
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
        />
    );
  }

  if (isFinished) {
      return (
          <div className="w-full h-screen bg-black flex items-center justify-center animate-fade-in relative overflow-hidden">
             <MatrixBackground />
             <div className="relative z-10 text-center">
                 <h1 className="text-6xl text-white font-bold mb-4 cyber-font tracking-widest glitch-text">LESSON COMPLETE</h1>
                 <p className="text-xl text-cyan-400 font-mono mb-8">System Standby. Thank you for participating.</p>
                 <div className="w-24 h-1 bg-cyan-500 mx-auto shadow-[0_0_20px_#06b6d4]"></div>
             </div>
          </div>
      );
  }

  const activeSubsection = currentStep.subsections ? currentStep.subsections[activeSubsectionIndex] : null;

  return (
    <div className="flex flex-col w-full h-screen bg-black overflow-hidden relative">
      <AudioNarrator 
          text={currentStep.narration || ""} 
          onAutoNext={attemptNextStep} 
          audioCache={audioCacheRef.current} 
          audioContext={audioContextRef.current} 
          cacheVersion={cacheVersion} 
          onProgressUpdate={setCurrentPlaybackProgress} 
          soundEnabled={soundEnabled}
          playbackSpeed={playbackSpeed}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 w-full relative overflow-hidden">
          <div className="w-[40%] h-full flex flex-col border-r border-slate-800 bg-[#080808] z-20 shadow-[10px_0_50px_rgba(0,0,0,0.5)] relative">
             <div className="p-8 pb-4 shrink-0">
                 <div className="flex items-center gap-2 mb-2 opacity-50">
                     <Activity size={16} className="text-cyan-500 animate-pulse" />
                     <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-cyan-500">Presentation Mode // {soundEnabled ? "Auto-Seq" : "Manual"}</span>
                 </div>
                 <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 cyber-font mb-2 leading-tight">
                     {currentStep.title}
                 </h1>
                 <div className="h-1 w-20 bg-cyan-500 mt-4 mb-6 shadow-[0_0_10px_#06b6d4]"></div>
             </div>
             
             <div 
                className="flex-1 overflow-y-auto relative px-8 pb-8 scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
             >
                 <style>{`
                    ::-webkit-scrollbar { display: none; }
                 `}</style>
                 <div className="h-full flex flex-col transition-all duration-500">
                    {activeSubsection ? (
                        <div className="flex-1 flex flex-col animate-fade-in" key={activeSubsection.title}>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex justify-between">
                                <span>{activeSubsection.title}</span>
                                <span className="text-cyan-900">{Math.floor(currentPlaybackProgress)}%</span>
                            </div>
                            <div className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light font-serif">
                                {activeSubsection.content}
                            </div>
                            {currentStep.symbols && currentStep.symbols.length > 0 && <SymbolTable symbols={currentStep.symbols} />}
                        </div>
                    ) : (
                        <div className="text-xl text-slate-300 leading-relaxed font-light font-serif animate-fade-in">
                            {currentStep.content}
                            <SymbolTable symbols={currentStep.symbols} />
                        </div>
                    )}
                 </div>
             </div>
          </div>

          <div className="w-[60%] h-full relative bg-black">
            <MatrixBackground />
            
            <div className="absolute inset-0">
                <SimulationCanvas 
                    particles={particles}
                    config={currentConfig} 
                    onUpdate={handleUpdate}
                    onSelectParticle={setSelectedParticle}
                    isRunning={isRunning}
                    interactionMode="perturb" 
                    cameraMode={cameraMode}
                    manualZoom={manualZoom}
                    manualPan={manualPan}
                    onPan={setManualPan} 
                    playbackProgress={currentPlaybackProgress}
                    script={currentStep.script}
                    onScriptTrigger={handleScriptTrigger}
                />
            </div>

            <div className="absolute top-6 right-6 flex flex-col items-end gap-1 pointer-events-none">
                <div className="text-6xl font-bold text-slate-800/50 cyber-font">{stepIndex + 1}</div>
                <div className="text-xs font-mono text-cyan-900/80 tracking-widest uppercase">Lesson Sequence</div>
            </div>

            {!soundEnabled && (
                <div className="absolute bottom-8 right-8 flex items-center gap-4 z-50">
                    <button 
                        onClick={() => setPlaybackSpeed(s => s === 1 ? 4 : 1)}
                        className={`p-3 rounded-full border border-slate-700 bg-slate-900/80 hover:bg-cyan-900/30 hover:border-cyan-500 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm ${playbackSpeed > 1 ? 'text-yellow-400 border-yellow-500' : 'text-cyan-400'}`}
                        title="Toggle Speed 1x/4x"
                    >
                        <FastForward size={24} className={playbackSpeed > 1 ? "animate-pulse" : ""} />
                    </button>
                    <button 
                        onClick={handlePrevStep} 
                        disabled={stepIndex === 0}
                        className="p-3 rounded-full border border-slate-700 bg-slate-900/80 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="px-4 py-2 bg-black/60 border border-slate-800 rounded font-mono text-xs text-slate-400 uppercase tracking-widest">
                        Manual {playbackSpeed > 1 ? `(${playbackSpeed}x)` : ''}
                    </div>
                    <button 
                        onClick={attemptNextStep} 
                        disabled={isFinished}
                        className="p-3 rounded-full border border-slate-700 bg-slate-900/80 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}
          </div>
      </div>

      {/* Progress Bar Spanning Full Width at Bottom */}
      <div className="h-2 bg-slate-900 w-full relative shrink-0 z-50">
         <div 
             className="h-full bg-cyan-500 shadow-[0_0_15px_#06b6d4] transition-all duration-200 ease-linear"
             style={{ width: `${currentPlaybackProgress}%` }}
         ></div>
      </div>
    </div>
  );
}