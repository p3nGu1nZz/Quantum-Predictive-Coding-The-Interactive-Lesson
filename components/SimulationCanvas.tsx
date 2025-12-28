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
  script = []
}) => {
  const [particles, setParticles] = useState<Particle[]>(initialParticles);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  
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
  
  const trailsRef = useRef<Map<number, Vector2[]>>(new Map());
  const simFrameRef = useRef(0);
  const predictionHistoryRef = useRef<Map<number, Record<number, Vector2>>>(new Map());

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
      trailsRef.current.clear();
      predictionHistoryRef.current.clear();
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
         const pEnd = resetAnim.target[i];
         return {
           ...pEnd,
           pos: {
             x: pStart.pos.x + (pEnd.pos.x - pStart.pos.x) * ease,
             y: pStart.pos.y + (pEnd.pos.y - pStart.pos.y) * ease,
           },
           val: pStart.val + (pEnd.val - pStart.val) * ease,
           vel: { x: 0, y: 0 },
           force: { x: 0, y: 0 },
           valVel: 0,
           phaseVel: 0.1,
           spin: pEnd.spin,
           color: pEnd.color,
           id: pEnd.id,
           phase: pStart.phase
         };
       });
       return { particles: interpolated, interactions: [], energy: { pred: 0, pos: 0 } };
    }

    const ps = [...particles];
    const n = ps.length;
    let totalPredEnergy = 0;
    let totalPosEnergy = 0;
    const newInteractions: Interaction[] = [];
    const forces: Vector2[] = new Array(n).fill(null).map(() => ({x: 0, y: 0}));
    const predictedStates: number[] = new Array(n).fill(0);
    const totalWeights: number[] = new Array(n).fill(0);
    const phaseDrifts: number[] = new Array(n).fill(0);

    // O(N^2) Loop
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const p1 = ps[i];
            const p2 = ps[j];
            const dx = p1.pos.x - p2.pos.x;
            const dy = p1.pos.y - p2.pos.y;
            const d2 = dx*dx + dy*dy;
            const d = Math.sqrt(d2);

            // Interaction Strength
            const spatialDecay = Math.exp(-d2 / (config.sigma * config.sigma));
            const phaseTerm = config.phaseEnabled ? Math.max(0, Math.cos(p1.phase - p2.phase)) : 1.0;
            const spinProduct = p1.spin * p2.spin;
            const spinGammaCoupling = 4.0;
            const spinTerm = config.spinEnabled ? (1 + spinGammaCoupling * spinProduct) : 1.0;
            const coupling = Math.max(0, spatialDecay * phaseTerm * spinTerm);

            if (coupling > 0.05) {
                newInteractions.push({ p1: p1.id, p2: p2.id, strength: 1.0, distance: d, coupling });
                
                // Prediction Accumulation
                const w_ij = coupling; // strength is 1.0
                predictedStates[i] += w_ij * p2.val;
                totalWeights[i] += w_ij;
                predictedStates[j] += w_ij * p1.val;
                totalWeights[j] += w_ij;

                // Force Accumulation
                const displacement = d - config.r0;
                
                // Spin can modulate the effective force strength
                const spinGammaForce = 6.0;
                const spinFactor = config.spinEnabled ? (1 + spinGammaForce * spinProduct) : 1.0;
                
                const forceMag = -config.k * displacement * spinFactor; 
                
                totalPosEnergy += 0.5 * config.k * (displacement ** 2);

                const unitX = dx / d;
                const unitY = dy / d;

                const fx = forceMag * unitX;
                const fy = forceMag * unitY;

                forces[i].x += fx;
                forces[i].y += fy;
                forces[j].x -= fx;
                forces[j].y -= fy;

                if (config.phaseEnabled) {
                    const drift = 0.05 * Math.sin(p2.phase - p1.phase);
                    phaseDrifts[i] += drift;
                    phaseDrifts[j] -= drift;
                }
            }
        }
    }

    // --- SCRIPTED EVENTS ---
    const activeEvents = script.filter(evt => {
        const end = evt.at + (evt.duration || 10); // default 10% duration
        return playbackProgress >= evt.at && playbackProgress < end;
    });

    // Apply Scripted Forces or Mutations
    activeEvents.forEach(evt => {
        if (evt.type === 'force' && evt.vector) {
            let targets: number[] = [];
            if (evt.targetId === 'all') targets = ps.map(p => p.id);
            else if (evt.targetId === 'center') targets = [0]; // Simplified: assume 0 is roughly center or specific
            else if (typeof evt.targetId === 'number') targets = [evt.targetId];
            else targets = [0, 1, 2]; // Default cluster

            targets.forEach(tid => {
                if (forces[tid]) {
                    forces[tid].x += evt.vector!.x * 2; // Strong push
                    forces[tid].y += evt.vector!.y * 2;
                }
            });
        }
        
        if (evt.type === 'pulse') {
             // Modulate scale or brightness
             // We'll update the particle properties directly in the map loop below
        }
    });

    simFrameRef.current++;
    const currentFrame = simFrameRef.current;
    let historyError = 0;

    // Apply Updates
    const nextParticles = ps.map((p, i) => {
        // Handle Pulse/Visibility overrides from script
        let scale = 1.0;
        let visible = p.visible !== undefined ? p.visible : true;
        let activationMod = 0;

        activeEvents.forEach(evt => {
            const isTarget = evt.targetId === 'all' || evt.targetId === p.id || (evt.targetId === 'center' && i === 0);
            if (isTarget) {
                if (evt.type === 'spawn') visible = true;
                if (evt.type === 'pulse') scale = 1.5 + Math.sin(currentFrame * 0.2) * 0.3;
                if (evt.type === 'highlight') scale = 1.3;
            }
        });

        // Trail Logic
        if (!trailsRef.current.has(p.id)) trailsRef.current.set(p.id, []);
        const trail = trailsRef.current.get(p.id)!;
        
        // Add point if moved enough or periodically
        const last = trail[trail.length - 1];
        if (!last || Math.abs(last.x - p.pos.x) > 1.0 || Math.abs(last.y - p.pos.y) > 1.0) {
            trail.push({ ...p.pos });
            // Keep trails relatively short for performance, but long enough for visuals
            if (trail.length > 25) trail.shift();
        }

        // Dragging
        if (p.id === draggingId.current) {
            let tx = mousePosRef.current.x;
            let ty = mousePosRef.current.y;
            tx = Math.max(10, Math.min(CANVAS_WIDTH - 10, tx));
            ty = Math.max(10, Math.min(CANVAS_HEIGHT - 10, ty));
            return { ...p, pos: { x: tx, y: ty }, vel: { x: 0, y: 0 }, force: {x:0,y:0}, valVel: 0 };
        }
        if (p.isFixed) return { ...p, scale, visible };

        // Prediction Error
        let predictedVal = 0;
        if (totalWeights[i] > 0) predictedVal = predictedStates[i] / totalWeights[i];
        const error = p.val - predictedVal;
        totalPredEnergy += 0.5 * (error ** 2);
        const forceState = -config.eta * error;

        // Dynamics
        const noiseX = gaussianRandom() * config.temperature;
        const noiseY = gaussianRandom() * config.temperature;
        
        let newVelX = p.vel.x * config.damping + (forces[i].x * config.eta_r) + noiseX;
        let newVelY = p.vel.y * config.damping + (forces[i].y * config.eta_r) + noiseY;
        
        // --- STABILIZATION: CLAMP VELOCITY ---
        const maxVel = 5.0; 
        const speed = Math.sqrt(newVelX*newVelX + newVelY*newVelY);
        if (speed > maxVel) {
            newVelX = (newVelX / speed) * maxVel;
            newVelY = (newVelY / speed) * maxVel;
        }

        const newValVel = p.valVel * config.damping + forceState + activationMod;
        const newPhaseVel = phaseDrifts[i] + 0.02;
        const newPhase = (p.phase + newPhaseVel) % (2 * Math.PI);

        let nextX = p.pos.x + newVelX;
        let nextY = p.pos.y + newVelY;

        // Bounds
        const margin = 15;
        if (nextX < margin) { nextX = margin; newVelX *= -0.8; } 
        else if (nextX > CANVAS_WIDTH - margin) { nextX = CANVAS_WIDTH - margin; newVelX *= -0.8; }
        if (nextY < margin) { nextY = margin; newVelY *= -0.8; } 
        else if (nextY > CANVAS_HEIGHT - margin) { nextY = CANVAS_HEIGHT - margin; newVelY *= -0.8; }

        return {
            ...p,
            pos: { x: nextX, y: nextY },
            vel: { x: newVelX, y: newVelY },
            force: forces[i],
            val: p.val + newValVel,
            valVel: newValVel,
            predictedVal,
            phase: newPhase,
            phaseVel: newPhaseVel,
            scale,
            visible
        };
    });

    // Ghosts
    if (config.showGhosts) {
        const targetFrame = currentFrame + 60;
        predictionHistoryRef.current.set(targetFrame, nextParticles.reduce((acc, p) => ({...acc, [p.id]: p.pos}), {}));
        const past = predictionHistoryRef.current.get(currentFrame);
        if (past) {
            let totalErr = 0, c = 0;
            nextParticles.forEach(p => {
                if (past[p.id]) {
                    const dx = p.pos.x - past[p.id].x;
                    const dy = p.pos.y - past[p.id].y;
                    totalErr += Math.sqrt(dx*dx + dy*dy);
                    c++;
                }
            });
            if (c > 0) historyError = totalErr / c;
            predictionHistoryRef.current.delete(currentFrame);
        }
    } else {
        predictionHistoryRef.current.clear();
    }

    return { particles: nextParticles, interactions: newInteractions, energy: { pred: totalPredEnergy, pos: totalPosEnergy, historyError } };
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

    // Viewport Math
    const vbW = CANVAS_WIDTH / zoom;
    const vbH = CANVAS_HEIGHT / zoom;
    const vbX = (CANVAS_WIDTH - vbW) / 2 + pan.x;
    const vbY = (CANVAS_HEIGHT - vbH) / 2 + pan.y;

    const scaleX = containerSize.width / vbW;
    const scaleY = containerSize.height / vbH;
    const scale = Math.min(scaleX, scaleY);

    const tx = (containerSize.width - vbW * scale) / 2;
    const ty = (containerSize.height - vbH * scale) / 2;

    // Clear
    ctx.fillStyle = '#030303';
    ctx.fillRect(0,0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
    ctx.translate(-vbX, -vbY);

    // Draw Grid
    ctx.strokeStyle = '#1e293b'; // COLORS.grid
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<=CANVAS_WIDTH; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x, CANVAS_HEIGHT); }
    for(let y=0; y<=CANVAS_HEIGHT; y+=40) { ctx.moveTo(0,y); ctx.lineTo(CANVAS_WIDTH, y); }
    ctx.stroke();

    const time = performance.now();

    // Draw Interaction Lines
    interactions.forEach(int => {
        const opacity = Math.max(0.1, Math.min(1, int.coupling));
        const p1 = particles.find(p => p.id === int.p1);
        const p2 = particles.find(p => p.id === int.p2);
        
        if (p1 && p2 && p1.visible !== false && p2.visible !== false) {
             ctx.beginPath();
             ctx.moveTo(p1.pos.x, p1.pos.y);
             ctx.lineTo(p2.pos.x, p2.pos.y);
             ctx.globalAlpha = opacity * 0.8;
             
             // Spin Interaction Visuals
             if (config.spinEnabled) {
                 const spinProd = p1.spin * p2.spin;
                 const isAligned = spinProd > 0;
                 
                 if (isAligned) {
                     ctx.strokeStyle = COLORS.green;
                     ctx.lineWidth = 1.5 + 2 * opacity;
                     ctx.setLineDash([]);
                 } else {
                     ctx.strokeStyle = COLORS.orange;
                     ctx.lineWidth = 1 + opacity;
                     ctx.setLineDash([4, 6]); 
                 }
             } else {
                 ctx.strokeStyle = COLORS.purple;
                 ctx.lineWidth = 1 + 2 * opacity;
                 if (opacity < 0.3) {
                     ctx.setLineDash([4, 4]); 
                 } else {
                     ctx.setLineDash([]);
                 }
             }
             ctx.stroke();
        }
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // Draw Particles & Trails
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    particles.forEach(p => {
        if (p.visible === false) return;

        // Ghost Particles
        if (config.showGhosts) {
             const simSteps = 30;
             let simPos = { ...p.pos };
             let simVel = { ...p.vel };
             
             ctx.beginPath();
             ctx.moveTo(simPos.x, simPos.y);
             
             for(let i=0; i<simSteps; i++) {
                 simVel.x *= config.damping;
                 simVel.y *= config.damping;
                 simVel.x += p.force!.x * config.eta_r;
                 simVel.y += p.force!.y * config.eta_r;
                 
                 simPos.x += simVel.x;
                 simPos.y += simVel.y;
                 
                 if (i % 5 === 0) { 
                     ctx.lineTo(simPos.x, simPos.y);
                 }
             }
             ctx.strokeStyle = COLORS.yellow;
             ctx.lineWidth = 1;
             ctx.setLineDash([2, 4]);
             ctx.globalAlpha = 0.4;
             ctx.stroke();
             ctx.setLineDash([]);
             
             ctx.beginPath();
             ctx.arc(simPos.x, simPos.y, 3, 0, Math.PI*2);
             ctx.fillStyle = COLORS.yellow;
             ctx.fill();
        }

        // Organic Trails
        const trail = trailsRef.current.get(p.id);
        if (trail && trail.length > 2) {
            const head = trail[trail.length-1];
            const tail = trail[0];
            if (head.x !== tail.x || head.y !== tail.y) {
                const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
                gradient.addColorStop(0, p.color); 
                gradient.addColorStop(1, 'rgba(0,0,0,0)'); 
                
                ctx.beginPath();
                ctx.moveTo(trail[0].x, trail[0].y);
                
                for (let i = 1; i < trail.length - 1; i++) {
                    const xc = (trail[i].x + trail[i + 1].x) / 2;
                    const yc = (trail[i].y + trail[i + 1].y) / 2;
                    ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
                }
                ctx.quadraticCurveTo(
                    trail[trail.length-1].x, 
                    trail[trail.length-1].y, 
                    p.pos.x, 
                    p.pos.y
                );

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6;
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1.0;

        // Particle Body
        const intensity = Math.min(1, Math.max(0, (p.val + 1) / 2));
        let baseColor = p.color;
        if (p.isFixed) baseColor = COLORS.red;
        else if (config.spinEnabled) baseColor = p.spin > 0 ? COLORS.green : COLORS.orange;
        
        const isHovered = hoveredId === p.id;
        // Apply extra scaling from script if present
        const currentScale = p.scale || 1.0;
        const radius = (isHovered ? 16 : 12) * currentScale;

        // Glow
        ctx.shadowBlur = 10 * currentScale;
        ctx.shadowColor = baseColor;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, radius, 0, Math.PI * 2);
        ctx.globalAlpha = 0.4 + 0.6 * intensity;
        ctx.fill();
        
        // Stroke
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = (isHovered ? 3 : 2) * currentScale;
        ctx.stroke();

        // Spin Indicator
        if (config.spinEnabled) {
            ctx.save();
            ctx.translate(p.pos.x + radius + 8, p.pos.y);
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            if (p.spin > 0) {
                ctx.moveTo(-5 * currentScale, 3 * currentScale); 
                ctx.lineTo(0, -6 * currentScale); 
                ctx.lineTo(5 * currentScale, 3 * currentScale);
            } else {
                ctx.moveTo(-5 * currentScale, -3 * currentScale); 
                ctx.lineTo(0, 6 * currentScale); 
                ctx.lineTo(5 * currentScale, -3 * currentScale);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Phase Satellite
        if (config.phaseEnabled) {
            const phaseX = p.pos.x + (radius + 6) * Math.cos(p.phase);
            const phaseY = p.pos.y + (radius + 6) * Math.sin(p.phase);
            ctx.fillStyle = COLORS.white;
            ctx.shadowBlur = 5;
            ctx.shadowColor = COLORS.white;
            ctx.beginPath();
            ctx.arc(phaseX, phaseY, 3 * currentScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Orbit ring
            ctx.strokeStyle = COLORS.purple;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Value Text
        let valStr = p.val.toFixed(2);
        if (Math.abs(p.val) > 100) valStr = p.val.toExponential(1);
        
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(p.pos.x - 14, p.pos.y - 6, 28, 12);
        ctx.fillStyle = "white";
        ctx.font = `bold ${10 * currentScale}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(valStr, p.pos.x, p.pos.y);
    });

    // Render Annotations from Script
    script.forEach(evt => {
        const end = evt.at + (evt.duration || 10);
        if (playbackProgress >= evt.at && playbackProgress < end && evt.type === 'annotate' && evt.label) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.strokeStyle = COLORS.blue;
            ctx.lineWidth = 2;
            
            // Default center if no target, or particle pos if targeted
            let pos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100 };
            if (typeof evt.targetId === 'number') {
                const t = particles.find(p => p.id === evt.targetId);
                if (t) pos = { x: t.pos.x, y: t.pos.y - 40 };
            }

            // Draw box
            const textWidth = ctx.measureText(evt.label).width;
            const pad = 10;
            ctx.fillRect(pos.x - textWidth/2 - pad, pos.y - 15 - pad, textWidth + pad*2, 30 + pad);
            ctx.strokeRect(pos.x - textWidth/2 - pad, pos.y - 15 - pad, textWidth + pad*2, 30 + pad);
            
            // Draw text
            ctx.fillStyle = COLORS.white;
            ctx.font = "bold 20px 'Orbitron'";
            ctx.textAlign = "center";
            ctx.fillText(evt.label, pos.x, pos.y);
            ctx.restore();
        }
    });

    ctx.restore();

  }, [particles, interactions, zoom, pan, containerSize, hoveredId, playbackProgress, script]);

  // Coordinate Mapping for Mouse Events (Unchanged)
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