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
        { at: 0, title: "Zooming In", content: <p>Let's zoom in. Past the swarm, past the fluid dynamics, down to the fundamental grain of this reality: The Particle.</p> },
        { at: 20, title: "Beyond Spreadsheets", content: <p>In a standard neural network, a "neuron" is just a boring number in a spreadsheet. It sits there, waiting to be multiplied. But here? Here, a neuron is a vibrant, multidimensional entity.</p> },
        { at: 40, title: "Hilbert Space", content: <div className="space-y-4">
             <p>It is a citizen of a rich geometry we call Hilbert Space <InlineMath math="\mathcal{H}" />. Think of each particle as a tiny spaceship floating in a void.</p>
             <p>It has a <strong>Position</strong>, defined by coordinates in space, which determines who it can talk to and who it can hear.</p>
        </div>},
        { at: 60, title: "Properties", content: <div className="space-y-4">
             <p>It has an <strong>Activation</strong>, which acts like the brightness of its engines—how loud it is shouting its current hypothesis.</p>
             <p>It has a <strong>Phase</strong>, a rhythmic pulse like a heartbeat, determining the timing of its communication. And it has an <strong>Intrinsic Spin</strong>, a quantum mechanical property that acts like a team jersey or a radio frequency.</p>
        </div>},
        { at: 80, title: "Cognitive Physics", content: <div className="space-y-4">
            <p>By treating the neuron as a physical object with mass, momentum, and spin, we unlock the entire toolkit of modern physics. We can apply the Schrödinger equation to describe how a thought evolves in a mind. We are no longer just coding; we are doing cognitive physics.</p>
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