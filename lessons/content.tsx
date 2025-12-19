import React from 'react';
import { PHYSICS } from '../constants';
import { MathBlock } from '../components/MathBlock';
import { InlineMath } from '../components/InlineMath';
import { SymbolDefinition, LessonStep } from '../types';

// Helper to quickly create basic physics config
const p = (overrides = {}) => ({ ...PHYSICS, ...overrides });

export const LESSON_STEPS: LessonStep[] = [
  // --- SECTION I: INTRO ---
  {
    title: "1. Introduction: The Dynamic Shift",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          Standard predictive coding networks (PCNs) rely on <strong>fixed hierarchical wiring</strong>. 
          While effective, nature rarely works with static cables.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          This framework introduces <strong>L-Group PCNs</strong>: a system where particles (neurons) float in a cavity, connecting dynamically based on 
          vibration, spin, and spatial proximity. It is biomimetic, physics-inspired, and mathematically rigorous.
        </p>
      </>
    ),
    config: p({ couplingEnabled: false }),
    setup: 'swarm',
    symbols: []
  },
  {
    title: "2. The Objective: Self-Organization",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          Can a soup of particles solve problems without a blueprint?
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          The goal is to test if <strong>free energy minimization</strong>—the principle driving brains to reduce surprise—can 
          force a chaotic swarm of particles to self-organize into an intelligent structure.
        </p>
      </>
    ),
    config: p({ k: 0.05, r0: 120, temperature: 0.3 }),
    setup: 'random',
    symbols: []
  },

  // --- SECTION II: METHODOLOGY - PARTICLE REP ---
  {
    title: "3. Methodology: The Particle",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          We model information carriers not as static nodes, but as <strong>Particles</strong> in a 3D Hilbert Space <InlineMath math="\\mathcal{H}" />.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
            Every particle <InlineMath math="i" /> has a fundamental set of properties. The first is <strong>Spatial Position</strong>.
        </p>
      </>
    ),
    config: p({ k: 0, couplingEnabled: false }),
    setup: 'grid',
    symbols: [
        { symbol: "\\mathcal{H}", definition: "Hilbert Space", context: "The mathematical space where state vectors live." },
        { symbol: "\\mathbf{r}_i", definition: "Position Vector", context: "3D coordinates (x, y, z) of particle i." },
        { symbol: "\\mathbb{R}^3", definition: "3D Real Space", context: "The physical cavity dimensions." }
    ]
  },
  {
    title: "4. Activation State",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          The second property is the <strong>Activation State</strong>, <InlineMath math="x_i" />.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This scalar value encodes the "thought" or predictive information of the particle. In a biological neuron, this is analogous to the membrane potential or firing rate.
        </p>
      </>
    ),
    config: p({ k: 0, couplingEnabled: false, temperature: 0.1 }),
    setup: 'grid',
    symbols: [
        { symbol: "x_i", definition: "Activation State", context: "The internal value/prediction of the particle." },
        { symbol: "\\mathbb{R}", definition: "Real Numbers", context: "The set of all possible activation values." }
    ]
  },
  {
    title: "5. Vibrational Phase",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          Particles are not static; they oscillate. The <strong>Vibrational Phase</strong> <InlineMath math="\\phi_i(t)" /> determines the timing of their activity.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This enables <strong>transient coupling</strong>. Particles can only "talk" if they are synchronized in time.
        </p>
      </>
    ),
    config: p({ k: 0, couplingEnabled: false, phaseEnabled: true }),
    setup: 'grid',
    symbols: [
        { symbol: "\\phi_i(t)", definition: "Vibrational Phase", context: "Current angle in the oscillation cycle [0, 2π]." },
        { symbol: "t", definition: "Time", context: "The temporal dimension of evolution." }
    ]
  },
  {
    title: "6. Intrinsic Spin",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          Borrowed from quantum mechanics, <strong>Intrinsic Spin</strong> <InlineMath math="s_i" /> adds a layer of selectivity.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Spin represents a fundamental angular momentum. In our model, it acts as a "channel" or "type" filter for interactions.
        </p>
      </>
    ),
    config: p({ k: 0, couplingEnabled: false, spinEnabled: true }),
    setup: 'spin_cluster',
    symbols: [
        { symbol: "s_i", definition: "Intrinsic Spin", context: "Quantum property taking values {-1/2, +1/2}." }
    ]
  },

  // --- SPATIAL STRUCTURE ---
  {
    title: "7. Spatial Configuration Space",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          We constrain particles to a configuration space <InlineMath math="\\mathcal{H}_s" />.
          Interactions are limited by a spatial boundary <InlineMath math="L" />.
        </p>
        <MathBlock>
             {'\\mathcal{H}_s = \\{ \\mathbf{r}_i \\in \\mathbb{R}^3 \\mid \\|\\mathbf{r}_i\\| < L \\}'}
        </MathBlock>
      </>
    ),
    config: p({ k: 0.01, r0: 200 }),
    setup: 'swarm',
    symbols: [
        { symbol: "\\mathcal{H}_s", definition: "Configuration Space", context: "Subset of Hilbert space for spatial coordinates." },
        { symbol: "L", definition: "Boundary Limit", context: "Maximum size of the system cavity." }
    ]
  },
  {
    title: "8. The Distance Metric",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          Interaction strength decays with distance. We measure separation using the standard Euclidean metric <InlineMath math="d_{ij}" />.
        </p>
        <MathBlock>
             {'d_{ij} = \\sqrt{(x_i - x_j)^2 + (y_i - y_j)^2 + (z_i - z_j)^2}'}
        </MathBlock>
      </>
    ),
    config: p({ k: 0.05, r0: 100 }),
    setup: 'triangle',
    symbols: [
        { symbol: "d_{ij}", definition: "Euclidean Distance", context: "Scalar separation between particle i and j." }
    ]
  },

  // --- INTERACTION POTENTIAL ---
  {
    title: "9. Directional Unit Vector",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          To calculate forces, we need not just the distance, but the <strong>direction</strong> of the interaction.
        </p>
        <MathBlock>
             {'\\mathbf{\\hat{d}}_{ij} = \\frac{\\mathbf{r}_i - \\mathbf{r}_j}{d_{ij}}'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This unit vector <InlineMath math="\\mathbf{\\hat{d}}_{ij}" /> points from particle <InlineMath math="j" /> to particle <InlineMath math="i" />.
        </p>
      </>
    ),
    config: p({ k: 0.05, r0: 100 }),
    setup: 'triangle',
    symbols: [
        { symbol: "\\mathbf{\\hat{d}}_{ij}", definition: "Unit Vector", context: "Normalized direction of the bond." }
    ]
  },
  {
    title: "10. Harmonic Potential Energy",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          We model the structural "glue" using a harmonic potential. This is similar to a spring connecting two atoms.
        </p>
        <MathBlock>
             {'V_{ij} = -k (d_{ij} - r_0) \\mathbf{\\hat{d}}_{ij}'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           It penalizes being too close (repulsion) or too far (attraction) from the equilibrium distance <InlineMath math="r_0" />.
        </p>
      </>
    ),
    config: p({ k: 0.1, r0: 100, damping: 0.9 }),
    setup: 'chain',
    symbols: [
        { symbol: "V_{ij}", definition: "Interaction Potential", context: "Energy stored in the bond between i and j." },
        { symbol: "k", definition: "Stiffness Coefficient", context: "Strength of the spring/bond." },
        { symbol: "r_0", definition: "Equilibrium Separation", context: "Target distance where energy is minimal." }
    ]
  },
  {
    title: "11. The Hamiltonian",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
          The total energy of the system is described by the <strong>Hamiltonian</strong> <InlineMath math="H" />, summing kinetic and potential energy.
        </p>
        <MathBlock>
             {'H = \\sum_i \\frac{p_i^2}{2m} + \\sum_{(i,j) \\in \\mathcal{N}} V_{ij}'}
        </MathBlock>
      </>
    ),
    config: p({ k: 0.1, r0: 100 }),
    setup: 'chain',
    symbols: [
        { symbol: "H", definition: "Hamiltonian", context: "Total energy operator of the system." },
        { symbol: "p_i", definition: "Momentum", context: "Mass times velocity of particle i." },
        { symbol: "\\mathcal{N}", definition: "Neighborhood", context: "Set of interacting pairs." }
    ]
  },

  // --- FORCES ---
  {
    title: "12. Force Derivation",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Physical forces are the negative gradient of the potential energy. This tells the particle which way to move to reduce tension.
        </p>
        <MathBlock>
             {'\\mathbf{F}_{ij} = -\\nabla_{\\mathbf{r}_i} V_{ij} = -k (d_{ij} - r_0) \\mathbf{\\hat{d}}_{ij}'}
        </MathBlock>
      </>
    ),
    config: p({ k: 0.1, r0: 100, eta_r: 0.2 }),
    setup: 'random',
    symbols: [
        { symbol: "\\mathbf{F}_{ij}", definition: "Force Vector", context: "Physical push/pull exerted on particle i by j." },
        { symbol: "\\nabla", definition: "Gradient Operator", context: "Vector derivative in space." }
    ]
  },
  {
    title: "13. Newton's Third Law",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Our derivation ensures <InlineMath math="\\mathbf{F}_{ij} = -\\mathbf{F}_{ji}" />. 
           Every action has an equal and opposite reaction, conserving momentum in the system.
        </p>
      </>
    ),
    config: p({ k: 0.1, r0: 100, eta_r: 0.2 }),
    setup: 'triangle',
    symbols: []
  },

  // --- ACTIVATION DYNAMICS ---
  {
    title: "14. Activation: Making Predictions",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Now we move from physics to intelligence. Each particle attempts to <strong>predict</strong> its own state based on its neighbors.
        </p>
        <MathBlock>
             {'\\hat{x}_i = \\sum_{j \\in \\mathcal{N}(i)} w_{ij} x_j'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           <InlineMath math="\\hat{x}_i" /> is the expectation. If the neighbors are active, I should be active.
        </p>
      </>
    ),
    config: p({ k: 0.05, eta: 0.05, eta_r: 0 }),
    setup: 'chain',
    symbols: [
        { symbol: "\\hat{x}_i", definition: "Predicted State", context: "What particle i thinks its value should be." },
        { symbol: "w_{ij}", definition: "Weights", context: "Connection strength from j to i." }
    ]
  },
  {
    title: "15. Prediction Error",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           The difference between reality (<InlineMath math="x_i" />) and prediction (<InlineMath math="\\hat{x}_i" />) is the <strong>Prediction Error</strong>.
        </p>
        <MathBlock>
             {'\\epsilon_i = x_i - \\hat{x}_i'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           The system always tries to minimize this error to reach a state of "understanding."
        </p>
      </>
    ),
    config: p({ k: 0.05, eta: 0.05, eta_r: 0 }),
    setup: 'chain',
    symbols: [
        { symbol: "\\epsilon_i", definition: "Local Prediction Error", context: "The surprise or mismatch in information." }
    ]
  },
  {
    title: "16. Physical Evolution Equation",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           The position of a particle evolves to satisfy both physical forces and informational needs.
        </p>
        <MathBlock>
             {'\\frac{d\\mathbf{r}_i}{dt} = - \\sum_{j} \\nabla V_{ij} + \\eta \\sum_{j} p_{ij}(t) \\mathbf{r}_j'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           The first term is the spring force. The second term is an <strong>adaptive coupling</strong> that pulls information-relevant particles closer.
        </p>
      </>
    ),
    config: p({ k: 0.05, eta: 0.1, eta_r: 0.1 }),
    setup: 'swarm',
    symbols: [
        { symbol: "\\eta", definition: "Learning Rate", context: "Speed of adaptation." },
        { symbol: "p_{ij}(t)", definition: "Coupling Probability", context: "Time-dependent likelihood of interaction." }
    ]
  },
  {
    title: "17. Global N-Cluster Corrections",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           To prevent local minima, we add a global correction term <InlineMath math="\\mathbf{R}_c" />.
        </p>
        <MathBlock>
             {'\\frac{d\\mathbf{r}_i}{dt} += \\xi \\sum_{c \\in \\mathcal{C}} \\mathbf{R}_c'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This represents long-range feedback from the entire cluster, ensuring the swarm doesn't fragment.
        </p>
      </>
    ),
    config: p({ k: 0.05, eta: 0.1, eta_r: 0.1 }),
    setup: 'swarm',
    symbols: [
        { symbol: "\\xi", definition: "Global Coefficient", context: "Weight of global vs local influence." },
        { symbol: "\\mathcal{C}", definition: "Cluster Set", context: "Set of all global N-clusters." }
    ]
  },

  // --- DYNAMIC COUPLING ---
  {
    title: "18. Dynamic Vibrational Coupling",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           How do we determine <InlineMath math="p_{ij}(t)" />? It's not fixed. It emerges from vibration.
        </p>
        <MathBlock>
             {'p_{ij}(t) \\propto \\exp\\left(-\\frac{d_{ij}^2}{\\sigma^2}\\right) \\cos(\\phi_i - \\phi_j)'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This equation rewards proximity (Gaussian decay) and <strong>Phase Alignment</strong> (Cosine similarity).
        </p>
      </>
    ),
    config: p({ k: 0.02, phaseEnabled: true }),
    setup: 'random',
    symbols: [
        { symbol: "\\sigma", definition: "Decay Parameter", context: "Effective radius of interaction." },
        { symbol: "\\cos(\\Delta \\phi)", definition: "Phase Synchrony", context: "1 if aligned, -1 if anti-aligned." }
    ]
  },
  {
    title: "19. Dynamic Tanh (DyT) Activation",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           To sharpen the synchronization, we wrap the phase difference in a non-linear activation function.
        </p>
        <MathBlock>
             {'\\text{DyT}(x) = \\alpha_2 \\tanh(\\alpha_3 x)'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This acts as a gate, suppressing weak correlations and amplifying strong ones.
        </p>
      </>
    ),
    config: p({ k: 0.02, phaseEnabled: true }),
    setup: 'random',
    symbols: [
        { symbol: "\\alpha", definition: "Scaling Factors", context: "Parameters controlling sensitivity of the gate." }
    ]
  },
  {
    title: "20. Quantum Correction",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           We refine the coupling with a quantum term <InlineMath math="\\Lambda_{ij}" /> based on the de Broglie wavelength.
        </p>
        <MathBlock>
             {'\\Lambda_{ij} = \\exp\\left(-\\frac{|d_{ij} - \\lambda_{dB}|}{\\delta}\\right) \\Psi_{ij}'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Interactions peak when the distance matches the particle's quantum wavelength <InlineMath math="\\lambda_{dB}" />.
        </p>
      </>
    ),
    config: p({ k: 0.02, phaseEnabled: true }),
    setup: 'triangle',
    symbols: [
        { symbol: "\\lambda_{dB}", definition: "de Broglie Wavelength", context: "h/p, the wave nature of matter." },
        { symbol: "\\Psi_{ij}", definition: "Wavefunction Correction", context: "Schrödinger-inspired adjustment." }
    ]
  },

  // --- INTRINSIC SPIN ---
  {
    title: "21. Intrinsic Spin Modulation",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           We further modulate the coupling using <strong>Spin</strong>.
        </p>
        <MathBlock>
             {'p_{ij}(t) \\propto \\dots \\times M(s_i, s_j)'}
        </MathBlock>
        <MathBlock>
             {'M(s_i, s_j) = 1 + \\gamma s_i s_j'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           If <InlineMath math="\\gamma > 0" />, aligned spins interact strongly. Anti-aligned spins decouple.
        </p>
      </>
    ),
    config: p({ k: 0.05, phaseEnabled: true, spinEnabled: true }),
    setup: 'spin_cluster',
    symbols: [
        { symbol: "\\gamma", definition: "Spin Coupling Constant", context: "Strength of the spin effect." }
    ]
  },
  {
    title: "22. Probability Current Density",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Information flow follows the <strong>Probability Current</strong> <InlineMath math="J" />.
        </p>
        <MathBlock>
             {'J = \\frac{\\hbar}{2mi} (\\psi^* \\nabla \\psi - \\psi \\nabla \\psi^*)'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This bridges momentum information and spatial energy transference, enforcing continuity.
        </p>
      </>
    ),
    config: p({ k: 0.05, phaseEnabled: true, spinEnabled: true }),
    setup: 'spin_cluster',
    symbols: [
        { symbol: "J", definition: "Probability Current", context: "Flow of quantum probability." },
        { symbol: "\\hbar", definition: "Reduced Planck Constant", context: "Quantum scale factor." }
    ]
  },

  // --- THEORETICAL FRAMEWORK ---
  {
    title: "23. Theoretical Framework: Free Energy",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           The entire system is governed by a single master equation: the <strong>Free Energy Functional</strong>.
        </p>
        <MathBlock>
             {'F = E_{\\text{pred}} + \\beta E_{\\text{pos}}'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           We minimize <InlineMath math="F" />. It is a trade-off between minimizing prediction error (<InlineMath math="E_{pred}" />) and maintaining structural integrity (<InlineMath math="E_{pos}" />).
        </p>
      </>
    ),
    config: p({ k: 0.08, r0: 120, couplingEnabled: true, phaseEnabled: true, spinEnabled: true }),
    setup: 'swarm',
    symbols: [
        { symbol: "F", definition: "Variational Free Energy", context: "The quantity to be minimized." },
        { symbol: "\\beta", definition: "Balance Coefficient", context: "Weighting of structure vs. information." }
    ]
  },
  {
    title: "24. Prediction Error Energy",
    content: (
      <>
        <MathBlock>
             {'E_{\\text{pred}} = \\sum_i \\frac{1}{2} \\left( x_i - \\sum_{j} w_{ij} x_j \\right)^2'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This term drives the internal states <InlineMath math="x_i" /> to align with their neighbors.
        </p>
      </>
    ),
    config: p({ k: 0.08, r0: 120, couplingEnabled: true }),
    setup: 'swarm',
    symbols: []
  },
  {
    title: "25. Spatial Constraint Energy",
    content: (
      <>
        <MathBlock>
             {'E_{\\text{pos}} = \\sum_{i<j} \\frac{1}{2} k (\\|\\mathbf{r}_i - \\mathbf{r}_j\\| - r_0)^2'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           This term penalizes chaotic arrangements, forcing the swarm into a crystal-like lattice.
        </p>
      </>
    ),
    config: p({ k: 0.15, r0: 100 }),
    setup: 'random',
    symbols: []
  },

  // --- GRADIENT DESCENT ---
  {
    title: "26. Gradient Descent: Internal State",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           We update the system by sliding down the energy surface.
        </p>
        <MathBlock>
             {'\\frac{dx_i}{dt} = -\\frac{\\partial F}{\\partial x_i} + \\eta \\sum p_{ij}(t) x_j'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           The particle adjusts its "thought" (<InlineMath math="x_i" />) to reduce the global error.
        </p>
      </>
    ),
    config: p({ k: 0.05, eta: 0.2 }),
    setup: 'grid',
    symbols: []
  },
  {
    title: "27. Gradient Descent: Position",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Simultaneously, the particle moves physically.
        </p>
        <MathBlock>
             {'\\frac{d\\mathbf{r}_i}{dt} = -\\eta_r \\frac{\\partial F}{\\partial \\mathbf{r}_i}'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           <InlineMath math="\\eta_r" /> controls how fast the swarm adapts its shape.
        </p>
      </>
    ),
    config: p({ k: 0.05, eta_r: 0.2 }),
    setup: 'random',
    symbols: [
        { symbol: "\\eta_r", definition: "Spatial Learning Rate", context: "Speed of physical reconfiguration." }
    ]
  },

  // --- EXPERIMENTS ---
  {
    title: "28. Experiment: System Initialization",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           In our experiments, we initialize <InlineMath math="N" /> particles with random states.
        </p>
        <MathBlock>
            {'\\hat{x}_i = \\sum_{j \\in \\mathcal{N}(i)} w_{ij} x_j'}
        </MathBlock>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Initially, the prediction error is high. The system is in a state of high Free Energy (Chaos).
        </p>
      </>
    ),
    config: p({ k: 0.05, temperature: 0.5 }),
    setup: 'random',
    symbols: []
  },
  {
    title: "29. Experiment: Convergence",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           As time progresses (<InlineMath math="t \\to \\infty" />), the system self-organizes.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Vibrational phases synchronize. Spins align. Positions settle into an energetic minimum. The swarm effectively "learns" the topology of the problem.
        </p>
      </>
    ),
    config: p({ k: 0.08, r0: 100, phaseEnabled: true, spinEnabled: true, temperature: 0.1 }),
    setup: 'swarm',
    symbols: []
  },

  // --- DISCUSSION ---
  {
    title: "30. Discussion: Emergent Behavior",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           The probabilistic influence model ensures connectivity remains flexible.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Unlike fixed neural networks, this system can heal itself, adapt to new boundaries, and solve problems dynamically through physics.
        </p>
      </>
    ),
    config: p({ k: 0.08, r0: 100, phaseEnabled: true, spinEnabled: true }),
    setup: 'swarm',
    symbols: []
  },

  // --- BIO EXTENSION ---
  {
    title: "31. Experiment Phase: Cellular Automata",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           <strong>Application to Human Biology.</strong>
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           We can treat human cells as PCN particles. <InlineMath math="x_i" /> is the bio-electric potential. <InlineMath math="\\phi_i" /> is the metabolic rhythm.
           By modulating the external field, we can guide cell clusters to self-repair.
        </p>
      </>
    ),
    config: p({ k: 0.1, r0: 80, phaseEnabled: true, temperature: 0.1 }),
    setup: 'swarm',
    symbols: [
        { symbol: "Cell_i", definition: "Biological Cell", context: "The agent in the biological simulation." }
    ]
  },
  {
    title: "32. Morphogenesis & Communication",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           <strong>Morphogenesis</strong> is the biological process that causes an organism to develop its shape.
        </p>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           Using the Quantum PCN framework, we can model how cells "vote" on where to build tissue via Gap Junctions (coupling <InlineMath math="p_{ij}" />).
           Diseases like cancer can be viewed as a failure of this predictive coding—a high Free Energy state where cells stop listening to the global cluster.
        </p>
      </>
    ),
    config: p({ k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, temperature: 0.05 }),
    setup: 'spin_cluster',
    symbols: []
  }
];