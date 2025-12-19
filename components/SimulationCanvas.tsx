import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Particle, Interaction, SimulationConfig, Vector2 } from '../types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface SimulationCanvasProps {
  particles: Particle[];
  config: SimulationConfig;
  onUpdate: (particles: Particle[], interactions: Interaction[], energy: { pred: number; pos: number }) => void;
  onSelectParticle: (p: Particle | null) => void;
  isRunning: boolean;
  interactionMode: 'drag' | 'perturb';
  zoom: number;
  pan: Vector2;
  onPan: (p: Vector2) => void;
}

// Box-Muller transform for Gaussian noise distribution
// This provides more realistic Brownian motion than uniform random noise
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
  const mousePosRef = useRef<Vector2>({ x: 0, y: 0 }); // Track mouse pos independently of state
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef<boolean>(false);
  const particlesRef = useRef(particles);
  const panStartRef = useRef<Vector2 | null>(null);

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
           valVel: 0,
           phaseVel: 0.1 
         };
       });
       return { particles: interpolated, interactions: [], energy: { pred: 0, pos: 0 } };
    }

    let currentParticles = [...particles];
    let newInteractions: Interaction[] = [];
    let totalPredEnergy = 0;
    let totalPosEnergy = 0;

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
        return { ...p, pos: { x: tx, y: ty }, vel: { x: 0, y: 0 }, valVel: 0 };
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
        
        const w_ij = int.strength * (config.couplingEnabled ? int.coupling : 1);
        predictedState += w_ij * other.val;
        totalWeight += w_ij;

        const d = int.distance;
        const displacement = d - config.r0;
        const unitX = (p.pos.x - other.pos.x) / d;
        const unitY = (p.pos.y - other.pos.y) / d;
        
        const forceMag = -config.k * displacement; 
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
      // Velocity Verlet-ish integration
      let newVelX = (p.vel.x + forcePos.x * config.eta_r + noiseX) * config.damping;
      let newVelY = (p.vel.y + forcePos.y * config.eta_r + noiseY) * config.damping;
      
      const newValVel = (p.valVel + forceState) * config.damping;
      
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
        val: p.val + newValVel,
        valVel: newValVel,
        phase: newPhase,
        phaseVel: newPhaseVel 
      };
    });

    return { particles: nextParticles, interactions: newInteractions, energy: { pred: totalPredEnergy, pos: totalPosEnergy } };
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

            {/* Spin indicator */}
            {config.spinEnabled && (
                <circle 
                    cx={p.pos.x} cy={p.pos.y} r={radius + 4} 
                    stroke={baseColor} 
                    strokeWidth={2} 
                    strokeDasharray={p.spin > 0 ? "0" : "3,2"}
                    fill="none"
                    opacity={0.8}
                />
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