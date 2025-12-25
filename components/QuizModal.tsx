import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle, BrainCircuit, SkipForward } from 'lucide-react';
import { COLORS } from '../constants';

interface QuizModalProps {
  questionData: QuizQuestion;
  onComplete: () => void; // Called on Success
  onSkip: () => void;     // Called on Skip (Fail)
}

// Simple particle for the explosion effect
class ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = [COLORS.blue, COLORS.purple, COLORS.yellow, COLORS.green][Math.floor(Math.random() * 4)];
    this.life = 1.0;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.vx *= 0.95; // Friction
    this.vy *= 0.95;
    this.life -= 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

export const QuizModal: React.FC<QuizModalProps> = ({ questionData, onComplete, onSkip }) => {
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationFrameRef = useRef<number>(0);

  // Randomize options on mount
  useEffect(() => {
    const opts = [...questionData.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    setShuffledOptions(opts);
  }, [questionData]);

  const handleSelect = (option: string) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks

    setSelectedAnswer(option);
    const correct = option === questionData.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      triggerExplosion();
      setTimeout(onComplete, 2000); // Wait 2s before proceeding
    }
  };

  const triggerExplosion = () => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    for (let i = 0; i < 100; i++) {
      particlesRef.current.push(new ConfettiParticle(centerX, centerY));
    }
    animateParticles();
  };

  const animateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach((p, index) => {
      p.update();
      p.draw(ctx);
      if (p.life <= 0) {
        particlesRef.current.splice(index, 1);
      }
    });

    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animateParticles);
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  return (
    <div className="absolute inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
      
      <div className="bg-[#080808] border border-cyan-500/50 rounded-xl max-w-2xl w-full p-8 shadow-[0_0_100px_rgba(6,182,212,0.2)] relative z-10 flex flex-col items-center">
        
        <div className="mb-6 flex items-center gap-3 text-cyan-400">
           <BrainCircuit size={40} className="animate-pulse" />
           <h2 className="text-2xl font-bold uppercase tracking-widest cyber-font">Knowledge Verification</h2>
        </div>

        <h3 className="text-xl md:text-2xl text-slate-100 text-center mb-8 font-serif leading-relaxed">
          {questionData.question}
        </h3>

        <div className="w-full space-y-4">
          {shuffledOptions.map((option, idx) => {
            let btnClass = "w-full p-4 rounded border text-left transition-all relative overflow-hidden group ";
            if (selectedAnswer === null) {
              btnClass += "bg-slate-900/50 border-slate-700 hover:border-cyan-500 hover:bg-slate-800 text-slate-300";
            } else if (option === questionData.correctAnswer) {
              btnClass += "bg-emerald-900/40 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
            } else if (option === selectedAnswer) {
              btnClass += "bg-red-900/40 border-red-500 text-red-100";
            } else {
              btnClass += "bg-slate-900/50 border-slate-700 text-slate-500 opacity-50";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={selectedAnswer !== null}
                className={btnClass}
              >
                <span className="font-mono text-sm mr-4 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                <span className="text-lg font-medium">{option}</span>
                {selectedAnswer !== null && option === questionData.correctAnswer && (
                   <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
                {selectedAnswer === option && option !== questionData.correctAnswer && (
                   <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
                )}
              </button>
            );
          })}
        </div>

        {isCorrect === false && (
          <div className="mt-6 text-red-400 font-bold animate-pulse text-center">
             Incorrect. Reviewing protocols...
             <button onClick={onSkip} className="block mt-2 text-sm text-slate-500 hover:text-white underline mx-auto">Skip Question (Record Failure)</button>
          </div>
        )}
        
        {isCorrect === true && (
             <div className="mt-6 text-emerald-400 font-bold animate-bounce text-center uppercase tracking-widest cyber-font">
                Verification Successful. Proceeding...
             </div>
        )}

        {/* Skip Button (Only show if not answered yet) */}
        {selectedAnswer === null && (
            <button 
                onClick={onSkip}
                className="mt-8 text-slate-500 hover:text-red-400 flex items-center gap-2 text-sm uppercase tracking-widest transition-colors"
            >
                <SkipForward size={16} /> Skip Verification (Penalty)
            </button>
        )}

      </div>
    </div>
  );
};