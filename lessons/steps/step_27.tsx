import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step27: LessonStep = {
    title: "27. Global Correction",
    content: null,
    subsections: [
        { at: 0, title: "Top-Down", content: <p>Centripetal force maintaining the cluster.</p> },
        { at: 40, title: "Manifold Constraints", content: <div className="space-y-4">
            <p>To prevent the swarm from dissipating into the void (increasing entropy), we apply a <strong>Global Constraint</strong>. This acts like a Lagrange Multiplier enforcing the integrity of the manifold.</p>
            <MathBlock>{'\\mathbf{F}_{corr} = -k_{global} (\\mathbf{r}_i - \\mathbf{r}_{cm})'}</MathBlock>
            <p>This "gravity" pulls outliers back to the center of mass (<InlineMath math="\mathbf{r}_{cm}" />). In cognitive terms, this is the <strong>Self</strong> exerting coherence over its parts, ensuring that diverse thoughts remain bound to a single unified consciousness.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'cavity', symbols: [],
    script: [ 
        { at: 15, type: 'force', targetId: 'all', vector: {x: 0, y: 0}, label: "Gravity" }, 
        { at: 40, type: 'highlight', targetId: 'center', label: "The Self" }, 
        { at: 60, type: 'force', targetId: 'all', vector: {x: -1, y: -1}, label: "Correction" }, 
        { at: 90, type: 'annotate', label: "Cohesion" } 
    ],
    narration: "To prevent this swarm of independent agents from drifting apart into the void, we introduce a global correction vector. This term acts as a centripetal force, a specialized Gravity that pulls outliers back towards the center of mass of their assigned cluster. In cognitive terms, this is Top-Down Attention. It is the \"Self\" asserting coherence over its parts. The global cluster notices a wandering thought—a disconnected particle drifting away into irrelevance—and gently pulls it back into the main stream of consciousness. It ensures the integrity of the manifold, guaranteeing that even as the system explores and adapts and changes shape, it remains one cohesive entity. It is the glue that holds the mind together."
};