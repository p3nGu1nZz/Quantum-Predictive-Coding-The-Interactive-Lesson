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
  cameraMode: 'auto' | 'manual';
  manualZoom: number;
  manualPan: Vector2;
  onPan: (p: Vector2) => void;
  playbackProgress?: number; 
  script?: ScriptedEvent[]; 
  onScriptTrigger?: (event: ScriptedEvent) => void; 
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  particles: initialParticles,
  config,
  onUpdate,
  onSelectParticle,
  isRunning,
  interactionMode,
  cameraMode,
  manualZoom,
  manualPan,
  onPan,
  playbackProgress = 0,
  script = [],
  onScriptTrigger
}) => {
  // Use refs for high-frequency updates to avoid React render cycle overhead
  const particlesRef = useRef<Particle[]>(initialParticles);
  const interactionsRef = useRef<Interaction[]>([]);
  const configRef = useRef(config);
  const progressRef = useRef(playbackProgress);
  const scriptRef = useRef(script);
  
  const cameraStateRef = useRef({
      mode: cameraMode,
      zoom: 1,
      pan: { x: 0, y: 0 },
      targetZoom: 1,
      targetPan: { x: 0, y: 0 }
  });

  // Visual effects state
  const wavefrontsRef = useRef<{x:number, y:number, r:number, life:number}[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const trailsRef = useRef<Map<number, Vector2[]>>(new Map());
  const triggeredEventsRef = useRef<Set<number>>(new Set());
  const prevProgressRef = useRef(0);
  const timeRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const containerSizeRef = useRef({ width: 0, height: 0 });
  
  const [resetAnim, setResetAnim] = useState<{
    active: boolean;
    start: Particle[];
    target: Particle[];
    startTime: number;
  } | null>(null);

  // --- SYNC REFS WITH PROPS ---
  useEffect(() => { configRef.current = config; }, [config]);
  
  useEffect(() => { 
      // Detect scene change via script change or particle count change drastically
      triggeredEventsRef.current.clear();
      prevProgressRef.current = 0;
      wavefrontsRef.current = [];
      sparksRef.current = [];
      trailsRef.current.clear();
      scriptRef.current = script;
  }, [script]);

  useEffect(() => { progressRef.current = playbackProgress; }, [playbackProgress]);

  useEffect(() => {
      cameraStateRef.current.mode = cameraMode;
      if (cameraMode === 'manual') {
          cameraStateRef.current.targetZoom = manualZoom;
          cameraStateRef.current.targetPan = manualPan;
      }
  }, [cameraMode, manualZoom, manualPan]);

  // Handle particle resets
  useEffect(() => {
    const currentParticles = particlesRef.current;
    const isSameScene = currentParticles.length === initialParticles.length && currentParticles.length > 0 && initialParticles.length > 0 && currentParticles[0].id === initialParticles[0].id;
    
    if (isSameScene) {
      setResetAnim({ active: true, start: JSON.parse(JSON.stringify(currentParticles)), target: initialParticles, startTime: performance.now() });
    } else {
      particlesRef.current = initialParticles;
      interactionsRef.current = [];
      setResetAnim(null);
      wavefrontsRef.current = [];
      sparksRef.current = [];
      trailsRef.current.clear();
    }
  }, [initialParticles]);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
          containerSizeRef.current = { width: entry.contentRect.width, height: entry.contentRect.height };
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // --- PHYSICS ENGINE ---
  const calculatePhysics = useCallback(() => {
    let ps = particlesRef.current;
    
    // Handle Reset Animation
    if (resetAnim && resetAnim.active) {
       const now = performance.now();
       const duration = 1500;
       const elapsed = now - resetAnim.startTime;
       const t = Math.min(1, elapsed / duration);
       const ease = 1 - Math.pow(1 - t, 4); // Quartic ease out
       if (t >= 1) {
         setResetAnim(null);
         particlesRef.current = resetAnim.target;
         return;
       }
       particlesRef.current = resetAnim.start.map((pStart, i) => {
         const pEnd = resetAnim.target[i] || pStart;
         return { ...pEnd, pos: { x: pStart.pos.x + (pEnd.pos.x - pStart.pos.x) * ease, y: pStart.pos.y + (pEnd.pos.y - pStart.pos.y) * ease } };
       });
       interactionsRef.current = [];
       return;
    }

    const currentP = progressRef.current;
    const prevP = prevProgressRef.current;
    const script = scriptRef.current;
    const config = configRef.current;
    
    // --- SCRIPT EVENT HANDLING ---
    if (currentP < prevP) { 
        script.forEach((evt, idx) => { if (evt.at > currentP) triggeredEventsRef.current.delete(idx); });
    }

    script.forEach((evt, idx) => {
        if (currentP >= evt.at && prevP < evt.at && !triggeredEventsRef.current.has(idx)) {
            triggeredEventsRef.current.add(idx);
            
            if (evt.type === 'pulse' || evt.type === 'spawn') {
                let targets = ps;
                if (evt.targetId === 'center') targets = [ps[0]];
                else if (typeof evt.targetId === 'number') targets = ps.filter(p => p.id === evt.targetId);
                
                const newWaves = targets.filter(p=>p).map(p => ({ x: p.pos.x, y: p.pos.y, r: 10, life: 1.0 }));
                wavefrontsRef.current.push(...newWaves);
            }

            if (onScriptTrigger && ['setTab', 'zoom', 'pan', 'reset'].includes(evt.type)) {
                onScriptTrigger(evt);
            }
        }
    });

    const activeEvents = script.filter(evt => {
        const end = evt.at + (evt.duration || 10);
        return currentP >= evt.at && currentP < end;
    });

    // --- FORCES CALCULATION ---
    const n = ps.length;
    const newInteractions: Interaction[] = [];
    // Reset accumulated forces for visualization
    const netForces: Vector2[] = new Array(n).fill(null).map(() => ({x: 0, y: 0}));
    const phaseDeltas: number[] = new Array(n).fill(0);
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    // Apply Script Forces
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
                netForces[idx].x += evt.vector.x * 0.5; 
                netForces[idx].y += evt.vector.y * 0.5;
            } else if (evt.type === 'rotate') {
                const dx = p.pos.x - cx;
                const dy = p.pos.y - cy;
                netForces[idx].x += -dy * 0.05;
                netForces[idx].y += dx * 0.05;
            }
        });
    });

    // Physics Loop
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
                const deltaPhi = p2.phase - p1.phase;
                const syncStrength = 0.05 * spatialDecay; 
                phaseDeltas[i] += syncStrength * Math.sin(deltaPhi);
                phaseDeltas[j] -= syncStrength * Math.sin(deltaPhi);
                phaseFactor = 0.5 * (1 + Math.cos(deltaPhi)); 
            }

            const coupling = spatialDecay * Math.abs(spinFactor);

            if (coupling > 0.1 && config.couplingEnabled) {
                newInteractions.push({ p1: p1.id, p2: p2.id, strength: 1.0, distance: d, coupling: coupling * phaseFactor });
                
                const targetDist = config.r0;
                const displacement = d - targetDist;
                let effectiveK = config.k;

                if (config.spinEnabled && spinFactor < 0) effectiveK *= -0.5;

                let forceMag = -effectiveK * displacement;
                const unitX = dx / d;
                const unitY = dy / d;
                
                const fx = forceMag * unitX;
                const fy = forceMag * unitY;

                netForces[i].x += fx;
                netForces[i].y += fy;
                netForces[j].x -= fx;
                netForces[j].y -= fy;
            }
        }
    }

    // Update Particles
    const nextParticles = ps.map((p, i) => {
        // Save computed force for visualization
        p.force = { x: netForces[i].x, y: netForces[i].y };

        let scale = p.scale || 1.0;
        let visible = p.visible !== undefined ? p.visible : true;
        let shakeX = 0;
        let shakeY = 0;

        activeEvents.forEach(evt => {
            const isTarget = evt.targetId === 'all' || evt.targetId === p.id || (evt.targetId === 'center' && i === 0);
            if (isTarget) {
                const duration = evt.duration || 10;
                const localT = Math.max(0, Math.min(1, (currentP - evt.at) / duration));

                if (evt.type === 'spawn') {
                    visible = true;
                    scale = Math.min(1.0, localT * 2);
                }
                if (evt.type === 'pulse') scale = 1.0 + Math.sin(localT * Math.PI) * 0.5;
                if (evt.type === 'highlight') scale = 1.2;
                if (evt.type === 'shake') {
                    const intensity = 5.0;
                    shakeX = (Math.random() - 0.5) * intensity;
                    shakeY = (Math.random() - 0.5) * intensity;
                }
            }
        });
        
        if (p.isFixed) return { ...p, scale, visible };

        let newVelX = p.vel.x * config.damping + netForces[i].x + shakeX;
        let newVelY = p.vel.y * config.damping + netForces[i].y + shakeY;
        
        newVelX += (Math.random() - 0.5) * config.temperature;
        newVelY += (Math.random() - 0.5) * config.temperature;

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

        const margin = 50;
        if (nextX < -margin) newVelX += 0.5;
        if (nextX > CANVAS_WIDTH + margin) newVelX -= 0.5;
        if (nextY < -margin) newVelY += 0.5;
        if (nextY > CANVAS_HEIGHT + margin) newVelY -= 0.5;

        if (scale > 1.01) scale *= 0.95;
        if (scale < 0.99) scale += 0.05;

        const trail = trailsRef.current.get(p.id) || [];
        if (trail.length === 0 || Math.random() > 0.7) {
            trail.push({x: nextX, y: nextY});
            if (trail.length > 15) trail.shift();
            trailsRef.current.set(p.id, trail);
        }

        return { ...p, pos: { x: nextX, y: nextY }, vel: { x: newVelX, y: newVelY }, phase: newPhase, scale, visible };
    });

    particlesRef.current = nextParticles;
    interactionsRef.current = newInteractions;
    wavefrontsRef.current = wavefrontsRef.current.map(w => ({...w, r: w.r + 5, life: w.life - 0.02})).filter(w => w.life > 0);
    prevProgressRef.current = currentP;

  }, [resetAnim, onScriptTrigger]); 

  // --- CAMERA LOGIC ---
  const updateCamera = () => {
    let targetZoom = cameraStateRef.current.targetZoom;
    let targetPanX = cameraStateRef.current.targetPan.x;
    let targetPanY = cameraStateRef.current.targetPan.y;

    if (cameraStateRef.current.mode === 'auto') {
        const visibleParticles = particlesRef.current.filter(p => p.visible !== false);
        if (visibleParticles.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            visibleParticles.forEach(p => {
                if (p.pos.x < minX) minX = p.pos.x;
                if (p.pos.x > maxX) maxX = p.pos.x;
                if (p.pos.y < minY) minY = p.pos.y;
                if (p.pos.y > maxY) maxY = p.pos.y;
            });

            const padding = 150;
            const width = Math.max(200, maxX - minX + padding * 2);
            const height = Math.max(200, maxY - minY + padding * 2);

            const scaleX = CANVAS_WIDTH / width;
            const scaleY = CANVAS_HEIGHT / height;
            targetZoom = Math.min(1.5, Math.min(scaleX, scaleY)); 
            targetZoom = Math.max(0.5, targetZoom); 

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            targetPanX = centerX - (CANVAS_WIDTH / 2);
            targetPanY = centerY - (CANVAS_HEIGHT / 2);
        }
    }

    cameraStateRef.current.zoom += (targetZoom - cameraStateRef.current.zoom) * 0.05;
    cameraStateRef.current.pan.x += (targetPanX - cameraStateRef.current.pan.x) * 0.05;
    cameraStateRef.current.pan.y += (targetPanY - cameraStateRef.current.pan.y) * 0.05;
  };

  // --- ANIMATION LOOP ---
  const animate = useCallback((now: number) => {
    if (!isRunning && (!resetAnim || !resetAnim.active)) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    timeRef.current = now;
    calculatePhysics();
    updateCamera();

    onUpdate(particlesRef.current, interactionsRef.current, { pred: 0, pos: 0 });

    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const containerSize = containerSizeRef.current;
        if (ctx && containerSize.width > 0) {
             if (canvas.width !== containerSize.width || canvas.height !== containerSize.height) {
                canvas.width = containerSize.width;
                canvas.height = containerSize.height;
             }

             // Clear
             ctx.clearRect(0, 0, canvas.width, canvas.height);

             const { zoom, pan } = cameraStateRef.current;
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

             // 1. TENSOR FIELD MAP (Background Layer)
             // We draw a "Meteorological" style flow map of the potential field
             const ps = particlesRef.current;
             const config = configRef.current;
             
             const tensorGridSize = 60;
             const boundsPad = 200;
             // Only draw roughly within view
             const startX = Math.floor((vbX - boundsPad) / tensorGridSize) * tensorGridSize;
             const endX = Math.floor((vbX + vbW + boundsPad) / tensorGridSize) * tensorGridSize;
             const startY = Math.floor((vbY - boundsPad) / tensorGridSize) * tensorGridSize;
             const endY = Math.floor((vbY + vbH + boundsPad) / tensorGridSize) * tensorGridSize;

             ctx.lineWidth = 1;
             for(let x = startX; x <= endX; x += tensorGridSize) {
                for(let y = startY; y <= endY; y += tensorGridSize) {
                    // Calculate field at this point
                    let fx = 0, fy = 0;
                    let totalMag = 0;
                    
                    // Sample forces from nearby particles
                    for(const p of ps) {
                        const dx = x - p.pos.x;
                        const dy = y - p.pos.y;
                        const d2 = dx*dx + dy*dy;
                        if(d2 > 40000) continue; // Optimization: Ignore distant particles
                        
                        const d = Math.sqrt(d2);
                        // Inverse square-ish influence for visualization
                        const influence = Math.exp(-d2 / (config.sigma * config.sigma)) * 50; 
                        
                        // Direction away or towards based on potential
                        // Simplified: Point towards particles (Gravity well style)
                        if (d > 0.1) {
                            fx -= (dx/d) * influence;
                            fy -= (dy/d) * influence;
                        }
                    }
                    
                    const mag = Math.sqrt(fx*fx + fy*fy);
                    if(mag > 0.5) {
                        const angle = Math.atan2(fy, fx);
                        const len = Math.min(tensorGridSize * 0.6, mag * 2);
                        
                        // Color mapping (Heatmap: Blue -> Cyan -> White)
                        const opacity = Math.min(0.3, mag * 0.05);
                        
                        ctx.beginPath();
                        ctx.moveTo(x - Math.cos(angle)*len/2, y - Math.sin(angle)*len/2);
                        ctx.lineTo(x + Math.cos(angle)*len/2, y + Math.sin(angle)*len/2);
                        ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`; // Cyan
                        ctx.stroke();

                        // Small arrowhead for direction
                        if (mag > 2) {
                             ctx.beginPath();
                             const tipX = x + Math.cos(angle)*len/2;
                             const tipY = y + Math.sin(angle)*len/2;
                             ctx.moveTo(tipX, tipY);
                             ctx.lineTo(tipX - Math.cos(angle - 0.5)*4, tipY - Math.sin(angle - 0.5)*4);
                             ctx.moveTo(tipX, tipY);
                             ctx.lineTo(tipX - Math.cos(angle + 0.5)*4, tipY - Math.sin(angle + 0.5)*4);
                             ctx.stroke();
                        }
                    }
                }
             }

             // 2. GRID (Subtle)
             ctx.strokeStyle = '#0f172a'; 
             ctx.lineWidth = 1;
             ctx.beginPath();
             const gridSize = 100;
             for(let x=-1000; x<=CANVAS_WIDTH+1000; x+=gridSize) { 
                 ctx.moveTo(x, -1000); ctx.lineTo(x, CANVAS_HEIGHT+1000); 
             }
             for(let y=-1000; y<=CANVAS_HEIGHT+1000; y+=gridSize) { 
                 ctx.moveTo(-1000, y); ctx.lineTo(CANVAS_WIDTH+1000, y); 
             }
             ctx.stroke();

             // 3. INTERACTIONS
             interactionsRef.current.forEach(int => {
                 const p1 = ps.find(p => p.id === int.p1);
                 const p2 = ps.find(p => p.id === int.p2);
                 if (p1 && p2 && p1.visible !== false && p2.visible !== false) {
                     ctx.beginPath();
                     ctx.moveTo(p1.pos.x, p1.pos.y);
                     ctx.lineTo(p2.pos.x, p2.pos.y);
                     ctx.strokeStyle = configRef.current.spinEnabled && (p1.spin * p2.spin) <= 0 ? COLORS.red : p1.color;
                     ctx.lineWidth = int.coupling > 0.8 ? 2.5 : 1;
                     ctx.globalAlpha = Math.min(1, int.coupling) * 0.4; // Reduced alpha to let forces pop
                     if (configRef.current.spinEnabled) ctx.setLineDash([5, 5]);
                     ctx.stroke();
                     ctx.globalAlpha = 1.0;
                     ctx.setLineDash([]);
                 }
             });

             // 4. PARTICLES & FORCE VECTORS
             ps.forEach(p => {
                 if (p.visible === false) return;
                 const currentScale = p.scale || 1.0;
                 
                 // Trails
                 const trail = trailsRef.current.get(p.id);
                 if (trail && trail.length > 1) {
                     ctx.beginPath();
                     ctx.moveTo(trail[0].x, trail[0].y);
                     for(let i=1; i<trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
                     ctx.strokeStyle = p.color;
                     ctx.globalAlpha = 0.4;
                     ctx.stroke();
                     ctx.globalAlpha = 1.0;
                 }

                 // FORCE VECTOR VISUALIZATION (New)
                 if (p.force && (Math.abs(p.force.x) > 0.1 || Math.abs(p.force.y) > 0.1)) {
                     const fMag = Math.sqrt(p.force.x*p.force.x + p.force.y*p.force.y);
                     // Scale force for visual clarity without being huge
                     const visualScale = 20; 
                     const endX = p.pos.x + p.force.x * visualScale;
                     const endY = p.pos.y + p.force.y * visualScale;

                     // Draw Force Line
                     ctx.beginPath();
                     ctx.moveTo(p.pos.x, p.pos.y);
                     ctx.lineTo(endX, endY);
                     ctx.strokeStyle = COLORS.yellow; // Confident Gold/Yellow
                     ctx.lineWidth = 2;
                     ctx.globalAlpha = 0.8;
                     ctx.stroke();
                     ctx.globalAlpha = 1.0;

                     // Animated Arrowhead/Chevron
                     // Position moves along the line based on time and magnitude
                     const lineLen = Math.sqrt((endX - p.pos.x)**2 + (endY - p.pos.y)**2);
                     const speed = fMag * 0.2; // Speed proportional to force
                     const animOffset = (now * speed) % lineLen; // Loop animation
                     
                     // Normalize direction
                     const dirX = (endX - p.pos.x) / lineLen;
                     const dirY = (endY - p.pos.y) / lineLen;
                     
                     // Calculate current chevron position
                     const cX = p.pos.x + dirX * animOffset;
                     const cY = p.pos.y + dirY * animOffset;
                     
                     // Draw Chevron
                     const size = 6;
                     // Perpendicular vector for width
                     const perpX = -dirY * size;
                     const perpY = dirX * size;
                     
                     // Back points of chevron
                     const backX = cX - dirX * size;
                     const backY = cY - dirY * size;
                     
                     ctx.beginPath();
                     ctx.moveTo(cX, cY); // Tip
                     ctx.lineTo(backX + perpX, backY + perpY); // Wing 1
                     ctx.moveTo(cX, cY);
                     ctx.lineTo(backX - perpX, backY - perpY); // Wing 2
                     ctx.strokeStyle = '#ffffff';
                     ctx.lineWidth = 2;
                     ctx.shadowColor = COLORS.yellow;
                     ctx.shadowBlur = 10;
                     ctx.stroke();
                     ctx.shadowBlur = 0;
                 }

                 // Particle Body
                 const radius = 8 * currentScale;
                 ctx.shadowBlur = 20 * currentScale;
                 ctx.shadowColor = p.color;
                 ctx.fillStyle = p.color;
                 ctx.beginPath();
                 ctx.arc(p.pos.x, p.pos.y, radius, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.shadowBlur = 0;

                 ctx.fillStyle = '#ffffff';
                 ctx.beginPath();
                 ctx.arc(p.pos.x, p.pos.y, radius * 0.4, 0, Math.PI * 2);
                 ctx.fill();
             });

             // 5. WAVEFRONTS & LABELS
             wavefrontsRef.current.forEach(w => {
                 ctx.beginPath();
                 ctx.strokeStyle = `rgba(6, 182, 212, ${w.life})`; 
                 ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
                 ctx.stroke();
             });

             // Labels (simplified)
             scriptRef.current.forEach(evt => {
                const end = evt.at + (evt.duration || 10);
                if (progressRef.current >= evt.at && progressRef.current < end && evt.label) {
                    let targets = evt.targetId === 'all' ? ps : (typeof evt.targetId === 'number' ? ps.filter(x => x.id === evt.targetId) : (ps[0] ? [ps[0]] : []));
                    if(targets.length > 0) {
                        let cx = 0, cy = 0;
                        targets.forEach(p => { cx += p.pos.x; cy += p.pos.y; });
                        cx /= targets.length;
                        cy /= targets.length;
                        ctx.font = "bold 12px 'Orbitron'";
                        const text = evt.label;
                        const w = ctx.measureText(text).width + 16;
                        ctx.fillStyle = "rgba(0,0,0,0.7)";
                        ctx.strokeStyle = COLORS.blue;
                        ctx.beginPath(); ctx.roundRect(cx-w/2, cy-52, w, 24, 4); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = COLORS.blue; ctx.textAlign = "center"; ctx.fillText(text, cx, cy-40);
                    }
                }
             });

             ctx.restore();
        }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isRunning, calculatePhysics, onUpdate, resetAnim]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair select-none">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};