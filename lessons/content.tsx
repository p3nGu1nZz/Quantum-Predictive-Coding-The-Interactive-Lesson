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
    symbols: [],
    explanation: (
      <div className="space-y-8">
        <div className="border-l-4 border-cyan-500 pl-6">
            <h4 className="text-2xl font-bold text-cyan-400 mb-2 cyber-font">Concept Overview</h4>
            <p>
            Imagine a brain where neurons aren't soldered together but float in a conductive fluid. They cannot simply send a signal down a dedicated wire; 
            instead, they must "tune in" to each other like radio transceivers. This is the core of the <strong>L-Group (Local Group) PCN model</strong>.
            </p>
        </div>

        <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">The Limit of Static Networks</h5>
            <p className="mb-4">
                In traditional Artificial Neural Networks (ANNs) and standard Predictive Coding, the architecture is defined <em>a priori</em>. 
                If Node A is connected to Node B, that connection exists forever unless manually pruned. 
                <br/><br/>
                <strong>The Problem:</strong> This rigidity makes adaptation difficult. If the problem space changes (e.g., the input data rotates, or the context shifts), 
                the network must relearn weights on the existing fixed topology. It cannot physically restructure itself to better suit the problem.
            </p>
        </div>

        <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">The Fluid Solution</h5>
            <p className="mb-4">
                In this simulation, we treat nodes as <strong>Particles</strong>. They possess:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong>Position:</strong> They occupy physical space.</li>
                <li><strong>Momentum:</strong> They have mass and velocity.</li>
                <li><strong>State:</strong> They carry information.</li>
            </ul>
            <p className="mt-4">
                Because they are mobile, they can migrate towards data sources that minimize their prediction error. 
                This is "Structural Plasticity" happening in real-time, driven by the laws of thermodynamics rather than a backpropagation algorithm.
            </p>
        </div>
      </div>
    ),
    questions: [
        {
            question: "What is the primary difference between a Standard PCN and an L-Group PCN?",
            options: ["Standard PCNs use fixed wiring; L-Group PCNs use dynamic connections.", "Standard PCNs are faster.", "L-Group PCNs do not use math.", "Standard PCNs use water."],
            correctAnswer: "Standard PCNs use fixed wiring; L-Group PCNs use dynamic connections."
        },
        {
            question: "In this model, how do neurons (particles) primarily connect?",
            options: ["Via static ethernet cables.", "Through dynamic spatial and vibrational coupling.", "By random chance only.", "They do not connect."],
            correctAnswer: "Through dynamic spatial and vibrational coupling."
        }
    ]
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
    symbols: [],
    explanation: (
      <div className="space-y-8">
         <div className="border-l-4 border-purple-500 pl-6">
            <h4 className="text-2xl font-bold text-purple-400 mb-2 cyber-font">The Free Energy Principle (FEP)</h4>
            <p>
                Proposed by neuroscientist Karl Friston, the FEP states that all self-organizing biological agents must minimize the difference between their model of the world and their sensory inputs.
                This difference is called <strong>"Surprise"</strong>, "Prediction Error", or formally, <strong>Variational Free Energy</strong>.
            </p>
         </div>

         <div>
             <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">Thermodynamics vs. Life</h5>
             <p className="mb-4">
                The Second Law of Thermodynamics states that the universe tends toward entropy (disorder/chaos). 
                If you leave a cup of coffee alone, it cools down. If you leave a sandcastle alone, it crumbles.
             </p>
             <p>
                <strong>Life fights back.</strong> A cell maintains its structure. A brain maintains its coherent thoughts. 
                To do this, a system must constantly work to minimize the entropy of its sensory states. It must make the world "predictable".
             </p>
         </div>

         <div>
             <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">The Simulation Goal</h5>
             <p>
                In this step, we initialize a random swarm. It represents a system with <strong>High Entropy</strong>. 
                It has no structure, no predictions, and maximum surprise.
                <br/><br/>
                Throughout this lesson, we will derive the specific equations that allow this "soup" to lower its Free Energy. 
                We are essentially asking: <em>"What are the minimal physical rules required for intelligence to emerge from chaos?"</em>
             </p>
         </div>
      </div>
    ),
    questions: [
        {
            question: "What principle drives the self-organization in this system?",
            options: ["Free Energy Minimization", "Maximum Entropy", "Gravitational Collapse", "Nuclear Fusion"],
            correctAnswer: "Free Energy Minimization"
        },
        {
            question: "What does 'Free Energy' essentially represent in this context?",
            options: ["Electrical power", "Surprise or prediction error", "Heat", "Kinetic motion"],
            correctAnswer: "Surprise or prediction error"
        }
    ]
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
    ],
    explanation: (
      <div className="space-y-8">
         <div className="border-l-4 border-blue-500 pl-6">
            <h4 className="text-2xl font-bold text-blue-400 mb-2 cyber-font">Vector Space Representation</h4>
            <p>
                In a standard graph, a "Node" is an abstract concept. It doesn't really exist "somewhere". 
                In our physics engine, a "Particle" is a concrete vector <InlineMath math="\mathbf{v}_i" /> living in a high-dimensional space.
            </p>
         </div>

         <div>
             <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">Why Hilbert Space?</h5>
             <p className="mb-4">
                A <strong>Hilbert Space</strong> is a generalization of Euclidean space that allows for infinite dimensions. 
                While our simulation is visualized in 2D (for your screen), the math is designed to work in <InlineMath math="\mathcal{H}" />.
             </p>
             <p>
                This allows us to bundle many properties into a single mathematical object:
                <br/>
                <code className="bg-slate-800 p-1 rounded text-cyan-300">Particle_i = [ Position, Velocity, Activation, Phase, Spin ]</code>
             </p>
             <p className="mt-2">
                By treating the state of the particle as a vector in this space, we can use <strong>Linear Algebra</strong> and <strong>Calculus</strong> 
                to determine how it evolves over time.
             </p>
         </div>
      </div>
    ),
    questions: [
        {
            question: "In what mathematical space do the particles reside?",
            options: ["Hilbert Space", "Cartesian Plane", "Euclidean Void", "Vector Field"],
            correctAnswer: "Hilbert Space"
        },
        {
            question: "Why do we model nodes as particles?",
            options: ["To give them physical properties like position and velocity.", "Because it looks cooler.", "To make the simulation slower.", "To remove math from the equation."],
            correctAnswer: "To give them physical properties like position and velocity."
        }
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
    ],
    explanation: (
      <div className="space-y-8">
         <div className="border-l-4 border-yellow-500 pl-6">
            <h4 className="text-2xl font-bold text-yellow-400 mb-2 cyber-font">The "Thought" Variable</h4>
            <p>
                If the particle is the hardware, the Activation State <InlineMath math="x_i" /> is the software.
            </p>
         </div>

         <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">Visual Encoding</h5>
            <p className="mb-4">
                In the visualizer, you see this property as <strong>Brightness</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><span className="text-white font-bold">White/Bright:</span> High Activation (1.0). The neuron is firing strongly.</li>
                <li><span className="text-slate-600 font-bold">Dark/Dim:</span> Low Activation (0.0). The neuron is resting.</li>
            </ul>
         </div>

         <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">Dynamic Evolution</h5>
            <p>
                In standard AI, <InlineMath math="x_i" /> is usually the result of a static calculation: <InlineMath math="x = f(Wx + b)" />.
                <br/>
                In our model, <InlineMath math="x_i" /> is a dynamic variable that has its own velocity. It flows and changes continuously based on the inputs from neighbors.
                It isn't just "set"; it evolves via a differential equation.
            </p>
         </div>
      </div>
    ),
     questions: [
        {
            question: "What does the Activation State (x_i) represent?",
            options: ["The 'thought' or information content.", "The speed of the particle.", "The color of the particle.", "The mass of the particle."],
            correctAnswer: "The 'thought' or information content."
        },
        {
            question: "What is the biological analogy for Activation State?",
            options: ["Membrane potential or firing rate.", "Blood pressure.", "Heart rate.", "DNA sequence."],
            correctAnswer: "Membrane potential or firing rate."
        }
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
    ],
    explanation: (
      <div className="space-y-8">
         <div className="border-l-4 border-purple-500 pl-6">
            <h4 className="text-2xl font-bold text-purple-400 mb-2 cyber-font">Temporal Binding & Synchrony</h4>
            <p>
                Look at the small orbiting satellite dots around the particles. That represents their Phase <InlineMath math="\phi" />.
                Notice they are spinning at different rates.
            </p>
         </div>

         <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">The Binding Problem</h5>
            <p className="mb-4">
                In neuroscience, the <strong>Binding Problem</strong> asks: <em>"How does the brain know that the 'Red' signal and the 'Car' signal belong to the same object, and not the 'Blue' 'Truck' next to it?"</em>
            </p>
            <p className="mb-4">
                One leading theory is <strong>Neural Synchrony</strong>. Neurons representing features of the same object fire at the exact same millisecond (Phase-Locked).
            </p>
         </div>

         <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">Transient Coupling</h5>
            <p>
                In our model, interaction strength is multiplied by <InlineMath math="\cos(\phi_i - \phi_j)" />.
                <br/><br/>
                If two particles are <strong>In Phase</strong> (Aligned), the channel is open (1.0).
                <br/>
                If they are <strong>Out of Phase</strong> (Opposite), the channel is closed (0.0 or negative).
                <br/><br/>
                This allows multiple distinct computations to happen in the exact same physical space without interfering with each other, simply by being on different "frequencies".
            </p>
         </div>
      </div>
    ),
    questions: [
        {
            question: "What condition must be met for two particles to interact?",
            options: ["They must be phase synchronized.", "They must be the same color.", "They must be moving fast.", "They must collide."],
            correctAnswer: "They must be phase synchronized."
        },
        {
            question: "What problem does Synchrony solve in neuroscience?",
            options: ["The Binding Problem", "The Halting Problem", "The Travelling Salesman Problem", "The Energy Crisis"],
            correctAnswer: "The Binding Problem"
        }
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
    ],
    explanation: (
      <div className="space-y-8">
        <h4 className="text-2xl font-bold text-emerald-400 mb-2 cyber-font">Interaction Channels</h4>
        <p>Intrinsic Spin allows for selective interaction based on particle type.</p>
      </div>
    ),
    questions: [
        {
            question: "How is Spin used in this simulation?",
            options: ["As a filter for interaction channels.", "To make particles dizzy.", "To generate gravity.", "To store memory."],
            correctAnswer: "As a filter for interaction channels."
        }
    ]
  },
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
    ],
    explanation: (
        <div className="space-y-8">
            <h4 className="text-2xl font-bold text-cyan-400 mb-2 cyber-font">The Boundary Condition</h4>
            <p>Infinite space prevents pressure build-up. By confining particles, we force interaction.</p>
        </div>
    ),
    questions: [
        {
            question: "Why do we confine particles to a specific space?",
            options: ["To force interaction and build pressure.", "To save RAM.", "To prevent them from escaping the screen.", "Because space is finite."],
            correctAnswer: "To force interaction and build pressure."
        }
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
    ],
    questions: [
        {
            question: "How does interaction strength relate to distance?",
            options: ["It decays as distance increases.", "It gets stronger with distance.", "It is constant.", "It is random."],
            correctAnswer: "It decays as distance increases."
        }
    ]
  },
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
      </>
    ),
    config: p({ k: 0.05, r0: 100 }),
    setup: 'triangle',
    symbols: [
        { symbol: "\\mathbf{\\hat{d}}_{ij}", definition: "Unit Vector", context: "Normalized direction of the bond." }
    ],
    questions: [
        {
            question: "What does the unit vector provide?",
            options: ["The direction of the force.", "The magnitude of the force.", "The color of the force.", "The time of the force."],
            correctAnswer: "The direction of the force."
        }
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
      </>
    ),
    config: p({ k: 0.1, r0: 100, damping: 0.9 }),
    setup: 'chain',
    symbols: [
        { symbol: "V_{ij}", definition: "Interaction Potential", context: "Energy stored in the bond between i and j." }
    ],
    questions: [
        {
            question: "What physical object is the Harmonic Potential similar to?",
            options: ["A spring.", "A magnet.", "A rock.", "A string."],
            correctAnswer: "A spring."
        }
    ]
  },
  {
    title: "11. The Hamiltonian",
    content: <p className="text-xl">The total energy of the system is described by the <strong>Hamiltonian</strong>.</p>,
    config: p({ k: 0.1, r0: 100 }),
    setup: 'chain',
    symbols: [],
    questions: [{question: "What represents the total energy?", options: ["Hamiltonian", "Lagrangian", "Newtonian", "Euclidean"], correctAnswer: "Hamiltonian"}]
  },
  {
    title: "12. Force Derivation",
    content: <p className="text-xl">Physical forces are the negative gradient of the potential energy.</p>,
    config: p({ k: 0.1, r0: 100, eta_r: 0.2 }),
    setup: 'random',
    symbols: [],
    questions: [{question: "Force is the negative gradient of what?", options: ["Potential Energy", "Kinetic Energy", "Mass", "Velocity"], correctAnswer: "Potential Energy"}]
  },
  {
    title: "13. Newton's Third Law",
    content: <p className="text-xl">Equal and opposite reaction, conserving momentum.</p>,
    config: p({ k: 0.1, r0: 100, eta_r: 0.2 }),
    setup: 'triangle',
    symbols: [],
  },

  // --- CRITICAL STEP: PREDICTION ---
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
          <em>The faded ghost particles represent the predicted position <InlineMath math="t+1s" /> into the future based on current velocity.</em>
        </p>
      </>
    ),
    config: p({ k: 0.05, eta: 0.05, eta_r: 0, showGhosts: true }),
    setup: 'chain',
    symbols: [
        { symbol: "\\hat{x}_i", definition: "Predicted State", context: "What particle i thinks its value should be." },
        { symbol: "w_{ij}", definition: "Weights", context: "Connection strength from j to i." }
    ],
    explanation: (
       <div className="space-y-8">
         <div className="border-l-4 border-emerald-500 pl-6">
            <h4 className="text-2xl font-bold text-emerald-400 mb-2 cyber-font">The "Ghost" in the Machine</h4>
            <p>
                This step introduces the core of <strong>Predictive Coding</strong>. Each particle acts like a scientist with a hypothesis.
            </p>
         </div>

         <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">What is <InlineMath math="\hat{x}_i" />?</h5>
            <p className="mb-4">
                <InlineMath math="\hat{x}_i" /> (read: "x-hat") is the <strong>Prediction</strong>.
                <br/>
                It is calculated by listening to neighbors. If all your neighbors are shouting "FIRE!", you should probably predict "FIRE!" too.
            </p>
            <p>
               In our equation, <InlineMath math="w_{ij}" /> is the trust or connection strength. The particle sums up the weighted opinions of its neighbors to form its own expectation of what it <em>should</em> be.
            </p>
         </div>

         <div>
            <h5 className="text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-2">Visualizing the Future</h5>
            <p>
                We have enabled <strong>Ghost Particles</strong> in this step.
                <br/>
                The solid particle is where the node IS. The faded ghost is where the node THINKS it will be in 1 second.
            </p>
            <p className="mt-2 text-yellow-400">
                If the ghost is far away from the particle, the system is unstable (High Kinetic Energy / High Error).
                When the ghost overlaps the particle, the prediction is accurate.
            </p>
         </div>
      </div>
    ),
    questions: [
        {
            question: "What does the ghost particle represent?",
            options: ["The predicted future state.", "A dead particle.", "A history trace.", "An error."],
            correctAnswer: "The predicted future state."
        },
        {
            question: "How does a particle predict its state?",
            options: ["Based on its neighbors' states.", "Randomly.", "Based on the user input.", "It doesn't."],
            correctAnswer: "Based on its neighbors' states."
        }
    ]
  },
  
  {
    title: "15. Prediction Error & Free Energy",
    content: (
        <>
            <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
                The difference between reality (sensory input) and prediction is the <strong>Prediction Error</strong>.
                Minimizing this value corresponds to minimizing Free Energy.
            </p>
        </>
    ),
    config: p({ k: 0.05, eta: 0.05, eta_r: 0, showGhosts: true }),
    setup: 'chain',
    symbols: [],
    questions: [
         {
            question: "What creates Prediction Error?",
            options: ["Difference between prediction and reality.", "Too much electricity.", "The code crashing.", "Particles moving too slow."],
            correctAnswer: "Difference between prediction and reality."
        }
    ]
  },
   {
    title: "16. Morphogenesis & Communication",
    content: (
      <>
        <p className="mb-8 text-xl md:text-2xl leading-relaxed text-slate-200">
           <strong>Morphogenesis</strong> is the biological process that causes an organism to develop its shape.
           Here, the shape emerges from the collective effort to minimize error.
        </p>
      </>
    ),
    config: p({ k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, temperature: 0.05, showGhosts: true }),
    setup: 'spin_cluster',
    symbols: [],
    questions: [
        {
            question: "What is Morphogenesis?",
            options: ["The biological development of shape.", "A power ranger.", "A computer virus.", "Cell death."],
            correctAnswer: "The biological development of shape."
        }
    ]
  }
];