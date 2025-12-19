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

export const PHYSICS = {
  k: 0.1,
  r0: 100,
  eta: 0.05,
  eta_r: 0.05,
  sigma: 100,
  damping: 0.99, // Extremely low damping for persistent oscillations
  couplingEnabled: true,
  phaseEnabled: false,
  spinEnabled: false,
  temperature: 0.6, // High temperature for energetic Brownian motion
};

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;