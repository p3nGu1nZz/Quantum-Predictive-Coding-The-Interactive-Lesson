import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step15: LessonStep = {
    title: "15. Free Energy Principle",
    content: null,
    subsections: [
        { at: 0, title: "Minimizing Surprise", content: <p>The biological imperative is to align internal models with external reality. To exist is to predict.</p> },
        { at: 40, title: "Thermodynamics of Mind", content: <div className="space-y-4">
            <p>Karl Friston's <strong>Free Energy Principle</strong> posits that all self-organizing systems minimize a bound on surprise (entropy). We translate this into a potential energy function:</p>
            <MathBlock>{'F = \\underbrace{-\\ln p(\\mathbf{y} | m)}_{Accuracy} + \\underbrace{D_{KL}[q(\\psi) || p(\\psi)]}_{Complexity}'}</MathBlock>
            <p>In our simulation, <InlineMath math="F \propto \text{Potential Energy}" />. The system is not merely "calculating" probabilities; it is physically flowing down a thermodynamic gradient towards the state of maximum likelihood. It consumes energy to create order.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'error_landscape', symbols: [],
    script: [ { at: 20, type: 'force', targetId: 'all', vector: {x:0, y:2} }, { at: 60, type: 'annotate', label: "Minimizing" } ],
    narration: "We return now to the philosophical core of our engine: The Free Energy Principle. In this context, \"Free Energy\" is just a physicist's fancy word for \"Surprise.\" The variable epsilon in our equations measures the raw difference between what the particle expected to happen and what actually happened. The biological imperative of this entire system—and Karl Friston would argue, the imperative of all life—is to minimize this quantity. Living things want to stay alive, and to stay alive, you need to be able to predict your environment. We want to make the world boring. We want to make it predictable. Computationally, the force acting on a particle is directly proportional to how surprised it is. High surprise generates high force. High force generates rapid movement and drastic reconfiguration. Low surprise generates low force, leading to stability and contentment. You are looking at an engine of prediction that consumes energy to reduce the entropy of its sensory inputs. It is constantly striving, shifting, and dancing to prove its own internal models correct."
};