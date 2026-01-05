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
        { at: 0, title: "Energy Budget", content: <p>Total Energy = Kinetic + Potential. The system must pay for every movement.</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>The system is governed by a <strong>Hamiltonian Operator</strong> <InlineMath math="H" /> (Eq 5), representing total system energy:</p>
            <MathBlock title="Hamiltonian">{'H = \\underbrace{\\sum \\frac{p_i^2}{2m}}_{Kinetic} + \\underbrace{\\sum V_{ij}}_{Potential}'}</MathBlock>
            <p>This enforces <strong>Conservation of Energy</strong>. High potential energy (Confusion/Error) is converted into Kinetic Energy (Exploration). This momentum allows the system to crash through barriers and escape local minima—using the energy of its own confusion to find the solution. It's not just optimization; it's ballistics.</p>
        </div>}
    ],
    config: p({ damping: 0.99 }), setup: 'attractor', symbols: [],
    script: [ 
        { at: 20, type: 'shake', targetId: 'all', duration: 20, label: "High Potential" }, 
        { at: 50, type: 'force', targetId: 'all', vector: {x:3, y:3}, label: "Kinetic Conversion" }, 
        { at: 80, type: 'reset', label: "Ground State" } 
    ],
    narration: "If there is a supreme ruler in this simulation, it is the Hamiltonian. This single quantity represents the Total Energy budget of the system. Because we follow Hamiltonian dynamics, the system cannot just spiral out of control; it has to pay for its movements. It trades energy back and forth between motion and error. When the system is confused, it has high Potential Energy. As it tries to solve the problem, that potential energy is converted into Kinetic Energy—the particles speed up, they fly around, they explore. Then, as they settle into the solution, that motion is dissipated by friction. A learning system *needs* that Kinetic Energy. It needs the momentum to crash through barriers and jump out of the shallow valley of a \"good enough\" answer to find the deep canyon of the \"perfect\" answer. The computation ends when the physics settles."
};