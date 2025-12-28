import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step08: LessonStep = {
    title: "8. Euclidean Learning",
    content: null,
    subsections: [
        { at: 0, title: "Geometry", content: <p>Learning is Motion.</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>The interaction strength in our system is governed by the <strong>Euclidean Distance</strong> <InlineMath math="d_{ij}" /> (Eq 2). This metric is not just a scalar; it defines the topology of the latent space.</p>
            <MathBlock title="Metric">{'d_{ij} = \\sqrt{(x_i - x_j)^2 + (y_i - y_j)^2 + (z_i - z_j)^2}'}</MathBlock>
            <p>In traditional AI, "learning" implies updating a weight matrix—an abstract, invisible operation. In the L-Group framework, learning corresponds to the physical minimization of <InlineMath math="d_{ij}" /> between associated concepts. If "Fire" and "Heat" are correlated, the particles representing them must physically move closer together. This transforms abstract statistical correlations into concrete geometric proximity, turning the learning process into a kinetic simulation of particles aggregating into knowledge crystals.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'grid', symbols: [],
    script: [ 
        { at: 25, type: 'highlight', targetId: 'all', label: "Distance" }, 
        { at: 50, type: 'force', targetId: 'all', vector: {x:-1, y:-1}, label: "Learning" }, 
        { at: 80, type: 'annotate', label: "Knowledge Crystal" } 
    ],
    narration: "How do we measure \"closeness\" in a mind? In a social network, you are \"close\" to someone if you message them often, even if they live on the other side of the planet. But in the L-Group framework, we take \"closeness\" literally. We use a Euclidean Metric. Interaction strength decays with physical distance. This means that if two concepts need to be associated—if \"Fire\" implies \"Hot\"—the particles representing those concepts must literally, physically move closer together. This is a radical shift. In traditional AI, \"learning\" means changing a value in a matrix. It’s an abstract, invisible mathematical operation. Here, learning is Motion. It is a kinetic process. To learn a new pattern, the network must reshape itself. It must morph. It creates a physical geometry that mirrors the logical structure of the data. If you were to look at the shape of the network after training, you would see a physical map of the knowledge it possesses. The topology of the mind takes the shape of the problem it is solving. To understand the data, the network becomes the data."
};