import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step26: LessonStep = {
    title: "26. Criticality",
    content: null,
    subsections: [
        { at: 0, title: "Edge of Chaos", content: <p>Balancing conformity and innovation.</p> },
        { at: 40, title: "Phase Transitions", content: <div className="space-y-4">
            <p>The system balances two error terms: <span className="font-math">{'E_{local}'}</span> (Peer Pressure) and <span className="font-math">{'E_{global}'}</span> (Top-Down Mandate).</p>
            <MathBlock>{'E_{total} = (1-\\lambda)E_{local} + \\lambda E_{global}'}</MathBlock>
            <p>When these forces are balanced, the system sits at a <strong>Critical Point</strong> (a phase transition). Here, correlation length becomes infinite, meaning a small perturbation can cascade through the entire system. This state—the "Edge of Chaos"—is mathematically optimal for computation and adaptation.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'kuramoto_sync', symbols: [],
    script: [ 
        { at: 25, type: 'shake', targetId: 'all', duration: 10, label: "Local Chaos" }, 
        { at: 35, type: 'force', targetId: 'all', vector: {x:0, y:0}, label: "Global Order" }, 
        { at: 55, type: 'highlight', targetId: 'center', label: "Criticality" },
        { at: 75, type: 'pulse', targetId: 'all', label: "Edge of Chaos" } 
    ],
    narration: "Every agent in a society faces a dilemma: do I conform to my immediate neighbors, or do I serve the global good? Our particles face the same choice. We decompose the prediction error into two components: a Local Error and a Global Error. The Local Error measures the disagreement with immediate neighbors—peer pressure. The Global Error measures the deviation from the cluster's centroid—the mandate from above. Balancing these two terms puts the system at a state of Criticality. If the local term dominates, you get chaos, noise, and incoherence. If the global term dominates, you get rigid groupthink and a lack of detail. By surfing the edge between these two, the intelligent system maintains enough order to exist, but enough plasticity to adapt. It is the sweet spot of complexity, the edge of chaos where life thrives."
};