import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step01: LessonStep = {
    title: "1. The Liquid Mind",
    content: null,
    subsections: [
        { at: 0, title: "Concept", content: <div className="space-y-4"><p className="text-xl">Replacing the rigid skyscraper model of AI with a fluid, self-organizing liquid model.</p><p>We shift from architecture-based intelligence to physics-based intelligence.</p></div> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>Traditional Neural Networks are architecturally static; they rely on fixed adjacency matrices and frozen weights. This study presents a paradigm shift: the <strong>L-Group Framework</strong>. Here, computation is not a path through a circuit, but a trajectory through a high-dimensional Lie group manifold.</p>
            <p>By integrating Predictive Coding Networks (PCNs) with a particle-based vibrational encoding mechanism, we model neurons not as addresses in memory, but as physical entities with mass, momentum, and spin. These particles self-organize according to the laws of statistical mechanics, finding solutions to inference problems by settling into thermodynamic equilibrium.</p>
            <MathBlock title="Particle State Vector">{'\\psi_i = \\{ \\mathbf{r}_i, x_i, \\phi_i, s_i \\} \\in \\mathcal{H}'}</MathBlock>
            <p>This formulation allows us to treat intelligence as a fluid dynamic process, where "learning" is indistinguishable from physical motion in a continuous symmetry group.</p>
        </div>}
    ],
    config: p({ couplingEnabled: true, k: 0.05 }), setup: 'grid', symbols: [],
    script: [ 
        { at: 1, type: 'reset' }, 
        { at: 15, type: 'shake', targetId: 'all', duration: 10, label: "Rigid Structure" },
        { at: 40, type: 'force', targetId: 'all', vector: {x:0, y:2} }, 
        { at: 60, type: 'spawn', targetId: 'all', duration: 20 },
        { at: 80, type: 'annotate', label: "LIQUID STATE", duration: 15 } 
    ],
    narration: "This introduction sets the stage by contrasting the rigid architectures of traditional AI with the fluid, dynamic nature of the L-Group framework. Imagine, if you will, the architecture of a thought. For the last seventy years, we have built artificial intelligence the same way we build our cities: with rigid structures. We lay down foundations of silicon, we erect steel beams of fixed weights, and we pour concrete layers of static logic. We call them Neural Networks, but in truth, they are statues—frozen monuments to the data they were trained on. They are powerful, yes, but they are brittle. They do not flow. They do not breathe. But look at nature. Look at the murmuration of starlings turning in the twilight sky, or the firing of neurons in your own brain as you listen to these words. There is no rigid grid there. There is only fluid, dynamic motion. Today, we are stepping into a new universe of computation—the L-Group Predictive Coding Network. It sounds like a mouthful, but the concept is beautifully simple. We are replacing the \"skyscraper\" model of AI with the \"liquid\" model. In this framework, we don't wire neurons together; we release them. We treat them as independent particles floating in a high-dimensional mathematical fluid. They are not held in place by addresses in a memory bank; they are held together by relationships, by forces, by the desire to sing in harmony with their neighbors. This is a shift from architecture-based intelligence, where a human engineer draws the blueprints, to physics-based intelligence, where the system organizes itself. You are about to witness a mind that is not built, but grown. A system where the distinction between \"processing data\" and \"moving through space\" completely dissolves. Welcome to the Liquid Mind."
};