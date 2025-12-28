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
  val: number;        // x_i (Internal State/Activation)
  valVel: number;     // dx_i/dt
  predictedVal?: number; // x_hat_i (Predicted State)
  phase: number;      // phi_i (Vibrational Phase)
  phaseVel: number;   // dphi/dt
  spin: number;       // s_i (Intrinsic Spin: -0.5 or +0.5)
  isFixed?: boolean;  // For sensory nodes
  color: string;
  visible?: boolean;  // New: For spawning effects
  scale?: number;     // New: For pulsing effects
}

export interface Interaction {
  p1: number;
  p2: number;
  strength: number;   // w_ij
  distance: number;   // d_ij
  coupling: number;   // p_ij(t) - The calculated coupling probability
}

export interface SimulationConfig {
  k: number;          // Spring stiffness
  r0: number;         // Equilibrium distance
  eta: number;        // Learning rate for state
  eta_r: number;      // Learning rate for position
  sigma: number;      // Interaction radius decay
  couplingEnabled: boolean;
  phaseEnabled: boolean;
  spinEnabled: boolean; // New: Toggle spin influence
  showGhosts?: boolean; // New: Toggle future position prediction visualization
  temperature: number;  // New: Brownian motion / Entropy
  damping: number;
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
  at: number; // Percentage 0-100 when this event starts
  duration?: number; // How long it lasts in percentage points (optional)
  type: 'highlight' | 'force' | 'annotate' | 'spawn' | 'pulse' | 'shake' | 'reset';
  targetId?: number | 'all' | 'center'; 
  label?: string; // Text for annotation
  vector?: Vector2; // For force application
  value?: number; // Generic magnitude
}

export interface LessonStep {
  title: string;
  content: React.ReactNode;
  config: SimulationConfig;
  setup: string;
  symbols: SymbolDefinition[];
  explanation?: React.ReactNode; // Extended educational content
  narration?: string; // The text script for the AI narrator
  questions?: QuizQuestion[]; // Pool of questions for the transition quiz
  script?: ScriptedEvent[]; // Timed events synced to narration progress
}
