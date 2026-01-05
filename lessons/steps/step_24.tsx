import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step24: LessonStep = {
    title: "24. Hydrodynamics of Thought",
    content: null,
    subsections: [
        { at: 0, title: "Information Flow", content: <p>Information in this system behaves exactly like a fluid. We define a <strong>Probability Current</strong> density to describe the flow of activation through the network.</p> },
        { at: 30, title: "Conservation Laws", content: <div className="space-y-4">
            <p>This isn't just a metaphor; we strictly enforce the <strong>Continuity Equation</strong>. This equation states that probability cannot be created or destroyed, only moved.</p>
            <MathBlock>{'\\frac{\\partial \\rho}{\\partial t} + \\nabla \\cdot \\mathbf{j} = 0'}</MathBlock>
        </div>},
        { at: 60, title: "The Pipeline", content: <div className="space-y-4">
            <p>If activation disappears from one region, it must flow into another. This allows us to visualize the "cognitive pipeline" like a plumbing system.</p>
            <p>We can look at the flow fields and spot exactly where information flows freely, where it eddies and gets stuck, and where it bottlenecks.</p>
        </div>},
        { at: 85, title: "Engineering Flow", content: <div className="space-y-4">
            <p>We are no longer just analyzing abstract code; we are modeling the <strong>Hydrodynamics of Thought</strong>.</p>
            <p>We can engineer the flow of ideas just as an engineer designs the flow of water through a turbine.</p>
        </div>}
    ],
    config: p({ couplingEnabled: true }), setup: 'fluid_flow', symbols: [],
    script: [ 
        { at: 20, type: 'force', targetId: 'all', vector: {x:2, y:0.5}, label: "Laminar Flow" }, 
        { at: 50, type: 'highlight', targetId: 'all', label: "Flux Density" }, 
        { at: 80, type: 'annotate', label: "Conservation" } 
    ],
    narration: "Information in this system behaves exactly like a fluid. We define a Probability Current density to describe the flow of activation through the network. This isn't just a metaphor; we strictly enforce the Continuity Equation. This equation states that probability cannot be created or destroyed, only moved. If activation disappears from one region, it must flow into another. This allows us to visualize the \"cognitive pipeline\" like a plumbing system. We can look at the flow fields and spot exactly where information flows freely, where it eddies and gets stuck, and where it bottlenecks. We are no longer just analyzing abstract code; we are modeling the Hydrodynamics of Thought. We can engineer the flow of ideas just as an engineer designs the flow of water through a turbine."
};