import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step05: LessonStep = {
    title: "5. Synchronization",
    content: null,
    subsections: [
        { at: 0, title: "Binding", content: <p>Temporal binding via Kuramoto dynamics.</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>How does the brain connect the color "Red" to the shape "Square" without a central processor? This is the <strong>Binding Problem</strong>. Our solution utilizes temporal synchronization derived from the <strong>Kuramoto Model</strong>.</p>
            <MathBlock title="Coupling Probability">{'p_{ij}(t) \\propto \\exp\\left(-\\frac{d_{ij}^2}{\\sigma^2}\\right) \\cos(\\phi_i(t) - \\phi_j(t))'}</MathBlock>
            <p>The term <InlineMath math="\cos(\phi_i - \phi_j)" /> in Equation 26 acts as a gate. Particles can only interact ("talk") when their phases are aligned. This allows the network to form transient, functional coalitions—temporary logic circuits—that exist only as long as the rhythm is maintained, solving the binding problem through time rather than space.</p>
        </div>}
    ],
    config: p({ phaseEnabled: true, couplingEnabled: true }), setup: 'kuramoto_sync', symbols: [],
    script: [ 
        { at: 20, type: 'highlight', targetId: 'all', label: "Random" }, 
        { at: 50, type: 'pulse', targetId: 'all', label: "Resonance" }, 
        { at: 80, type: 'annotate', label: "Synchronized" } 
    ],
    narration: "Now, listen closely to the rhythm. We are entering the domain of Time. One of the greatest mysteries in neuroscience is the \"Binding Problem.\" If one part of your brain sees the color \"red\" and another part sees the shape \"square,\" how do you know you are looking at a \"red square\" and not a \"red circle\" next to a \"blue square\"? The brain has no central switchboard operator connecting these wires. The L-Group solution is elegant: Synchronization. Imagine our particles are like metronomes sitting on a table. At first, they tick randomly. But as they interact, they begin to influence each other. If the \"red\" particle and the \"square\" particle are describing the same object, they will naturally fall into the same rhythm. They lock phases. They start beating together. In our framework, communication is gated by this rhythm. Particles can only \"talk\" to each other when they are in resonance. It’s like pushing a child on a swing—you have to push at the right moment, or your energy is wasted. This allows the network to form temporary, fleeting coalitions of logic that exist only as long as the thought lasts, and then dissolve back into the noise. It is a liquid computer that rewires itself every millisecond, simply by changing the tempo of the song."
};