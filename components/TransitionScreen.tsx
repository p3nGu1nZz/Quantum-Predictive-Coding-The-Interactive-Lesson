import React, { useEffect, useState, useRef } from 'react';
import { MatrixBackground } from './MatrixBackground';
import { Loader, Database, Cpu, Network, CheckCircle2 } from 'lucide-react';

interface TransitionScreenProps {
  isVisible: boolean;
  lessonNumber: number;
  title: string;
}

export const TransitionScreen: React.FC<TransitionScreenProps> = ({ isVisible, lessonNumber, title }) => {
  const [showContent, setShowContent] = useState(false);
  const [decodedTitle, setDecodedTitle] = useState("");
  const [loadPercent, setLoadPercent] = useState(0);
  const [sysMsg, setSysMsg] = useState("INITIALIZING");
  const [sysIcon, setSysIcon] = useState<React.ReactNode>(<Loader className="animate-spin" size={14} />);
  const frameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isVisible) {
      setLoadPercent(0);
      setSysMsg("INITIALIZING SEQUENCE");
      setSysIcon(<Loader className="animate-spin" size={14} />);
      
      const timer = setTimeout(() => setShowContent(true), 50);
      
      const seq = [
          { t: 500, msg: "SAVING LOCAL STATE", icon: <Database className="animate-pulse" size={14} /> },
          { t: 1500, msg: "FLUSHING MEMORY BUFFERS", icon: <Cpu className="animate-pulse" size={14} /> },
          { t: 2500, msg: `LOADING MODULE ${lessonNumber.toString().padStart(2, '0')}`, icon: <Network className="animate-pulse" size={14} /> },
          { t: 3800, msg: "CALIBRATING PHYSICS ENGINE", icon: <Loader className="animate-spin" size={14} /> },
          { t: 4400, msg: "SYSTEM READY", icon: <CheckCircle2 className="text-emerald-500" size={14} /> }
      ];

      const timeouts = seq.map(s => setTimeout(() => {
          setSysMsg(s.msg);
          setSysIcon(s.icon);
      }, s.t));

      return () => {
          clearTimeout(timer);
          timeouts.forEach(clearTimeout);
      };
    } else {
      setShowContent(false);
      setDecodedTitle("");
    }
  }, [isVisible, lessonNumber]);

  useEffect(() => {
      if (!isVisible) return;
      const updateInterval = 30; 
      const totalDuration = 4400; 
      const increment = 100 / (totalDuration / updateInterval);
      const interval = setInterval(() => {
          setLoadPercent(prev => (prev >= 100 ? 100 : prev + increment));
      }, updateInterval);
      return () => clearInterval(interval);
  }, [isVisible]);

  // Particle System
  useEffect(() => {
      if (!isVisible || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: {x: number, y: number, z: number, speed: number}[] = [];
      const particleCount = 200;

      for (let i = 0; i < particleCount; i++) {
          particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              z: Math.random() * 2 + 0.5,
              speed: Math.random() * 2 + 1
          });
      }

      let animId = 0;
      const render = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#06b6d4'; // Cyan
          
          particles.forEach(p => {
              p.x -= p.speed * (p.z); // Move left
              if (p.x < 0) {
                  p.x = canvas.width;
                  p.y = Math.random() * canvas.height;
              }
              
              const alpha = (p.z / 2.5) * 0.5;
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.z, 0, Math.PI * 2);
              ctx.fill();
          });
          
          animId = requestAnimationFrame(render);
      };
      render();

      return () => cancelAnimationFrame(animId);
  }, [isVisible]);

  // Matrix-style Text Decoder
  useEffect(() => {
    if (!showContent) return;
    
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#%&";
    let iteration = 0;
    
    const animateText = () => {
        const result = title.split("").map((char, index) => {
            if (index < iteration) return char;
            return characters[Math.floor(Math.random() * characters.length)];
        }).join("");
        
        setDecodedTitle(result);
        
        if (iteration < title.length) {
            iteration += 0.3; // Slower decode speed
            frameRef.current = requestAnimationFrame(animateText);
        }
    };
    
    animateText();
    return () => cancelAnimationFrame(frameRef.current);

  }, [showContent, title]);

  return (
    <div 
      className={`fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center transition-opacity duration-500 pointer-events-none overflow-hidden ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <MatrixBackground />
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-50" />
      
      {/* Cinematic Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl p-10">
        
        {/* Lesson Number Large */}
        <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-bold text-slate-900/40 cyber-font tracking-tighter transition-all duration-1000 transform ${showContent ? 'scale-100 opacity-100' : 'scale-125 opacity-0'}`}
        >
            {lessonNumber === 0 ? "INTR" : lessonNumber.toString().padStart(2, '0')}
        </div>

        {/* Main Content */}
        <div className="relative z-20 text-center flex flex-col items-center">
            {/* System Status Pill */}
            <div className={`flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-[0.2em] mb-8 bg-cyan-950/30 border border-cyan-900/50 px-4 py-1 rounded-full backdrop-blur-md transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {sysIcon}
                <span>{sysMsg}</span>
            </div>

            <div className="h-24 flex items-center justify-center">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 cyber-font text-center shadow-cyan-500/50 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-opacity duration-1000 ease-in-out">
                    {decodedTitle || title}
                </h1>
            </div>

            {/* Progress Bar */}
            <div className={`mt-12 w-64 md:w-96 h-1 bg-slate-900 rounded-full overflow-hidden transition-all duration-700 delay-200 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <div 
                    className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee] transition-all duration-100 ease-linear"
                    style={{ width: `${loadPercent}%` }}
                />
            </div>
            
            <div className={`mt-2 flex justify-between w-64 md:w-96 text-[10px] font-mono text-slate-500 transition-opacity duration-500 delay-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                <span>SYS_LOAD</span>
                <span>{Math.floor(loadPercent)}%</span>
            </div>
        </div>

      </div>
    </div>
  );
};