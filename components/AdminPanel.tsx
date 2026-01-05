import React, { useState, useRef } from 'react';
import { LessonStep, VideoClip } from '../types';
import { Download, FileCode, FileText, X, Loader, Music, Terminal, Play, FileType, Presentation, Video, RefreshCw } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import PptxGenJS from 'pptxgenjs';
import { GoogleGenAI } from "@google/genai";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonSteps: LessonStep[];
  fetchAudioForStep: (step: LessonStep) => Promise<ArrayBuffer | undefined>;
}

// --- VIDEO DB UTILS ---
const VIDEO_DB_NAME = 'QuantumPCN_VideoDB';
const VIDEO_STORE = 'videos';

const openVideoDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(VIDEO_DB_NAME, 1);
        req.onupgradeneeded = (evt) => {
            const db = (evt.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(VIDEO_STORE)) {
                db.createObjectStore(VIDEO_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, lessonSteps, fetchAudioForStep }) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const [status, setStatus] = useState('');
  
  // Audio State
  const [downloadingStepId, setDownloadingStepId] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [generatedAudioBlobs, setGeneratedAudioBlobs] = useState<Map<number, Blob>>(new Map());
  
  // Video State
  const [videoGenStatus, setVideoGenStatus] = useState<Map<string, 'idle' | 'generating' | 'done' | 'error'>>(new Map());
  
  const abortBatchRef = useRef(false);

  if (!isOpen) return null;

  // --- AUDIO LOGIC (Preserved) ---
  const bufferToWav = (ab: AudioBuffer) => {
    const numOfChan = ab.numberOfChannels;
    const length = ab.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample, offset = 0, pos = 0;
  
    // write RIFF chunk descriptor
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
  
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + ab.length * numOfChan * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, ab.sampleRate, true);
    view.setUint32(28, ab.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, ab.length * numOfChan * 2, true);
  
    for (i = 0; i < ab.numberOfChannels; i++) channels.push(ab.getChannelData(i));
  
    offset = 44;
    while (pos < ab.length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos])); 
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
        view.setInt16(offset, sample, true);
        offset += 2;
      }
      pos++;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const getCleanTitle = (step: LessonStep, idx: number) => {
      return `step_${(idx + 1).toString().padStart(2, '0')}_${step.title.split(':')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
  };

  const processAudioForStep = async (step: LessonStep): Promise<Blob | null> => {
       if (!step.narration) return null;
       const rawBuffer = await fetchAudioForStep(step);
       if (!rawBuffer) return null;
       const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
       const bufferCopy = rawBuffer.slice(0);
       const dataInt16 = new Int16Array(bufferCopy);
       const frameCount = dataInt16.length; 
       const audioBuffer = tempCtx.createBuffer(1, frameCount, 24000);
       const channelData = audioBuffer.getChannelData(0);
       for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;
       return bufferToWav(audioBuffer);
  };

  const handleDownloadWav = async (stepIndex: number) => {
      const step = lessonSteps[stepIndex];
      if (!step.narration) return;
      if (generatedAudioBlobs.has(stepIndex)) {
          downloadBlob(generatedAudioBlobs.get(stepIndex)!, `${getCleanTitle(step, stepIndex)}.wav`);
          return;
      }
      setDownloadingStepId(stepIndex);
      setStatus(`Generating Step ${stepIndex + 1}...`);
      try {
          const wavBlob = await processAudioForStep(step);
          if (wavBlob) {
             setGeneratedAudioBlobs(prev => new Map(prev).set(stepIndex, wavBlob));
             downloadBlob(wavBlob, `${getCleanTitle(step, stepIndex)}.wav`);
             setStatus(`Downloaded Step ${stepIndex + 1}`);
          } else {
             setStatus(`Failed Step ${stepIndex + 1}`);
          }
      } catch (e) { console.error(e); setStatus('Error generating audio'); } finally { setDownloadingStepId(null); }
  };

  const handleBatchGenerate = async () => {
      if (batchProgress) { abortBatchRef.current = true; return; }
      abortBatchRef.current = false;
      let count = 0;
      const total = lessonSteps.filter(s => s.narration).length;
      setBatchProgress({ current: 0, total });
      setStatus('Starting batch generation...');
      for (let i = 0; i < lessonSteps.length; i++) {
          if (abortBatchRef.current) break;
          const step = lessonSteps[i];
          if (!step.narration) continue;
          if (generatedAudioBlobs.has(i)) { count++; setBatchProgress({ current: count, total }); continue; }
          try {
              setStatus(`Generating ${i + 1}/${lessonSteps.length}...`);
              const wavBlob = await processAudioForStep(step);
              if (wavBlob) setGeneratedAudioBlobs(prev => new Map(prev).set(i, wavBlob));
              await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (e) { console.error(`Batch error on step ${i}`, e); }
          count++;
          setBatchProgress({ current: count, total });
      }
      setStatus(abortBatchRef.current ? 'Batch cancelled.' : 'Batch complete.');
      setBatchProgress(null);
      abortBatchRef.current = false;
  };

  // --- VIDEO LOGIC (Veo) ---
  const generateVideoForClip = async (clip: VideoClip) => {
     if (!process.env.API_KEY) { setStatus("Missing API Key"); return; }
     const db = await openVideoDB();
     
     // Check if cached first
     const cached: Blob | undefined = await new Promise((resolve) => {
         const tx = db.transaction(VIDEO_STORE, 'readonly');
         const req = tx.objectStore(VIDEO_STORE).get(clip.id);
         req.onsuccess = () => resolve(req.result);
     });

     if (cached) {
         setVideoGenStatus(prev => new Map(prev).set(clip.id, 'done'));
         setStatus(`Loaded cached video for ${clip.id}`);
         return;
     }

     setVideoGenStatus(prev => new Map(prev).set(clip.id, 'generating'));
     setStatus(`Generating Video: ${clip.prompt.substring(0, 20)}...`);

     try {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         let operation = await ai.models.generateVideos({
             model: 'veo-3.1-fast-generate-preview',
             prompt: clip.prompt,
             config: {
                 numberOfVideos: 1,
                 resolution: '720p',
                 aspectRatio: '16:9'
             }
         });

         // Poll
         while(!operation.done) {
             await new Promise(resolve => setTimeout(resolve, 5000));
             operation = await ai.operations.getVideosOperation({operation: operation});
             setStatus(`Polling Veo status for ${clip.id}...`);
         }

         const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
         if (downloadLink) {
             const resp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
             const blob = await resp.blob();
             
             // Save to DB
             const tx = db.transaction(VIDEO_STORE, 'readwrite');
             tx.objectStore(VIDEO_STORE).put(blob, clip.id);
             
             setVideoGenStatus(prev => new Map(prev).set(clip.id, 'done'));
             setStatus(`Generated & Cached: ${clip.id}`);
         } else {
             throw new Error("No video URI returned");
         }

     } catch (e) {
         console.error(e);
         setVideoGenStatus(prev => new Map(prev).set(clip.id, 'error'));
         setStatus(`Error generating ${clip.id}`);
     }
  };

  const handleGenerateAllVideos = async () => {
      setStatus("Starting Batch Video Generation. This may take a while.");
      for (const step of lessonSteps) {
          if (step.videoScript) {
              for (const clip of step.videoScript) {
                  await generateVideoForClip(clip);
                  // Safety buffer between generations
                  await new Promise(resolve => setTimeout(resolve, 2000));
              }
          }
      }
      setStatus("All Video Tasks Completed.");
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#0a0a0a] border border-cyan-500 rounded-lg w-full max-w-5xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
           <div className="flex items-center gap-3 text-cyan-400">
               <Terminal size={24} />
               <h2 className="text-xl font-bold cyber-font tracking-widest">SYS_ADMIN_CONSOLE</h2>
           </div>
           <div className="flex gap-4">
               <button onClick={() => setActiveTab('audio')} className={`px-4 py-1 rounded ${activeTab === 'audio' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}>Audio</button>
               <button onClick={() => setActiveTab('video')} className={`px-4 py-1 rounded ${activeTab === 'video' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}>Video Assets</button>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-white">
               <X size={24} />
           </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Col: Actions */}
            <div className="w-full md:w-64 p-6 border-r border-slate-800 bg-black/20 flex flex-col gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status Log</div>
                <div className="bg-black/50 p-2 font-mono text-[10px] text-green-400 h-32 overflow-y-auto border border-slate-800 rounded">
                    {status}
                </div>
                
                {activeTab === 'audio' ? (
                    <>
                        <button 
                            onClick={handleBatchGenerate}
                            className={`w-full py-3 border rounded flex items-center justify-center gap-2 font-mono text-sm transition-all ${batchProgress ? 'bg-red-900/20 text-red-400 border-red-700/50' : 'bg-yellow-900/20 text-yellow-500 border-yellow-700/50'}`}
                        >
                            {batchProgress ? 'STOP BATCH' : 'GENERATE ALL AUDIO'}
                        </button>
                        {batchProgress && (
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-yellow-500 transition-all duration-300" style={{width: `${(batchProgress.current / batchProgress.total) * 100}%`}} />
                            </div>
                        )}
                    </>
                ) : (
                    <button 
                        onClick={handleGenerateAllVideos}
                        className="w-full py-3 border rounded flex items-center justify-center gap-2 font-mono text-sm transition-all bg-purple-900/20 text-purple-400 border-purple-700/50 hover:bg-purple-900/40"
                    >
                        <Video size={16} /> GENERATE ALL CLIPS
                    </button>
                )}

                <div className="mt-auto text-[10px] text-slate-600 font-mono">System Version: 2.1.3</div>
            </div>

            {/* Right Col: List */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/10">
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-cyber">
                    {activeTab === 'audio' && lessonSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded group">
                            <div className="text-slate-200 text-sm font-bold truncate w-2/3">{step.title}</div>
                            <button 
                                onClick={() => handleDownloadWav(idx)}
                                disabled={!step.narration || downloadingStepId === idx}
                                className="px-3 py-2 rounded text-xs font-bold font-mono border bg-slate-800 border-slate-700 text-slate-400 hover:text-cyan-400"
                            >
                                {downloadingStepId === idx ? <Loader size={14} className="animate-spin" /> : <Download size={14} />} WAV
                            </button>
                        </div>
                    ))}
                    
                    {activeTab === 'video' && lessonSteps.map((step, idx) => (
                        step.videoScript && step.videoScript.length > 0 && (
                            <div key={idx} className="bg-slate-900/30 border border-slate-800 rounded p-4 mb-2">
                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">{step.title}</div>
                                <div className="space-y-2">
                                    {step.videoScript.map((clip, cIdx) => (
                                        <div key={cIdx} className="flex items-center justify-between bg-black/40 p-2 rounded border border-slate-800">
                                            <div className="text-xs font-mono text-slate-400 truncate w-2/3">{clip.prompt}</div>
                                            <button
                                                onClick={() => generateVideoForClip(clip)}
                                                disabled={videoGenStatus.get(clip.id) === 'generating'}
                                                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
                                                    videoGenStatus.get(clip.id) === 'done' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 
                                                    videoGenStatus.get(clip.id) === 'generating' ? 'bg-yellow-900/30 text-yellow-400 animate-pulse' : 
                                                    'bg-slate-800 text-slate-400 hover:bg-purple-900/30 hover:text-purple-400'
                                                }`}
                                            >
                                                {videoGenStatus.get(clip.id) === 'generating' ? <Loader size={12} className="animate-spin" /> : 
                                                 videoGenStatus.get(clip.id) === 'done' ? <CheckCircle2 size={12} /> : <RefreshCw size={12} />}
                                                {videoGenStatus.get(clip.id) === 'done' ? 'CACHED' : 'GENERATE'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
import { CheckCircle2 } from 'lucide-react';