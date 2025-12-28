import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step03: LessonStep = {
    title: "3. The Particle",
    content: null,
    subsections: [
        { at: 0, title: "Components", content: <p>Position, Activation, Phase, Spin.</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>We extend the classical neuron model by embedding it into a 3D Hilbert Space <InlineMath math="\mathcal{H}" />. Each agent in our system is not just a scalar value, but a state vector <InlineMath math="\psi_i" /> (Table I) comprising four distinct physical properties:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Position (<InlineMath math="\mathbf{r}_i \in \mathbb{R}^3" />):</strong> Defines spatial embedding and valid connectivity neighborhoods (Eq 1).</li>
                <li><strong>Activation (<InlineMath math="x_i \in \mathbb{R}" />):</strong> Encodes the predictive information or "hypothesis" strength.</li>
                <li><strong>Phase (<InlineMath math="\phi_i(t)" />):</strong> Governs oscillatory dynamics and temporal binding (Eq 26).</li>
                <li><strong>Spin (<InlineMath math="s_i \in \{-\frac{1}{2}, +\frac{1}{2}\}" />):</strong> Enables quantum-like multiplexing and channel separation (Eq 18).</li>
            </ul>
            <p>This formulation aligns with the <strong>Dirac equation</strong> for spin-½ particles, allowing us to leverage the rich mathematical toolkit of quantum mechanics to describe cognitive evolution.</p>
        </div>}
    ],
    config: p({ couplingEnabled: false }), setup: 'single_particle', symbols: [],
    script: [ 
        { at: 5, type: 'zoom', targetZoom: 2.5 }, 
        { at: 25, type: 'highlight', targetId: 0, label: "Position" }, 
        { at: 45, type: 'pulse', targetId: 0, label: "Activation" }, 
        { at: 65, type: 'highlight', targetId: 0, label: "Phase" }, 
        { at: 85, type: 'annotate', label: "Spin" } 
    ],
    narration: "Let's zoom in. Past the swarm, past the fluid dynamics, down to the fundamental grain of this reality: The Particle. In a standard neural network, a \"neuron\" is just a boring number in a spreadsheet. It sits there, waiting to be multiplied. But here? Here, a neuron is a vibrant, multidimensional entity. It is a citizen of a rich geometry we call Hilbert Space. Think of each particle as a tiny spaceship floating in a void. It has a Position, defined by coordinates in space, which determines who it can talk to and who it can hear. It has an Activation, which acts like the brightness of its engines—how loud it is shouting its current hypothesis. It has a Phase, a rhythmic pulse like a heartbeat, determining the timing of its communication. And it has an Intrinsic Spin, a quantum mechanical property that acts like a team jersey or a radio frequency, distinguishing it from different types of particles. By treating the neuron as a physical object with mass, momentum, and spin, we unlock the entire toolkit of modern physics. We can apply the Schrödinger equation—the same math that governs how electrons orbit an atom—to describe how a thought evolves in a mind. We are no longer just coding; we are doing cognitive physics."
};