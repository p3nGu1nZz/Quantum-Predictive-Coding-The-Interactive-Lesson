import React, { useState, useRef } from 'react';
import { LessonStep } from '../types';
import { Download, FileCode, FileText, X, Loader, Music, Terminal, Play, FileType, Presentation } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import PptxGenJS from 'pptxgenjs';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonSteps: LessonStep[];
  fetchAudioForStep: (step: LessonStep) => Promise<ArrayBuffer | undefined>;
}

// --- UTILS: AUDIO BUFFER TO WAV ---
const bufferToWav = (ab: AudioBuffer) => {
  const numOfChan = ab.numberOfChannels;
  const length = ab.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + ab.length * numOfChan * 2, true);
  writeString(view, 8, 'WAVE');

  // write fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, ab.sampleRate, true);
  view.setUint32(28, ab.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);

  // write data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, ab.length * numOfChan * 2, true);

  // write the PCM samples
  for (i = 0; i < ab.numberOfChannels; i++) {
    channels.push(ab.getChannelData(i));
  }

  offset = 44;
  while (pos < ab.length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const htmlToMarkdown = (html: string) => {
  let md = html;
  md = md.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n### $1\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');
  md = md.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');
  md = md.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<span class="katex"[^>]*>.*?<annotation encoding="application\/x-tex">(.*?)<\/annotation>.*?<\/span>/gi, '$$$1$$');
  md = md.replace(/<div class=".*?MathBlock.*?".*?>(.*?)<\/div>/gi, (match, content) => {
       const texMatch = match.match(/<annotation encoding="application\/x-tex">(.*?)<\/annotation>/);
       return texMatch ? `\n$$$\n${texMatch[1]}\n$$$\n` : '\n[Math Formula]\n';
  });
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  return md.trim();
};

const cleanTextForSlide = (html: string) => {
    let text = html;
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<span class="katex"[^>]*>.*?<annotation encoding="application\/x-tex">(.*?)<\/annotation>.*?<\/span>/gi, ' $1 ');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, lessonSteps, fetchAudioForStep }) => {
  const [downloadingStepId, setDownloadingStepId] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  // Store generated blobs temporarily so we don't re-fetch when clicking download
  const [generatedAudioBlobs, setGeneratedAudioBlobs] = useState<Map<number, Blob>>(new Map());
  const [status, setStatus] = useState('');
  
  const abortBatchRef = useRef(false);

  if (!isOpen) return null;

  // --- DOWNLOAD HELPERS ---

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

       // Decode raw -> AudioBuffer -> WAV Blob
       const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
       const bufferCopy = rawBuffer.slice(0);
       const dataInt16 = new Int16Array(bufferCopy);
       const frameCount = dataInt16.length; 
       const audioBuffer = tempCtx.createBuffer(1, frameCount, 24000);
       const channelData = audioBuffer.getChannelData(0);
       for (let i = 0; i < frameCount; i++) {
           channelData[i] = dataInt16[i] / 32768.0;
       }
       return bufferToWav(audioBuffer);
  };

  // --- HANDLERS ---

  const handleDownloadWav = async (stepIndex: number) => {
      const step = lessonSteps[stepIndex];
      if (!step.narration) return;

      // Use cached if available
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
      } catch (e) {
          console.error(e);
          setStatus('Error generating audio');
      } finally {
          setDownloadingStepId(null);
      }
  };

  const handleDownloadTranscript = (stepIndex: number) => {
      const step = lessonSteps[stepIndex];
      if (!step.narration) return;
      const blob = new Blob([step.narration], { type: 'text/plain' });
      downloadBlob(blob, `${getCleanTitle(step, stepIndex)}.txt`);
  };

  const handleBatchGenerate = async () => {
      if (batchProgress) {
          // Cancel mode
          abortBatchRef.current = true;
          return;
      }

      abortBatchRef.current = false;
      let count = 0;
      const total = lessonSteps.filter(s => s.narration).length;
      setBatchProgress({ current: 0, total });
      setStatus('Starting batch generation (with delays to avoid rate limits)...');

      for (let i = 0; i < lessonSteps.length; i++) {
          if (abortBatchRef.current) break;
          
          const step = lessonSteps[i];
          if (!step.narration) continue;

          // If already generated, skip logic but increment count
          if (generatedAudioBlobs.has(i)) {
              count++;
              setBatchProgress({ current: count, total });
              continue;
          }

          try {
              setStatus(`Generating ${i + 1}/${lessonSteps.length}: ${step.title.substring(0, 20)}...`);
              const wavBlob = await processAudioForStep(step);
              
              if (wavBlob) {
                  setGeneratedAudioBlobs(prev => new Map(prev).set(i, wavBlob));
              }

              // CRITICAL: Delay to prevent Rate Limit (429)
              // We pause for 2 seconds between every call
              await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (e) {
              console.error(`Batch error on step ${i}`, e);
          }

          count++;
          setBatchProgress({ current: count, total });
      }

      setStatus(abortBatchRef.current ? 'Batch cancelled.' : 'Batch generation complete. You can now download files.');
      setBatchProgress(null);
      abortBatchRef.current = false;
  };

  const handleExportHTML = () => {
      setStatus('Generating Academic HTML...');
      // IMPORTANT: !DOCTYPE must be on the very first line. No whitespace.
      let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quantum Predictive Coding: Deep Dive Content</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css" />
<style>
    body { font-family: "Times New Roman", Times, serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 20px; color: #1a1a1a; background: #fdfdfd; }
    h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
    .step-container { margin-bottom: 50px; border-bottom: 1px solid #ddd; padding-bottom: 30px; }
    h2 { color: #2c3e50; margin-top: 0; }
    .narration { font-style: italic; color: #555; background: #f0f0f0; padding: 15px; border-left: 4px solid #333; margin: 20px 0; }
    .content { font-size: 1.1em; }
    .math-block { background: #fff; padding: 10px; text-align: center; overflow-x: auto; }
</style>
</head>
<body>
<h1>L-Group Predictive Coding Networks: Course Material</h1>`;

      lessonSteps.forEach(step => {
           const explanationHtml = step.explanation ? ReactDOMServer.renderToStaticMarkup(step.explanation as any) : 'No deep dive content.';
           htmlContent += `
               <div class="step-container">
                   <h2>${step.title}</h2>
                   <div class="narration"><strong>Narration Script:</strong> ${step.narration || 'N/A'}</div>
                   <div class="content">
                       ${explanationHtml}
                   </div>
               </div>
           `;
      });
      htmlContent += '</body></html>';
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      downloadBlob(blob, 'quantum_pcn_paper.html');
      setStatus('HTML Exported.');
  };

  const handleExportMarkdown = () => {
      setStatus('Generating Markdown...');
      let mdContent = `# Quantum Predictive Coding: Course Material\n\n`;
      lessonSteps.forEach(step => {
          mdContent += `## ${step.title}\n\n`;
          if (step.narration) {
              mdContent += `> **Narration**: ${step.narration}\n\n`;
          }
          if (step.explanation) {
             const html = ReactDOMServer.renderToStaticMarkup(step.explanation as any);
             const converted = htmlToMarkdown(html);
             mdContent += `${converted}\n\n---\n\n`;
          }
      });
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      downloadBlob(blob, 'quantum_pcn_content.md');
      setStatus('Markdown Exported.');
  };

  const handleGeneratePPTX = async () => {
      setStatus('Initializing PPTX Generation...');
      try {
          const pptx = new PptxGenJS();
          pptx.layout = 'LAYOUT_16x9';
          pptx.author = 'Quantum PCN System';
          pptx.company = 'L-Group Research';
          pptx.subject = 'Predictive Coding Networks';
          pptx.title = 'L-Group Framework Presentation';

          // Define Master Slide for consistent styling
          pptx.defineSlideMaster({
              title: 'MASTER_SLIDE',
              background: { color: '050505' },
              objects: [
                  { rect: { x: 0, y: '90%', w: '100%', h: '10%', fill: { color: '0a0a0a' } } },
                  { text: { text: 'QUANTUM PCN // L-GROUP FRAMEWORK', options: { x: 0.5, y: '92%', fontSize: 10, color: '475569' } } }
              ]
          });

          // 1. INTRO SLIDE
          let slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
          slide.addText("L-Group Predictive Coding Networks", { 
              x: 0.5, y: '35%', w: '90%', align: 'center', 
              fontSize: 44, color: '06b6d4', bold: true, fontFace: 'Arial' 
          });
          slide.addText("Vibrationally Coupled Particles in Lie Groups", { 
              x: 0.5, y: '50%', w: '90%', align: 'center', 
              fontSize: 24, color: 'e2e8f0', fontFace: 'Arial' 
          });

          // 2. LESSON STEPS
          lessonSteps.forEach((step, index) => {
              setStatus(`Processing Slide ${index + 1}/${lessonSteps.length}...`);
              slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
              
              // Title
              slide.addText(step.title, { 
                  x: 0.5, y: 0.3, w: '90%', fontSize: 28, color: 'facc15', bold: true, fontFace: 'Arial' 
              });

              // Body Content (Extracting text from React Component)
              const contentHtml = ReactDOMServer.renderToStaticMarkup(step.content as any);
              const cleanContent = cleanTextForSlide(contentHtml);
              
              slide.addText(cleanContent, { 
                  x: 0.5, y: 1.2, w: '90%', h: 4.0, fontSize: 18, color: 'e2e8f0', fontFace: 'Arial', valign: 'top' 
              });

              // Add Narration to Speaker Notes
              if (step.narration) {
                  slide.addNotes(step.narration);
              }
          });

          // 3. OUTRO SLIDE
          setStatus('Finalizing Presentation...');
          slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
          slide.addText("SYSTEM ONLINE", { 
              x: 0.5, y: '40%', w: '100%', align: 'center', 
              fontSize: 48, color: '10b981', bold: true, fontFace: 'Arial' 
          });
          slide.addText("Thank you for your attention.", { 
              x: 0.5, y: '55%', w: '100%', align: 'center', 
              fontSize: 20, color: '94a3b8', italic: true, fontFace: 'Arial' 
          });

          // Save
          await pptx.writeFile({ fileName: 'Quantum_PCN_Presentation.pptx' });
          setStatus('PPTX Generated Successfully.');
      } catch (e) {
          console.error("PPTX Generation Error:", e);
          setStatus('Error generating PPTX.');
      }
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
           <button onClick={onClose} className="text-slate-500 hover:text-white">
               <X size={24} />
           </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Col: Actions */}
            <div className="w-full md:w-64 p-6 border-r border-slate-800 bg-black/20 flex flex-col gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Docs</div>
                <button 
                    onClick={handleExportHTML}
                    className="w-full py-3 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-700/50 rounded flex items-center justify-center gap-2 font-mono text-sm transition-all"
                >
                    <FileCode size={16} /> HTML EXPORT
                </button>
                <button 
                    onClick={handleExportMarkdown}
                    className="w-full py-3 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-700/50 rounded flex items-center justify-center gap-2 font-mono text-sm transition-all"
                >
                    <FileText size={16} /> MD EXPORT
                </button>
                <button 
                    onClick={handleGeneratePPTX}
                    className="w-full py-3 bg-orange-900/20 hover:bg-orange-900/40 text-orange-400 border border-orange-700/50 rounded flex items-center justify-center gap-2 font-mono text-sm transition-all"
                >
                    <Presentation size={16} /> PPTX SLIDES
                </button>
                
                <div className="h-px bg-slate-800 my-2"></div>
                
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Audio Batch</div>
                <button 
                    onClick={handleBatchGenerate}
                    className={`w-full py-3 border rounded flex items-center justify-center gap-2 font-mono text-sm transition-all ${
                        batchProgress 
                        ? 'bg-red-900/20 text-red-400 border-red-700/50 hover:bg-red-900/40' 
                        : 'bg-yellow-900/20 text-yellow-500 border-yellow-700/50 hover:bg-yellow-900/40'
                    }`}
                >
                    {batchProgress ? <X size={16} /> : <Play size={16} />} 
                    {batchProgress ? 'STOP BATCH' : 'GENERATE ALL'}
                </button>
                
                {batchProgress && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                            className="h-full bg-yellow-500 transition-all duration-300" 
                            style={{width: `${(batchProgress.current / batchProgress.total) * 100}%`}} 
                        />
                    </div>
                )}
                <p className="text-[10px] text-slate-600 leading-tight">
                    *Runs sequentially with 2s delay to prevent API rate limits.
                </p>

                <div className="mt-auto text-[10px] text-slate-600 font-mono">
                    System Version: 2.1.2<br/>
                    Build: RAWSON_CORE
                </div>
            </div>

            {/* Right Col: Audio List */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/10">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm">
                        <Music size={16} /> Audio Assets
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        {status || "Ready to process"}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-cyber">
                    {lessonSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded hover:border-cyan-500/30 transition-colors group">
                            <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                                <span className="font-mono text-slate-500 text-xs w-6 text-right shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                                <div className="min-w-0">
                                    <div className="text-slate-200 text-sm font-bold truncate">{step.title}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{step.narration ? `${step.narration.substring(0, 50)}...` : "No Narration"}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Transcript Button */}
                                <button
                                    onClick={() => handleDownloadTranscript(idx)}
                                    disabled={!step.narration}
                                    title="Download Transcript"
                                    className="px-3 py-2 rounded text-xs font-bold font-mono border border-slate-700 bg-slate-800 text-slate-400 hover:bg-blue-900/30 hover:border-blue-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <FileText size={14} /> <span className="hidden sm:inline ml-1">TXT</span>
                                </button>

                                {/* WAV Button */}
                                <button 
                                    onClick={() => handleDownloadWav(idx)}
                                    disabled={!step.narration || downloadingStepId === idx}
                                    className={`px-3 py-2 rounded text-xs font-bold font-mono border flex items-center gap-2 transition-all ${
                                        !step.narration 
                                        ? 'border-transparent text-slate-700 cursor-not-allowed'
                                        : (downloadingStepId === idx)
                                            ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' 
                                            : generatedAudioBlobs.has(idx)
                                                ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/40'
                                                : 'bg-slate-800 border-slate-700 hover:bg-cyan-900/30 hover:border-cyan-500 hover:text-cyan-400 text-slate-400'
                                    }`}
                                >
                                    {downloadingStepId === idx ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                                    <span className="hidden sm:inline">
                                        {downloadingStepId === idx ? '...' : (generatedAudioBlobs.has(idx) ? 'WAV' : 'GEN')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};