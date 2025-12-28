import React, { useState, useEffect, useRef } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { SymbolTable } from './components/SymbolTable';
import { AudioNarrator } from './components/AudioNarrator'; 
import { MatrixBackground } from './components/MatrixBackground'; 
import { TitleScreen } from './components/TitleScreen';
import { Particle, Interaction, Vector2, LessonStep, ScriptedEvent } from './types';
import { createParticles } from './lessons/setups';
import { LESSON_STEPS } from './lessons/content';
import { Activity } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [initStatus, setInitStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);   
  const [currentPlaybackProgress, setCurrentPlaybackProgress] = useState(0); 
  const [cacheVersion, setCacheVersion] = useState(0); 
  
  const [stepIndex, setStepIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>(createParticles('grid'));
  const [isRunning, setIsRunning] = useState(true);
  const [frame, setFrame] = useState(0);
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Vector2>({ x: 0, y: 0 });
  
  const [activeSubsectionIndex, setActiveSubsectionIndex] = useState(0); 

  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  const ttsQueue = useRef<Array<() => Promise<void>>>([]);
  const isProcessingQueue = useRef(false);
  const isQuotaExceeded = useRef(false); // Circuit breaker for API limits

  const latestParticlesRef = useRef<Particle[]>(particles);
  const isUpdatingRef = useRef(false);
  
  const currentStep = LESSON_STEPS[stepIndex] || LESSON_STEPS[0];
  const [currentConfig, setCurrentConfig] = useState(currentStep.config);

  useEffect(() => {
    setCurrentConfig(currentStep.config);
    setActiveSubsectionIndex(0); 
    setCurrentPlaybackProgress(0); // Reset progress on new step
  }, [stepIndex]);

  // Determine active subsection based on progress
  useEffect(() => {
      if (currentStep.subsections) {
          // Find the last subsection that has 'at' <= currentPlaybackProgress
          let idx = 0;
          for (let i = 0; i < currentStep.subsections.length; i++) {
              if (currentPlaybackProgress >= currentStep.subsections[i].at) {
                  idx = i;
              }
          }
          setActiveSubsectionIndex(idx);
      }
  }, [currentPlaybackProgress, currentStep.subsections]);

  const handleScriptTrigger = (evt: ScriptedEvent) => {
      if (evt.type === 'zoom' && evt.targetZoom !== undefined) setZoom(evt.targetZoom);
      if (evt.type === 'pan' && evt.targetPan !== undefined) setPan(evt.targetPan);
      if (evt.type === 'reset') { setZoom(1); setPan({x:0, y:0}); }
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

  const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
      if (!process.env.API_KEY) return null;
      if (isQuotaExceeded.current) return null; // Circuit breaker active

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
          // Check for 429 Resource Exhausted
          if (e.toString().includes('429') || e.toString().includes('quota') || e.toString().includes('RESOURCE_EXHAUSTED')) {
              console.warn("API Quota Exceeded. Disabling further TTS requests for this session.");
              isQuotaExceeded.current = true;
          }
      }
      return null;
  };

  // Helper to get audio without queueing (for immediate initialization)
  const loadAudioImmediate = async (step: LessonStep, stepIdx: number): Promise<boolean> => {
      if (!step.narration) return true;
      const narrationKey = step.narration;
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCacheRef.current.has(narrationKey)) return true;

      // Try local file first
      try {
          const paddedIndex = (stepIdx + 1).toString().padStart(2, '0');
          const filePath = `audio/step_${paddedIndex}.mp3`; 
          const response = await fetch(filePath);
          if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = await decodeFileAudioData(arrayBuffer, audioContextRef.current);
              audioCacheRef.current.set(narrationKey, buffer);
              return true;
          }
      } catch (e) {}

      // Fallback to API
      if (!isQuotaExceeded.current) {
          const generatedBuffer = await generateSpeech(step.narration);
          if (generatedBuffer) {
              try {
                  const buffer = decodePCM(generatedBuffer, audioContextRef.current);
                  audioCacheRef.current.set(narrationKey, buffer);
                  return true;
              } catch (e) { console.error(e); }
          }
      }
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
      if (!step.narration) return;
      if (isQuotaExceeded.current) return; // Don't queue if quota exceeded

      const narrationKey = step.narration;
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCacheRef.current.has(narrationKey) || fetchingRef.current.has(narrationKey)) return; 
      fetchingRef.current.add(narrationKey);

      enqueueTask(async () => {
         await loadAudioImmediate(step, stepIdx);
         setCacheVersion(v => v + 1);
         fetchingRef.current.delete(narrationKey);
      });
  };

  const handleTitleAction = async () => {
      if (initStatus === 'idle') {
          setInitStatus('loading');
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          
          // Start fake progress simulation (Target 95% over 60 seconds)
          const startTime = Date.now();
          const progressInterval = setInterval(() => {
              setLoadingProgress(prev => {
                  if (prev >= 95) return prev;
                  // Faster progress for UX
                  return prev + 0.5; 
              });
          }, 50);
          
          try {
              // Actual loading logic
              // Force load Step 1 immediately
              await loadAudioImmediate(LESSON_STEPS[0], 0);
              setCacheVersion(v => v + 1);

              // Start loading Step 2 in background if possible
              if (!isQuotaExceeded.current) {
                  loadAudioImmediate(LESSON_STEPS[1], 1).then(() => setCacheVersion(v => v + 1));
              }
          } catch (e) {
              console.error("Audio Load Error:", e);
          } finally {
              // Done
              clearInterval(progressInterval);
              setLoadingProgress(100);
              setInitStatus('ready');
              // Wait for user to click "Enter Matrix"
          }
      } else if (initStatus === 'ready') {
          // Play immediately
          if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
          }
          setHasStarted(true);
          // Only fetch next few steps, not all
          // Removed processBackgroundAudio loop to save quota
      }
  };

  useEffect(() => {
      if (!hasStarted) return;
      
      // Load Current Step
      const current = LESSON_STEPS[stepIndex];
      fetchAudioForStep(current, stepIndex);
      
      // Preload NEXT Step only (Just-In-Time loading to save quota)
      const nextStep = LESSON_STEPS[stepIndex + 1];
      if (nextStep) {
          fetchAudioForStep(nextStep, stepIndex + 1);
      }
  }, [stepIndex, hasStarted]);

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

  const attemptNextStep = () => {
      const nextIndex = stepIndex + 1;
      if (nextIndex < LESSON_STEPS.length) {
          setStepIndex(nextIndex);
      }
  };

  if (!hasStarted) {
    return (
        <TitleScreen 
            initStatus={initStatus} 
            loadingProgress={loadingProgress} 
            onInitialize={handleTitleAction} 
        />
    );
  }

  const activeSubsection = currentStep.subsections ? currentStep.subsections[activeSubsectionIndex] : null;

  return (
    <div className="flex w-full h-screen bg-black overflow-hidden relative">
      <AudioNarrator 
          text={currentStep.narration || ""} 
          onAutoNext={attemptNextStep} 
          audioCache={audioCacheRef.current} 
          audioContext={audioContextRef.current} 
          cacheVersion={cacheVersion} 
          onProgressUpdate={setCurrentPlaybackProgress} 
      />

      <div className="w-[40%] h-full flex flex-col border-r border-slate-800 bg-[#080808] z-20 shadow-[10px_0_50px_rgba(0,0,0,0.5)] relative">
         <div className="p-8 pb-4">
             <div className="flex items-center gap-2 mb-2 opacity-50">
                 <Activity size={16} className="text-cyan-500 animate-pulse" />
                 <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-cyan-500">Presentation Mode // Auto-Seq</span>
             </div>
             <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 cyber-font mb-2 leading-tight">
                 {currentStep.title}
             </h1>
             <div className="h-1 w-20 bg-cyan-500 mt-4 mb-6 shadow-[0_0_10px_#06b6d4]"></div>
         </div>
         
         <div className="flex-1 overflow-hidden relative px-8 pb-8">
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

         <div className="h-2 bg-slate-900 w-full relative">
             <div 
                 className="h-full bg-cyan-500 shadow-[0_0_15px_#06b6d4] transition-all duration-200 ease-linear"
                 style={{ width: `${currentPlaybackProgress}%` }}
             ></div>
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
                zoom={zoom}
                pan={pan}
                onPan={setPan}
                playbackProgress={currentPlaybackProgress}
                script={currentStep.script}
                onScriptTrigger={handleScriptTrigger}
            />
        </div>

        <div className="absolute top-6 right-6 flex flex-col items-end gap-1 pointer-events-none">
            <div className="text-6xl font-bold text-slate-800/50 cyber-font">{stepIndex + 1}</div>
            <div className="text-xs font-mono text-cyan-900/80 tracking-widest uppercase">Lesson Sequence</div>
        </div>
      </div>
    </div>
  );
}