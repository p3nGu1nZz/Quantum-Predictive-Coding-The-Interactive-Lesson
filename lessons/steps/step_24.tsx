import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step24: LessonStep = {
    title: "24. Probability Current",
    content: null,
    subsections: [
        { at: 0, title: "Flow", content: <p>Information behaves like a fluid.</p> },
        { at: 40, title: "Continuity Equation", content: <div className="space-y-4">
            <p>We model the flow of activation density <span className="font-math">{'\\rho'}</span> and probability current <span className="font-math">{'\\mathbf{j}'}</span> using the <strong>Continuity Equation</strong>:</p>
            <MathBlock>{'\\frac{\\partial \\rho}{\\partial t} + \\nabla \\cdot \\mathbf{j} = 0'}</MathBlock>
            <p>This conservation law ensures that information is never lost, only moved. It allows us to apply <strong>Hydrodynamics</strong> to thought. We can model bottlenecks, eddies, and laminar flow in the cognitive process, treating the mind as a plumbing system for probability.</p>
        </div>}
    ],
    config: p({ couplingEnabled: true }), setup: 'fluid_flow', symbols: [],
    script: [ { at: 10, type: 'pulse', targetId: 0 }, { at: 60, type: 'annotate', label: "Flux" } ],
    narration: "Information in this system behaves like a fluid. We define a Probability Current density to describe the flow of activation through the network. This isn't just a metaphor; we strictly enforce the Continuity Equation derived from the Schrödinger equation. This equation states that probability cannot be created or destroyed, only moved. If activation disappears from one region, it must flow into another. This allows us to visualize the \"cognitive pipeline\" like a plumbing system. We can look at the flow fields and spot exactly where information flows freely, where it eddies and gets stuck, and where it bottlenecks. We are no longer just analyzing abstract code; we are modeling the Hydrodynamics of Thought. We can engineer the flow of ideas just as an engineer designs the flow of water through a turbine."
};