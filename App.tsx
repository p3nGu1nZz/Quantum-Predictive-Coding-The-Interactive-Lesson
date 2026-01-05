import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { SymbolTable } from './components/SymbolTable';
import { AudioNarrator } from './components/AudioNarrator'; 
import { ProceduralBackgroundAudio } from './components/ProceduralBackgroundAudio';
import { SoundEffects } from './components/SoundEffects';
import { MatrixBackground } from './components/MatrixBackground'; 
import { TitleScreen } from './components/TitleScreen';
import { TransitionScreen } from './components/TransitionScreen';
import { IntroScene } from './components/IntroScene';
import { CinematicBackground } from './components/CinematicBackground'; // New
import { AdminPanel } from './components/AdminPanel'; // New
import { Particle, Interaction, Vector2, LessonStep, ScriptedEvent, VideoClip, PanelConfig } from './types';
import { createParticles } from './lessons/setups';
import { LESSON_STEPS } from './lessons/content';
import { Activity, ChevronLeft, ChevronRight, FastForward, Volume2, VolumeX, Settings, PanelLeftOpen, PanelLeftClose, Eye, EyeOff } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- IndexedDB Utils ---
const AUDIO_DB = 'QuantumPCN_AudioDB';
const AUDIO_STORE = 'audio_pcm_cache';
const VIDEO_DB = 'QuantumPCN_VideoDB';
const VIDEO_STORE = 'videos';

// Audio DB
const openAudioDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(AUDIO_DB, 2);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if(!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE);
        };
        req.onsuccess = () => resolve(req.result);
    });
};

// Video DB
const openVideoDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(VIDEO_DB, 1);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if(!db.objectStoreNames.contains(VIDEO_STORE)) db.createObjectStore(VIDEO_STORE);
        };
        req.onsuccess = () => resolve(req.result);
    });
};

const getAudioFromDB = async (key: string): Promise<{text:string, buffer:ArrayBuffer} | undefined> => {
    try {
        const db = await openAudioDB();
        return new Promise(resolve => {
            const req = db.transaction(AUDIO_STORE, 'readonly').objectStore(AUDIO_STORE).get(key);
            req.onsuccess = () => resolve(req.result);
        });
    } catch { return undefined; }
};

const getVideoFromDB = async (key: string): Promise<Blob | undefined> => {
    try {
        const db = await openVideoDB();
        return new Promise(resolve => {
            const req = db.transaction(VIDEO_STORE, 'readonly').objectStore(VIDEO_STORE).get(key);
            req.onsuccess = () => resolve(req.result);
        });
    } catch { return undefined; }
};

const saveAudioToDB = async (key: string, text: string, data: ArrayBuffer) => {
    const db = await openAudioDB();
    db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE).put({text, buffer:data}, key);
};

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [initStatus, setInitStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0); 
  const [loadingStatus, setLoadingStatus] = useState("Initializing..."); // New status text state
  const [currentPlaybackProgress, setCurrentPlaybackProgress] = useState(0); 
  const [cacheVersion, setCacheVersion] = useState(0); 
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [narratorActive, setNarratorActive] = useState(false); 
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<{number: number, title: string} | null>(null);
  const [lastSfxTrigger, setLastSfxTrigger] = useState<ScriptedEvent | null>(null);

  // New UI State
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [panelConfig, setPanelConfig] = useState<PanelConfig>({ x: 5, y: 5, w: '30vw', opacity: 1, scale: 1 });
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentVideoBlob, setCurrentVideoBlob] = useState<Blob | null>(null);

  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  const isQuotaExceeded = useRef(false); 
  const latestParticlesRef = useRef<Particle[]>(particles);
  const currentStep = LESSON_STEPS[stepIndex] || LESSON_STEPS[0];
  const [currentConfig, setCurrentConfig] = useState(currentStep.config);
  
  const isIntro = stepIndex === 0;

  // --- INITIALIZATION & STEP CHANGE ---
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
    setCurrentVideoBlob(null); // Reset video
    
    // Reset Panel Default Position on Step Change
    setPanelConfig({ x: 5, y: 5, w: '30vw', opacity: 1, scale: 1 });
  }, [stepIndex, currentStep]);

  // --- VIDEO TIMELINE LOGIC ---
  useEffect(() => {
      if (!currentStep.videoScript) {
          if(currentVideoBlob !== null) setCurrentVideoBlob(null);
          return;
      }

      const activeClip = [...currentStep.videoScript]
          .sort((a,b) => b.at - a.at)
          .find(clip => currentPlaybackProgress >= clip.at);

      if (activeClip) {
          getVideoFromDB(activeClip.id).then(blob => {
              if (blob) setCurrentVideoBlob(blob);
              else setCurrentVideoBlob(null);
          });
      }
  }, [currentPlaybackProgress, currentStep.videoScript]);

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
          setManualZoom(evt.targetZoom); setCameraMode('manual');
      }
      if (evt.type === 'pan' && evt.targetPan !== undefined) {
          setManualPan(evt.targetPan); setCameraMode('manual');
      }
      if (evt.type === 'reset') { 
          setCameraMode('auto'); setManualZoom(1); setManualPan({ x: 0, y: 0 });
      }
      if (['pulse', 'shake', 'spawn', 'highlight', 'force'].includes(evt.type)) {
          setLastSfxTrigger(evt);
      }
      // Procedural Panel Control
      if (evt.panel) {
          setPanelConfig(prev => ({ ...prev, ...evt.panel }));
      }
  }, []);

  function decodePCM(buffer: ArrayBuffer, ctx: AudioContext): AudioBuffer {
    const dataInt16 = new Int16Array(buffer);
    const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0; 
    return audioBuffer;
  }

  const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
      if (!process.env.API_KEY || isQuotaExceeded.current) return null;
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-preview-tts',
              contents: [{ parts: [{ text }] }],
              config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
          });
          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
              const bin = atob(base64Audio);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              return bytes.buffer;
          }
      } catch (e: any) { 
          if (e.toString().includes('429')) isQuotaExceeded.current = true;
      }
      return null;
  };

  const loadAudioImmediate = async (step: LessonStep, stepIdx: number): Promise<boolean> => {
      if (!soundEnabled || !step.narration) return true;
      const text = step.narration;
      const cacheKey = `step_${stepIdx}`; 
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCacheRef.current.has(text)) return true;

      const cached = await getAudioFromDB(cacheKey);
      if (cached && cached.text === text) {
          // Found in cache
          audioCacheRef.current.set(text, decodePCM(cached.buffer, audioContextRef.current));
          return true;
      }
      
      // Not in cache, need to generate
      setLoadingStatus(`Generating Audio: ${step.title.slice(0, 15)}...`);
      const generated = await generateSpeech(text);
      if (generated) {
          audioCacheRef.current.set(text, decodePCM(generated, audioContextRef.current));
          saveAudioToDB(cacheKey, text, generated);
          return true;
      }
      return false;
  };

  const fetchAudioBuffer = async (step: LessonStep): Promise<ArrayBuffer | undefined> => {
       if(!step.narration) return undefined;
       const key = `step_${LESSON_STEPS.indexOf(step)}`;
       const cached = await getAudioFromDB(key);
       if(cached) return cached.buffer;
       const gen = await generateSpeech(step.narration);
       if(gen) return gen;
       return undefined;
  };

  const handleTitleAction = async () => {
      if (initStatus === 'idle') {
          setInitStatus('loading');
          setLoadingStatus("Connecting to Audio Subsystem...");
          
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

          const progressInterval = setInterval(() => { setLoadingProgress(prev => prev >= 95 ? prev : prev + 0.5); }, 50);
          try {
              if (soundEnabled) {
                  // Load Intro
                  setLoadingStatus("Checking Audio Cache: Lesson 0...");
                  const introLoaded = await loadAudioImmediate(LESSON_STEPS[0], 0);
                  if (introLoaded) setLoadingStatus("Loaded Lesson 0");

                  // Load Step 1
                  setLoadingStatus("Checking Audio Cache: Lesson 1...");
                  const step1Loaded = await loadAudioImmediate(LESSON_STEPS[1], 1);
                  if (step1Loaded) setLoadingStatus("Loaded Lesson 1");

                  // Check if Video exists for Step 1
                  if (LESSON_STEPS[1].videoScript?.length) {
                      const clip = LESSON_STEPS[1].videoScript[0];
                      setLoadingStatus(`Checking Video: ${clip.id}...`);
                      const vid = await getVideoFromDB(clip.id);
                      if (vid) setLoadingStatus(`Cached Video Found: ${clip.id}`);
                      else setLoadingStatus(`Missing Video: ${clip.id}`);
                      await new Promise(r => setTimeout(r, 600)); // Delay to read message
                  }
              }
          } catch (e) { 
              console.error("Audio Load Error:", e);
              setLoadingStatus("Error Loading Assets");
          } finally {
              clearInterval(progressInterval);
              setLoadingProgress(100);
              setLoadingStatus("Systems Ready");
              setTimeout(() => setInitStatus('ready'), 500);
          }
      } else if (initStatus === 'ready') {
          if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
          setIsTransitioning(true);
          setTransitionTarget({ number: 0, title: LESSON_STEPS[0].title });
          setHasStarted(true);
          setTimeout(() => { setIsTransitioning(false); }, 4500);
      }
  };

  useEffect(() => {
      if (!hasStarted) return;
      const current = LESSON_STEPS[stepIndex];
      if (soundEnabled) {
          loadAudioImmediate(current, stepIndex).then(() => setCacheVersion(v => v + 1));
          const nextStep = LESSON_STEPS[stepIndex + 1];
          if (nextStep) loadAudioImmediate(nextStep, stepIndex + 1);
      }
  }, [stepIndex, hasStarted, soundEnabled]);

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
          setIsTransitioning(true);
          setTransitionTarget({ number: nextIndex, title: LESSON_STEPS[nextIndex].title });
          setTimeout(() => {
              setStepIndex(nextIndex);
              setTimeout(() => { setIsTransitioning(false); }, 50); 
          }, 4500);
      } else { setIsFinished(true); }
  };

  const handlePrevStep = () => { if (stepIndex > 0) setStepIndex(prev => prev - 1); };
  const activeSubsection = currentStep.subsections ? currentStep.subsections[activeSubsectionIndex] : null;

  return (
    <div className="flex flex-col w-full h-screen bg-black overflow-hidden relative font-sans select-none">
      
      <ProceduralBackgroundAudio isPlaying={soundEnabled && (initStatus !== 'idle')} volume={narratorActive ? 0.15 : 0.4} mode={hasStarted ? 'lesson' : 'title'} />
      <SoundEffects trigger={lastSfxTrigger} soundEnabled={soundEnabled} />

      {!hasStarted && (
        <TitleScreen 
            initStatus={initStatus} 
            loadingProgress={loadingProgress} 
            loadingStatus={loadingStatus} // Pass new prop
            onInitialize={handleTitleAction} 
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
        />
      )}

      {isFinished && hasStarted && (
          <div className="w-full h-screen bg-black flex items-center justify-center animate-fade-in relative overflow-hidden z-[100]">
             <MatrixBackground />
             <div className="relative z-10 text-center">
                 <h1 className="text-6xl text-white font-bold mb-4 cyber-font tracking-widest glitch-text">LESSON COMPLETE</h1>
                 <p className="text-xl text-cyan-400 font-mono mb-8">System Standby.</p>
             </div>
          </div>
      )}

      {hasStarted && !isFinished && (
        <>
            <TransitionScreen isVisible={isTransitioning} lessonNumber={transitionTarget?.number || 0} title={transitionTarget?.title || ""} />
            <AudioNarrator 
                text={currentStep.narration || ""} 
                onAutoNext={attemptNextStep} 
                audioCache={audioCacheRef.current} 
                audioContext={audioContextRef.current} 
                cacheVersion={cacheVersion} 
                onProgressUpdate={setCurrentPlaybackProgress} 
                soundEnabled={soundEnabled}
                playbackSpeed={playbackSpeed}
                disabled={isTransitioning} 
                onPlayStateChange={setNarratorActive}
            />

            {/* --- ADMIN PANEL --- */}
            <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} lessonSteps={LESSON_STEPS} fetchAudioForStep={fetchAudioBuffer} />

            {/* --- MAIN LAYOUT --- */}
            <div className="flex-1 w-full h-full relative overflow-hidden">
                
                {/* 1. CINEMATIC BACKGROUND LAYER (Video) */}
                <CinematicBackground videoBlob={currentVideoBlob} isActive={!isIntro} />

                {/* 2. PARTICLE SIMULATION LAYER (Overlay) */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="w-full h-full pointer-events-auto">
                        <SimulationCanvas 
                            particles={particles}
                            config={currentConfig} 
                            onUpdate={handleUpdate}
                            onSelectParticle={setSelectedParticle}
                            isRunning={isRunning && !isTransitioning} 
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
                </div>
                
                {/* 3. FLOATING INFO PANEL (Procedural TV Style) */}
                {!isIntro && showInfoPanel && (
                    <div 
                        className="absolute z-30 transition-all duration-1000 ease-in-out backdrop-blur-md bg-black/70 border border-cyan-900/50 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col"
                        style={{
                            left: `${panelConfig.x}%`,
                            top: `${panelConfig.y}%`,
                            width: panelConfig.w || '30vw',
                            height: panelConfig.h || 'auto',
                            maxHeight: '80vh',
                            opacity: panelConfig.opacity ?? 1,
                            transform: `scale(${panelConfig.scale ?? 1})`,
                            transformOrigin: 'top left'
                        }}
                    >
                         <div className="p-6 pb-4 shrink-0 bg-gradient-to-b from-cyan-950/40 to-transparent border-b border-cyan-900/30">
                            <div className="flex items-center gap-2 mb-2 opacity-80 justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-cyan-400 animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-cyan-400">DATA FEED</span>
                                </div>
                                <button 
                                    onClick={() => setSoundEnabled(!soundEnabled)} 
                                    className={`transition-colors ${soundEnabled ? 'text-cyan-400 hover:text-cyan-200' : 'text-slate-500'}`}
                                >
                                    {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                </button>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white cyber-font leading-none drop-shadow-md">
                                {currentStep.title}
                            </h1>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-none">
                             {activeSubsection ? (
                                <div className="flex-1 flex flex-col animate-fade-in" key={activeSubsection.title}>
                                    <div className="flex justify-between items-end mb-4 border-b border-cyan-900/30 pb-2">
                                        <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">{activeSubsection.title}</span>
                                        <span className="text-[10px] font-mono text-slate-500">{Math.floor(currentPlaybackProgress)}%</span>
                                    </div>
                                    <div className="text-lg text-slate-200 leading-relaxed font-light font-serif drop-shadow-sm">
                                        {activeSubsection.content}
                                    </div>
                                    {currentStep.symbols && currentStep.symbols.length > 0 && <SymbolTable symbols={currentStep.symbols} />}
                                </div>
                            ) : (
                                <div className="text-lg text-slate-200 leading-relaxed font-light font-serif animate-fade-in">
                                    {currentStep.content}
                                    <SymbolTable symbols={currentStep.symbols} />
                                </div>
                            )}
                        </div>
                        
                        {/* Decorative footer line */}
                        <div className="h-1 w-full bg-slate-900 mt-auto">
                            <div className="h-full bg-cyan-500/50" style={{ width: `${currentPlaybackProgress}%`, transition: 'width 0.2s linear' }}></div>
                        </div>
                    </div>
                )}

                {/* INTRO OVERLAY */}
                {isIntro && <IntroScene progress={currentPlaybackProgress} subsections={currentStep.subsections} />}

                {/* HUD CONTROLS */}
                <div className="absolute top-6 left-6 z-50 flex gap-4 pointer-events-auto">
                    <button 
                        onClick={() => setShowInfoPanel(!showInfoPanel)} 
                        className="p-2 bg-black/50 border border-slate-700 text-cyan-400 hover:text-white rounded hover:bg-cyan-900/40 transition-colors backdrop-blur-sm"
                        title={showInfoPanel ? "Hide Panel" : "Show Panel"}
                    >
                        {showInfoPanel ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button 
                        onClick={() => setShowAdmin(true)} 
                        className="p-2 bg-black/50 border border-slate-700 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors backdrop-blur-sm"
                        title="Admin / Assets"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                <div className="absolute top-6 right-6 flex flex-col items-end gap-1 pointer-events-none z-20">
                    <div className="text-6xl font-bold text-white/10 cyber-font">{stepIndex}</div>
                    <div className="text-xs font-mono text-cyan-400/50 tracking-widest uppercase">Sequence ID</div>
                </div>

                <div className="absolute bottom-8 right-8 flex items-center gap-4 z-50 pointer-events-auto">
                    <button 
                        onClick={() => setPlaybackSpeed(s => s === 1 ? 4 : 1)}
                        className={`p-3 rounded-full border border-slate-700 bg-slate-900/80 backdrop-blur-sm ${playbackSpeed > 1 ? 'text-yellow-400 border-yellow-500' : 'text-cyan-400'}`}
                    >
                        <FastForward size={24} className={playbackSpeed > 1 ? "animate-pulse" : ""} />
                    </button>
                    <button 
                        onClick={handlePrevStep} 
                        disabled={stepIndex === 0}
                        className="p-3 rounded-full border border-slate-700 bg-slate-900/80 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={attemptNextStep} 
                        disabled={isFinished}
                        className="p-3 rounded-full border border-slate-700 bg-slate-900/80 text-cyan-400 hover:bg-cyan-900/30 hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}