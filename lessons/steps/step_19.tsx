import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step19: LessonStep = {
    title: "19. Superposition",
    content: null,
    subsections: [
        { at: 0, title: "Calculus", content: <p>Instant matrix algebra via the physics of wave addition.</p> },
        { at: 40, title: "Analog Computing", content: <div className="space-y-4">
            <p>Digital computers sum numbers sequentially (Serial Von Neumann Bottleneck). Physics sums waves instantly. By exploiting the <strong>Linearity of the Wave Equation</strong>:</p>
            <MathBlock>{'\\psi_{total} = \\sum_{i} c_i \\psi_i'}</MathBlock>
            <p>Our network performs massive vector addition and matrix multiplication "for free" as a natural consequence of field interference. This is <strong>Analog Computing</strong>: trading the absolute precision of digital bits for the infinite parallel bandwidth of physical fields.</p>
        </div>}
    ],
    config: p({ phaseEnabled: true }), setup: 'superposition', symbols: [],
    script: [ 
        { at: 30, type: 'force', targetId: 'all', vector: {x: 3, y: 0}, label: "Wave A" }, 
        { at: 35, type: 'force', targetId: 'all', vector: {x: 0, y: 3}, label: "Wave B" }, 
        { at: 70, type: 'annotate', label: "Instant Sum" } 
    ],
    narration: "Nature does not do binary arithmetic. Nature does not \"carry the one.\" Nature performs mathematics by Superposition. In our prediction equation, the predicted state is simply the summation of weighted inputs. In a digital computer, summing a thousand numbers is a sequential, costly operation—step 1, step 2, step 3. In physics, it is the default state. When a thousand waves hit a beach, they sum up instantly. They don't wait for a CPU cycle. The central node in our network calculates the weighted sum of all its inputs simply by settling into the equilibrium point of the forces acting upon it. This is Analog Computing. It happens in constant time, with infinite precision, limited only by thermal noise. We are harnessing the linearity of wave mechanics to perform massive matrix algebra for free. We are getting the universe to do our homework for us, instantly, just by letting nature take its course."
};