import React from 'react';
import { PHYSICS } from '../../constants';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step00_Intro: LessonStep = {
    title: "Course Overview",
    content: null,
    subsections: [
        { at: 0, title: "Abstract", content: <p className="text-xl leading-relaxed">Welcome to the L-Group Predictive Coding simulation. In this course, we dismantle the static architectures of traditional AI to reveal the fluid dynamics of the <strong>Liquid Mind</strong>.</p> },
        { at: 35, title: "Phase 1: Physics", content: <div className="space-y-4">
             <p><strong>The Physics of Cognition</strong></p>
             <p>We begin by treating intelligence not as code, but as a thermodynamic process driven by forces, particles, and energy minimization.</p>
        </div>},
        { at: 55, title: "Phase 2: Geometry", content: <div className="space-y-4">
             <p><strong>The Geometry of Logic</strong></p>
             <p>We explore how complex computation, memory, and logic gates emerge naturally from the topology of the potential energy landscape.</p>
        </div>},
        { at: 75, title: "Phase 3: Dynamics", content: <div className="space-y-4">
             <p><strong>The Dynamics of Consciousness</strong></p>
             <p>Finally, we witness how synchronization, reciprocity, and self-organization give rise to a cohesive, intelligent agent.</p>
        </div>}
    ],
    config: p({ k: 0.05, couplingEnabled: true }), 
    setup: 'mean_field', 
    symbols: [],
    script: [ 
        { at: 1, type: 'reset' },
        { at: 35, type: 'force', targetId: 'all', vector: {x: 2, y: 2}, label: "Physics" }, 
        { at: 55, type: 'shake', targetId: 'all', duration: 10, label: "Geometry" }, 
        { at: 75, type: 'pulse', targetId: 'all', label: "Consciousness" },
        { at: 90, type: 'highlight', targetId: 'center', label: "Begin" }
    ],
    narration: "Welcome to the L-Group Predictive Coding simulation. Over the next thirty-two modules, we will dismantle the static architectures of traditional AI and replace them with the fluid dynamics of the Liquid Mind. Our curriculum moves through three distinct phases. First, The Physics of Cognition, where we treat learning as a thermodynamic process. Second, The Geometry of Logic, where topology becomes computation. And finally, The Dynamics of Consciousness, where synchronization and reciprocity create a self-organizing self. Prepare to unlearn the grid. Welcome to the Physics of Thought."
};