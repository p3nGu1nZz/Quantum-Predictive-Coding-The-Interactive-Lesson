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
        { at: 30, title: "The Paradigm Shift", content: <div className="space-y-4">
             <p>Traditional Neural Networks are architecturally static; they rely on fixed adjacency matrices and frozen weights. This study presents a paradigm shift: the <strong>L-Group Framework</strong>.</p>
             <p>Here, computation is not a path through a circuit, but a trajectory through a high-dimensional Lie group manifold.</p>
        </div>},
        { at: 60, title: "Particle Physics", content: <div className="space-y-4">
             <p>By integrating Predictive Coding Networks (PCNs) with a particle-based vibrational encoding mechanism, we model neurons not as addresses in memory, but as physical entities with mass, momentum, and spin.</p>
             <MathBlock title="Particle State Vector">{'\\psi_i = \\{ \\mathbf{r}_i, x_i, \\phi_i, s_i \\} \\in \\mathcal{H}'}</MathBlock>
        </div>},
        { at: 85, title: "Fluid Intelligence", content: <div className="space-y-4">
            <p>These particles self-organize according to the laws of statistical mechanics, finding solutions to inference problems by settling into thermodynamic equilibrium.</p>
            <p>This formulation allows us to treat intelligence as a fluid dynamic process, where "learning" is indistinguishable from physical motion in a continuous symmetry group.</p>
        </div>}
    ],
    config: p({ couplingEnabled: true, k: 0.05 }), setup: 'grid', symbols: [],
    script: [ 
        // Initial state: Panel Top Left
        { at: 0, type: 'panel', panel: { x: 5, y: 5, w: '30vw', opacity: 1 } },
        
        { at: 10, type: 'highlight', targetId: 'all', label: "Rigid Structure" }, 
        
        // Narration talks about "Nature" and "Murmuration" - Video plays
        // Move panel to Bottom Right to reveal video content
        { at: 28, type: 'panel', panel: { x: 65, y: 60, w: '30vw', opacity: 0.9 } },
        
        { at: 35, type: 'shake', targetId: 'all', duration: 20, label: "Nature's Motion" }, 
        
        // "We step into the L-Group" - Reset panel to Center Left but smaller
        { at: 58, type: 'panel', panel: { x: 5, y: 25, w: '25vw', opacity: 1 } },
        { at: 60, type: 'reset' }, 
        
        { at: 70, type: 'spawn', targetId: 'all', label: "Liquid Mind" },
        
        // "Physics-based intelligence" - Expand panel for MathBlock visibility
        { at: 80, type: 'panel', panel: { x: 5, y: 5, w: '40vw', opacity: 1 } }
    ],
    videoScript: [
        { 
            at: 0, 
            id: 'step01_clip01',
            prompt: "A cinematic shot of a futuristic city skyline made of rigid, glowing blue grid lines, representing traditional AI architecture. The camera pans slowly." 
        },
        { 
            at: 30, 
            id: 'step01_clip02',
            prompt: "A murmuration of starlings in a twilight sky, moving fluidly and organically, representing dynamic intelligence. Cinematic lighting." 
        },
        { 
            at: 60, 
            id: 'step01_clip03',
            prompt: "Abstract visualization of glowing particles floating in a dark, high-dimensional mathematical fluid, connected by thin strands of light. Sci-fi style." 
        }
    ],
    narration: "Imagine, if you will, the architecture of a thought. For seventy years, we have built artificial intelligence like skyscrapers: rigid foundations, fixed beams of weight matrices, and concrete layers of static logic. We call them Neural Networks, but they are statues—frozen monuments to their training data. They do not flow. They do not breathe. But look at nature. Look at the murmuration of starlings turning in the twilight sky, or the firing of neurons in your own brain. There is no rigid grid. There is only fluid, dynamic motion. Today, we step into the L-Group Predictive Coding Network. We are replacing the \"skyscraper\" model with the \"liquid\" model. In this framework, we don't wire neurons together; we release them. We treat them as independent particles floating in a high-dimensional mathematical fluid, held together not by addresses, but by forces. We are moving from architecture-based intelligence to physics-based intelligence. You are about to witness a mind that is not built, but grown. Welcome to the Liquid Mind."
};