import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LessonStep, VideoClip } from '../types';
import { Download, Upload, X, Loader, Terminal, Video, RefreshCw, CheckCircle2, Play, Pause, Volume2, VolumeX, Music, Trash2, Save, HardDrive, FileAudio, MoveHorizontal, GitCommit, Layers, Film, Archive, ArrowUpFromLine, ArrowDownToLine, Plus, GripVertical, SkipBack, SkipForward, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import JSZip from 'jszip';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonSteps: LessonStep[];
  fetchAudioForStep: (step: LessonStep) => Promise<ArrayBuffer | undefined>;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentStepIndex?: number;
  currentProgress?: number;
  onSeek?: (stepIndex: number, progress: number) => void;
  onUpdateLessonSteps?: (newSteps: LessonStep[]) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
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
const METADATA_STORE = 'lesson_metadata';

// --- DB HELPERS ---
const openDB = (name: string, store: string, version: number = 1): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name, version);
        req.onupgradeneeded = (evt) => {
            const db = (evt.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
            if (name === SYSTEM_DB_NAME && !db.objectStoreNames.contains(METADATA_STORE)) db.createObjectStore(METADATA_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    isOpen, 
    onClose, 
    lessonSteps, 
    fetchAudioForStep, 
    soundEnabled, 
    onToggleSound, 
    currentStepIndex = 0,
    currentProgress = 0,
    onSeek,
    onUpdateLessonSteps,
    isPlaying = false,
    onTogglePlay
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'music'>('audio');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Media State Maps
  const [audioUrls, setAudioUrls] = useState<Map<number, string>>(new Map());
  const [videoUrls, setVideoUrls] = useState<Map<string, string>>(new Map());
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  
  const [processing, setProcessing] = useState<Map<string, boolean>>(new Map()); 
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [storageSize, setStorageSize] = useState<string>("0 MB");
  const [lastSaved, setLastSaved] = useState<string>("Never");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importZipInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{type: 'audio'|'video'|'music', id: string|number} | null>(null);
  
  // Drag Drop State
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // New Clip State
  const [newClipData, setNewClipData] = useState<{stepIdx: number, prompt: string, at: number} | null>(null);

  // Timeline UI State
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(10); 
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  const addLog = (msg: string) => {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  useEffect(() => {
      if (isOpen) {
          refreshAllMedia();
          updateSystemStats();
      }
      return () => {
          audioUrls.forEach(url => URL.revokeObjectURL(url));
          videoUrls.forEach(url => URL.revokeObjectURL(url));
          if (musicUrl) URL.revokeObjectURL(musicUrl);
      };
  }, [isOpen]);

  const timelineData = useMemo(() => {
      let globalTime = 0;
      return lessonSteps.map((step, idx) => {
          const wordCount = (step.narration || "").split(" ").length;
          const duration = Math.max(5, wordCount / 2.5 + 2); 
          const start = globalTime;
          globalTime += duration;
          return { ...step, idx, start, duration, end: start + duration };
      });
  }, [lessonSteps]);

  const totalDuration = timelineData[timelineData.length - 1]?.end || 100;

  const currentGlobalTime = useMemo(() => {
      const stepData = timelineData[currentStepIndex];
      if (!stepData) return 0;
      return stepData.start + (stepData.duration * (currentProgress / 100));
  }, [currentStepIndex, currentProgress, timelineData]);

  const handleTimelineClick = (e: React.MouseEvent) => {
      if (!timelineRef.current || !onSeek) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
      const time = clickX / zoomLevel;
      
      const targetStep = timelineData.find(s => time >= s.start && time < s.end);
      if (targetStep) {
          const localProgress = ((time - targetStep.start) / targetStep.duration) * 100;
          onSeek(targetStep.idx, Math.min(99.9, Math.max(0, localProgress)));
      }
  };

  const handlePrevStep = () => {
      if (!onSeek) return;
      if (currentProgress > 5) {
          onSeek(currentStepIndex, 0);
      } else if (currentStepIndex > 0) {
          onSeek(currentStepIndex - 1, 0);
      }
  };

  const handleNextStep = () => {
      if (!onSeek) return;
      if (currentStepIndex < lessonSteps.length - 1) {
          onSeek(currentStepIndex + 1, 0);
      }
  };

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
                          else if (val.buffer instanceof ArrayBuffer) totalBytes += val.buffer.byteLength; 
                          cursor.continue();
                      } else { resolve(); }
                  };
                  req.onerror = () => resolve(); 
              });
          } catch(e) { console.error(e); }
      };
      await countDB(VIDEO_DB_NAME, VIDEO_STORE);
      await countDB(AUDIO_DB_NAME, AUDIO_STORE);
      await countDB(MUSIC_DB_NAME, MUSIC_STORE);
      setStorageSize((totalBytes / (1024 * 1024)).toFixed(2) + " MB");
      try {
          const db = await openDB(SYSTEM_DB_NAME, SYSTEM_STORE);
          const tx = db.transaction(SYSTEM_STORE, 'readonly');
          const req = tx.objectStore(SYSTEM_STORE).get('save_meta');
          req.onsuccess = () => {
              if (req.result) setLastSaved(new Date(req.result.timestamp).toLocaleString());
          };
      } catch (e) {}
  };

  // --- SAVE CUSTOM CLIPS LOGIC ---
  const saveCustomClipsToDB = async (updatedSteps: LessonStep[]) => {
      if (!onUpdateLessonSteps) return;
      onUpdateLessonSteps(updatedSteps);

      const clipMap: Record<number, VideoClip[]> = {};
      updatedSteps.forEach((step, idx) => {
          if (step.videoScript && step.videoScript.length > 0) {
              clipMap[idx] = step.videoScript;
          }
      });

      try {
          const db = await openDB(SYSTEM_DB_NAME, METADATA_STORE);
          const tx = db.transaction(METADATA_STORE, 'readwrite');
          tx.objectStore(METADATA_STORE).put(clipMap, 'video_clips_v1');
          await new Promise(r => { tx.oncomplete = r; });
          addLog("Video Clip Metadata Saved.");
      } catch(e) { addLog("Failed to save clip metadata."); }
  };

  const handleAddClip = (stepIdx: number) => {
      if (!newClipData || !newClipData.prompt) return;
      
      const newId = `custom_s${stepIdx}_c${Date.now().toString().slice(-4)}`;
      const newClip: VideoClip = {
          at: newClipData.at,
          prompt: newClipData.prompt,
          id: newId
      };

      const newSteps = [...lessonSteps];
      const newScript = newSteps[stepIdx].videoScript ? [...newSteps[stepIdx].videoScript!] : [];
      newScript.push(newClip);
      newSteps[stepIdx] = { ...newSteps[stepIdx], videoScript: newScript };

      saveCustomClipsToDB(newSteps);
      setNewClipData(null);
      addLog(`Added clip ${newId} to Step ${stepIdx}`);
  };

  const handleDeleteClip = (stepIdx: number, clipId: string) => {
      const newSteps = [...lessonSteps];
      if (!newSteps[stepIdx].videoScript) return;
      newSteps[stepIdx].videoScript = newSteps[stepIdx].videoScript!.filter(c => c.id !== clipId);
      saveCustomClipsToDB(newSteps);
      addLog(`Removed clip ${clipId}`);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      setDragOverId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, type: 'audio'|'video'|'music', id: string | number) => {
      e.preventDefault();
      setDragOverId(null);
      const file = e.dataTransfer.files[0];
      if (!file) return;

      addLog(`Processing dropped file for ${type} ${id}...`);
      
      const buffer = await file.arrayBuffer();
      
      try {
          if (type === 'audio') {
              const idx = typeof id === 'string' ? parseInt(id) : id;
              const step = lessonSteps[idx];
              const text = step.narration || "";
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const decoded = await ctx.decodeAudioData(buffer);
              const offlineCtx = new OfflineAudioContext(1, decoded.duration * 24000, 24000);
              const source = offlineCtx.createBufferSource();
              source.buffer = decoded;
              source.connect(offlineCtx.destination);
              source.start();
              const rendered = await offlineCtx.startRendering();
              const data = rendered.getChannelData(0);
              const int16 = new Int16Array(data.length);
              for(let i=0; i<data.length; i++) int16[i] = Math.max(-1, Math.min(1, data[i])) * 0x7FFF;
              
              const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
              const tx = db.transaction(AUDIO_STORE, 'readwrite');
              tx.objectStore(AUDIO_STORE).put({ text, buffer: int16.buffer }, `step_${idx}_v1`);
              await new Promise(r => { tx.oncomplete = r; });
              addLog(`Uploaded Audio via Drop for Step ${idx}`);
          } 
          else if (type === 'video') {
              const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
              const tx = db.transaction(VIDEO_STORE, 'readwrite');
              const blob = new Blob([buffer], { type: file.type });
              tx.objectStore(VIDEO_STORE).put(blob, id);
              await new Promise(r => { tx.oncomplete = r; });
              addLog(`Uploaded Video via Drop ${id}`);
          }
          else if (type === 'music') {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const decoded = await ctx.decodeAudioData(buffer);
              const ch0 = decoded.getChannelData(0);
              const ch1 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : ch0;
              const interleaved = new Float32Array(ch0.length * 2);
              for(let i=0; i<ch0.length; i++) { interleaved[i*2] = ch0[i]; interleaved[i*2+1] = ch1[i]; }
              
              const db = await openDB(MUSIC_DB_NAME, MUSIC_STORE);
              const tx = db.transaction(MUSIC_STORE, 'readwrite');
              tx.objectStore(MUSIC_STORE).put(interleaved.buffer, MUSIC_TRACK_KEY);
              await new Promise(r => { tx.oncomplete = r; });
              addLog("Uploaded Music via Drop");
          }
          
          await refreshAllMedia();
          handleSaveSession();
      } catch (e) {
          console.error(e);
          addLog(`Drop Upload Failed: ${e}`);
      }
  };

  const handleSaveSession = async () => {
      try {
          const db = await openDB(SYSTEM_DB_NAME, SYSTEM_STORE);
          const tx = db.transaction(SYSTEM_STORE, 'readwrite');
          const meta = { timestamp: Date.now(), size: storageSize };
          tx.objectStore(SYSTEM_STORE).put(meta, 'save_meta');
          tx.oncomplete = () => { addLog("Session State Saved."); updateSystemStats(); };
      } catch (e) { addLog("Save Failed."); }
  };

  // ... [Export/Import logic omitted for brevity as it remains unchanged] ...
  const handleExportSession = async () => {
      setIsExporting(true);
      addLog("Preparing Export Package...");
      const zip = new JSZip();
      const manifest: any = { audio: {}, video: {}, music: {} };

      try {
          const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
          await new Promise<void>((resolve) => {
              const tx = db.transaction(AUDIO_STORE, 'readonly');
              const req = tx.objectStore(AUDIO_STORE).openCursor();
              req.onsuccess = (e) => {
                  const cursor = (e.target as IDBRequest).result;
                  if (cursor) {
                      if (cursor.value.buffer) {
                          const filename = `audio/${cursor.key}.bin`;
                          zip.file(filename, cursor.value.buffer);
                          manifest.audio[cursor.key] = { file: filename, text: cursor.value.text };
                      }
                      cursor.continue();
                  } else { resolve(); }
              };
          });
          addLog("Audio Exported.");
      } catch (e) {}

      try {
          const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
          await new Promise<void>((resolve) => {
              const tx = db.transaction(VIDEO_STORE, 'readonly');
              const req = tx.objectStore(VIDEO_STORE).openCursor();
              req.onsuccess = (e) => {
                  const cursor = (e.target as IDBRequest).result;
                  if (cursor) {
                      const blob = cursor.value as Blob;
                      const ext = blob.type.split('/')[1] || 'mp4';
                      const filename = `video/${cursor.key}.${ext}`;
                      zip.file(filename, blob);
                      manifest.video[cursor.key] = { file: filename, type: blob.type };
                      cursor.continue();
                  } else { resolve(); }
              };
          });
          addLog("Video Exported.");
      } catch (e) {}

      try {
          const db = await openDB(MUSIC_DB_NAME, MUSIC_STORE);
          await new Promise<void>((resolve) => {
              const tx = db.transaction(MUSIC_STORE, 'readonly');
              const req = tx.objectStore(MUSIC_STORE).openCursor();
              req.onsuccess = (e) => {
                  const cursor = (e.target as IDBRequest).result;
                  if (cursor) {
                      const filename = `music/${cursor.key}.bin`;
                      zip.file(filename, cursor.value);
                      manifest.music[cursor.key] = { file: filename };
                      cursor.continue();
                  } else { resolve(); }
              };
          });
          addLog("Music Exported.");
      } catch (e) {}

      // Export Custom Metadata
      if (onUpdateLessonSteps) {
          const clipMap: Record<number, VideoClip[]> = {};
          lessonSteps.forEach((step, idx) => {
              if (step.videoScript && step.videoScript.length > 0) clipMap[idx] = step.videoScript;
          });
          manifest.metadata = clipMap;
      }

      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `L-Group_Session_${new Date().toISOString().slice(0,10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      addLog("Export Complete.");
  };

  const handleImportSession = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      addLog("Reading Import Package...");
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const zip = await JSZip.loadAsync(evt.target?.result as ArrayBuffer);
              const manifestStr = await zip.file("manifest.json")?.async("string");
              if (!manifestStr) throw new Error("No manifest");
              const manifest = JSON.parse(manifestStr);

              // Import Logic
              if (manifest.metadata && onUpdateLessonSteps) {
                  const extraClips = manifest.metadata as Record<number, VideoClip[]>;
                  const mergedSteps = lessonSteps.map((step, idx) => {
                      const extras = extraClips[idx] || [];
                      const existing = step.videoScript || [];
                      const combined = [...existing];
                      extras.forEach(extra => {
                          if (!combined.find(c => c.id === extra.id)) combined.push(extra);
                      });
                      return { ...step, videoScript: combined };
                  });
                  saveCustomClipsToDB(mergedSteps);
              }
              
              if (manifest.audio) {
                  const audioEntries: {key: string, value: any}[] = [];
                  for (const key in manifest.audio) {
                      const item = manifest.audio[key];
                      const file = zip.file(item.file);
                      if (file) {
                          const buffer = await file.async("arraybuffer");
                          audioEntries.push({ key, value: { text: item.text, buffer } });
                      }
                  }

                  if (audioEntries.length > 0) {
                      const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
                      const tx = db.transaction(AUDIO_STORE, 'readwrite');
                      const store = tx.objectStore(AUDIO_STORE);
                      audioEntries.forEach(entry => store.put(entry.value, entry.key));
                      await new Promise(r => { tx.oncomplete = r; });
                      addLog(`Imported ${audioEntries.length} Audio files.`);
                  }
              }

              if (manifest.video) {
                  const videoEntries: {key: string, blob: Blob}[] = [];
                  for (const key in manifest.video) {
                      const item = manifest.video[key];
                      const file = zip.file(item.file);
                      if (file) {
                          const buffer = await file.async("arraybuffer");
                          const blob = new Blob([buffer], { type: item.type });
                          videoEntries.push({ key, blob });
                      }
                  }

                  if (videoEntries.length > 0) {
                      const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
                      const tx = db.transaction(VIDEO_STORE, 'readwrite');
                      const store = tx.objectStore(VIDEO_STORE);
                      videoEntries.forEach(entry => store.put(entry.blob, entry.key));
                      await new Promise(r => { tx.oncomplete = r; });
                      addLog(`Imported ${videoEntries.length} Video clips.`);
                  }
              }

              if (manifest.music) {
                  const musicEntries: {key: string, buffer: ArrayBuffer}[] = [];
                  for (const key in manifest.music) {
                      const item = manifest.music[key];
                      const file = zip.file(item.file);
                      if (file) {
                          const buffer = await file.async("arraybuffer");
                          musicEntries.push({ key, buffer });
                      }
                  }

                  if (musicEntries.length > 0) {
                      const db = await openDB(MUSIC_DB_NAME, MUSIC_STORE);
                      const tx = db.transaction(MUSIC_STORE, 'readwrite');
                      const store = tx.objectStore(MUSIC_STORE);
                      musicEntries.forEach(entry => store.put(entry.buffer, entry.key));
                      await new Promise(r => { tx.oncomplete = r; });
                      addLog("Imported Music.");
                  }
              }
              
              await refreshAllMedia();
              handleSaveSession();
              addLog("Import Successful.");
          } catch(e) { addLog("Import Failed."); console.error(e); }
          setIsImporting(false);
          if (importZipInputRef.current) importZipInputRef.current.value = '';
      };
      reader.readAsArrayBuffer(file);
  };

  const pcmBufferToWav = (buffer: ArrayBuffer): Blob => {
      const dataView = new DataView(buffer);
      const len = buffer.byteLength;
      const wavLen = 44 + len;
      const wavBuffer = new ArrayBuffer(wavLen);
      const view = new DataView(wavBuffer);
      const writeString = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
      writeString(0, 'RIFF'); view.setUint32(4, 36 + len, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
      view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, len, true);
      const src = new Uint8Array(buffer); const dst = new Uint8Array(wavBuffer, 44); dst.set(src);
      return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const interleavedBufferToWav = (buffer: ArrayBuffer): Blob => {
      const float32 = new Float32Array(buffer);
      const len = float32.length;
      const wavLen = 44 + len * 2;
      const wavBuffer = new ArrayBuffer(wavLen);
      const view = new DataView(wavBuffer);
      const writeString = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
      writeString(0, 'RIFF'); view.setUint32(4, 36 + len * 2, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, 48000, true);
      view.setUint32(28, 48000 * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, len * 2, true);
      let offset = 44; for (let i = 0; i < len; i++) { const s = Math.max(-1, Math.min(1, float32[i])); view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); offset += 2; }
      return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && uploadTarget) {
          const fakeEvent = { preventDefault: () => {}, dataTransfer: { files: [file] } } as unknown as React.DragEvent;
          handleDrop(fakeEvent, uploadTarget.type, uploadTarget.id);
          setUploadTarget(null);
      }
  };

  const triggerUpload = (type: 'audio'|'video'|'music', id: string|number) => { setUploadTarget({type, id}); fileInputRef.current?.click(); };

  // --- REGENERATION LOGIC (Placeholders to prevent errors, keeping existing logic structure) ---
  const loadAudioCache = async () => {
      try {
        const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(AUDIO_STORE, 'readonly');
            const store = tx.objectStore(AUDIO_STORE);
            const req = store.openCursor();
            const newMap = new Map<number, string>();
            let count = 0;
            
            req.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest).result;
                if (cursor) {
                    const key = cursor.key as string; 
                    if (key.startsWith('step_')) {
                        const idx = parseInt(key.split('_')[1]);
                        const val = cursor.value; 
                        try {
                            if (val && val.buffer) {
                                const wav = pcmBufferToWav(val.buffer);
                                newMap.set(idx, URL.createObjectURL(wav));
                                count++;
                            }
                        } catch (err) {}
                    }
                    cursor.continue();
                } else {
                    setAudioUrls(newMap);
                    addLog(`Loaded ${count} audio files.`);
                    resolve();
                }
            };
            req.onerror = () => reject(req.error);
        });
      } catch (e) { addLog("Failed to load Audio Cache."); }
  };

  const loadVideoCache = async () => {
      try {
        const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(VIDEO_STORE, 'readonly');
            const store = tx.objectStore(VIDEO_STORE);
            const req = store.openCursor();
            const newMap = new Map<string, string>();
            let count = 0;
            
            req.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest).result;
                if (cursor) {
                    const val = cursor.value as Blob;
                    newMap.set(cursor.key as string, URL.createObjectURL(val));
                    count++;
                    cursor.continue();
                } else {
                    setVideoUrls(newMap);
                    addLog(`Loaded ${count} video clips.`);
                    resolve();
                }
            };
            req.onerror = () => reject(req.error);
        });
      } catch (e) { addLog("Failed to load Video Cache."); }
  };

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
            } else { setMusicUrl(null); }
        };
      } catch (e) { addLog("Failed to load Music Cache."); }
  };

  const regenerateAudio = async (idx: number) => {
      setProcessing(prev => new Map(prev).set(`audio_${idx}`, true));
      addLog(`Regenerating Audio for Step ${idx}...`);
      try {
          const db = await openDB(AUDIO_DB_NAME, AUDIO_STORE, 2);
          await new Promise<void>((resolve) => {
              const tx = db.transaction(AUDIO_STORE, 'readwrite');
              tx.objectStore(AUDIO_STORE).delete(`step_${idx}_v1`);
              tx.oncomplete = () => resolve();
          });
          const step = lessonSteps[idx];
          if (step.narration) {
              const buffer = await fetchAudioForStep(step); 
              if (buffer) {
                  const wav = pcmBufferToWav(buffer);
                  setAudioUrls(prev => new Map(prev).set(idx, URL.createObjectURL(wav)));
                  addLog(`Audio Step ${idx} Updated.`);
                  await handleSaveSession(); 
              } else { addLog(`Generation Failed for Step ${idx}`); }
          }
      } catch (e) { addLog(`Error regenerating audio: ${e}`); }
      setProcessing(prev => new Map(prev).set(`audio_${idx}`, false));
      updateSystemStats();
  };

  const regenerateVideo = async (clip: VideoClip) => {
     if (!process.env.API_KEY && (!window || !(window as any).aistudio)) { addLog("Missing API Key"); return; }
     setProcessing(prev => new Map(prev).set(`video_${clip.id}`, true));
     addLog(`Generating Video: ${clip.id}...`);
     try {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIza_dummy_key' });
         if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if (!hasKey) { await (window as any).aistudio.openSelectKey(); }
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
             const key = process.env.API_KEY || ((window as any).aistudio ? 'aistudio' : '');
             const resp = await fetch(`${downloadLink}&key=${key}`);
             const blob = await resp.blob();
             const db = await openDB(VIDEO_DB_NAME, VIDEO_STORE);
             const tx = db.transaction(VIDEO_STORE, 'readwrite');
             tx.objectStore(VIDEO_STORE).put(blob, clip.id);
             await new Promise(r => { tx.oncomplete = r; });
             setVideoUrls(prev => new Map(prev).set(clip.id, URL.createObjectURL(blob)));
             addLog(`Video ${clip.id} Cached.`);
             await handleSaveSession(); 
         }
     } catch (e) { console.error(e); addLog(`Error generating ${clip.id}: ${e}`); }
     setProcessing(prev => new Map(prev).set(`video_${clip.id}`, false));
     updateSystemStats();
  };

  const generateMusicTrack = async (ctx: AudioContext): Promise<AudioBuffer> => {
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
    return await offlineCtx.startRendering();
  };

  const regenerateMusic = async () => {
      setProcessing(prev => new Map(prev).set('music', true));
      addLog("Generating Procedural Music Track...");
      try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const buffer = await generateMusicTrack(ctx);
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
          addLog("Music Track Regenerated.");
          await handleSaveSession(); 
      } catch (e) { console.error(e); addLog("Music Generation Failed."); }
      setProcessing(prev => new Map(prev).set('music', false));
      updateSystemStats();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 cursor-default">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
      <input type="file" ref={importZipInputRef} className="hidden" accept=".zip" onChange={handleImportSession} />

      <div className="bg-[#0a0a0a] border border-cyan-500 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.2)] relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
           <div className="flex items-center gap-3 text-cyan-400">
               <Terminal size={24} />
               <h2 className="text-xl font-bold cyber-font tracking-widest">SYS_ADMIN_CONSOLE</h2>
           </div>
           <div className="flex gap-4 items-center">
               <button onClick={onToggleSound} className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${soundEnabled ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-slate-700 text-slate-500'}`}>{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} {soundEnabled ? "SOUND ON" : "SOUND OFF"}</button>
               <button onClick={() => setActiveTab('audio')} className={`px-4 py-1 rounded flex items-center gap-2 ${activeTab === 'audio' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}><Volume2 size={14} /> Audio</button>
               <button onClick={() => setActiveTab('video')} className={`px-4 py-1 rounded flex items-center gap-2 ${activeTab === 'video' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}><Video size={14} /> Video</button>
               <button onClick={() => setActiveTab('music')} className={`px-4 py-1 rounded flex items-center gap-2 ${activeTab === 'music' ? 'bg-cyan-900 text-white' : 'text-slate-500'}`}><Music size={14} /> Music</button>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-white ml-4"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-64 p-6 border-r border-slate-800 bg-black/20 flex flex-col min-h-0">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">System Log</div>
                <div className="bg-black/50 p-2 font-mono text-[10px] text-green-400 flex-1 overflow-y-auto border border-slate-800 rounded mb-4">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                     <button onClick={refreshAllMedia} className="w-full py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono text-xs hover:bg-slate-700 hover:text-white"><RefreshCw size={14} className="inline mr-2" /> RELOAD CACHE</button>
                     <button onClick={handleExportSession} disabled={isExporting} className="w-full py-3 bg-cyan-900/20 text-cyan-400 border border-cyan-800 rounded font-mono text-xs hover:bg-cyan-900/40"><ArrowUpFromLine size={14} className="inline mr-2" /> EXPORT SESSION</button>
                     <button onClick={() => importZipInputRef.current?.click()} disabled={isImporting} className="w-full py-3 bg-purple-900/20 text-purple-400 border border-purple-800 rounded font-mono text-xs hover:bg-purple-900/40"><ArrowDownToLine size={14} className="inline mr-2" /> IMPORT SESSION</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/10 relative">
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-cyber pb-64">
                    {activeTab === 'audio' && lessonSteps.map((step, idx) => (
                        <div 
                            key={idx} 
                            onDragOver={(e) => handleDragOver(e, `audio_${idx}`)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, 'audio', idx)}
                            className={`flex items-center justify-between p-3 border rounded transition-all ${dragOverId === `audio_${idx}` ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/50'}`}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                {audioUrls.has(idx) ? <CheckCircle2 size={16} className="text-emerald-500" /> : <X size={16} className="text-red-500" />}
                                <div className="flex flex-col">
                                    <span className="text-slate-200 text-sm font-bold truncate w-96">{step.title}</span>
                                    <span className="text-[10px] text-slate-500">{step.narration ? `${step.narration.length} chars` : 'No Narration'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {audioUrls.has(idx) && <audio key={audioUrls.get(idx)} controls src={audioUrls.get(idx)} className="h-8 w-32 opacity-50 hover:opacity-100 transition-opacity" />}
                                <button onClick={() => regenerateAudio(idx)} disabled={!step.narration || processing.get(`audio_${idx}`)} className="p-2 bg-slate-800 rounded hover:bg-cyan-900/50 hover:text-cyan-400 text-slate-400 disabled:opacity-30"><RefreshCw size={14} /></button>
                                <button onClick={() => triggerUpload('audio', idx)} className="p-2 bg-slate-800 rounded hover:bg-cyan-900/50 hover:text-cyan-400 text-slate-400"><Upload size={14} /></button>
                            </div>
                        </div>
                    ))}
                    
                    {activeTab === 'video' && lessonSteps.map((step, idx) => (
                        <div key={idx} className="bg-slate-900/20 border border-slate-800/50 rounded mb-4 overflow-hidden">
                            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                                <span className="font-bold text-sm text-cyan-400">{step.title}</span>
                                <button onClick={() => setNewClipData(prev => prev?.stepIdx === idx ? null : {stepIdx: idx, prompt: "", at: 0})} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white"><Plus size={12}/> ADD CLIP</button>
                            </div>
                            
                            {/* Add Clip Form */}
                            {newClipData?.stepIdx === idx && (
                                <div className="p-4 bg-cyan-900/10 border-b border-cyan-900/30 flex gap-2 items-center">
                                    <input type="number" min="0" max="100" placeholder="At %" value={newClipData.at} onChange={e => setNewClipData({...newClipData, at: parseInt(e.target.value)})} className="w-16 bg-black border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    <input type="text" placeholder="Video Prompt" value={newClipData.prompt} onChange={e => setNewClipData({...newClipData, prompt: e.target.value})} className="flex-1 bg-black border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    <button onClick={() => handleAddClip(idx)} className="px-3 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-500">SAVE</button>
                                </div>
                            )}

                            <div className="p-2 space-y-2">
                                {(!step.videoScript || step.videoScript.length === 0) && <div className="text-[10px] text-slate-600 italic px-2">No clips defined.</div>}
                                {step.videoScript?.map((clip, cIdx) => (
                                    <div 
                                        key={clip.id} 
                                        onDragOver={(e) => handleDragOver(e, `video_${clip.id}`)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'video', clip.id)}
                                        className={`flex gap-4 items-start p-2 rounded transition-all ${dragOverId === `video_${clip.id}` ? 'bg-purple-900/40 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-slate-900/30 border border-slate-800'}`}
                                    >
                                        <div className="w-32 h-20 bg-black rounded border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 group relative">
                                            {videoUrls.has(clip.id) ? (
                                                <video key={videoUrls.get(clip.id)} src={videoUrls.get(clip.id)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-slate-700">
                                                    <Video size={20} />
                                                    <span className="text-[9px]">DROP HERE</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-cyan-400 text-xs font-mono truncate mr-2">{clip.id}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 text-[10px]">@{clip.at}%</span>
                                                    <button onClick={() => handleDeleteClip(idx, clip.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 italic mb-2 line-clamp-2">{clip.prompt}</p>
                                            <div className="flex gap-2">
                                                {videoUrls.has(clip.id) && <a href={videoUrls.get(clip.id)} download={`${clip.id}.mp4`} className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 hover:bg-slate-700">DOWNLOAD</a>}
                                                <button onClick={() => triggerUpload('video', clip.id)} className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 hover:bg-slate-700">UPLOAD</button>
                                                <button onClick={() => regenerateVideo(clip)} disabled={processing.get(`video_${clip.id}`)} className="px-3 py-1 bg-cyan-900/40 text-cyan-400 text-[10px] rounded border border-cyan-700 hover:bg-cyan-900/60 disabled:opacity-50 flex items-center gap-2">{processing.get(`video_${clip.id}`) ? <Loader size={12} className="animate-spin"/> : <RefreshCw size={12}/>} GENERATE</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {activeTab === 'music' && (
                        <div 
                            onDragOver={(e) => handleDragOver(e, 'music_drop')}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, 'music', 'bgm')}
                            className={`bg-slate-900/30 border rounded p-6 transition-all ${dragOverId === 'music_drop' ? 'bg-cyan-900/30 border-cyan-400' : 'border-slate-800'}`}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Soundtrack</h3>
                            {musicUrl && <audio key={musicUrl} controls src={musicUrl} className="w-full mb-6" />}
                            <div className="flex gap-4">
                                <button onClick={regenerateMusic} className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded hover:border-cyan-500">REGENERATE PROCEDURAL</button>
                                <button onClick={() => triggerUpload('music', 'bgm')} className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded hover:border-cyan-500 flex flex-col items-center justify-center gap-2"><Upload size={24} /><span className="text-xs font-bold">UPLOAD CUSTOM</span></button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Timeline Panel */}
                <div 
                    className={`absolute bottom-0 left-0 w-full bg-[#080808] border-t border-slate-700 flex flex-col z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out overflow-hidden`}
                    style={{ height: isTimelineCollapsed ? '40px' : '256px' }}
                >
                    <div className="h-10 bg-slate-900 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
                        {/* LEFT: Playback Controls */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded border border-slate-700">
                                <button onClick={handlePrevStep} className="p-1 hover:text-white text-slate-400" title="Previous Lesson"><SkipBack size={16}/></button>
                                <button onClick={onTogglePlay} className="p-1 hover:text-cyan-400 text-white mx-1" title={isPlaying ? "Pause" : "Play"}>
                                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </button>
                                <button onClick={handleNextStep} className="p-1 hover:text-white text-slate-400" title="Next Lesson"><SkipForward size={16}/></button>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 border-l border-slate-700 pl-4">
                                <MoveHorizontal size={12} />
                                <span>TIME</span>
                                <span className="text-cyan-500">
                                    {new Date(currentGlobalTime * 1000).toISOString().substr(14, 5)} / {new Date(totalDuration * 1000).toISOString().substr(14, 5)}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Zoom & Collapse Controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                                <ZoomOut size={12} className="text-slate-500" />
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    value={zoomLevel} 
                                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                                    className="w-24 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <ZoomIn size={12} className="text-slate-500" />
                            </div>
                            <span className="text-[10px] w-8 text-center font-mono text-slate-500">{zoomLevel}px</span>
                            
                            <button 
                                onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
                                className="p-1 hover:text-white text-slate-400 border border-slate-700 rounded bg-slate-800/50"
                            >
                                {isTimelineCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Tracks Area */}
                    <div ref={timelineRef} className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#050505] scrollbar-thin cursor-crosshair" onClick={handleTimelineClick}>
                        <div style={{ width: `${totalDuration * zoomLevel}px`, height: '100%', position: 'relative' }}>
                            <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none transition-all duration-75" style={{ left: `${currentGlobalTime * zoomLevel}px` }}><div className="w-3 h-3 bg-red-500 rotate-45 -ml-[5px] -mt-1.5"></div></div>
                            {/* Tracks Visualization */}
                            <div className="h-8 border-b border-slate-800 relative bg-slate-900/20">{timelineData.map((step, i) => (<div key={i} className={`absolute top-0 h-full border-r border-slate-700/50 flex items-center px-2 overflow-hidden whitespace-nowrap text-[10px] font-mono transition-colors ${i === currentStepIndex ? 'bg-cyan-900/30 text-cyan-300' : 'text-slate-600 hover:bg-slate-800'}`} style={{ left: step.start * zoomLevel, width: step.duration * zoomLevel }} title={step.title}><span className="font-bold mr-2">{i}.</span> {step.title}</div>))}</div>
                            <div className="h-8 border-b border-slate-800 relative bg-slate-900/20">{timelineData.map((step) => step.videoScript?.map((clip, j) => { const clipStart = step.start + (step.duration * (clip.at / 100)); return (<div key={`${step.idx}_vid_${j}`} className="absolute top-1 h-6 bg-emerald-900/30 border border-emerald-700/50 rounded flex items-center px-2 text-[9px] text-emerald-400 overflow-hidden whitespace-nowrap" style={{ left: clipStart * zoomLevel, width: 10 * zoomLevel }}><Film size={10} className="mr-1" /> {clip.id}</div>) }))}</div>
                            <div className="absolute bottom-0 w-full h-4 border-t border-slate-800 flex items-end">{Array.from({ length: Math.ceil(totalDuration / 5) }).map((_, i) => (<div key={i} className="absolute bottom-0 h-2 border-l border-slate-600 text-[8px] text-slate-500 pl-1" style={{ left: (i * 5) * zoomLevel }}>{i * 5}s</div>))}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="h-8 bg-[#050505] border-t border-slate-800 flex items-center justify-between px-6 z-20 shrink-0">
             <div className="flex items-center gap-6 text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-2"><HardDrive size={12} className="text-cyan-600" /><span>STORAGE: <span className="text-cyan-400">{storageSize}</span></span></div>
                <div className="flex items-center gap-2"><FileAudio size={12} className="text-purple-600" /><span>LAST SAVED: <span className="text-purple-400">{lastSaved}</span></span></div>
            </div>
            <button onClick={handleSaveSession} className="flex items-center gap-2 px-3 py-0.5 bg-cyan-900/20 text-cyan-400 border border-cyan-800 rounded hover:bg-cyan-900/40 transition-colors text-[9px] font-bold uppercase tracking-widest"><Save size={10} /> Save State</button>
        </div>
      </div>
    </div>
  );
};