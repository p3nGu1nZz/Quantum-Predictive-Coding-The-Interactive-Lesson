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
  playbackProgress?: number; // 0-100 from audio
  script?: ScriptedEvent[]; // Timed events
  onScriptTrigger?: (event: ScriptedEvent) => void; // Bubbles up one-time events like Tabs/Zoom
}

// Box-Muller transform for Gaussian noise distribution
const gaussianRandom = () => {
  const u = 1 - Math.random(); 
  const v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

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
  const [mouseCanvasPos, setMouseCanvasPos] = useState<Vector2>({x: 0, y: 0});
  
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
  const interactionsRef = useRef(interactions); 
  const panStartRef = useRef<Vector2 | null>(null);
  
  const simFrameRef = useRef(0);
  
  // Track triggered script events to prevent duplicates
  const triggeredEventsRef = useRef<Set<number>>(new Set());
  const prevProgressRef = useRef(0);

  // Reset triggers when script changes
  useEffect(() => {
      triggeredEventsRef.current.clear();
      prevProgressRef.current = 0;
  }, [script]);

  // Handle One-Time Script Triggers
  useEffect(() => {
      if (!onScriptTrigger) return;
      
      const currentP = playbackProgress;
      const prevP = prevProgressRef.current;
      
      // If we seeked backwards, reset future triggers
      if (currentP < prevP) {
          script.forEach((evt, idx) => {
              if (evt.at > currentP) triggeredEventsRef.current.delete(idx);
          });
      }

      script.forEach((evt, idx) => {
          // Check if we just crossed the threshold
          if (currentP >= evt.at && prevP < evt.at && !triggeredEventsRef.current.has(idx)) {
              // Only fire "action" types, continuous types (highlight/force) are handled in render loop
              if (['setTab', 'zoom', 'pan', 'reset'].includes(evt.type)) {
                  onScriptTrigger(evt);
                  triggeredEventsRef.current.add(idx);
              }
          }
      });
      prevProgressRef.current = currentP;
  }, [playbackProgress, script, onScriptTrigger]);


  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
         setContainerSize({
             width: entry.contentRect.width,
             height: entry.contentRect.height
         });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  useEffect(() => {
      interactionsRef.current = interactions;
  }, [interactions]);

  // Reset Logic
  useEffect(() => {
    const currentParticles = particlesRef.current;
    const isSameScene = currentParticles.length === initialParticles.length && 
                        currentParticles.length > 0 && 
                        initialParticles.length > 0 &&
                        currentParticles[0].id === initialParticles[0].id;

    if (isSameScene) {
      setResetAnim({
        active: true,
        start: currentParticles,
        target: initialParticles,
        startTime: performance.now()
      });
    } else {
      setParticles(initialParticles);
      setInteractions([]);
      setResetAnim(null);
      simFrameRef.current = 0;
    }
  }, [initialParticles]);

  // --- PHYSICS ENGINE ---
  const calculatePhysics = useCallback(() => {
    if (resetAnim && resetAnim.active) {
       const now = performance.now();
       const duration = 1000;
       const elapsed = now - resetAnim.startTime;
       const t = Math.min(1, elapsed / duration);
       const ease = 1 - Math.pow(1 - t, 3);

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
    let totalPredEnergy = 0;
    let totalPosEnergy = 0;
    const newInteractions: Interaction[] = [];
    const forces: Vector2[] = new Array(n).fill(null).map(() => ({x: 0, y: 0}));
    const phaseDeltas: number[] = new Array(n).fill(0);
    
    // Scripted Forces (Continuous)
    const activeEvents = script.filter(evt => {
        const end = evt.at + (evt.duration || 10);
        return playbackProgress >= evt.at && playbackProgress < end;
    });

    activeEvents.forEach(evt => {
        if (evt.type === 'force' && evt.vector) {
            let targets: number[] = [];
            if (evt.targetId === 'all') targets = ps.map(p => p.id);
            else if (evt.targetId === 'center') targets = [0]; 
            else if (typeof evt.targetId === 'number') targets = [evt.targetId];
            else targets = [0, 1, 2]; 

            targets.forEach(tid => {
                if (forces[tid]) {
                    forces[tid].x += evt.vector!.x * 2; 
                    forces[tid].y += evt.vector!.y * 2;
                }
            });
        }
    });

    // Compute Forces & Phase Coupling
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const p1 = ps[i];
            const p2 = ps[j];
            const dx = p1.pos.x - p2.pos.x;
            const dy = p1.pos.y - p2.pos.y;
            const d2 = dx*dx + dy*dy;
            const d = Math.sqrt(d2);

            // Spatial decay (Eq 14/26 in paper)
            const spatialDecay = Math.exp(-d2 / (config.sigma * config.sigma));
            
            // Spin Modulation (Eq 18: M(si, sj) = 1 + gamma * si * sj)
            // We use gamma = 4.0 to make it impactful visually
            const spinFactor = config.spinEnabled 
                ? (1 + 4.0 * p1.spin * p2.spin) 
                : 1.0;

            // Phase Synchronization (Kuramoto-like)
            let phaseFactor = 1.0;
            if (config.phaseEnabled) {
                const deltaPhi = p2.phase - p1.phase;
                phaseFactor = 0.5 * (1 + Math.cos(deltaPhi)); // Value between 0 and 1
                
                // Add to phase velocity (Kuramoto sync)
                // dphi/dt = omega + K * sum(sin(phi_j - phi_i))
                const syncStrength = 0.1 * spatialDecay;
                phaseDeltas[i] += syncStrength * Math.sin(deltaPhi);
                phaseDeltas[j] -= syncStrength * Math.sin(deltaPhi);
            }

            const coupling = Math.max(0, spatialDecay * spinFactor * phaseFactor);

            if (coupling > 0.01) {
                newInteractions.push({ p1: p1.id, p2: p2.id, strength: 1.0, distance: d, coupling });
                
                // Spring Force (Eq 4)
                // F = -k * (d - r0) * direction
                // However, we modulate the stiffness 'k' effectively by the coupling strength in this simplified model
                // or we can treat 'coupling' as the probability of interaction.
                // To keep it physically stable, we apply the force always, but potentially scaled.
                // Here we keep standard Hooke's law for structure, modulated slightly by spin.
                
                // If spin is opposite (spinFactor < 1), they might repel or interact weakly.
                // If spinFactor is negative (strong repulsion), we invert force? 
                // The paper says "repel each other" for opposite spins.
                
                const effectiveK = config.k * (config.spinEnabled ? Math.abs(spinFactor) : 1.0);
                const targetDist = config.r0;
                
                const displacement = d - targetDist;
                
                // Repulsion for opposite spins if they get too close?
                let forceMag = -effectiveK * displacement;
                
                if (config.spinEnabled && spinFactor < 0.5) {
                     // Strong repulsion for opposite spins
                     forceMag = 500 / (d*d + 1); 
                }

                const unitX = dx / d;
                const unitY = dy / d;
                const fx = forceMag * unitX;
                const fy = forceMag * unitY;

                forces[i].x += fx;
                forces[i].y += fy;
                forces[j].x -= fx;
                forces[j].y -= fy;
            }
        }
    }

    simFrameRef.current++;
    const currentFrame = simFrameRef.current;

    const nextParticles = ps.map((p, i) => {
        let scale = 1.0;
        let visible = p.visible !== undefined ? p.visible : true;
        let activationMod = 0;
        let shakeX = 0;
        let shakeY = 0;

        activeEvents.forEach(evt => {
            const isTarget = evt.targetId === 'all' || evt.targetId === p.id || (evt.targetId === 'center' && i === 0);
            if (isTarget) {
                const duration = evt.duration || 10;
                const localT = Math.max(0, Math.min(1, (playbackProgress - evt.at) / duration));

                if (evt.type === 'spawn') {
                    visible = true;
                    if (localT < 1.0) scale = Math.min(1.0, localT * 2);
                }
                if (evt.type === 'pulse') scale = 1.0 + Math.sin(currentFrame * 0.2) * 0.3 * Math.sin(localT * Math.PI);
                if (evt.type === 'highlight') {
                    scale = 1.0 + 0.3 * Math.sin(localT * Math.PI);
                    activationMod += 0.5 * Math.sin(localT * Math.PI); 
                }
                if (evt.type === 'shake') {
                    const intensity = 3.0 * Math.sin(localT * Math.PI);
                    shakeX += (Math.random() - 0.5) * intensity;
                    shakeY += (Math.random() - 0.5) * intensity;
                }
            }
        });

        if (p.id === draggingId.current) {
            let tx = mousePosRef.current.x;
            let ty = mousePosRef.current.y;
            return { ...p, pos: { x: tx, y: ty }, vel: { x: 0, y: 0 }, force: {x:0,y:0}, valVel: 0 };
        }
        if (p.isFixed) return { ...p, scale, visible };

        const noiseX = gaussianRandom() * config.temperature;
        const noiseY = gaussianRandom() * config.temperature;
        
        // Gradient Descent update (Force = -Grad V)
        let newVelX = p.vel.x * config.damping + (forces[i].x * config.eta_r) + noiseX + shakeX;
        let newVelY = p.vel.y * config.damping + (forces[i].y * config.eta_r) + noiseY + shakeY;
        
        // Cap velocity to prevent explosion
        const maxVel = 4.0; 
        const speed = Math.sqrt(newVelX*newVelX + newVelY*newVelY);
        if (speed > maxVel) {
            newVelX = (newVelX / speed) * maxVel;
            newVelY = (newVelY / speed) * maxVel;
        }

        const newVal = Math.min(2.5, p.val + activationMod);
        
        // Phase Update
        let newPhase = p.phase;
        if (config.phaseEnabled) {
            newPhase += p.phaseVel + phaseDeltas[i];
            // Wrap phase
            newPhase = newPhase % (Math.PI * 2);
        }

        let nextX = p.pos.x + newVelX;
        let nextY = p.pos.y + newVelY;

        // Boundaries
        const margin = 15;
        if (nextX < margin) { nextX = margin; newVelX *= -0.8; } 
        else if (nextX > CANVAS_WIDTH - margin) { nextX = CANVAS_WIDTH - margin; newVelX *= -0.8; }
        if (nextY < margin) { nextY = margin; newVelY *= -0.8; } 
        else if (nextY > CANVAS_HEIGHT - margin) { nextY = CANVAS_HEIGHT - margin; newVelY *= -0.8; }

        let currentScale = p.scale || 1.0;
        if (scale !== 1.0) currentScale = scale; 
        else if (currentScale < 1.0) currentScale += 0.05; 

        return {
            ...p,
            pos: { x: nextX, y: nextY },
            vel: { x: newVelX, y: newVelY },
            force: forces[i],
            val: newVal,
            phase: newPhase,
            scale: currentScale,
            visible
        };
    });

    return { particles: nextParticles, interactions: newInteractions, energy: { pred: totalPredEnergy, pos: totalPosEnergy } };
  }, [particles, config, resetAnim, playbackProgress, script]);

  const animate = useCallback(() => {
    if (!isRunning && (!resetAnim || !resetAnim.active) && draggingId.current === null) return;
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

    if (canvas.width !== containerSize.width || canvas.height !== containerSize.height) {
        canvas.width = containerSize.width;
        canvas.height = containerSize.height;
    }

    const vbW = CANVAS_WIDTH / zoom;
    const vbH = CANVAS_HEIGHT / zoom;
    const vbX = (CANVAS_WIDTH - vbW) / 2 + pan.x;
    const vbY = (CANVAS_HEIGHT - vbH) / 2 + pan.y;

    const scaleX = containerSize.width / vbW;
    const scaleY = containerSize.height / vbH;
    const scale = Math.min(scaleX, scaleY);

    const tx = (containerSize.width - vbW * scale) / 2;
    const ty = (containerSize.height - vbH * scale) / 2;

    ctx.fillStyle = '#030303';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
    ctx.translate(-vbX, -vbY);

    ctx.strokeStyle = '#1e293b'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<=CANVAS_WIDTH; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x, CANVAS_HEIGHT); }
    for(let y=0; y<=CANVAS_HEIGHT; y+=40) { ctx.moveTo(0,y); ctx.lineTo(CANVAS_WIDTH, y); }
    ctx.stroke();

    interactions.forEach(int => {
        const p1 = particles.find(p => p.id === int.p1);
        const p2 = particles.find(p => p.id === int.p2);
        
        if (p1 && p2 && p1.visible !== false && p2.visible !== false) {
             const opacity = Math.max(0.1, Math.min(1, int.coupling));
             ctx.beginPath();
             ctx.moveTo(p1.pos.x, p1.pos.y);
             ctx.lineTo(p2.pos.x, p2.pos.y);
             ctx.globalAlpha = opacity * 0.4;
             ctx.strokeStyle = p1.color; 
             ctx.lineWidth = 1;
             ctx.setLineDash([]); // Default solid
             ctx.stroke();

             // --- SPIN INTERACTION VISUAL ---
             if (config.spinEnabled) {
                 const spinProd = p1.spin * p2.spin;
                 const isAligned = spinProd > 0;
                 
                 // Draw a secondary indicator line on top
                 ctx.beginPath();
                 ctx.moveTo(p1.pos.x, p1.pos.y);
                 ctx.lineTo(p2.pos.x, p2.pos.y);
                 ctx.globalAlpha = opacity * 0.8; // More visible
                 
                 if (isAligned) {
                     // Attraction/Alignment: Bright, Thick, Dashed (Green/Cyan)
                     ctx.strokeStyle = p1.spin > 0 ? COLORS.green : COLORS.teal;
                     ctx.lineWidth = 2;
                     ctx.setLineDash([5, 5]); // Clean dashes
                 } else {
                     // Repulsion/Anti-alignment: Dim, Thin, Dotted (Orange/Red)
                     ctx.strokeStyle = COLORS.orange;
                     ctx.lineWidth = 1;
                     ctx.setLineDash([2, 6]); // Sparse dots
                 }
                 ctx.stroke();
             }
        }
    });
    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);

    particles.forEach(p => {
        if (p.visible === false) return;

        const currentScale = p.scale || 1.0;
        const radius = (10 + p.val * 4) * currentScale;

        // Visual for Phase
        let fillColor = p.color;
        if (config.phaseEnabled) {
            // Modulate opacity or brightness by phase
            const phaseMod = 0.5 + 0.5 * Math.sin(p.phase);
            ctx.globalAlpha = 0.4 + 0.6 * phaseMod;
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius, 0, Math.PI * 2);
        ctx.shadowBlur = 10 * currentScale;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius * 0.3, 0, Math.PI * 2);
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        const isHovered = hoveredId === p.id;
        if (isHovered) {
            ctx.strokeStyle = COLORS.white;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Scripted Annotations
        script.forEach(evt => {
            const end = evt.at + (evt.duration || 10);
            if (playbackProgress >= evt.at && playbackProgress < end && evt.type === 'annotate' && evt.label) {
                const isActive = evt.targetId === p.id || (evt.targetId === 'all') || (evt.targetId === 'center' && p.id === 0);
                if (isActive) {
                    ctx.save();
                    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                    ctx.strokeStyle = COLORS.blue;
                    ctx.lineWidth = 2;
                    
                    const labelPos = { x: p.pos.x, y: p.pos.y - radius - 20 };
                    const textWidth = ctx.measureText(evt.label).width;
                    const pad = 10;
                    ctx.fillRect(labelPos.x - textWidth/2 - pad, labelPos.y - 15 - pad, textWidth + pad*2, 30 + pad);
                    ctx.strokeRect(labelPos.x - textWidth/2 - pad, labelPos.y - 15 - pad, textWidth + pad*2, 30 + pad);
                    
                    ctx.fillStyle = COLORS.white;
                    ctx.font = "bold 16px 'Orbitron'";
                    ctx.textAlign = "center";
                    ctx.fillText(evt.label, labelPos.x, labelPos.y);
                    ctx.restore();
                }
            }
        });
    });

    if (mouseCanvasPos.x !== 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouseCanvasPos.x, mouseCanvasPos.y, 40 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.teal;
        ctx.lineWidth = 2 / zoom; 
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.stroke();
        ctx.fillStyle = "rgba(45, 212, 191, 0.1)";
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();

  }, [particles, interactions, zoom, pan, containerSize, hoveredId, mouseCanvasPos, playbackProgress, script]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return {x:0, y:0};
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const vbW = CANVAS_WIDTH / zoom;
      const vbH = CANVAS_HEIGHT / zoom;
      const vbX = (CANVAS_WIDTH - vbW) / 2 + pan.x;
      const vbY = (CANVAS_HEIGHT - vbH) / 2 + pan.y;
      const scale = Math.min(containerSize.width / vbW, containerSize.height / vbH);
      const tx = (containerSize.width - vbW * scale) / 2;
      const ty = (containerSize.height - vbH * scale) / 2;
      return { x: (x - tx) / scale + vbX, y: (y - ty) / scale + vbY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      let hitId: number | null = null;
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          const dist = Math.sqrt((coords.x - p.pos.x)**2 + (coords.y - p.pos.y)**2);
          if (dist < 20) { hitId = p.id; break; }
      }
      if (hitId !== null) {
          if (interactionMode === 'drag') {
              draggingId.current = hitId;
              isDragging.current = false;
              mousePosRef.current = coords;
              if (!isRunning) requestRef.current = requestAnimationFrame(animate);
          }
      } else {
          panStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setMouseCanvasPos(coords);
      
      let hitId: number | null = null;
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          const dist = Math.sqrt((coords.x - p.pos.x)**2 + (coords.y - p.pos.y)**2);
          if (dist < 20) { hitId = p.id; break; }
      }
      setHoveredId(hitId);
      if (draggingId.current !== null) {
          isDragging.current = true;
          mousePosRef.current = coords;
      } else if (panStartRef.current && canvasRef.current) {
          const dx = e.clientX - panStartRef.current.x;
          const dy = e.clientY - panStartRef.current.y;
          const scale = (CANVAS_WIDTH / zoom) / canvasRef.current.clientWidth;
          onPan({ x: pan.x - dx * scale, y: pan.y - dy * scale });
          panStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (draggingId.current !== null && !isDragging.current) {
          const p = particles.find(pt => pt.id === draggingId.current);
          onSelectParticle(p || null);
      }
      draggingId.current = null;
      isDragging.current = false;
      panStartRef.current = null;
  };

  return (
    <div 
        ref={containerRef}
        className="m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] bg-[#030303] border border-slate-700 rounded-xl shadow-inner cursor-crosshair select-none relative overflow-hidden ring-1 ring-slate-800"
    >
        <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    </div>
  );
};