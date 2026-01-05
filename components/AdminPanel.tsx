import React, { useState, useRef, useEffect } from 'react';
import { LessonStep, VideoClip } from '../types';
import { Download, Upload, X, Loader, Terminal, Video, RefreshCw, CheckCircle2, Play, Pause, Volume2, VolumeX, Music, Trash2, Save, HardDrive, FileAudio } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonSteps: LessonStep[];
  fetchAudioForStep: (step: LessonStep) => Promise<ArrayBuffer | undefined>;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

// --- DB CONFIGS ---
const VIDEO_DB_NAME = 'QuantumPCN_VideoDB';
const VIDEO_STORE = 'videos';

const AUDIO_DB_NAME = 'QuantumPCN_AudioDB';
const AUDIO_STORE = 'audio_pcm_cache';

const MUSIC_DB_NAME = 'QuantumPCN_MusicDB';
const MUSIC_STORE = 'music_tracks';
const MUSIC_TRACK_KEY = 'cyberpunk_midtempo_v3_cached';

const SYSTEM_DB_NAME = 'QuantumPCN_SystemDB';
const SYSTEM_STORE = 'session_state';

// --- DB HELPERS ---
const openDB = (name: string, store: string, version: number = 1): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name, version);
        req.onupgradeneeded = (evt) => {
            const db = (evt.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, lessonSteps, fetchAudioForStep, soundEnabled, onToggleSound }) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'music'>('audio');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Media State Maps (ID -> ObjectURL)
  const [audioUrls, setAudioUrls] = useState<Map<number, string>>(new Map());
  const [videoUrls, setVideoUrls] = useState<Map<string, string>>(new Map());
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  
  // Processing States
  const [processing, setProcessing] = useState<Map<string, boolean>>(new Map()); // Key: tab_id
  
  // System Stats
  const [storageSize, setStorageSize] = useState<string>("0 MB");
  const [lastSaved, setLastSaved] = useState<string>("Never");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{type: 'audio'|'video'|'music', id: string|number} | null>(null);
  
  const addLog = (msg: string) => {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // --- INITIALIZATION ---
  useEffect(() => {
      if (isOpen) {
          refreshAllMedia();
          updateSystemStats();
      }
      return () => {
          // Cleanup Object URLs
          audioUrls.forEach(url => URL.revokeObjectURL(url));
          videoUrls.forEach(url => URL.revokeObjectURL(url));
          if (musicUrl) URL.revokeObjectURL(musicUrl);
      };
  }, [isOpen]);

  const refreshAllMedia = async () => {
      addLog("Refreshing Media Cache...");
      try {
          await loadAudioCache();
          await loadVideoCache();
          await loadMusicCache();
          addLog("Media Cache Refreshed.");
      } catch (e) {
          addLog(`Error refreshing media: ${e}`);
      }
      updateSystemStats();
  };

  const updateSystemStats = async () => {
      let totalBytes = 0;
      
      const countDB = async (name: string, store: string) => {
          try {
              const db = await openDB(name, store, name === AUDIO_DB_NAME ? 2 : 1);
              return new Promise<void>((resolve) => {
                  const tx = db.transaction(store, 'readonly');
                  const req = tx.objectStore(store).openCursor();
                  req.onsuccess = (e) => {
                      const cursor = (e.target as IDBRequest).result;
                      if (cursor) {
                          const val = cursor.value;
                          if (val instanceof Blob) totalBytes += val.size;
                          else if (val instanceof ArrayBuffer) totalBytes += val.byteLength;
                          else if (val.buffer instanceof ArrayBuffer) totalBytes += val.buffer.byteLength; // Audio store format
                          cursor.continue();
                      } else {
                          resolve();
                      }
                  };
              });
          } catch(e) { console.error(e); }
      };

      await countDB(VIDEO_DB_NAME, VIDEO_STORE);
      await countDB(AUDIO_DB_NAME, AUDIO_STORE);
      await countDB(MUSIC_DB_NAME, MUSIC_STORE);

      setStorageSize((totalBytes / (1024 * 1024)).toFixed(2) + " MB");

      // Load Last Saved
      try {
          const db = await openDB(SYSTEM_DB_NAME, SYSTEM_STORE);
          const tx = db.transaction(SYSTEM_STORE, 'readonly');
          const req = tx.objectStore(SYSTEM_STORE).get('save_meta');
          req.onsuccess = () => {
              if (req.result) setLastSaved(new Date(req.result.timestamp).toLocaleString());
          };
      } catch (e) {}
  };

  const handleSaveSession = async () => {
      try {
          const db = await openDB(SYSTEM_DB_NAME, SYSTEM_STORE);
          const tx = db.transaction(SYSTEM_STORE, 'readwrite');
          const meta = { timestamp: Date.now(), size: storageSize };
          tx.objectStore(SYSTEM_STORE).put(meta, 'save_meta');
          tx.oncomplete = () => {
              addLog("Session State Saved.");
              updateSystemStats();
          };
      } catch (e) { addLog("Save Failed."); }
  };

  // --- AUDIO LOGIC ---
  const loadAudioCache = async () => {
      try {
        const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
        const tx = db.transaction(AUDIO_STORE, 'readonly');
        const store = tx.objectStore(AUDIO_STORE);
        const req = store.openCursor();
        const newMap = new Map<number, string>();
        
        req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor) {
                const key = cursor.key as string; // "step_0_v1"
                if (key.startsWith('step_')) {
                    const idx = parseInt(key.split('_')[1]);
                    const val = cursor.value; // { text, buffer }
                    try {
                        // Convert PCM buffer to WAV for browser playback
                        const wav = pcmBufferToWav(val.buffer);
                        newMap.set(idx, URL.createObjectURL(wav));
                    } catch (err) {
                        console.error("Error decoding audio for key", key, err);
                    }
                }
                cursor.continue();
            } else {
                setAudioUrls(newMap);
                addLog(`Loaded ${newMap.size} audio files.`);
            }
        };
      } catch (e) {
          addLog("Failed to load Audio Cache.");
      }
  };

  const regenerateAudio = async (idx: number) => {
      setProcessing(prev => new Map(prev).set(`audio_${idx}`, true));
      addLog(`Regenerating Audio for Step ${idx}...`);
      
      try {
          // Delete existing
          const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
          const tx = db.transaction(AUDIO_STORE, 'readwrite');
          const key = `step_${idx}_v1`;
          tx.objectStore(AUDIO_STORE).delete(key);
          
          await new Promise(r => { tx.oncomplete = r; });

          // Generate new
          const step = lessonSteps[idx];
          if (step.narration) {
              const buffer = await fetchAudioForStep(step); // This App function handles generation and saving
              if (buffer) {
                  const wav = pcmBufferToWav(buffer);
                  setAudioUrls(prev => new Map(prev).set(idx, URL.createObjectURL(wav)));
                  addLog(`Audio Step ${idx} Updated.`);
              } else {
                  addLog(`Generation Failed for Step ${idx}`);
              }
          }
      } catch (e) {
          addLog(`Error regenerating audio: ${e}`);
      }
      setProcessing(prev => new Map(prev).set(`audio_${idx}`, false));
      updateSystemStats();
  };

  // --- VIDEO LOGIC ---
  const loadVideoCache = async () => {
      try {
        const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
        const tx = db.transaction(VIDEO_STORE, 'readonly');
        const store = tx.objectStore(VIDEO_STORE);
        const req = store.openCursor();
        const newMap = new Map<string, string>();
        
        req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor) {
                const val = cursor.value as Blob;
                newMap.set(cursor.key as string, URL.createObjectURL(val));
                cursor.continue();
            } else {
                setVideoUrls(newMap);
                addLog(`Loaded ${newMap.size} video clips.`);
            }
        };
      } catch (e) {
          addLog("Failed to load Video Cache.");
      }
  };

  const regenerateVideo = async (clip: VideoClip) => {
     if (!process.env.API_KEY) { addLog("Missing API Key"); return; }
     setProcessing(prev => new Map(prev).set(`video_${clip.id}`, true));
     addLog(`Generating Video: ${clip.id}...`);

     try {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         // Ensure key selection for Veo
         if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if (!hasKey) {
                 await (window as any).aistudio.openSelectKey();
             }
         }

         let operation = await ai.models.generateVideos({
             model: 'veo-3.1-fast-generate-preview',
             prompt: clip.prompt,
             config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
         });

         while(!operation.done) {
             await new Promise(r => setTimeout(r, 5000));
             operation = await ai.operations.getVideosOperation({operation: operation});
             addLog(`Veo Polling ${clip.id}...`);
         }

         const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
         if (downloadLink) {
             const resp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
             const blob = await resp.blob();
             
             // Save
             const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
             const tx = db.transaction(VIDEO_STORE, 'readwrite');
             tx.objectStore(VIDEO_STORE).put(blob, clip.id);
             
             await new Promise(r => { tx.oncomplete = r; });
             setVideoUrls(prev => new Map(prev).set(clip.id, URL.createObjectURL(blob)));
             addLog(`Video ${clip.id} Cached.`);
         }
     } catch (e) {
         console.error(e);
         addLog(`Error generating ${clip.id}`);
     }
     setProcessing(prev => new Map(prev).set(`video_${clip.id}`, false));
     updateSystemStats();
  };

  // --- MUSIC LOGIC ---
  const loadMusicCache = async () => {
      try {
        const db = await openDB(MUSIC_DB_NAME, MUSIC_STORE);
        const tx = db.transaction(MUSIC_STORE, 'readonly');
        const req = tx.objectStore(MUSIC_STORE).get(MUSIC_TRACK_KEY);
        req.onsuccess = () => {
            if (req.result) {
                try {
                    const wav = interleavedBufferToWav(req.result);
                    setMusicUrl(URL.createObjectURL(wav));
                    addLog("Loaded Music Track.");
                } catch(e) { console.error(e); }
            } else {
                setMusicUrl(null);
            }
        };
      } catch (e) {
          addLog("Failed to load Music Cache.");
      }
  };

  const regenerateMusic = async () => {
      setProcessing(prev => new Map(prev).set('music', true));
      addLog("Generating Procedural Music Track (this takes a moment)...");
      try {
          // Re-implement generation logic here to avoid circular dependencies/component mounting issues
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const buffer = await generateMusicTrack(ctx);
          
          // Save interleaved
          const ch0 = buffer.getChannelData(0);
          const ch1 = buffer.getChannelData(1);
          const interleaved = new Float32Array(ch0.length * 2);
          for(let i=0; i<ch0.length; i++) { interleaved[i*2] = ch0[i]; interleaved[i*2+1] = ch1[i]; }
          
          const db = await openDB(MUSIC_DB_NAME, MUSIC_STORE);
          const tx = db.transaction(MUSIC_STORE, 'readwrite');
          tx.objectStore(MUSIC_STORE).put(interleaved.buffer, MUSIC_TRACK_KEY);
          
          await new Promise(r => { tx.oncomplete = r; });
          
          const wav = interleavedBufferToWav(interleaved.buffer);
          setMusicUrl(URL.createObjectURL(wav));
          addLog("Music Track Regenerated & Cached.");
      } catch (e) {
          console.error(e);
          addLog("Music Generation Failed.");
      }
      setProcessing(prev => new Map(prev).set('music', false));
      updateSystemStats();
  };

  // --- SHARED UPLOAD/DOWNLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !uploadTarget) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
          const buffer = evt.target?.result as ArrayBuffer;
          if (!buffer) return;

          if (uploadTarget.type === 'audio') {
              try {
                  addLog("Decoding uploaded audio...");
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const audioBuf = await ctx.decodeAudioData(buffer);
                  
                  // Resample to 24k mono if needed
                  const offline = new OfflineAudioContext(1, audioBuf.duration * 24000, 24000);
                  const source = offline.createBufferSource();
                  source.buffer = audioBuf;
                  source.connect(offline.destination);
                  source.start();
                  const rendered = await offline.startRendering();
                  const pcmData = rendered.getChannelData(0);
                  
                  // Convert Float32 to Int16
                  const int16 = new Int16Array(pcmData.length);
                  for (let i=0; i<pcmData.length; i++) {
                      int16[i] = Math.max(-1, Math.min(1, pcmData[i])) * 0x7FFF;
                  }
                  
                  const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
                  const tx = db.transaction(AUDIO_STORE, 'readwrite');
                  const stepIdx = uploadTarget.id as number;
                  const key = `step_${stepIdx}_v1`;
                  // We need the text to save strictly matching the structure
                  const text = lessonSteps[stepIdx].narration || "";
                  
                  tx.objectStore(AUDIO_STORE).put({ text, buffer: int16.buffer }, key);
                  addLog(`Uploaded Audio for Step ${stepIdx}`);
                  refreshAllMedia();
              } catch(e) { addLog("Upload Decode Error"); }

          } else if (uploadTarget.type === 'video') {
              // Direct Blob Save
              const blob = new Blob([buffer], {type: 'video/mp4'});
              const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
              const tx = db.transaction(VIDEO_STORE, 'readwrite');
              tx.objectStore(VIDEO_STORE).put(blob, uploadTarget.id as string);
              addLog(`Uploaded Video ${uploadTarget.id}`);
              refreshAllMedia();

          } else if (uploadTarget.type === 'music') {
              // Similar to Audio, decode and save as interleaved float32
              try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const audioBuf = await ctx.decodeAudioData(buffer);
                  const ch0 = audioBuf.getChannelData(0);
                  const ch1 = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : ch0;
                  const interleaved = new Float32Array(ch0.length * 2);
                  for(let i=0; i<ch0.length; i++) { interleaved[i*2] = ch0[i]; interleaved[i*2+1] = ch1[i]; }
                  
                  const db = await openDB(MUSIC_DB_NAME, MUSIC_STORE);
                  const tx = db.transaction(MUSIC_STORE, 'readwrite');
                  tx.objectStore(MUSIC_STORE).put(interleaved.buffer, MUSIC_TRACK_KEY);
                  addLog("Uploaded Custom Music Track");
                  refreshAllMedia();
              } catch(e) { addLog("Music Upload Failed"); }
          }
          updateSystemStats();
      };
      reader.readAsArrayBuffer(file);
      setUploadTarget(null);
  };

  const triggerUpload = (type: 'audio'|'video'|'music', id: string|number) => {
      setUploadTarget({type, id});
      fileInputRef.current?.click();
  };

  // --- UTILS ---
  const pcmBufferToWav = (buffer: ArrayBuffer): Blob => {
      // Int16 mono PCM to WAV
      const dataView = new DataView(buffer);
      const len = buffer.byteLength;
      const wavLen = 44 + len;
      const wavBuffer = new ArrayBuffer(wavLen);
      const view = new DataView(wavBuffer);
      
      const writeString = (offset: number, str: string) => {
          for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + len, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, 24000, true); // Sample Rate
      view.setUint32(28, 24000 * 2, true); // Byte Rate
      view.setUint16(32, 2, true); // Block Align
      view.setUint16(34, 16, true); // Bits per sample
      writeString(36, 'data');
      view.setUint32(40, len, true);
      
      const src = new Uint8Array(buffer);
      const dst = new Uint8Array(wavBuffer, 44);
      dst.set(src);
      
      return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const interleavedBufferToWav = (buffer: ArrayBuffer): Blob => {
      // Float32 Stereo Interleaved to WAV
      const float32 = new Float32Array(buffer);
      const len = float32.length;
      const wavLen = 44 + len * 2; // 16-bit output
      const wavBuffer = new ArrayBuffer(wavLen);
      const view = new DataView(wavBuffer);
      
      const writeString = (offset: number, str: string) => {
          for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + len * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 2, true); // Stereo
      // Assuming generated music is standard ctx rate (usually 44100 or 48000), let's guess 48000 based on OfflineContext default often
      // Or we should store sample rate. For now assuming 48000 for generated content.
      const sampleRate = 48000; 
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 4, true);
      view.setUint16(32, 4, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, len * 2, true);
      
      let offset = 44;
      for (let i = 0; i < len; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          offset += 2;
      }
      
      return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const generateMusicTrack = async (ctx: AudioContext): Promise<AudioBuffer> => {
    // Replicated Logic from ProceduralBackgroundAudio for standalone generation
    const sampleRate = ctx.sampleRate;
    const duration = 60; 
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    const bpm = 80; const beatTime = 60 / bpm; const totalBeats = Math.floor(duration / beatTime);

    const masterGain = offlineCtx.createGain(); masterGain.gain.value = 0.6; masterGain.connect(offlineCtx.destination);
    const delay = offlineCtx.createDelay(); delay.delayTime.value = beatTime * 0.75; 
    const delayFeedback = offlineCtx.createGain(); delayFeedback.gain.value = 0.3;
    const delayFilter = offlineCtx.createBiquadFilter(); delayFilter.type = 'lowpass'; delayFilter.frequency.value = 2000;
    delay.connect(delayFeedback); delayFeedback.connect(delayFilter); delayFilter.connect(delay); delay.connect(masterGain);

    const bassOsc = offlineCtx.createOscillator(); bassOsc.type = 'sawtooth'; bassOsc.frequency.value = 36.71;
    const bassFilter = offlineCtx.createBiquadFilter(); bassFilter.type = 'lowpass'; bassFilter.frequency.value = 120;
    const bassLfo = offlineCtx.createOscillator(); bassLfo.type = 'sine'; bassLfo.frequency.value = 0.1;
    const bassLfoGain = offlineCtx.createGain(); bassLfoGain.gain.value = 40;
    bassLfo.connect(bassLfoGain).connect(bassFilter.frequency); bassOsc.connect(bassFilter).connect(masterGain);
    bassOsc.start(0); bassLfo.start(0);

    const padOsc = offlineCtx.createOscillator(); padOsc.type = 'triangle'; padOsc.frequency.value = 146.83;
    const padGain = offlineCtx.createGain(); padGain.gain.value = 0.05;
    const padPan = offlineCtx.createStereoPanner();
    const padLfo = offlineCtx.createOscillator(); padLfo.frequency.value = 0.15; padLfo.connect(padPan.pan);
    padOsc.connect(padGain).connect(padPan).connect(masterGain); padOsc.connect(padGain).connect(delay);
    padOsc.start(0); padLfo.start(0);

    const arpGain = offlineCtx.createGain(); arpGain.gain.value = 0.03; arpGain.connect(delay);
    const notes = [293.66, 349.23, 440.00, 523.25, 293.66, 440.00, 349.23, 261.63];
    for (let i = 0; i < totalBeats * 4; i++) {
        if (Math.random() > 0.6) {
            const t = i * (beatTime / 4);
            const osc = offlineCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = notes[i % 8];
            const env = offlineCtx.createGain(); env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(0.4, t + 0.01); env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(env).connect(arpGain); osc.start(t); osc.stop(t + 0.25);
        }
    }
    return await offlineCtx.startRendering();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 cursor-default">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      <div className="bg-[#0a0a0a] border border-cyan-500 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.2)] relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
           <div className="flex items-center gap-3 text-cyan-400">
               <Terminal size={24} />
               <h2 className="text-xl font-bold cyber-font tracking-widest">SYS_ADMIN_CONSOLE</h2>
           </div>
           <div className="flex gap-4 items-center">
               <button onClick={onToggleSound} className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${soundEnabled ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-slate-700 text-slate-500'}`}>
                   {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} {soundEnabled ? "SOUND ON" : "SOUND OFF"}
               </button>
               <div className="h-6 w-px bg-slate-700 mx-2"></div>
               <button onClick={() => setActiveTab('audio')} className={`px-4 py-1 rounded flex items-center gap-2 ${activeTab === 'audio' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}><Volume2 size={14} /> Audio</button>
               <button onClick={() => setActiveTab('video')} className={`px-4 py-1 rounded flex items-center gap-2 ${activeTab === 'video' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}><Video size={14} /> Video</button>
               <button onClick={() => setActiveTab('music')} className={`px-4 py-1 rounded flex items-center gap-2 ${activeTab === 'music' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}><Music size={14} /> Music</button>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-white ml-4"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row pb-12">
            
            {/* Status Log Sidebar */}
            <div className="w-full md:w-64 p-6 border-r border-slate-800 bg-black/20 flex flex-col gap-4 min-h-0">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between items-center">
                    <span>System Log</span>
                </div>
                
                {/* Log area grows */}
                <div className="bg-black/50 p-2 font-mono text-[10px] text-green-400 flex-1 overflow-y-auto border border-slate-800 rounded">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                    {logs.length === 0 && <div className="text-slate-600 italic">No activity recorded.</div>}
                </div>

                {/* Buttons at bottom */}
                <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate-800">
                     <button 
                        onClick={refreshAllMedia} 
                        className="w-full py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-xs hover:bg-slate-700 hover:text-white hover:border-slate-500 flex items-center justify-center gap-2 transition-all"
                     >
                        <RefreshCw size={14} /> RELOAD CACHE
                     </button>

                    {activeTab === 'audio' && (
                        <button className="w-full py-3 bg-yellow-900/20 text-yellow-500 border border-yellow-700/50 rounded font-mono text-xs hover:bg-yellow-900/40 transition-all">
                            BATCH GENERATE MISSING
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/10">
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-cyber">
                    
                    {/* AUDIO TAB */}
                    {activeTab === 'audio' && lessonSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded group hover:border-cyan-500/50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                                {audioUrls.has(idx) ? <CheckCircle2 size={16} className="text-emerald-500" /> : <X size={16} className="text-red-500" />}
                                <div className="flex flex-col">
                                    <span className="text-slate-200 text-sm font-bold truncate w-96">{step.title}</span>
                                    <span className="text-[10px] text-slate-500">{step.narration ? `${step.narration.length} chars` : 'No Narration'}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {audioUrls.has(idx) && (
                                    <audio controls src={audioUrls.get(idx)} className="h-8 w-32 opacity-50 hover:opacity-100 transition-opacity" />
                                )}
                                <button 
                                    onClick={() => regenerateAudio(idx)}
                                    disabled={!step.narration || processing.get(`audio_${idx}`)}
                                    className="p-2 bg-slate-800 rounded hover:bg-cyan-900/50 hover:text-cyan-400 text-slate-400 disabled:opacity-30"
                                    title="Regenerate"
                                >
                                    {processing.get(`audio_${idx}`) ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                </button>
                                <button 
                                    onClick={() => triggerUpload('audio', idx)}
                                    className="p-2 bg-slate-800 rounded hover:bg-cyan-900/50 hover:text-cyan-400 text-slate-400"
                                    title="Upload WAV"
                                >
                                    <Upload size={14} />
                                </button>
                                {audioUrls.has(idx) && (
                                    <a 
                                        href={audioUrls.get(idx)} 
                                        download={`step_${idx}.wav`}
                                        className="p-2 bg-slate-800 rounded hover:bg-cyan-900/50 hover:text-cyan-400 text-slate-400 block"
                                    >
                                        <Download size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* VIDEO TAB */}
                    {activeTab === 'video' && lessonSteps.map((step, idx) => (
                        step.videoScript?.map((clip, cIdx) => (
                            <div key={`${idx}_${cIdx}`} className="bg-slate-900/30 border border-slate-800 rounded p-4 mb-2 flex gap-4 items-start">
                                <div className="w-32 h-20 bg-black rounded border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                    {videoUrls.has(clip.id) ? (
                                        <video src={videoUrls.get(clip.id)} className="w-full h-full object-cover" />
                                    ) : (
                                        <Video className="text-slate-700" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-cyan-400 text-xs font-mono">{clip.id}</span>
                                        <span className="text-slate-500 text-[10px]">@{clip.at}%</span>
                                    </div>
                                    <p className="text-xs text-slate-400 italic mb-2 line-clamp-2">{clip.prompt}</p>
                                    <div className="flex gap-2">
                                        {videoUrls.has(clip.id) && (
                                            <button 
                                                onClick={() => { const v = document.createElement('video'); v.src=videoUrls.get(clip.id)!; v.controls=true; v.className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] max-w-[80vw]"; document.body.appendChild(v); v.play(); v.onended=()=>v.remove(); }}
                                                className="px-3 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] rounded border border-emerald-800 hover:bg-emerald-900/50"
                                            >
                                                PREVIEW
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => regenerateVideo(clip)}
                                            disabled={processing.get(`video_${clip.id}`)}
                                            className="px-3 py-1 bg-yellow-900/20 text-yellow-500 text-[10px] rounded border border-yellow-800 hover:bg-yellow-900/40 flex items-center gap-1"
                                        >
                                            {processing.get(`video_${clip.id}`) && <Loader size={10} className="animate-spin" />} REGENERATE
                                        </button>
                                        <button onClick={() => triggerUpload('video', clip.id)} className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 hover:bg-slate-700">UPLOAD</button>
                                        {videoUrls.has(clip.id) && (
                                            <a href={videoUrls.get(clip.id)} download={`${clip.id}.mp4`} className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 hover:bg-slate-700 block">DOWNLOAD</a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ))}

                    {/* MUSIC TAB */}
                    {activeTab === 'music' && (
                        <div className="bg-slate-900/30 border border-slate-800 rounded p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white cyber-font">Ambient Soundtrack</h3>
                                    <p className="text-xs text-slate-500">Procedural audio track loop (60s).</p>
                                </div>
                                <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest ${musicUrl ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                    {musicUrl ? 'CACHED' : 'MISSING'}
                                </div>
                            </div>
                            
                            {musicUrl && <audio controls src={musicUrl} className="w-full mb-6" />}
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={regenerateMusic}
                                    disabled={processing.get('music')}
                                    className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded hover:border-cyan-500 hover:text-cyan-400 flex flex-col items-center justify-center gap-2"
                                >
                                    {processing.get('music') ? <Loader size={24} className="animate-spin" /> : <RefreshCw size={24} />}
                                    <span className="text-xs font-bold">REGENERATE PROCEDURAL</span>
                                </button>
                                
                                <button 
                                    onClick={() => triggerUpload('music', 'bgm')}
                                    className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded hover:border-cyan-500 hover:text-cyan-400 flex flex-col items-center justify-center gap-2"
                                >
                                    <Upload size={24} />
                                    <span className="text-xs font-bold">UPLOAD CUSTOM</span>
                                </button>
                                
                                {musicUrl && (
                                    <a 
                                        href={musicUrl} 
                                        download="soundtrack.wav"
                                        className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded hover:border-cyan-500 hover:text-cyan-400 flex flex-col items-center justify-center gap-2"
                                    >
                                        <Download size={24} />
                                        <span className="text-xs font-bold">DOWNLOAD WAV</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer Status Bar */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-[#050505] border-t border-slate-800 flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-6 text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-2">
                    <HardDrive size={12} className="text-cyan-600" />
                    <span>STORAGE: <span className="text-cyan-400">{storageSize}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <FileAudio size={12} className="text-purple-600" />
                    <span>LAST SAVED: <span className="text-purple-400">{lastSaved}</span></span>
                </div>
            </div>
            
            <button 
                onClick={handleSaveSession}
                className="flex items-center gap-2 px-4 py-1 bg-cyan-900/20 text-cyan-400 border border-cyan-800 rounded hover:bg-cyan-900/40 transition-colors text-xs font-bold uppercase tracking-widest"
            >
                <Save size={14} /> Save Session State
            </button>
        </div>

      </div>
    </div>
  );
};