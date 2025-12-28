import React from 'react';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  pos: Vector2;       // r_i
  vel: Vector2;       // dr_i/dt
  force?: Vector2;    // F_i (Accumulated Force) for prediction
  val: number;        // x_i (Biomass/Energy)
  valVel: number;     // dx_i/dt (Growth Rate)
  predictedVal?: number; // x_hat_i
  phase: number;      // phi_i
  phaseVel: number;   // dphi/dt
  spin: number;       // s_i
  isFixed?: boolean;  
  color: string;
  visible?: boolean;
  scale?: number;     
  colonyId?: number;  // New: To distinguish parent vs offspring colonies
}

export interface Interaction {
  p1: number;
  p2: number;
  strength: number;   // w_ij
  distance: number;   // d_ij
  coupling: number;   // p_ij(t)
}

export interface SimulationConfig {
  k: number;          // Spring stiffness (Cohesion)
  r0: number;         // Equilibrium distance (Cell Size)
  eta: number;        // Growth rate
  eta_r: number;      // Motility
  sigma: number;      // Interaction radius
  couplingEnabled: boolean;
  phaseEnabled: boolean;
  spinEnabled: boolean;
  showGhosts?: boolean;
  temperature: number;
  damping: number;
  // Colony Specifics
  maxColonySize: number;
  growthRateMultiplier: number;
  repulsionStrength: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  apply: (config: SimulationConfig) => SimulationConfig;
}

export interface SymbolDefinition {
  symbol: string;
  definition: string;
  context: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface ScriptedEvent {
  at: number; // 0-100 percentage of narration
  duration?: number;
  type: 'highlight' | 'force' | 'annotate' | 'spawn' | 'pulse' | 'shake' | 'reset' | 'setTab' | 'zoom' | 'pan';
  targetId?: number | 'all' | 'center'; 
  label?: string; 
  vector?: Vector2; 
  value?: number; // Used for generic magnitude or Tab Index
  targetZoom?: number; 
  targetPan?: Vector2;
}

export interface LessonSubsection {
  title: string;
  content: React.ReactNode;
}

export interface LessonStep {
  title: string;
  content: React.ReactNode; // Fallback or summary
  subsections?: LessonSubsection[]; // New: Tabbed content
  config: SimulationConfig;
  setup: string;
  symbols: SymbolDefinition[];
  explanation?: React.ReactNode; 
  narration?: string; 
  questions?: QuizQuestion[]; 
  script?: ScriptedEvent[]; 
}