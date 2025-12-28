import React from 'react';
import { PHYSICS } from '../../constants';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step17: LessonStep = {
    title: "17. Logic Gates",
    content: null,
    subsections: [
        { at: 0, title: "Computation", content: <p>Can a fluid compute? Yes, by sculpting the topology of the potential energy landscape.</p> },
        { at: 40, title: "Geomteric Logic", content: <div className="space-y-4">
            <p>We construct boolean logic (0/1) from continuous physics using <strong>Energy Barriers</strong> in the potential field <InlineMath math="V(\mathbf{r})" />:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>AND Gate:</strong> A high potential ridge requiring the summed kinetic energy of two inputs to surmount.</li>
                <li><strong>OR Gate:</strong> A branching valley where a single input provides sufficient momentum.</li>
            </ul>
            <p>This demonstrates <strong>Turing Completeness</strong> in a fluid substrate. The logic is not written in code; it is carved into the terrain.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'logic_gate', symbols: [],
    script: [ { at: 20, type: 'pulse', targetId: 0, label: "Input A" }, { at: 40, type: 'pulse', targetId: 1, label: "Input B" }, { at: 60, type: 'highlight', targetId: 3, label: "Output" } ],
    narration: "Can a fluid do logic? Can a swarm of fireflies perform algebra? The answer is Yes, if the geometry is right. While our paper deals with continuous differential equations and flowing probabilities, we can extrapolate digital logic from these analog curves. If we arrange the potential energy landscape correctly, we can build Logic Gates. Imagine a high ridge in the energy landscape that acts like a dam. It requires the combined push of two input particles to overcome the barrier and send water down the other side. That is an AND gate. Imagine a valley with two different entry points, where a single push from either side is enough to roll the ball down. That is an OR gate. Imagine using the repulsive force of anti-aligned spins to flip a signal from up to down. That is a NOT gate. We are building a Turing-complete computer, not out of silicon transistors and copper wire, but out of the topology of the energy landscape itself. The logic is not coded; it is sculpted into the hills and valleys of the physics engine."
};