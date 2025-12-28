import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Particle, Interaction, SimulationConfig, Vector2, ScriptedEvent } from '../types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface SimulationCanvasProps {
  particles: Particle[];
  config: SimulationConfig;
  onUpdate: (particles: Particle[], interactions: Interaction[], energy: { pred: number; pos: number; historyError?: number }) => void;
  onSelectParticle: (p: Particle | null) => void;
  isRunning: boolean;
  interactionMode: 'drag' | 'perturb';
  zoom: number;
  pan: Vector2;
  onPan: (p: Vector2) => void;
  playbackProgress?: number; 
  script?: ScriptedEvent[]; 
  onScriptTrigger?: (event: ScriptedEvent) => void; 
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  particles: initialParticles,
  config,
  onUpdate,
  onSelectParticle,
  isRunning,
  interactionMode,
  zoom,
  pan,
  onPan,
  playbackProgress = 0,
  script = [],
  onScriptTrigger
}) => {
  const [particles, setParticles] = useState<Particle[]>(initialParticles);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [wavefronts, setWavefronts] = useState<{x:number, y:number, r:number, life:number}[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [resetAnim, setResetAnim] = useState<{
    active: boolean;
    start: Particle[];
    target: Particle[];
    startTime: number;
  } | null>(null);

  const requestRef = useRef<number>(0);
  const draggingId = useRef<number | null>(null);
  const mousePosRef = useRef<Vector2>({ x: 0, y: 0 }); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef<boolean>(false);
  const particlesRef = useRef(particles);
  const panStartRef = useRef<Vector2 | null>(null);
  const simFrameRef = useRef(0);
  
  // Track triggered script events
  const triggeredEventsRef = useRef<Set<number>>(new Set());
  const prevProgressRef = useRef(0);

  // Reset triggers when script changes
  useEffect(() => {
      triggeredEventsRef.current.clear();
      prevProgressRef.current = 0;
      setWavefronts([]);
  }, [script]);

  // Handle Script Triggers
  useEffect(() => {
      const currentP = playbackProgress;
      const prevP = prevProgressRef.current;
      
      if (currentP < prevP) { 
          script.forEach((evt, idx) => { if (evt.at > currentP) triggeredEventsRef.current.delete(idx); });
      }

      script.forEach((evt, idx) => {
          if (currentP >= evt.at && prevP < evt.at && !triggeredEventsRef.current.has(idx)) {
              triggeredEventsRef.current.add(idx);
              
              // Event Handling
              if (onScriptTrigger && ['setTab', 'zoom', 'pan', 'reset'].includes(evt.type)) {
                  onScriptTrigger(evt);
              }
              
              // Internal Visual Triggers
              if (evt.type === 'pulse' || evt.type === 'spawn') {
                  // Add visual ripple
                  let targets = particlesRef.current;
                  if (evt.targetId === 'center') targets = [particlesRef.current[0]];
                  else if (typeof evt.targetId === 'number') targets = particlesRef.current.filter(p => p.id === evt.targetId);
                  
                  const newWaves = targets.map(p => ({ x: p.pos.x, y: p.pos.y, r: 10, life: 1.0 }));
                  setWavefronts(prev => [...prev, ...newWaves]);
              }
          }
      });
      prevProgressRef.current = currentP;
  }, [playbackProgress, script, onScriptTrigger]);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { particlesRef.current = particles; }, [particles]);

  // Reset Logic
  useEffect(() => {
    const currentParticles = particlesRef.current;
    // Check if distinct setup
    const isSameScene = currentParticles.length === initialParticles.length && currentParticles.length > 0 && initialParticles.length > 0 && currentParticles[0].id === initialParticles[0].id;
    
    if (isSameScene) {
      setResetAnim({ active: true, start: currentParticles, target: initialParticles, startTime: performance.now() });
    } else {
      setParticles(initialParticles);
      setInteractions([]);
      setResetAnim(null);
      simFrameRef.current = 0;
      setWavefronts([]);
    }
  }, [initialParticles]);

  // --- PHYSICS ENGINE ---
  const calculatePhysics = useCallback(() => {
    if (resetAnim && resetAnim.active) {
       const now = performance.now();
       const duration = 1500;
       const elapsed = now - resetAnim.startTime;
       const t = Math.min(1, elapsed / duration);
       const ease = 1 - Math.pow(1 - t, 4); // Quartic ease out
       if (t >= 1) {
         setResetAnim(null);
         return { particles: resetAnim.target, interactions: [], energy: { pred: 0, pos: 0 } };
       }
       const interpolated = resetAnim.start.map((pStart, i) => {
         const pEnd = resetAnim.target[i] || pStart;
         return { ...pEnd, pos: { x: pStart.pos.x + (pEnd.pos.x - pStart.pos.x) * ease, y: pStart.pos.y + (pEnd.pos.y - pStart.pos.y) * ease } };
       });
       return { particles: interpolated, interactions: [], energy: { pred: 0, pos: 0 } };
    }

    let ps = [...particles];
    const n = ps.length;
    const newInteractions: Interaction[] = [];
    const forces: Vector2[] = new Array(n).fill(null).map(() => ({x: 0, y: 0}));
    const phaseDeltas: number[] = new Array(n).fill(0);
    
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    // Process Scripted Forces
    const activeEvents = script.filter(evt => {
        const end = evt.at + (evt.duration || 10);
        return playbackProgress >= evt.at && playbackProgress < end;
    });

    activeEvents.forEach(evt => {
        let targets: number[] = [];
        if (evt.targetId === 'all') targets = ps.map(p => p.id);
        else if (evt.targetId === 'center') targets = [0]; 
        else if (typeof evt.targetId === 'number') targets = [evt.targetId];

        targets.forEach(tid => {
            const p = ps.find(part => part.id === tid);
            if (!p) return;
            const idx = ps.indexOf(p);
            
            if (evt.type === 'force' && evt.vector) {
                forces[idx].x += evt.vector.x * 0.5; 
                forces[idx].y += evt.vector.y * 0.5;
            } else if (evt.type === 'rotate') {
                // Apply tangential force relative to center
                const dx = p.pos.x - cx;
                const dy = p.pos.y - cy;
                // Tangent is (-dy, dx)
                forces[idx].x += -dy * 0.05;
                forces[idx].y += dx * 0.05;
            }
        });
    });

    // Pairwise Interactions
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const p1 = ps[i];
            const p2 = ps[j];
            const dx = p1.pos.x - p2.pos.x;
            const dy = p1.pos.y - p2.pos.y;
            const d2 = dx*dx + dy*dy;
            const d = Math.sqrt(d2);

            const spatialDecay = Math.exp(-d2 / (config.sigma * config.sigma));
            const spinFactor = config.spinEnabled ? (1 + 4.0 * p1.spin * p2.spin) : 1.0;
            
            let phaseFactor = 1.0;
            if (config.phaseEnabled) {
                // Kuramoto Coupling
                const deltaPhi = p2.phase - p1.phase;
                const syncStrength = 0.05 * spatialDecay; // Reduced strength for stability
                phaseDeltas[i] += syncStrength * Math.sin(deltaPhi);
                phaseDeltas[j] -= syncStrength * Math.sin(deltaPhi);
                // Opacity coupling visual only
                phaseFactor = 0.5 * (1 + Math.cos(deltaPhi)); 
            }

            // Only calculate physical forces if coupling is strong enough
            const coupling = spatialDecay * Math.abs(spinFactor);

            if (coupling > 0.1 && config.couplingEnabled) {
                newInteractions.push({ p1: p1.id, p2: p2.id, strength: 1.0, distance: d, coupling: coupling * phaseFactor });
                
                // Spring Force
                const targetDist = config.r0;
                const displacement = d - targetDist;
                
                // Spin Repulsion: If anti-aligned, targetDist increases
                let effectiveTarget = targetDist;
                let effectiveK = config.k;

                if (config.spinEnabled && spinFactor < 0) {
                     effectiveK *= -0.5; // Repulsive
                }

                let forceMag = -effectiveK * displacement;
                
                const unitX = dx / d;
                const unitY = dy / d;
                
                forces[i].x += forceMag * unitX;
                forces[i].y += forceMag * unitY;
                forces[j].x -= forceMag * unitX;
                forces[j].y -= forceMag * unitY;
            }
        }
    }

    simFrameRef.current++;
    const currentFrame = simFrameRef.current;

    // Particle Update
    const nextParticles = ps.map((p, i) => {
        let scale = p.scale || 1.0;
        let visible = p.visible !== undefined ? p.visible : true;
        let shakeX = 0;
        let shakeY = 0;

        activeEvents.forEach(evt => {
            const isTarget = evt.targetId === 'all' || evt.targetId === p.id || (evt.targetId === 'center' && i === 0);
            if (isTarget) {
                const duration = evt.duration || 10;
                const localT = Math.max(0, Math.min(1, (playbackProgress - evt.at) / duration));

                if (evt.type === 'spawn') {
                    visible = true;
                    scale = Math.min(1.0, localT * 2);
                }
                if (evt.type === 'pulse') scale = 1.0 + Math.sin(localT * Math.PI) * 0.5;
                if (evt.type === 'highlight') {
                    scale = 1.2;
                }
                if (evt.type === 'shake') {
                    const intensity = 5.0;
                    shakeX = (Math.random() - 0.5) * intensity;
                    shakeY = (Math.random() - 0.5) * intensity;
                }
            }
        });

        if (p.isFixed) return { ...p, scale, visible };

        // Damping and Noise
        let newVelX = p.vel.x * config.damping + forces[i].x + shakeX;
        let newVelY = p.vel.y * config.damping + forces[i].y + shakeY;
        
        // Add random thermal noise
        newVelX += (Math.random() - 0.5) * config.temperature;
        newVelY += (Math.random() - 0.5) * config.temperature;

        // Velocity Cap
        const speed = Math.sqrt(newVelX*newVelX + newVelY*newVelY);
        if (speed > 8.0) {
            newVelX = (newVelX/speed) * 8.0;
            newVelY = (newVelY/speed) * 8.0;
        }

        let newPhase = p.phase;
        if (config.phaseEnabled) {
            newPhase += p.phaseVel + phaseDeltas[i];
            newPhase = newPhase % (Math.PI * 2);
        }

        let nextX = p.pos.x + newVelX;
        let nextY = p.pos.y + newVelY;

        // Soft Boundaries
        const margin = 50;
        if (nextX < -margin) newVelX += 0.5;
        if (nextX > CANVAS_WIDTH + margin) newVelX -= 0.5;
        if (nextY < -margin) newVelY += 0.5;
        if (nextY > CANVAS_HEIGHT + margin) newVelY -= 0.5;

        // Return to 1.0 scale if not manipulated
        if (scale > 1.01) scale *= 0.95;
        if (scale < 0.99) scale += 0.05;

        return { ...p, pos: { x: nextX, y: nextY }, vel: { x: newVelX, y: newVelY }, phase: newPhase, scale, visible };
    });

    // Update Wavefronts
    setWavefronts(prev => prev.map(w => ({...w, r: w.r + 5, life: w.life - 0.02})).filter(w => w.life > 0));

    return { particles: nextParticles, interactions: newInteractions, energy: { pred: 0, pos: 0 } };
  }, [particles, config, resetAnim, playbackProgress, script]);

  const animate = useCallback(() => {
    if (!isRunning && (!resetAnim || !resetAnim.active)) return;
    const result = calculatePhysics();
    setParticles(result.particles);
    setInteractions(result.interactions);
    onUpdate(result.particles, result.interactions, result.energy);
    requestRef.current = requestAnimationFrame(animate);
  }, [isRunning, calculatePhysics, onUpdate, resetAnim]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  // --- CANVAS RENDERER ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerSize.width === 0 || containerSize.height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize
    if (canvas.width !== containerSize.width || canvas.height !== containerSize.height) {
        canvas.width = containerSize.width;
        canvas.height = containerSize.height;
    }

    // Clear & Trail
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Camera Transform
    const vbW = CANVAS_WIDTH / zoom;
    const vbH = CANVAS_HEIGHT / zoom;
    const vbX = (CANVAS_WIDTH - vbW) / 2 + pan.x;
    const vbY = (CANVAS_HEIGHT - vbH) / 2 + pan.y;
    const scale = Math.min(containerSize.width / vbW, containerSize.height / vbH);
    const tx = (containerSize.width - vbW * scale) / 2;
    const ty = (containerSize.height - vbH * scale) / 2;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
    ctx.translate(-vbX, -vbY);

    // Dynamic Grid Background
    ctx.strokeStyle = '#0f172a'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridSize = 100;
    const offset = (Date.now() / 50) % gridSize; // Moving grid for flow effect
    for(let x=-gridSize; x<=CANVAS_WIDTH+gridSize; x+=gridSize) { 
        ctx.moveTo(x, -gridSize); ctx.lineTo(x, CANVAS_HEIGHT+gridSize); 
    }
    for(let y=-gridSize; y<=CANVAS_HEIGHT+gridSize; y+=gridSize) { 
        ctx.moveTo(-gridSize, y); ctx.lineTo(CANVAS_WIDTH+gridSize, y); 
    }
    ctx.stroke();

    // Draw Interactions (Springs)
    interactions.forEach(int => {
        const p1 = particles.find(p => p.id === int.p1);
        const p2 = particles.find(p => p.id === int.p2);
        
        if (p1 && p2 && p1.visible !== false && p2.visible !== false) {
             const opacity = Math.min(1, int.coupling);
             ctx.beginPath();
             ctx.moveTo(p1.pos.x, p1.pos.y);
             ctx.lineTo(p2.pos.x, p2.pos.y);
             
             if (config.spinEnabled) {
                 const aligned = (p1.spin * p2.spin) > 0;
                 ctx.strokeStyle = aligned ? COLORS.green : COLORS.red;
                 ctx.lineWidth = aligned ? 2 : 1;
                 ctx.setLineDash(aligned ? [] : [5, 5]);
                 ctx.globalAlpha = opacity * 0.8;
             } else {
                 ctx.strokeStyle = p1.color; 
                 ctx.lineWidth = 1;
                 ctx.setLineDash([]);
                 ctx.globalAlpha = opacity * 0.3;
             }
             ctx.stroke();
        }
    });

    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);

    // Draw Particles
    particles.forEach(p => {
        if (p.visible === false) return;
        const currentScale = p.scale || 1.0;
        const radius = 8 * currentScale;

        // PHASE VISUALIZATION: Pulse Opacity/Brightness
        let alpha = 1.0;
        if (config.phaseEnabled) {
            // Sine wave pulse based on phase
            alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(p.phase));
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        
        // Glow
        ctx.shadowBlur = 15 * currentScale * alpha;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner Core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Scripted Label/Tooltip
        script.forEach(evt => {
            const end = evt.at + (evt.duration || 10);
            if (playbackProgress >= evt.at && playbackProgress < end) {
                const isActive = evt.targetId === p.id || (evt.targetId === 'all') || (evt.targetId === 'center' && p.id === 0);
                if (isActive && evt.label) {
                    ctx.save();
                    ctx.globalAlpha = 1.0;
                    ctx.strokeStyle = COLORS.blue;
                    ctx.lineWidth = 1;
                    
                    // Sci-Fi Bracket
                    const s = 30;
                    ctx.beginPath();
                    ctx.moveTo(p.pos.x - s, p.pos.y - s);
                    ctx.lineTo(p.pos.x - s, p.pos.y + s);
                    ctx.moveTo(p.pos.x + s, p.pos.y - s);
                    ctx.lineTo(p.pos.x + s, p.pos.y + s);
                    ctx.stroke();

                    // Text
                    ctx.font = "12px 'Orbitron'";
                    ctx.fillStyle = COLORS.blue;
                    ctx.textAlign = "center";
                    ctx.fillText(evt.label, p.pos.x, p.pos.y - s - 10);
                    ctx.restore();
                }
            }
        });
    });

    // Draw Wavefronts (Ripples)
    ctx.lineWidth = 2;
    wavefronts.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(6, 182, 212, ${w.life})`; // Cyan
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.restore();
  }, [particles, interactions, zoom, pan, containerSize, hoveredId, playbackProgress, script, wavefronts]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair select-none">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};