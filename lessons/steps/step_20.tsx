import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step20: LessonStep = {
    title: "20. Feedforward Inhibition",
    content: null,
    subsections: [
        { at: 0, title: "Control", content: <p>A brain without inhibition is a seizure. We implement safety vetos via negative feedback.</p> },
        { at: 40, title: "Nonlinear Shunting", content: <div className="space-y-4">
            <p>We implement a "Veto" via <strong>Shunting Inhibition</strong>. Unlike subtractive inhibition, this acts as a divisor on the signal:</p>
            <MathBlock>{'\\frac{dx}{dt} = (E_{ex} - x) - g_{inh} (x - E_{inh})'}</MathBlock>
            <p>Where <InlineMath math="g_{inh}" /> is the inhibitory conductance. If <InlineMath math="g_{inh}" /> is high, the output <InlineMath math="x" /> is clamped to zero regardless of the excitatory input. This nonlinear "division" allows for gain control and rapid shutdown of runaway processes.</p>
        </div>}
    ],
    config: p({ spinEnabled: true }), setup: 'inhibition', symbols: [],
    script: [ { at: 20, type: 'force', targetId: 0, vector: {x: 5, y: 0} }, { at: 50, type: 'highlight', targetId: 20, label: "BLOCK" } ],
    narration: "Every robust system needs a braking mechanism. A car needs brakes; a nuclear reactor needs control rods; a brain needs inhibition. We demonstrate this with a Feedforward Inhibition circuit. Imagine an excitatory signal—a \"Go\" command—rushing down a pathway. Simultaneously, a parallel pathway activates a cluster of Spin Down particles—our \"Inhibitory\" units. These particles exert a repulsive force on the main signal path. Mathematically, this acts like division or a shunt. It effectively short-circuits the actuator, clamping the output to zero regardless of how strong the input \"Go\" signal is. This is a Veto. It is a crucial architectural component for safety. It proves that mechanically, the power to stop is stronger than the power to go. It allows the system to focus, to select one action and suppress all others, and to shut down dangerous runaway feedback loops before they spiral out of control."
};