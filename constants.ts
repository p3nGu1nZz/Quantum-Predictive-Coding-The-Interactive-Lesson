import { Upgrade, SimulationConfig } from './types';

// Cyberpunk / Neon Palette
export const COLORS = {
  background: '#050505', // Void
  panelBg: '#0a0a0a',
  blue: '#06b6d4',       // Cyan (Particles)
  yellow: '#facc15',     // Yellow (Highlights/Energy)
  teal: '#2dd4bf',       // Teal (Secondary)
  red: '#f43f5e',        // Neon Pink/Red (Error/High Energy)
  grey: '#475569',       // Slate
  white: '#f8fafc',
  purple: '#d946ef',     // Fuchsia (Phase)
  green: '#10b981',      // Neon Green (Spin Up)
  orange: '#f97316',     // Neon Orange (Spin Down)
  grid: '#1e293b',       // Grid lines
};

export const PHYSICS: SimulationConfig = {
  k: 0.08,
  r0: 60,
  eta: 0.02,
  eta_r: 0.05,
  sigma: 120,
  damping: 0.85, 
  couplingEnabled: true,
  phaseEnabled: false,
  spinEnabled: false,
  showGhosts: false, 
  temperature: 0.3,
  // Colony Defaults
  maxColonySize: 20,
  growthRateMultiplier: 1.0,
  repulsionStrength: 1.0
};

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const UPGRADES: Upgrade[] = [
  {
    id: 'nutrient_inj',
    name: 'Nutrient Injection',
    description: 'Increases cell growth rate by 50%.',
    cost: 100,
    purchased: false,
    apply: (cfg) => ({ ...cfg, growthRateMultiplier: cfg.growthRateMultiplier * 1.5 })
  },
  {
    id: 'colony_cap_1',
    name: 'Expanded Habitat',
    description: 'Increases max colony size by 10 cells.',
    cost: 250,
    purchased: false,
    apply: (cfg) => ({ ...cfg, maxColonySize: cfg.maxColonySize + 10 })
  },
  {
    id: 'membrane_strength',
    name: 'Membrane Reinforcement',
    description: 'Cells repel foreign colonies more strongly.',
    cost: 500,
    purchased: false,
    apply: (cfg) => ({ ...cfg, repulsionStrength: cfg.repulsionStrength * 2.0 })
  },
  {
    id: 'motility_boost',
    name: 'Flagella Boost',
    description: 'Cells move and organize faster.',
    cost: 750,
    purchased: false,
    apply: (cfg) => ({ ...cfg, eta_r: cfg.eta_r * 1.5, damping: 0.9 })
  },
  {
    id: 'colony_cap_2',
    name: 'Mega-Colony Protocols',
    description: 'Doubles maximum colony size.',
    cost: 1500,
    purchased: false,
    apply: (cfg) => ({ ...cfg, maxColonySize: cfg.maxColonySize * 2 })
  }
];