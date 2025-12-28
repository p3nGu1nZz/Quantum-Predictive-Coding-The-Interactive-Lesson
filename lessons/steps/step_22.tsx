import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step22: LessonStep = {
    title: "22. Rotational Invariance",
    content: null,
    subsections: [
        { at: 0, title: "Symmetry", content: <p>Object recognition regardless of orientation.</p> },
        { at: 40, title: "Group Equivariance", content: <div className="space-y-4">
            <p>Our interaction potential depends only on distance <span className="font-math">{'||\\mathbf{r}_i - \\mathbf{r}_j||'}</span>, not absolute coordinates. This makes the system invariant to the <strong>Special Orthogonal Group SO(3)</strong> (rotations).</p>
            <MathBlock>{'V(R \\cdot \\mathbf{r}) = V(\\mathbf{r})'}</MathBlock>
            <p>This property, known as <strong>Equivariance</strong>, means that if the input rotates, the entire internal representation rotates with it without distortion. The "meaning" of the pattern is preserved across the transformation group. The system understands the object, not just the pixels.</p>
        </div>}
    ],
    config: p({ k: 0.2 }), setup: 'invariance', symbols: [],
    script: [ 
        { at: 1, type: 'reset' }, 
        { at: 30, type: 'highlight', targetId: 'all', label: "Invariance" }, 
        { at: 60, type: 'rotate', targetId: 'all', duration: 30, label: "Rotation" }, 
        { at: 85, type: 'annotate', label: "Equivariance" } 
    ],
    narration: "The universe loves symmetry, and so does our network. Our framework is grounded in Representation Theory. We model particles as objects that respect the symmetries of the Lorentz group—the same symmetries that govern relativity and spacetime. Practically, for our simulation, this implies Rotational Invariance. Because our interaction potential depends only on distance between particles, and not their absolute coordinates on the grid, the logic holds true no matter how you twist it. A triangle is a triangle, whether it points up, down, or sideways. If you rotate the input pattern by 90 degrees, the internal constellation of forces rotates with it, perfectly preserving the relationships between the parts. This grants the system Equivariance. It understands the object itself, not just the pixels on the screen. It knows that a cat is still a cat, even if it is upside down or spinning in zero gravity."
};