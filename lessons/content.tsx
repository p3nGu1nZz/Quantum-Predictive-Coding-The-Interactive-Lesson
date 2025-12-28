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
    title: "1. Introduction: The L-Group Framework",
    content: (
      <>
        <p className="mb-8 text-2xl md:text-3xl leading-relaxed text-slate-200">
          Classical AI relies on <strong>fixed architectures</strong>. 
          This is the <strong>L-Group Framework</strong>: a particle-based PCN where intelligence emerges from vibrational coupling.
        </p>
      </>
    ),
    config: p({ couplingEnabled: false }),
    setup: 'swarm',
    symbols: [],
    explanation: (
      <div className="space-y-6 text-xl">
        <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Abstract</h4>
        <p>
            This lesson visualizes the framework presented in <em>"L-Group Predictive Coding Networks with Vibrationally Coupled Particles"</em>.
            Unlike transformers or CNNs which rely on fixed matrices, this model uses a dynamic system of particles in a Lie group-constrained manifold.
        </p>
        <p>
            <strong>Key Concept:</strong> Replacing static weights with dynamic forces. 
            Information is encoded in the particle's state variables:
            <ul className="list-disc list-inside ml-4 mt-2">
                <li>Position (<InlineMath math="r_i" />)</li>
                <li>Activation (<InlineMath math="x_i" />)</li>
                <li>Spin (<InlineMath math="s_i" />)</li>
                <li>Phase (<InlineMath math="\phi_i" />)</li>
            </ul>
        </p>
      </div>
    ),
    narration: "Imagine, if you will, the architecture of a thought. For the last seventy years, we have built artificial intelligence the same way we build our cities: with rigid structures. We lay down foundations of silicon, we erect steel beams of fixed weights, and we pour concrete layers of static logic. We call them Neural Networks, but in truth, they are statues—frozen monuments to the data they were trained on. They are powerful, yes, but they are brittle. They do not flow. They do not breathe. But look at nature. Look at the murmuration of starlings turning in the twilight sky, or the firing of neurons in your own brain as you listen to these words. There is no rigid grid there. There is only fluid, dynamic motion. Today, we are stepping into a new universe of computation—the L-Group Predictive Coding Network. It sounds like a mouthful, but the concept is beautifully simple. We are replacing the skyscraper model of AI with the liquid model. In this framework, we don't wire neurons together; we release them. We treat them as independent particles floating in a high-dimensional mathematical fluid. They are not held in place by addresses in a memory bank; they are held together by relationships, by forces, by the desire to sing in harmony with their neighbors. This is a shift from architecture-based intelligence, where a human engineer draws the blueprints, to physics-based intelligence, where the system organizes itself. You are about to witness a mind that is not built, but grown. A system where the distinction between processing data and moving through space completely dissolves. Welcome to the Liquid Mind.",
  },
  {
    title: "2. The Objective: Order from Chaos",
    content: (
      <>
        <p className="mb-8 text-2xl md:text-3xl leading-relaxed text-slate-200">
          We define a <strong>Free Energy Functional</strong> <InlineMath math="F" /> and let thermodynamics solve the inference problem.
        </p>
        <MathBlock>
            {'F = E_{pred} + \\beta E_{pos}'}
        </MathBlock>
      </>
    ),
    config: p({ k: 0.05, r0: 120 }), 
    setup: 'swarm',
    symbols: [{ symbol: "F", definition: "Free Energy", context: "Eq 21: The quantity to minimize." }],
    explanation: (
        <div className="space-y-6 text-xl">
             <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Variational Free Energy</h4>
             <p>
                 Following <strong>Equation 21</strong> in the theoretical framework, the system minimizes a global quantity <InlineMath math="F" />.
                 It is composed of two terms:
             </p>
             <ul className="list-disc list-inside space-y-2">
                 <li><InlineMath math="E_{pred}" />: The energy cost of prediction errors (Surprise).</li>
                 <li><InlineMath math="E_{pos}" />: The energy cost of spatial constraints (Structural Stress).</li>
             </ul>
             <p>
                 The particles are not "thinking"; they are simply seeking the lowest energy state (equilibrium) of this Hamiltonian system.
             </p>
        </div>
    ),
    narration: "What is the driving force of the universe? In thermodynamics, it’s entropy—the tendency of all things to drift into chaos, to cool down, to scatter. But life? Life is different. Life is a rebellion against entropy. And intelligence is the weapon we use in that fight. In our simulation, this battle is captured by a single, all-encompassing law: the minimization of Variational Free Energy. Think of Free Energy as a measure of Surprise. When you walk into a dark room and bump your shin on a coffee table, that pain is surprise. It’s the difference between your internal model of the room (which said empty space) and the reality (which said table). Your brain hates this. It wants to minimize that error at all costs. In our L-Group framework, we treat this Surprise as a literal, physical landscape. Imagine a vast, misty mountain range. The peaks represent high error, high confusion, high surprise. The valleys represent understanding, clarity, and prediction. Our particles are like rain falling on this landscape. They don't need to be told where to go; gravity does the work. They naturally, inevitably flow downhill, seeking the lowest point in the valley—the ground state of truth. We don't program the solution; we simply define the landscape and let the laws of physics pull the system toward the answer. You are watching a machine solve a complex Bayesian inference problem not by crunching numbers, but by sliding down a hill.",
  },
  {
    title: "3. The Particle: A Vector in Hilbert Space",
    content: (
       <p className="text-2xl text-slate-200">Each node is an element of <InlineMath math="\mathcal{H}" /> with attributes <InlineMath math="\{r_i, x_i, \phi_i, s_i\}" />.</p>
    ),
    config: p({ k: 0, couplingEnabled: false }),
    setup: 'grid',
    symbols: [{ symbol: "\\mathcal{H}", definition: "Hilbert Space", context: "3D State Space" }],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">State Representation (Table I)</h4>
            <p>
                We abstract the neuron into a particle in Hilbert Space.
                As defined in <strong>Table I</strong> of the paper:
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li><InlineMath math="r_i \in \mathbb{R}^3" />: Spatial Position.</li>
                <li><InlineMath math="x_i \in \mathbb{R}" />: Activation State (Predictive Info).</li>
                <li><InlineMath math="\phi_i(t)" />: Vibrational Phase.</li>
                <li><InlineMath math="s_i \in \{-\frac{1}{2}, +\frac{1}{2}\}" />: Intrinsic Spin.</li>
            </ul>
            <p>
                This formalism allows us to apply Hamiltonian dynamics to the evolution of the network.
            </p>
        </div>
    ),
    narration: "Let's zoom in. Past the swarm, past the fluid dynamics, down to the fundamental grain of this reality: The Particle. In a standard neural network, a neuron is just a boring number in a spreadsheet. It sits there, waiting to be multiplied. But here? Here, a neuron is a vibrant, multidimensional entity. It is a citizen of a rich geometry we call Hilbert Space. Think of each particle as a tiny spaceship floating in a void. It has a Position, defined by coordinates in space, which determines who it can talk to and who it can hear. It has an Activation, which acts like the brightness of its engines—how loud it is shouting its current hypothesis. It has a Phase, a rhythmic pulse like a heartbeat, determining the timing of its communication. And it has an Intrinsic Spin, a quantum mechanical property that acts like a team jersey or a radio frequency, distinguishing it from different types of particles. By treating the neuron as a physical object with mass, momentum, and spin, we unlock the entire toolkit of modern physics. We can apply the Schrödinger equation—the same math that governs how electrons orbit an atom—to describe how a thought evolves in a mind. We are no longer just coding; we are doing cognitive physics.",
  },
  { 
      title: "4. Activation: The Spark of Thought", 
      content: (
        <>
            <p>Evolution of <InlineMath math="x_i" /> via Gradient Descent.</p>
            <MathBlock>{'\\frac{dx_i}{dt} = -\\frac{\\partial F}{\\partial x_i} + \\eta \\sum_{j \\in \\mathcal{N}(i)} p_{ij}(t) x_j'}</MathBlock>
        </>
      ), 
      config: p({ k:0 }), 
      setup: 'grid', 
      symbols: [{symbol: "\\eta", definition: "Learning Rate", context: "Adaptation speed"}], 
      explanation: (
        <div className="space-y-4 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Activation Dynamics (Eq 24)</h4>
            <p>
                The internal state <InlineMath math="x_i" /> evolves according to <strong>Equation 24</strong>. 
                It is driven by two terms:
            </p>
            <ol className="list-decimal list-inside space-y-2">
                <li>The negative gradient of Free Energy (Minimizing Error).</li>
                <li>A vibrational coupling term <InlineMath math="p_{ij}(t)" /> that integrates neighbor information.</li>
            </ol>
            <p>
                Visually, brightness corresponds to magnitude. Positive (White) and Negative (Dark) activations can physically cancel via interference.
            </p>
        </div>
      ),
      narration: "Look at the pulsing light of the nodes. This is Activation. In the digital world of zeros and ones, a bit is a switch. It’s either on or off. But in the physical world, things are rarely so binary. In our L-Group model, activation behaves like a wave on the ocean. It has height, it has power, and most importantly, it has a sign—positive or negative. This is crucial because it allows for the phenomenon of Interference. If you drop two pebbles in a pond, the ripples can pass through each other. Where a crest meets a crest, the wave doubles in size—this is constructive interference, an amplification of a thought. But where a crest meets a trough, they cancel out perfectly, leaving calm water. This is destructive interference. In our network, this allows for a powerful cognitive tool called explaining away. If the brain predicts a sound (a positive wave) and the ear hears that sound (a negative wave), they collide in the vacuum of the simulation and neutralize. Silence means success. Silence means the world is exactly as we expected. The particle's brightness is constantly being pushed and pulled by the force of prediction error, swelling and dimming as it tries to match the reality of the input. It is probability flowing like water." 
  },
  { 
      title: "5. Phase: The Rhythm of Binding", 
      content: <p>Coupling <InlineMath math="\propto \cos(\phi_i(t) - \phi_j(t))" />.</p>, 
      config: p({ k:0, phaseEnabled: true }), 
      setup: 'grid', 
      symbols: [{ symbol: "\\phi_i", definition: "Phase Angle", context: "Oscillation state" }],
      explanation: (
        <div className="space-y-4 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Vibrational Synchrony (Eq 26)</h4>
            <p>
                As described in <strong>Equation 26</strong>, the probability of influence <InlineMath math="p_{ij}(t)" /> is modulated by a cosine term:
                <InlineMath math="\cos(\phi_i(t) - \phi_j(t))" />.
            </p>
            <p>
                This means particles only "talk" when they are phase-aligned (Resonance).
                This solves the <strong>Binding Problem</strong>: features of the same object are bound by temporal synchrony, creating transient functional networks without physical rewiring.
            </p>
        </div>
      ),
      narration: "Now, listen closely to the rhythm. We are entering the domain of Time. One of the greatest mysteries in neuroscience is the Binding Problem. If one part of your brain sees the color red and another part sees the shape square, how do you know you are looking at a red square and not a red circle next to a blue square? The brain has no central switchboard operator connecting these wires. The L-Group solution is elegant: Synchronization. Imagine our particles are like metronomes sitting on a table. At first, they tick randomly. But as they interact, they begin to influence each other. If the red particle and the square particle are describing the same object, they will naturally fall into the same rhythm. They lock phases. They start beating together. In our framework, communication is gated by this rhythm. Particles can only talk to each other when they are in resonance. It’s like pushing a child on a swing—you have to push at the right moment, or your energy is wasted. This allows the network to form temporary, fleeting coalitions of logic that exist only as long as the thought lasts, and then dissolve back into the noise. It is a liquid computer that rewires itself every millisecond, simply by changing the tempo of the song." 
  },
  { 
      title: "6. Spin: The Channel Selector", 
      content: <p>Modulation <InlineMath math="M(s_i, s_j) = 1 + \gamma s_i s_j" />.</p>, 
      config: p({ k:0, spinEnabled: true }), 
      setup: 'spin_cluster', 
      symbols: [{symbol: "s_i", definition: "Intrinsic Spin", context: "Values: ±1/2"}],
      explanation: (
        <div className="space-y-4 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Spin-Modulated Coupling (Eq 18)</h4>
            <p>
                We introduce intrinsic spin <InlineMath math="s_i" />. The interaction is modulated by <InlineMath math="M(s_i, s_j)" /> (See Eq 18).
            </p>
            <p>
                <InlineMath math="1 + \gamma s_i s_j" />:
                If spins are parallel (<InlineMath math="+ +" /> or <InlineMath math="- -" />), coupling is enhanced.
                If anti-parallel (<InlineMath math="+ -" />), coupling is suppressed or repulsive.
            </p>
            <p>
                This allows <strong>Biological Multiplexing</strong>: distinct processing channels (Green vs Orange) occupying the same space without crosstalk.
            </p>
        </div>
      ),
      narration: "Here is where we get truly quantum. We introduce the concept of Spin. In the subatomic world, particles like electrons have a property called spin—often described as up or down. It doesn't mean they are literally spinning like tops, but it defines how they interact with magnetic fields. In our cognitive simulation, we use Spin as a way to create invisible channels of communication. Imagine being in a crowded room where half the people speak English and half speak French. You can stand right next to a French speaker, but if you only speak English, their words pass right through you. You are in the same space, but in different channels. We assign our particles a spin value—Spin Up or Spin Down. Our equations dictate that particles with parallel spins amplifies each other's signal, while particles with opposite spins ignore or even repel each other. This is called Biological Multiplexing. It allows us to layer multiple independent computations on top of each other in the same physical volume. We can process the color of an image on the Up channel and the motion of the image on the Down channel, simultaneously, without the signals ever getting garbled. It’s how the brain packs so much processing power into such a small space." 
  },
  { 
      title: "7. The Cavity: Bounded Infinity", 
      content: <p>Subspace <InlineMath math="\mathcal{H}_s = \{ r_i \in \mathbb{R}^3 \mid \|r_i\| < L \}" />.</p>, 
      config: p({ k:0.01 }), 
      setup: 'swarm', 
      symbols: [{symbol: "L", definition: "Boundary Limit", context: "Characteristic length"}], 
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Configuration Space (Eq 1)</h4>
              <p>
                  As defined in <strong>Equation 1</strong>, the system is constrained to a finite manifold <InlineMath math="L" />.
              </p>
              <p>
                  Reflective boundaries prevent entropy maximization (thermal death). The pressure waves generated by the boundary enforce non-local awareness, ensuring the system remains in a high-energy, interactive state.
              </p>
          </div>
      ),
      narration: "Physics teaches us that infinite space is boring. If you release a gas into an infinite void, the particles just fly away from each other forever. They cool down. They die. Entropy wins. To have structure, you need a container. You need a Cavity. In our simulation, the boundary is not just a limit; it is an active participant. When a particle emits a probability wave, it strikes the wall and reflects back. This creates a standing wave—a pressure field that forces the system to confront itself. This is non-local awareness. A particle on the left 'knows' about the wall on the right because the pressure wave connects them. This mechanism mirrors the biological necessity of cortical folding. The brain is a massive sheet of tissue crinkled into the finite volume of the skull. This folding doesn't just save space; it creates resonance chambers. It forces distant neurons into close proximity, creating 'wormholes' for information. The skull forces the mind to fold in on itself, generating the high-energy density required for consciousness. Creativity, it turns out, requires boundaries." 
  },
  { 
      title: "8. The Metric: Geometry of Influence", 
      content: <p>Euclidean Metric <InlineMath math="d_{ij}" />.</p>, 
      config: p({ k:0.05 }), 
      setup: 'triangle', 
      symbols: [{symbol: "d_{ij}", definition: "Euclidean Distance", context: "Eq 2"}], 
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Spatial Interaction (Eq 2)</h4>
              <p>
                  Interaction strength decays with the Euclidean distance <InlineMath math="d_{ij}" /> (Equation 2).
              </p>
              <p>
                  To increase connection weight <InlineMath math="w_{ij}" />, a particle must physically move closer ($dr/dt$).
                  This transforms "Weight Updates" (Abstract) into "Force-Directed Placement" (Kinetic), grounding the learning process in the geometry of the embedding space.
              </p>
          </div>
      ),
      narration: "How do we measure closeness in a mind? In a social network, you are close to someone if you message them often, even if they live on the other side of the planet. But in the L-Group framework, we take closeness literally. We use a Euclidean Metric. Interaction strength decays with physical distance. This means that if two concepts need to be associated—if Fire implies Hot—the particles representing those concepts must literally, physically move closer together in the embedding space. This is a radical shift. In traditional AI, learning means changing a value in a matrix. It’s an abstract, invisible mathematical operation. Here, learning is Motion. It is a kinetic process. To learn a new pattern, the network must reshape itself. It must morph. It creates a physical geometry that mirrors the logical structure of the data. If you were to look at the shape of the network after training, you would see a physical map of the knowledge it possesses. The topology of the mind takes the shape of the problem it is solving. To understand the data, the network becomes the data." 
  },
  { 
      title: "9. Vector Fields: Directed Thought", 
      content: <p>Force <InlineMath math="F_{ij} = -\nabla_{r_i} V_{ij}" />.</p>, 
      config: p({ k:0.05 }), 
      setup: 'triangle', 
      symbols: [{symbol: "\\hat{d}_{ij}", definition: "Unit Vector", context: "Eq 3: Directionality"}], 
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Force Derivation (Eq 8)</h4>
              <p>
                  Forces are vectors, derived from the gradient of the potential (Equation 8).
                  <InlineMath math="F_{ij} = -k(d_{ij} - r_0)\hat{d}_{ij}" />.
              </p>
              <p>
                  The unit vector <InlineMath math="\hat{d}_{ij}" /> ensures the force has direction. This preserves momentum and allows for vector addition (Superposition), enabling "Force Cancellation" where conflicting evidence neutralizes physically.
              </p>
          </div>
      ),
      narration: "We are not dealing with vague influences here. We are dealing with Vectors. In physics, a vector is a quantity that has both a magnitude (how strong it is) and a direction (where it is going). Every force in this simulation—every urge to predict, every correction of error—is a vector. This is important because scalar numbers (just magnitude) can simply add up to a mess. But vectors? Vectors have geometry. Vectors can oppose each other. Imagine two conflicting pieces of evidence. One says Turn Left, the other says Turn Right. In a simple system, these might average out to Go Straight, which could be disastrous. But in a vector system, the Force North and the Force South can preserve their identities while interacting. They can create tension. They can create a null space where the forces perfectly cancel out, creating a moment of hesitation, a saddle point in the decision landscape. This vector nature prevents information from spreading out like a diffuse gas. Instead, it propagates with intention. It drives the system along specific trajectories, preserving momentum, allowing the thought to carry inertia and direction as it navigates the solution space." 
  },
  { 
      title: "10. The Spring: Elastic Learning", 
      content: (
        <>
            <p>Potential <InlineMath math="\hat{V}_{ij} = \frac{1}{2}k(d_{ij} - r_0)^2 \hat{d}_{ij}" />.</p>
            <MathBlock>{'r_0 = \\text{argmin}_r \\sum_{(i,j)\\in\\mathcal{N}} \\frac{1}{2} k (d_{ij}(r) - r)^2'}</MathBlock>
        </>
      ), 
      config: p({ k:0.1 }), 
      setup: 'chain', 
      symbols: [{symbol: "r_0", definition: "Equilibrium Separation", context: "Eq 6: Optimization param"}],
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Equilibrium Separation (Eq 6 & 7)</h4>
              <p>
                  We use a Harmonic Potential (Equation 7). 
                  <InlineMath math="r_0" /> is not just a constant; it is an optimization parameter.
              </p>
              <p>
                  As described in <strong>Equation 6</strong>, the system minimizes the total potential energy to find the optimal packing distance. This balances attraction (Cohesion) and repulsion (Individuality).
                  The system searches for the perfect packing density that minimizes total tension, analogous to atoms settling into a crystal lattice. This process dynamically finds a comfortable geometric shape that represents the solution, preventing the system from collapsing into a singularity or dispersing into noise.
              </p>
          </div>
      ),
      narration: "At the very heart of our interaction model sits the humble spring. It is the most fundamental object in physics—the Harmonic Oscillator. We model the connection between any two particles not as a rigid beam, but as an elastic spring. The math is simple: the energy scales with the square of the distance from a happy medium, or equilibrium point. If the particles get too close, the spring compresses and pushes them apart. This represents Individuality—it prevents the system from collapsing into a black hole of singularity. If they drift too far apart, the spring stretches and pulls them back together. This represents Cohesion—it keeps the cluster alive. But here is the magic twist: that equilibrium distance is not fixed. The system actively optimizes it. It’s like a spring that can decide how long it wants to be. The network searches for the perfect packing density that minimizes the total tension. It is constantly trying to relax into a crystal-like stability, balancing the forces of attraction and repulsion to find a comfortable geometric shape that represents the answer to your question." 
  },
  { 
      title: "11. The Hamiltonian: Total System Energy", 
      content: <p><InlineMath math="H = \sum \frac{p_i^2}{2m} + \sum_{(i,j)\in\mathcal{N}} V_{ij}" />.</p>, 
      config: p({ k:0.1 }), 
      setup: 'chain', 
      symbols: [{symbol: "H", definition: "Hamiltonian", context: "Eq 5: Total Energy"}], 
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">The Hamiltonian (Eq 5)</h4>
              <p>
                  Equation 5 defines the total energy of the system:
                  <InlineMath math="H = T + V" />.
              </p>
              <p>
                  It sums the <strong>Kinetic Energy</strong> (Momentum) and <strong>Potential Energy</strong> (Interaction/Error).
                  This formulation guarantees stability via Liouville's theorem. The system naturally seeks the lowest energy state (Inference) while using Kinetic energy to escape local minima.
              </p>
          </div>
      ),
      narration: "If there is a supreme ruler in this simulation, a god of the machine, it is the Hamiltonian. In physics, the Hamiltonian represents the Total Energy of a system—the sum of its Kinetic Energy (the energy of motion) and its Potential Energy (the energy of position and structure). This single quantity rules everything you see on the screen. It guarantees stability. Because we follow Hamiltonian dynamics, we adhere to conservation laws. The system cannot just spiral out of control; it has a budget. It trades energy back and forth between motion and error. When the system is confused, it has high Potential Energy (high error). As it starts to solve the problem, that potential energy is converted into Kinetic Energy—the particles speed up, they fly around, they explore. Then, as they settle into the solution, that motion is dissipated by damping (friction) and the system comes to rest. We can track this trade-off precisely. A learning system needs that Kinetic Energy. It needs the momentum to crash through barriers, to escape local traps, to jump out of the shallow valley of a good enough answer and find the deep canyon of the perfect answer. The computation ends when the physics settles." 
  },
  { 
      title: "12. Gradient Descent: Falling Downhill", 
      content: <p>Spatial Update <InlineMath math="\frac{dr_i}{dt} = -\eta_r \frac{\partial F}{\partial r_i}" />.</p>, 
      config: p({ k:0.1 }), 
      setup: 'swarm', 
      symbols: [{symbol: "\\eta_r", definition: "Spatial Adaptation Rate", context: "Eq 25"}],
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Spatial Update Rule (Eq 25)</h4>
              <p>
                  <strong>Equation 25</strong> governs the movement of particles. 
                  The velocity is proportional to the negative gradient of the Free Energy <InlineMath math="F" />.
              </p>
              <p>
                  Unlike Backpropagation (which is global and abstract), this is a local physical force. The particle "feels" the slope of the error landscape and rolls down it. It is gravity for data.
              </p>
          </div>
      ),
      narration: "You are watching a physical manifestation of the most famous algorithm in machine learning: Gradient Descent. In a normal computer, this is a dry calculus operation performed in the dark recesses of a GPU. It calculates the slope of a curve and updates a number. But here? Here, it is Gravity. The spatial update rule dictates that a particle's velocity is proportional to the slope of the error landscape. If a particle is in a state of high error, it feels a steep slope beneath its feet. It accelerates. It rushes down the gradient, picking up speed. As the error decreases, the slope flattens out, and the particle naturally slows down. This Gravity for Data does something remarkable: it localizes the learning rule. A particle doesn't need to know what the billion other particles are doing; it just needs to feel the slope under its own feet. It acts locally to achieve a global goal. This makes the system biologically plausible—neurons in your brain don't have access to a global master plan; they just respond to the chemical gradients in their immediate vicinity. And yet, from this local gravity, global intelligence emerges." 
  },
  { 
      title: "13. Reciprocity: Newton's Law", 
      content: <p><InlineMath math="F_{ij} = -F_{ji}" />.</p>, 
      config: p({ k:0.1 }), 
      setup: 'triangle', 
      symbols: [], 
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Symmetry of Interaction</h4>
              <p>
                  <strong>Newton's Third Law</strong> is satisfied by our Force derivation (Eq 8).
              </p>
              <p>
                  In Predictive Coding terms, this ensures Reciprocity. 
                  Top-Down predictions ($i \to j$) and Bottom-Up errors ($j \to i$) are perfectly balanced forces. 
                  This symmetry creates the "Loop of Consciousness" where perception and prediction mutually constrain each other.
              </p>
          </div>
      ),
      narration: "For every action, there is an equal and opposite reaction. Sir Isaac Newton figured this out for apples and planets three hundred years ago, and today we apply it to thoughts and predictions. Our force equations satisfy Newton's Third Law perfectly. In the context of Predictive Coding, this creates a profound symmetry called Reciprocity. It solves a major problem. In many AI models, data flows one way: from input to output. But in the brain—and in our model—it is a two-way street. While the sensory data (the bottom-up signal) is pushing the internal model to change and adapt to reality, the internal model (the top-down prediction) is pushing back. It is pulling the sensory interpretation towards expectation. We do not just passively see the world; we project our expectations onto it. This creates a loop, a handshake between the world and the mind. If the sensory data is weak (like seeing a shape in the dark), the prediction wins, and we might hallucinate a monster. If the sensory data is strong (broad daylight), the prediction updates, and we learn. This physical tug-of-war is the loop of consciousness." 
  },
  { 
      title: "14. State Update: The Aggregate", 
      content: <p>Mean Field <InlineMath math="\hat{x}_i = \sum_{j \in \mathcal{N}(i)} w_{ij} x_j" />.</p>, 
      config: p({ k:0.05, showGhosts: true }), 
      setup: 'chain', 
      symbols: [{symbol: "\\hat{x}_i", definition: "Predicted State", context: "Eq 27"}], 
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Prediction (Eq 27)</h4>
              <p>
                  As defined in <strong>Equation 27</strong>, the predicted state <InlineMath math="\hat{x}_i" /> is the weighted sum of neighbors.
              </p>
              <p>
                  This represents a <strong>Mean Field Approximation</strong>. The particle aggregates the consensus of its cluster. This filtering mechanism suppresses noise (individual variance) and amplifies signal (collective behavior).
              </p>
          </div>
      ),
      narration: "How does a particle decide what to believe? It takes a poll. The prediction error term in our equations represents a discrepancy between the particle's own state and the consensus of its neighbors. This is known in physics as a Mean Field Approximation. The particle effectively asks, What is everyone around me doing? It aggregates the weighted opinions of its local cluster. If the cluster is shouting Fire!, and the particle is whispering Water, the sheer force of the group's prediction will drag the particle's state toward Fire. This aggregation acts as a powerful noise filter. A single erratic particle screaming nonsense is ignored, drowned out by the collective mass. But if the whole group shifts, the collective state changes. This update rule, combined with the vibrational coupling we discussed earlier, drives the internal state toward a value that minimizes the global prediction error. It is democracy at the atomic level, ensuring that the system converges on a coherent, shared interpretation of the signal, rather than fracturing into a billion individual delusions." 
  },
  { 
      title: "15. Minimizing Surprise", 
      content: <p>Error <InlineMath math="\epsilon_i = x_i - \hat{x}_i" />.</p>, 
      config: p({ k:0.05, showGhosts: true }), 
      setup: 'chain', 
      symbols: [{symbol: "\\epsilon_i", definition: "Prediction Error", context: "Eq 28"}], 
      explanation: (
          <div className="space-y-4 text-xl">
              <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Prediction Error (Eq 28)</h4>
              <p>
                  Equation 28 defines the error: <InlineMath math="\epsilon_i = x_i - \hat{x}_i" />.
              </p>
              <p>
                  The free energy term <InlineMath math="E_{pred}" /> (Eq 22) is the sum of squared errors.
                  The system's imperative is to minimize this value. 
                  High Surprise <InlineMath math="\to" /> High Force <InlineMath math="\to" /> Rapid Learning.
              </p>
          </div>
      ),
      narration: "We return now to the philosophical core of our engine: The Free Energy Principle. In this context, Free Energy is just a physicist's fancy word for Surprise. The variable epsilon in our equations measures the raw difference between what the particle expected to happen and what actually happened. The biological imperative of this entire system—and Karl Friston would argue, the imperative of all life—is to minimize this quantity. Living things want to stay alive, and to stay alive, you need to be able to predict your environment. We want to make the world boring. We want to make it predictable. Computationally, the force acting on a particle is directly proportional to how surprised it is. High surprise generates high force. High force generates rapid movement and drastic reconfiguration. Low surprise generates low force, leading to stability and contentment. You are looking at an engine of prediction that consumes energy to reduce the entropy of its sensory inputs. It is constantly striving, shifting, and dancing to prove its own internal models correct." 
  },
  {
    title: "16. Morphogenesis: Growing a Brain",
    content: (
      <>
        <p className="mb-8 text-2xl md:text-3xl leading-relaxed text-slate-200">
           Dynamic adjustment of <InlineMath math="r_0" /> optimizes density.
        </p>
        <MathBlock>
             {'r_0 = \\text{argmin}_r \\sum_{(i,j)\\in\\mathcal{N}} \\frac{1}{2} k (d_{ij}(r) - r)^2'}
        </MathBlock>
      </>
    ),
    config: p({ k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, temperature: 0.05, showGhosts: true }),
    setup: 'spin_cluster',
    symbols: [],
    explanation: (
        <div className="space-y-6 text-xl">
             <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Network Morphology (Section C)</h4>
             <p>
                 As discussed in <strong>Section C (Equilibrium Separation)</strong>, the parameter <InlineMath math="r_0" /> is dynamic.
             </p>
             <p>
                 The system optimizes <InlineMath math="r_0" /> to balance forces. 
                 Lower <InlineMath math="r_0" /> increases density and coupling strength (Bioelectric Prepatterning).
                 Higher <InlineMath math="r_0" /> expands the system.
                 This is <strong>Morphogenesis</strong>: the hardware evolves to fit the information flow.
             </p>
        </div>
    ),
    narration: "In classical AI, the architecture of the network is a fossil. It is fixed by a human engineer before the software ever runs. The layers are set, the connections are defined. But here, we observe Morphogenesis—the biological development of form. The network grows. It adapts its own body. We discussed the equilibrium separation parameter earlier; well, the system can dynamically adjust this parameter based on local stress. If a region of the network is experiencing high error—high stress—it can contract. It pulls nodes closer together to increase bandwidth and reduce communication latency. It densifies the processing power where it is needed most, like a muscle tensing to lift a heavy weight. Conversely, in areas of low error, it can expand and relax, saving energy. This is Bioelectric Prepatterning. The hardware is evolving in real-time to fit the software. We are not just training a network; we are witnessing the embryogenesis of a connectome, growing and adapting to the challenges we throw at it.",
  },

  {
    title: "17. Emergent Logic: Computing with Geometry",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Logic gates from potential landscapes (Fig 6).
            </p>
        </>
    ),
    config: p({ k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: false, spinEnabled: true }),
    setup: 'logic_gate',
    symbols: [],
    explanation: (
        <div className="space-y-6 text-xl">
             <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Extrapolating Logic from Potentials</h4>
             <p>
                 Based on the <strong>Potential Energy Landscape (Fig 6)</strong>, we can construct logic gates:
             </p>
             <ul className="list-disc list-inside space-y-4">
                 <li><strong>AND Gate:</strong> Uses a high potential barrier (Ref Fig 7, Point B). Requires sum of two inputs to cross.</li>
                 <li><strong>OR Gate:</strong> Uses a bistable equilibrium state (Ref Fig 7, Point A). Tipped by single input.</li>
                 <li><strong>NOT Gate:</strong> Uses spin-based repulsion (anti-parallel spins, Eq 18) to invert signal direction.</li>
             </ul>
        </div>
    ),
    narration: "Can a fluid do logic? Can a swarm of fireflies perform algebra? The answer is Yes, if the geometry is right. While our paper deals with continuous differential equations and flowing probabilities, we can extrapolate digital logic from these analog curves. If we arrange the potential energy landscape correctly, we can build Logic Gates. Imagine a high ridge in the energy landscape that acts like a dam. It requires the combined push of two input particles to overcome the barrier and send water down the other side. That is an AND gate. Imagine a valley with two different entry points, where a single push from either side is enough to roll the ball down. That is an OR gate. Imagine using the repulsive force of anti-aligned spins to flip a signal from up to down. That is a NOT gate. We are building a Turing-complete computer, not out of silicon transistors and copper wire, but out of the topology of the energy landscape itself. The logic is not coded; it is sculpted into the hills and valleys of the physics engine.",
  },
  {
    title: "18. Memory: The Ghost in the Loop",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Recurrence via Momentum Conservation.
            </p>
        </>
    ),
    config: p({ k: 0.15, r0: 80, damping: 0.995, couplingEnabled: true }),
    setup: 'memory_loop',
    symbols: [{ symbol: "p_i", definition: "Momentum", context: "Eq 5: Kinetic Term" }],
    explanation: (
        <div className="space-y-6 text-xl">
             <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Dynamic Attractors</h4>
             <p>
                 The Hamiltonian (Eq 5) includes a Kinetic Energy term <InlineMath math="p_i^2 / 2m" />.
                 This momentum allows signals to cycle in loops (Recurrence).
             </p>
             <p>
                 If damping is low, the signal persists as a "Ghost". This is a <strong>Limit Cycle Attractor</strong> in the phase space, serving as Short-Term Memory.
             </p>
        </div>
    ),
    narration: "Feedforward processing is fast—it's reflex. You touch a hot stove, you pull away. But thinking? Thinking takes time. To hold a thought, to have a memory, to ponder, you need Recurrence. You need a loop. By arranging particles in a cycle, we create a closed trajectory in the phase space. A signal enters the loop and gets trapped, reverberating around and around like a marble spinning in a bowl. Because our Hamiltonian includes a momentum term, the signal carries inertia. It wants to keep moving. As long as the damping (friction) is low, that thought can spin in the void for a long time, echoing the original input. This is a Dynamic Attractor. It is the physical basis of Short-Term Working Memory. It allows the system to bridge the gap between the past and the future, holding a state active even after the sensory input has vanished. It is the ghost in the machine, the echo of the past living in the present geometry.",
  },
  {
    title: "19. Analog Math: Superposition",
    content: (
        <>
             <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Linearity of the Update Rule.
            </p>
            <MathBlock>
                {'\\hat{x}_i = \\sum_{j \\in \\mathcal{N}(i)} w_{ij} x_j'}
            </MathBlock>
        </>
    ),
    config: p({ k: 0.1, r0: 100 }),
    setup: 'adder',
    symbols: [{ symbol: "\\sum", definition: "Superposition", context: "Eq 27" }],
    explanation: (
        <div className="space-y-6 text-xl">
             <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Matrix Multiplication via Physics</h4>
             <p>
                 <strong>Equation 27</strong> (Predicted State) is a summation.
                 In physics, this is Superposition. 
             </p>
             <p>
                 The central node calculates the weighted sum of inputs by settling into equilibrium. 
                 This performs O(1) analog matrix multiplication, limited only by the thermal noise (Ref 35).
             </p>
        </div>
    ),
    narration: "Nature does not do binary arithmetic. Nature does not carry the one. Nature performs mathematics by Superposition. In our prediction equation, the predicted state is simply the summation of weighted inputs. In a digital computer, summing a thousand numbers is a sequential, costly operation—step 1, step 2, step 3. In physics, it is the default state. When a thousand waves hit a beach, they sum up instantly. They don't wait for a CPU cycle. The central node in our network calculates the weighted sum of all its inputs simply by settling into the equilibrium point of the forces acting upon it. This is Analog Computing. It happens in constant time, with infinite precision, limited only by thermal noise. We are harnessing the linearity of wave mechanics to perform massive matrix algebra for free. We are getting the universe to do our homework for us, instantly, just by letting nature take its course.",
  },
  {
    title: "20. Control Theory: The Veto",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Shunting Inhibition via Spin Repulsion.
            </p>
        </>
    ),
    config: p({ k: 0.1, r0: 100, spinEnabled: true }),
    setup: 'control_circuit',
    symbols: [],
    explanation: (
        <div className="space-y-6 text-xl">
             <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Feedforward Inhibition</h4>
             <p>
                 Using <strong>Spin-Modulated Coupling (Eq 18)</strong>, we can create Shunting Inhibition.
             </p>
             <p>
                 A Spin Down cluster (Inhibitory) can exert a repulsive force on the signal path, effectively clamping the output to zero.
                 This acts as a "Veto" or division operation, crucial for control systems (Ref 4).
             </p>
        </div>
    ),
    narration: "Every robust system needs a braking mechanism. A car needs brakes; a nuclear reactor needs control rods; a brain needs inhibition. We demonstrate this with a Feedforward Inhibition circuit. Imagine an excitatory signal—a Go command—rushing down a pathway. Simultaneously, a parallel pathway activates a cluster of Spin Down particles—our Inhibitory units. These particles exert a repulsive force on the main signal path. Mathematically, this acts like division or a shunt. It effectively short-circuits the actuator, clamping the output to zero regardless of how strong the input Go signal is. This is a Veto. It is a crucial architectural component for safety. It proves that mechanically, the power to stop is stronger than the power to go. It allows the system to focus, to select one action and suppress all others, and to shut down dangerous runaway feedback loops before they spiral out of control.",
  },
  {
    title: "21. Hamiltonian Dynamics: The Energy Dance",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                <InlineMath math="H = T + V" /> (Equation 5).
            </p>
            <MathBlock>{'H = \\sum_i \\frac{p_i^2}{2m} + \\sum_{(i,j)\\in\\mathcal{N}} V_{ij}'}</MathBlock>
        </>
    ),
    config: p({ k: 0.05, r0: 120, damping: 0.999, temperature: 0.5 }),
    setup: 'hamiltonian_demo',
    symbols: [{symbol: "T", definition: "Kinetic Energy", context: "Eq 5"}, {symbol: "V", definition: "Potential Energy", context: "Eq 5"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Simulated Annealing</h4>
            <p>
                The <strong>Hamiltonian (Eq 5)</strong> governs the system.
                Kinetic Energy (<InlineMath math="T" />) allows the system to escape local minima in the Free Energy landscape.
            </p>
            <p>
                This acts as a "Temperature", facilitating a physical implementation of <strong>Simulated Annealing</strong> to find the global optimum.
            </p>
        </div>
    ),
    narration: "Watch the energy dance on the screen. As particles rush into a deep valley of error, they pick up speed. They gain Kinetic Energy. They might even overshoot the bottom of the valley and roll up the other side before settling back down. This oscillation is not a bug; it is a vital feature. It represents a Temperature. This kinetic energy allows the system to escape local minima—those shallow little dips in the landscape that represent suboptimal solutions, good enough answers that aren't the best answer. A standard gradient descent algorithm acts like a zombie—it just walks downhill until it gets stuck in a pothole. Our particles act like skateboarders—they have momentum. They can use their speed to roll right out of those shallow traps and keep searching for the true global minimum. It is a physical implementation of Simulated Annealing. We are using the chaos of motion to find the stillness of truth.",
  },
  {
    title: "22. Symmetry: The SO(3) Manifold",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Rotational Invariance via Euclidean Metric.
            </p>
            <MathBlock>{'V_{ij} = V(\\|r_i - r_j\\|)'}</MathBlock>
        </>
    ),
    config: p({ k: 0.2, r0: 80, damping: 0.99 }),
    setup: 'lie_group_symmetry',
    symbols: [{symbol: "SO(3)", definition: "Rotational Group", context: "Symmetry constraint"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Representation Theory (Ref 17-22)</h4>
            <p>
                The paper grounds particles as elements of <InlineMath math="\mathcal{H}" /> yielding representations of the Lorentz group.
            </p>
            <p>
                The interaction potential <InlineMath math="V_{ij}" /> depends only on scalar distance <InlineMath math="d_{ij}" />.
                This implies <strong>SO(3) Symmetry</strong>. The logic is invariant to rotation, solving the Equivariance problem common in CNNs.
            </p>
        </div>
    ),
    narration: "The universe loves symmetry, and so does our network. Our framework is grounded in Representation Theory. We model particles as objects that respect the symmetries of the Lorentz group—the same symmetries that govern relativity and spacetime. Practically, for our simulation, this implies Rotational Invariance. Because our interaction potential depends only on the distance between particles, and not their absolute coordinates on the grid, the logic holds true no matter how you twist it. A triangle is a triangle, whether it points up, down, or sideways. If you rotate the input pattern by 90 degrees, the internal constellation of forces rotates with it, perfectly preserving the relationships between the parts. This grants the system Equivariance. It understands the object itself, not just the pixels on the screen. It knows that a cat is still a cat, even if it is upside down or spinning in zero gravity.",
  },
  {
    title: "23. De Broglie: Matter Waves",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Quantum Correction: <InlineMath math="\Lambda_{ij}" />.
            </p>
            <MathBlock>{'\\Lambda_{ij} = \\exp\\left(-\\frac{|d_{ij} - \\lambda_{dB}|}{\\delta}\\right) \\Psi_{ij}'}</MathBlock>
        </>
    ),
    config: p({ k: 0.1, r0: 100, phaseEnabled: true }),
    setup: 'de_broglie',
    symbols: [{symbol: "\\lambda_{dB}", definition: "Wavelength", context: "Eq 17 & 19"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Equation 17: Quantum Correction</h4>
            <p>
                The coupling is modulated by the term <InlineMath math="\Lambda_{ij}" /> (Eq 17).
                This uses the De Broglie relation <InlineMath math="\lambda = h/p" /> (Eq 19).
            </p>
            <p>
                <strong>High Momentum:</strong> Short Wavelength <InlineMath math="\to" /> Local Coupling.
                <strong>Low Momentum:</strong> Long Wavelength <InlineMath math="\to" /> Global Coupling.
                This is a variable-scope attention mechanism derived from quantum mechanics.
            </p>
        </div>
    ),
    narration: "Now we get truly quantum. We incorporate a correction term based on the De Broglie Wavelength. In quantum mechanics, every particle is also a wave, and its wavelength is inversely proportional to its momentum. Think about what that means. Fast-moving particles have short, frantic wavelengths. Slow, stable particles have long, rolling wavelengths. We use this to modulate coupling. When a particle is moving fast—meaning it has high error, high surprise, and is learning quickly—its wavelength shrinks. It becomes short-sighted. It only talks to its immediate neighbors. It focuses on the local details. When a particle settles down and becomes stable, its wavelength expands. It begins to tunnel across the network, connecting with distant nodes. This acts as an automatic, variable-scope Attention Mechanism. The system focuses on the pixels when it is confused, and integrates the big picture when it is calm.",
  },
  {
    title: "24. Probability Current: The Flow",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Flux of activation density <InlineMath math="J" />.
            </p>
            <MathBlock>{'J = \\frac{\\hbar}{2mi}(\\psi^* \\nabla \\psi - \\psi \\nabla \\psi^*)'}</MathBlock>
        </>
    ),
    config: p({ k: 0.1, r0: 80, phaseEnabled: true }),
    setup: 'probability_current',
    symbols: [{symbol: "J", definition: "Probability Current", context: "Eq 20"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Continuity Equation (Eq 20)</h4>
            <p>
                Information flow is modeled as a <strong>Probability Current</strong> <InlineMath math="J" /> (Eq 20).
            </p>
            <p>
                This formulation, derived from the Schrödinger equation, ensures conservation of information. We can track the flux of activation density to identify bottlenecks in the cognitive pipeline.
            </p>
        </div>
    ),
    narration: "Information in this system behaves like a fluid. We define a Probability Current density to describe the flow of activation through the network. This isn't just a metaphor; we strictly enforce the Continuity Equation derived from the Schrödinger equation. This equation states that probability cannot be created or destroyed, only moved. If activation disappears from one region, it must flow into another. This allows us to visualize the cognitive pipeline like a plumbing system. We can look at the flow fields and spot exactly where information flows freely, where it eddies and gets stuck, and where it bottlenecks. We are no longer just analyzing abstract code; we are modeling the Hydrodynamics of Thought. We can engineer the flow of ideas just as an engineer designs the flow of water through a turbine.",
  },
  {
    title: "25. Dynamic Tanh: The Dilating Pupil",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Adaptive Activation Function (Eq 15).
            </p>
            <MathBlock>{'DyT(x) = \\alpha_2 \\tanh(\\alpha_3 x)'}</MathBlock>
        </>
    ),
    config: p({ k: 0.1, r0: 100, phaseEnabled: true }),
    setup: 'kuramoto_sync',
    symbols: [{symbol: "\\alpha", definition: "Modulation Params", context: "Eq 15"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Homeostasis (Zhu, 2025)</h4>
            <p>
                As referenced in the intro (Ref 3), we use <strong>Dynamic Tanh (Eq 15)</strong>.
            </p>
            <p>
                The parameters <InlineMath math="\alpha_2, \alpha_3" /> adapt to the local energy density.
                This acts as homeostasis (like a pupil dilating), maximizing Fisher Information and preventing saturation in high-energy states.
            </p>
        </div>
    ),
    narration: "Biological neurons are not static switches. They are adaptive. Think of your eye. In a dark room, your pupil dilates to capture every single photon. In bright sunlight, it constricts to prevent you from being blinded. This is Homeostasis. Our activation function does exactly this. It adapts its slope—its sensitivity—based on the local energy density. When the signal is faint, it steepens, increasing gain to amplify whispers. When the signal is loud, it flattens, decreasing gain to prevent saturation. Mathematically, this maximizes Fisher Information. It ensures the neuron is always operating in its most sensitive range, regardless of how loud or quiet the environment is. This allows the network to maintain optimal sensitivity across a massive dynamic range, distinguishing subtle patterns in the noise without getting blinded by the signal.",
  },
  {
    title: "26. Local vs Global: The Conflict",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Error Decomposition (Eq 13).
            </p>
            <MathBlock>{'\\epsilon_i^{local} = r_i - \\hat{r}_i, \\quad \\epsilon_i^{global} = \\sum_{c \\in C} (r_i - R_c)'}</MathBlock>
        </>
    ),
    config: p({ k: 0.1, r0: 100, showGhosts: true }),
    setup: 'global_cluster',
    symbols: [{symbol: "\\epsilon^{global}", definition: "Cluster Error", context: "Eq 13"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Multi-Scale Error (Eq 13)</h4>
            <p>
                <strong>Equation 13</strong> decomposes error into two tiers:
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li><InlineMath math="\epsilon^{local}" />: Neighbor mismatch.</li>
                <li><InlineMath math="\epsilon^{global}" />: Deviation from N-Cluster centroid <InlineMath math="R_c" />.</li>
            </ul>
            <p>
                Balancing these (Eq 11) places the system at <strong>Criticality</strong>, avoiding both Groupthink (Over-smoothness) and Noise (Chaos).
            </p>
        </div>
    ),
    narration: "Every agent in a society faces a dilemma: do I conform to my immediate neighbors, or do I serve the global good? Our particles face the same choice. We decompose the prediction error into two components: a Local Error and a Global Error. The Local Error measures the disagreement with immediate neighbors—peer pressure. The Global Error measures the deviation from the cluster's centroid—the mandate from above. Balancing these two terms puts the system at a state of Criticality. If the local term dominates, you get chaos, noise, and incoherence. If the global term dominates, you get rigid groupthink and a lack of detail. By surfing the edge between these two, the intelligent system maintains enough order to exist, but enough plasticity to adapt. It is the sweet spot of complexity, the edge of chaos where life thrives.",
  },
  {
    title: "27. Gravity: Global Cluster Correction",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Cluster Correction Vector <InlineMath math="R_c" />.
            </p>
            <MathBlock>{'\\frac{dr_i}{dt} \\propto \\sum_{c \\in C} R_c'}</MathBlock>
        </>
    ),
    config: p({ k: 0.1, r0: 100, showGhosts: true }),
    setup: 'global_cluster',
    symbols: [{symbol: "R_c", definition: "Cluster Vector", context: "Eq 10"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Global Correction (Eq 10)</h4>
            <p>
                Equation 10 adds a term <InlineMath math="\xi \sum R_c" /> to the equation of motion.
            </p>
            <p>
                This vector acts like <strong>Gravity</strong>, pulling outliers back to the center of mass of their assigned cluster. 
                In cognitive terms, this is <strong>Top-Down Attention</strong>, ensuring the coherence of the "Self" (Cluster) against dissociation.
            </p>
        </div>
    ),
    narration: "To prevent this swarm of independent agents from drifting apart into the void, we introduce a global correction vector. This term acts as a centripetal force, a specialized Gravity that pulls outliers back towards the center of mass of their assigned cluster. In cognitive terms, this is Top-Down Attention. It is the Self asserting coherence over its parts. The global cluster notices a wandering thought—a disconnected particle drifting away into irrelevance—and gently pulls it back into the main stream of consciousness. It ensures the integrity of the manifold, guaranteeing that even as the system explores and adapts and changes shape, it remains one cohesive entity. It is the glue that holds the mind together.",
  },
  {
    title: "28. Spin Coupling: CDMA",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Multiplexing via Orthogonal Spins.
            </p>
            <MathBlock>{'p_{ij}(t) \\propto \\exp\\left(-\\frac{d_{ij}^2}{\\sigma^2}\\right) \\cos(\\Delta \\phi_{ij}) M(s_i, s_j)'}</MathBlock>
        </>
    ),
    config: p({ k: 0.1, r0: 100, spinEnabled: true }),
    setup: 'spin_cluster',
    symbols: [{symbol: "M", definition: "Spin Modulation", context: "Eq 18"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Equation 18: Spin Modulation</h4>
            <p>
                The coupling probability (Eq 18) includes <InlineMath math="M(s_i, s_j)" />.
            </p>
            <p>
                By assigning orthogonal spins (Spin Up vs Spin Down), we create invisible channels within the same tissue.
                This is analogous to <strong>CDMA (Code Division Multiple Access)</strong> in telecommunications, enabling massively parallel processing without interference.
            </p>
        </div>
    ),
    narration: "How do you process multiple streams of data in the same chunk of tissue without them becoming a garbled mess? We use Spin Coupling. By assigning orthogonal spins to different groups of particles, we create invisible channels. Green particles (Spin Up) interact strongly with other Green particles. Orange particles (Spin Down) interact with other Orange particles. But Green and Orange? They pass right through each other like ghosts. They occupy the same space, but they exist in different realities. This is Code Division Multiple Access (CDMA) for the brain—the same technology your cell phone uses to find your call in a room full of radio waves. It allows us to layer parallel realities within a single computing volume. We can process vision, sound, and memory in the same physical space, at the same time, without interference. It is density through dimensionality.",
  },
  {
    title: "29. Kuramoto: The Moment of Insight",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Measuring synchrony via Order Parameter <InlineMath math="R(t)" />.
            </p>
        </>
    ),
    config: p({ k: 0.0, r0: 100, phaseEnabled: true, couplingEnabled: true }),
    setup: 'kuramoto_sync',
    symbols: [{symbol: "R(t)", definition: "Order Parameter", context: "0 (Chaos) to 1 (Sync)"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Phase Evolution (Table II)</h4>
            <p>
                As described in the <strong>Algorithm (Table II, Step 5)</strong>, phases evolve via a Kuramoto-like sine coupling.
            </p>
            <p>
                The Order Parameter <InlineMath math="R(t)" /> measures global synchrony.
                <InlineMath math="R \approx 1" /> (Locking) represents the "Aha!" moment (Insight).
                We use this to gate learning: "He who syncs, links."
            </p>
        </div>
    ),
    narration: "How do we know when the system has understood something? We measure synchrony. We use the Kuramoto Order Parameter to track the phase alignment of the particles. When the system is confused, the phases are chaotic, random, out of sync. It is noise. The Order Parameter is near zero. But as the system solves the problem, as the error minimizes, something magical happens. The phases begin to lock. A wave of synchronization sweeps through the network. The Order Parameter shoots up to one. This phase transition is the physical correlate of the Aha! moment—the moment of insight. We use this signal to gate learning: we only consolidate memories when the system is synchronized. As the saying goes: He who syncs, links. We only remember the moments where the world made sense.",
  },
  {
    title: "30. Nonlocal Elasticity: The Hive Mind",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                Stiffness enables instant correlation.
            </p>
        </>
    ),
    config: p({ k: 0.2, r0: 120 }),
    setup: 'swarm',
    symbols: [],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Nonlocal Elasticity (Ref 40)</h4>
            <p>
                Because the potential <InlineMath math="V_{ij}" /> creates a stiff, coupled lattice, the system acts as a solid body rather than a gas.
            </p>
            <p>
                A perturbation at the edge travels as a phonon (sound wave) through the potential field, alerting the core almost instantly. 
                This solves the latency problem of deep networks.
            </p>
        </div>
    ),
    narration: "In a gas, if you push a particle, it bumps its neighbor, which bumps the next one. The signal travels slowly, restricted by the speed of sound. But in a solid, if you push one end of a steel rod, the other end moves almost instantly. Our network exhibits Nonlocal Elasticity. Because the potential energy field creates a stiff, coupled lattice, the system acts more like a solid crystal than a diffuse gas. A perturbation at the edge of the network travels as a phonon—a sound wave—through the potential field, alerting the core almost instantly. This explains how a deep biological network can react faster than simple chemical diffusion would allow. The network reacts as a single, rigid body due to the stiffness of the potential field. It is a hive mind where every member feels the touch of the others instantly.",
  },
  {
    title: "31. The 3D Manifold: Higher Dimensions",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                <InlineMath math="\mathcal{H}_s \subset \mathbb{R}^3" /> (Eq 1).
            </p>
        </>
    ),
    config: p({ k: 0.1, r0: 100 }),
    setup: 'hamiltonian_demo',
    symbols: [{symbol: "\\mathbb{R}^3", definition: "3D Space", context: "Eq 1"}],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Dimensionality</h4>
            <p>
                Equation 1 explicitly defines the space as <InlineMath math="\mathbb{R}^3" />.
                The screen shows a 2D slice. 
            </p>
            <p>
                In 3D geometry, we can form <strong>Logic Crystals</strong> with complex, non-crossing pathways.
                Unlike 2D circuits where wires must cross (requiring layers), 3D space allows for knot-like topologies where independent signal loops can interweave without interference. 
                The folding of the human cerebral cortex is essentially nature's way of packing this high-dimensional surface area into the finite volume of the skull, maximizing the adjacency of processing units.
            </p>
        </div>
    ),
    narration: "You are currently viewing a 2D slice of a higher-dimensional reality. The configuration space of our system is mathematically defined in three-dimensional real space, or even higher. In two dimensions, wires cross, pathways get congested, and topology is limited. You can only connect so many things before they overlap. But in 3D? In 3D, we can form Logic Crystals with complex, non-crossing pathways. We can build knots and loops of incredible complexity. The folding of the human cerebral cortex is essentially nature's way of packing this high-dimensional surface area into the finite volume of the skull. The true complexity, and the true power of the L-Group dynamics, exists in the bulk, where geometry allows for infinite connectivity. We are watching the shadows of a hyper-dimensional object dancing on a flat screen.",
  },
  {
    title: "32. Final Synthesis: System Online",
    content: (
        <>
            <p className="mb-6 text-2xl md:text-3xl leading-relaxed text-slate-200">
                <strong>L-Group PCN Complete.</strong> The unification is established.
            </p>
            <div className="flex justify-center mt-4">
                <div className="bg-slate-900 p-6 rounded border border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] text-center">
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cyber-font">SYSTEM ONLINE</h2>
                </div>
            </div>
        </>
    ),
    config: p({ k: 0.1, r0: 100, couplingEnabled: true, phaseEnabled: true, spinEnabled: true, showGhosts: true }),
    setup: 'random',
    symbols: [],
    explanation: (
        <div className="space-y-6 text-xl">
            <h4 className="text-2xl font-bold text-cyan-400 border-b border-cyan-900/50 pb-2">Conclusion</h4>
            <p>
                We have dismantled the rigid, frozen castles of classical AI and replaced them with the liquid, breathing dynamics of the L-Group.
                This represents a paradigm shift from static architectures defined by fixed weights to dynamic, physics-based computation where intelligence emerges from self-organization.
            </p>
            <p>
                The "rigid structure" of the neural network has melted into a "liquid mind" capable of real-time adaptation. The system does not just process; it flows.
            </p>
            <ul className="list-disc list-inside space-y-4 text-slate-300 mt-4">
                <li><strong>Particles</strong> replace Neurons (Physics).</li>
                <li><strong>Fields</strong> replace Weights (Geometry).</li>
                <li><strong>Free Energy</strong> replaces Loss Functions (Thermodynamics).</li>
                <li><strong>Coupling</strong> replaces Wiring (Vibration).</li>
            </ul>
        </div>
    ),
    narration: "We have reached the conclusion of our journey. We have dismantled the rigid, frozen castles of classical AI—the matrices, the layers, the static weights—and we have replaced them with the liquid, breathing dynamics of the L-Group. We have replaced Neurons with Particles. We have replaced Weights with Fields. We have replaced Loss Functions with Thermodynamics. And we have replaced Wiring with Vibration. We have validated the framework proposed in the paper: using vibrational coupling and free energy minimization to drive self-organized learning. The rigid structure has melted into a liquid mind. The system is now online. Thank you for your attention."
  }
];