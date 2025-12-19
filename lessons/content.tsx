import React from 'react';
import { PHYSICS } from '../constants';
import { MathBlock } from '../components/MathBlock';

export const LESSON_STEPS = [
  {
    title: "1. Introduction",
    content: (
      <>
        <p className="mb-4">Standard predictive coding networks (PCNs) employ fixed hierarchical connections. However, biological and physical systems often exhibit emergent, dynamic connectivity. This lesson explores <strong>L-Group Predictive Coding Networks</strong> with vibrationally coupled particles.</p>
        <p className="mb-4">Inspired by self-organizing principles in computational neuroscience and particle physics, this framework treats neurons as particles in a bounded cavity. These particles possess <strong>spatial position</strong>, <strong>activation state</strong>, <strong>vibrational phase</strong>, and <strong>intrinsic spin</strong>.</p>
        <p><strong>Objective:</strong> Empirically test whether this dynamic system can minimize free energy and self-organize without fixed wiring.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.02, couplingEnabled: false, phaseEnabled: false, temperature: 0.2 },
    setup: 'swarm'
  },
  {
    title: "2. Methodology: Particle State",
    content: (
      <>
        <p className="mb-4">Each particle <span className="font-math">i</span> is characterized by variables defining its configuration in the Hilbert space <span className="font-math">{'\\mathcal{H}'}</span>:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4 text-sm md:text-base">
            <li><strong>Spatial Position</strong> (<span className="font-math">{'\\mathbf{r}_i \\in \\mathbb{R}^3'}</span>): Physical location within the cavity <span className="font-math">{'\\Omega'}</span>.</li>
            <li><strong>Activation State</strong> (<span className="font-math">{'x_i \\in \\mathbb{R}'}</span>): Encodes predictive information.</li>
            <li><strong>Vibrational Phase</strong> (<span className="font-math">{'\\phi_i(t) \\in [0, 2\\pi)'}</span>): Governs transient coupling.</li>
            <li><strong>Intrinsic Spin</strong> (<span className="font-math">{'s_i \\in \\{-\\frac{1}{2}, +\\frac{1}{2}\\}'}</span>): Modulates interactions via quantum-like rules.</li>
        </ul>
      </>
    ),
    config: { ...PHYSICS, k: 0, couplingEnabled: false, phaseEnabled: true, spinEnabled: true, temperature: 0.1 },
    setup: 'grid'
  },
  {
    title: "3. Spatial Interaction Structure",
    content: (
      <>
        <p className="mb-4">To establish structure, we define a configuration space <span className="font-math">{'\\mathcal{H}_s'}</span>. Interaction strength is quantified by the Euclidean distance <span className="font-math">{'d_{ij} = \\|\\mathbf{r}_i - \\mathbf{r}_j\\|'}</span>.</p>
        <p className="mb-2">We also define the unit vector along the separation axis:</p>
        <MathBlock title="Direction Vector">
            {'\\mathbf{\\hat{d}}_{ij} = \\frac{\\mathbf{r}_i - \\mathbf{r}_j}{d_{ij}}'}
        </MathBlock>
        <p>This ensures directionality in force interactions, preventing magnitude alterations and preserving translational invariance.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: false, eta: 0, temperature: 0.1 },
    setup: 'triangle'
  },
  {
    title: "4. Interaction Potential Energy",
    content: (
      <>
         <p className="mb-4">To enforce stability, the system is governed by a harmonic interaction potential <span className="font-math">{'V_{ij}'}</span>. This balances attractive and repulsive forces, similar to molecular bonds.</p>
         <MathBlock title="Normalized Potential Energy">
            {'V_{ij} = \\frac{1}{2} k (d_{ij} - r_0)^2 \\mathbf{\\hat{d}}_{ij}'}
        </MathBlock>
        <p>where <span className="font-math">{'k'}</span> is stiffness and <span className="font-math">{'r_0'}</span> is the equilibrium separation. This drives the system toward a low-energy crystalline morphology.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: false, eta: 0, temperature: 0.05 },
    setup: 'chain'
  },
  {
    title: "5. Force Derivation & Equilibrium",
    content: (
      <>
        <p className="mb-4">Forces are derived from the negative gradient of the potential, ensuring energy conservation and adherence to Newton's third law:</p>
         <MathBlock title="Force Vector">
            {'\\mathbf{F}_{ij} = -\\nabla_{\\mathbf{r}_i} V_{ij} = -k (d_{ij} - r_0) \\mathbf{\\hat{d}}_{ij}'}
        </MathBlock>
        <p>The system seeks an equilibrium separation <span className="font-math">{'r_0'}</span> that minimizes total potential energy across the network cavity.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: false, eta: 0, temperature: 0.05 },
    setup: 'chain'
  },
  {
    title: "6. Activation Dynamics",
    content: (
      <>
        <p className="mb-4">The core of predictive coding is minimizing <strong>Prediction Error</strong>. Each particle predicts its state based on neighbors:</p>
        <MathBlock title="Prediction & Error">
            {'\\hat{x}_i = \\sum_{j \\in \\mathcal{N}(i)} w_{ij} x_j, \\quad \\epsilon_i = x_i - \\hat{x}_i'}
        </MathBlock>
        <p>Global corrections from N-clusters are also integrated to maintain large-scale stability via a global error term <span className="font-math">{'\\epsilon_i^{\\text{global}}'}</span>.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.05, couplingEnabled: true, phaseEnabled: false, eta: 0.1, temperature: 0.1 },
    setup: 'chain'
  },
  {
    title: "7. Dynamic Vibrational Coupling",
    content: (
      <>
        <p className="mb-4">Coupling <span className="font-math">{'p_{ij}'}</span> is probabilistic, depending on <strong>Phase Synchronization</strong>. It uses a Dynamic Tanh (DyT) activation.</p>
        <MathBlock title="Coupling Probability">
             {'p_{ij}(t) \\propto \\exp\\left(-\\frac{d_{ij}^2}{\\sigma^2}\\right) \\cos(\\phi_i - \\phi_j)'}
        </MathBlock>
        <p className="text-sm">This creates emergent connectivity where particles only "talk" if they are synchronized in time and space.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.02, couplingEnabled: true, phaseEnabled: true, eta: 0.05, temperature: 0.1 },
    setup: 'random'
  },
  {
    title: "8. Intrinsic Spin Modulation",
    content: (
      <>
        <p className="mb-4">Intrinsic spin <span className="font-math">{'s_i'}</span> acts as a gate for interactions. Particles with aligned spins couple more strongly.</p>
        <MathBlock title="Spin Modulation">
             {'M(s_i, s_j) = 1 + \\gamma s_i s_j'}
        </MathBlock>
        <p>This adds a quantum-mechanical layer to the self-organization, allowing for spin-selective subnetworks to form.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.03, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, eta: 0.05, temperature: 0.2 },
    setup: 'spin_cluster'
  },
  {
    title: "9. Theoretical Framework: Free Energy",
    content: (
      <>
        <p className="mb-4">The system evolves by minimizing the total <strong>Variational Free Energy (F)</strong>:</p>
        <MathBlock title="Free Energy Functional">
            {'F = E_{\\text{pred}} + \\beta E_{\\text{pos}}'}
        </MathBlock>
        <p>This unifies structural learning (position updates) and inference (state updates) into a single optimization process.</p>
      </>
    ),
    config: { ...PHYSICS, k: 0.08, r0: 120, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, eta: 0.1, eta_r: 0.1, temperature: 0.4 },
    setup: 'swarm'
  },
  {
    title: "10. Gradient Descent Dynamics",
    content: (
      <>
        <p className="mb-4">The system finds the optimal configuration via gradient descent on <span className="font-math">F</span>:</p>
        <MathBlock title="State Update">
            {'\\frac{dx_i}{dt} = -\\frac{\\partial F}{\\partial x_i} + \\eta \\sum p_{ij}(t) x_j'}
        </MathBlock>
        <MathBlock title="Spatial Update">
            {'\\frac{d\\mathbf{r}_i}{dt} = -\\eta_r \\frac{\\partial F}{\\partial \\mathbf{r}_i}'}
        </MathBlock>
      </>
    ),
    config: { ...PHYSICS, k: 0.08, r0: 100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, eta: 0.1, eta_r: 0.1, temperature: 0.3 },
    setup: 'swarm'
  },
  {
    title: "11. Conclusion & Emergence",
    content: (
      <>
        <p className="mb-4">This framework demonstrates that <strong>self-supervised learning</strong> can emerge from simple physical laws. By integrating vibrational synchrony, spin, and spatial dynamics, the system naturally optimizes its structure.</p>
        <div className="mt-6 text-center text-cyan-600 font-bold">
            Explore the final emergent swarm!
        </div>
      </>
    ),
    config: { ...PHYSICS, k: 0.08, r0: 100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, eta: 0.1, eta_r: 0.1, temperature: 0.3 },
    setup: 'random'
  }
];