import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step12: LessonStep = {
    title: "12. Gradient Descent",
    content: null,
    subsections: [
        { at: 0, title: "Gravity for Data", content: <p>In classical machine learning, Gradient Descent is an iterative optimization algorithm. In the L-Group framework, it is a physical law: <strong>Gravity</strong> acting on high-dimensional data.</p> },
        { at: 40, title: "Kinetic Optimization", content: <div className="space-y-4">
            <p>We derive the motion of every particle from the potential energy field of the error landscape. The force vector <InlineMath math="\\mathbf{F}_i" /> is the negative gradient of the loss <InlineMath math="\\mathcal{L}" />:</p>
            <MathBlock>{'\\mathbf{F}_i = -\\nabla_{\\mathbf{r}_i} \\mathcal{L} \\quad \\Rightarrow \\quad \\mathbf{a}_i \\propto \\text{Slope}'}</MathBlock>
            <p>This transforms an abstract calculus operation into a kinetic simulation. Particles "roll" down the error surface, accelerating where the gradient is steep (high error) and naturally braking as the terrain flattens (convergence). It is a self-regulating optimizer driven by the geometry of the problem itself.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'error_landscape', symbols: [],
    script: [ 
        { at: 30, type: 'force', targetId: 'all', vector: {x:0, y:8}, label: "Gravity" }, 
        { at: 60, type: 'highlight', targetId: 'all', label: "Acceleration" }, 
        { at: 90, type: 'annotate', label: "Convergence" } 
    ],
    narration: "You are watching a physical manifestation of the most famous algorithm in machine learning: Gradient Descent. In a normal computer, this is a dry calculus operation performed in the dark recesses of a GPU. It calculates the slope of a curve and updates a number. But here? Here, it is Gravity. The spatial update rule dictates that a particle's velocity is proportional to the slope of the error landscape. If a particle is in a state of high error, it \"feels\" a steep slope beneath its feet. It accelerates. It rushes down the gradient, picking up speed. As the error decreases, the slope flattens out, and the particle naturally slows down. This \"Gravity for Data\" does something remarkable: it localizes the learning rule. A particle doesn't need to know what the billion other particles are doing; it just needs to feel the slope under its own feet. It acts locally to achieve a global goal. This makes the system biologically plausible—neurons in your brain don't have access to a global master plan; they just respond to the chemical gradients in their immediate vicinity. And yet, from this local gravity, global intelligence emerges."
};