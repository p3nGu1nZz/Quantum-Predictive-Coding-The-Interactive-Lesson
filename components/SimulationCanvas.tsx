import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Particle, Interaction, SimulationConfig, Vector2 } from '../types';
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
  onPan
}) => {
  const [particles, setParticles] = useState<Particle[]>(initialParticles);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  
  // Animation state for Reset
  const [resetAnim, setResetAnim] = useState<{
    active: boolean;
    start: Particle[];
    target: Particle[];
    startTime: number;
  } | null>(null);

  const requestRef = useRef<number>(0);
  const draggingId = useRef<number | null>(null);
  const mousePosRef = useRef<Vector2>({ x: 0, y: 0 }); 
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef<boolean>(false);
  const particlesRef = useRef(particles);
  const panStartRef = useRef<Vector2 | null>(null);
  
  // Trail History: Map<ParticleID, Array<Vector2>>
  const trailsRef = useRef<Map<number, Vector2[]>>(new Map());
  
  // Prediction Verification System
  const simFrameRef = useRef(0);
  const predictionHistoryRef = useRef<Map<number, Record<number, Vector2>>>(new Map());

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  useEffect(() => {
    const currentParticles = particlesRef.current;
    
    // Heuristic: It is the "same scene" ONLY if count matches and first ID matches
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


  // Helper: Distance
  const dist = (a: Vector2, b: Vector2) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

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

    let currentParticles = [...particles];
    let newInteractions: Interaction[] = [];
    let totalPredEnergy = 0;
    let totalPosEnergy = 0;
    
    // --- Prediction Accuracy Verification Logic ---
    simFrameRef.current++;
    const currentFrame = simFrameRef.current;
    let historyError = 0;

    // Update Trails - Record positions
    if (currentFrame % 2 === 0) { // Record every 2 frames for smoother trails
        currentParticles.forEach(p => {
            if (!trailsRef.current.has(p.id)) {
                trailsRef.current.set(p.id, []);
            }
            const trail = trailsRef.current.get(p.id)!;
            trail.push({ ...p.pos });
            if (trail.length > 25) trail.shift(); // Keep last 25 points
        });
    }

    if (config.showGhosts) {
        const PREDICTION_FRAMES = 60; // Check accuracy at 1 second (approx 60 frames)
        const targetFrame = currentFrame + PREDICTION_FRAMES;

        // 1. Record CURRENT Kinematic predictions for the future (Force-aware & Damped)
        const currentPredictions: Record<number, Vector2> = {};
        currentParticles.forEach(p => {
             let predX = p.pos.x;
             let predY = p.pos.y;
             let predVx = p.vel.x;
             let predVy = p.vel.y;
             
             // Assume current force remains relatively constant for the immediate timeframe
             const accX = (p.force?.x || 0) * config.eta_r;
             const accY = (p.force?.y || 0) * config.eta_r;
             
             // Iterative projection
             for(let i = 0; i < PREDICTION_FRAMES; i++) {
                 predVx = predVx * config.damping + accX;
                 predVy = predVy * config.damping + accY;
                 predX += predVx;
                 predY += predVy;
             }
             
             currentPredictions[p.id] = { x: predX, y: predY };
        });
        predictionHistoryRef.current.set(targetFrame, currentPredictions);

        // 2. Validate PAST predictions against current reality
        const pastPredictions = predictionHistoryRef.current.get(currentFrame);
        if (pastPredictions) {
             let totalError = 0;
             let count = 0;
             currentParticles.forEach(p => {
                 const pred = pastPredictions[p.id];
                 if (pred) {
                     const d = dist(p.pos, pred);
                     totalError += d;
                     count++;
                 }
             });
             if (count > 0) historyError = totalError / count;
             predictionHistoryRef.current.delete(currentFrame); 
        }
    } else {
        if (predictionHistoryRef.current.size > 0) predictionHistoryRef.current.clear();
    }
    // ---------------------------------------------


    // 1. Calculate Interactions
    for (let i = 0; i < currentParticles.length; i++) {
      for (let j = i + 1; j < currentParticles.length; j++) {
        const p1 = currentParticles[i];
        const p2 = currentParticles[j];
        const d = dist(p1.pos, p2.pos);

        const phaseTerm = config.phaseEnabled ? Math.max(0, Math.cos(p1.phase - p2.phase)) : 1.0;
        const spinTerm = config.spinEnabled ? (1 + 2.0 * (p1.spin * p2.spin)) : 1.0;
        const spatialDecay = Math.exp(-(d * d) / (config.sigma * config.sigma));
        const coupling = spatialDecay * phaseTerm * spinTerm;

        if (coupling > 0.05) {
          newInteractions.push({
            p1: p1.id,
            p2: p2.id,
            strength: 1.0, 
            distance: d,
            coupling: coupling
          });
        }
      }
    }

    // 2. Apply Forces
    const nextParticles = currentParticles.map(p => {
      if (p.id === draggingId.current) {
        let tx = mousePosRef.current.x;
        let ty = mousePosRef.current.y;
        tx = Math.max(10, Math.min(CANVAS_WIDTH - 10, tx));
        ty = Math.max(10, Math.min(CANVAS_HEIGHT - 10, ty));
        return { ...p, pos: { x: tx, y: ty }, vel: { x: 0, y: 0 }, force: {x:0,y:0}, valVel: 0 };
      }

      if (p.isFixed) return p;

      let forcePos: Vector2 = { x: 0, y: 0 };
      let forceState = 0;
      let phaseDrift = 0;

      const neighbors = newInteractions.filter(int => int.p1 === p.id || int.p2 === p.id);
      
      let predictedState = 0;
      let totalWeight = 0;

      neighbors.forEach(int => {
        const otherId = int.p1 === p.id ? int.p2 : int.p1;
        const other = currentParticles.find(op => op.id === otherId);
        if (!other) return;
        
        // Use coupling for state prediction weight
        const w_ij = int.strength * (config.couplingEnabled ? int.coupling : 1);
        predictedState += w_ij * other.val;
        totalWeight += w_ij;

        const d = int.distance;
        const displacement = d - config.r0;
        const unitX = (p.pos.x - other.pos.x) / d;
        const unitY = (p.pos.y - other.pos.y) / d;
        
        // Spin modulation for physical force (Attraction/Repulsion strength)
        const spinFactor = config.spinEnabled ? (1 + 2.0 * (p.spin * other.spin)) : 1.0;
        
        const forceMag = -config.k * displacement * spinFactor; 
        totalPosEnergy += 0.5 * config.k * (displacement ** 2);

        forcePos.x += forceMag * unitX;
        forcePos.y += forceMag * unitY;

        if (config.phaseEnabled) phaseDrift += 0.05 * Math.sin(other.phase - p.phase);
      });

      if (totalWeight > 0) predictedState /= totalWeight;
      
      const error = p.val - predictedState;
      totalPredEnergy += 0.5 * (error ** 2);

      forceState = -config.eta * error;

      // Use Gaussian noise for more natural Brownian motion
      const noiseX = gaussianRandom() * config.temperature;
      const noiseY = gaussianRandom() * config.temperature;

      // Apply forces and damping
      let newVelX = p.vel.x * config.damping + (forcePos.x * config.eta_r) + noiseX;
      let newVelY = p.vel.y * config.damping + (forcePos.y * config.eta_r) + noiseY;
      
      const newValVel = p.valVel * config.damping + forceState;
      
      const newPhaseVel = phaseDrift + 0.02; 
      const newPhase = (p.phase + newPhaseVel) % (2 * Math.PI);

      let nextX = p.pos.x + newVelX;
      let nextY = p.pos.y + newVelY;

      // Bounce
      const margin = 15;
      if (nextX < margin) { nextX = margin; newVelX *= -0.8; } 
      else if (nextX > CANVAS_WIDTH - margin) { nextX = CANVAS_WIDTH - margin; newVelX *= -0.8; }
      if (nextY < margin) { nextY = margin; newVelY *= -0.8; } 
      else if (nextY > CANVAS_HEIGHT - margin) { nextY = CANVAS_HEIGHT - margin; newVelY *= -0.8; }

      return {
        ...p,
        pos: { x: nextX, y: nextY },
        vel: { x: newVelX, y: newVelY },
        force: forcePos, // Store current force for prediction
        val: p.val + newValVel,
        valVel: newValVel,
        phase: newPhase,
        phaseVel: newPhaseVel 
      };
    });

    return { particles: nextParticles, interactions: newInteractions, energy: { pred: totalPredEnergy, pos: totalPosEnergy, historyError } };
  }, [particles, config, resetAnim]);

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

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent, id: number | null) => {
    if (id !== null) {
        if (interactionMode === 'drag') {
            draggingId.current = id;
            isDragging.current = false;
            if (svgRef.current) {
                const CTM = svgRef.current.getScreenCTM();
                if (CTM) {
                    mousePosRef.current = {
                        x: (e.clientX - CTM.e) / CTM.a,
                        y: (e.clientY - CTM.f) / CTM.d
                    };
                }
            }
            if (!isRunning) requestRef.current = requestAnimationFrame(animate);
        } else {
            draggingId.current = id;
            isDragging.current = false;
        }
    } else {
        panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId.current !== null && svgRef.current) {
      isDragging.current = true;
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        mousePosRef.current = {
            x: (e.clientX - CTM.e) / CTM.a,
            y: (e.clientY - CTM.f) / CTM.d
        };
      }
    } else if (panStartRef.current && svgRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const scale = (CANVAS_WIDTH / zoom) / svgRef.current.clientWidth;
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

  const viewBoxW = CANVAS_WIDTH / zoom;
  const viewBoxH = CANVAS_HEIGHT / zoom;
  const viewBoxX = (CANVAS_WIDTH - viewBoxW) / 2 + pan.x;
  const viewBoxY = (CANVAS_HEIGHT - viewBoxH) / 2 + pan.y;

  return (
    <svg 
      ref={svgRef}
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`} 
      className="w-full h-full bg-[#030303] border border-slate-800 rounded-lg shadow-inner cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={(e) => handleMouseDown(e, null)}
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111827" strokeWidth="1"/>
        </pattern>
        {/* Cyberpunk Glow Filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
             <feMerge>
                 <feMergeNode in="coloredBlur"/>
                 <feMergeNode in="SourceGraphic"/>
             </feMerge>
        </filter>
      </defs>
      
      {/* Background Grid */}
      <rect x={viewBoxX} y={viewBoxY} width={viewBoxW} height={viewBoxH} fill="url(#grid)" />

      {/* Interactions */}
      {interactions.map((int, i) => {
          const opacity = Math.max(0.1, Math.min(1, int.coupling));
          const p1 = particles.find(p => p.id === int.p1);
          const p2 = particles.find(p => p.id === int.p2);
          if (!p1 || !p2) return null;

          return (
            <line 
              key={`${int.p1}-${int.p2}`}
              x1={p1.pos.x} y1={p1.pos.y}
              x2={p2.pos.x} y2={p2.pos.y}
              stroke={COLORS.purple}
              strokeWidth={1 + 2 * opacity}
              strokeOpacity={opacity * 0.8}
              strokeDasharray={opacity < 0.3 ? "4,4" : "0"}
            />
          );
      })}

      {/* Fading Particle Trails (Recent History) */}
      {particles.map(p => {
          const trail = trailsRef.current.get(p.id) || [];
          if (trail.length < 2) return null;
          
          return (
            <g key={`trail-${p.id}`} className="pointer-events-none">
              {trail.map((point, index) => {
                 if (index === 0) return null;
                 const prev = trail[index - 1];
                 const opacity = (index / trail.length) * 0.4; 
                 return (
                   <line 
                     key={index}
                     x1={prev.x} y1={prev.y}
                     x2={point.x} y2={point.y}
                     stroke={p.color}
                     strokeWidth={1.5}
                     strokeOpacity={opacity}
                   />
                 );
              })}
            </g>
          );
      })}

      {/* Ghost Particles (Future Prediction) with Smooth Gradient */}
      {config.showGhosts && particles.map(p => {
          const accX = (p.force?.x || 0) * config.eta_r;
          const accY = (p.force?.y || 0) * config.eta_r;

          let simX = p.pos.x;
          let simY = p.pos.y;
          let simVx = p.vel.x;
          let simVy = p.vel.y;
          
          const ghostSegments: {x1: number, y1: number, x2: number, y2: number, opacity: number}[] = [];
          const ghostMarkers = [];
          const keyframes = [60, 180, 300]; // 1s, 3s, 5s

          let prevX = simX;
          let prevY = simY;

          for (let f = 1; f <= 300; f++) {
              simVx = simVx * config.damping + accX;
              simVy = simVy * config.damping + accY;
              simX += simVx;
              simY += simVy;

              if (f % 5 === 0) {
                 // Opacity decreases into the future
                 const opacity = Math.max(0.05, 0.6 - (f / 300) * 0.6);
                 ghostSegments.push({ x1: prevX, y1: prevY, x2: simX, y2: simY, opacity });
                 prevX = simX;
                 prevY = simY;
              }

              if (keyframes.includes(f)) {
                  ghostMarkers.push({ x: simX, y: simY, t: f/60 });
              }
          }

          return (
            <g key={`ghost-${p.id}`} className="pointer-events-none">
                {/* Predicted Path Segments (Gradient Fading) */}
                {ghostSegments.map((seg, idx) => (
                    <line 
                        key={idx}
                        x1={seg.x1} y1={seg.y1}
                        x2={seg.x2} y2={seg.y2}
                        stroke={p.color}
                        strokeWidth={1}
                        strokeDasharray="2,4"
                        strokeOpacity={seg.opacity}
                    />
                ))}
                
                {/* Ghost Indicators with Pulsing Animation */}
                {ghostMarkers.map((m, i) => {
                    const opacity = 0.8 - (i * 0.2); 
                    const radius = 8 - i * 2;
                    return (
                        <g key={i} opacity={opacity}>
                            <circle 
                                cx={m.x} cy={m.y} 
                                r={radius} 
                                fill="transparent" 
                                stroke={p.color} 
                                strokeWidth={1} 
                                strokeDasharray="2,2"
                                className="animate-pulse"
                            />
                            <text 
                                x={m.x} y={m.y} dy={-radius - 4} 
                                textAnchor="middle" 
                                fontSize="8" 
                                fill={p.color} 
                                fontFamily="monospace"
                            >
                                +{m.t}s
                            </text>
                        </g>
                    );
                })}
            </g>
          );
      })}

      {/* Particles */}
      {particles.map(p => {
        const intensity = Math.min(1, Math.max(0, (p.val + 1) / 2));
        
        let baseColor = p.color;
        if (p.isFixed) {
            baseColor = COLORS.red; 
        } else if (config.spinEnabled) {
             baseColor = p.spin > 0 ? COLORS.green : COLORS.orange;
        }

        const isHovered = hoveredId === p.id;
        const radius = isHovered ? 16 : 12; 
        const phaseX = p.pos.x + (radius + 6) * Math.cos(p.phase);
        const phaseY = p.pos.y + (radius + 6) * Math.sin(p.phase);

        return (
          <g 
            key={p.id} 
            onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, p.id);
            }} 
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: interactionMode === 'drag' ? 'grab' : 'pointer' }}
          >
            {/* Halo */}
            <circle cx={p.pos.x} cy={p.pos.y} r={radius + 13} fill="transparent" stroke="transparent" /> 

            {/* Spin indicator (Visual Arrow) */}
            {config.spinEnabled && (
                <g transform={`translate(${p.pos.x}, ${p.pos.y})`}>
                     {/* Outer Ring */}
                     <circle 
                        r={radius + 4} 
                        stroke={baseColor} 
                        strokeWidth={1} 
                        strokeDasharray={p.spin > 0 ? "0" : "3,2"}
                        fill="none"
                        opacity={0.6}
                    />
                    {/* Spin Direction Arrow */}
                    <path 
                        d={p.spin > 0 ? "M -4 2 L 0 -4 L 4 2" : "M -4 -2 L 0 4 L 4 -2"}
                        stroke={baseColor}
                        strokeWidth={2}
                        fill="none"
                        transform={`translate(${radius + 4 + 4}, 0)`}
                    />
                    <path 
                        d={p.spin > 0 ? "M -4 2 L 0 -4 L 4 2" : "M -4 -2 L 0 4 L 4 -2"}
                        stroke={baseColor}
                        strokeWidth={2}
                        fill="none"
                        transform={`translate(-${radius + 4 + 4}, 0)`}
                    />
                </g>
            )}

            {/* Phase Orbit */}
            {config.phaseEnabled && (
                 <circle cx={p.pos.x} cy={p.pos.y} r={radius + 6} stroke={COLORS.purple} strokeWidth={1} fill="none" opacity={0.5} />
            )}
            
            {/* Main Body with Glow */}
            <circle 
              cx={p.pos.x} 
              cy={p.pos.y} 
              r={radius} 
              fill={baseColor} 
              fillOpacity={0.4 + 0.6 * intensity}
              stroke={COLORS.white}
              strokeWidth={isHovered ? 3 : 2}
              filter="url(#glow)"
            />
            
            {/* State Text */}
            <text x={p.pos.x} y={p.pos.y} dy={4} textAnchor="middle" fontSize="10" fill="white" className="pointer-events-none font-bold drop-shadow-md">
                {p.val.toFixed(1)}
            </text>

            {/* Phase Dot */}
            {config.phaseEnabled && (
                <circle cx={phaseX} cy={phaseY} r={3} fill={COLORS.white} filter="url(#glow)" />
            )}
          </g>
        );
      })}
    </svg>
  );
};