import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step22: LessonStep = {
    title: "22. Rotational Invariance",
    content: null,
    subsections: [
        { at: 0, title: "Symmetry", content: <p>The universe loves symmetry, and so does our network. Our framework is grounded in <strong>Representation Theory</strong>.</p> },
        { at: 30, title: "Relative Space", content: <div className="space-y-4">
            <p>We model particles as objects that respect the symmetries of the Lorentz group—the same symmetries that govern relativity and spacetime. Practically, for our simulation, this implies <strong>Rotational Invariance</strong>.</p>
            <p>Because our interaction potential depends only on distance between particles, and not their absolute coordinates on the grid, the logic holds true no matter how you twist it.</p>
        </div>},
        { at: 60, title: "Equivariance", content: <div className="space-y-4">
            <p>A triangle is a triangle, whether it points up, down, or sideways. If you rotate the input pattern by 90 degrees, the internal constellation of forces rotates with it, perfectly preserving the relationships between the parts.</p>
            <p>This grants the system <strong>Equivariance</strong>. It understands the object itself, not just the pixels on the screen.</p>
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