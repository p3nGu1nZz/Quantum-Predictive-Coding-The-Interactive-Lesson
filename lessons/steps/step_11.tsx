import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step11: LessonStep = {
    title: "11. Hamiltonian Dynamics",
    content: null,
    subsections: [
        { at: 0, title: "Energy", content: <p>Total Energy = Kinetic + Potential</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>The system is governed by a <strong>Hamiltonian Operator</strong> <InlineMath math="H" /> (Eq 5), which represents the total energy of the system as the sum of Kinetic Energy (<InlineMath math="T" />) and Potential Energy (<InlineMath math="V" />):</p>
            <MathBlock title="Hamiltonian">{'H = \\sum \\frac{p_i^2}{2m} + \\sum V_{ij}'}</MathBlock>
            <p>This formulation enforces <strong>Conservation of Energy</strong>. High potential energy (high error) is converted into kinetic energy (movement/exploration). This allows the system to naturally escape shallow local minima—a common trap in gradient descent—by using its accumulated momentum to "roll over" barriers before damping dissipates the energy and settles the system into a true ground state.</p>
        </div>}
    ],
    config: p({ damping: 0.99 }), setup: 'attractor', symbols: [],
    script: [ { at: 10, type: 'force', targetId: 'all', vector: {x:2, y:2} }, { at: 60, type: 'annotate', label: "Conservation" } ],
    narration: "If there is a supreme ruler in this simulation, a god of the machine, it is the Hamiltonian. In physics, the Hamiltonian represents the Total Energy of a system—the sum of its Kinetic Energy (the energy of motion) and its Potential Energy (the energy of position and structure). This single quantity rules everything you see on the screen. It guarantees stability. Because we follow Hamiltonian dynamics, we adhere to conservation laws. The system cannot just spiral out of control; it has a budget. It trades energy back and forth between motion and error. When the system is confused, it has high Potential Energy (high error). As it starts to solve the problem, that potential energy is converted into Kinetic Energy—the particles speed up, they fly around, they explore. Then, as they settle into the solution, that motion is dissipated by damping (friction) and the system comes to rest. We can track this trade-off precisely. A learning system *needs* that Kinetic Energy. It needs the momentum to crash through barriers, to escape local traps, to jump out of the shallow valley of a \"good enough\" answer and find the deep canyon of the \"perfect\" answer. The computation ends when the physics settles."
};