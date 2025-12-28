import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step21: LessonStep = {
    title: "21. Simulated Annealing",
    content: null,
    subsections: [
        { at: 0, title: "Optimization", content: <p>Using thermal noise to escape local minima.</p> },
        { at: 40, title: "Langevin Dynamics", content: <div className="space-y-4">
            <p>We introduce a stochastic term (Noise) to the update rule, transforming it into a <strong>Langevin Equation</strong>:</p>
            <MathBlock>{'dp = -\\nabla V dt - \\gamma p dt + \\sqrt{2\\gamma k_B T} dW'}</MathBlock>
            <p>Here, <span className="font-math">T</span> represents Temperature. High <span className="font-math">T</span> gives particles enough kinetic energy to "jump" over energy barriers and escape suboptimal solutions. As the system cools (<span className="font-math">T \to 0</span>), it settles into the global minimum. This is <strong>Simulated Annealing</strong>—using chaos to find order.</p>
        </div>}
    ],
    config: p({ temperature: 5.0 }), setup: 'annealing', symbols: [],
    script: [ { at: 10, type: 'shake', targetId: 'all', duration: 30 }, { at: 60, type: 'reset' }, { at: 70, type: 'annotate', label: "Settling" } ],
    narration: "Watch the energy dance on the screen. As particles rush into a deep valley of error, they pick up speed. They gain Kinetic Energy. They might even overshoot the bottom of the valley and roll up the other side before settling back down. This oscillation is not a bug; it is a vital feature. It represents a Temperature. This kinetic energy allows the system to escape local minima—those shallow little dips in the landscape that represent suboptimal solutions, \"good enough\" answers that aren't the \"best\" answer. A standard gradient descent algorithm acts like a zombie—it just walks downhill until it gets stuck in a pothole. Our particles act like skateboarders—they have momentum. They can use their speed to roll right out of those shallow traps and keep searching for the true global minimum. It is a physical implementation of Simulated Annealing. We are using the chaos of motion to find the stillness of truth."
};