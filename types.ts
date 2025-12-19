export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  pos: Vector2;       // r_i
  vel: Vector2;       // dr_i/dt
  val: number;        // x_i (Internal State/Activation)
  valVel: number;     // dx_i/dt
  phase: number;      // phi_i (Vibrational Phase)
  phaseVel: number;   // dphi/dt
  spin: number;       // s_i (Intrinsic Spin: -0.5 or +0.5)
  isFixed?: boolean;  // For sensory nodes
  color: string;
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
  temperature: number;  // New: Brownian motion / Entropy
  damping: number;
}

export interface SymbolDefinition {
  symbol: string;
  definition: string;
  context: string;
}

export interface LessonStep {
  title: string;
  content: React.ReactNode;
  config: SimulationConfig;
  setup: string;
  symbols: SymbolDefinition[];
}